import assert from 'node:assert/strict';
import {A,B,C,D,T,cations,tetraO,oxygen,octO,windows,hopPosition} from './hop-model.mjs';
import {BEATS,DURATION,INTERACTIVE_AT,HOP_REPLAY_AT,readingTime,beatAt,hopAt,hopTime,sequence} from './hero-timeline.mjs';

// ---------- Ideal 1-TM divacancy geometry (hop-model.mjs) ----------
const norm=(p,q)=>Math.hypot(...p.map((x,i)=>x-q[i]));
const close=(a,b,eps=1e-12)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
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
// T shares a face with each of its four cation neighbours: A and B (the hop windows), the second vacancy C and one TM, D.
// D is the only occupied transition-metal site among them, which is the "1-TM" of the figure.
const faceSharing=cations.filter(p=>tetraO.filter(o=>norm(o,p)<1.001).length===3).map(key).sort();
assert.deepEqual(faceSharing,[A,B,C,D].map(key).sort());

// ---------- Storyboard (hero-timeline.mjs) ----------
const start=id=>BEATS.find(b=>b.id===id).start;
// Every caption stays up long enough to read while watching motion, and none ends with a period.
for(const b of BEATS.slice(0,-1)){
 assert.ok(b.end-b.start>=readingTime(b.caption)-1e-9,`"${b.caption}" needs ${readingTime(b.caption).toFixed(2)} s, has ${(b.end-b.start).toFixed(2)} s`);
}
for(const b of BEATS){assert.ok(!/\.$/.test(b.caption)&&!/\.$/.test(b.kicker),`No closing period: ${b.caption}`);assert.equal(beatAt(b.start+.01).id,b.id);}
assert.equal(DURATION,start('explore'));
// Channels stay in [0,1]; the hop never runs backwards.
const channels=['spot','zoom','ghost','intro','card','tilt','atoms','unfold','lens','oxygen','context','edges','labels','route','tm','drift'];
let previous=0;
for(let i=0;i<=2000;i++){
 const q=sequence(i/2000);
 for(const c of channels)assert.ok(q[c]>=0&&q[c]<=1&&Number.isFinite(q[c]),`${c}=${q[c]} at t=${q.t}`);
 for(const c of ['figureConnector','modelConnector'])for(const k of ['draw','fade'])assert.ok(q[c][k]>=0&&q[c][k]<=1,`${c}.${k} at t=${q.t}`);
 assert.ok(q.hop>=previous-1e-12,`hop ran backwards at t=${q.t}`);previous=q.hop;
 hopPosition(q.hop).forEach(v=>assert.ok(Number.isFinite(v)));
}
const at=t=>sequence(t/DURATION);
const near=(a,b,eps=1e-6)=>assert.ok(Math.abs(a-b)<eps,`${a} != ${b}`);
near(at(0).hop,0);near(at(start('depart')).hop,0);near(at(DURATION).hop,1);
// Lithium crosses the entry window while its caption is up, waits at T through the transition-metal beat, then exits.
const [face1,tet,face2,arrival]=[hopTime(1/3),hopTime(.5),hopTime(2/3),hopTime(1)];
assert.ok(face1>start('depart')&&face1<start('tetra'),`entry face at ${face1}`);
assert.ok(tet<start('tetra')+.5,`reaches T at ${tet}`);
for(let t=start('tetra')+.1;t<=start('arrive')+.35;t+=.05)close(hopAt(t),.5,1e-9);
assert.ok(face2>start('arrive')&&face2<DURATION,`exit face at ${face2}`);
assert.ok(arrival<DURATION-.5,'Lithium settles before the closing caption');
// The figure fades in, the zoom finishes and its page context clears before the 3D card takes over.
near(at(0).intro,0);near(at(.5).intro,1);
near(at(start('lift')-.05).zoom,1);near(at(start('lift')).ghost,0);
near(at(start('lift')-.01).card,0);near(at(start('lift')).card,1);near(at(start('lift')+.2).paper,0);
// Spheres settle onto the printed atoms before anything lifts; the card has laid back before it is gone.
near(at(start('lift')+.4).atoms,1);near(at(start('lift')+.4).unfold,0);near(at(start('lift')+.3).tilt,0);
assert.ok(at(start('lift')+1.075).card>.9&&at(start('lift')+1.85).card>0);near(at(start('lift')+1.85).tilt,1);near(at(start('lift')+1.9).card,0);
// The wide lens is gone (flat telephoto look) before oxygen appears, and the model is explorable only once settled.
near(at(start('oxygen')).lens,0);near(at(start('oxygen')).oxygen,0);
near(at(INTERACTIVE_AT).unfold,1);assert.ok(INTERACTIVE_AT<start('oxygen'));
assert.equal(at(INTERACTIVE_AT-.01).interactive,false);assert.equal(at(INTERACTIVE_AT+.01).interactive,true);
// Arrows: "figures" is gone before the card lays back; "understanding" is drawn before the hop and gone during it.
near(at(start('lift')+.3).figureConnector.fade,0);
near(at(start('depart')).modelConnector.draw,1);near(at(start('depart')+.7).modelConnector.fade,0);
// Replaying the hop starts from rest at A with the scene fully built.
const r=at(HOP_REPLAY_AT);near(r.hop,0);near(r.oxygen,1);near(r.edges,1);near(r.route,1);near(r.context,1);
// The drift stops when the story ends: nothing keeps spinning while the reader explores.
near(at(DURATION).drift,1);near(sequence(1.5).drift,1);
console.log(`PASS: model parity, six/four coordination, 10 unique O, face-sharing geometry, one face-sharing TM, divacancy layer, endpoints and face crossings; ${BEATS.length} beats readable at ≤15 chars/s (entry face ${face1.toFixed(2)} s, T ${tet.toFixed(2)} s, exit face ${face2.toFixed(2)} s, arrival ${arrival.toFixed(2)} s); 2,001 storyboard fixtures.`);
