// Real controller, fake DOM/renderer: state and control contracts, not visual evidence.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as model from './silicon-nanowire-model.mjs';
const code=fs.readFileSync(new URL('./silicon-nanowire.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'')+'\nglobalThis.subject={get state(){return state},get scene(){return scene},dispatch,enterModel,setPaper,sync};';
function mount(query='?reduced'){
 const nodes=new Map(),groups=new Map();
 const node=id=>{if(!nodes.has(id))nodes.set(id,{id,value:'',src:'',textContent:'',innerHTML:'',hidden:false,style:{},attrs:{},dataset:{},events:{},offsetWidth:100,scrollTop:0,scrollLeft:0,classList:{add(){},remove(){},toggle(){}},append(){},prepend(){},setAttribute(k,v){this.attrs[k]=String(v)},addEventListener(k,f){this.events[k]=f},fire(k,e={}){return this.events[k]?.({target:this,currentTarget:this,...e})}});return nodes.get(id)};
 for(const [name,values] of Object.entries({question:['shape','stress','cracks'],display:['model','5','1','2','3','s10'],stress:['early','late'],camera:['left','right','up','down','in','out','reset'],angle:['oblique','end','x1','x2']}))groups.set(`[data-${name}]`,values.map(v=>{const el=node(`${name}-${v}`);el.dataset[name]=v;return el}));
 const media={matches:false,addEventListener(){}};
 class WireScene {constructor(c,cb){this.cb=cb;this.pose={...model.HOME};this.animators=new Set()}setState(s){this.state=s}animate(f){this.animators.add(f);return()=>this.animators.delete(f)}control(){}moveTo(p){this.pose=p}wake(){}stop(){} tick(dt){for(const f of [...this.animators])if(f(0,dt)===false)this.animators.delete(f)}}
 class PaperEmergence {constructor(){this.active=false}cancel(){this.active=false}interrupt(){this.cancel()}async run(im,opts){this.active=true;this.opts=opts}}
 const context={...model,WireScene,PaperEmergence,matchMedia:()=>media,URLSearchParams,location:{search:query},console:{warn(){}},requestAnimationFrame:f=>f(),addEventListener(){},document:{getElementById:node,querySelectorAll:s=>groups.get(s)||[],querySelector:s=>s==='[data-display="s10"]'?node('display-s10'):node(s)}};
 vm.createContext(context);vm.runInContext(code,context);return {subject:context.subject,node,groups};
}
const {subject:t,node}=mount();
assert.equal(t.state.display,'model');assert.equal(node('display-model').attrs['aria-pressed'],'true');
t.dispatch({type:'progress',value:.64});t.dispatch({type:'slice',value:.27});const saved={...t.state};
for(const f of ['5','1','2','3','model']){t.setPaper(f);assert.equal(node('display-'+f).attrs['aria-pressed'],'true');assert.equal(node('paper').hidden,f==='model');assert.equal(t.state.progress,saved.progress);assert.equal(t.state.slice,saved.slice)}
t.dispatch({type:'play'});t.scene.tick(1);assert.ok(t.state.progress>.64);t.dispatch({type:'play'});const p=t.state.progress;t.scene.tick(1);assert.equal(t.state.progress,p);
t.dispatch({type:'field',value:'normal'});t.dispatch({type:'stress-stage',value:'early'});assert.equal(t.state.progress,.18);assert.equal(t.state.slice,.12);assert.ok(node('reference-image').src.endsWith('stress-early.png'));
t.dispatch({type:'question',value:'shape'});t.dispatch({type:'question',value:'stress'});assert.equal(t.state.stressStage,'late');assert.equal(t.state.progress,.48);assert.ok(node('reference-image').src.endsWith('stress-late.png'));
t.dispatch({type:'field',value:'mises'});assert.ok(node('reference-image').src.endsWith('von-mises.jpeg'));assert.equal(node('transport').hidden,true);
t.dispatch({type:'question',value:'cracks'});assert.ok(node('reference-image').src.endsWith('crack-observation.jpeg'));assert.equal(t.state.playing,false);
node('angle-x2').fire('click');assert.ok(Math.abs(t.scene.pose.elevation-Math.PI/2)<.001);
const opening=mount('');assert.equal(opening.subject.state.display,'5');assert.equal(opening.node('display-5').attrs['aria-pressed'],'true');opening.node('paper-plus').fire('click');assert.equal(opening.subject.state.opening,false);assert.equal(opening.node('opening-controls').hidden,true);
const fallback=mount('?no-webgl');assert.equal(fallback.node('fallback').hidden,false);fallback.subject.setPaper('model');fallback.subject.dispatch({type:'slice',value:.7});assert.ok(fallback.node('section-svg').attrs['aria-label'].includes('70 percent'));
console.log('PASS: controller source/content selection, preserved progression/slice, play/pause, early/late synchronization, stress/evidence panels, exact x2 inspection, zoom interrupts intro, no-WebGL linked-section fallback. Fake DOM; browser review remains separate.');
