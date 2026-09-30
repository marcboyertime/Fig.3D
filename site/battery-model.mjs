/** Fig.3D ideal insertion-cell bookkeeping. No voltage, kinetic or staging model. */
export const SPEC=Object.freeze({initialNegative:.60,initialPositive:.60,window:.30,hostUnits:20,totalLithium:24,schema:'fig3d-battery-2'});
export const MODES=Object.freeze(['discharge','charge']);
export function batteryState(progress,mode='discharge'){
  if(!Number.isFinite(progress)||progress<0||progress>1||!MODES.includes(mode))throw new RangeError('Use progress in [0,1] and discharge or charge mode.');
  const direction=mode==='discharge'?1:-1;
  const dischargeProgress=mode==='discharge'?progress:1-progress;
  const extent=SPEC.window*progress,negative=.60-.30*dischargeProgress,positive=.60+.30*dischargeProgress;
  const initialNegative=mode==='discharge'?.60:.30,initialPositive=mode==='discharge'?.60:.90;
  const transfer=SPEC.hostUnits*extent;
  return Object.freeze({progress,mode,direction,dischargeProgress,extent,negative,positive,initialNegative,initialPositive,
    negativeLithium:SPEC.hostUnits*negative,positiveLithium:SPEC.hostUnits*positive,
    lithiumTransferred:transfer,electronsReleased:transfer,electronsAccepted:transfer,
    electrolyteAccumulation:0,netChargeAccumulation:0,
    oxidation:mode==='discharge'?'negative':'positive',reduction:mode==='discharge'?'positive':'negative',
    externalDevice:mode==='discharge'?'load':'source',phase:progress===0?'start':progress===1?'window-complete':mode});
}
/** Reversing mode preserves the cell's physical composition. */
export const reverseProgress=progress=>{if(!Number.isFinite(progress)||progress<0||progress>1)throw new RangeError('Invalid progress.');return 1-progress;};
export function inventoryFills(fraction,bins=SPEC.hostUnits){
  if(!Number.isFinite(fraction)||fraction<0||fraction>1||!Number.isInteger(bins)||bins<1)throw new RangeError('Invalid inventory.');
  return Array.from({length:bins},(_,i)=>Math.max(0,Math.min(1,fraction*bins-i)));
}
export function assertConservation(s,tolerance=1e-10){
  const residuals={lithium:s.negativeLithium+s.positiveLithium+s.electrolyteAccumulation-SPEC.totalLithium,
    pairedCharge:s.electronsReleased-s.electronsAccepted,faradaicCoupling:s.lithiumTransferred-s.electronsReleased,
    negativeChange:SPEC.hostUnits*(s.initialNegative-s.negative)-s.direction*s.lithiumTransferred,
    positiveChange:SPEC.hostUnits*(s.positive-s.initialPositive)-s.direction*s.lithiumTransferred};
  return{pass:Object.values(residuals).every(v=>Math.abs(v)<=tolerance),residuals};
}
/** View-space paths; never a physical trajectory or time coordinate. 2D/3D supported. */
export function pointAlongPolyline(points,fraction){
  if(!Number.isFinite(fraction)||fraction<0||fraction>1||points.length<2)throw new RangeError('Invalid path.');
  const lengths=points.slice(1).map((p,i)=>Math.hypot(...p.map((v,j)=>v-points[i][j]))),total=lengths.reduce((a,b)=>a+b,0);
  let distance=fraction*total;
  for(let i=0;i<lengths.length;i++){
    if(distance<=lengths[i]||i===lengths.length-1){const t=lengths[i]?Math.min(1,distance/lengths[i]):0;return points[i].map((v,j)=>v+(points[i+1][j]-v)*t);}
    distance-=lengths[i];
  }
}
/** All routes are shared by renderer and tests. Electrons stay outside electrolyte. */
export const CELL=Object.freeze({negative:{min:[-4.45,-1.5,-1.5],max:[-2.05,1.5,1.5]},positive:{min:[2.05,-1.5,-1.5],max:[4.45,1.5,1.5]},electrolyte:{min:[-2.05,-1.5,-1.5],max:[2.05,1.5,1.5]},separatorX:0,graphiteOrigin:[-3.25,0,0],graphiteScale:.28});
export const ROUTES=Object.freeze({cell:{electrons:[[-4.2,.9,0],[-4.2,2.8,0],[4.2,2.8,0],[4.2,.9,0]],ions:[[-2.05,0,0],[2.05,0,0]]}});
export const REGIONS=CELL;
/** Honeycomb carbon patch, AA-aligned galleries for clarity. Bond length is one unit.
 * This geometry encodes rings and galleries, not bulk staging at an average x. */
export function graphiteGeometry(radius=3,layers=4,bond=.65,gap=1.67){
  const atoms=[],rings=[],indices=new Map(),bonds=new Map();
  const key=(x,z)=>`${x.toFixed(6)},${z.toFixed(6)}`;
  for(let q=-radius;q<=radius;q++)for(let r=-radius;r<=radius;r++){
    if(Math.abs(q+r)>radius)continue;
    const x=1.5*q*bond,z=Math.sqrt(3)*(r+q/2)*bond,ring=[];
    for(let k=0;k<6;k++){
      const px=x+bond*Math.cos(k*Math.PI/3),pz=z+bond*Math.sin(k*Math.PI/3),id=key(px,pz);
      if(!indices.has(id)){indices.set(id,atoms.length);atoms.push([px,0,pz]);}
      ring.push(indices.get(id));
    }
    for(let k=0;k<6;k++){const edge=[ring[k],ring[(k+1)%6]].sort((a,b)=>a-b);bonds.set(edge.join(','),edge);}
    rings.push({center:[x,0,z],indices:ring,q,r});
  }
  const layerY=Array.from({length:layers},(_,i)=>(i-(layers-1)/2)*gap);
  // One sublattice of hollow sites, separated by 3 C-C lengths; no adjacent crowded rings.
  const hollows=rings.filter(r=>((r.q-r.r)%3+3)%3===0);
  const sites=[];for(let layer=0;layer<layers-1;layer++)for(const ring of hollows)sites.push([ring.center[0],(layerY[layer]+layerY[layer+1])/2,ring.center[2]]);
  // Interleave galleries to avoid visually implying a staging sequence as mean occupancy changes.
  const ordered=sites.map((position,i)=>({position,rank:(i*17)%sites.length})).sort((a,b)=>a.rank-b.rank).map(item=>item.position);
  return {atoms,bonds:[...bonds.values()],rings,layerY,sites:ordered,bond,gap};
}
/** An explanatory path reaches a gallery through an exposed edge, parallel to sheets. */
export function graphiteIonPath(site,edgeX=4.8){return [[edgeX,site[1],site[2]],site];}
