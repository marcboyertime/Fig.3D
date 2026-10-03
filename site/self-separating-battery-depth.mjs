// Independent, dimensionless teaching models; never a fitted battery simulation.
export const TOPICS=['connectivity','length','formation','evidence'];
export const FORMATION_COUNT=6;
export const initialDepth=()=>({topic:'connectivity',slice:20,length:1,formation:0,evidence:'voltage'});
export function reduceDepth(s,a){
 if(a.type==='topic'&&TOPICS.includes(a.value))return {...s,topic:a.value};
 if(a.type==='slice')return {...s,slice:Math.max(0,Math.min(40,Math.round(Number(a.value))))};
 if(a.type==='length')return {...s,length:Math.max(.25,Math.min(2,Number(a.value)))};
 if(a.type==='formation')return {...s,formation:Math.max(0,Math.min(FORMATION_COUNT-1,Math.round(Number(a.value))))};
 if(a.type==='evidence'&&['capacity','voltage'].includes(a.value))return {...s,evidence:a.value};
 return s;
}
export const scaling=r=>({resistance:r,diffusion:r*r});
// Figure 1a labels the layered stack "~10's of µm"; Figures 1c and 2 work at the ~100 nm scale.
// Under the ideal assumptions below, area-specific resistance scales as L and a diffusion time as L².
export const SCALE_COMPARISON={layered:10e-6,interwoven:100e-9,get ratio(){return this.layered/this.interwoven;}};
export const capacity={first:120,theory:132,thirdFractionOfTheory:.208,get third(){return this.theory*this.thirdFractionOfTheory;}};
// A deliberately separate 2D sampling test: four-neighbor pixel components.
// It cannot prove the topology of a continuous material or of the full 3D field.
export function sliceLabels(field,n,k){
 const labels=new Int32Array(n*n);let occupied=0,components=0;const sizes=[0];
 for(let q=0;q<n*n;q++){if(field[q*n+k]<=0){labels[q]=-1;occupied++;}}
 for(let q=0;q<labels.length;q++)if(labels[q]===-1){components++;labels[q]=components;let size=1;const stack=[q];while(stack.length){const a=stack.pop(),i=Math.floor(a/n),j=a%n;for(const b of [i>0?a-n:-1,i<n-1?a+n:-1,j>0?a-1:-1,j<n-1?a+1:-1])if(b>=0&&labels[b]===-1){labels[b]=components;size++;stack.push(b);}}sizes.push(size);}
 return {labels,sizes,components,occupied,samples:n*n};
}
export function sliceStats(field,n,k){const {components,occupied,samples}=sliceLabels(field,n,k);return {components,occupied,samples};}
// Shortest six-neighbour route through carbon samples joining two patches that are
// separate in plane k. Any such route must leave the plane. Returns voxel indices [i,j,k].
export function hiddenConnection(field,n,k){
 const s=sliceLabels(field,n,k);if(s.components<2)return null;
 const order=s.sizes.map((size,id)=>[size,id]).slice(1).sort((a,b)=>b[0]-a[0]),from=order[0][1];
 const prev=new Int32Array(n*n*n).fill(-2),queue=new Int32Array(n*n*n);let head=0,tail=0;
 for(let q=0;q<n*n;q++)if(s.labels[q]===from){const v=q*n+k;prev[v]=-1;queue[tail++]=v;}
 let end=-1;
 while(head<tail){const v=queue[head++],kk=v%n,j=Math.floor(v/n)%n,i=Math.floor(v/(n*n));
  if(kk===k){const label=s.labels[i*n+j];if(label>0&&label!==from){end=v;break;}}
  for(const [di,dj,dk] of [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){const a=i+di,b=j+dj,c=kk+dk;if(a<0||b<0||c<0||a>=n||b>=n||c>=n)continue;const w=(a*n+b)*n+c;if(prev[w]!==-2||field[w]>0)continue;prev[w]=v;queue[tail++]=w;}}
 if(end<0)return null;
 const path=[];for(let v=end;v>=0;v=prev[v])path.push([Math.floor(v/(n*n)),Math.floor(v/n)%n,v%n]);path.reverse();
 const target=s.labels[path.at(-1)[0]*n+path.at(-1)[1]];
 return {path,from,to:target,labels:s.labels,components:s.components,maxOffset:Math.max(...path.map(p=>Math.abs(p[2]-k)))};
}

// Each processing state is one row of the source: which leads the instrument holds,
// whether the device is in the liquid, and what the magnified wall shows.
// Terminal mapping follows the Figure 5 insets: working electrode on +, external Li on −
// for half-cell steps; the device's polymer lead on + and carbon lead on − as a full cell.
export const formationSteps=[
 {key:'deposited',name:'Deposit',figure:'Figure 2',title:'Touching,\nso not yet a battery',copy:'PAQEDOT is electropolymerized directly onto the carbon. The two electrodes touch, so electrons pass straight between them: any charge would short out inside the device.',note:'Figure 2 · Deposition comes before any separator exists.',potential:'No circuit · device not yet processed',
  vial:false,immersed:false,plus:null,minus:null,mode:'',addressed:null,inset:{sei:0,plating:0,polymer:'doped',pendants:'empty',flows:['short']}},
 {key:'form-sei',name:'Form SEI',figure:'Figure 5a',title:'Drive the carbon\nto low potential',copy:'In electrolyte, the carbon lead is discharged against external lithium. Electrolyte decomposes at the carbon surface into SEI, while the touching polymer is de-doped and becomes more insulating.',note:'Figure 5a · Proposed mechanism; the interphase was not imaged as it formed.',potential:'Carbon vs Li: 2.9 → 0 V',
  vial:true,immersed:true,plus:'carbon',minus:'li',mode:'Discharge carbon',addressed:'carbon',inset:{sei:1,plating:0,polymer:'dedoped',pendants:'empty',flows:['e-into-carbon','li-to-carbon']}},
 {key:'plate-strip',name:'Plate & strip',figure:'Figure 5b',title:'Go lower,\nthen strip back',copy:'A second discharge goes low enough to plate lithium, expected to decompose more electrolyte and lift polymer off the carbon. Charging the carbon to 4 V then strips the plated lithium away.',note:'Figure 5b · “Should lead to” in the authors’ words: an expectation, not an observation.',potential:'Carbon vs Li: below 0 V, then to 4 V',
  vial:true,immersed:true,plus:'carbon',minus:'li',mode:'Plate, then strip',addressed:'carbon',inset:{sei:2,plating:1,polymer:'dedoped',pendants:'empty',flows:['e-into-carbon','li-to-carbon']}},
 {key:'reduce-polymer',name:'Reduce polymer',figure:'Figure 5c',title:'Move the clip\nto the polymer',copy:'Now external lithium is connected to the polymer lead, and the carbon lead is left loose. The polymer is reduced and takes up lithium; the carbon stays oxidized. The device is now discharged.',note:'Figure 5c · Only the polymer is addressed in this step.',potential:'Polymer vs Li: 2.7 → 1.0 V',
  vial:true,immersed:true,plus:'polymer',minus:'li',mode:'Reduce polymer',addressed:'polymer',inset:{sei:2,plating:0,polymer:'dedoped',pendants:'fill',flows:['e-into-polymer','li-into-polymer']}},
 {key:'charge-device',name:'Charge',figure:'Figure 5d',title:'Charge through\nits own two leads',copy:'External lithium is disconnected but stays in the vial. The charger joins the polymer and carbon leads, so lithium ions cross from polymer to carbon. The liquid restores counter-ions the PEDOT backbone lost.',note:'Figure 5d · Still immersed, so anions can re-dope the backbone.',potential:'Device charged to about 4 V',
  vial:true,immersed:true,plus:'polymer',minus:'carbon',mode:'Charge device',addressed:'both',inset:{sei:2,plating:0,polymer:'doped',pendants:'empty-from-full',flows:['e-polymer-to-carbon','li-polymer-to-carbon','anions-into-polymer']}},
 {key:'operate',name:'Operate',figure:'Figure 6',title:'Lift it out\nand run the cell',copy:'The device is raised above the liquid before cycling. On discharge, lithium ions cross the interphase from carbon into the polymer, and electrons travel the external circuit to meet them.',note:'Figure 6b–c · Raised above the liquid “to run in the solid state”.',potential:'Discharge plateau ≈ 2.4 V',
  vial:true,immersed:false,plus:'polymer',minus:'carbon',mode:'Discharge device',addressed:'both',inset:{sei:2,plating:0,polymer:'doped',pendants:'fill',flows:['e-carbon-to-polymer','li-carbon-to-polymer']}}
];
export const formationConfiguration=index=>formationSteps[index];

export const depthContent={
 connectivity:{kicker:'FOUNDATION · FIGURE 1c',title:'A slice can hide\na connection',copy:'Move the section. The two largest carbon patches in the plane look separate, and the highlighted route shows where they join, above or below the slice.',note:'Patches are four-neighbour components of a 41 × 41 sampled plane; the route steps through connected carbon samples of the same field.',sections:[
 ['Start with the distinction','An electrode is a region that can exchange electronic charge with its lead. A 2D image or cut slices through these volumes, so patches that look separate in the picture need not be separate objects. Figure 1c is drawn this way: its blue islands are sections, not pockets.'],
 ['What co-continuity requires','Both electrode networks need unbroken routes to their own leads, and the boundary between them must block electrons while passing ions. More interface area only helps if all three conditions hold throughout. Figure 1b is an earlier ordered gyroid; Figure 1c is this paper’s nonperiodic material, which makes a 3D check more important, not less.'],
 ['Read the model critically','Routes here are checked on a generated scalar field, not on the specimen. A changing patch count shows what a section can hide; it is not a percolation measurement. The paper’s micrographs do not provide a complete 3D reconstruction of the real network.'] ],source:'Figure 1 and caption. Geometry, sampling and topology checks are in the model notes.'},
 length:{kicker:'PHYSICS · AN IDEAL COMPARISON',title:'Which distance\nare we shortening?',copy:'Change the thickness L of an ideal ion-conducting slab while its area A stays fixed. Resistance follows L; a diffusion time follows L².',note:'Dimensionless comparison. No conductivity, diffusivity or device rate has been fitted. L is a transport distance, not an SEI thickness.',sections:[
 ['Build from current and flux','In a uniform slab with constant ionic conductivity κ and area A, j = κΔV/L and I = jA. Therefore R = ΔV/I = L/(κA). This assumes a homogeneous, ohmic conductor and neglects contact and charge-transfer resistance.'],
 ['Why the square appears','For one-dimensional diffusion with constant D, rescale x by L and time by L²/D in ∂c/∂t = D∂²c/∂x². Geometrically similar problems then share one dimensionless solution, so a relaxation time scales as L² while its prefactor stays fixed by the boundary conditions.'],
 ['From Figure 1a to Figure 1c','Figure 1a labels the layered stack “~10’s of µm”; the interwoven material works at about 100 nm. If only L changed, by a factor of 100, the ideal area-specific resistance would fall 100× and a diffusion time 10,000×. These are ratios from the equations above, not predictions for this device.'],
 ['Return to the real device','The paper reports a measured pore size of about 90 nm, not an SEI thickness. Its 3D network adds tortuous routes, heterogeneous coating and contact resistance, and the authors report impedance higher than a typical battery despite the short paths, possibly from unfavourable interfacial contact.'] ],source:'Figure 1a scale label; pore size, Figure 3d; impedance discussion in the electrochemical results. Equations are a separately derived teaching model.'},
 formation:{kicker:'PROCESS · FIGURES 2, 5 & 6',title:'The separator\ncomes later',copy:'',note:'',sections:[
 ['Two roles in one polymer','PAQEDOT joins a conducting EDOT-derived backbone with redox-active anthraquinone pendants. The backbone carries electrons; the pendants store charge. A separate outer PEDOT layer gives the polymer a lead that does not touch the carbon.'],
 ['Why every potential needs a reference','“Below about 1 V” during processing is the carbon’s potential relative to external lithium, not a battery voltage. Each step names its reference: carbon vs Li, polymer vs Li, or the full device across its own two leads.'],
 ['What is proposed, and what is known','The authors propose that de-doping makes the polymer more insulating at the potentials where SEI forms, so the interphase can grow between carbon and polymer rather than shorting through them. The magnified wall illustrates that proposal; it does not show a measured thickness, composition or growth sequence.'],
 ['Why the bath comes and goes','Liquid electrolyte supplies the ions for SEI formation, polymer reduction and re-doping. Before cycling, the device is lifted out so that the cell runs on its own internal phases. The lithium chip remains in the vial, disconnected, after the polymer step.'],
 ['A real materials tradeoff','Electronic insulation is wanted across the interphase but not along each electrode’s route to its lead. The paper discusses a possible mismatch between backbone conduction and quinone redox potentials, which could trap partially reduced species. That is a possible contributor to fading, not a demonstrated cause.'] ],source:'Figure 2; Figure 4; Figure 5a–d and processing text; Figure 6a–b; conduction/redox discussion.'},
 evidence:{kicker:'EVIDENCE · FIGURE 6',title:'Separation is\nonly one test',copy:'Holding a voltage and returning charge answer different questions. The first asks whether the electrodes stay electronically apart; the second, how much charge the cell can deliver again.',note:'Annotations mark values reported in the text. The panels are the original Figure 6, unaltered.',sections:[
 ['What a voltage hold can support','Open-circuit potential is measured while no intended current flows. The authors report over 3.5 V after a five-hour hold, and a second hold after cycling. This supports lasting electronic separation. It does not measure the interphase thickness, exclude all leakage or establish high power.'],
 ['Understand the denominator','Specific capacity is charge divided by a chosen mass. The 120 mAh/g first discharge and 132 mAh/g theoretical capacity are per gram of PAQEDOT, not per gram of the whole device with its carbon and contacts.'],
 ['Retention, computed carefully','The third discharge is reported as 20.8% of the 132 mAh/g theoretical capacity, about 27.5 mAh/g. Relative to the first discharge that is about 22.9%, not 20.8%. Both statements are true; they use different references.'],
 ['An honest conclusion','The work establishes a fabrication route and demonstrates full-cell cycling. Capacity fading, high impedance and limited rate remain. Later iterations (Figure 6e) reach higher capacities, which the authors discuss alongside possible extra contributions and irreversible reactions.'] ],source:'Figure 6b–d and text on the initial device; Figure 6e–f for the later iteration; limitations discussion.'}
};
