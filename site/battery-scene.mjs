import {CELL,ROUTES,pointAlongPolyline,graphiteGeometry,graphiteIonPath,inventoryFills} from './battery-model.mjs';
const COLORS={lithium:0x80f3d0,electron:0xc5a0ff,carbon:0x526b8e,negative:0x7da6f8,positive:0xa786ef};
const smooth=t=>t*t*(3-2*t);
export class BatteryScene{
  constructor(canvas,labelLayer,onPart,options={}){
    const T=window.THREE;if(!T)throw new Error('The 3D library could not load.');this.T=T;this.canvas=canvas;this.labelLayer=labelLayer;this.onPart=onPart||(()=>{});this.options=options;this.phase=.25;
    this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.outputEncoding=T.sRGBEncoding;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.95;
    this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(40,1,.02,100);this.raycaster=new T.Raycaster();this.pointer=new T.Vector2();
    this.scene.add(new T.HemisphereLight(0xc5d7ff,0x12162a,.55));
    const key=new T.DirectionalLight(0xd7e4ff,1.25);key.position.set(-2,8,8);this.scene.add(key);
    const rim=new T.DirectionalLight(0x8d65ff,.9);rim.position.set(2,3,-6);this.scene.add(rim);
    const glow=new T.PointLight(0x9afde4,.24,20);glow.position.set(-4,1,4);this.scene.add(glow);
    this.cell=new T.Group();this.scene.add(this.cell);this.fadeMaterials=[];this.pickMeshes=[];this.labels=[];this.zoom=0;this.targetZoom=0;this.rotation={x:0,y:0};this.targetRotation={x:0,y:0};this.dragging=false;this.dirty=true;
    this.makeCell();this.makeGraphite();if(options.labels!==false)this.makeLabels();
    new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);this.resize();
    if(options.interactive===false)return;
    this.canvas.addEventListener('pointerdown',e=>{this.dragging=true;this.dragStart={x:e.clientX,y:e.clientY,rx:this.targetRotation.x,ry:this.targetRotation.y};this.dragDistance=0;canvas.setPointerCapture(e.pointerId);});
    this.canvas.addEventListener('pointermove',e=>{
      if(this.dragging){const dx=e.clientX-this.dragStart.x,dy=e.clientY-this.dragStart.y;this.dragDistance=Math.hypot(dx,dy);this.targetRotation.x=Math.max(-1.25,Math.min(1.25,this.dragStart.rx-dx*.004));this.targetRotation.y=Math.max(-.32,Math.min(.32,this.dragStart.ry+dy*.003));this.dirty=true;}
      else this.pick(e,false);
    });
    this.canvas.addEventListener('pointerup',e=>{this.dragging=false;if(this.dragDistance<6)this.pick(e,true);});
    this.canvas.addEventListener('pointercancel',()=>this.dragging=false);
    this.canvas.addEventListener('pointerleave',()=>{if(!this.dragging)this.onPart(null,false);});
  }
  vector(p){return new this.T.Vector3(...p);}
  material(color,props={}){const settings={color:new this.T.Color(color).convertSRGBToLinear(),roughness:.5,metalness:.16,...props};if(typeof settings.emissive==='number')settings.emissive=new this.T.Color(settings.emissive).convertSRGBToLinear();return new this.T.MeshStandardMaterial(settings);}
  addBox(parent,size,position,material,part){const m=new this.T.Mesh(new this.T.BoxGeometry(...size),material);m.position.set(...position);parent.add(m);if(part){m.userData.part=part;this.pickMeshes.push(m);}return m;}
  line(points,color,radius=.017,parent=this.cell){
    const T=this.T;const curve=new T.CurvePath();for(let i=1;i<points.length;i++)curve.add(new T.LineCurve3(this.vector(points[i-1]),this.vector(points[i])));
    const m=new T.Mesh(new T.TubeGeometry(curve,Math.max(16,points.length*12),radius,8,false),this.material(color,{emissive:color,emissiveIntensity:.22}));parent.add(m);return m;
  }
  edges(size,position,color,parent=this.cell){const T=this.T;const m=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(...size)),new T.LineBasicMaterial({color,transparent:true,opacity:.5}));m.position.set(...position);parent.add(m);return m;}
  makeCell(){
    const T=this.T;
    // Slab cutaway: electronically conducting hosts outside a shared ionic region.
    const negMat=this.material(0x1d3358,{transparent:true,opacity:.12,depthWrite:false});
    const posMat=this.material(0x52396f,{transparent:true,opacity:.3,depthWrite:false});
    this.addBox(this.cell,[2.4,3,3],[-3.25,0,0],negMat,'negative');this.edges([2.4,3,3],[-3.25,0,0],COLORS.negative);
    this.addBox(this.cell,[2.4,3,3],[3.25,0,0],posMat,'positive');this.edges([2.4,3,3],[3.25,0,0],COLORS.positive);
    const collectorN=this.material(0xa98063,{metalness:.82,roughness:.21});const collectorP=this.material(0xc2cbdd,{metalness:.9,roughness:.18});
    this.addBox(this.cell,[.1,3.25,3.2],[-4.5,0,0],collectorN,'negative');this.addBox(this.cell,[.1,3.25,3.2],[4.5,0,0],collectorP,'positive');
    const grainGeo=new T.IcosahedronGeometry(.39,1),grainMat=this.material(0x7960aa,{metalness:.4,roughness:.37});
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(let k=0;k<3;k++){const m=new T.Mesh(grainGeo,grainMat);m.position.set(2.48+i*.74,-.93+j*.92,-.94+k*.93);m.rotation.set(i*.7,j*.3,k*.5);m.userData.part='positive';this.pickMeshes.push(m);this.cell.add(m);}
    this.addBox(this.cell,[4.1,3,3],[0,0,0],this.material(0x264e65,{transparent:true,opacity:.055,depthWrite:false}),'electrolyte');
    this.edges([4.1,3,3],[0,0,0],0x427579);
    const sep=this.addBox(this.cell,[.075,3.15,3.1],[0,0,0],this.material(0xb5c7d3,{transparent:true,opacity:.15,depthWrite:false,side:T.DoubleSide}),'separator');
    for(let y=-1.45;y<=1.5;y+=.3)this.line([[0,y,-1.5],[0,y,1.5]],0x8197b7,.009);
    for(let z=-1.4;z<=1.5;z+=.3)this.line([[0,-1.55,z],[0,1.55,z]],0x8197b7,.009);
    this.wire=this.line(ROUTES.cell.electrons,0x7688ac,.035);this.wire.userData.part='circuit';this.pickMeshes.push(this.wire);
    this.device=new T.Group();this.device.position.set(0,2.8,0);this.cell.add(this.device);
    this.deviceBody=this.addBox(this.device,[1.4,.6,.64],[0,0,0],this.material(0x181e31,{metalness:.55}),'load');this.edges([1.4,.6,.64],[0,0,0],0xa898d3,this.device);
    this.deviceBand=this.addBox(this.device,[.8,.06,.025],[0,.01,.335],this.material(0x91e9d1,{emissive:0x91e9d1,emissiveIntensity:.65}));
    this.sourcePlus=this.addBox(this.device,[.045,.24,.028],[.43,.02,.34],this.material(0xe2d6ff));this.sourcePlus.visible=false;
    this.sourceBar=this.addBox(this.device,[.21,.045,.029],[.43,.02,.34],this.material(0xe2d6ff));this.sourceBar.visible=false;
    const sphere=new T.SphereGeometry(.075,16,12);
    this.ionMarkers=Array.from({length:9},()=>{const m=new T.Mesh(sphere,this.material(COLORS.lithium,{emissive:COLORS.lithium,emissiveIntensity:.55}));this.cell.add(m);return m;});
    this.electronMarkers=Array.from({length:9},()=>{const m=new T.Mesh(new T.SphereGeometry(.058,14,10),this.material(COLORS.electron,{emissive:COLORS.electron,emissiveIntensity:.7}));this.cell.add(m);return m;});
    this.inventoryPositive=[];for(let i=0;i<20;i++){
      const m=new T.Mesh(new T.SphereGeometry(.075,14,10),this.material(COLORS.lithium,{emissive:COLORS.lithium,emissiveIntensity:.38,transparent:true}));m.position.set(2.3+(i%4)*.55,-1.16+Math.floor(i/4)*.57,1.54);this.cell.add(m);this.inventoryPositive.push(m);
    }
    // Save opacity once so camera transitions do not compound the fade.
    const seen=new Set();this.cell.traverse(m=>{if(m.material&&!seen.has(m.material)){seen.add(m.material);const mat=m.material;this.fadeMaterials.push({mat,opacity:mat.opacity});mat.transparent=true;}});
  }
  makeGraphite(){
    const T=this.T,g=graphiteGeometry();this.graphiteData=g;this.graphite=new T.Group();this.graphite.position.set(...CELL.graphiteOrigin);this.graphite.scale.setScalar(CELL.graphiteScale);this.scene.add(this.graphite);
    const carbon=new T.InstancedMesh(new T.SphereGeometry(.092,12,8),this.material(COLORS.carbon,{roughness:.4,metalness:.5}),g.atoms.length*g.layerY.length);
    const bonds=new T.InstancedMesh(new T.CylinderGeometry(.027,.027,1,7),this.material(0x425e86,{roughness:.4,metalness:.5}),g.bonds.length*g.layerY.length);
    const dummy=new T.Object3D(),up=new T.Vector3(0,1,0);let ai=0,bi=0;
    for(const y of g.layerY){
      for(const atom of g.atoms){dummy.position.set(atom[0],y,atom[2]);dummy.scale.set(1,1,1);dummy.quaternion.identity();dummy.updateMatrix();carbon.setMatrixAt(ai++,dummy.matrix);}
      for(const [a,b] of g.bonds){const p=this.vector([g.atoms[a][0],y,g.atoms[a][2]]),q=this.vector([g.atoms[b][0],y,g.atoms[b][2]]),delta=q.clone().sub(p);dummy.position.copy(p.add(q).multiplyScalar(.5));dummy.scale.set(1,delta.length(),1);dummy.quaternion.setFromUnitVectors(up,delta.normalize());dummy.updateMatrix();bonds.setMatrixAt(bi++,dummy.matrix);}
    }
    carbon.userData.part='carbon';bonds.userData.part='carbon';this.pickMeshes.push(carbon,bonds);this.graphite.add(carbon,bonds);
    this.lithiumSites=g.sites.map(site=>{const m=new T.Mesh(new T.SphereGeometry(.145,16,12),this.material(COLORS.lithium,{emissive:COLORS.lithium,emissiveIntensity:.38,transparent:true}));m.position.set(...site);m.userData.part='lithium';this.graphite.add(m);this.pickMeshes.push(m);return m;});
    const site=g.sites.find(s=>Math.abs(s[0])<.01&&Math.abs(s[2])<.01&&s[1]<0)||g.sites[0];
    this.galleryPath=graphiteIonPath(site);this.galleryMarker=new T.Mesh(new T.SphereGeometry(.2,20,14),this.material(COLORS.lithium,{emissive:COLORS.lithium,emissiveIntensity:.8}));this.graphite.add(this.galleryMarker);
    this.galleryGuide=this.line(this.galleryPath,0x67b59f,.009,this.graphite);this.galleryGuide.material.transparent=true;this.galleryGuide.material.opacity=.5;
    this.galleryMarker.visible=false;this.galleryGuide.visible=false;
  }
  makeLabels(){
    const entries=[
      ['negative','Graphite','Anode · negative −',[-3.5,-1.9,1.45],'cell'],
      ['positive','Cobalt oxide','Cathode · positive +',[3.6,-1.9,1.45],'cell'],
      ['separator','Separator','',[-.1,1.6,1.15],'cell'],
      ['load','Load','Energy delivered',[0,3.4,0],'cell'],
      ['carbon','Carbon sheets','Hexagonal networks',[-4,.9,.4],'inside'],
      ['gallery','Interlayer gallery','Space for lithium',[-3.3,-.12,1.0],'inside'],
      ['edge','Exposed edge','Entry / exit',[-1.8,-.25,0],'inside']
    ];
    for(const [key,title,sub,point,view]of entries){const el=document.createElement('button');el.className=`scene-label label-${key}`;el.type='button';el.innerHTML=`<span>${title}</span><small>${sub}</small>`;el.dataset.part=key;el.setAttribute('aria-pressed','false');
      el.addEventListener('pointerenter',()=>this.onPart(key,false));el.addEventListener('pointerleave',()=>this.onPart(null,false));el.addEventListener('focus',()=>this.onPart(key,false));el.addEventListener('blur',()=>this.onPart(null,false));el.addEventListener('click',()=>this.onPart(key,true));this.labelLayer.append(el);this.labels.push({key,el,point:this.vector(point),view});
    }
  }
  resize(){const r=this.canvas.parentElement.getBoundingClientRect();this.width=r.width;this.height=r.height;this.renderer.setSize(r.width,r.height,false);this.camera.aspect=r.width/r.height;this.camera.updateProjectionMatrix();this.dirty=true;this.render();}
  setState(state){
    this.state=state;const phase=this.phase;
    this.ionMarkers.forEach((m,i)=>{const f=((phase+i/3)%1+1)%1;const p=pointAlongPolyline(ROUTES.cell.ions,f);m.position.set(p[0],[-.85,0,.85][i%3],[-.85,0,.85][Math.floor(i/3)]);m.visible=true;});
    this.electronMarkers.forEach((m,i)=>{const f=((phase+i/9)%1+1)%1;m.position.set(...pointAlongPolyline(ROUTES.cell.electrons,f));m.visible=true;});
    inventoryFills(state.positive).forEach((fill,i)=>this.inventoryPositive[i].material.opacity=fill);
    inventoryFills(state.negative,this.lithiumSites.length).forEach((fill,i)=>{this.lithiumSites[i].material.opacity=fill;this.lithiumSites[i].visible=fill>0;});
    // The highlighted marker explains direction. It is not an additional inventory atom.
    const f=((phase%1)+1)%1;this.galleryMarker.position.set(...pointAlongPolyline(this.galleryPath,1-f));
    this.galleryMarker.visible=this.zoom>.65;this.galleryGuide.visible=this.zoom>.65;
    this.sourcePlus.visible=this.sourceBar.visible=state.mode==='charge';
    this.deviceBand.scale.x=state.mode==='charge'?.28:1;this.deviceBand.position.x=state.mode==='charge'?-.43:0;this.deviceBand.material.color.setHex(state.mode==='charge'?COLORS.electron:COLORS.lithium).convertSRGBToLinear();this.deviceBand.material.emissive.copy(this.deviceBand.material.color);
    if(this.labelMode!==state.mode){
      const device=this.labels.find(l=>l.key==='load');if(device){device.el.querySelector('span').textContent=state.mode==='charge'?'Charging source':'Load';device.el.querySelector('small').textContent=state.mode==='charge'?'Energy supplied':'Energy delivered';}
      for(const [key,material,polarity,sign] of [['negative','Graphite','negative','−'],['positive','Cobalt oxide','positive','+']]){
        const label=this.labels.find(l=>l.key===key);if(!label)continue;
        const role=state.oxidation===key?'Anode':'Cathode',reaction=state.oxidation===key?'oxidation':'reduction';
        label.el.querySelector('small').innerHTML=`${role} · <span class="polarity-word">${polarity} </span>${sign}`;
        label.el.setAttribute('aria-label',`${material}, ${polarity} electrode: ${role.toLowerCase()}, ${reaction} during ${state.mode}. Select for explanation.`);
      }
      this.labelMode=state.mode;
    }
    this.dirty=true;
  }
  setFlow(phase){this.phase=phase;if(this.state)this.setState(this.state);}
  setView(inside,reduced){this.targetZoom=inside?1:0;this.targetRotation={x:0,y:0};if(reduced){this.zoom=this.targetZoom;this.rotation={x:0,y:0};}this.dirty=true;}
  resetCamera(reduced=false){this.targetRotation={x:0,y:0};if(reduced)this.rotation={x:0,y:0};this.dirty=true;}
  select(part){this.labels.forEach(l=>l.el.setAttribute('aria-pressed',String(l.key===part)));}
  pick(event,pin){
    const r=this.canvas.getBoundingClientRect();this.pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);this.raycaster.setFromCamera(this.pointer,this.camera);
    const hits=this.raycaster.intersectObjects(this.pickMeshes,false).filter(hit=>hit.object.visible&&(this.zoom<.5?!['carbon','lithium'].includes(hit.object.userData.part):['carbon','lithium'].includes(hit.object.userData.part)));
    this.onPart(hits[0]?.object.userData.part||null,pin);
  }
  render(dt=16){
    const delta=this.targetZoom-this.zoom;if(Math.abs(delta)>.0005){this.zoom+=delta*Math.min(1,dt/145);this.dirty=true;}else this.zoom=this.targetZoom;
    for(const axis of ['x','y']){const d=this.targetRotation[axis]-this.rotation[axis];if(Math.abs(d)>.0001){this.rotation[axis]+=d*Math.min(1,dt/80);this.dirty=true;}else this.rotation[axis]=this.targetRotation[axis];}
    if(!this.dirty)return;this.dirty=false;const z=smooth(this.zoom),T=this.T;
    const aspect=this.camera.aspect,mobile=aspect<1.25,dist=Math.max(1,1.15/aspect);
    const base=this.vector([6.4*dist,4.6*dist,9.5*dist]),near=this.vector([CELL.graphiteOrigin[0]+(mobile?2.65:2.15),mobile?1.6:1.3,mobile?3.65:3.05]);
    const target=this.vector([0,.45,0]).lerp(this.vector(CELL.graphiteOrigin),z);
    this.camera.position.copy(base.lerp(near,z));
    const offset=this.camera.position.clone().sub(target);offset.applyAxisAngle(new T.Vector3(0,1,0),this.rotation.x);offset.y+=this.rotation.y*offset.length();this.camera.position.copy(target).add(offset);this.camera.lookAt(target);this.camera.updateMatrixWorld();
    const fade=1-smooth(Math.min(1,z*1.6));this.fadeMaterials.forEach(({mat,opacity})=>mat.opacity=opacity*fade);this.cell.visible=fade>.001;
    if(this.state)inventoryFills(this.state.positive).forEach((fill,i)=>this.inventoryPositive[i].material.opacity=fill*fade);
    this.galleryGuide.visible=z>.7;this.galleryMarker.visible=z>.7;
    this.labels.forEach(label=>{const visible=label.view==='cell'?z<.25:z>.85;label.el.hidden=!visible;if(!visible)return;
      const p=label.point.clone().project(this.camera),x=(p.x*.5+.5)*this.width,y=(-p.y*.5+.5)*this.height;
      const half=Math.min(mobile?62:80,label.el.offsetWidth/2||70);label.el.style.left=`${Math.max(half+5,Math.min(this.width-half-5,x))}px`;label.el.style.top=`${Math.max(18,Math.min(this.height-48,y))}px`;
    });
    this.renderer.render(this.scene,this.camera);
  }
}
