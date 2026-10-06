// Frame-exact review recording on a virtual clock (rAF, performance.now and CSS animations),
// so motion plays at its authored speed even though SwiftShader renders slowly (about 1 s per frame).
// Serve site/ on :4173, then: node record-review.mjs desktop|phone out.mp4
import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
const [,,kind,out]=process.argv;
const desktop=kind==='desktop',FPS=15,dir=`${os.tmpdir()}/fig3d-fid-frames-${kind}`;
fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage(desktop?{viewport:{width:1512,height:982}}:{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
page.on('pageerror',e=>console.log('pageerror',e.message));
await page.addInitScript(()=>{let t=0,id=0;const pending=new Map();performance.now=()=>t;window.requestAnimationFrame=cb=>{pending.set(++id,cb);return id;};window.cancelAnimationFrame=i=>pending.delete(i);
 window.__step=ms=>{t+=ms;for(const an of document.getAnimations()){an.pause();an.currentTime=(an.currentTime||0)+ms;}const cbs=[...pending.values()];pending.clear();for(const cb of cbs)try{cb(t);}catch(e){console.error(e);}};});
await page.goto('http://localhost:4173/fast-ion-diffusion.html?intro');
await page.waitForFunction(()=>document.documentElement.dataset.ready==='true');
await page.evaluate(()=>{for(const an of document.getAnimations()){an.pause();an.currentTime=0;}});
for(let i=0;i<20;i++){await page.evaluate(()=>window.__step(0));await page.waitForTimeout(100);}
let frame=0,clock=0;
const step=async s=>{const n=Math.round(s*FPS);for(let i=0;i<n;i++){await page.evaluate(ms=>window.__step(ms),1000/FPS);await page.screenshot({path:`${dir}/${String(frame++).padStart(5,'0')}.jpg`,type:'jpeg',quality:88,timeout:180000});clock+=1/FPS;}};
const box=sel=>page.locator(sel).boundingBox();
const click=async sel=>{await page.evaluate(s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)e.scrollIntoView({block:'center'});},sel);const b=await box(sel);await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.up();};
const drag=async(dx,dy,seconds=1.4)=>{const b=await box('#channel');const x=b.x+b.width/2,y=b.y+b.height*.62,n=Math.round(seconds*FPS);await page.mouse.move(x,y);await page.mouse.down();for(let i=1;i<=n;i++){const u=i/n,e=u<.5?2*u*u:1-(-2*u+2)**2/2;await page.mouse.move(x+dx*e,y+dy*e);await step(1/FPS);}await page.mouse.up();};
const slide=async(sel,from,to,seconds)=>{const n=Math.round(seconds*FPS);for(let i=0;i<=n;i++){await page.evaluate(([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},[sel,from+(to-from)*i/n]);await step(1/FPS);}await page.evaluate(s=>document.querySelector(s).dispatchEvent(new Event('change',{bubbles:true})),sel);};
const glide=async(sel,seconds=1.4,offset=14)=>{const y0=await page.evaluate(()=>scrollY),y1=await page.evaluate(([s,o])=>{const e=document.querySelector(s);return Math.max(0,e.getBoundingClientRect().top+scrollY-o);},[sel,offset]);const n=Math.round(seconds*FPS);for(let i=1;i<=n;i++){const u=i/n,e=u<.5?2*u*u:1-(-2*u+2)**2/2;await page.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,y);},y0+(y1-y0)*e);await step(1/FPS);}};
if(desktop){
 await step(6.4);await step(1.2);await glide('#explorer',1.6);   // build-in, then the reader scrolls to the stage
 await step(41);                                                // Figure 3 → inset → 3D channel → the event plays
 await drag(-200,24);await step(1);
 await slide('#progress',0,1000,4.5);await step(1);await slide('#progress',1000,450,2);await step(.8);
 await click('.ion-chips button[data-ion="3"]');await step(2.6);await click('.ion-chips button[data-ion="3"]');await step(.6);
 await click('[data-compare="single"]');await step(1);await click('#play');await step(8);
 await click('[data-compare="concerted"]');await step(1.2);
 await click('[data-framework="full"]');await step(2.6);await click('[data-framework="none"]');await step(2.2);await click('[data-framework="cages"]');await step(1.4);
 await glide('#explorer',.8);await click('[data-display="3"]');await step(3);await click('[data-display="model"]');await step(1.2);
 await click('[data-question="sites"]');await step(3.4);await click('[data-occupancy="average"]');await step(3.4);
 await click('[data-context="true"]');await step(4.2);await click('[data-context="false"]');await step(2.4);
 await glide('#explorer',.8);await click('[data-question="barrier"]');await step(3.6);await click('#play');await step(8);
 await slide('#coulomb',3,6,2.5);await step(1);await slide('#coulomb',6,2,2.5);await step(1);
 await click('[data-landscape="b"]');await step(1);await click('#play');await step(8);
 await glide('#explorer',.8);await click('[data-display="4"]');await step(3.2);await click('[data-display="chain"]');await step(1.5);
}else{
 await step(6.4);await step(2.5);await glide('#explorer',1.6);
 await step(41);
 await drag(-120,0);await step(1);
 await slide('#progress',0,1000,4);await step(.8);
 await glide('#caption-title',1.2,10);await step(4);await glide('#event-plot',1,20);await slide('#progress',1000,300,2.5);await step(1);
 await click('[data-compare="single"]');await step(.6);await glide('.stage-column',1,10);await step(.4);await page.evaluate(()=>document.getElementById('play').click());await step(8);
 await glide('#explorer',1,10);await click('[data-question="barrier"]');await glide('#explorer',.6,10);await step(1);await page.evaluate(()=>document.getElementById('play').click());await step(8);
 await glide('#caption-title',1.2,10);await step(3);await glide('#model-block',1,40);await click('[data-landscape="b"]');await glide('.stage-column',1,10);await step(.4);await page.evaluate(()=>document.getElementById('play').click());await step(8);
}
await browser.close();
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',`${dir}/%05d.jpg`,'-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p','-crf','21','-movflags','+faststart',out]);
console.log('frames',frame,'seconds',clock.toFixed(1),'→',out);
