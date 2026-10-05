// Frame-exact review recording on a virtual clock (rAF, performance.now and CSS animations),
// so motion plays at its authored speed even though SwiftShader renders slowly.
// node record-review.mjs desktop|phone out.mp4
import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
const [,,kind,out]=process.argv;
const desktop=kind==='desktop',FPS=24,dir=`${os.tmpdir()}/fig3d-sn-frames-${kind}`;
fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage(desktop?{viewport:{width:1512,height:982}}:{viewport:{width:390,height:844},deviceScaleFactor:2});
page.on('pageerror',e=>console.log('pageerror',e.message));
await page.addInitScript(()=>{let t=0,id=0;const pending=new Map();performance.now=()=>t;window.requestAnimationFrame=cb=>{pending.set(++id,cb);return id;};window.cancelAnimationFrame=i=>pending.delete(i);
 window.__step=ms=>{t+=ms;for(const an of document.getAnimations()){an.pause();an.currentTime=(an.currentTime||0)+ms;}const cbs=[...pending.values()];pending.clear();for(const cb of cbs)try{cb(t);}catch(e){console.error(e);}};
 // Hold CSS animations at zero until the clock starts.
 document.addEventListener('animationstart',e=>{},true);});
await page.goto('http://localhost:4173/silicon-nanowire.html');
await page.waitForFunction(()=>window.figState);
await page.evaluate(()=>{for(const an of document.getAnimations()){an.pause();an.currentTime=0;}});
for(let i=0;i<30;i++){await page.evaluate(()=>window.__step(0));await page.waitForTimeout(100);}
let frame=0,clock=0;
const step=async s=>{const n=Math.round(s*FPS);for(let i=0;i<n;i++){await page.evaluate(ms=>window.__step(ms),1000/FPS);await page.screenshot({path:`${dir}/${String(frame++).padStart(5,'0')}.jpg`,type:'jpeg',quality:88,timeout:180000});clock+=1/FPS;}};
const box=async sel=>{const b=await page.locator(sel).boundingBox();return b;};
const click=async sel=>{await page.evaluate(s=>{const e=document.querySelector(s);const r=e.getBoundingClientRect();if(r.top<0||r.bottom>innerHeight)e.scrollIntoView({block:'center'});},sel);const b=await box(sel);await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.up();};
const drag=async(dx,dy,seconds=1.4)=>{const b=await box('#wire');const x=b.x+b.width/2,y=b.y+b.height*.5,n=Math.round(seconds*FPS);await page.mouse.move(x,y);await page.mouse.down();for(let i=1;i<=n;i++){const u=i/n,e=u<.5?2*u*u:1-(-2*u+2)**2/2;await page.mouse.move(x+dx*e,y+dy*e);await step(1/FPS);}await page.mouse.up();};
const slide=async(sel,from,to,seconds)=>{const n=Math.round(seconds*FPS);for(let i=0;i<=n;i++){await page.evaluate(([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},[sel,from+(to-from)*i/n]);await step(1/FPS);}};
const scrollTo=async(sel,block='start')=>page.evaluate(([s,b])=>document.querySelector(s).scrollIntoView({block:b}),[sel,block]);
const glide=async(sel,seconds=1.4)=>{const y0=await page.evaluate(()=>scrollY),y1=await page.evaluate(s=>{const e=document.querySelector(s);return Math.max(0,e.getBoundingClientRect().top+scrollY-14);},sel);const n=Math.round(seconds*(typeof FPS==='number'?FPS:10));for(let i=1;i<=n;i++){const u=i/n,e=u<.5?2*u*u:1-(-2*u+2)**2/2;await page.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,y);},y0+(y1-y0)*e);await step(1/(typeof FPS==='number'?FPS:10));}};
if(desktop){
 await step(6.4);                                  // first-visit build-in
 await step(2.5);await glide('#explorer',1.6);       // the reader scrolls to the figure
 await step(38);                                   // Figure 5, emergence, lid, section sweep
 await drag(-220,30);await step(1.2);
 await slide('#progress',45,100,3);await step(.6);await slide('#progress',100,30,2.5);await step(1);
 await slide('#slice',62,15,2.5);await step(1);
 await click('[data-view=x1]');await step(2.4);await click('[data-view=x2]');await step(2.4);await click('[data-view=axis]');await step(2.4);await click('[data-view=oblique]');await step(2);
 await click('[data-display="3"]');await step(3);await click('[data-display=model]');await step(1.5);
 await click('#tab-stress');await step(4);await click('[data-stress=early]');await step(3.5);await click('[data-stress=late]');await step(3);await click('[data-stress=mises]');await step(3);
 await click('#tab-fracture');await step(4.5);await click('[data-display="2"]');await step(3);await click('[data-display=model]');await step(1.5);
 await click('#tab-swelling');await step(3.5);
}else{
 await step(6.4);await step(3);await glide('#explorer',1.6);await step(38);
 await drag(-140,0);await step(1);
 await scrollTo('.stage-column');await slide('#progress',45,100,2.5);await slide('#progress',100,45,2);
 await click('[data-view=x1]');await step(2.2);await click('[data-view=x2]');await step(2.2);await click('[data-view=oblique]');await step(1.8);
 await scrollTo('#explorer');await click('#tab-stress');await step(3.5);await click('[data-stress=early]');await step(3);
 await scrollTo('#explorer');await click('#tab-fracture');await step(4);
 await click('[data-display="2"]');await step(2.5);await click('[data-display=model]');await step(1.5);
}
await browser.close();
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',`${dir}/%05d.jpg`,'-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p','-crf','21','-movflags','+faststart',out]);
console.log('frames',frame,'seconds',clock.toFixed(1),'→',out);
