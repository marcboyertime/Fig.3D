// Pure schematic geometry. Scientific scope and source mapping: references/silicon-nanowire/scientific-notes.md.
export const LENGTH=14, TAU=Math.PI*2;
export const AXES={x1:[1,-1,0],x2:[1,1,-1],x3:[1,1,2]};
export const HOME={yaw:.70,elevation:.48,halfHeight:6.3};
export const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,Number(v)||0));
export const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
export const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
export const localProgress=(p,s)=>smooth(0,.65,1.7*clamp(p)-clamp(s));
export const zAt=s=>LENGTH*(.5-clamp(s));
export function section(p,s){
 const q=localProgress(p,s),a=1+1.62*q,n=.34*smooth(.35,.95,q);
 let ymax=0;for(let i=0;i<=80;i++){const t=Math.PI*i/80;const yy=Math.sin(t)*(1-n*Math.exp(-((Math.cos(t)/.34)**2)));ymax=Math.max(ymax,yy);}
 const b=(1+.14*q)/ymax;
 const cy=Math.pow(1-q,.58),cx=Math.pow(1-q,1.45);
 return {q,a,b,n,cx,cy,z:zAt(s)};
}
export function outer(t,d){const x=d.a*Math.cos(t);return [x,d.b*Math.sin(t)*(1-d.n*Math.exp(-((Math.cos(t)/.34)**2)))];}
export function core(t,d){return [d.cx*Math.cos(t),d.cy*Math.sin(t)];}
export function contour(p,s,count=160){const d=section(p,s);return {d,outer:Array.from({length:count},(_,i)=>outer(TAU*i/count,d)),core:Array.from({length:count},(_,i)=>core(TAU*i/count,d))};}
export function initialState(reduced=false){return {question:'shape',field:'material',progress:.48,slice:.40,open:true,display:reduced?'model':'5',playing:false,reduced,stressStage:'late',opening:!reduced,openingPaused:false};}
export function reduce(s,a){
 switch(a.type){
  case 'progress':return {...s,progress:clamp(a.value),playing:a.playing??false,opening:false};
  case 'slice':return {...s,slice:clamp(a.value),opening:false};
  case 'play':return {...s,display:'model',opening:false,playing:!s.playing,progress:s.progress>=1?0:s.progress};
  case 'field':return {...s,field:a.value,question:['normal','mises'].includes(a.value)?'stress':'shape',playing:false,display:'model',opening:false};
  case 'question':return {...s,question:a.value,stressStage:a.value==='stress'?'late':s.stressStage,field:a.value==='stress'?'normal':'material',progress:a.value==='shape'?s.progress:.48,slice:a.value==='shape'?s.slice:.40,display:'model',opening:false,playing:false};
  case 'stress-stage':return {...s,stressStage:a.value,progress:a.value==='early'?.18:.48,slice:a.value==='early'?.12:.40,playing:false,opening:false};
  case 'display':return {...s,display:a.value,playing:false,opening:false};
  case 'open':return {...s,open:!s.open,opening:false};
  case 'reduced':return {...s,reduced:a.value,opening:false,playing:false,display:'model'};
  case 'stop-opening':return {...s,opening:false,display:'model'};
  default:return s;
 }
}
export function orbit(p,dx,dy,w,h){return {...p,yaw:p.yaw-dx/w*Math.PI*1.6,elevation:clamp(p.elevation+dy/h*Math.PI*1.2,-1.25,1.25)};}
export const FIGURES={
 '5':{file:'figure-5.jpeg',width:1042,height:589,title:'Figure 5 · model, stress & microscopy',caption:'a–b: simulated lithiation and tapered core. c: TEM image. d–e: modeled lithium and von Mises stress. f: neck-growth schematic with a normal-stress section.'},
 '1':{file:'figure-1.jpeg',width:1736,height:859,title:'Figure 1 · the experimental comparison',caption:'Tilting exposes a dumbbell-shaped lithiated section in both solid and liquid cells (e–f), compared with the round pristine wire (g).'},
 '2':{file:'figure-2.jpeg',width:1218,height:1543,title:'Figure 2 · an advancing front and a crack',caption:'a–i: observed lithiation sequence. l: lithium-rich shell around a depleted core. m–o: imaging and line scans support the presence of a crack and residual core.'},
 '3':{file:'figure-3.jpeg',width:834,height:805,title:'Figure 3 · one wire, two viewing directions',caption:'The same lithiated wire looks narrow in g and much wider after tilting in h. The crystal directions, not the camera, determine its expansion.'},
 's10':{file:'figure-s10.jpeg',width:2556,height:2055,title:'Figure S10 · stress changes sign',caption:'a–b: early surface compression and central tension. c–d: post-necking surface tension and central compression. Original calculated σ₁₁ profiles and sections.'}
};
