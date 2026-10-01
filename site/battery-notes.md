# Fig.3D — How a battery works

## Scope

This interactive visualization has two completed views: a three-dimensional graphite / lithium cobalt oxide cell, and a graphite interior with hexagonal carbon sheets and interlayer lithium. A shared reaction state drives electrode inventories, formulas, role labels and the linked graph. Separate continuously moving markers indicate the selected charge/discharge direction while the composition stays fixed. It is an idealized insertion model, not a calibrated battery, molecular-dynamics trajectory, manufactured cell drawing or calculated crystal phase diagram.

The 3D cell is a slab cutaway. The negative graphite electrode stays on the left, the positive cobalt oxide on the right. Stable polarity and material identities remain visible. **Anode means oxidation; cathode means reduction.** Those electrochemical roles swap on charging. In battery engineering, anode/cathode often refer to discharge identities; the visualization instead names the active reaction explicitly.

## Reaction model

Take equal amounts of C₆ and CoO₂ host formula units. The illustrated partial discharge window is

Li₀.₆₀C₆ + Li₀.₆₀CoO₂ → Li₀.₃₀C₆ + Li₀.₉₀CoO₂.

Let `p ∈ [0,1]` be the selected mode's progress. In discharge, `d=p`; in charge, `d=1−p`. At either mode's current state:

- Graphite lithium fraction `xₙ = 0.60 − 0.30d`.
- Cobalt oxide lithium fraction `xₚ = 0.60 + 0.30d`.
- The sum is always 1.20 Li per equal pair of host units.

The cumulative reaction extent from the selected mode's start is `ξ=0.30p`. On a twenty-host bookkeeping basis, the amounts transferred are `20ξ=6p` Li equivalents and the same number of electron equivalents. Both half-reactions advance concurrently.

Discharge half-reactions:

- Li₀.₆₀C₆ → Li₀.₆₀₋ξC₆ + ξLi⁺ + ξe⁻.
- Li₀.₆₀CoO₂ + ξLi⁺ + ξe⁻ → Li₀.₆₀₊ξCoO₂.

Charge half-reactions:

- Li₀.₃₀C₆ + ξLi⁺ + ξe⁻ → Li₀.₃₀₊ξC₆.
- Li₀.₉₀CoO₂ → Li₀.₉₀₋ξCoO₂ + ξLi⁺ + ξe⁻.

Switching mode replaces `p` with `1−p`, so the physical composition stays unchanged. The visible slider sets graphite lithium content x directly between 0.300 and 0.600; it does not change when mode reverses. Motion does not advance or loop this finite reaction window. A quiet Pause motion control stops the direction markers. The slider is not a complete cell state-of-charge gauge. None of these chosen compositions or equal host quantities is a measured electrode loading or capacity balance.

Lithium-ion direction is graphite → oxide on discharge and oxide → graphite on charge. Electrons follow the same net electrode-to-electrode direction through the electronic solids and external circuit. Conventional current is opposite to electron motion in that external branch. Discharge uses a load; charge uses an external source. Chemical free energy can supply electrical work during discharge; an external source supplies energy to drive the reverse process. No voltage, current, power, overpotential, heat or physical timescale is calculated.

## Transport geometry

`battery-model.mjs` exports the exact 3D bounds and paths consumed by `battery-scene.mjs` and the checks. Lithium markers lie between the electrode interfaces, within the electrolyte. Electron markers start and end inside the electrode solids and take a route outside the electrolyte through the upper external circuit. Separator geometry denotes an electrolyte-filled porous insulating region, not pores resolved at scale.

The graphite and oxide solids contain illustrative lithium inventory marks. In the oxide they sit at positions between neighbouring grains throughout the block, in an interleaved order so a partial fill is spread through the volume, not swept in from one face; like the graphite marks they encode a fractional mean occupancy, not computed site positions. Electrolyte markers indicate net transport, not an additional inventory of explicitly tracked ions. The electrolyte is a steady-throughput reservoir with zero net lithium accumulation. Real counterions, solvent, SEI, electrode porosity, concentration gradients, double layers and side reactions are omitted.

## Graphite geometry and its limits

The interior is generated from a finite honeycomb patch: 37 hexagons, 96 unique carbon positions and 132 bonds per sheet. Four parallel sheets share the same registry. Carbon–carbon bonds all have length 0.65 view units; the gallery spacing is 1.67 view units. These are display units. All edges belong to hexagonal rings; interior carbon degree is three and exposed edges have lower coordination. A finite patch does not include edge termination chemistry.

Lithium positions are at hexagonal hollow coordinates, halfway between neighboring carbon sheets. The selected hollow sublattice gives 13 sites per gallery and 39 across three galleries. Aligned layers are a simplified local intercalated-graphite motif; ordinary graphite is commonly AB stacked, and lithiation changes registry, staging and ordering. We do not claim a single uniform stage for the partial x values in this visualization. The detailed structure at each composition is not solved.

Each displayed lithium site's opacity is a fractional occupancy weight. Their summed weight is exactly `39xₙ`. This is a linked visual encoding of the mean graphite fraction, not a claim that the finite displayed carbon patch has an atomistically correct LiₓC₆ stoichiometry. This distinction avoids treating a boundary-truncated patch and arbitrary number of representative galleries as a periodic formula unit.

The larger highlighted marker explains entry/exit through an exposed edge parallel to the sheets. It is not an additional inventory atom. Its interpolation does not predict hopping barriers, residence times, solvation, the interface reaction mechanism or microscopic diffusion. The carbon framework stays fixed; real composition-dependent layer relaxation and staging are omitted. The camera moves into the same graphite group visible in the overview, so layer orientation and species identity persist.

## Source record

1. **U.S. Department of Energy, DOE Explains…Batteries.** [Authoritative explanation](https://www.energy.gov/science/doe-explainsbatteries). Supports coupled ionic/electronic transport and conversion between chemical and electrical energy. Its electrode naming follows conventional battery discharge identities; our active roles use IUPAC definitions.
2. **IUPAC Gold Book, anode and cathode.** [Anode, DOI 10.1351/goldbook.A00370](https://doi.org/10.1351/goldbook.A00370); [cathode, DOI 10.1351/goldbook.C00905](https://doi.org/10.1351/goldbook.C00905). Oxidation defines the anode; reduction defines the cathode. Indexed authoritative definitions were checked; some direct HTML/PDF endpoints returned access errors.
3. **Ohzuku, Iwakoshi & Sawai (1993), “Formation of Lithium-Graphite Intercalation Compounds in Nonaqueous Electrolytes and Their Application as a Negative Electrode for a Lithium Ion (Shuttlecock) Cell,” Journal of The Electrochemical Society 140, 2490–2498.** [DOI 10.1149/1.2220849](https://doi.org/10.1149/1.2220849). Primary basis for reversible lithium–graphite insertion. No quantitative data from this paper are reproduced.
4. **Mizushima, Jones, Wiseman & Goodenough (1980), “LiₓCoO₂ (0<x≤1): A new cathode material for batteries of high energy density,” Materials Research Bulletin 15, 783–789.** [DOI 10.1016/0025-5408(80)90012-4](https://doi.org/10.1016/0025-5408(80)90012-4). Primary lithium–cobalt-oxide insertion research. Bibliographic record and publisher abstract checked in the original model audit; no voltage curve is reused.
5. **Hazrati, de Wijs & Brocks (2014), “Li intercalation in graphite: a van der Waals density-functional study,” Physical Review B 90, 155448.** [DOI 10.1103/PhysRevB.90.155448](https://doi.org/10.1103/PhysRevB.90.155448); [open author text](https://arxiv.org/html/1410.5632v1). Checked its carbon-layer registry, interlayer insertion and composition-dependent staging discussion. This motivates the geometry and its stated limits. No energies, calculated diffusion paths or phase predictions are transferred into the visualization.
6. **“Lithium intercalation into bilayer graphene,” Nature Communications 10, 275 (2019).** [Primary experimental and computational article](https://www.nature.com/articles/s41467-018-07942-z). Supports interlayer insertion via edges or defects and the importance of layer registry. Bilayer results are not treated as a quantitative model for bulk graphite.

Sources were checked on 30 September 2026. Human expert review remains optional; model/software checks are not empirical validation.

## Reproducible verification

Run from the site directory:

```sh
node battery-verification.mjs
node battery-controller-verification.mjs
```

Scientific and geometric verification passed:

- 2,002 progress states spanning both modes, checked against independent twenty-host equations.
- Lithium conservation, electron/Li transfer coupling, equal release/acceptance and balanced Li/C/Co/O/charge in both half-reactions.
- Partial stoichiometry limits, monotonic state changes and mode-switch composition continuity.
- Deterministic scrubbing and invalid-input rejection.
- Actual shared 3D route endpoints within solids; no electronic path inside the electrolyte; all nine ionic rows within the electrolyte.
- Unique honeycomb carbon positions, six-member rings, bond lengths and degrees.
- All lithium sites inside galleries at hexagonal hollows; gallery entry paths remain parallel to sheets.
- Exact fractional population encoding for graphite.

Maximum bookkeeping residual: **3.552713678800501×10⁻¹⁵** equivalents, floating-point roundoff. Graphite bond-length range: 0.6499999999999995–0.6500000000000006 display units.

Controller checks execute the real controller with a stub renderer and DOM, covering continuous fixed-composition motion, no automatic advance or reset of reaction state, velocity reversal on charge, slider coupling, reduced-motion static arrival, explicit Resume motion, pause after preference changes, preserved composition and reversed roles on mode change, graphite entry/return and hidden-tab pause. They do not substitute for actual WebGL/browser inspection, which is performed separately by the parent task.

## Implementation and third-party asset

- `battery.html` and `battery.css`: accessible controls, explanatory content, shared typography integration and responsive layout.
- `battery.js`: one reaction state and user interactions.
- `battery-model.mjs`: declarative bookkeeping, paths and graphite geometry.
- `battery-scene.mjs`: actual Three.js geometry, linearized material colors, lighting, damped bounded camera rotation and selection. It also exposes an optional label-free, noninteractive configuration for the parent-owned homepage teaser.
- `battery-verification.mjs` and `battery-controller-verification.mjs`: reproducible checks.
- `assets/battery-three-r128.min.js`: Three.js r128, extracted unchanged from the user-supplied `rocksalt-li-pathways (4).html` bundle. Original copyright/SPDX header retained; see `assets/battery-three-LICENSE.txt`. No source application's interface or teaching logic was copied.

The shared `visual-language.css` and Sora font are maintained by the parent site task. The visualization remains local-only; no site was published.
