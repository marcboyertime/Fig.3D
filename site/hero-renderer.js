// Crisp WebGL rendering of the geometric model. Coordinate/state logic lives in hop-model.mjs.
export function createHopRenderer(canvas){
 const T=window.THREE;if(!T)throw new Error('Scientific renderer unavailable');
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.9;
 const scene=new T.Scene(),camera=new T.OrthographicCamera(-2,2,2,-2,.1,30);camera.position.set(0,0,10);
 scene.add(new T.HemisphereLight(0xc5d9ff,0x101226,.42));
 for(const [color,intensity,pos] of [[0xffffff,1.7,[-3,5,7]],[0x97b9ff,.5,[4,1,3]],[0xdbd1ff,.85,[1,-3,-4]]]){const light=new T.DirectionalLight(color,intensity);light.position.set(...pos);scene.add(light);}
 const sphere=new T.SphereGeometry(1,48,32),atoms=[],lines=[],faces=[];let ai=0,li=0,fi=0,w=1,h=1,scale=1;
 const world=p=>new T.Vector3((p.x-w*.5)/scale,(h*.5-p.y)/scale,p.z||0);
 function begin(width,height,unit){if(w!==width||h!==height){renderer.setSize(width,height,false);w=width;h=height;}scale=unit;camera.left=-w/(2*scale);camera.right=w/(2*scale);camera.top=h/(2*scale);camera.bottom=-h/(2*scale);camera.updateProjectionMatrix();[...atoms,...lines,...faces].forEach(x=>x.visible=false);ai=li=fi=0;}
 function ball(p,r,color,opacity=1,wire=false){if(opacity<=.001)return;let item=atoms[ai++];if(!item){item=new T.Group();const material=new T.MeshPhysicalMaterial({color,metalness:.16,roughness:.46,clearcoat:.12,clearcoatRoughness:.25,transparent:true});const mesh=new T.Mesh(sphere,material);item.add(mesh);
 const ringGroup=new T.Group();for(let n=0;n<3;n++){const points=Array.from({length:65},(_,i)=>{const a=i/64*Math.PI*2;return new T.Vector3(Math.cos(a),Math.sin(a),0)});const ring=new T.Line(new T.BufferGeometry().setFromPoints(points),new T.LineDashedMaterial({color:0x9dabc2,dashSize:.1,gapSize:.065,transparent:true,opacity:.6}));ring.computeLineDistances();if(n===1)ring.rotation.x=Math.PI/2;if(n===2)ring.rotation.y=Math.PI/2;ringGroup.add(ring);}item.add(ringGroup);scene.add(item);atoms.push(item);}
 item.visible=true;item.position.copy(world(p));item.scale.setScalar(r/scale);const mesh=item.children[0],rings=item.children[1];mesh.visible=!wire;rings.visible=wire;
 if(wire){rings.rotation.set(.3,.45,.1);rings.children.forEach(x=>x.material.opacity=opacity*.75);}else{mesh.material.color.set(color).convertSRGBToLinear();mesh.material.opacity=opacity;mesh.material.depthWrite=opacity>.8;}
 }
 function line(points,color,width=1,opacity=1,dash=[]){if(opacity<=.001)return;let item=lines[li++];if(!item){item=new T.Line(new T.BufferGeometry(),new T.LineDashedMaterial({transparent:true}));scene.add(item);lines.push(item);}item.visible=true;item.geometry.dispose();item.geometry=new T.BufferGeometry().setFromPoints(points.map(world));item.material.color.set(color);item.material.opacity=opacity;item.material.dashSize=dash.length?.065:100;item.material.gapSize=dash.length?.045:0;item.material.depthWrite=false;item.computeLineDistances();}
 function triangle(points,opacity,color='#91abd3'){if(opacity<=.001)return;let item=faces[fi++];if(!item){item=new T.Mesh(new T.BufferGeometry(),new T.MeshPhysicalMaterial({color,transparent:true,side:T.DoubleSide,depthWrite:false,roughness:.3,metalness:.05,clearcoat:.7}));scene.add(item);faces.push(item);}item.visible=true;const coords=points.map(world).flatMap(p=>p.toArray());item.geometry.setAttribute('position',new T.Float32BufferAttribute(coords,3));item.geometry.computeVertexNormals();item.material.opacity=opacity;item.material.color.set(color);}
 return {begin,ball,line,triangle,finish(){renderer.render(scene,camera)},dispose(){renderer.dispose()}};
}
