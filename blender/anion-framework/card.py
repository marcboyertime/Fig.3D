# Homepage card for "Why some crystals let lithium fly" (Wang et al. 2015).
# The bcc sulfur lattice with its tetrahedral-site network drawn as a lit web, and one lithium ion streaking through
# it hop by hop: the picture is the paper's point, a percolating network of identical sites.
# Run: python3.11 blender/anion-framework/card.py out.png [samples]   (pip install bpy; Cycles on CPU)
import sys, math, itertools, collections
import bpy
from mathutils import Vector

OUT = sys.argv[1] if len(sys.argv) > 1 else 'card.png'
SAMPLES = int(sys.argv[2]) if len(sys.argv) > 2 else 96
A = 40.0 ** (1 / 3) * 2 ** (1 / 3)          # bcc cell edge at 40 Å³ per sulfur (2 S per cell): 4.309 Å
N = (3, 3, 2)                                # cells along a, b, c

# ---- lattice -------------------------------------------------------------------------------------------------
sulfur = set()
for i, j, k in itertools.product(range(N[0] + 1), range(N[1] + 1), range(N[2] + 1)):
    sulfur.add((i, j, k))
    if i < N[0] and j < N[1] and k < N[2]:
        sulfur.add((i + .5, j + .5, k + .5))
# Tetrahedral sites: four on each cube face, at (0, 1/2, 1/4) and its equivalents.
tsites = set()
quarter = [(.5, .25), (.5, .75), (.25, .5), (.75, .5)]
for i, j, k in itertools.product(range(N[0] + 1), range(N[1] + 1), range(N[2] + 1)):
    for u, v in quarter:
        for p in ((i, j + u, k + v), (i + u, j, k + v), (i + u, j + v, k)):
            if all(0 <= p[d] <= N[d] for d in range(3)):
                tsites.add(tuple(round(x, 3) for x in p))
T = [Vector(p) * A for p in sorted(tsites)]
S = [Vector(p) * A for p in sorted(sulfur)]
dTT = A * math.sqrt(2) / 4                   # face-sharing T–T distance, 1.52 Å
links = [(i, j) for i, j in itertools.combinations(range(len(T)), 2) if abs((T[i] - T[j]).length - dTT) < .05]

# A long route through the network: the farthest pair by hops, found with BFS from one corner site.
adj = collections.defaultdict(list)
for i, j in links:
    adj[i].append(j); adj[j].append(i)
def bfs(src):
    prev = {src: None}; q = collections.deque([src])
    while q:
        n = q.popleft()
        for m in adj[n]:
            if m not in prev:
                prev[m] = n; q.append(m)
    return prev
CENTRE = Vector((N[0] * A / 2, N[1] * A / 2, N[2] * A / 2))
VIEW = Vector((-0.52, -0.78, 0.36)).normalized()          # from the block towards the camera
RIGHT = VIEW.cross(Vector((0, 0, 1))).normalized() * -1; UP = RIGHT.cross(VIEW) * -1
near = lambda n: (T[n] - CENTRE).dot(VIEW)
front = [n for n in range(len(T)) if near(n) > 2.0]
start = min(front, key=lambda n: (T[n] - CENTRE).dot(RIGHT) * 1.0 - (T[n] - CENTRE).dot(UP) * 0.6)
prev = bfs(start)
end = max(front, key=lambda n: (T[n] - CENTRE).dot(RIGHT) - (T[n] - CENTRE).dot(UP) * 0.3)
route = []
n = end
while n is not None:
    route.append(n); n = prev[n]
route.reverse()

# ---- scene ---------------------------------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = True
sc.render.resolution_x, sc.render.resolution_y = 1200, 900
import os; sc.render.resolution_percentage = int(os.environ.get('PCT', 100))
sc.render.film_transparent = False
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
world = bpy.data.worlds.new('w'); sc.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs[0].default_value = (0.006, 0.008, 0.018, 1); bg.inputs[1].default_value = 1

def material(name, base, rough=.35, emit=None, strength=0.0, alpha=1.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*base, 1); b.inputs['Roughness'].default_value = rough
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = strength
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    return m

m_s = material('sulfur', (0.85, 0.66, 0.16), rough=.42)
m_t = material('tsite', (0.08, 0.55, 0.32), rough=.3, emit=(0.05, 0.9, 0.45), strength=0.6)
m_link = material('link', (0.05, 0.4, 0.26), rough=.45, emit=(0.05, 0.85, 0.45), strength=0.45)
m_route = material('route', (0.1, 0.85, 0.4), rough=.3, emit=(0.05, 1.0, 0.35), strength=1.0)

_meshes = {}
def _template(kind, seg):
    key = (kind, seg)
    if key not in _meshes:
        if kind == 'sphere':
            bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=seg, ring_count=seg // 2)
        else:
            bpy.ops.mesh.primitive_cylinder_add(radius=1, depth=1, vertices=seg)
        o = bpy.context.object; bpy.ops.object.shade_smooth(); _meshes[key] = o.data; bpy.data.objects.remove(o)
    return _meshes[key]
# Linked duplicates of one mesh per shape: thousands of objects without thousands of meshes.
def place(kind, seg, mat, loc, scale, rot=None):
    o = bpy.data.objects.new(kind, _template(kind, seg)); o.location = loc; o.scale = scale
    o.material_slots and None
    o.active_material = None
    if rot is not None:
        o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = rot
    o.data.materials.clear() if False else None
    sc.collection.objects.link(o); o.material_slots  # ensure slots
    if not o.data.materials:
        o.data.materials.append(None)
    o.material_slots[0].link = 'OBJECT'; o.material_slots[0].material = mat
    return o
def sphere(p, r, mat, seg=48):
    return place('sphere', seg, mat, p, (r, r, r))
def rod(a, b, r, mat):
    d = b - a
    return place('rod', 12, mat, (a + b) / 2, (r, r, d.length), Vector((0, 0, 1)).rotation_difference(d))

# Blender is z-up: crystal c goes to z.
for p in S: sphere(p, 0.5, m_s)
for p in T: sphere(p, 0.11, m_t, seg=16)
on_route = {tuple(sorted(e)) for e in zip(route, route[1:])}
for i, j in links:
    if tuple(sorted((i, j))) not in on_route:
        rod(T[i], T[j], 0.022, m_link)
for i, j in zip(route, route[1:]):
    rod(T[i], T[j], 0.04, m_route)

# The lithium ion two-thirds along the route, with a fading comet of earlier positions behind it.
pts = [T[n] for n in route]
lens = [0] + list(itertools.accumulate((b - a).length for a, b in zip(pts, pts[1:])))
def along(s):
    s = max(0, min(lens[-1], s))
    for k in range(len(pts) - 1):
        if lens[k + 1] >= s:
            u = (s - lens[k]) / max(1e-6, lens[k + 1] - lens[k]); return pts[k].lerp(pts[k + 1], u)
    return pts[-1]
head = lens[-1] * 0.66
li = sphere(along(head), 0.4, material('li', (0.2, 0.9, 0.45), rough=.18, emit=(0.1, 1.0, 0.4), strength=1.1))
# The trail: one tube along the last stretch of the route, tapering to nothing behind the ion.
cu = bpy.data.curves.new('trail', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.26; cu.bevel_resolution = 6
sp = cu.splines.new('POLY'); K = 40; sp.points.add(K - 1)
for k in range(K):
    u = k / (K - 1); q = along(head - 5.5 * (1 - u))
    sp.points[k].co = (q.x, q.y, q.z, 1); sp.points[k].radius = u ** 1.4
trail = bpy.data.objects.new('trail', cu); sc.collection.objects.link(trail)
trail.data.materials.append(material('trailm', (0.1, 0.85, 0.4), rough=.3, emit=(0.05, 1.0, 0.35), strength=0.9))

# ---- light and camera ----------------------------------------------------------------------------------------
centre = sum(S, Vector()) / len(S)
def light(kind, loc, energy, color, size=4):
    d = bpy.data.lights.new(kind + str(loc), kind); d.energy = energy; d.color = color
    if kind == 'AREA': d.size = size
    o = bpy.data.objects.new(d.name, d); o.location = loc; sc.collection.objects.link(o)
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = (centre - Vector(loc)).to_track_quat('-Z', 'Y'); return o
light('AREA', centre + Vector((-14, -18, 22)), 9000, (1.0, 0.93, 0.82), 14)
light('AREA', centre + Vector((20, 6, 4)), 2600, (0.55, 0.65, 1.0), 10)
light('AREA', centre + Vector((4, 22, -6)), 1200, (0.4, 1.0, 0.7), 8)

cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 45
cam = bpy.data.objects.new('cam', cam_d); sc.collection.objects.link(cam); sc.camera = cam
focus = li.location.copy()
cam.location = CENTRE + VIEW * 26
cam.rotation_mode = 'QUATERNION'; cam.rotation_quaternion = (CENTRE - cam.location).to_track_quat('-Z', 'Y')
cam_d.dof.use_dof = True; cam_d.dof.focus_distance = (focus - cam.location).length; cam_d.dof.aperture_fstop = 1.8

sc.render.filepath = OUT
bpy.ops.render.render(write_still=True)
print('T sites', len(T), 'links', len(links), 'route hops', len(route) - 1, '→', OUT)
