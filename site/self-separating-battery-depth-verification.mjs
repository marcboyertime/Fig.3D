import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initialState,reduce} from './self-separating-battery-model.mjs';
import {scaling,capacity,sliceStats,initialDepth,reduceDepth} from './self-separating-battery-depth.mjs';
const meta=JSON.parse(fs.readFileSync(new URL('./assets/self-separating-battery/geometry.json',import.meta.url)));
const bytes=fs.readFileSync(new URL('./assets/self-separating-battery/field.bin',import.meta.url));
const field=new Float32Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/4);
const references=JSON.parse(fs.readFileSync(new URL('../production/self-separating-battery/verification/depth-slice-reference.json',import.meta.url)));
for(const r of references.checks)assert.deepEqual(sliceStats(field,meta.n,r.slice),{components:r.components,occupied:r.occupied,samples:r.samples});
// Connection around a third-dimensional detour: separate in a plane, joined elsewhere.
const synthetic=new Float32Array(27).fill(1);
for(const [i,j,k] of [[0,1,0],[2,1,0],[0,1,1],[1,1,1],[2,1,1]])synthetic[(i*3+j)*3+k]=-1;
assert.equal(sliceStats(synthetic,3,0).components,2);assert.equal(sliceStats(synthetic,3,1).components,1);
assert.deepEqual(scaling(.5),{resistance:.5,diffusion:.25});assert.deepEqual(scaling(2),{resistance:2,diffusion:4});
assert.ok(Math.abs(capacity.third-27.456)<1e-10);assert.ok(Math.abs(capacity.third/capacity.first-.2288)<1e-10);
const overview={...initialState(true),view:'fabrication',stage:'cathode',layer:'carbon',cut:.73};
let state=reduce(overview,{type:'depth-enter'});
state=reduce(state,{type:'depth',action:{type:'topic',value:'formation'}});state=reduce(state,{type:'depth',action:{type:'formation',value:2}});
const depth={...state.deep};for(let i=0;i<15;i++){for(const d of ['1','2','5','6'])state=reduce(state,{type:'display',value:d});state=reduce(state,{type:'display',value:'model'});}assert.deepEqual(state.deep,depth);
state=reduce(state,{type:'depth-exit'});assert.deepEqual(state,overview);
assert.equal(reduceDepth(initialDepth(),{type:'slice',value:200}).slice,40);assert.equal(reduceDepth(initialDepth(),{type:'length',value:.01}).length,.25);
console.log('PASS: 41 slices agree with independent SciPy fixtures; 3D detour example; length scaling; capacity denominators; advanced/figure/overview state preservation.');

// The highlighted route really leaves the plane and joins the two patches through carbon only.
const {hiddenConnection}=await import('./self-separating-battery-depth.mjs');
let joined=0;
for(let k=0;k<meta.n;k++){
 const link=hiddenConnection(field,meta.n,k);if(!link)continue;joined++;
 const n=meta.n,[a,b]=[link.path[0],link.path.at(-1)];
 assert.equal(a[2],k);assert.equal(b[2],k);assert.equal(link.labels[a[0]*n+a[1]],link.from);assert.equal(link.labels[b[0]*n+b[1]],link.to);assert.notEqual(link.from,link.to);
 for(const p of link.path)assert.ok(field[(p[0]*n+p[1])*n+p[2]]<=0);
 for(let i=1;i<link.path.length;i++)assert.equal(link.path[i].reduce((d,v,x)=>d+Math.abs(v-link.path[i-1][x]),0),1);
 assert.ok(link.maxOffset>0);
}
assert.ok(joined>10);
console.log(`PASS: in ${joined} slices the highlighted route steps through 6-neighbour carbon only, leaves the plane and lands on the other patch.`);

// Verify the circuit that is actually rendered, not just different captions.
const {formationConfiguration,formationSteps}=await import('./self-separating-battery-depth.mjs');
// [key, vial, immersed, + terminal, − terminal]; sources: Figure 2, Figure 5a–d insets and text, Figure 6b inset.
const expected=[
 ['deposited',false,false,null,null],['form-sei',true,true,'carbon','li'],['plate-strip',true,true,'carbon','li'],
 ['reduce-polymer',true,true,'polymer','li'],['charge-device',true,true,'polymer','carbon'],['operate',true,false,'polymer','carbon']
];
assert.equal(formationSteps.length,expected.length);
for(let i=0;i<expected.length;i++){
 const c=formationConfiguration(i);assert.deepEqual([c.key,c.vial,c.immersed,c.plus,c.minus],expected[i]);
 for(const f of ['name','figure','title','copy','note','potential'])assert.ok(c[f].length,c.key+' '+f);
 assert.ok(!c.title.endsWith('.'));
}
// External lithium is used only while one electrode is processed on its own.
for(const c of formationSteps)assert.equal([c.plus,c.minus].includes('li'),['form-sei','plate-strip','reduce-polymer'].includes(c.key));
const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);
globalThis.window={THREE:require('./assets/battery-three-r128.min.js')};globalThis.matchMedia=()=>({matches:false});
const T=window.THREE,box=new T.BoxGeometry(6,6,6);
const {DepthScene}=await import('./self-separating-battery-depth-scene.mjs');
const {BENCH}=await import('./self-separating-battery-formation.mjs?v=5');
const host={scene:new T.Scene(),state:{reduced:true},canvas:{dataset:{}},meshes:{carbon:{geometry:box},sei:{geometry:box},cathode:{geometry:box}},width:900,height:700};
const rendered=new DepthScene(host);
for(let i=0;i<expected.length;i++){
 rendered.update({...initialDepth(),topic:'formation',formation:i});const bench=rendered.bench,[key,vial,immersed,plus,minus]=expected[i];
 assert.equal(host.canvas.dataset.formation,key);assert.equal(host.canvas.dataset.plus,plus||'none');assert.equal(host.canvas.dataset.minus,minus||'none');
 assert.equal(bench.vial.visible,vial);assert.equal(bench.chip.visible,vial);
 assert.ok(Math.abs(bench.device.position.y-(immersed?BENCH.immersedY:BENCH.raisedY))<1e-9);
 // Cables that are actually drawn: one per used terminal, ending on the named lead.
 const cables=bench.wires.children.filter(o=>o.userData.terminal);
 assert.deepEqual(cables.map(c=>c.userData.terminal+':'+c.userData.lead).sort(),[plus&&'plus:'+plus,minus&&'minus:'+minus].filter(Boolean).sort());
 for(const c of cables){const end=c.userData.curve.getPoint(1),start=c.userData.curve.getPoint(0),lead=BENCH.lead[c.userData.lead],term=BENCH.terminal[c.userData.terminal];
  assert.ok(end.distanceTo(new T.Vector3(...lead))<1e-9);assert.ok(Math.abs(start.x-term[0])<1e-9&&Math.abs(start.z-term[2])<1e-9);}
 // The lithium lead exists only while the chip is in the vial.
 assert.equal(bench.wires.children.some(o=>o.userData.lead==='li'),vial);
 const labels=bench.anchors().map(l=>l.id);assert.equal(labels.includes('li'),vial);
}
assert.equal(reduceDepth(initialDepth(),{type:'formation',value:999}).formation,5);
console.log('PASS: six source-mapped processing states; rendered cables join the named terminals and leads; external Li only in half-cell steps; device immersed until Operate, raised there.');
