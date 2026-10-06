"""Re-run the 1D diffusion model of He, Zhu & Mo (2017) Fig. 4 / Methods eqs (6)-(8).

Four ions in a 1D lattice of two 6 Å cells. E = sum_i phi(x_i) + sum_{i,j,i!=j} K/|x_i-x_j|.
Variants for the unstated parts (boundary treatment, pair-sum convention) are compared with the
printed Fig. 4c/4d so the choice is evidence-based, not assumed.
"""
import numpy as np, json, sys
from scipy.optimize import minimize
L = 6.0; Ea = 0.6
def phi(x, land):
    t = 2 * np.pi * x / L - np.pi
    if land == 'a': return Ea * (np.cos(t) - 0.25 * np.cos(2 * t) + 1.25) / 2.00
    return Ea * (np.cos(t) - 1.5 * np.cos(2 * t) + 2.50) / 4.08

def coulomb(x, K, mode):
    e = 0.0
    n = len(x)
    for i in range(n):
        for j in range(n):
            if i == j: continue
            d = x[i] - x[j]
            if mode.startswith('pbc'):
                imgs = int(mode[3:] or 0)
                e += sum(K / abs(d + m * 2 * L) for m in range(-imgs, imgs + 1))
            elif mode == 'mic':
                d = d - 2 * L * np.round(d / (2 * L)); e += K / abs(d)
            else:
                e += K / abs(d)
    return e

def energy(x, K, land, mode, half=False):
    c = coulomb(x, K, mode)
    return phi(np.asarray(x), land).sum() + (c / 2 if half else c)

def mep(K, land, mode, half=False, n=31):
    x0 = np.array([0.0, 3.0, 6.0, 9.0])
    # relax the start (high-energy sites stay occupied per the SI)
    start = minimize(lambda x: energy(x, K, land, mode, half), x0, method='BFGS').x
    path = []
    prev = start.copy()
    for s in np.linspace(0, 3.0, n):
        cons = {'type': 'eq', 'fun': lambda x, s=s: x.mean() - (start.mean() + s)}
        r = minimize(lambda x: energy(x, K, land, mode, half), prev + (s - (prev.mean() - start.mean())), constraints=[cons], method='SLSQP', options={'ftol': 1e-12, 'maxiter': 500})
        prev = r.x; path.append((s, r.fun, r.x.copy()))
    e0 = path[0][1]
    return start, [(s, e - e0, x) for s, e, x in path]

if __name__ == '__main__':
    for mode in ['open', 'mic', 'pbc1', 'pbc3']:
        for half in [False, True]:
            row = []
            for land in 'ab':
                st, p = mep(3.0, land, mode, half)
                row.append(round(max(e for _, e, _ in p), 3))
            ks = [round(max(e for _, e, _ in mep(K, 'a', mode, half)[1]), 3) for K in (2, 4, 6)]
            print(mode, 'half' if half else 'full', 'K=3 barriers a,b', row, 'a at K=2,4,6', ks, 'start', np.round(st, 2))
