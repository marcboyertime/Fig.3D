"""Cubic LLZO garnet geometry (space group Ia-3d, origin choice 2), rebuilt from Wyckoff positions.

La 24c (1/8,0,1/4), Zr 16a (0,0,0), Li T-site 24d (3/8,0,1/4), octahedral cavity 48g (1/8,y,y+1/4)
and its split Li positions 96h. The O 96h coordinate is fitted to the cation–oxygen bond lengths
(Zr–O 2.10, La–O 2.55, Li(T)–O 1.93 Å); the 96h Li split position is the commonly reported one,
which reproduces the 1.62/2.37 Å distances to the two neighbouring T sites.
"""
import numpy as np
from ase.spacegroup import Spacegroup
A = 12.9827  # Å, cubic LLZO (order of the reported lattice parameters ~12.97–12.98 Å)
O_96H = (0.30737917, 0.21715688, 0.39787079)
LI_96H = (0.0985, 0.6889, 0.5791)
SG = Spacegroup(230)
def orbit(p):
    return np.array(SG.equivalent_sites([p], symprec=1e-4)[0])
LA, ZR, OX = orbit((0.125, 0, 0.25)), orbit((0, 0, 0)), orbit(O_96H)
T24D, G48G, H96H = orbit((0.375, 0, 0.25)), orbit((0.125, 0.1877, 0.4377)), orbit(LI_96H)
def cart(f): return np.asarray(f) * A
def nearest(p, S, n):
    d = S - p; d -= np.round(d); dd = np.linalg.norm(d * A, axis=1); i = np.argsort(dd)[:n]
    return i, p + d[i], dd[i]   # neighbours unwrapped next to p (fractional)
