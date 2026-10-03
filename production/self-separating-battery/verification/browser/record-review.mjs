// Frame-exact review recording: the page runs on a virtual clock (rAF + performance.now),
// so motion plays at its real authored speed even though SwiftShader renders slowly.
import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
const [,,kind,out]=process.argv;
const desktop=kind==='desktop',FPS=24,dir=`${os.tmpdir()}/fig3d-frames-${kind}`;
fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage(desktop?{viewport:{width:1512,height:982}}:{viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:false});
page.on('pageerror',e=>console.log('pageerror',e.message));
await page.addInitScript(()=>{
 let t=0,id=0;const pending=new Map();
 performance.now=()=>t;
 window.requestAnimationFrame=cb=>{pending.set(++id,cb);return id;};
 window.cancelAnimationFrame=i=>pending.delete(i);
 window.__step=ms=>{t+=ms;const cbs=[...pending.values()];pending.clear();for(const cb of cbs)try{cb(t);}catch(e){console.error(e);}};
});
await page.goto('http://localhost:4173/self-separating-battery.html');
await page.waitForFunction(()=>window.figState);
// Let assets and figure textures load before the clock starts.
for(let i=0;i<40;i++){await page.evaluate(()=>window.__step(0));await page.waitForTimeout(100);}
let frame=0,clock=0;
const step=async(seconds)=>{const n=Math.round(seconds*FPS);for(let i=0;i<n;i++){await page.evaluate(ms=>window.__step(ms),1000/FPS);await page.screenshot({path:`${dir}/${String(frame++).padStart(5,'0')}.jpg`,type:'jpeg',quality:90});clock+=1/FPS;}};
const click=async sel=>{await page.locator(sel).scrollIntoViewIfNeeded();const b=await page.locator(sel).boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.up();};
const drag=async(dx,dy,seconds=1.4)=>{const b=await page.locator('#network').boundingBox();const x=b.x+b.width/2,y=b.y+b.height*.45,n=Math.round(seconds*FPS);await page.mouse.move(x,y);await page.mouse.down();for(let i=1;i<=n;i++){const u=i/n,e=u<.5?2*u*u:1-(-2*u+2)**2/2;await page.mouse.move(x+dx*e,y+dy*e);await step(1/FPS);}await page.mouse.up();};
const slide=async(sel,from,to,seconds)=>{const n=Math.round(seconds*FPS);for(let i=0;i<=n;i++){await page.evaluate(([s,v])=>{const e=document.querySelector(s);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},[sel,from+(to-from)*i/n]);await step(1/FPS);}};
const scrollTo=async sel=>{await page.evaluate(s=>document.querySelector(s).scrollIntoView({block:'start'}),sel);};
if(desktop){
 await step(42);                                   // the full opening at reading speed
 await drag(-260,40);await step(1.2);
 await click('[data-display="1"]');await step(3);await click('[data-display=model]');await step(3);
 await click('#tab-fabrication');await step(2.5);
 for(const s of ['carbon','cathode','sei']){await click(`[data-stage=${s}]`);await step(2.6);}
 await click('[data-display="2"]');await step(3);await click('[data-display=model]');await step(3);
 await click('#tab-interface');await step(5);
 await click('#depth-toggle');await step(2.5);await slide('#depth-slice',20,6,3);await step(1.5);
 await click('#depth-length');await step(1.5);await slide('#depth-length-slider',1,.3,2);await slide('#depth-length-slider',.3,2,2.5);await step(1);
 await click('#depth-formation');await step(3);
 for(let i=1;i<6;i++){await click(`[data-formation="${i}"]`);await step(4.2);}
 await click('[data-display="5"]');await step(3);await click('[data-display=model]');await step(1.5);
 await click('#depth-evidence');await step(3.5);await click('[data-evidence=capacity]');await step(4);
}else{
 await step(42);
 await drag(-150,0);await step(1);
 await click('[data-display="1"]');await step(2.5);await click('[data-display=model]');await step(3);
 await click('#tab-fabrication');await step(2);
 for(const s of ['carbon','cathode','sei']){await click(`[data-stage=${s}]`);await step(2.4);}
 await click('#tab-interface');await step(4);
 await scrollTo('#explorer');await click('#depth-toggle');await scrollTo('#explorer');await step(2.5);await slide('#depth-slice',20,6,2.5);await step(1);
 await scrollTo('#explorer');await click('#depth-formation');await scrollTo('#explorer');await step(3);
 for(let i=1;i<6;i++){await page.evaluate(i=>document.querySelector(`[data-formation="${i}"]`).click(),i);await step(4);}
 await scrollTo('#explorer');await click('#depth-evidence');await scrollTo('#explorer');await step(3);
}
await browser.close();
execFileSync('ffmpeg',['-y','-loglevel','error','-framerate',String(FPS),'-i',`${dir}/%05d.jpg`,'-vf','scale=trunc(iw/2)*2:trunc(ih/2)*2','-c:v','libx264','-pix_fmt','yuv420p','-crf','20','-movflags','+faststart',out]);
console.log('frames',frame,'seconds',clock.toFixed(1),'→',out);
