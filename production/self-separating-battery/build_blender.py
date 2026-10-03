"""Editable reference studio using the exact browser meshes.
Blender 5.2: blender -b --factory-startup --python production/self-separating-battery/build_blender.py
"""
import bpy,struct,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent;ASSETS=ROOT.parents[1]/'site/assets/self-separating-battery';OUT=ROOT/'renders';OUT.mkdir(exist_ok=True)
def xyz(p):return (p[0],-p[2],p[1])
def linear(h):
    c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c)
def mat(name,h,metal=.2,rough=.4):
    m=bpy.data.materials.new(name);m.use_nodes=True;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*linear(h),1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough;return m
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
materials={'carbon':mat('Carbon scaffold','343f51',.38,.43),'cathode':mat('PAQEDOT cathode','416ce2',.22,.34),'sei':mat('Separating SEI','e9c78b',.15,.45)}
meshes={}
for name in materials:
    b=(ASSETS/(name+'.bin')).read_bytes();nv,nf=struct.unpack_from('<II',b);v=struct.unpack_from('<'+str(nv*3)+'f',b,8);ind=struct.unpack_from('<'+str(nf*3)+'I',b,8+nv*24)
    mesh=bpy.data.meshes.new(name+' verified geometry');mesh.from_pydata([xyz(v[i:i+3]) for i in range(0,len(v),3)],[],[ind[i:i+3] for i in range(0,len(ind),3)]);mesh.materials.append(materials[name]);mesh.update()
    # Preserve flat cut faces; smooth only the pore-wall isosurfaces.
    for p in mesh.polygons:
        verts=[mesh.vertices[i].co for i in p.vertices];flat=any(all(abs(abs(v[a])-3)<1e-4 for v in verts) for a in range(3));p.use_smooth=not flat
    meshes[name]=mesh
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
    prefs.compute_device_type='METAL';prefs.get_devices()
    for d in prefs.devices:d.use=d.type=='METAL'
except Exception:pass
for title,names in [('architecture',['carbon','sei','cathode']),('carbon',['carbon'])]:
    s=bpy.data.scenes.new(title);s.render.engine='CYCLES';s.cycles.samples=40;s.cycles.device='GPU';s.cycles.use_denoising=True;s.cycles.max_bounces=8;s.render.resolution_x=1200;s.render.resolution_y=900;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG';s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast'
    s.world=bpy.data.worlds.new(title+' world');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(*linear('52627e'),1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.25
    for name in names:
        o=bpy.data.objects.new(name,meshes[name]);s.collection.objects.link(o)
    for name,p,power,size,h in [('Key',[1,8,6],1000,7,'edf2ff'),('Fill',[-6,2,4],700,6,'c0d2ff'),('Rim',[3,5,-6],1200,5,'e3dbff')]:
        l=bpy.data.lights.new(name,'AREA');l.energy=power;l.shape='DISK';l.size=size;l.color=linear(h);o=bpy.data.objects.new(name,l);s.collection.objects.link(o);o.location=xyz(p);o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
    c=bpy.data.cameras.new('Inspection camera');o=bpy.data.objects.new('Inspection camera',c);s.collection.objects.link(o);o.location=xyz([13,8,16]);o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler();c.type='ORTHO';c.ortho_scale=11.8;s.camera=o
    s['purpose']='Lighting reference built from the same illustrative geometry as the live explorer; not a reconstructed sample.';s['source']='Tait et al. arXiv:2604.26222v1, Figures 1c and 2.'
    bpy.context.window.scene=s;s.render.filepath=str(OUT/(title+'.png'))
    bpy.ops.render.render(write_still=True)
for s in list(bpy.data.scenes):
    if s.name not in ['architecture','carbon']:bpy.data.scenes.remove(s)
bpy.context.window.scene=bpy.data.scenes['architecture'];bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'interwoven-battery.blend'))
