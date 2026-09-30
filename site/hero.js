import {createHopRenderer} from './hero-renderer.js';
import {A,B,C,D,T,tetraO,oxygen,octO,windows,hopPosition,clamp,ease,sequence} from './hop-model.mjs';
const $=s=>document.querySelector(s),canvas=$('#hero-canvas'),ctx=canvas.getContext('2d');
const slider=$('#hero-progress'),play=$('#hero-play'),stage=$('#hero-stage'),explore=$('#hero-explore'),insight=$('#hero-insight');
let gpu;try{gpu=createHopRenderer($('#hero-gl'));}catch{gpu={failed:true,begin(){},line(){},triangle(){},ball(){},finish(){}};}
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
// A lossless WebP of the untouched PNG (pixel-identical, about 30% smaller); the PNG is the fallback.
const source=new Image(),SOURCE_PNG='references/hau-2025-figure-1-original.png';source.src='assets/hau-2025-figure-1.webp';
let progress=0,playing=false,last=0,frame=0,w=0,h=0,yaw=0,pitch=0,selection='',hover='',pointer=null,dragged=false,hitAreas=[],phase='';
const anchors={li:[142,384],b:[262,388],c:[239,399],tm:[215,488],t:[213,414]};
const colors={li:'#97d975',oxygen:'#ec575e',tm:'#ad50d5',sites:'#719f78'};
const descriptions={li:'Li⁺ moves between two octahedral sites. Each endpoint has six oxygen neighbors.',oxygen:'Four oxygen atoms surround the tetrahedral site. Three form each entry or exit face.',tm:'One neighboring transition-metal ion: the “1-TM” local environment in the figure.',sites:'Two vacant octahedral sites form the gate. The small central marker is the tetrahedral site.'};
const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0),same=(a,b)=>a.every((v,i)=>Math.abs(v-b[i])<1e-6);
function project(p){const v=p.map((q,i)=>q-T[i]),r=Math.SQRT1_2;
 let x=dot(v,[r,r,0]),y=dot(v,[.5,-.5,-r]),z=dot(v,[-.5,.5,-r]);
 const unfold=sequence(progress).unfold,viewYaw=yaw+.34*unfold,viewPitch=pitch-.08*unfold;
 const x0=x*Math.cos(viewYaw)+z*Math.sin(viewYaw),z0=-x*Math.sin(viewYaw)+z*Math.cos(viewYaw);
 const y0=y*Math.cos(viewPitch)-z0*Math.sin(viewPitch);z=y*Math.sin(viewPitch)+z0*Math.cos(viewPitch);x=x0;y=y0;
 const scale=spatialScale(),perspective=1;
 return {x:w*(w<640?.46:.5)+x*scale*perspective,y:h*.47-y*scale*perspective,z,r:scale*perspective};}
// Narrow canvases leave less room beside the central hop, so the outer coordination context gets a smaller unit to stay in frame.
function spatialScale(){return Math.min(w*(w<640?.28:.38),h*.39)}
function sourceTransform(zoom){const fit=Math.min((w-24)/1500,(h-30)/850),end=Math.min(.95,w*.7/390,h*.7/310),scale=fit+(end-fit)*zoom;
 const cx=750+(213-750)*zoom,cy=425+(424-425)*zoom;
 return {scale,x:w*.5-cx*scale,y:h*.47-cy*scale};}
function anchored(key,target,f){const t=sourceTransform(1),a=anchors[key],b=project(target);return {...b,x:t.x+a[0]*t.scale+(b.x-t.x-a[0]*t.scale)*f,y:t.y+a[1]*t.scale+(b.y-t.y-a[1]*t.scale)*f};}
function line(...args){gpu.line(...args)}
function triangle(...args){gpu.triangle(...args)}
function ball(...args){gpu.ball(...args)}
function label(p,text,dx=0,dy=0,color='#c6cbdc'){ctx.save();ctx.font='13px Sora, Arial';ctx.textAlign='center';ctx.fillStyle=color;ctx.shadowColor='#080a12';ctx.shadowBlur=7;ctx.fillText(text,p.x+dx,p.y+dy);ctx.restore();}
function connectors(q){const hero=$('.hero').getBoundingClientRect(),r=canvas.getBoundingClientRect(),svg=$('.hero-connectors');svg.setAttribute('viewBox',`0 0 ${hero.width} ${hero.height}`);
 for(const [word,id,amount,drawn] of [['#figure-word','#figure-connector',1-ease((progress-.36)/.13),reduced.matches?1:ease(progress/.12)],['#understanding-word','#understanding-connector',progress>.50?1:0,ease((progress-.50)/.18)]]){
 const a=$(word).getBoundingClientRect(),p=$(id),small=hero.width<701;
 const x=a.right-hero.left+(small?8:15),y=a.top+a.height*.58-hero.top;
 const tr=sourceTransform(q.zoom),target=word==='#figure-word'?{x:tr.x+anchors.li[0]*tr.scale-28,y:tr.y+anchors.li[1]*tr.scale-14}:project(A);
 const ex=small?r.left+r.width*.68-hero.left:r.left+target.x-hero.left-(word==='#understanding-word'?38:0),ey=small?r.top+51-hero.top:r.top+target.y-hero.top+10;
 const d=small?`M${x} ${y} H${hero.width-18} Q${hero.width-9} ${y} ${hero.width-9} ${y+12} V${ey-18} Q${hero.width-9} ${ey} ${hero.width-28} ${ey} H${ex}`:`M${x} ${y} C${x+80} ${y+38},${ex-75} ${ey+32},${ex} ${ey}`;
 p.setAttribute('d',d);const length=p.getTotalLength();p.style.opacity=String(amount*.85);p.style.strokeDasharray=String(length);p.style.strokeDashoffset=String(length*(1-drawn));p.setAttribute('marker-end',drawn>.98?'url(#connector-end)':'');
 }
}
function describe(){const current=hover||selection;insight.textContent=descriptions[current]||'Drag to rotate. Select an atom to look closer.';document.querySelectorAll('[data-inspect]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.inspect===selection)));}
function draw(){if(!ctx||!w||!h)return;const q=sequence(progress),inspect=hover||selection;ctx.clearRect(0,0,w,h);hitAreas=[];gpu.begin(w,h,spatialScale());
 if(source.complete&&source.naturalWidth&&q.replace<1){const tr=sourceTransform(q.zoom);ctx.save();ctx.globalAlpha=1-q.replace;
 // The complete source is held first; a continuous viewport zoom isolates its 1-TM glyph.
 const crop=ease((q.zoom-.15)/.85),left=74*crop,top=322*crop,cw=1500+(275-1500)*crop,ch=850+(240-850)*crop;
 ctx.beginPath();ctx.rect(tr.x+left*tr.scale,tr.y+top*tr.scale,cw*tr.scale,ch*tr.scale);ctx.clip();ctx.drawImage(source,tr.x,tr.y,1500*tr.scale,850*tr.scale);
 // While the mesh takes over, dissolve the paper from its edges inward so no flat grey card is left around the actors.
 if(q.replace>0){const mx=tr.x+(left+cw/2)*tr.scale,my=tr.y+(top+ch/2)*tr.scale,hh=ch*tr.scale/2,R=hh*1.42,inner=Math.max(0,R*(1-1.6*q.replace)),mask=ctx.createRadialGradient(0,0,inner,0,0,inner+R*.45);mask.addColorStop(0,'#000');mask.addColorStop(1,'rgba(0,0,0,0)');ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-in';ctx.translate(mx,my);ctx.scale(cw/ch,1);ctx.fillStyle=mask;ctx.fillRect(-w,-h,2*w,2*h);}ctx.restore();}
 if(q.replace>0){const alpha=q.replace,unfold=q.unfold,scale=spatialScale(),glyph=sourceTransform(1).scale;
 const a=anchored('li',A,unfold),b=anchored('b',B,unfold),c=anchored('c',C,unfold),d=anchored('tm',D,unfold),t=anchored('t',T,unfold);
 const li=q.hop>0?project(hopPosition(q.hop)):a,rad=22*glyph+(scale*.14-22*glyph)*unfold;
 const allO=tetraO.map(o=>project(o));
 if(unfold>0){line([a,t,b],'#99d8b1',1.5,unfold*.65,[4,5]);
  // Oxygen tetrahedron is geometry, not a migration-energy surface.
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)line([allO[i],allO[j]],'#7387ac',1,q.oxygen*.35);
  [[0,1,2],[0,1,3],[0,2,3],[1,2,3]].forEach(face=>triangle(face.map(i=>allO[i]),q.oxygen*.028));
  const windowActive=Math.abs(q.hop-1/3)<.065?0:Math.abs(q.hop-2/3)<.065?1:-1;
  if(inspect==='oxygen'||windowActive!==-1){windows.forEach((face,i)=>triangle(face.map(project),q.oxygen*(windowActive===i?.28:.07)));}
  if(unfold>.7){const endpoint=q.hop>.5?B:A,vertices=octO(endpoint).map(project);for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if(Math.abs(Math.hypot(...octO(endpoint)[i].map((v,k)=>v-octO(endpoint)[j][k]))-Math.SQRT2)<.001)line([vertices[i],vertices[j]],'#91beec',1,(inspect==='li'?.6:.2)*q.oxygen);}
 }
 const atoms=[{p:b,r:rad,color:'#bed5c6',alpha:alpha*(q.hop<.98?1:.35),ring:true,type:'sites'},
 {p:c,r:rad*.88,color:'#bed5c6',alpha:alpha*(.45+.4*unfold),ring:true,type:'sites'},
 {p:d,r:rad*.97,color:colors.tm,alpha,type:'tm'},
 {p:t,r:Math.max(5,rad*.42),color:unfold>.5?'#8cb798':'#387a45',alpha:alpha*(1-.45*unfold),ring:unfold>.5,type:'sites'},
 {p:a,r:rad,color:'#bed5c6',alpha:alpha*(q.hop>0?.6:0),ring:true,type:'sites'},
 {p:li,r:rad,color:colors.li,alpha,type:'li'}];
 oxygen.forEach(o=>{const central=tetraO.some(t=>same(o,t));let visible=central?1:inspect==='li'&&octO(q.hop>.5?B:A).some(a=>same(o,a))?.85:.26;if(visible)atoms.push({p:project(o),r:scale*(central?.084:.065),color:colors.oxygen,alpha:q.oxygen*visible,type:'oxygen'});});
 atoms.sort((a,b)=>a.p.z-b.p.z).forEach(atom=>{ball(atom.p,atom.r,atom.color,atom.alpha,atom.ring);if(atom.alpha>.3)hitAreas.push({...atom,hit:Math.max(atom.r,17)});});
 if(unfold>.9){label(a,'octahedral',-18,-rad-13);label(b,'octahedral',18,-rad-13);label(t,'tetrahedral',-scale*.45,scale*.17,'#b8cdbd');
 if(inspect==='sites')label(c,'second vacancy',0,-rad-12);if(inspect==='tm')label(d,'transition metal',0,rad+22,'#d8b5ee');}
 }
 gpu.finish();connectors(q);
 const next=progress<.13?'paper':progress<.38?'focus':progress<.68?'unfold':q.hop===0?'ready':q.hop<.32?'depart':q.hop<.38?'entry':q.hop<.62?'tetra':q.hop<.7?'exit':'arrive';
 if(next!==phase){phase=next;stage.textContent={paper:'A mechanism, on paper.',focus:'Find one local pathway.',unfold:'The same sites, with depth.',ready:'Octahedral → tetrahedral → octahedral.',depart:'Leave the starting octahedral site.',entry:'Through a face of three oxygen atoms.',tetra:'Through the tetrahedral site.',exit:'Through the second oxygen face.',arrive:'Into a vacant octahedral site.'}[phase];}
 $('#hero-scene-label').textContent=q.unfold>.8?'1-TM · IDEAL LOCAL GEOMETRY':'';
 explore.hidden=!q.interactive;$('#hero-spatial').hidden=q.interactive;
 slider.setAttribute('aria-valuetext',`${Math.round(progress*100)} percent. ${stage.textContent}`);
 canvas.setAttribute('aria-label',q.interactive?`Ideal 1-TM rocksalt local geometry. Lithium ${q.hop<.5?'approaches':'leaves'} a tetrahedral site between two octahedral sites. ${Math.round(q.hop*100)} percent along the schematic path. Drag or use arrow keys to rotate.`:'Figure 1 from Hau et al. comparing layered, spinel and disordered rocksalt. The view focuses on the layered 1-TM hop.');
}
function controls(){play.textContent=playing?'Pause':progress>=1?'Play hop':'Play';play.setAttribute('aria-label',playing?'Pause animation':progress>=1?'Play the lithium hop':'Play animation');play.setAttribute('aria-pressed',String(playing));}
function schedule(){if(!frame)frame=requestAnimationFrame(tick);}
function tick(now){frame=0;if(!playing)return;if(last)progress=Math.min(1,progress+Math.min(now-last,80)/19000);last=now;slider.value=String(Math.round(progress*1000));draw();if(progress>=1){playing=false;controls();return;}schedule();}
function pause(){playing=false;last=0;controls();}
function jump(p){pause();progress=p;slider.value=String(Math.round(p*1000));controls();draw();}
play.addEventListener('click',()=>{if(playing)pause();else{if(progress>=1)progress=.7;playing=true;last=0;controls();schedule();}});
$('#hero-replay').addEventListener('click',()=>{progress=0;yaw=0;pitch=0;selection='';hover='';describe();slider.value='0';playing=!reduced.matches;last=0;controls();draw();if(playing)schedule();});
slider.addEventListener('input',()=>jump(Number(slider.value)/1000));
slider.addEventListener('focus',pause);
$('#hero-spatial').addEventListener('click',()=>jump(.7));
$('#hero-reset').addEventListener('click',()=>{yaw=0;pitch=0;draw();});
document.querySelectorAll('[data-inspect]').forEach(b=>{const key=b.dataset.inspect;b.addEventListener('click',()=>{selection=selection===key?'':key;hover='';pause();describe();draw();});b.addEventListener('mouseenter',()=>{hover=key;describe();draw();});b.addEventListener('mouseleave',()=>{hover='';describe();draw();});b.addEventListener('focus',()=>{hover=key;pause();describe();draw();});b.addEventListener('blur',()=>{hover='';describe();draw();});});
const at=e=>{const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};};
canvas.addEventListener('pointerdown',e=>{if(progress<.68)return;pointer={...at(e),id:e.pointerId};dragged=false;pause();});
canvas.addEventListener('pointermove',e=>{if(progress<.68)return;const p=at(e);if(pointer){const dx=p.x-pointer.x,dy=p.y-pointer.y;if(Math.abs(dx)+Math.abs(dy)>3)dragged=true;if(e.pointerType!=='touch'||Math.abs(dx)>Math.abs(dy)){yaw+=dx*.008;pitch=Math.max(-1.15,Math.min(1.15,pitch+dy*.006));}pointer={...p,id:e.pointerId};draw();}else if(e.pointerType!=='touch'){hover=[...hitAreas].reverse().find(a=>Math.hypot(a.p.x-p.x,a.p.y-p.y)<a.hit)?.type||'';canvas.style.cursor=hover?'pointer':'grab';describe();draw();}});
canvas.addEventListener('pointerup',e=>{if(!pointer)return;if(!dragged){const p=at(e),hit=[...hitAreas].reverse().find(a=>Math.hypot(a.p.x-p.x,a.p.y-p.y)<a.hit);selection=hit?.type||'';hover='';describe();draw();}pointer=null;});
canvas.addEventListener('pointercancel',()=>{pointer=null;});canvas.addEventListener('pointerleave',()=>{pointer=null;hover='';describe();draw();});
canvas.addEventListener('keydown',e=>{if(progress<.68||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();pause();if(e.key==='Home'){yaw=0;pitch=0;}else{yaw+=e.key==='ArrowLeft'?-.15:e.key==='ArrowRight'?.15:0;pitch=Math.max(-1.15,Math.min(1.15,pitch+(e.key==='ArrowUp'?-.12:e.key==='ArrowDown'?.12:0)));}draw();});
reduced.addEventListener('change',()=>{if(reduced.matches)pause();});document.addEventListener('visibilitychange',()=>{last=0;if(document.hidden)pause();});
new ResizeObserver(()=>{const r=canvas.getBoundingClientRect();w=r.width;h=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);draw();}).observe(canvas);
function start(){draw();if(gpu.failed){play.hidden=true;$('#hero-replay').hidden=true;slider.disabled=true;$('#hero-spatial').hidden=true;stage.textContent='The paper figure. 3D is unavailable in this browser.';return;}if(!reduced.matches){playing=true;controls();schedule();}else controls();}
source.addEventListener('load',start);source.addEventListener('error',()=>{if(!source.src.endsWith('.png')){source.src=SOURCE_PNG;return;}jump(.7);stage.textContent='Source image unavailable. Explore the ideal geometry.';});if(source.complete&&source.naturalWidth)start();
const notes=$('#hero-notes-dialog');$('#hero-notes').addEventListener('click',()=>{pause();notes.showModal();});notes.querySelector('.dialog-close').addEventListener('click',()=>notes.close());
