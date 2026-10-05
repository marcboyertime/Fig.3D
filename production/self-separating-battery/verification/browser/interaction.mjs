import {chromium} from '/opt/node22/lib/node_modules/playwright/index.mjs';
const URL='http://localhost:4173/self-separating-battery.html';
const browser=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
let fails=0;const ok=(c,m)=>{console.log((c?'ok   ':'FAIL ')+m);if(!c)fails++;};
const open=async(q='',opts={})=>{const p=await browser.newPage({viewport:{width:1440,height:1000},...opts});p.errors=[];p.on('pageerror',e=>p.errors.push(e.message));await p.goto(URL+(q||'?no-opening'));if(q)await p.waitForSelector('#network[data-rendered=true]',{timeout:30000}).catch(()=>{});else await p.waitForFunction(()=>window.figState);return p;};
const st=p=>p.evaluate(()=>window.figState),pose=p=>p.evaluate(()=>window.figPose);
const truth=p=>p.evaluate(()=>{const s=window.figState,pressed=[...document.querySelectorAll('[data-display]')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.display),paper=!document.getElementById('paper-view').hidden,emerging=document.getElementById('scene-stage').classList.contains('is-emerging');return {display:s.display,pressed,paper,emerging,ok:pressed.length===1&&pressed[0]===s.display&&(emerging||paper===(s.display!=='model'))};});
const drag=async(p,dx,dy)=>{const b=await p.locator('#network').boundingBox();const x=b.x+b.width/2,y=b.y+b.height/2;await p.mouse.move(x,y);await p.mouse.down();for(let i=1;i<=8;i++)await p.mouse.move(x+dx*i/8,y+dy*i/8);await p.mouse.up();};

// 1. Opening: plays from Figure 1, selection always matches what is visible, pause holds it.
{const p=await open();let s=await st(p);ok(s.opening&&s.display==='1','opening starts on Figure 1');
 let bad=0,seen=new Set();for(let i=0;i<60;i++){const t=await truth(p);seen.add(t.display);if(!t.ok)bad++;await p.waitForTimeout(250);}
 ok(bad===0,`selected button matched visible content in 60 samples over 15 s of opening (displays seen: ${[...seen]})`);
 await p.click('#opening-pause');const a=await p.evaluate(()=>document.getElementById('opening-progress').value??document.getElementById('opening-progress').style.width);await p.waitForTimeout(1500);const b=await p.evaluate(()=>document.getElementById('opening-progress').value??document.getElementById('opening-progress').style.width);
 ok(String(a)===String(b)&&(await st(p)).paused,'pause holds the opening');await p.click('#opening-pause');
 await drag(p,120,0);s=await st(p);ok(!s.opening,'a drag ends the opening');await p.waitForTimeout(4000);s=await st(p);ok(!s.opening&&s.display==='model','control is not taken back');
 ok(p.errors.length===0,'no page errors: '+p.errors.join('; '));await p.close();}

// 2. Drag sign, bounded elevation, keyboard and reset (reduced motion so the camera is immediate).
{const p=await open('?reduced');const a=await pose(p);await drag(p,100,0);const b=await pose(p);ok(b.yaw<a.yaw,'dragging right turns the model so its front follows the pointer (yaw decreases)');
 await drag(p,0,-400);await drag(p,0,-400);const c=await pose(p);ok(Math.abs(c.elevation)<=1.08+1e-9,'elevation stays bounded after large drags ('+c.elevation.toFixed(2)+')');
 await p.focus('#network');const k0=await pose(p);await p.keyboard.press('ArrowRight');await p.waitForTimeout(300);const k1=await pose(p);ok(k1.yaw!==k0.yaw,'arrow keys rotate the focused model');
 await p.click('[data-camera=reset]');await p.waitForFunction(()=>Math.abs(window.figPose.yaw-.56)<1e-6,null,{timeout:6000}).catch(()=>{});const r=await pose(p);ok(Math.abs(r.yaw-.56)<1e-6&&Math.abs(r.elevation-.44)<1e-6,'reset returns to the home pose');
 await p.focus('#tab-architecture');await p.keyboard.press('ArrowRight');await p.waitForTimeout(200);ok((await st(p)).view==='fabrication','arrow keys move between tabs');
 // click (not drag) on a material selects it
 await p.click('#tab-architecture');await p.waitForTimeout(300);const bb=await p.locator('#network').boundingBox();await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(300);const sel=(await st(p)).layer;ok(sel!=='all','a click on the model isolates the material under the pointer ('+sel+')');
 ok(p.errors.length===0,'no page errors: '+p.errors.join('; '));await p.close();}

// 3. Preservation across figure visits and returns, figure zoom kept per figure.
{const p=await open('?reduced');await p.evaluate(()=>{const c=document.getElementById('cut');c.value=40;c.dispatchEvent(new Event('input',{bubbles:true}));});await p.click('[data-layer=cathode]');await drag(p,80,30);
 const s0=await st(p),p0=await pose(p);
 await p.click('[data-display="2"]');await p.click('#figure-in');await p.click('#figure-in');await p.waitForTimeout(300);const w2=await p.evaluate(()=>document.getElementById('paper-image').getBoundingClientRect().width);
 await p.click('[data-display="1"]');await p.waitForTimeout(300);await p.click('[data-display="2"]');await p.waitForTimeout(300);const w2b=await p.evaluate(()=>document.getElementById('paper-image').getBoundingClientRect().width);
 ok(Math.abs(w2-w2b)<1,'Figure 2 keeps its zoom after visiting Figure 1');
 await p.click('[data-display=model]');await p.waitForTimeout(2500);const s1=await st(p),p1=await pose(p);
 ok(s1.cut===s0.cut&&s1.layer===s0.layer&&s1.view===s0.view,'cut, isolated material and view survive figure visits');
 ok(Math.abs(p1.yaw-p0.yaw)<1e-6&&Math.abs(p1.elevation-p0.elevation)<1e-6&&Math.abs(p1.halfHeight-p0.halfHeight)<1e-6,'orientation and zoom return exactly');
 // deeper mode
 await p.click('#depth-toggle');await p.click('#depth-formation');await p.click('[data-formation="3"]');await p.click('[data-display="5"]');await p.waitForTimeout(300);ok((await truth(p)).ok,'Figure 5 selected and shown inside Formation');
 await p.click('[data-display=model]');await p.waitForTimeout(800);const d=await st(p);ok(d.deep?.topic==='formation'&&d.deep.formation===3,'Formation step survives a figure visit');
 await p.click('#depth-toggle');await p.waitForTimeout(1500);const e=await st(p),pe=await pose(p);ok(!e.deep&&e.cut===s0.cut&&e.layer===s0.layer,'leaving Go deeper restores the overview state');ok(Math.abs(pe.yaw-p0.yaw)<1e-3,'and its camera');
 // keyboard on display switch and Escape back to the model
 await p.focus('#display-model');await p.keyboard.press('ArrowRight');await p.waitForTimeout(300);ok((await truth(p)).ok&&(await st(p)).display!=='model','arrow key on the display switch opens a figure with matching selection');
 await p.keyboard.press('Escape');await p.waitForTimeout(1500);ok((await st(p)).display==='model'&&(await truth(p)).ok,'Escape returns to the model');
 ok(p.errors.length===0,'no page errors: '+p.errors.join('; '));await p.close();}

// 4. Rapid interaction, with motion on (return emergences can be interrupted at any point).
{const p=await open();await p.click('#explore');await p.waitForTimeout(500);const order=['1','2','model','1','model','2','2','1','model','model','2','1','model','1','2','model','1','model'];
 for(const d of order){await p.click(`[data-display="${d}"]`);await p.waitForTimeout(40+Math.random()*120);}
 await p.waitForFunction(()=>!document.getElementById('scene-stage').classList.contains('is-emerging'),null,{timeout:30000}).catch(()=>{});await p.waitForTimeout(500);const t=await truth(p);const left=await p.evaluate(()=>document.querySelectorAll('.emerge-transit').length);
 ok(t.ok&&!t.emerging&&left===0&&t.display==='model',`18 rapid switches settle on the last choice with no leftover transit (${JSON.stringify(t)})`);
 await p.click('#tab-fabrication');await p.click('[data-stage=cathode]');await p.click('[data-display="2"]');await p.waitForTimeout(300);await p.click('[data-display=model]');
 let bad=0;for(let i=0;i<12;i++){if(!(await truth(p)).ok)bad++;await p.waitForTimeout(100);}ok(bad===0,'selection stays truthful through the Figure 2 → model emergence');
 await p.waitForTimeout(8000);ok((await st(p)).stage==='cathode','fabrication stage kept through the return');
 ok(p.errors.length===0,'no page errors: '+p.errors.join('; '));await p.close();}

// 5. Reduced motion preference, renderer failure.
{const p=await open('',{reducedMotion:'reduce'});const s=await st(p);ok(!s.opening&&s.display==='model'&&!s.transport,'reduced motion: no opening, model shown, motion off');await p.close();}
{const p=await open('?fallback');await p.waitForTimeout(800);const v=await p.evaluate(()=>({fb:!document.getElementById('fallback').hidden,model:!document.getElementById('display-model').hidden,display:window.figState.display}));
 ok(v.fb&&!v.model&&v.display!=='model','fallback: message shown, 3D button hidden, an original figure shown ('+v.display+')');
 await p.click('#depth-toggle').catch(()=>{});await p.waitForTimeout(300);await p.click('#depth-formation').catch(()=>{});await p.waitForTimeout(300);
 const f=await p.evaluate(()=>({deep:window.figState.deep?.topic,caption:document.getElementById('caption-title').textContent}));ok(f.deep==='formation'&&f.caption.length>0,'fallback: Go deeper explanations still reachable ('+f.caption.replace(/\n/g,' ')+')');
 ok(p.errors.length===0,'no page errors: '+p.errors.join('; '));await p.close();}

// 6. Frame pacing in this software renderer (not representative of a GPU).
{const p=await open();await p.click('#explore');await p.waitForTimeout(1500);const r=await p.evaluate(()=>new Promise(res=>{const t=[];let last=performance.now();const f=now=>{t.push(now-last);last=now;if(t.length<120)requestAnimationFrame(f);else{t.sort((a,b)=>a-b);res({median:t[60],p95:t[114]});}};requestAnimationFrame(f);}));
 console.log('info frame interval in SwiftShader: median',r.median.toFixed(1),'ms, p95',r.p95.toFixed(1),'ms');await p.close();}
console.log(fails?fails+' FAILED':'ALL PASSED');await browser.close();
