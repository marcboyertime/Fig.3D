"""Independent ASE construction AND distance neighbor search for every supported size."""
from ase.cluster import Octahedron
from ase.neighborlist import neighbor_list
import ase,json,numpy as np
from pathlib import Path
root=Path(__file__).resolve().parent
results=[]
for n in range(3,11):
 m=json.loads((root/f'geometry-{n}.json').read_text())
 cluster=Octahedron('Au',length=2*n+1,cutoff=n,latticeconstant=m['latticeAngstrom'])
 p=cluster.positions-cluster.positions.mean(axis=0)
 p=p/(m['latticeAngstrom']/2)
 assert np.max(np.abs(p-np.rint(p)))<1e-8
 coords=[tuple(map(int,q)) for q in np.rint(p)]
 actual={','.join(map(str,q)) for q in coords}
 assert actual=={a['id'] for a in m['atoms']},n
 i,j=neighbor_list('ij',cluster,m['latticeAngstrom']/np.sqrt(2)*1.001)
 sets={k:set() for k in actual}
 for a,b in zip(i,j):sets[','.join(map(str,coords[a]))].add(','.join(map(str,coords[b])))
 for a in m['atoms']:assert sets[a['id']]==set(a['neighbors']),(n,a['id'])
 results.append({'shells':n,'atoms':len(cluster),'surface_atoms':m['surfaceCount'],'coordination':m['distribution'],'coordinate_sets_equal':True,'all_neighbor_sets_equal':True})
(root/'ase-verification.json').write_text(json.dumps({'ase_version':ase.__version__,'method':'Octahedron and distance-based ase.neighborlist.neighbor_list, independent of JavaScript half-space construction','results':results},indent=2))
print('PASS: all coordinate sets and all neighbor sets, shells 3–10, ASE',ase.__version__)
