// Browser controller check for site/fast-ion-diffusion.html.
// Serve site/ on :4173 (python3 -m http.server 4173 --directory site), then:
//   node production/fast-ion-diffusion/verification/browser-check.mjs [path-to-playwright]
// Exercises every control and asserts that the scene, plots, readout and words describe the same state.
const pw=process.argv[2]||'/opt/node22/lib/node_modules/playwright/index.mjs';
const {chromium}=await import(pw);
const URL='http://127.0.0.1:4173/fast-ion-diffusion.html';
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist','--enable-unsafe-swiftshader']});
let failures=0,passes=0;const ok=(c,m)=>{if(c)passes++;else{failures++;console.log('FAIL',m);}};
const errors=[];
async function open(q='',size={width:1512,height:982},extra={}){
 const p=await b.newPage({viewport:size,...extra});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(URL+'?'+q);await p.waitForFunction(()=>document.documentElement.dataset.ready==='true');
 await p.evaluate(()=>document.getElementById('explorer').scrollIntoView());await p.waitForTimeout(400);return p;}
const st=p=>p.evaluate(()=>figState());
const text=(p,id)=>p.evaluate(i=>document.getElementById(i).textContent,id);

// 1. Later visit: no opening, model shown, synchronized defaults.
{const p=await open('no-opening');const s=await st(p);
 ok(!s.opening&&s.display==='model'&&s.question==='event','opens on the model without the opening');
 ok((await text(p,'caption-title')).includes('Every ion advances'),'caption matches the event question');
 // Scrub: progress, plot marker and readout agree.
 await p.locator('#progress').fill('500');await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>({s:figState().progress,read:document.getElementById('readout').textContent,val:document.getElementById('progress-value').textContent}));
 ok(Math.abs(r.s-.5)<1e-9,'scrub sets progress');ok(/0\.22 eV/.test(r.read)&&/image 9 of 17/.test(r.read),'readout follows Fig. 3b at s = 0.5: '+r.read);ok(r.val==='0.50','value label');
 // Ion positions are the interpolated ones.
 const d=await p.evaluate(()=>{const sc=figScene,D=figData.DATA;return sc.ions.map((m,i)=>{const io=D.ions[i];return Math.hypot(...[0,1,2].map(k=>m.position.getComponent(k)-(io.start[k]+(io.end[k]-io.start[k])*.5)));});});
 ok(Math.max(...d)<.02,'ion meshes sit at the interpolated positions (max off '+Math.max(...d).toFixed(3)+' Å)');
 // Compare: single ion.
 await p.click('[data-compare="single"]');await p.waitForTimeout(900);
 let s2=await st(p);ok(s2.compare==='single'&&s2.progress===0,'single-ion compare resets the coordinate');
 ok((await text(p,'caption-title')).includes('0.58'),'caption switches to the single-ion landscape');
 await p.locator('#progress').fill('500');await p.waitForTimeout(250);ok(/0\.5[78] eV/.test(await text(p,'readout')),'single readout near the 0.58 eV top');
 await p.click('[data-compare="concerted"]');
 // Ion select via chip and via canvas pick.
 await p.click('.ion-chips button[data-ion="3"]');ok((await st(p)).selection?.id===3,'chip selects ion 3');
 ok((await text(p,'selection')).length>20,'selection panel explains the ion');
 await p.click('.ion-chips button[data-ion="3"]');ok((await st(p)).selection===null,'second press clears');
 const xy=await p.evaluate(()=>{const sc=figScene,m=sc.ions[1],r=document.getElementById('channel').getBoundingClientRect(),q=sc.project([m.position.x,m.position.y,m.position.z]);return {x:r.left+q.x,y:r.top+q.y};});
 await p.mouse.click(xy.x,xy.y);await p.waitForTimeout(200);const sel=(await st(p)).selection;ok(sel?.kind==='ion'&&sel.id===2,'click on ion 2 in the canvas selects it: '+JSON.stringify(sel));
 // Drag rotates without selecting.
 const before=await p.evaluate(()=>figScene.pose.quat.toArray());await p.mouse.move(400,600);await p.mouse.down();await p.mouse.move(520,620,{steps:6});await p.mouse.up();await p.waitForTimeout(200);
 const after=await p.evaluate(()=>figScene.pose.quat.toArray());ok(before.some((v,i)=>Math.abs(v-after[i])>1e-3),'drag rotates the view');
 // Keyboard on the canvas.
 await p.focus('#channel');const k0=await p.evaluate(()=>figScene.pose.quat.toArray());await p.keyboard.press('ArrowLeft');await p.waitForTimeout(900);
 const k1=await p.evaluate(()=>figScene.pose.quat.toArray());ok(k0.some((v,i)=>Math.abs(v-k1[i])>1e-3),'arrow key rotates');
 await p.click('[data-camera="reset"]');await p.waitForTimeout(1200);
 // Framework modes.
 for(const f of ['full','none','cages']){await p.click(`[data-framework="${f}"]`);await p.waitForTimeout(1500);const v=await p.evaluate(()=>({...figScene.view}));ok((await st(p)).framework===f,'framework '+f);
  if(f==='full')ok(v.zr>.9&&v.la>.9,'full framework shows ZrO6 and La');if(f==='none')ok(v.cages<.1&&v.anions<.1,'lithium only hides cages and oxygen');}
 // Play runs and stops at the end.
 await p.click('#play');await p.waitForTimeout(1500);const pl=await st(p);ok(pl.playing&&pl.progress>0,'play advances');
 await p.click('#play');ok(!(await st(p)).playing,'pause stops');
 // Display switch keeps the event state.
 await p.click('[data-display="3"]');let s3=await st(p);ok(s3.display==='3','Figure 3 opens');ok(await p.isVisible('#paper-view'),'paper view visible');
 await p.click('#figure-in');await p.waitForTimeout(200);await p.click('[data-display="model"]');s3=await st(p);ok(s3.display==='model'&&Math.abs(s3.progress-pl.progress)<.2,'returning keeps the coordinate');
 // Question tabs keep each question's progress.
 await p.locator('#progress').fill('700');await p.click('[data-question="barrier"]');s3=await st(p);ok(s3.display==='chain','barrier opens on the 1D model');await p.waitForTimeout(400);
 ok((await p.evaluate(()=>getComputedStyle(document.querySelector('.scene-content')).visibility))==='hidden','3D scene steps aside for the 1D model');
 await p.locator('#coulomb').fill('6');await p.waitForTimeout(150);s3=await st(p);ok(s3.K===6,'K slider');
 await p.click('[data-landscape="b"]');ok((await text(p,'caption-title')).includes('dip'),'landscape b caption');
 await p.click('[data-question="event"]');s3=await st(p);ok(Math.abs(s3.progress-.7)<1e-9,'event progress restored after visiting another question');
 await p.click('[data-question="sites"]');ok(await p.isHidden('#transport-block'),'sites has no scrubber');
 await p.click('[data-occupancy="average"]');await p.waitForTimeout(800);ok((await p.evaluate(()=>figScene.view.average))>.9,'average occupancy shown');
 await p.click('[data-context="true"]');await p.waitForTimeout(1600);ok((await p.evaluate(()=>figScene.view.cell))>.9,'whole cell shown');
 // Tab keyboard navigation.
 await p.focus('[data-question="sites"]');await p.keyboard.press('ArrowRight');ok((await st(p)).question==='event','arrow keys move between questions');
 await p.close();}

// 2. First visit: the opening runs, any input hands over.
{const p=await open('intro');await p.waitForTimeout(6500);let s=await st(p);ok(s.opening&&s.display==='3','opening starts on Figure 3');
 await p.mouse.click(300,700);await p.waitForTimeout(300);s=await st(p);ok(!s.opening&&s.display==='model','a click on the stage ends the opening on the model');await p.close();}
{const p=await open('intro');await p.waitForTimeout(500);await p.click('#explore');const s=await st(p);ok(!s.opening,'Explore now skips');await p.close();}

// 3. Reduced motion and no WebGL.
{const p=await open('',{width:1512,height:982},{reducedMotion:'reduce'});const s=await st(p);ok(!s.opening&&s.display==='model'&&s.reduced,'reduced motion: no opening');
 const anims=await p.evaluate(()=>document.getAnimations().filter(a=>/^build-/.test(a.animationName||'')).length);ok(anims===0,'reduced motion: no build-in');await p.close();}
{const p=await open('no-webgl');const s=await st(p);ok(s.display==='3','no WebGL falls back to the figure');ok(await p.isVisible('#fallback'),'fallback note shown');
 ok(await p.isDisabled('[data-display="model"]'),'3D button disabled without WebGL');await p.locator('#progress').fill('500');ok(/0\.22 eV/.test(await text(p,'readout')),'plots and readout still work without WebGL');await p.close();}

// 4. Phone: no horizontal overflow, controls reachable.
{const p=await open('no-opening',{width:390,height:844},{isMobile:true,hasTouch:true,deviceScaleFactor:2});
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=390),'phone: no horizontal scroll');
 const chips=await p.evaluate(()=>[...document.querySelectorAll('.ion-chips button')].map(b=>Math.round(b.getBoundingClientRect().top)));ok(new Set(chips).size===1,'phone: five ion chips on one row');
 await p.close();}

console.log(`${passes} passed, ${failures} failed`);if(errors.length)console.log('page errors:',errors);
await b.close();process.exit(failures||errors.length?1:0);
