// Pure geometry. Positions are integer FCC coordinates in units of a/2.
// Browser and Blender consume these same data; visibility never changes topology.
export const LATTICE_ANGSTROM = 4.08;
export const add = (a,b) => a.map((v,i)=>v+b[i]);
export const sub = (a,b) => a.map((v,i)=>v-b[i]);
export const mul = (a,s) => a.map(v=>v*s);
export const dot = (a,b) => a.reduce((s,v,i)=>s+v*b[i],0);
export const norm = a => Math.sqrt(dot(a,a));
export const unit = a => mul(a,1/norm(a));
export const average = p => mul(p.reduce(add,[0,0,0]),1/p.length);
export const key = p => p.join(',');
export const NN_OFFSETS = [];
for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++)
 if(x*x+y*y+z*z===2) NN_OFFSETS.push([x,y,z]);

export function createParticle(shells=6){
 if(!Number.isInteger(shells)||shells<3||shells>10)throw new RangeError('Use 3–10 complete shells');
 const atoms=[], byId=new Map(), n=shells;
 for(let x=-n;x<=n;x++)for(let y=-n;y<=n;y++)for(let z=-n;z<=n;z++){
  if((x+y+z)%2 || Math.abs(x)+Math.abs(y)+Math.abs(z)>2*n)continue;
  const p=[x,y,z], atom={id:key(p),index:atoms.length,p,neighbors:[]};
  atoms.push(atom);byId.set(atom.id,atom);
 }
 for(const atom of atoms){
  atom.neighbors=NN_OFFSETS.map(d=>byId.get(key(add(atom.p,d)))).filter(Boolean).map(a=>a.id);
  atom.cn=atom.neighbors.length;atom.surface=atom.cn<12;
 }
 const facets=[];
 for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
  const normal=[0,0,0];normal[axis]=sign;
  const others=[0,1,2].filter(i=>i!==axis), vertices=[];
  for(const [u,v] of [[n,0],[0,n],[-n,0],[0,-n]]){const p=mul(normal,n);p[others[0]]=u;p[others[1]]=v;vertices.push(p);}
  facets.push({id:`100:${key(normal)}`,family:'100',normal,vertices,center:mul(normal,n),distance:n});
 }
 for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1]){
  const normal=unit([x,y,z]),vertices=[[x*n,y*n,0],[x*n,0,z*n],[0,y*n,z*n]];
  facets.push({id:`111:${x},${y},${z}`,family:'111',normal,vertices,center:average(vertices),distance:2*n/Math.sqrt(3)});
 }
 for(const face of facets)face.atomIds=atoms.filter(a=>Math.abs(dot(a.p,face.normal)-face.distance)<1e-7).map(a=>a.id);
 const distribution={};for(const a of atoms)distribution[a.cn]=(distribution[a.cn]||0)+1;
 const surfaceCount=atoms.filter(a=>a.surface).length;
 return {shells,atoms,byId,facets,distribution,surfaceCount,surfaceFraction:surfaceCount/atoms.length,latticeAngstrom:LATTICE_ANGSTROM};
}

export function representative(model,kind,faceId='100:1,0,0'){
 const face=model.facets.find(f=>f.id===faceId)||model.facets.find(f=>f.id==='100:1,0,0');
 const cn=kind==='face'?(face.family==='100'?8:9):({edge:7,corner:5,interior:12})[kind];
 const target=kind==='face'?face.center:kind==='edge'?[model.shells,model.shells/2,model.shells/2]:kind==='corner'?[model.shells,model.shells,0]:[0,0,0];
 return model.atoms.filter(a=>a.cn===cn&&(kind!=='face'||face.atomIds.includes(a.id))).sort((a,b)=>norm(sub(a.p,target))-norm(sub(b.p,target)))[0];
}

export function siteDescription(atom){
 return ({12:'Interior atom',9:'Triangular terrace',8:'Square terrace',7:'Edge atom',5:'Corner atom'})[atom.cn]||'Surface atom';
}

// Enumerate geometrical sites from actual terrace neighbors, not painted positions.
const bindingCache=new WeakMap();
export function bindingSites(model,faceId){
 let cache=bindingCache.get(model);if(!cache){cache=new Map();bindingCache.set(model,cache);}if(cache.has(faceId))return cache.get(faceId);
 const face=model.facets.find(f=>f.id===faceId), top=new Set(face.atomIds), candidates={atop:[],bridge:[],hollow:[],fcc:[],hcp:[]};
 const used=new Set();
 function put(kind,ids){
  ids=[...ids].sort();const k=kind+ids.join(';');if(used.has(k))return;used.add(k);
  const p=average(ids.map(id=>model.byId.get(id).p));
  const below=[];const layerStep=face.family==='111'?2/Math.sqrt(3):1;
  for(let layer=1;layer<=4;layer++){
   const depth=layer*layerStep,q=sub(p,mul(face.normal,depth)),rounded=q.map(Math.round);
   if(q.every((v,i)=>Math.abs(v-rounded[i])<1e-7)&&model.byId.has(key(rounded))){below.push({a:model.byId.get(key(rounded)),d:depth});break;}
  }
  const site={kind,p,atomIds:ids,normal:face.normal,underlying:below[0]?.a.id||null,underlyingDepth:below[0]?.d||null};
  if(kind==='hollow'&&face.family==='111'){
   site.kind=below[0]&&Math.abs(below[0].d-2/Math.sqrt(3))<1e-5?'hcp':'fcc';
   candidates[site.kind].push(site);
  }else candidates[kind].push(site);
 }
 for(const id of face.atomIds){
  const a=model.byId.get(id), ns=a.neighbors.filter(i=>top.has(i));put('atop',[id]);
  for(const b of ns)put('bridge',[id,b]);
  for(let i=0;i<ns.length;i++)for(let j=i+1;j<ns.length;j++){
   const b=model.byId.get(ns[i]),c=model.byId.get(ns[j]);
   if(face.family==='111'&&b.neighbors.includes(c.id))put('hollow',[id,b.id,c.id]);
   if(face.family==='100'&&Math.abs(dot(sub(b.p,a.p),sub(c.p,a.p)))<1e-7){
    const fourth=key(sub(add(b.p,c.p),a.p));if(top.has(fourth))put('hollow',[id,b.id,c.id,fourth]);
   }
  }
 }
 const result={};for(const [kind,list] of Object.entries(candidates))if(list.length)result[kind]=list.sort((a,b)=>norm(sub(a.p,face.center))-norm(sub(b.p,face.center))||key(a.p).localeCompare(key(b.p)))[0];
 cache.set(faceId,result);return result;
}

export function atomVisible(atom,state){
 if(!state.cutaway&&!state.stacking)return true;
 // Retain selected atom and counted neighbors even when they cross the cut plane.
 if(state.view==='neighbors'&&state.selected){
  if(atom.id===state.selected||state.model.byId.get(state.selected)?.neighbors.includes(atom.id))return true;
 }
 if(state.stacking&&state.view==='binding'){
  const face=state.model.facets.find(f=>f.id===state.faceId),site=bindingSites(state.model,state.faceId)[state.site];
  if(site?.atomIds.includes(atom.id)||site?.underlying===atom.id)return true;
  // A narrow window through the selected site reveals subsurface registry.
  if(site){const d=sub(atom.p,site.p),lateral=norm(sub(d,mul(face.normal,dot(d,face.normal))));if(lateral<2.3&&dot(d,face.normal)>-3.5)return false;}
 }
 return !state.cutaway||atom.p[0]+atom.p[1]+atom.p[2]<=0;
}
