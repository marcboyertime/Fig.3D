# Inside a nanoparticle — source and scientific model

## Provenance

Kang, Y., João, S. M., Lin, R. et al. **Effect of crystal facets in plasmonic catalysis.** *Nature Communications* **15**, 3923 (2024). https://doi.org/10.1038/s41467-024-47994-y

Figure 1a and 1c are reproduced under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The original image, exact pixel crops and SHA-256 are retained in this folder. The module uses native-resolution, lossless crops. Panel letters and 100 nm scale bars remain intact. The separate animated outlines are Fig.3D additions.

The paper's nanocubes and octahedra expose {100} and {111} faces, respectively. Its particles are approximately 60 nm; the small cuboctahedron in this explorer is a different, ideal explanatory model. It does not reconstruct a particle from the micrographs.

## Coordinate definition

Integer FCC coordinates `(i,j,k)`, with even `i+j+k`, satisfy both:

- `max(abs(i),abs(j),abs(k)) <= n`
- `abs(i)+abs(j)+abs(k) <= 2n`

The integer coordinate unit is **a/2 = 2.04 Å**, using a representative gold lattice parameter **a = 4.08 Å** as a model input, not a fitted measurement. Browser and Blender display these same integer coordinates. Nearest-neighbor distance is a/√2 ≈ 2.885 Å. The displayed sphere radii are symbolic; selected neighborhoods use smaller spheres to reveal their connections. No atom positions move during inspection.

The cuboctahedron has six square {100} and eight triangular {111} faces. Braces denote symmetry-equivalent families; the normal of a particular selected face is held in the model. Axis-aligned boundary planes are ±i = n and equivalents. Diagonal planes are ±i ±j ±k = 2n.

The 12 nearest-neighbor offsets are permutations of `(±1,±1,0)`. Each neighbor must actually exist in the finite coordinate set. No count is assigned from an atom's category.

## Exact checks

For complete shells n = 3…10:

| Shells | Total atoms | Surface atoms | Surface fraction |
|---:|---:|---:|---:|
|3|147|92|62.585034%|
|4|309|162|52.427184%|
|5|561|252|44.919786%|
|6|923|362|39.219935%|
|7|1415|492|34.770318%|
|8|2057|642|31.210501%|
|9|2869|812|28.302544%|
|10|3871|1002|25.884784%|

The UI displays a rounded percentage plus the exact numerator and denominator. Total atoms equal `(10n³+15n²+11n+3)/3`. Surface atoms equal `10n²+2`. The independent ASE checks compare **all coordinate sets and all neighbor sets**, not just these formulas.

Coordination distributions for this construction:

- Vertex: CN 5; 12 atoms.
- Edge: CN 7; 24(n−1) atoms.
- Square terrace: CN 8; 6(n−1)² atoms.
- Triangular terrace: CN 9; 4(n−1)(n−2) atoms.
- Interior: CN 12; the remaining atoms.

These are properties of this ideal unrelaxed shape, not universal values for all nanoparticle edges and corners. Ligands, defects, reconstructions, strain, solvent and temperature are absent.

## Cutaways and site geometry

A cutaway changes per-instance display scale only. The complete neighbor graph, counts and surface fraction are retained. The selected atom and its counted neighbors remain present in the view. Rotating is still needed to inspect occluded neighbors; an on-screen count is not a claim that every neighbor is simultaneously visible.

Atop is a surface atom's projected position. Bridge is the midpoint of a nearest-neighbor surface pair. A {100} hollow is the center of an actual nearest-neighbor square. The {111} hollow candidates are centroids of equilateral nearest-neighbor triangles. The two registries are classified by the first atom aligned along the inward face normal: the HCP hollow has one in layer 2, and the FCC hollow has one in layer 3. Every site's surrounding atoms and stacking depth are checked across all sizes and all faces.

The diamond is a **geometric position marker**, not an atom, molecule or simulated adsorbate. Its approach animation has no physical time, force field or calculated trajectory. Neighbor connectors mark counted proximity, not separate covalent bonds.

## Published chemistry comparison

The paper reports COOH* formation energies of **1.2 eV on Au{100}** and **1.4 eV on Au{111}**. The source is the Results discussion of Figure S10; computational context is the Methods section “DFT Calculation.” The slab calculation uses VASP/PAW/PBE, four-layer 4×2 periodic surfaces containing 128 atoms, 30 Å vacuum, a 450 eV cutoff and 1×2×1 k-points. Free energies include zero-point and entropy corrections at 298.15 K.

The explorer does not calculate these values. They describe formation energetics, not transition-state activation barriers. Their difference alone is not a reaction-rate or activity prediction. The paper studies plasmonic effects too; those mechanisms and quantitative activity prediction are deliberately outside this release.

## Claim-to-source ledger

| Claim or visual element | Basis | Where to inspect |
|---|---|---|
| Gold nanocube / octahedron imagery; facet assignments | Kang et al. Figure 1a,c and characterization text | Original PNG; DOI above |
| Published formation-energy comparison and context | Kang et al., Results, Figure S10 and DFT Methods | DOI above |
| Cuboctahedral construction and shell sizes | Explicit half-space FCC model, independently cross-checked with ASE | `nanoparticle-model.mjs`; `production/nanoparticle/ase-verification.json` |
| Neighbor counts, distances and surface fractions | Calculated from the finite coordinate set | `nanoparticle-verification.mjs` |
| HCP/FCC registry | Coordinate-derived second/third-layer alignment | Binding geometry tests for all 14 faces at all 8 sizes |
| Physical gold optical response | Not calculated | Materials and lights are explanatory art direction |
| Catalytic active-site ranking | Not claimed | Binding caption and comparison disclosure |

Independent geometry reference: [ASE cluster construction](https://docs.ase-lib.org/ase/cluster/cluster.html), `Octahedron('Au', length=2*n+1, cutoff=n, latticeconstant=4.08)`. Neighbor sets are independently obtained using ASE's distance-based neighbor list. Verified with ASE 3.29.0.

## Scope of verification

Numerical and software checks establish consistency of this ideal model and interface. They are not experimental validation, an expert scientific review, or a learner study. The proposed understanding tasks remain suitable for testing with actual learners.
