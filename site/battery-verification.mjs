import assert from 'node:assert/strict';
import {batteryState,reverseProgress,inventoryFills,assertConservation,pointAlongPolyline,CELL,ROUTES,graphiteGeometry,graphiteIonPath} from './battery-model.mjs';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t,`${a} differs from ${b}`);
const inside=(p,r)=>p.every((v,i)=>v>=r.min[i]-1e-10&&v<=r.max[i]+1e-10);
let cases=0,maxResidual=0;
// Independent twenty-host reference: six Li equivalents are moved in either direction.
for(const mode of ['discharge','charge'])for(let i=0;i<=1000;i++){
  const p=i/1000,s=batteryState(p,mode),charge=mode==='charge';
  const negative=charge?6+6*p:12-6*p,positive=charge?18-6*p:12+6*p;
  near(s.negativeLithium,negative);near(s.positiveLithium,positive);
  near(s.lithiumTransferred,6*p);near(s.electronsReleased,6*p);near(s.electronsAccepted,6*p);
  near(s.negative+s.positive,1.2);near(s.negativeLithium+s.positiveLithium,24);
  assert.ok(s.negative>=.3-1e-12&&s.negative<=.6+1e-12);assert.ok(s.positive>=.6-1e-12&&s.positive<=.9+1e-12);
  const checks=assertConservation(s);assert.equal(checks.pass,true);maxResidual=Math.max(maxResidual,...Object.values(checks.residuals).map(Math.abs));
  near(inventoryFills(s.negative).reduce((a,b)=>a+b,0),negative);near(inventoryFills(s.positive).reduce((a,b)=>a+b,0),positive);
  assert.equal(s.oxidation,charge?'positive':'negative');assert.equal(s.reduction,charge?'negative':'positive');assert.equal(s.externalDevice,charge?'source':'load');
  const reverse=batteryState(reverseProgress(p),charge?'discharge':'charge');
  near(reverse.negative,s.negative);near(reverse.positive,s.positive);assert.equal(reverse.direction,-s.direction);
  if(i){const old=batteryState((i-1)/1000,mode);assert.ok(charge?s.negative>old.negative:s.negative<old.negative);assert.ok(charge?s.positive<old.positive:s.positive>old.positive);}
  cases++;
}
// Atomic and charge balance in both cumulative half-reactions (Li,C,Co,O,q).
for(const xi of [0,.001,.075,.15,.3])for(const mode of ['discharge','charge']){
  const charge=mode==='charge';
  const nLeft=charge?[.3+xi,6,0,0,xi-xi]:[.6,6,0,0,0];
  const nRight=charge?[.3+xi,6,0,0,0]:[(.6-xi)+xi,6,0,0,xi-xi];
  const pLeft=charge?[.9,0,1,2,0]:[.6+xi,0,1,2,xi-xi];
  const pRight=charge?[(.9-xi)+xi,0,1,2,xi-xi]:[.6+xi,0,1,2,0];
  nLeft.forEach((v,i)=>near(v,nRight[i]));pLeft.forEach((v,i)=>near(v,pRight[i]));
}
const before=batteryState(.37,'charge');batteryState(.99,'discharge');assert.deepEqual(batteryState(.37,'charge'),before);
for(const bad of [-.01,1.01,NaN,Infinity,'0.5',null])assert.throws(()=>batteryState(bad),RangeError);
assert.throws(()=>batteryState(.5,'rest'),RangeError);assert.equal(assertConservation({...before,positiveLithium:0}).pass,false);
// Renderer uses these same 3D routes, not copied fixtures.
const {electrons,ions}=ROUTES.cell;
assert.ok(inside(electrons[0],CELL.negative));assert.ok(inside(electrons.at(-1),CELL.positive));
for(let i=0;i<=1000;i++){
  const f=i/1000,e=pointAlongPolyline(electrons,f),ion=pointAlongPolyline(ions,f);
  assert.ok(!inside(e,CELL.electrolyte),'Electron entered electrolyte');
  for(const y of [-.85,0,.85])for(const z of [-.85,0,.85])assert.ok(inside([ion[0],y,z],CELL.electrolyte));
  // Reversing the same phase sweeps both external and internal routes backward.
  near(pointAlongPolyline(ions,1-f)[0],-ion[0]);
}
const geometry=graphiteGeometry(),{atoms,bonds,rings,layerY,sites,bond}=geometry;
const lengths=bonds.map(([a,b])=>Math.hypot(...atoms[a].map((v,j)=>v-atoms[b][j])));
lengths.forEach(length=>near(length,bond));
const degree=new Array(atoms.length).fill(0);bonds.forEach(([a,b])=>{degree[a]++;degree[b]++;});assert.ok(degree.every(d=>d>=2&&d<=3));
assert.equal(new Set(atoms.map(p=>p.map(v=>v.toFixed(6)).join(','))).size,atoms.length);
for(const ring of rings){assert.equal(new Set(ring.indices).size,6);ring.indices.forEach(id=>near(Math.hypot(atoms[id][0]-ring.center[0],atoms[id][2]-ring.center[2]),bond));}
assert.equal(layerY.length,4);assert.equal(new Set(sites.map(p=>p.join(','))).size,sites.length);
for(const site of sites){
  const gapIndex=layerY.findIndex((y,i)=>i<layerY.length-1&&Math.abs((y+layerY[i+1])/2-site[1])<1e-10);assert.ok(gapIndex>=0,'Li must be between layers');
  const neighbors=atoms.filter(a=>Math.abs(Math.hypot(a[0]-site[0],a[2]-site[2])-bond)<1e-8);assert.equal(neighbors.length,6,'Li xz coordinate must be a hexagonal hollow');
  const path=graphiteIonPath(site);assert.ok(path[0][0]>Math.max(...atoms.map(a=>a[0])));
  for(let i=0;i<=100;i++){const p=pointAlongPolyline(path,i/100);near(p[1],site[1]);near(p[2],site[2]);assert.ok(layerY.every(y=>Math.abs(p[1]-y)>1e-6),'Gallery path crossed a carbon sheet');}
}
for(let i=0;i<=100;i++){const s=batteryState(i/100);near(inventoryFills(s.negative,sites.length).reduce((a,b)=>a+b,0),s.negative*sites.length);}
console.log(JSON.stringify({status:'PASS',progressStates:cases,maximumConservationResidual:maxResidual,graphite:{atomsPerSheet:atoms.length,bondsPerSheet:bonds.length,hexagonsPerSheet:rings.length,sheets:layerY.length,interlayerSites:sites.length,bondRange:[Math.min(...lengths),Math.max(...lengths)]},checks:['independent charge/discharge inventories','mode-switch composition continuity','Li/electron and half-reaction atom/charge balance','role and source/load reversal','deterministic scrub','3D route domains and solid endpoints','honeycomb ring/bond geometry','unique sites in galleries','edge-entry paths parallel to carbon sheets','linked fractional population'],limitation:'Bookkeeping and geometry checks, not empirical or kinetic validation.'},null,2));
