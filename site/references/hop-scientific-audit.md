# Scientific audit: a single rocksalt Li hop

Audited 30 September 2026. Scope: the custom code in `rocksalt-li-pathways (4).html` (excluding its bundled Three.js), the supplied Figure 1 image, and a geometrically explicit interpretation for the Fig.3D homepage. This is a geometry and source audit, not empirical validation or a migration-energy calculation.

## Source identification

The supplied image matches Figure 1 of **Han-Ming Hau et al., “Disordered Rocksalts as High-Energy and Earth-Abundant Li-Ion Cathodes,” Advanced Materials 37 (2025), 2502766**, DOI [10.1002/adma.202502766](https://doi.org/10.1002/adma.202502766). The figure appears on PDF page 2 of the [author-hosted full article](https://perssongroup.lbl.gov/papers/hau-2025_disordered_rocksalts.pdf). Its layered/spinel/DRX layout, local 1-TM glyph, legend and caption match the supplied image.

The left local glyph uses pale green octahedral Li, dark green tetrahedral Li/interstitial, purple TM and overlapping dashed vacant-site outlines. The source discusses local transport geometry and connected diffusion networks. It does not supply coordinates, an energy profile, or trajectory data for this glyph. The article states a Creative Commons Attribution license; retain author/article/figure attribution and identify the animated geometry as an adaptation.

Suggested attribution: “Figure 1: Hau et al., Advanced Materials (2025), DOI: 10.1002/adma.202502766. Animated geometry adapted for Fig.3D.” Link the DOI.

## Geometry contract

Use an **ideal cubic rocksalt framework**, with each coordinate unit equal to half the conventional cubic lattice parameter, `a/2`. This is an idealization, not an experimental layered-oxide structure.

- Octahedral cation-site centers: integer `(i,j,k)` with even `i+j+k`.
- Oxygen centers: integer `(i,j,k)` with odd `i+j+k`.
- Nearest oxygen neighbors of any octahedral site `P`: `P ± (1,0,0)`, `P ± (0,1,0)`, `P ± (0,0,1)`.

For the chosen **1-TM divacancy configuration**:

| Symbol | Coordinate | Initial meaning |
|---|---|---|
| A | `(0,0,0)` | Moving Li at its original octahedral site |
| B | `(1,1,0)` | Vacant destination octahedral site |
| C | `(1,0,1)` | Second vacant octahedral site; a gate site |
| D | `(0,1,1)` | Fixed transition-metal ion; the other gate site |
| T | `(0.5,0.5,0.5)` | Tetrahedral interstitial along the illustrative path |

The tetrahedral oxygen vertices are `O1=(1,0,0)`, `O2=(0,1,0)`, `O3=(0,0,1)`, `O4=(1,1,1)`. All four are at distance `√3/2` from T in these units. Every tetrahedron edge is `√2`. A, B, C and D also lie at distance `√3/2` from T; they are **cation centers outside the oxygen tetrahedron**, not its oxygen vertices.

The oxygen tetrahedron face-shares with four surrounding oxygen octahedra. The entry face adjacent to A is `{O1,O2,O3}`; the exit face adjacent to B is `{O1,O2,O4}`. A's and B's octahedra themselves share the **edge** `{O1,O2}`, not a face. Their center separation is `√2` (`a/√2`).

To draw complete coordination around both endpoint sites, render the **10 unique oxygens** in the union of their six-neighbor shells:

```text
A shell: (1,0,0), (-1,0,0), (0,1,0), (0,-1,0), (0,0,1), (0,0,-1)
B shell: (2,1,0), (0,1,0), (1,2,0), (1,0,0), (1,1,1), (1,1,-1)
```

The four tetrahedral oxygens are already included; do not duplicate them. Rendering only those four is insufficient to show both full octahedral cages.

A valid illustrative path is piecewise linear `A → T → B`. For normalized path progress `s`, use `lerp(A,T,2s)` for `s≤0.5`, then `lerp(T,B,2s−1)`. It crosses the two triangular face centroids at `s=1/3` and `s=2/3`, respectively `(1/3,1/3,1/3)` and `(2/3,2/3,1/3)`. T occurs at `s=1/2`. These geometric events are not energy extrema or measured times.

A, B and C lie in `x−y−z=0`, a symmetry-equivalent `{111}` plane; D lies in the neighboring plane. This is consistent with selecting a Li-layer hop and an adjacent TM. Use camera rotation to put D below T visually. The source glyph is schematic: exact 2D placement may require a presentation morph before reaching the true projected geometry.

Keep C visible or recoverable on inspection. Both B and C begin vacant in the divacancy interpretation. During the hop there is one moving Li; on completion A is vacant, B contains Li, C remains vacant and D remains TM. A dark-green T marker denotes a site or the same Li at an intermediate position, not a second simultaneously present ion.

## Match to supplied code

The local hop arrays at lines 741–742 map exactly onto this contract using `q=(v/H+1)/2`: `HV` gives A/B/C/D and `HO` gives the four oxygens. The 1-TM preset at line 745 is `[Li,vac,vac,TM]`. `hopFrame` at line 808 interpolates A→T→B; its face highlighting peaks at one-third and two-thirds, consistent with the geometry.

The separate frame demonstration at line 684 uses the opposite parity convention for oxygen/cation integer coordinates. That is a legitimate translated origin convention, but its arrays must not be combined with the hop convention without translating species and coordinates consistently.

## Mechanism evidence and limits

**Primary mechanism source:** Van der Ven and Ceder, “Lithium Diffusion in Layered LiₓCoO₂,” Electrochemical and Solid-State Letters 3 (2000), 301–304, [DOI 10.1149/1.1391130](https://doi.org/10.1149/1.1391130); [author PDF](https://ceder.berkeley.edu/publications/essl-3-301-2000.pdf). The calculated pathway depends on vacancy configuration. A divacancy enables a tetrahedral-site hop; an isolated vacancy can instead give an oxygen-dumbbell path. The barrier depends on the local environment, lattice dimensions and cobalt oxidation state. This supports the selected local divacancy example, not the claim that every Li hop must pass through T.

**Primary framework source:** Urban, Lee and Ceder, “The Configurational Space of Rocksalt-Type Oxides for High-Capacity Lithium Battery Electrodes,” Advanced Energy Materials 4 (2014), 1400478, [DOI 10.1002/aenm.201400478](https://doi.org/10.1002/aenm.201400478); [author PDF](https://ceder.berkeley.edu/publications/2014_Urban_Li_excess_config_space.pdf). Its Figure 2 and Section 2.1 describe the two gate sites and divacancy requirement. Sections 2.1–2.2 distinguish favorable layered 1-TM transport from generally less favorable 1-TM transport in compact cation-disordered structures. A local path does not establish a percolating network or a macroscopic diffusion rate.

## Claims and effects to omit

- Do not label T as a universally exact saddle point or barrier maximum. A calculated energy maximum requires a material-specific minimum-energy path; ideal coordinates alone cannot locate it.
- Omit the supplied `HB=[1,1.7,2.6,3.6,4.8]`, spectator penalty `0.35`, and `b sin²(πs)` energy profile (lines 738–752). They are invented illustrative choices, not literature data. No quantitative energy chart is warranted for this hero.
- Avoid universal “0-TM and 1-TM active; 2-TM blocked” labels or asserting that TM count alone determines mobility. Use “1-TM local environment” and explain what is counted.
- Do not present a rigid cubic cluster as an exact layered LiCoO₂ structure, an MD trajectory, or evidence of observed motion. Animation speed is viewing speed.
- Do not infer that the destination vacancy was created by TM migration from the source legend’s wording. Label it simply “vacant octahedral site.”
- Do not transfer the seed-tuned 8.5–9% connectivity demonstration (`SEEDS`, line 888), graph walker, or universal threshold into source-backed claims. A finite illustrative graph is not a transport calculation.
- Do not imply that all ordinary spinel Li occupies octahedral sites or that disordered rocksalt means the complete absence of short-range order.

Suggested visitor text: **“One Li-ion hop, unfolded from a paper figure.”** Supporting label: **“Idealized octahedral → tetrahedral → octahedral geometry.”** Model note: **“One 1-TM divacancy configuration. Motion illustrates a path; it is not a calculated migration trajectory or timescale.”**

## Verification performed

Independent coordinate assertions passed for parity, sixfold endpoint oxygen shells, fourfold T coordination, equal tetrahedral edges, the two shared triangular faces, the endpoint-octahedron shared edge, the 10-oxygen union, and both face-centroid crossings. The local prototype mapping was checked against its actual arrays and interpolation. No barrier, physical rate, measured atomic coordinate, or full prototype behavior is validated by these checks.
