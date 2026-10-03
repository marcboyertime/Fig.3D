// Independent, dimensionless teaching models; never a fitted battery simulation.
export const TOPICS=['connectivity','length','formation','evidence'];
export const initialDepth=()=>({topic:'connectivity',slice:20,length:1,formation:0,evidence:'capacity'});
export function reduceDepth(s,a){
 if(a.type==='topic'&&TOPICS.includes(a.value))return {...s,topic:a.value};
 if(a.type==='slice')return {...s,slice:Math.max(0,Math.min(40,Math.round(Number(a.value))))};
 if(a.type==='length')return {...s,length:Math.max(.25,Math.min(2,Number(a.value)))};
 if(a.type==='formation')return {...s,formation:Math.max(0,Math.min(4,Number(a.value)))};
 if(a.type==='evidence'&&['capacity','voltage'].includes(a.value))return {...s,evidence:a.value};
 return s;
}
export const scaling=r=>({resistance:r,diffusion:r*r});
export const capacity={first:120,theory:132,thirdFractionOfTheory:.208,get third(){return this.theory*this.thirdFractionOfTheory;}};
// A deliberately separate 2D sampling test: four-neighbor pixel components.
// It cannot prove the topology of a continuous material or of the full 3D field.
export function sliceStats(field,n,k){
 const mask=new Uint8Array(n*n);let occupied=0,components=0;
 for(let i=0;i<n;i++)for(let j=0;j<n;j++){const q=i*n+j;mask[q]=field[q*n+k]<=0?1:0;occupied+=mask[q];}
 for(let q=0;q<mask.length;q++)if(mask[q]===1){components++;mask[q]=2;const stack=[q];while(stack.length){const a=stack.pop(),i=Math.floor(a/n),j=a%n;for(const b of [i>0?a-n:-1,i<n-1?a+n:-1,j>0?a-1:-1,j<n-1?a+1:-1])if(b>=0&&mask[b]===1){mask[b]=2;stack.push(b);}}}
 return {components,occupied,samples:n*n};
}
export const formationSteps=[
 {name:'Deposit',title:'Make contact first',copy:'Electropolymerization deposits PAQEDOT directly onto conducting carbon. An outer PEDOT layer provides a separate place to attach the cathode lead. The two networks are not yet electronically separated.',note:'Figure 2; pp. 19–23 · Deposition precedes separator formation.',tag:'Direct electronic contact',lead:'Carbon / coating'},
 {name:'Form SEI',title:'Change the interface electrochemically',copy:'The contacted device is immersed in liquid electrolyte and processed against external lithium. At low potential the polymer de-dopes; the authors propose that electrolyte decomposition builds SEI at the carbon–polymer interface.',note:'Figure 5a–b; pp. 23–24 · Proposed mechanism, not a directly filmed growth sequence.',tag:'SEI-forming treatment',lead:'Carbon'},
 {name:'Reduce polymer',title:'Move the contact to the polymer',copy:'Connect external lithium to the PAQEDOT lead instead of the carbon lead. Reduction lithiates the polymer. The carbon remains oxidized, leaving the device in its discharged state.',note:'Figure 5c; p. 24 · The carbon lead is now disconnected from the processing circuit.',tag:'Polymer reduction',lead:'Cathode'},
 {name:'Charge',title:'Use the device’s own two leads',copy:'Disconnect external lithium. Connect the carbon and polymer leads to the charger, with the device still in electrolyte. This step also replaces counterions lost from the PEDOT backbone during reduction.',note:'Figure 5d; p. 24 · External lithium is no longer used; the electrolyte bath remains.',tag:'Charge in electrolyte',lead:'Two device leads'},
 {name:'Operate',title:'Now the device is the cell',copy:'After electrochemical preparation, the device is lifted out of the electrolyte bath for full-cell cycling. Electrons use the external circuit; lithium ions must move through the internal ion-conducting phases and interphase.',note:'Figure 6; pp. 25–26 · The liquid processing bath and external lithium are not part of this operating circuit.',tag:'Full-cell operation',lead:'Two device leads'}
];
export function formationConfiguration(index){
 return [
  {key:'deposited',bath:false,externalLi:false,interphase:false,contact:null,circuit:'none',emphasis:'cathode'},
  {key:'form-sei',bath:true,externalLi:true,interphase:true,contact:'carbon',circuit:'external-li',emphasis:'sei'},
  {key:'reduce-polymer',bath:true,externalLi:true,interphase:true,contact:'cathode',circuit:'external-li',emphasis:'cathode'},
  {key:'charge-device',bath:true,externalLi:false,interphase:true,contact:'both',circuit:'charger',emphasis:'both'},
  {key:'operate',bath:false,externalLi:false,interphase:true,contact:'both',circuit:'load',emphasis:'both'}
 ][index];
}
export const depthContent={
 connectivity:{kicker:'FOUNDATION · FIGURE 1c',title:'A slice can hide a connection',copy:'Move the section through the volume. Carbon regions that look separate in one plane can join above or below it. The detached plane shows the same field at the selected depth.',note:'Four-neighbor components are counted in a 41 × 41 sampled slice, not in the continuous specimen.',sections:[
 ['Start with the distinction','An electrode is a region that can exchange electronic charge with its contact. A pore is empty space in the dry scaffold; later processing fills some of that space with polymer and interphase. A 2D image cuts through these volumes. Separate patches in that image need not be separate objects in 3D.'],
 ['What co-continuity requires','Both electrode networks need routes to their respective contacts. The carbon–polymer interface must also prevent an electronic short while allowing ionic transport. More interface area is useful only if those conditions hold throughout the device. Figure 1b is an earlier ordered gyroid; Figure 1c is this paper’s nonperiodic material.'],
 ['Read the model critically','The main explorer’s routes are checked against a generated scalar field. Here, the grid count concerns only a single slice. A changing count demonstrates the limits of a section; it does not measure this specimen’s percolation probability. The paper’s images do not provide a complete 3D reconstruction.'] ],source:'Figure 1; pp. 3–5, 14–18. Geometry and sampling details are in the model notes.'},
 length:{kicker:'PHYSICS · AN IDEAL COMPARISON',title:'Which distance are we shortening?',copy:'Change the thickness L of an ideal ion-conducting slab. Keep its area and material properties fixed. Resistance changes in proportion to L; a diffusion timescale changes with L².',note:'Faint outline: reference thickness L₀. Dimensionless comparison; no material properties or device rate have been fitted.',sections:[
 ['Build from current and flux','In a uniform slab with constant ionic conductivity κ and area A, j = κΔV/L and I = jA. Therefore R = ΔV/I = L/(κA). This assumes a homogeneous, ohmic conductor and neglects contact and charge-transfer resistance.'],
 ['Why the square appears','For one-dimensional diffusion with constant D, rescale x by L and time by L²/D in ∂c/∂t = D∂²c/∂x². Geometrically similar problems then share the same dimensionless solution. A particular relaxation time includes a factor set by its initial and boundary conditions, but its ratio still scales as L² if those conditions are unchanged.'],
 ['Return to the real device','The paper proposes short local distances and large interfacial area as architectural advantages. Its 3D network also has tortuous electronic routes, heterogeneous coating, contact resistance and potential-dependent polymer conduction. The pore diameter (~90 nm) is not a measured SEI thickness. This ideal curve cannot predict charging time or resolve the reported impedance.'] ],source:'Architecture motivation: pp. 3–5. Pore size: pp. 17–18. Impedance and limits: pp. 26–31. Equations are a separately derived teaching model.'},
 formation:{kicker:'PROCESS · FIGURES 2 & 5',title:'The separator comes later',copy:'Follow the changes in material contact and electrical connection. Each state is a process explanation, not a simulated movie of interphase growth.',note:'The paper reports a multistep treatment; this visual groups it into five inspectable states.',sections:[
 ['Two roles in one polymer','PAQEDOT joins a conducting EDOT-derived backbone with redox-active anthraquinone pendants. Electronic conduction along the polymer and redox storage at its pendants are distinct roles. A separate outer PEDOT layer makes the polymer network easier to contact without touching carbon.'],
 ['Why voltage needs a reference','During processing, “below about 1 V” is a carbon-electrode potential relative to external lithium, not the voltage of the final battery. The paper uses an initial discharge, a lower-potential treatment expected to plate lithium, subsequent stripping to 4 V versus Li, polymer reduction, and then full-cell charging in electrolyte.'],
 ['What is proposed, and what is known','The authors propose that polymer de-doping makes it less conducting at the potentials where SEI develops. The lower-potential step may also lift polymer from carbon through lithium plating and further electrolyte decomposition. The visual separates the materials to explain that proposal; it does not assert a measured thickness or atom-by-atom pathway.'],
 ['A real materials tradeoff','Electronic insulation is desirable across the separator but undesirable within an electrode’s route to its contact. The paper discusses a possible mismatch between polymer backbone conduction and quinone redox potentials, which could trap partially reduced species. That remains a possible contributor to fading, not a demonstrated unique cause.'] ],source:'PAQEDOT/PEDOT: pp. 19–22. Processing: Figure 5, pp. 23–25. Conduction/redox discussion: pp. 30–31.'},
 evidence:{kicker:'EVIDENCE · FIGURE 6',title:'Separation is only one test',copy:'Compare voltage retention with capacity retention. These answer different questions: can the electrodes sustain a potential difference, and how much charge can the cell deliver again?',note:'Values refer to the initial BCP-derived device. Later optimized devices are separate experiments.',sections:[
 ['What a voltage hold can support','Open-circuit potential is measured while no intended external current is drawn. The authors report over 3.5 V after a five-hour hold. This supports persistent electronic separation. It does not directly measure separator thickness, exclude all leakage, prove a particular SEI composition, or establish high power.'],
 ['Understand the denominator','Specific capacity is charge divided by a chosen mass. The reported 120 mAh/g and theoretical 132 mAh/g use PAQEDOT mass, not the complete device including carbon and contacts. The third discharge is reported as 20.8% of that theoretical capacity: about 27.5 mAh/g. That is about 22.9% of the first discharge, not 20.8% of it.'],
 ['An honest conclusion','The work establishes a proof of principle for the fabrication approach and demonstrates full-cell cycling. Capacity fading, high impedance and limited rate remain. Higher capacities in later iterations are discussed alongside possible extra contributions and irreversible reactions; exceeding a pendant-only theoretical capacity is not by itself evidence of a superior practical battery.'] ],source:'Figure 6b–d; pp. 25–28. Capacity denominator and initial device: p. 26. Limitations: pp. 30–31.'}
};
