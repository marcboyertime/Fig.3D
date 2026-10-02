"""Editable Blender 5.x studio reference, built from the browser's exported geometry.
blender -b --factory-startup --python production/nanoparticle/build_blender.py
Each named scene is independently editable. No downloaded model or inferred atoms.
"""
import bpy,json,math
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parent
G=json.loads((ROOT/'geometry-6.json').read_text())
A={a['id']:a for a in G['atoms']}
OUT=ROOT/'renders';OUT.mkdir(exist_ok=True)
def xyz(p):return Vector((p[0],-p[2],p[1]))
def linear(h):
 c=[int(h[i:i+2],16)/255 for i in (0,2,4)]
 return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in c)
def material(name,h,metal=.88,rough=.34):
 m=bpy.data.materials.new(name);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF')
 b.inputs['Base Color'].default_value=(*linear(h),1);b.inputs['Metallic'].default_value=metal;b.inputs['Roughness'].default_value=rough
 return m
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
gold=material('Gold — restrained warm metal','c7994e')
face_mat=material('Selected terrace — silver blue','c4cce0')
neighbor=material('Counted neighbors','759fe5',.7,.35)
selected=material('Selected atom','c2d9ff',.5,.3)
dim=material('Context gold','847352')
violet=material('Adsorption geometry','b9a0e4',.7,.3)
ink=material('Neighbor connectors','91b7ff',.2,.45)
floor=material('Charcoal studio','080a12',.15,.8)
bpy.ops.mesh.primitive_uv_sphere_add(segments=28,ring_count=18,radius=1)
sphere=bpy.context.object.data;sphere.name='Shared atom sphere';bpy.data.objects.remove(bpy.context.object,do_unlink=True)
for p in sphere.polygons:p.use_smooth=True
# Materials are object-linked, keeping a single sphere mesh for every atom.
for m in [gold,face_mat,neighbor,selected,dim,violet,ink]:sphere.materials.append(m)
preferences=bpy.context.preferences.addons['cycles'].preferences
try:
 preferences.compute_device_type='METAL';preferences.get_devices()
 for d in preferences.devices:d.use=d.type=='METAL'
except Exception:pass

def obj(scene,name,mesh,mat,p,scale):
 o=bpy.data.objects.new(name,mesh);scene.collection.objects.link(o);o.location=xyz(p);o.scale=(scale,)*3
 o.material_slots[0].link='OBJECT';o.material_slots[0].material=mat;return o

def line(scene,a,b,mat,r=.025):
 curve=bpy.data.curves.new('Proximity line','CURVE');curve.dimensions='3D';curve.bevel_depth=r;curve.bevel_resolution=3
 sp=curve.splines.new('POLY');sp.points.add(1)
 for q,p in zip(sp.points,[a,b]):q.co=(*xyz(p),1)
 o=bpy.data.objects.new('Counted proximity — not a covalent bond',curve);scene.collection.objects.link(o);curve.materials.append(mat)

def camera_pose(scene,target,direction,half):
 d=Vector(direction).normalized();cam=bpy.data.cameras.new('Inspection camera');o=bpy.data.objects.new('Inspection camera',cam);scene.collection.objects.link(o);o.location=xyz(Vector(target)+70*d);o.rotation_euler=(xyz(target)-o.location).to_track_quat('-Z','Y').to_euler();cam.type='ORTHO';cam.ortho_scale=half*2*1200/900;scene.camera=o

def make(name,mode,target,direction,half):
 s=bpy.data.scenes.new(name);s.render.engine='CYCLES';s.cycles.samples=32;s.cycles.use_denoising=True;s.cycles.device='GPU';s.cycles.max_bounces=6
 s.render.resolution_x=1200;s.render.resolution_y=900;s.render.resolution_percentage=100;s.render.image_settings.file_format='PNG'
 s.view_settings.view_transform='AgX';s.view_settings.look='AgX - Medium High Contrast';s.world=bpy.data.worlds.new(name+' world');s.world.use_nodes=True;s.world.node_tree.nodes['Background'].inputs[0].default_value=(*linear('263047'),1);s.world.node_tree.nodes['Background'].inputs[1].default_value=.35
 selected_id=G['representatives']['edge'];ns=set(A[selected_id]['neighbors']);face=next(f for f in G['facets'] if f['id']=='100:1,0,0');site=G['sites']['111:1,1,1']['hcp']
 for a in G['atoms']:
  mat=gold
  if mode=='face' and a['id'] in face['atomIds']:mat=face_mat
  if mode=='neighbors':mat=selected if a['id']==selected_id else neighbor if a['id'] in ns else dim
  if mode=='binding' and a['id'] in site['atomIds']:mat=violet
  o=obj(s,'Au '+a['id'],sphere,mat,a['p'],.53 if a['id']==selected_id and mode=='neighbors' else .46 if mode=='neighbors' and a['id'] in ns else .59);o['coordinate_a_over_2']=a['p'];o['coordination']=a['cn'];o['neighbors']=','.join(a['neighbors'])
 if mode=='neighbors':
  for id in ns:line(s,A[selected_id]['p'],A[id]['p'],ink)
 if mode=='binding':
  p=[x+1.52*n for x,n in zip(site['p'],site['normal'])]
  for id in site['atomIds']:line(s,p,A[id]['p'],violet)
  # Diamond marker: geometrical position, deliberately not a molecular sphere.
  verts=[(1,0,0),(-1,0,0),(0,1,0),(0,-1,0),(0,0,1),(0,0,-1)];faces=[(0,2,4),(2,1,4),(1,3,4),(3,0,4),(2,0,5),(1,2,5),(3,1,5),(0,3,5)]
  mesh=bpy.data.meshes.new('Geometric probe');mesh.from_pydata(verts,[],faces);mesh.materials.append(violet);obj(s,'Position marker, not an adsorbate',mesh,violet,p,.22)
 camera_pose(s,target,direction,half)
 for label,p,power,size,color in [('Key',[6,14,10],2400,10,'fff0d8'),('Fill',[-10,4,8],1800,9,'c5d7ff'),('Rim',[6,6,-12],2500,8,'c8b8ff')]:
  light=bpy.data.lights.new(label,'AREA');light.energy=power;light.shape='DISK';light.size=size;light.color=linear(color);o=bpy.data.objects.new(label,light);s.collection.objects.link(o);o.location=xyz(p);o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
 s['source_geometry']='geometry-6.json';s['units']='a/2 = 2.04 Å; display spheres symbolic';s['purpose']='Lighting/composition reference; browser scene remains live 3D.'
 return s
poses=[('opening','opening',[0,0,0],[.716,.417,.557],10.56),('face','face',[2.7,0,0],[1.16,.24,.18],7.32),('neighbors','neighbors',[5.28,2.64,2.64],[.94,.56,.56],4.1),('binding','binding',[3.6,3.6,3.6],[.737,.817,.757],4.6)]
scenes=[make(*p) for p in poses]
# Remove factory scene after cameras and assets are established.
for s in list(bpy.data.scenes):
 if s not in scenes:bpy.data.scenes.remove(s)
bpy.context.window.scene=scenes[0]
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'inside-a-nanoparticle.blend'))
for s in scenes:
 bpy.context.window.scene=s;s.render.filepath=str(OUT/(s.name+'.png'));bpy.ops.render.render(write_still=True)
print('Built editable reference scenes and four renders from the verified geometry.')
