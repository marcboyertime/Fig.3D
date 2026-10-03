import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initialState,reduce,orbit,meshNames,phaseAt,clipScalar,intervals,caption} from './self-separating-battery-model.mjs';
const meta=JSON.parse(fs.readFileSync(new URL('./assets/self-separating-battery/geometry.json',import.meta.url)));
let s=initialState();s=reduce(s,{type:'view',value:'fabrication'});s=reduce(s,{type:'stage',value:'cathode'});
assert.deepEqual(meshNames(s),['carbon','deposited']);assert.equal(phaseAt(.1,s,meta),'cathode');s=reduce(s,{type:'stage',value:'sei'});assert.equal(phaseAt(.1,s,meta),'sei');assert.equal(phaseAt(.5,s,meta),'cathode');assert.equal(phaseAt(1,s,meta),null);
assert.ok(caption(s)[2].includes('external lithium in liquid electrolyte'));
const masks=meshNames(s);s=reduce(s,{type:'cut',value:.65});assert.deepEqual(meshNames(s),masks);s=reduce(s,{type:'layer',value:'carbon'});assert.deepEqual(meshNames(s),masks);
const before={...s};s=reduce(s,{type:'paper',value:true});s=reduce(s,{type:'paper',value:false});assert.deepEqual(s,before);
s=reduce(s,{type:'route',value:'carbon'});assert.equal(s.layer,'carbon');assert.equal(s.route,'carbon');s=reduce(s,{type:'route',value:'carbon'});assert.equal(s.layer,'all');assert.equal(s.route,null);
s=reduce(s,{type:'view',value:'interface'});assert.equal(s.cut,0);assert.equal(s.opening,false);assert.equal(s.layer,'all');
assert.equal(initialState(true).opening,false);assert.equal(initialState(true).transport,false);
// Screen-space motion of the nearest point on a sphere, across multiple poses.
function projected(v,p){const cy=Math.cos(p.yaw),sy=Math.sin(p.yaw),ce=Math.cos(p.elevation),se=Math.sin(p.elevation);return [v[0]*cy-v[2]*sy,-(-v[0]*sy*se+v[1]*ce-v[2]*cy*se)];}
for(const yaw of [-2.8,-1.1,0,.8,2.7])for(const elevation of [-.8,0,.65]){
 const p={yaw,elevation},v=[Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation)],a=projected(v,p);
 for(const [dx,dy] of [[8,0],[-8,0],[0,8],[0,-8],[6,6],[-6,-6]]){const b=projected(v,orbit(p,dx,dy));if(dx)assert.ok((b[0]-a[0])*dx>0);if(dy)assert.ok((b[1]-a[1])*dy>0);}
}
function area(poly){return Math.abs(poly.reduce((sum,p,i)=>{const q=poly[(i+1)%poly.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;}
for(let i=0;i<100;i++){
 const tri=[[0,0,Math.sin(i)*2],[1,0,Math.cos(i)*2],[0,1,Math.sin(i*2+1)*2]],ranges=[...intervals(initialState(),meta),['pore',meta.outerThreshold,Infinity]];
 const sum=ranges.reduce((a,[,lo,hi])=>a+area(clipScalar(clipScalar(tri,lo,true),hi,false)),0);assert.ok(Math.abs(sum-.5)<1e-10);
}
console.log('PASS: deposition→SEI order, cutaway invariance, source return, selection state, reduced motion, 90 screen-space drag cases, 100 cut-face partitions.');
