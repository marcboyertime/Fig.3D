import assert from 'node:assert/strict';
import {A,B,C,D,T,cations,tetraO,oxygen,octO,windows,hopPosition,sequence} from './hop-model.mjs';
const norm=(p,q)=>Math.hypot(...p.map((x,i)=>x-q[i]));
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-12,`${a} != ${b}`);
const vector=(a,b)=>a.forEach((v,i)=>close(v,b[i]));
const key=p=>p.join(',');
for(const p of cations)assert.equal(p.reduce((a,b)=>a+b)%2,0);
for(const p of oxygen)assert.equal(Math.abs(p.reduce((a,b)=>a+b)%2),1);
for(const p of [A,B]){const shell=octO(p);assert.equal(new Set(shell.map(key)).size,6);shell.forEach(o=>close(norm(p,o),1));}
assert.equal(oxygen.length,10);assert.equal(tetraO.length,4);
tetraO.forEach(o=>close(norm(o,T),Math.sqrt(3)/2));
for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)close(norm(tetraO[i],tetraO[j]),Math.sqrt(2));
assert.equal(windows[0].length,3);assert.equal(windows[1].length,3);
assert.equal(octO(A).filter(o=>octO(B).some(p=>key(p)===key(o))).length,2);
for(const [i,s] of [[0,1/3],[1,2/3]])vector(hopPosition(s),[0,1,2].map(j=>windows[i].reduce((a,p)=>a+p[j],0)/3));
vector(hopPosition(0),A);vector(hopPosition(.5),T);vector(hopPosition(1),B);
[A,B,C].forEach(([x,y,z])=>close(x-y-z,0));assert.notEqual(D[0]-D[1]-D[2],0);
for(let i=0;i<=1000;i++){const p=i/1000,q=sequence(p),pos=hopPosition(q.hop);pos.forEach(Number.isFinite);assert.ok(q.zoom>=0&&q.zoom<=1&&q.unfold>=0&&q.unfold<=1);if(p<=.13)close(q.zoom,0);if(p<=.7)close(q.hop,0);}
assert.equal(sequence(1).hop,1);assert.equal(sequence(0).replace,0);
console.log('PASS: actual model parity, six/four coordination, 10 unique O, face-sharing geometry, divacancy layer, endpoints and face crossings; 1,001 sequence fixtures.');
