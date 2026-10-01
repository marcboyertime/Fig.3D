"""Blender scene for the Fig.3D diffusion film.

Run with the bpy module (pip install bpy) or Blender itself:
    python3 solve.py field.json
    python3 scene.py field.json frames/ [--size 1080] [--samples 48] [--frames 0:480]

A sphere with one quarter cut away. The two cut faces are coloured by the
solved concentration c(r, t); hairlines mark the 20/40/60/80 % contours.
Lithium ions sit on the cut faces and follow the radial flux: ion i keeps a
fixed rank, and sits where the cumulative amount from the centre reaches that
rank, so ions enter at the surface while lithium goes in and leave there while
it comes out. Frames are rendered with a transparent background; encode.sh
puts them on the page colour.
"""
import json, math, os, sys
import bpy, bmesh
import numpy as np
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
FIELD, OUT = argv[0], argv[1]
opt = {argv[i]: argv[i + 1] for i in range(2, len(argv) - 1, 2)}
SIZE = int(opt.get('--size', 1080))
SAMPLES = int(opt.get('--samples', 48))
data = json.load(open(FIELD))
FR = data['frames']
first, last = (int(v) for v in opt.get('--frames', f'0:{FR}').split(':'))
C = np.array(data['c'])                      # frames x radial samples
XS = np.linspace(0, 1, C.shape[1])
CONT = np.array(data['contours'])            # frames x 4
os.makedirs(OUT, exist_ok=True)

# Palette (sRGB), shared with the page: dark purple empty, blue full.
RAMP = [(0.0, '#1b1440'), (0.35, '#33307e'), (0.7, '#5a6fdc'), (1.0, '#93abff')]
ION = '#e6edff'
HAIR = '#dfe6ff'

def lin(hexstr):
    h = hexstr.lstrip('#')
    out = []
    for i in (0, 2, 4):
        v = int(h[i:i + 2], 16) / 255
        out.append(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4)
    return (*out, 1.0)

# ---------------------------------------------------------------- scene
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.render.use_persistent_data = True
sc.cycles.max_bounces = 6
sc.render.resolution_x = sc.render.resolution_y = SIZE
sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'
sc.render.image_settings.color_mode = 'RGBA'
sc.view_settings.view_transform = 'Standard'
sc.view_settings.look = 'None'
sc.frame_start, sc.frame_end = 0, FR - 1

world = bpy.data.worlds.new('World'); sc.world = world
world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs[0].default_value = lin('#10142a'); bg.inputs[1].default_value = 0.35

# Field textures: concentration (x = r/R, y = frame) and contour radii.
def data_image(name, values):
    """Float image holding raw values in its red channel (rows = frames)."""
    h, w = values.shape
    im = bpy.data.images.new(name, w, h, float_buffer=True, is_data=True)
    im.colorspace_settings.name = 'Non-Color'   # set before pixels: it regenerates the buffer
    px = np.zeros((h, w, 4), np.float32); px[..., :3] = values[..., None]; px[..., 3] = 1
    im.pixels.foreach_set(px.ravel())
    im.pack()
    return im
img = data_image('field', C)
cimg = data_image('contours', np.where(CONT < 0, 9, CONT))

frame_value = None  # Value node per material, driven from Python each frame
frame_nodes = []

def field_material(name, shell):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; N = nt.nodes; L = nt.links
    N.clear()
    out = N.new('ShaderNodeOutputMaterial')
    geo = N.new('ShaderNodeNewGeometry')
    tc = N.new('ShaderNodeTexCoord')
    fval = N.new('ShaderNodeValue'); frame_nodes.append(fval)
    rlen = N.new('ShaderNodeVectorMath'); rlen.operation = 'LENGTH'
    L.new(tc.outputs['Object'], rlen.inputs[0])
    radius = rlen.outputs['Value']
    if shell:
        one = N.new('ShaderNodeValue'); one.outputs[0].default_value = 1.0; radius = one.outputs[0]
    comb = N.new('ShaderNodeCombineXYZ')
    L.new(radius, comb.inputs[0]); L.new(fval.outputs[0], comb.inputs[1])
    tex = N.new('ShaderNodeTexImage'); tex.image = img; tex.interpolation = 'Linear'; tex.extension = 'EXTEND'
    L.new(comb.outputs[0], tex.inputs[0])
    ramp = N.new('ShaderNodeValToRGB')
    els = ramp.color_ramp.elements
    els[0].position, els[0].color = RAMP[0][0], lin(RAMP[0][1])
    els[1].position, els[1].color = RAMP[-1][0], lin(RAMP[-1][1])
    for pos, col in RAMP[1:-1]:
        e = els.new(pos); e.color = lin(col)
    L.new(tex.outputs['Color'], ramp.inputs[0])
    if not shell:
        # Hairline contours: |r - r_level| small, for each of the four levels.
        line = None
        for i in range(4):
            cc = N.new('ShaderNodeCombineXYZ'); cc.inputs[0].default_value = (i + .5) / 4
            L.new(fval.outputs[0], cc.inputs[1])
            ct = N.new('ShaderNodeTexImage'); ct.image = cimg; ct.interpolation = 'Closest'; ct.extension = 'EXTEND'
            L.new(cc.outputs[0], ct.inputs[0])
            sep = N.new('ShaderNodeSeparateColor'); L.new(ct.outputs['Color'], sep.inputs[0])
            d = N.new('ShaderNodeMath'); d.operation = 'SUBTRACT'
            L.new(radius, d.inputs[0]); L.new(sep.outputs[0], d.inputs[1])
            a = N.new('ShaderNodeMath'); a.operation = 'ABSOLUTE'; L.new(d.outputs[0], a.inputs[0])
            s = N.new('ShaderNodeMapRange'); s.inputs['From Min'].default_value = 0.0035; s.inputs['From Max'].default_value = 0.0075
            s.inputs['To Min'].default_value = 1; s.inputs['To Max'].default_value = 0
            L.new(a.outputs[0], s.inputs['Value'])
            if line is None: line = s.outputs['Result']
            else:
                mx = N.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'
                L.new(line, mx.inputs[0]); L.new(s.outputs['Result'], mx.inputs[1]); line = mx.outputs[0]
        k = N.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = 0.55
        L.new(line, k.inputs[0])
        mix = N.new('ShaderNodeMix'); mix.data_type = 'RGBA'
        L.new(k.outputs[0], mix.inputs['Factor']); L.new(ramp.outputs['Color'], mix.inputs['A'])
        mix.inputs['B'].default_value = lin(HAIR)
        em = N.new('ShaderNodeEmission'); em.inputs['Strength'].default_value = 0.86
        L.new(mix.outputs['Result'], em.inputs['Color'])
        bsdf = N.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Roughness'].default_value = 0.45
        L.new(mix.outputs['Result'], bsdf.inputs['Base Color'])
        add = N.new('ShaderNodeMixShader'); add.inputs[0].default_value = 0.18
        L.new(em.outputs[0], add.inputs[1]); L.new(bsdf.outputs[0], add.inputs[2])
        L.new(add.outputs[0], out.inputs['Surface'])
    else:
        # Outer surface: glossy dark body tinted by the surface concentration,
        # a cool fresnel rim, and three faint latitude hairlines.
        # The body glows with the surface concentration, so the boundary
        # switching between full and empty reads at a glance.
        bsdf = N.new('ShaderNodeBsdfPrincipled')
        bsdf.inputs['Base Color'].default_value = lin('#0b0d1c')
        bsdf.inputs['Roughness'].default_value = 0.38
        bsdf.inputs['Specular IOR Level'].default_value = 0.3
        bsdf.inputs['Coat Weight'].default_value = 0.35
        bsdf.inputs['Coat Roughness'].default_value = 0.1
        L.new(ramp.outputs['Color'], bsdf.inputs['Emission Color'])
        bsdf.inputs['Emission Strength'].default_value = 0.5
        fres = N.new('ShaderNodeLayerWeight'); fres.inputs['Blend'].default_value = 0.42
        rim = N.new('ShaderNodeEmission'); rim.inputs['Color'].default_value = lin('#8ea6ff')
        rs = N.new('ShaderNodeMath'); rs.operation = 'POWER'; rs.inputs[1].default_value = 2.2
        L.new(fres.outputs['Facing'], rs.inputs[0])
        rk = N.new('ShaderNodeMath'); rk.operation = 'MULTIPLY'; rk.inputs[1].default_value = 0.4
        L.new(rs.outputs[0], rk.inputs[0]); L.new(rk.outputs[0], rim.inputs['Strength'])
        lat = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Object'], lat.inputs[0])
        line = None
        for zc in (-0.62, 0.0, 0.62):
            d = N.new('ShaderNodeMath'); d.operation = 'SUBTRACT'; d.inputs[1].default_value = zc
            L.new(lat.outputs['Z'], d.inputs[0])
            a = N.new('ShaderNodeMath'); a.operation = 'ABSOLUTE'; L.new(d.outputs[0], a.inputs[0])
            s = N.new('ShaderNodeMapRange'); s.inputs['From Min'].default_value = 0.0018; s.inputs['From Max'].default_value = 0.0042
            s.inputs['To Min'].default_value = .38; s.inputs['To Max'].default_value = 0
            L.new(a.outputs[0], s.inputs['Value'])
            if line is None: line = s.outputs['Result']
            else:
                mx = N.new('ShaderNodeMath'); mx.operation = 'MAXIMUM'
                L.new(line, mx.inputs[0]); L.new(s.outputs['Result'], mx.inputs[1]); line = mx.outputs[0]
        le = N.new('ShaderNodeEmission'); le.inputs['Color'].default_value = lin(HAIR)
        L.new(line, le.inputs['Strength'])
        a1 = N.new('ShaderNodeAddShader'); L.new(bsdf.outputs[0], a1.inputs[0]); L.new(rim.outputs[0], a1.inputs[1])
        a2 = N.new('ShaderNodeAddShader'); L.new(a1.outputs[0], a2.inputs[0]); L.new(le.outputs[0], a2.inputs[1])
        L.new(a2.outputs[0], out.inputs['Surface'])
    return m

def emissive(name, hexcol, strength):
    m = bpy.data.materials.new(name); m.use_nodes = True
    N = m.node_tree.nodes; N.clear()
    out = N.new('ShaderNodeOutputMaterial'); em = N.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = lin(hexcol); em.inputs['Strength'].default_value = strength
    m.node_tree.links.new(em.outputs[0], out.inputs['Surface'])
    return m

def link(obj):
    sc.collection.objects.link(obj); return obj

# The removed quarter is x > 0, y < 0; the camera looks into it.
def in_cut(v, eps=1e-6):
    return v.x > eps and v.y < -eps

me = bpy.data.meshes.new('shell'); bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=192, v_segments=96, radius=1.0)
for no in ((1, 0, 0), (0, 1, 0)):
    geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
    bmesh.ops.bisect_plane(bm, geom=geom, plane_co=(0, 0, 0), plane_no=no)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if in_cut(f.calc_center_median())], context='FACES')
for f in bm.faces: f.smooth = True
bm.to_mesh(me); bm.free()
shell = link(bpy.data.objects.new('shell', me))
shell.data.materials.append(field_material('shell', True))

def half_disk(name, plane):
    """Half disk on the cut plane, exposed side of the removed quarter."""
    me = bpy.data.meshes.new(name); bm = bmesh.new()
    rings, segs = 64, 128
    verts = []
    for i in range(rings + 1):
        rr = i / rings
        row = []
        for j in range(segs + 1):
            ang = -math.pi / 2 + math.pi * j / segs   # from -z to +z
            a, z = rr * math.cos(ang), rr * math.sin(ang)
            co = (0, -a, z) if plane == 'x' else (a, 0, z)
            row.append(bm.verts.new(co))
        verts.append(row)
    for i in range(rings):
        for j in range(segs):
            q = [verts[i][j], verts[i][j + 1], verts[i + 1][j + 1], verts[i + 1][j]]
            if i == 0: q = [verts[0][j], verts[1][j + 1], verts[1][j]]
            try: bm.faces.new(q if plane == 'x' else q[::-1])
            except ValueError: pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bm.normal_update()
    bm.to_mesh(me); bm.free()
    o = link(bpy.data.objects.new(name, me))
    o.data.materials.append(field_material(name, False))
    return o

half_disk('cut_x', 'x'); half_disk('cut_y', 'y')
for o in sc.collection.objects:
    if o.name.startswith('cut'):
        for p in o.data.polygons: p.use_smooth = False

# Hairline edges where the cuts meet the surface, and the shared axis.
def hairline(name, pts, width=0.0042, strength=1.1):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = width; cu.bevel_resolution = 2
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for p, co in zip(sp.points, pts): p.co = (*co, 1)
    o = link(bpy.data.objects.new(name, cu))
    o.data.materials.append(emissive(name, HAIR, strength))
    return o
arc = lambda f: [f(-math.pi / 2 + math.pi * k / 160) for k in range(161)]
hairline('edge_x', arc(lambda t: (0, -math.cos(t) * 1.001, math.sin(t) * 1.001)), strength=.7)
hairline('edge_y', arc(lambda t: (math.cos(t) * 1.001, 0, math.sin(t) * 1.001)), strength=.7)
hairline('axis', [(0.0015, -0.0015, -1.0), (0.0015, -0.0015, 1.0)], width=0.003, strength=.45)

# ---------------------------------------------------------------- ions
PER_PLANE = 210
rng = np.random.default_rng(7)
ions = []   # (plane, rank, angle, phase)
for plane in ('x', 'y'):
    # Poisson-disk layout of the full half disk; rank = s^2 is the share of the
    # half disk inside that ion's radius when the particle is full (c = 1).
    pts = []
    while len(pts) < PER_PLANE:
        s_ = math.sqrt(rng.random()) * 0.975
        a_ = -math.pi / 2 + math.pi * (0.02 + 0.96 * rng.random())
        q = (s_ * math.cos(a_), s_ * math.sin(a_))
        if all((q[0] - o[0]) ** 2 + (q[1] - o[1]) ** 2 > 0.064 ** 2 for o in pts):
            pts.append(q)
    for q in pts:
        s_ = math.hypot(*q)
        ions.append((plane, s_ * s_, math.atan2(q[1], q[0]), rng.random() * 2 * math.pi))
ION_R = 0.0125
ime = bpy.data.meshes.new('ions'); ime.vertices.add(len(ions))
ime.attributes.new('size', 'FLOAT', 'POINT')
ion_obj = link(bpy.data.objects.new('ions', ime))
gn = bpy.data.node_groups.new('ion_instances', 'GeometryNodeTree')
gn.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
gn.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
gi = gn.nodes.new('NodeGroupInput'); go = gn.nodes.new('NodeGroupOutput')
ico = gn.nodes.new('GeometryNodeMeshIcoSphere'); ico.inputs['Radius'].default_value = ION_R; ico.inputs['Subdivisions'].default_value = 3
inst = gn.nodes.new('GeometryNodeInstanceOnPoints')
attr = gn.nodes.new('GeometryNodeInputNamedAttribute'); attr.data_type = 'FLOAT'; attr.inputs['Name'].default_value = 'size'
smat = gn.nodes.new('GeometryNodeSetMaterial')
gn.links.new(gi.outputs[0], inst.inputs['Points']); gn.links.new(ico.outputs['Mesh'], inst.inputs['Instance'])
gn.links.new(attr.outputs['Attribute'], inst.inputs['Scale'])
gn.links.new(inst.outputs[0], smat.inputs['Geometry']); gn.links.new(smat.outputs[0], go.inputs[0])
ion_mat = bpy.data.materials.new('ion'); ion_mat.use_nodes = True
N = ion_mat.node_tree.nodes; bs = N['Principled BSDF']
bs.inputs['Base Color'].default_value = lin(ION); bs.inputs['Roughness'].default_value = 0.25
bs.inputs['Emission Color'].default_value = lin(ION); bs.inputs['Emission Strength'].default_value = 0.55
smat.inputs['Material'].default_value = ion_mat
mod = ion_obj.modifiers.new('ions', 'NODES'); mod.node_group = gn

def ion_layout(frame):
    """Positions and sizes of every ion at a film frame."""
    c = C[frame]
    # In a slice through the centre the ion density per area follows c(r),
    # so the amount within radius s is proportional to the integral of 2 s c.
    integrand = 2 * XS * c
    cum = np.concatenate([[0], np.cumsum((integrand[1:] + integrand[:-1]) / 2 * np.diff(XS))])
    total = cum[-1]
    co = np.zeros((len(ions), 3)); size = np.zeros(len(ions))
    t = 2 * math.pi * frame / FR
    for k, (plane, rank, ang, ph) in enumerate(ions):
        fade = np.clip((total - rank) / 0.02, 0, 1)      # appears at the surface
        target = min(rank, total - 1e-9)
        s = float(np.interp(target, cum, XS)) if total > 1e-6 else 1.0
        s = min(s, 0.985)
        # Small thermal wobble, periodic over the loop so it joins cleanly.
        wob = 0.0065
        s2 = s + wob * math.sin(7 * t + ph) * (s > 0.03)
        a2 = ang + wob * 1.3 * math.cos(11 * t + 1.7 * ph) / max(s, .15)
        a, z = s2 * math.cos(a2), s2 * math.sin(a2)
        lift = ION_R * 0.55
        co[k] = (lift, -a, z) if plane == 'x' else (a, -lift, z)
        size[k] = fade * (fade * fade * (3 - 2 * fade))
    return co, size

# ---------------------------------------------------------------- camera, light
cam_data = bpy.data.cameras.new('cam'); cam_data.lens = 58
cam = link(bpy.data.objects.new('cam', cam_data)); sc.camera = cam
target = link(bpy.data.objects.new('target', None)); target.location = (0, 0, -0.04)
tr = cam.constraints.new('TRACK_TO'); tr.target = target
tr.track_axis = 'TRACK_NEGATIVE_Z'; tr.up_axis = 'UP_Y'
DIST, ELEV = 4.55, math.radians(21)

def place_camera(frame):
    t = 2 * math.pi * frame / FR
    az = math.radians(-45) + math.radians(15) * math.sin(t)
    el = ELEV + math.radians(4) * math.sin(2 * t + 0.6)
    cam.location = (DIST * math.cos(el) * math.cos(az), DIST * math.cos(el) * math.sin(az), DIST * math.sin(el))

def area(name, loc, energy, color, size):
    l = bpy.data.lights.new(name, 'AREA'); l.energy = energy; l.color = lin(color)[:3]; l.size = size
    o = link(bpy.data.objects.new(name, l)); o.location = loc
    c = o.constraints.new('TRACK_TO'); c.target = target; c.track_axis = 'TRACK_NEGATIVE_Z'; c.up_axis = 'UP_Y'
area('key', (2.5, -4.5, 5.0), 420, '#e9eeff', 3.5)
area('rim', (-3.5, 3.5, 2.5), 650, '#7e6bff', 3.0)
area('fill', (4.5, 1.0, -1.5), 120, '#6f8dff', 4.0)

# ---------------------------------------------------------------- render
anchors = {'centre': Vector((0, 0, 0)), 'surface': Vector((0, -math.cos(.62), math.sin(.62))),
           'shell': Vector((-0.42, 0.62, 0.66)).normalized()}
proj = []
for f in range(first, last):
    place_camera(f)
    for n in frame_nodes: n.outputs[0].default_value = (f + 0.5) / FR
    co, size = ion_layout(f)
    ime.vertices.foreach_set('co', co.astype(np.float32).ravel())
    ime.attributes['size'].data.foreach_set('value', size.astype(np.float32))
    ime.update()
    sc.frame_set(f)
    bpy.context.view_layer.update()
    proj.append({k: [round(v, 4) for v in world_to_camera_view(sc, cam, p)[:2]] for k, p in anchors.items()})
    if '--anchors-only' in argv: continue
    sc.render.filepath = os.path.join(OUT, f'f{f:04d}.png')
    if '--skip-existing' in argv and os.path.exists(sc.render.filepath): continue
    bpy.ops.render.render(write_still=True)
    print('frame', f, flush=True)
json.dump({'first': first, 'anchors': proj}, open(os.path.join(OUT, f'anchors-{first}-{last}.json'), 'w'))
