// The three sulfur lattices, and two real crystals, in three dimensions. One state drives everything; displayed values
// ease toward it, so lattices cross-fade, the lattice breathes with the volume and the camera travels instead of jumping.
// Camera: a perspective camera at the distance fitted to the paper's own Figure 2a render (VESTA draws in perspective;
// production/anion-framework/registration), oriented by a quaternion so the reader can turn the crystal freely.
import {clamp,ease,lerp,pathGeometry,positionAt,waypointS,scaleFor,ROUTES,LATTICES} from './anion-framework-model.mjs';
const T=window.THREE;
const lin=hex=>new T.Color(hex).convertSRGBToLinear();
// Colours follow the paper: S yellow, Li green, LiS₄ green and LiS₆ red (Fig. 2), the hcp T–T lithium blue (Fig. 2c),
// PS₄ purple and GeS₄ blue, the matched bcc lattice red (Fig. 1).
export const PALETTE={sulfur:'#e9cf3c',li:'#4cc96f',liDeep:'#2f9b53',tet:'#58c77a',oct:'#ef6a5e',tt:'#5b8fe0',ps4:'#a98bd6',ges4:'#6f74c9',bcc:'#ff5a4e',door:'#f4fff7',site:'#d8e6ff'};
const R_S=.42,R_LI=.3,R_SITE=.17,R_IMG=.24;
const approach=(v,t,dt,rate)=>Math.abs(t-v)<1e-4?t:v+(t-v)*(1-Math.exp(-dt*rate));
const V=a=>new T.Vector3(a[0],a[1],a[2]);
const KEYS=['bcc','fcc','hcp','lgps','li2s','network','cells','morph','sulfurOnly','bccLines','bccSites','step3','scale','TT','TOT','OO'];

export class FrameworkScene{
 constructor(canvas,data,callbacks={}){
  this.canvas=canvas;this.data=data;this.cb=callbacks;this.width=1;this.height=1;this.animators=new Set();this.active=true;this.raf=0;this.last=0;this.dirty=true;
  this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',preserveDrawingBuffer:true});
  this.renderer.outputEncoding=T.sRGBEncoding;this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=.95;
  this.renderer.setClearColor(0x000000,0);
  this.scene=new T.Scene();this.camera=new T.PerspectiveCamera(20,1,.5,400);
  const q=data.paperView.quaternion_crystal_to_camera;this.paperQuat=new T.Quaternion(q[0],q[1],q[2],q[3]).invert();
  this.paperDist=data.paperView.camera_distance_A;
  this.pose={quat:this.paperQuat.clone(),target:new T.Vector3(),halfHeight:4.4,dist:this.paperDist};this.home=this.pose;
  this.view=Object.fromEntries(KEYS.map(k=>[k,0]));this.view.bcc=1;this.view.TT=1;this.view.scale=1;this.view.progress=0;this.target={...this.view};
  this.lighting();this.build();
  new ResizeObserver(()=>this.resize()).observe(canvas.parentElement);
  this.observer=new IntersectionObserver(e=>{this.active=e[0].isIntersecting;if(this.active)this.wake();else this.stop();});this.observer.observe(canvas);
  document.addEventListener('visibilitychange',()=>{this.last=0;if(document.hidden)this.stop();else this.wake();});
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.stop();this.cb.failure?.();});
  this.install();this.resize();
 }
 lighting(){
  this.scene.add(new T.HemisphereLight(0xe8eeff,0x141826,.55));
  this.key=new T.DirectionalLight(0xffffff,1.2);this.scene.add(this.key);this.scene.add(this.key.target);
  this.rim=new T.DirectionalLight(0xbfd0ff,.5);this.scene.add(this.rim);
  const studio=new T.Scene();studio.background=new T.Color(0x161a24);
  for(const [pos,w,h,c,k] of [[[0,9,4],8,14,0xffffff,1.4],[[8,1,-5],4,12,0xffeedd,.9],[[-7,3,6],5,10,0xc6d2ff,.9]]){const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));m.material.color.multiplyScalar(k);m.position.set(...pos);m.lookAt(0,0,0);studio.add(m);}
  const pm=new T.PMREMGenerator(this.renderer);this.env=pm.fromScene(studio,.04);this.scene.environment=this.env.texture;pm.dispose();studio.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
 }
 // Lights ride with the camera so the crystal is lit the same way from every side the reader turns to.
 placeLights(){const q=this.pose.quat,t=this.pose.target;this.key.position.copy(t).add(new T.Vector3(4,6,9).applyQuaternion(q));this.key.target.position.copy(t);this.rim.position.copy(t).add(new T.Vector3(-6,-2,-8).applyQuaternion(q));}
 mat(c,o={}){return new T.MeshStandardMaterial({color:lin(c),roughness:.4,metalness:0,envMapIntensity:.6,transparent:true,...o});}
 faceMat(c,o){return new T.MeshStandardMaterial({color:lin(c),transparent:true,opacity:o,roughness:.6,metalness:0,side:T.DoubleSide,depthWrite:false,envMapIntensity:.3});}
 lineMat(c,o,extra={}){return new T.LineBasicMaterial({color:lin(c),transparent:true,opacity:o,depthWrite:false,...extra});}
 // A polyhedron from its sulfur indices and triangular faces, as the paper draws them: translucent, edged.
 poly(S,faces,face,edge){
  const g=new T.Group(),pos=[];for(const f of faces)for(const i of f)pos.push(...S[i]);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();
  const set=new Set(),ep=[];for(const f of faces)for(let k=0;k<3;k++){const a=f[k],b=f[(k+1)%3],key=a<b?a+'-'+b:b+'-'+a;if(set.has(key))continue;set.add(key);ep.push(...S[a],...S[b]);}
  const eg=new T.BufferGeometry();eg.setAttribute('position',new T.Float32BufferAttribute(ep,3));
  const m=new T.Mesh(geo,face),e=new T.LineSegments(eg,edge);m.renderOrder=1;e.renderOrder=2;g.add(m,e);return g;
 }
 spheres(list,r,m){const g=new T.InstancedMesh(this.sphere,m,Math.max(1,list.length));g.userData={list,r};this.placeSpheres(g,1);return g;}
 placeSpheres(g,scale,positions){const {list,r}=g.userData,M=new T.Matrix4(),Q=new T.Quaternion(),Sc=new T.Vector3(r,r,r);(positions||list).forEach((p,i)=>{M.compose(new T.Vector3(p[0]*scale,p[1]*scale,p[2]*scale),Q,Sc);g.setMatrixAt(i,M);});g.count=list.length;g.instanceMatrix.needsUpdate=true;}
 build(){
  const d=this.data;this.sphere=new T.SphereGeometry(1,36,22);this.root=new T.Group();this.scene.add(this.root);
  this.L={};
  for(const name of LATTICES){
   const lat=d.lattices[name],G={group:new T.Group(),scaled:new T.Group(),lat};this.root.add(G.group);G.group.add(G.scaled);
   // Sulfur: every anion of the display block. Those around the path read strongly; the rest stay as faint context.
   const pathVerts=new Set();for(const r of ROUTES[name])for(const i of lat.paths[r].sites)for(const v of lat.sites[i].verts)pathVerts.add(v);G.pathVerts=pathVerts;
   // Context sulfur within reach of the path stays in the hop view; the rest of the block appears only with the network.
   const mid=[0,1,2].map(k=>{const P=ROUTES[name].flatMap(r=>lat.paths[r].points);return P.reduce((a,p)=>a+p[k],0)/P.length;});
   const reach=name==="hcp"?5.2:5.6,far=p=>Math.hypot(p[0]-mid[0],p[1]-mid[1],p[2]-mid[2]);
   G.near=lat.S.filter((p,i)=>pathVerts.has(i));G.far=lat.S.filter((p,i)=>!pathVerts.has(i)&&far(p)<reach);G.outer=lat.S.filter((p,i)=>!pathVerts.has(i)&&far(p)>=reach);
   G.nearMat=this.mat(PALETTE.sulfur,{roughness:.45});G.farMat=this.mat('#a39445',{roughness:.6,envMapIntensity:.35});G.outerMat=this.mat('#a39445',{roughness:.6,envMapIntensity:.35});
   G.nearS=this.spheres(G.near,R_S,G.nearMat);G.farS=this.spheres(G.far,R_S*.66,G.farMat);G.outerS=this.spheres(G.outer,R_S*.66,G.outerMat);G.group.add(G.nearS,G.farS,G.outerS);
   // Per-route parts: the sites' polyhedra, the doorways (shared faces), a line of NEB-image ghosts and the moving lithium.
   G.routes={};
   for(const r of ROUTES[name]){
    const p=lat.paths[r],R={group:new T.Group(),polys:[],doors:[]};G.scaled.add(R.group);
    for(const i of p.sites){const s=lat.sites[i],O=s.kind==='O',fm=this.faceMat(O?PALETTE.oct:PALETTE.tet,O?.2:.2),em=this.lineMat(O?PALETTE.oct:PALETTE.tet,.6);const g=this.poly(lat.S,s.faces,fm,em);g.userData={fm,em,kind:s.kind,base:O?.2:.2};R.group.add(g);R.polys.push(g);}
    for(const f of p.faces){const pos=[];for(const i of f)pos.push(...lat.S[i]);const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));
     const m=new T.MeshBasicMaterial({color:lin(PALETTE.door),transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false,toneMapped:false});const mesh=new T.Mesh(geo,m);mesh.renderOrder=3;
     const loop=new T.LineLoop(new T.BufferGeometry().setFromPoints(f.map(i=>V(lat.S[i]))),this.lineMat(PALETTE.door,0,{toneMapped:false}));loop.renderOrder=3;
     R.group.add(mesh,loop);R.doors.push({mesh,loop,centre:p.points[2*R.doors.length+1]});}
    R.geo=pathGeometry(p.points);R.ws=waypointS(R.geo);
    const liColour=name==='hcp'&&r==='TT'?PALETTE.tt:name==='hcp'&&r==='OO'?'#f08a3c':PALETTE.li;R.colour=liColour;
    R.liMat=this.mat(liColour,{roughness:.3,emissive:lin(liColour),emissiveIntensity:.12});R.li=new T.Mesh(this.sphere,R.liMat);R.li.scale.setScalar(R_LI);R.li.renderOrder=5;G.group.add(R.li);
    R.ghostMat=this.mat(liColour,{roughness:.4,depthWrite:false,opacity:.0});R.n=r==='TOT'?17:9;R.ghosts=new T.InstancedMesh(this.sphere,R.ghostMat,R.n);R.ghosts.renderOrder=4;G.group.add(R.ghosts);
    G.routes[r]=R;
   }
   // The network: every site in the block, and every pair that shares a face.
   const N=new T.Group();G.scaled.add(N);G.net=N;
   const Ts=lat.sites.filter(s=>s.kind==='T').map(s=>s.p),Os=lat.sites.filter(s=>s.kind==='O').map(s=>s.p);
   G.netT=new T.InstancedMesh(this.sphere,new T.MeshBasicMaterial({color:lin(PALETTE.tet),transparent:true,opacity:0,depthWrite:false,toneMapped:false}),Math.max(1,Ts.length));
   G.netO=new T.InstancedMesh(this.sphere,new T.MeshBasicMaterial({color:lin(PALETTE.oct),transparent:true,opacity:0,depthWrite:false,toneMapped:false}),Math.max(1,Os.length));
   const M=new T.Matrix4(),Q=new T.Quaternion();Ts.forEach((p,i)=>G.netT.setMatrixAt(i,M.compose(V(p),Q,new T.Vector3(R_SITE,R_SITE,R_SITE))));Os.forEach((p,i)=>G.netO.setMatrixAt(i,M.compose(V(p),Q,new T.Vector3(R_SITE*1.2,R_SITE*1.2,R_SITE*1.2))));
   G.netT.count=Ts.length;G.netO.count=Os.length;N.add(G.netT,G.netO);
   const linkLines=(kind,colour)=>{const pts=[];for(const l of lat.links)if(l.kind===kind)pts.push(V(lat.sites[l.a].p),V(lat.sites[l.b].p));const m=this.lineMat(colour,0);const seg=new T.LineSegments(new T.BufferGeometry().setFromPoints(pts),m);seg.userData.m=m;N.add(seg);return seg;};
   G.linkTT=linkLines('TT',PALETTE.tet);G.linkTO=linkLines('TO','#e7a49c');G.linkOO=linkLines('OO',PALETTE.oct);
   // Conventional cells as faint dashed edges, the way the paper's renders outline them.
   G.cellMat=new T.LineDashedMaterial({color:lin('#8ea3d6'),transparent:true,opacity:0,dashSize:.18,gapSize:.12,depthWrite:false});
   const edges=cellEdges(name,lat);if(edges.length){const seg=new T.LineSegments(new T.BufferGeometry().setFromPoints(edges.map(V)),G.cellMat);seg.computeLineDistances();G.scaled.add(seg);}
   this.L[name]=G;
  }
  this.buildCrystals();
 }
 buildCrystals(){
  const d=this.data,lg=d.lgps;
  const C={group:new T.Group()};this.root.add(C.group);this.lgps=C;
  C.sMat=this.mat(PALETTE.sulfur,{roughness:.45});C.S=this.spheres(lg.S,R_S*.92,C.sMat);C.group.add(C.S);
  C.liMats=[];C.li=new T.Group();C.group.add(C.li);
  for(const x of lg.li){const m=this.mat(PALETTE.li,{roughness:.35,emissive:lin(PALETTE.liDeep),emissiveIntensity:.15});m.userData={occ:x.occ};const s=new T.Mesh(this.sphere,m);s.scale.setScalar(R_LI*.95);s.position.copy(V(x.p));s.userData={occ:x.occ};C.li.add(s);C.liMats.push(m);}
  C.tetra=new T.Group();C.group.add(C.tetra);C.tetraMats=[];
  for(const t of lg.tetra){const fm=this.faceMat(t.kind==='GeP'?PALETTE.ges4:PALETTE.ps4,.55),em=this.lineMat(t.kind==='GeP'?PALETTE.ges4:PALETTE.ps4,.8);
   const faces=[[0,1,2],[0,1,3],[0,2,3],[1,2,3]];C.tetra.add(this.poly(t.verts,faces,fm,em));C.tetraMats.push([fm,.55],[em,.8]);}
  C.boxMat=this.lineMat('#8ea3d6',0);C.box=new T.LineSegments(new T.BufferGeometry().setFromPoints(lg.cell_edges.flat().map(V)),C.boxMat);C.group.add(C.box);
  C.bccMat=this.lineMat(PALETTE.bcc,0);C.bcc=new T.LineSegments(new T.BufferGeometry().setFromPoints(lg.bcc_edges.flat().map(V)),C.bccMat);C.group.add(C.bcc);
  C.siteMat=new T.MeshBasicMaterial({color:lin('#c8f5d6'),transparent:true,opacity:0,depthWrite:false,toneMapped:false});
  C.sites=new T.InstancedMesh(this.sphere,C.siteMat,lg.bcc_T.length);const M=new T.Matrix4(),Q=new T.Quaternion();lg.bcc_T.forEach((p,i)=>C.sites.setMatrixAt(i,M.compose(V(p),Q,new T.Vector3(R_SITE*.62,R_SITE*.62,R_SITE*.62))));C.group.add(C.sites);
  C.ttMat=this.lineMat('#9fe0b4',0);C.tt=new T.LineSegments(new T.BufferGeometry().setFromPoints(lg.bcc_TT.flatMap(([a,b])=>[V(lg.bcc_T[a]),V(lg.bcc_T[b])])),C.ttMat);C.group.add(C.tt);
  // Li₂S: the exact fcc case. Every tetrahedral site is full; the octahedral sites, the only way between them, are empty.
  const l2=d.li2s,D={group:new T.Group()};this.root.add(D.group);this.li2s=D;
  D.sMat=this.mat(PALETTE.sulfur,{roughness:.45});D.S=this.spheres(l2.S,R_S,D.sMat);D.liMat=this.mat(PALETTE.li,{roughness:.35,emissive:lin(PALETTE.liDeep),emissiveIntensity:.15});D.li=this.spheres(l2.li,R_LI,D.liMat);
  D.oMat=new T.MeshBasicMaterial({color:lin(PALETTE.oct),transparent:true,opacity:0,depthWrite:false,toneMapped:false});D.o=this.spheres(l2.O_empty,R_SITE*1.3,D.oMat);
  const a=l2.cell_A/2,box=[];for(const s of [-1,1])for(const t of [-1,1]){box.push([-a,s*a,t*a],[a,s*a,t*a],[s*a,-a,t*a],[s*a,a,t*a],[s*a,t*a,-a],[s*a,t*a,a]);}
  D.boxMat=this.lineMat(PALETTE.bcc,0);D.box=new T.LineSegments(new T.BufferGeometry().setFromPoints(box.map(V)),D.boxMat);
  const links=[];for(const p of l2.li)for(const o of l2.O_empty){const dd=Math.hypot(p[0]-o[0],p[1]-o[1],p[2]-o[2]);if(dd<l2.cell_A*.44)links.push(V(p),V(o));}
  D.linkMat=this.lineMat('#e7a49c',0);D.links=new T.LineSegments(new T.BufferGeometry().setFromPoints(links),D.linkMat);
  D.group.add(D.S,D.li,D.o,D.box,D.links);
 }
 setState(s){
  this.state=s;const crystals=s.question==='crystals',net=!crystals&&s.question==='hop'&&s.view==='network';
  const t=this.target;for(const k of KEYS)t[k]=0;
  if(crystals){t[s.crystal]=1;t.sulfurOnly=s.step>=1?1:0;t.morph=s.step>=2?1:0;t.bccLines=s.step>=2?1:0;t.bccSites=s.step>=3?1:0;}
  else{t[s.lattice]=1;t[s.route]=1;t.network=net?1:0;t.cells=1;}
  t.scale=s.question==='volume'?scaleFor(s.volume):1;
  t.progress=crystals?0:s.progress;
  if(s.reduced||!this.started){Object.assign(this.view,this.target);this.started=true;}
  this.wake();
 }
 step(dt){
  const v=this.view,t=this.target;let moved=false;
  const p=this.state?.playing||this.scrubbing?t.progress:approach(v.progress,t.progress,dt,9);if(p!==v.progress){v.progress=p;moved=true;}
  for(const k of KEYS){const n=approach(v[k],t[k],dt,k==='scale'?4:k==='morph'?2.2:5.5);if(n!==v[k]){v[k]=n;moved=true;}}
  return moved;
 }
 settled(){return KEYS.every(k=>Math.abs(this.view[k]-this.target[k])<1e-4)&&Math.abs(this.view.progress-this.target.progress)<1e-4;}
 // Where the moving lithium is now, in scene coordinates (for labels).
 liPosition(){const s=this.state;if(!s||s.question==='crystals')return null;const R=this.L[s.lattice].routes[s.route];return positionAt(R.geo,this.view.progress,this.view.scale);}
 nearLithium(){const s=this.state;if(!s||s.question!=='crystals')return [];return (s.crystal==='li2s'?this.data.li2s.li:this.data.lgps.li.map(x=>x.p));}
 nearSulfur(){const s=this.state;if(!s)return [];if(s.question==='crystals'){if(s.crystal==='li2s')return this.data.li2s.S;const lg=this.data.lgps,m=ease(clamp(this.view.morph));return lg.S.map((p,i)=>p.map((v,k)=>lerp(v,lg.S_bcc[i][k],m)));}const G=this.L[s.lattice];return G.near.map(p=>p.map(x=>x*this.view.scale));}
 doorCentre(i=0){const s=this.state;if(!s||s.question==='crystals')return null;const R=this.L[s.lattice].routes[s.route],c=R.doors[i]?.centre;return c&&c.map(x=>x*this.view.scale);}
 siteCentre(k){const s=this.state;if(!s||s.question==='crystals')return null;const R=this.L[s.lattice].routes[s.route],p=R.geo.points[2*k];return p&&p.map(x=>x*this.view.scale);}
 update(){
  const v=this.view,s=this.state||{},sc=v.scale,net=v.network,hop=1-net;
  for(const name of LATTICES){
   const G=this.L[name],w=v[name];G.group.visible=w>.01;if(!G.group.visible)continue;
   G.scaled.scale.setScalar(sc);
   if(G.lastScale!==sc){this.placeSpheres(G.nearS,sc);this.placeSpheres(G.farS,sc);this.placeSpheres(G.outerS,sc);G.lastScale=sc;}
   for(const [m,o] of [[G.nearMat,w*(1-.55*net)],[G.farMat,w*(1-.55*net)],[G.outerMat,w*.45*net]]){m.opacity=o;m.transparent=o<.999;m.depthWrite=!m.transparent;}
   G.outerS.visible=G.outerMat.opacity>.01;G.nearS.visible=G.nearMat.opacity>.01;G.farS.visible=G.farMat.opacity>.01;
   G.cellMat.opacity=.32*w*v.cells;
   for(const r of ROUTES[name]){
    const R=G.routes[r],rw=w*v[r]*hop;R.group.visible=rw>.01;R.li.visible=rw>.01;R.ghosts.visible=rw>.01;if(rw<=.01)continue;
    const live=s.lattice===name&&s.route===r?v.progress:0;
    for(const g of R.polys){g.userData.fm.opacity=g.userData.base*rw;g.userData.em.opacity=.6*rw;}
    // A doorway lights as the lithium crosses it: it is the narrowest point of the hop.
    R.doors.forEach((dr,i)=>{const at=R.ws[2*i+1],k=Math.exp(-Math.pow((live-at)/.11,2));dr.mesh.material.opacity=rw*(.08+.42*k);dr.loop.material.opacity=rw*(.35+.6*k);});
    R.li.position.set(...positionAt(R.geo,live,sc));R.liMat.opacity=rw;R.liMat.transparent=rw<.999;
    // Ghosts at the NEB images, faint, like the stacked spheres of the paper's Fig. 2 renders.
    if(R.ghostScale!==sc){const n=R.n,M=new T.Matrix4(),Q=new T.Quaternion(),Sc=new T.Vector3(R_IMG,R_IMG,R_IMG);for(let k=0;k<n;k++){M.compose(new T.Vector3(...positionAt(R.geo,k/(n-1),sc)),Q,Sc);R.ghosts.setMatrixAt(k,M);}R.ghosts.instanceMatrix.needsUpdate=true;R.ghostScale=sc;}
    R.ghostMat.opacity=.16*rw;
   }
   G.net.visible=w*net>.01;G.netT.material.opacity=.9*w*net;G.netO.material.opacity=.8*w*net;
   G.linkTT.userData.m.opacity=.85*w*net;G.linkTO.userData.m.opacity=.22*w*net;G.linkOO.userData.m.opacity=.4*w*net;
  }
  // LGPS: crystal → sulfur only → onto bcc → its lithium on bcc tetrahedral sites
  const C=this.lgps,lw=v.lgps;C.group.visible=lw>.01;
  if(C.group.visible){
   const m=ease(clamp(v.morph)),lg=this.data.lgps;
   if(C.lastMorph!==m){this.placeSpheres(C.S,1,lg.S.map((p,i)=>[lerp(p[0],lg.S_bcc[i][0],m),lerp(p[1],lg.S_bcc[i][1],m),lerp(p[2],lg.S_bcc[i][2],m)]));C.lastMorph=m;}
   C.sMat.opacity=lw;const keep=1-v.sulfurOnly;
   C.li.children.forEach(x=>{x.material.opacity=lw*(x.userData.occ*.6+.4)*Math.max(keep,v.bccSites);x.visible=x.material.opacity>.01;});
   C.tetraMats.forEach(([mm,o])=>mm.opacity=o*lw*keep);C.tetra.visible=lw*keep>.01;
   C.boxMat.opacity=.35*lw*(1-.6*v.bccLines);C.bccMat.opacity=.8*lw*v.bccLines;C.siteMat.opacity=.8*lw*v.bccSites;C.ttMat.opacity=.32*lw*v.bccSites;C.sites.visible=C.tt.visible=lw*v.bccSites>.01;
  }
  const D=this.li2s,dw=v.li2s;D.group.visible=dw>.01;
  if(D.group.visible){D.sMat.opacity=dw;D.liMat.opacity=dw*Math.max(1-v.sulfurOnly,v.bccSites);D.li.visible=D.liMat.opacity>.01;D.boxMat.opacity=.8*dw*v.bccLines;D.oMat.opacity=.85*dw*v.bccSites;D.linkMat.opacity=.35*dw*v.bccSites;D.o.visible=D.links.visible=dw*v.bccSites>.01;}
  this.canvas.dataset.progress=v.progress.toFixed(4);this.canvas.dataset.rendered='true';
 }
 resize(){const r=this.canvas.getBoundingClientRect();if(r.width<10||r.height<10)return;this.width=r.width;this.height=r.height;this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setSize(r.width,r.height,false);this.dirty=true;this.wake();}
 // Narrow stages keep the model's width in view rather than its height.
 // Wide stages show the pose's half-height; narrower ones widen the view so the model keeps its sides (less margin on a phone).
 halfHeightFor(h){return h*Math.max(1,(this.width<560?1.12:1.35)/(this.width/this.height));}
 updateCamera(){
  const p=this.pose,h=this.halfHeightFor(p.halfHeight);
  this.camera.fov=2*Math.atan(h/p.dist)*180/Math.PI;this.camera.aspect=this.width/this.height;this.camera.near=Math.max(.5,p.dist-60);this.camera.far=p.dist+60;this.camera.updateProjectionMatrix();
  this.camera.quaternion.copy(p.quat);this.camera.position.copy(p.target).add(new T.Vector3(0,0,p.dist).applyQuaternion(p.quat));this.camera.updateMatrixWorld();
  this.placeLights();
 }
 project(pos){const p=new T.Vector3(...pos).project(this.camera);return {x:(p.x+1)*this.width/2,y:(1-p.y)*this.height/2,z:p.z};}
 pixelsPerAngstrom(){return this.height/(2*this.halfHeightFor(this.pose.halfHeight));}
 moveTo(p,duration=1100){const f=this.pose;this.travel={from:{quat:f.quat.clone(),target:f.target.clone(),halfHeight:f.halfHeight,dist:f.dist},to:{quat:(p.quat||f.quat).clone(),target:(p.target||f.target).clone(),halfHeight:p.halfHeight??f.halfHeight,dist:p.dist??f.dist},t:0,duration:this.state?.reduced?0:duration};this.wake();}
 animate(fn){this.animators.add(fn);this.wake();return ()=>this.animators.delete(fn);}
 renderNow(){this.updateCamera();this.update();this.renderer.render(this.scene,this.camera);this.cb.frame?.(this);this.dirty=false;}
 frame(now){
  this.raf=0;if(!this.active||document.hidden)return;
  const dt=this.last?Math.min(.1,(now-this.last)/1000):1/60;this.last=now;
  for(const fn of [...this.animators])if(fn(now,dt)===false)this.animators.delete(fn);
  if(this.travel){const t=this.travel;t.t+=dt*1000;const u=t.duration?clamp(t.t/t.duration):1,k=ease(u);
   this.pose.quat.copy(t.from.quat).slerp(t.to.quat,k);this.pose.target.copy(t.from.target).lerp(t.to.target,k);this.pose.halfHeight=lerp(t.from.halfHeight,t.to.halfHeight,k);this.pose.dist=lerp(t.from.dist,t.to.dist,k);if(u>=1)this.travel=null;this.dirty=true;}
  if(this.state&&this.step(dt))this.dirty=true;
  if(this.dirty)this.renderNow();
  if(this.raf)return;
  if(this.travel||this.animators.size||!this.settled())this.raf=requestAnimationFrame(t=>this.frame(t));else this.last=0;
 }
 wake(){this.dirty=true;if(!this.raf&&this.active&&!document.hidden)this.raf=requestAnimationFrame(t=>this.frame(t));}
 stop(){cancelAnimationFrame(this.raf);this.raf=0;this.last=0;}
 // Turn about the screen's own axes, around the point the camera looks at.
 orbit(dx,dy){const k=Math.PI/Math.max(320,this.width*.8),up=new T.Vector3(0,1,0).applyQuaternion(this.pose.quat),right=new T.Vector3(1,0,0).applyQuaternion(this.pose.quat);
  const q=new T.Quaternion().setFromAxisAngle(up,-dx*k).multiply(new T.Quaternion().setFromAxisAngle(right,-dy*k));this.pose.quat.premultiply(q).normalize();this.dirty=true;this.wake();}
 install(){
  const c=this.canvas;
  c.addEventListener('pointerdown',e=>{if(e.button!==0)return;this.drag={x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,kind:e.pointerType,locked:e.pointerType!=='touch',moved:false,id:e.pointerId};});
  c.addEventListener('pointermove',e=>{if(!this.drag)return;const d=this.drag,dx=e.clientX-d.x,dy=e.clientY-d.y;
   if(!d.moved){if(Math.hypot(e.clientX-d.x0,e.clientY-d.y0)<6)return;if(!d.locked&&Math.abs(dy)>Math.abs(dx)){this.drag=null;return;}d.locked=true;d.moved=true;c.setPointerCapture(d.id);this.travel=null;this.cb.interrupt?.();}
   this.orbit(dx,d.kind==='touch'?dy*.6:dy);d.x=e.clientX;d.y=e.clientY;});
  c.addEventListener('pointerup',()=>{this.drag=null;});
  for(const ev of ['pointercancel','lostpointercapture'])c.addEventListener(ev,()=>{if(this.drag?.moved)this.drag=null;});
  c.addEventListener('wheel',e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();this.cb.interrupt?.();this.travel=null;this.pose.halfHeight=clamp(this.pose.halfHeight*Math.exp(e.deltaY*.001),2.2,16);this.wake();},{passive:false});
  c.addEventListener('keydown',e=>{const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down','+':'in','=':'in','-':'out',Home:'reset'};if(map[e.key]){e.preventDefault();this.cb.interrupt?.();this.control(map[e.key]);}});
 }
 control(action){
  if(action==='reset'){this.moveTo(this.cb.home?.()??this.home);return;}
  const base=this.travel?this.travel.to:this.pose;
  if(action==='in'||action==='out'){this.moveTo({halfHeight:clamp(base.halfHeight*(action==='in'?.84:1.2),2.2,16)},380);return;}
  const ang=Math.PI/8,up=new T.Vector3(0,1,0).applyQuaternion(base.quat),right=new T.Vector3(1,0,0).applyQuaternion(base.quat);
  const q=action==='left'?new T.Quaternion().setFromAxisAngle(up,ang):action==='right'?new T.Quaternion().setFromAxisAngle(up,-ang):action==='up'?new T.Quaternion().setFromAxisAngle(right,ang):new T.Quaternion().setFromAxisAngle(right,-ang);
  this.moveTo({quat:q.multiply(base.quat.clone()).normalize()},420);
 }
}
// Edges of the conventional cells in the block (cubes for bcc and fcc; none for hcp, whose block is round).
function cellEdges(name,lat){
 if(name==='hcp')return [];
 const a=lat.cell_A[0],xs=lat.S.map(p=>p[0]),ys=lat.S.map(p=>p[1]),zs=lat.S.map(p=>p[2]);
 const lo=[Math.min(...xs),Math.min(...ys),Math.min(...zs)],hi=[Math.max(...xs),Math.max(...ys),Math.max(...zs)];
 const n=[0,1,2].map(k=>Math.round((hi[k]-lo[k])/a)),out=[];
 for(let i=0;i<=n[0];i++)for(let j=0;j<=n[1];j++)for(let k=0;k<=n[2];k++){const p=[lo[0]+i*a,lo[1]+j*a,lo[2]+k*a];if(i<n[0])out.push(p,[p[0]+a,p[1],p[2]]);if(j<n[1])out.push(p,[p[0],p[1]+a,p[2]]);if(k<n[2])out.push(p,[p[0],p[1],p[2]+a]);}
 return out;
}
