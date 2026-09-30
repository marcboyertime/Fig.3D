// Runs the preserved original rocksalt app's own lattice/percolation core (unchanged bytes between
// "core:start" and "core:end") and measures how often a random DRX crystal's 0-TM Li network spans it.
// Usage (from repo root): node evidence/rocksalt-percolation/sweep.mjs [seedsPerPoint]
import fs from 'node:fs';
const html = fs.readFileSync(new URL('../../site/references/rocksalt-li-pathways-user-original.html', import.meta.url), 'utf8');
const core = html.slice(html.indexOf('// ---- core:start'), html.indexOf('// ---- core:end'));
const {cubicLattice, speciesRandom, speciesSpinel, speciesLayered, analyse, CUBE_AXES} =
  new Function(core + '\nreturn {cubicLattice,speciesRandom,speciesSpinel,speciesLayered,analyse,CUBE_AXES};')();
const seeds = +process.argv[2] || 200;

// Ordered structures as sanity checks against Hau et al. p. 2.
const lat4 = cubicLattice(4);
for (const [name, species] of [['spinel', speciesSpinel], ['layered', speciesLayered]]) {
  const sp = species(lat4), zero = analyse(lat4, sp, 0, CUBE_AXES, 1e-6), one = analyse(lat4, sp, 1, CUBE_AXES, 1e-6);
  console.log(`${name}: tetrahedra by TM count 0..4 = ${zero.census.join('/')}; 0-TM spans x,y,z = ${zero.spans}; 0+1-TM spans = ${one.spans}`);
}

// Random DRX, Li_{1+x}M_{1-x}O2, 0-TM only, crossing along one cube axis (open boundaries, as in the app).
const xs = [0, 0.03, 0.06, 0.09, 0.12, 0.15, 0.2, 0.3];
console.log(`\nP(0-TM Li network crosses the crystal along x), ${seeds} seeds per point (60 for L=16)`);
console.log('cells ' + xs.map(x => x.toFixed(2).padStart(6)).join(''));
for (const L of [3, 4, 6, 10, 16]) {
  const lat = cubicLattice(L), n = L >= 16 ? Math.min(seeds, 60) : seeds, row = [];
  for (const x of xs) {
    let span = 0;
    for (let s = 1; s <= n; s++) if (analyse(lat, speciesRandom(lat, x, s * 7919 + L), 0, [[1, 0, 0]], 1e-6).spans[0]) span++;
    row.push((span / n).toFixed(2).padStart(6));
  }
  console.log(String(L).padEnd(6) + row.join(''));
}
