import {initialDepth,reduceDepth} from './self-separating-battery-depth.mjs?v=2';
// Geometric interpretation of Tait et al. Fig. 1c / Fig. 2; not a transport solver.
export const PHASES={carbon:{name:'Carbon',role:'Anode · electronic scaffold',color:0x343f51},cathode:{name:'PAQEDOT',role:'Redox-active cathode',color:0x416ce2},sei:{name:'SEI',role:'Ion-permeable interphase',color:0xe9c78b},template:{name:'Template',role:'Removed during pyrolysis',color:0xb6a0d3}};
export const STAGES=['hybrid','carbon','cathode','sei'];
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export const ease=t=>t*t*(3-2*t);
export function orbit(p,dx,dy){return {...p,yaw:p.yaw-dx*.006,elevation:clamp(p.elevation+dy*.006,-1.08,1.08)};}
export function initialState(reduced=false){return {view:'architecture',architecture:'network',stage:'hybrid',layer:'all',cut:0,route:null,transport:!reduced,reduced,opening:!reduced,paused:false,paper:false,deep:null};}
export function reduce(s,action){
 switch(action.type){
 case 'depth-enter':return {...s,deep:initialDepth(),opening:false,paused:false,paper:false};
 case 'depth-exit':return {...s,deep:null,paper:false};
 case 'depth':return s.deep?{...s,deep:reduceDepth(s.deep,action.action)}:s;
 case 'view':return {...s,view:action.value,layer:'all',route:null,opening:false,cut:action.value==='interface'?0:s.cut};
 case 'stage':return {...s,stage:action.value,layer:'all',route:null,opening:false};
 case 'architecture':return {...s,architecture:action.value,layer:'all',route:null,opening:false};
 case 'layer':return {...s,layer:action.value,route:null,opening:false};
 case 'route':return {...s,route:s.route===action.value?null:action.value,layer:s.route===action.value?'all':action.value,opening:false};
 case 'cut':return {...s,cut:clamp(Number(action.value),0,1),opening:false};
 case 'explore':return {...s,opening:false,paused:false};
 case 'transport':return {...s,transport:!s.transport,opening:false};
 case 'paper':return {...s,paper:action.value};
 case 'pause':return {...s,paused:!s.paused};
 default:return s;
 }
}
export function meshNames(s){
 if(s.view!=='fabrication')return ['carbon','sei','cathode'];
 return s.stage==='hybrid'?['carbon','template']:s.stage==='carbon'?['carbon']:s.stage==='cathode'?['carbon','deposited']:['carbon','sei','cathode'];
}
export function phaseAt(v,s,meta){
 if(v<=0)return 'carbon';
 if(s.view==='fabrication'&&s.stage==='hybrid')return 'template';
 if(s.view==='fabrication'&&s.stage==='carbon')return null;
 if(v>=meta.outerThreshold)return null;
 if(s.view==='fabrication'&&s.stage==='cathode')return 'cathode';
 return v<meta.seiThreshold?'sei':'cathode';
}
export function intervals(s,m){
 const list=[['carbon',-Infinity,0]];
 if(s.view==='fabrication'&&s.stage==='hybrid')return [...list,['template',0,Infinity]];
 if(s.view==='fabrication'&&s.stage==='carbon')return list;
 if(s.view==='fabrication'&&s.stage==='cathode')return [...list,['cathode',0,m.outerThreshold]];
 return [...list,['sei',0,m.seiThreshold],['cathode',m.seiThreshold,m.outerThreshold]];
}
// Clip a triangle in (x,y,value) space at scalar thresholds; keeps cut-face identity.
export function clipScalar(poly,threshold,keepAbove){
 if(!Number.isFinite(threshold))return poly;
 const out=[];
 for(let i=0;i<poly.length;i++){
  const a=poly[i],b=poly[(i+1)%poly.length],inside=p=>keepAbove?p[2]>=threshold:p[2]<=threshold;
  if(inside(a))out.push(a);
  if(inside(a)!==inside(b)){const t=(threshold-a[2])/(b[2]-a[2]);out.push([a[0]+t*(b[0]-a[0]),a[1]+t*(b[1]-a[1]),threshold]);}
 }
 return out;
}
export function caption(s){
 if(s.view==='fabrication')return {
 hybrid:['FIGURE 2 · CO-ASSEMBLY','First, build the template','A block copolymer organizes with phenol-formaldehyde resols. These two intertwined domains establish the future carbon scaffold and pore space.','Violet: removable polymer domain · charcoal: carbon precursor'],
 carbon:['FIGURE 2 · PYROLYSIS','Leave the pathways open','Heating under nitrogen converts the resol-rich framework to carbon and removes the polymer template. The carbon and the empty pore space both extend through the sample.','The paper reports an average pore size of about 90 nm.'],
 cathode:['FIGURE 2 · ELECTROPOLYMERIZATION','Coat the carbon directly','AQEDOT is electropolymerized into redox-active PAQEDOT inside the pores. At this stage the cathode coating touches the carbon: there is no separating interphase yet.','The model simplifies a coating that is heterogeneous in the real material.'],
 sei:['FIGURE 2 · ELECTROCHEMICAL PROCESSING','Separate from within','Processing against external lithium in liquid electrolyte forms a solid–electrolyte interphase, or SEI. It electronically separates the carbon and polymer while allowing lithium-ion transport.','The drawing illustrates the authors’ proposed process, not a recorded growth sequence.']
 }[s.stage];
 if(s.view==='interface')return ['THE LOCAL INTERFACE','Separate electrons, pass ions','The SEI lies between carbon and PAQEDOT. Lithium ions can cross it; electrons reach each electrode through its own connected network and the external circuit.','Ion motion here shows the intended transport roles, not a calculated trajectory or rate.'];
 if(s.architecture==='layered')return ['FIGURE 1a · LAYERED ARCHITECTURE','A rolled sheet is still a sheet','A conventional cell places a separator between electrode layers. Rolling the stack changes its packaging, but transport still crosses those layers.','Compare the arrangement with the interwoven structure in Figure 1c.'];
 if(s.route)return ['FOLLOW A CONNECTED NETWORK',s.route==='carbon'?'One continuous carbon scaffold':'One continuous cathode network',s.route==='carbon'?'The carbon is both the anode and an electronic current-collecting scaffold. Follow a route through its branches—even where a flat slice would show separate islands.':'The polymer coating extends through the porous scaffold. Isolating it reveals a connected volume, rather than disconnected blue pockets.','The internal route is shown through the material; it is a geometric connection, not a measured electron trajectory.'];
 if(s.layer!=='all')return {carbon:['THE ANODE','More than a support','Carbon forms a connected porous scaffold. In this device it stores lithium and provides an electronic route to its contact.','Empty space is shown where the other phases have been hidden.'],cathode:['THE CATHODE','A network within a network','PAQEDOT coats the pore walls and forms a connected cathode. A separate PEDOT contact layer helps connect it without touching the carbon.','The separate outer contact layer is omitted from this interior view.'],sei:['THE SEPARATING INTERPHASE','Thin, but continuous','The SEI follows the interface between the two electrode networks. Its intended role is electronic insulation with lithium-ion transport.','Its displayed thickness is illustrative; this is not a measured microstructure.']}[s.layer];
 return ['FIGURE 1c · INTERWOVVEN ARCHITECTURE'.replace('INTERWOVVEN','INTERWOVEN'),'They look like islands\nuntil you turn the figure','Carbon, cathode and their separating interphase extend through the volume. Cut into the structure, then isolate a material to see how those apparent pockets connect.','A nonperiodic explanatory geometry, inspired by the paper’s architecture.'];
}
