import assert from 'node:assert/strict';
import {createParticle,bindingSites,representative,atomVisible,dot,sub,norm,key} from './nanoparticle-model.mjs?v=20261002-5';
import {initialState,reduce,orbitDelta} from './nanoparticle-state.mjs?v=20261002-5';
let assertions=0;function check(v,msg){assert.ok(v,msg);assertions++;}
for(let n=3;n<=10;n++){
 const m=createParticle(n);check(m.atoms.length===(10*n**3+15*n*n+11*n+3)/3,'magic number');
 check(m.surfaceCount===10*n*n+2,'surface shell');check(m.surfaceFraction===m.surfaceCount/m.atoms.length,'surface fraction');
 for(const a of m.atoms){check(m.byId.has(key(a.p.map(x=>-x))),'inversion');check(m.byId.has(key([a.p[1],a.p[2],a.p[0]])),'cubic symmetry');
  for(const id of a.neighbors){const b=m.byId.get(id);check(Math.abs(norm(sub(a.p,b.p))-Math.SQRT2)<1e-10,'FCC nearest distance');check(b.neighbors.includes(a.id),'symmetric neighbors');}
 }
 check(m.distribution[5]===12,'12 vertices');check(m.distribution[7]===24*(n-1),'edge counts');check(m.distribution[8]===6*(n-1)**2,'square terrace counts');check(m.distribution[9]===4*(n-1)*(n-2),'triangular terrace counts');
 check(representative(m,'interior').cn===12,'interior');check(representative(m,'face').cn===8,'100 representative');check(representative(m,'face','111:1,1,1').cn===9,'111 representative');
 for(const face of m.facets){check(Math.abs(norm(face.normal)-1)<1e-10,'unit normals');for(const p of face.vertices)check(Math.abs(dot(p,face.normal)-face.distance)<1e-8,'facet plane');
  const sites=bindingSites(m,face.id);
  for(const site of Object.values(sites)){check(Math.abs(dot(site.p,face.normal)-face.distance)<1e-8,'site on terrace');const ds=site.atomIds.map(id=>norm(sub(m.byId.get(id).p,site.p)));check(Math.max(...ds)-Math.min(...ds)<1e-8,'equal site distances');check(site.atomIds.every(id=>face.atomIds.includes(id)),'site atoms on face');}
  if(face.family==='111'){check(sites.fcc.atomIds.length===3&&sites.hcp.atomIds.length===3,'two hollows');check(Math.abs(sites.hcp.underlyingDepth-2/Math.sqrt(3))<1e-8,'hcp second layer');check(Math.abs(sites.fcc.underlyingDepth-4/Math.sqrt(3))<1e-8,'fcc third layer');}
 }
 const s={...initialState(true),model:m,view:'neighbors',selected:representative(m,'interior').id,cutaway:true};const before=JSON.stringify(m.atoms);
 check(m.atoms.filter(a=>atomVisible(a,s)).length<m.atoms.length,'cutaway removes rendered atoms');check(m.byId.get(s.selected).neighbors.every(id=>atomVisible(m.byId.get(id),s)),'all selected neighbors retained');check(JSON.stringify(m.atoms)===before,'cutaway leaves science unchanged');
}
let paused=reduce(initialState(),{type:'pause'});paused=reduce(paused,{type:'explore'});check(!paused.paused&&!paused.intro,'leaving a paused opening enables interactive camera');
let registry=reduce(initialState(true),{type:'view',value:'binding'});registry=reduce(registry,{type:'face',value:'111:1,1,1'});registry=reduce(registry,{type:'site',value:'hcp'});registry=reduce(registry,{type:'stacking'});registry=reduce(registry,{type:'site',value:'atop'});check(!registry.stacking,'changing adsorption site restores hidden layers');check(registry.model.atoms.every(a=>atomVisible(a,registry)),'new atop selection shows the complete particle');
let s=initialState();s=reduce(s,{type:'view',value:'binding'});check(!s.intro,'intent interrupts opening');s=reduce(s,{type:'face',value:'111:1,1,1'});s=reduce(s,{type:'site',value:'hcp'});s=reduce(s,{type:'stacking'});check(s.stacking&&s.site==='hcp','shared binding state');s=reduce(s,{type:'shortcut',value:'interior'});check(s.cutaway&&s.model.byId.get(s.selected).cn===12,'interior shortcut');s=reduce(s,{type:'shells',value:3});check(s.model.atoms.length===147,'size updates model');s=reduce(s,{type:'reset'});check(s.model.atoms.length===923&&!s.intro,'reset');
// Independently project an initially front-facing landmark through turntable rotations.
function project(p,pose){const y=pose.yaw,e=pose.elevation;const right=[Math.cos(y),0,-Math.sin(y)],up=[-Math.sin(y)*Math.sin(e),Math.cos(e),-Math.cos(y)*Math.sin(e)];return [dot(p,right),-dot(p,up)];}
for(const yaw of [-2,-.6,0,.9,2.6])for(const elevation of [-.7,0,.7]){
 const p=[Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation)],pose={yaw,elevation};
 for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20],[15,15],[-15,-15]]){const a=project(p,pose),b=project(p,orbitDelta(pose,dx,dy));if(dx)check((b[0]-a[0])*dx>0,'horizontal near surface follows hand');if(dy)check((b[1]-a[1])*dy>0,'vertical near surface follows hand');}
}
console.log(`PASS: ${assertions.toLocaleString()} geometry, adsorption, visibility, state and screen-space orbit assertions.`);
