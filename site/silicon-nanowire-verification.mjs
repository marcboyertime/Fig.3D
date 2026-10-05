import assert from 'node:assert/strict';
import {section,contour,localProgress,outer,core,AXES,initialState,reduce,orbit,HOME,LENGTH,zAt} from './silicon-nanowire-model.mjs';
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
assert.equal(dot(AXES.x1,AXES.x2),0);assert.equal(dot(AXES.x1,AXES.x3),0);assert.equal(dot(AXES.x2,AXES.x3),0);
assert.deepEqual([AXES.x1[1]*AXES.x2[2]-AXES.x1[2]*AXES.x2[1],AXES.x1[2]*AXES.x2[0]-AXES.x1[0]*AXES.x2[2],AXES.x1[0]*AXES.x2[1]-AXES.x1[1]*AXES.x2[0]],AXES.x3);
let tested=0;
for(let pi=0;pi<=100;pi++)for(let si=0;si<=30;si++){
 const p=pi/100,s=si/30,{d,outer:op,core:cp}=contour(p,s,160);assert.ok(Number.isFinite(d.b));assert.ok(d.q>=0&&d.q<=1);assert.equal(d.z,zAt(s));
 for(let i=0;i<160;i++){const [x,y]=op[i],[cx,cy]=cp[i];assert.ok([x,y,cx,cy].every(Number.isFinite));assert.ok(Math.abs(cx)<=d.a+1e-9);const localHeight=d.b*Math.sqrt(Math.max(0,1-(cx/d.a)**2))*(1-d.n*Math.exp(-((cx/(d.a*.34))**2)));assert.ok(Math.abs(cy)<=localHeight+1e-8,'core contained');const [xo,yo]=op[(i+80)%160];assert.ok(Math.abs(x+xo)<1e-8&&Math.abs(y+yo)<1e-8,'central symmetry');}
 let area=0;for(let i=0;i<160;i++){const a=op[i],b=op[(i+1)%160];area+=a[0]*b[1]-a[1]*b[0];}assert.ok(area>0);
 if(si<30)assert.ok(localProgress(p,s)>=localProgress(p,(si+1)/30),'front ordered from supplied end');
 if(pi<100)assert.ok(localProgress(p,s)<=localProgress((pi+1)/100,s),'no backward transformation');
 if(p===0){for(const [x,y] of op)assert.ok(Math.abs(x*x+y*y-1)<1e-10);assert.equal(d.cx,1);assert.equal(d.cy,1);}
 if(p===1){assert.equal(d.q,1);assert.equal(d.cx,0);assert.equal(d.cy,0);assert.equal(d.a,2.62);const maxY=Math.max(...op.map(v=>v[1]));assert.ok(Math.abs(maxY-1.14)<.001);}
 tested++;
}
const pre=section(.18,.12),post=section(.48,.4);assert.ok(pre.q<post.q);assert.ok(post.cy>post.cx);assert.ok(post.n>pre.n);
let s=initialState(true);assert.equal(s.display,'model');const saved={...s};for(const f of ['5','1','2','3','s10','model'])s=reduce(s,{type:'display',value:f});for(const k of ['progress','slice','open','field'])assert.equal(s[k],saved[k]);
s=reduce(s,{type:'slice',value:2});assert.equal(s.slice,1);s=reduce(s,{type:'progress',value:-.2});assert.equal(s.progress,0);
s=reduce(s,{type:'play'});assert.equal(s.playing,true);s=reduce(s,{type:'reduced',value:true});assert.equal(s.playing,false);
// Near-center screen-space surface point must follow hand along the screen's right/up basis.
let drags=0;for(const yaw of [-2,-1,0,1,2])for(const elevation of [-.7,0,.7]){
 const p={...HOME,yaw,elevation},r=orbit(p,6,0,900,640);const point=[Math.sin(yaw)*Math.cos(elevation),Math.sin(elevation),Math.cos(yaw)*Math.cos(elevation)];
 const x=a=>point[0]*Math.cos(a.yaw)-point[2]*Math.sin(a.yaw);assert.ok(x(r)>x(p));
 const v=orbit(p,0,6,900,640),y=a=>point[0]*Math.sin(a.yaw)*Math.sin(a.elevation)-point[1]*Math.cos(a.elevation)+point[2]*Math.cos(a.yaw)*Math.sin(a.elevation);assert.ok(y(v)>y(p));drags+=2;
}
console.log(`PASS: ${tested} geometry states; finite/simple symmetric contours; pristine circle; final source-target extents; core containment; tapered front ordering; right-handed axes; slice/state invariants; ${drags} screen-space drag directions.`);
console.log('Scope: schematic geometry, no diffusion, mechanics, conservation, kinetics or fracture prediction is claimed. Browser and visual review remain separate.');
