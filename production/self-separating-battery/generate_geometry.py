"""Deterministic illustrative bicontinuous geometry, not a micrograph reconstruction.
Requires numpy, scipy, scikit-image. Run from any directory.
The same checked meshes feed Three.js and the editable Blender scene.
"""
from pathlib import Path
import json, gzip, hashlib
from collections import deque
import numpy as np
from scipy import ndimage
from skimage.measure import marching_cubes
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'site/assets/self-separating-battery'
OUT.mkdir(parents=True,exist_ok=True)
N=41; HALF=3.; STEP=2*HALF/(N-1); LOW=.24; HIGH=.94

def make_field(seed):
    rng=np.random.default_rng(seed)
    f=ndimage.gaussian_filter(rng.normal(size=(81,81,81)),5.,mode='reflect')[20:61,20:61,20:61]
    f=(f-np.mean(f))/np.std(f)
    return f

def topology(mask,thin=False):
    labels,count=ndimage.label(mask,structure=np.ones((3,3,3)) if thin else None)
    sizes=np.bincount(labels.ravel());sizes[0]=0
    largest=int(sizes.argmax()); component=labels==largest
    spans=[bool(np.any(np.take(component,0,axis=a)) and np.any(np.take(component,-1,axis=a))) for a in range(3)]
    return {'components':int(count),'largestFraction':float(sizes.max()/mask.sum()),'voxels':int(mask.sum()),'spansXYZ':spans},component

# Select a reproducible geometry whose carbon, coating and void each form one network.
# Thin SEI is tested at this sampling resolution; report all small components honestly.
for seed in [16]:
    f=make_field(seed)
    masks={'carbon':f<=0,'sei':(f>0)&(f<LOW),'cathode':(f>=LOW)&(f<HIGH),'pore':f>=HIGH,'deposited':(f>0)&(f<HIGH)}
    checks={k:topology(v,thin=k=='sei')[0] for k,v in masks.items()}
    if all(v['largestFraction']>.995 and all(v['spansXYZ']) for v in checks.values()):break
else:raise RuntimeError('No suitable connected sample found')
print('seed',seed,checks,flush=True)
axis=np.linspace(-HALF,HALF,N)
x,y,z=np.meshgrid(axis,axis,axis,indexing='ij')
boundary=np.maximum.reduce([abs(x),abs(y),abs(z)])-HALF
# Boundary padding closes the finite sample without changing its interior scalar field.
def clip(poly,value,above):
    if value is None:return poly
    out=[]
    for a,b in zip(poly,poly[1:]+poly[:1]):
        ia=a[3]>=value if above else a[3]<=value
        ib=b[3]>=value if above else b[3]<=value
        if ia:out.append(a)
        if ia!=ib:
            t=(value-a[3])/(b[3]-a[3]);out.append(a+t*(b-a))
    return out

def mesh(name,lo,hi):
    vv=[];nn=[];ff=[];offset=0
    # Extract each boundary separately. Sampling max(lo-f,f-hi) can erase a thin
    # band between grid points; separate level sets preserve the full interphase.
    for value,outward in [(lo,-1),(hi,1)]:
        if value is None:continue
        v,faces,normals,_=marching_cubes(f,value,spacing=(STEP,)*3,gradient_direction='descent',allow_degenerate=False)
        v-=HALF;normals=-normals*outward
        if outward<0:faces=faces[:,::-1]
        vv.extend(v);nn.extend(normals);ff.extend(faces+offset);offset+=len(v)
    # Flat outer faces: clip scalar-valued triangles to this phase interval.
    for fixed in range(3):
      axes=[a for a in range(3) if a!=fixed]
      for side in [0,N-1]:
        normal=np.zeros(3);normal[fixed]=-1 if side==0 else 1
        for i in range(N-1):
          for j in range(N-1):
            pp=[]
            for u,v in [(i,j),(i+1,j),(i+1,j+1),(i,j+1)]:
                idx=[0,0,0];idx[fixed]=side;idx[axes[0]]=u;idx[axes[1]]=v
                pp.append(np.array([*[-HALF+k*STEP for k in idx],f[tuple(idx)]]))
            for tri in [[pp[0],pp[1],pp[2]],[pp[0],pp[2],pp[3]]]:
                poly=clip(clip(tri,lo,True),hi,False)
                for k in range(1,len(poly)-1):
                    points=np.array([poly[0][:3],poly[k][:3],poly[k+1][:3]])
                    cross=np.cross(points[1]-points[0],points[2]-points[0])
                    if np.linalg.norm(cross)<1e-10:continue
                    if np.dot(cross,normal)<0:points=points[::-1]
                    vv.extend(points);nn.extend([normal]*3);ff.append([offset,offset+1,offset+2]);offset+=3
    p=np.array(vv,dtype='<f4');norm=np.array(nn,dtype='<f4');idx=np.array(ff,dtype='<u4')
    # Index repeated coplanar vertices without smoothing the sample's cut edges.
    joined=np.concatenate([p,norm],axis=1)
    unique,inverse=np.unique(np.round(joined,6),axis=0,return_inverse=True)
    p=unique[:,:3].astype('<f4');norm=unique[:,3:].astype('<f4');idx=inverse[idx].astype('<u4')
    data=np.array([len(p),len(idx)],dtype='<u4').tobytes()+p.tobytes()+norm.tobytes()+idx.tobytes()
    (OUT/(name+'.bin')).write_bytes(data)
    return {'vertices':len(p),'triangles':len(idx),'bytes':len(data),'gzipBytes':len(gzip.compress(data)),'sha256':hashlib.sha256(data).hexdigest()}
meshes={name:mesh(name,lo,hi) for name,lo,hi in [('carbon',None,0),('template',0,None),('deposited',0,HIGH),('cathode',LOW,HIGH),('sei',0,LOW)]}
# BFS gives literal voxel-center paths, without smoothing that might leave the phase.
def path(mask):
    _,mask=topology(mask)
    starts=np.argwhere(mask[0]);ends=np.argwhere(mask[-1]);center=(N-1)/2
    starts=starts[np.argsort(((starts-center)**2).sum(axis=1))[:1]]
    target_yz=ends[np.argmin(((ends-center)**2).sum(axis=1))];desired=(N-1,int(target_yz[0]),int(target_yz[1]))
    q=deque();prev={}
    for j,k in starts:
        p=(0,int(j),int(k));prev[p]=None;q.append(p)
    target=None
    while q:
        p=q.popleft()
        if p==desired:target=p;break
        for a in range(3):
            for d in (-1,1):
                t=list(p);t[a]+=d;t=tuple(t)
                if 0<=t[a]<N and mask[t] and t not in prev:prev[t]=p;q.append(t)
    if target is None:raise ValueError('No spanning route')
    route=[]
    while target is not None:route.append(target);target=prev[target]
    route.reverse()
    assert all(mask[p] for p in route)
    return [[round(-HALF+i*STEP,5) for i in p] for p in route]
voxel_paths={name:path(masks[name]) for name in ['carbon','cathode']}
def inside_segment(a,b,name):
    points=np.linspace(a,b,max(2,int(np.linalg.norm(np.array(a)-b)/.018)+1))
    values=ndimage.map_coordinates(f,((points+HALF)/STEP).T,order=1,mode='nearest')
    return bool(np.all(values<=0)) if name=='carbon' else bool(np.all((values>=LOW)&(values<HIGH)))
def smooth_route(points,name):
    # String-pull with scalar-field tests, then round corners only if every new
    # segment still belongs to the selected phase. Never draw an unchecked spline.
    out=[np.array(points[0])];a=0
    while a<len(points)-1:
        b=len(points)-1
        while b>a+1 and not inside_segment(points[a],points[b],name):b-=1
        out.append(np.array(points[b]));a=b
    for iteration in range(3):
        proposed=[out[0]]
        for a,b in zip(out[:-1],out[1:]):proposed.extend([.75*a+.25*b,.25*a+.75*b])
        proposed.append(out[-1])
        if all(inside_segment(a,b,name) for a,b in zip(proposed[:-1],proposed[1:])):out=proposed
        else:break
    return [p.tolist() for p in out]
paths={name:smooth_route(points,name) for name,points in voxel_paths.items()}
field_data=f.astype('<f4').tobytes();(OUT/'field.bin').write_bytes(field_data)
meta={'version':1,'seed':seed,'n':N,'half':HALF,'step':STEP,'seiThreshold':LOW,'outerThreshold':HIGH,'connectivityConvention':'6-neighbor voxel adjacency, except 26-neighbor for the thin SEI band; dominant component spans all three axes; tiny sampled components are reported','units':'dimensionless explanatory geometry; no calibrated length or interphase thickness','meshes':meshes,'topology':checks,'paths':paths,'voxelPaths':voxel_paths,'fieldGzipBytes':len(gzip.compress(field_data))}
(OUT/'geometry.json').write_text(json.dumps(meta,separators=(',',':')))
(ROOT/'production/self-separating-battery/geometry-check.json').write_text(json.dumps(meta,indent=2))
print('Total gzip bytes',sum(m['gzipBytes'] for m in meshes.values())+meta['fieldGzipBytes'])
