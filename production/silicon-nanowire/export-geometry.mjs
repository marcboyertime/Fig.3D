// Shared scientific evaluator; no independently redrawn teaser geometry.
import fs from 'node:fs';
import {section,outer,core,TAU} from '../../site/silicon-nanowire-model.mjs';
const meshes={},N=128,M=120,p=.48;
for(const [name,fn] of [['shell',outer],['core',core]]){
 const vertices=[],faces=[];
 for(let j=0;j<=M;j++){const d=section(p,j/M);for(let i=0;i<=N;i++){const [x,y]=fn(Math.PI/2+1.5*Math.PI*i/N,d);vertices.push([x,y,d.z]);}}
 for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;faces.push([a,b,b+1,a+1]);}
 for(const j of [0,M]){const d=section(p,j/M),c=vertices.length;vertices.push([0,0,d.z]);for(let i=0;i<N;i++)faces.push([c,j*(N+1)+i,j*(N+1)+i+1]);}
 meshes[name]={vertices,faces};
 for(const [plane,axis] of [['x',0],['y',1]]){const v=[],f=[];for(let j=0;j<=M;j++){const d=section(p,j/M),extent=name==='shell'?(axis===0?d.a:d.b*(1-d.n)):(axis===0?d.cx:d.cy);const off=name==='core'?.006:0;v.push(axis===0?[0,off,d.z]:[off,0,d.z],axis===0?[extent,off,d.z]:[off,extent,d.z]);if(j<M)f.push([j*2,j*2+1,j*2+3,j*2+2]);}meshes[name+'-cut-'+plane]={vertices:v,faces:f};}
}
fs.writeFileSync(new URL('geometry.json',import.meta.url),JSON.stringify({progress:p,units:'R0',meshes}));
