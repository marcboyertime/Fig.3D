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
const depth={...state.deep};for(let i=0;i<15;i++){state=reduce(state,{type:'paper',value:true});state=reduce(state,{type:'paper',value:false});}assert.deepEqual(state.deep,depth);
state=reduce(state,{type:'depth-exit'});assert.deepEqual(state,overview);
assert.equal(reduceDepth(initialDepth(),{type:'slice',value:200}).slice,40);assert.equal(reduceDepth(initialDepth(),{type:'length',value:.01}).length,.25);
console.log('PASS: 41 slices agree with independent SciPy fixtures; 3D detour example; length scaling; capacity denominators; advanced/paper/overview state preservation.');

// Verify the circuit that is actually rendered, not just different captions.
const {formationConfiguration,formationSteps}=await import('./self-separating-battery-depth.mjs');
const expected=[
 ['deposited',false,false,null,'none'],['form-sei',true,true,'carbon','external-li'],
 ['reduce-polymer',true,true,'cathode','external-li'],['charge-device',true,false,'both','charger'],['operate',false,false,'both','load']
];
for(let i=0;i<expected.length;i++){
 const c=formationConfiguration(i);assert.deepEqual([c.key,c.bath,c.externalLi,c.contact,c.circuit],expected[i]);assert.ok(formationSteps[i].copy.length);
}
const {createRequire}=await import('node:module');const require=createRequire(import.meta.url);
globalThis.window={THREE:require('./assets/battery-three-r128.min.js')};
const {DepthScene}=await import('./self-separating-battery-depth-scene.mjs');
const host={scene:new window.THREE.Scene(),state:{reduced:true},canvas:{dataset:{}}};
const rendered=new DepthScene(host);
for(let i=0;i<5;i++){
 rendered.update({...initialDepth(),topic:'formation',formation:i});
 assert.equal(rendered.lithium.visible,expected[i][2]);assert.equal(rendered.liquid.visible,expected[i][1]);
 assert.equal(rendered.connection.children.length,i===0?0:2);
 assert.equal(host.canvas.dataset.formation,expected[i][0]);
 assert.equal(rendered.formSei.visible,i>0);
 if(i===1||i===2){const p=rendered.connection.children[1].geometry.parameters.path.getPoint(1);assert.ok(Math.abs(p.x-(i===1?.17:2.83))<1e-8);assert.ok(Math.abs(p.y-(i===1?-.55:.46))<1e-8);}
}
assert.equal(reduceDepth(initialDepth(),{type:'formation',value:999}).formation,4);
console.log('PASS: five source-mapped process states; actual 3D wire endpoints move from carbon to polymer; charging disconnects external Li and retains bath; operation removes bath.');
