"""Blender editorial render from the browser model's exported vertices. Not browser QA."""
import bpy, json, math
from pathlib import Path
from mathutils import Vector, Matrix
root=Path(__file__).resolve().parent
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
s=bpy.context.scene;s.render.engine='CYCLES';s.cycles.samples=40;s.cycles.use_denoising=True
s.render.resolution_x=1200;s.render.resolution_y=900;s.render.resolution_percentage=100
s.world.color=(.06,.07,.10);s.view_settings.view_transform='AgX'
def material(name,color,metal,rough):
 m=bpy.data.materials.new(name);m.diffuse_color=(*color,1);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF');bs.inputs['Base Color'].default_value=(*color,1);bs.inputs['Metallic'].default_value=metal;bs.inputs['Roughness'].default_value=rough;return m
shell=material('Lithiated region',(.28,.14,.065),.48,.30)
core=material('Crystalline silicon',(.095,.18,.33),.38,.30)
cut=material('Section of lithiated region',(.20,.105,.050),.13,.55)
for name,data in json.loads((root/'geometry.json').read_text())['meshes'].items():
 mesh=bpy.data.meshes.new(name);mesh.from_pydata(data['vertices'],[],data['faces']);mesh.update();o=bpy.data.objects.new(name,mesh);bpy.context.collection.objects.link(o);o.data.materials.append(core if name.startswith('core') else cut if 'cut' in name else shell)
 for poly in mesh.polygons:poly.use_smooth='cut' not in name
camdata=bpy.data.cameras.new('Camera');cam=bpy.data.objects.new('Camera',camdata);bpy.context.collection.objects.link(cam);s.camera=cam;cam.location=(17,13,24);cam.rotation_euler=(-cam.location).to_track_quat('-Z','Y').to_euler();camdata.type='ORTHO';camdata.ortho_scale=16
yaw=.70;el=.48;cy=math.cos(yaw);sy=math.sin(yaw);ce=math.cos(el);se=math.sin(el)
cam.location=Vector((sy*ce,se,cy*ce))*40
cam.rotation_euler=Matrix(((cy,-sy*se,sy*ce),(0,ce,se),(-sy,-cy*se,cy*ce))).to_euler()
for name,pos,power,size,color in [('Key',(4,10,7),1800,8,(.82,.90,1)),('Rim',(-5,6,-7),2200,7,(.67,.76,1)),('Softbox',(8,-1,4),1300,6,(1,.76,.49))]:
 d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size;d.color=color;o=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(o);o.location=pos;o.rotation_euler=(-o.location).to_track_quat('-Z','Y').to_euler()
s.render.film_transparent=True;s.render.image_settings.file_format='PNG';s.render.filepath=str(root/'teaser.png')
bpy.ops.wm.save_as_mainfile(filepath=str(root/'silicon-nanowire.blend'));bpy.ops.render.render(write_still=True)
