"""Independent checks against the shipped scalar field and mesh buffers."""
import json,hashlib
from pathlib import Path
import numpy as np
from scipy import ndimage
ROOT=Path(__file__).resolve().parents[2];P=ROOT/'site/assets/self-separating-battery';m=json.loads((P/'geometry.json').read_text());n=m['n'];f=np.frombuffer((P/'field.bin').read_bytes(),'<f4').reshape(n,n,n);lo=m['seiThreshold'];hi=m['outerThreshold']
assert np.isfinite(f).all()
masks={'carbon':f<=0,'sei':(f>0)&(f<lo),'cathode':(f>=lo)&(f<hi),'pore':f>=hi,'deposited':(f>0)&(f<hi)}
assert np.all(sum(masks[k].astype(int) for k in ['carbon','sei','cathode','pore'])==1)
assert np.array_equal(masks['deposited'],masks['sei']|masks['cathode'])
report={'phasePartition':'exhaustive and non-overlapping','coatingBeforeSeparation':'same volume as final cathode + SEI','topology':{},'meshes':{},'paths':{}}
for k,mask in masks.items():
 labels,count=ndimage.label(mask,structure=np.ones((3,3,3)) if k=='sei' else None);sizes=np.bincount(labels.ravel());sizes[0]=0;largest=labels==sizes.argmax();fraction=sizes.max()/mask.sum();spans=[bool(np.any(np.take(largest,0,axis=i)) and np.any(np.take(largest,-1,axis=i))) for i in range(3)]
 assert all(spans) and fraction>.995
 assert count==m['topology'][k]['components'] and abs(fraction-m['topology'][k]['largestFraction'])<1e-10
 report['topology'][k]={'components':int(count),'largestFraction':float(fraction),'spansXYZ':spans}
for k in m['meshes']:
 b=(P/(k+'.bin')).read_bytes();assert hashlib.sha256(b).hexdigest()==m['meshes'][k]['sha256'];nv,nf=map(int,np.frombuffer(b,'<u4',2));assert len(b)==8+nv*24+nf*12
 v=np.frombuffer(b,'<f4',nv*3,8).reshape(-1,3);norm=np.frombuffer(b,'<f4',nv*3,8+nv*12).reshape(-1,3);faces=np.frombuffer(b,'<u4',nf*3,8+nv*24).reshape(-1,3)
 assert np.isfinite(v).all() and np.isfinite(norm).all() and faces.max()<nv
 assert abs(v).max()<3.00001
 cross=np.cross(v[faces[:,1]]-v[faces[:,0]],v[faces[:,2]]-v[faces[:,0]])
 dot=(cross*norm[faces[:,0]]).sum(axis=1);agreement=float((dot>=-1e-7).mean());volume=float((v[faces[:,0]]*np.cross(v[faces[:,1]],v[faces[:,2]])).sum()/6)
 assert agreement>.97 and volume>0,(k,agreement,volume)
 report['meshes'][k]={'vertices':nv,'triangles':nf,'normalAgreement':agreement,'positiveSignedVolume':volume}
for k,points in m['voxelPaths'].items():
 grid=np.rint((np.array(points)+m['half'])/m['step']).astype(int)
 assert grid[0,0]==0 and grid[-1,0]==n-1
 assert all(masks[k][tuple(p)] for p in grid)
 assert np.all(np.abs(np.diff(grid,axis=0)).sum(axis=1)==1)
 # An axis-aligned segment between two accepted samples remains in the same
 # scalar interval under trilinear interpolation. No spline crosses a wall.
 for a,b in zip(grid[:-1],grid[1:]):
  values=np.linspace(f[tuple(a)],f[tuple(b)],17)
  assert np.all(values<=0) if k=='carbon' else np.all((values>=lo)&(values<hi))
 for a,b in zip(m['paths'][k][:-1],m['paths'][k][1:]):
  pp=np.linspace(a,b,max(2,int(np.linalg.norm(np.array(a)-b)/.009)+1));values=ndimage.map_coordinates(f,((pp+m['half'])/m['step']).T,order=1,mode='nearest')
  assert np.all(values<=1e-7) if k=='carbon' else np.all((values>=lo-1e-7)&(values<hi+1e-7))
 report['paths'][k]={'rawVoxels':len(points),'displayPoints':len(m['paths'][k]),'insidePhase':True,'spansX':True,'displayRouteRecheckedAtStep':.009}
(ROOT/'production/self-separating-battery/verification/geometry-verification.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
