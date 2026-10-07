// Real controller, fake DOM and renderer: state and control contracts, not visual evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as model from './silicon-nanowire-model.mjs';
const code=fs.readFileSync(new URL('./silicon-nanowire.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'')+'\nglobalThis.subject={get state(){return state},get scene(){return scene},get emergence(){return emergence},dispatch,setDisplay,sync};';
function mount(query='?reduced'){
 const nodes=new Map(),groups=new Map();
 const make=id=>({id,value:'',src:'',href:'',textContent:'',innerHTML:'',hidden:false,disabled:false,tabIndex:0,style:{setProperty(k,v){this[k]=v}},attrs:{},dataset:{},events:{},offsetWidth:100,offsetHeight:20,clientWidth:800,clientHeight:600,scrollWidth:800,scrollHeight:600,scrollTop:0,scrollLeft:0,
  classes:new Set(),get classList(){const c=this.classes;return {add:k=>c.add(k),remove:k=>c.delete(k),toggle:(k,on)=>{on??=!c.has(k);on?c.add(k):c.delete(k);return on},contains:k=>c.has(k)}},
  append(){},prepend(){},focus(){},scrollTo(){},closest(){return null},querySelector:s=>node(s),getBoundingClientRect:()=>({left:0,top:0,width:800,height:600}),setPointerCapture(){},
  setAttribute(k,v){this.attrs[k]=String(v)},addEventListener(k,f){(this.events[k]??=[]).push(f)},fire(k,e={}){for(const f of this.events[k]??[])f({target:this,currentTarget:this,preventDefault(){},key:'',...e})},click(){this.fire('click')}});
 const node=id=>{if(!nodes.has(id))nodes.set(id,make(id));return nodes.get(id)};
 for(const [name,values] of Object.entries({question:['swelling','stress','fracture'],display:['model','5','3','2','1','s10'],stress:['early','late','mises'],camera:['left','right','up','down','in','out','reset'],view:['oblique','x1','x2','axis'],label:['shell','core','front','supply','neck','tension','compression']}))
  groups.set(`[data-${name}]`,values.map(v=>{const el=node(`${name}-${v}`);el.dataset[name]=v;return el}));
 const media={matches:false,addEventListener(){}};
 class WireScene{constructor(c,cb){this.cb=cb;this.pose={...model.HOME};this.animators=new Set();this.view={progress:.45,slice:.4,trim:0,muted:0,open:1,neck:0,arrows:0,ring:1};this.width=800;this.height=600}setState(s){this.state=s}animate(f){this.animators.add(f);return()=>this.animators.delete(f)}control(){}moveTo(p){this.pose={...p}}wake(){}stop(){}project(){return {x:0,y:0}}
  tick(dt,n=1){for(let i=0;i<n;i++)for(const f of [...this.animators])if(f(0,dt)===false)this.animators.delete(f)}}
 class PaperEmergence{constructor(){this.active=false}texture(){return Promise.resolve()}cancel(){this.active=false}yieldCamera(){}finish(){this.active=false;this.opts?.onDone?.()}run(im,opts){this.active=true;this.opts=opts;return Promise.resolve()}}
 const context={...model,WireScene,PaperEmergence,Annotations:class{show(){}hide(){}frame(){}select(){}},swapFigure:(img,key,src,apply)=>{img.src=src;img.dataset.key=key;apply();},fitStage:()=>null,PALETTE:{crystal:'#4f7be0',front:'#e8b44e',lithiated:'#d4553b',mutedShell:'#8e97ab',mutedCore:'#55638a',tension:'#ffb27a',compression:'#9fc2ff'},PROFILE:{zoom:2600,reveal:1500,lift:3200},
  matchMedia:()=>media,URLSearchParams,location:{search:query},console:{warn(){},error(){}},requestAnimationFrame:f=>f(),addEventListener(){},window:{},
  document:{documentElement:{classList:{contains:()=>false}},getElementById:node,querySelectorAll:s=>groups.get(s)||[],querySelector:s=>node(s),body:node('body'),activeElement:null}};
 context.window=context;vm.createContext(context);vm.runInContext(code,context);return {subject:context.subject,node,groups};
}
const pressed=(node,key)=>node('display-'+key).attrs['aria-pressed']==='true';

// Reduced motion starts in the model, with the selected button telling the truth.
{const {subject:t,node}=mount();
 assert.equal(t.state.display,'model');assert.ok(pressed(node,'model'));assert.equal(node('stage').classes.has('showing-paper'),false);
 t.dispatch({type:'progress',value:.64});t.dispatch({type:'slice',value:.27});const saved={...t.state};
 for(const f of ['5','3','1','model']){t.setDisplay(f);assert.ok(pressed(node,f));assert.equal(node('stage').classes.has('showing-paper'),f!=='model');assert.equal(t.state.progress,saved.progress);assert.equal(t.state.slice,saved.slice);}
 // A figure is captioned in the sidebar while it is on stage.
 t.setDisplay('3');assert.match(node('caption-kicker').textContent,/Figure 3/);assert.equal(node('paper-details').hidden,false);t.setDisplay('model');
 // Play advances; pause holds.
 t.dispatch({type:'play'});t.scene.tick(1);assert.ok(t.state.progress>.64);t.dispatch({type:'play'});const p=t.state.progress;t.scene.tick(1);assert.equal(t.state.progress,p);
 // Each question shows its own figures and its own original panel.
 t.dispatch({type:'question',value:'stress'});assert.equal(node('display-s10').hidden,false);assert.equal(node('display-3').hidden,true);assert.ok(node('reference-image').src.endsWith('stress-late.png'));assert.match(node('caption-title').textContent,/pulled open/);
 t.dispatch({type:'stress',value:'early'});assert.ok(node('reference-image').src.endsWith('stress-early.png'));assert.equal(t.state.progress,model.PRESETS.stress.early.progress);assert.match(node('caption-title').textContent,/squeezed/);
 t.dispatch({type:'stress',value:'mises'});assert.ok(node('reference-image').src.endsWith('von-mises.jpeg'));assert.equal(node('reference-open').dataset.figure,'5');
 node('reference-open').fire('click',{currentTarget:node('reference-open')});assert.equal(t.state.display,'5');assert.ok(pressed(node,'5'));t.setDisplay('model');
 t.dispatch({type:'question',value:'fracture'});assert.ok(node('reference-image').src.endsWith('crack-observation.jpeg'));assert.equal(node('display-2').hidden,false);assert.equal(node('display-s10').hidden,true);
 t.dispatch({type:'question',value:'swelling'});assert.equal(t.state.progress,saved.progress>=1?0:t.state.progress);assert.equal(node('reference').hidden,true);
 // Inspection directions drive the camera exactly.
 node('view-x2').click();assert.ok(Math.abs(t.scene.pose.elevation-Math.PI/2)<.001);assert.equal(node('view-x2').attrs['aria-pressed'],'true');
}
// The opening: Figure 5 first, the model only after the hand-over, any input ends it for good.
{const {subject:t,node}=mount('');
 assert.equal(t.state.display,'5');assert.ok(pressed(node,'5'));assert.equal(t.state.opening,true);assert.match(node('caption-kicker').textContent,/Figure 5/);
 t.scene.tick(.1,140);assert.equal(t.state.beat,1);assert.ok(t.emergence.opts,'emergence started from the printed figure');assert.ok(pressed(node,'5'),'still the figure until the swap');
 t.emergence.opts.onSwap();assert.ok(pressed(node,'model'));t.emergence.finish();
 t.scene.tick(.1,120);assert.equal(t.state.beat,2);assert.equal(t.state.open,true);
 node('explore').click();assert.equal(t.state.opening,false);assert.equal(node('opening-controls').hidden,true);assert.equal(t.state.display,'model');assert.equal(node('controls').classes.has('dimmed'),false);
 const beat=t.state.beat;t.scene.tick(.1,200);assert.equal(t.state.opening,false,'opening never resumes');
}
// Without WebGL the linked section still answers the slider.
{const {subject:t,node}=mount('?no-webgl');assert.equal(node('fallback').hidden,false);t.setDisplay('model');t.dispatch({type:'slice',value:.7});assert.ok(node('section-svg').attrs['aria-label'].includes('70 percent'));}
console.log('PASS: truthful figure/model buttons, state preserved across figures, figure captions, play/pause, per-question figures and source panels, stress presets, exact x2 view, opening beats and hand-over, no-WebGL section. Fake DOM; browser review remains separate.');
