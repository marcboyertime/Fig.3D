// Stills of every meaningful state on a virtual clock (SwiftShader is slow; motion is stepped exactly).
// node tour.mjs <width> <height> <outPrefix> [dpr]
import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [,,w,h,prefix,dpr='1']=process.argv;
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:+dpr});
page.on('pageerror',e=>console.log('pageerror',e.message));
page.on('console',m=>{if(['error','warning'].includes(m.type()))console.log('console',m.text())});
await page.addInitScript(()=>{let t=0,id=0;const pending=new Map();performance.now=()=>t;window.requestAnimationFrame=cb=>{pending.set(++id,cb);return id;};window.cancelAnimationFrame=i=>pending.delete(i);
 window.__step=(ms,n=1)=>{for(let k=0;k<n;k++){t+=ms;for(const an of document.getAnimations()){an.pause();an.currentTime=(an.currentTime||0)+ms;}const cbs=[...pending.values()];pending.clear();for(const cb of cbs)try{cb(t);}catch(e){console.error(e);}}};});
await page.goto('http://localhost:4173/silicon-nanowire.html'+(process.env.Q||''));
await page.waitForFunction(()=>window.figState);
for(let i=0;i<30;i++){await page.evaluate(()=>window.__step(0));await page.waitForTimeout(80);}
const step=async s=>{const n=Math.round(s*10);for(let i=0;i<n;i+=5)await page.evaluate(k=>window.__step(100,k),Math.min(5,n-i));await page.waitForTimeout(60);};
const vp=async n=>{await page.screenshot({path:`${prefix}-${n}.png`,timeout:180000});console.log('shot',n);};
const ex=async n=>{await page.locator('#explorer').screenshot({path:`${prefix}-${n}.png`,timeout:180000});console.log('shot',n);};
const click=async sel=>{await page.evaluate(s=>document.querySelector(s).click(),sel);};
const glide=async(sel,seconds=1.4)=>{const y0=await page.evaluate(()=>scrollY),y1=await page.evaluate(s=>{const e=document.querySelector(s);return Math.max(0,e.getBoundingClientRect().top+scrollY-14);},sel);const n=Math.round(seconds*(typeof FPS==='number'?FPS:10));for(let i=1;i<=n;i++){const u=i/n,e=u<.5?2*u*u:1-(-2*u+2)**2/2;await page.evaluate(y=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,y);},y0+(y1-y0)*e);await step(1/(typeof FPS==='number'?FPS:10));}};
const only=process.env.ONLY;
if(!only||only==='open'){
 for(const [t,n] of [[.6,'b0'],[1.2,'b1'],[1.6,'b2'],[1.4,'b3'],[1.4,'b4']]){await step(t);await vp(n);}
 await glide('#explorer');await step(3);await vp('o0-paper');
 // into the emergence
 for(const [t,n] of [[4.5,'o1-zoom'],[2,'o2-zoomed'],[1,'o3-reveal'],[1.2,'o4-lift'],[2,'o5-lifted'],[3,'o6-open'],[5,'o7-sweep'],[6,'o8-end']]){await step(t);await vp(n);}
}
if(!only||only==='states'){
 if(only)await click('#explore');
 await step(2);await ex('s0-swelling');
 await page.evaluate(()=>{const e=document.querySelector('#progress');e.value=0;e.dispatchEvent(new Event('input',{bubbles:true}));});await step(2);await ex('s1-p0');
 await page.evaluate(()=>{const e=document.querySelector('#progress');e.value=100;e.dispatchEvent(new Event('input',{bubbles:true}));});await step(2);await ex('s2-p100');
 await page.evaluate(()=>{const e=document.querySelector('#progress');e.value=45;e.dispatchEvent(new Event('input',{bubbles:true}));});await step(1);
 for(const v of ['x1','x2','axis']){await click(`[data-view=${v}]`);await step(2);await ex('s3-view-'+v);}
 await click('[data-view=oblique]');await step(1.5);
 await click('#cut');await step(2.5);await ex('s4-closed');await click('#cut');await step(2);
 await click('#tab-stress');await step(.5);await ex('s5a-stress-mid');await step(2.5);await ex('s5-stress-late');
 await click('[data-stress=early]');await step(2.5);await ex('s6-stress-early');
 await click('[data-stress=mises]');await step(2.5);await ex('s7-mises');
 await click('#tab-fracture');await step(3);await ex('s8-fracture');
 for(const d of ['2','3','5']){await click(`[data-display="${d}"]`);await step(1);await ex('s9-fig'+d);}
 await click('[data-display=model]');await step(1);await ex('s10-back');
 await click('#tab-swelling');await step(3);await ex('s11-swelling-again');
}
await browser.close();
