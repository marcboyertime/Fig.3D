# An interwoven battery — source and scientific interpretation

Primary source: Tait et al., *All-organic self-separating three-dimensionally nanoarchitected electrochemical energy storage devices*, arXiv:2604.26222v1, submitted 29 April 2026. https://arxiv.org/abs/2604.26222

This companion focuses on Figures 1 and 2, with advanced processing and evidence views drawing on Figures 5 and 6. It uses geometric explanations and an explicitly separate ideal scaling model; it is not a reconstructed specimen, fitted device simulation, or independent confirmation of the experimental mechanism.

## Claim ledger

Page numbers refer to the supplied 47-page PDF.

| Explorer claim | Source | Scope |
|---|---|---|
| Layered electrodes remain a layered architecture when rolled | Figure 1a, pp.14–15 | Packaging and topology; not an assertion that all commercial cells are identical |
| An ordered double-gyroid cell precedes the present design | Figure 1b, caption pp.14–15, reference 21 | Earlier Li–S work; the explorer does **not** present that geometry as the new material |
| Carbon, separator/interphase and cathode extend as networks, despite apparent isolated regions in the figure | Figure 1c and caption pp.14–15 | Principal spatial idea |
| Co-assembly → carbonization → electropolymerization → SEI-forming processing | Figure 2, p.16; discussion pp.16–25 | Chemical structures preserved in original Figure 2 |
| Hybrid uses an ultra-large-molecular-mass block copolymer and phenol-formaldehyde resols | pp.16–18 | The two displayed precursor domains simplify compositional organization |
| Carbonization occurs under nitrogen and removes the template | Fig.2, pp.16–18 | Schematic phase removal, not atomistic thermal kinetics |
| Average measured pore size is about 90 nm | Fig.3d and discussion pp.17–18 | No length calibration is assigned to our mesh |
| No periodic order was achieved in this material | pp.17–18 | Explorer deliberately uses a nonperiodic random field |
| PAQEDOT is electropolymerized on carbon | pp.19–21 | Actual coating is heterogeneous, not perfectly conformal |
| An outer PEDOT layer helps establish a separate cathode contact | pp.21–22 | Omitted from the interior geometry; acknowledged in copy |
| Low-potential processing against external Li in electrolyte de-dopes the polymer and is interpreted to create SEI at the carbon/polymer interface | pp.23–24 | Proposed mechanistic interpretation, not directly resolved interphase growth |
| Intended SEI function is ionic passage with electronic separation | Fig.2 and pp.23–25 | Illustrated function; no conductivity or rate estimated |
| Sustained OCP supports electronic separation | p.25 | A supporting observation, not proof of our exact displayed topology |
| Proof-of-principle cells have rapid capacity fading and limited cyclability | Abstract; pp.30–31 | No performance superiority inferred from geometry |
| “All organic” refers to organic-derived electrodes/framework, not every component | Materials and processing discussion; SEI chemistry pp.23–24 | Li salts, metal contacts and inorganic SEI constituents are not erased |

## Geometry

A seeded Gaussian-smoothed random scalar field defines nested phase domains on a 41³ grid, in dimensionless coordinates from −3 to +3. The field is generated with NumPy seed 16, Gaussian sigma 5 grid samples, and a central crop of an 81³ field. It is normalized by its sample mean and standard deviation.

- Carbon: f ≤ 0.
- Initially deposited cathode: 0 < f < 0.94.
- Final SEI: 0 < f < 0.24.
- Final cathode: 0.24 ≤ f < 0.94.
- Residual pore: f ≥ 0.94.

These thresholds are visualization choices. They are not calibrated volume fractions, measured separator thicknesses, pore diameters or stages of physical growth. The coating is simplified relative to the heterogeneous real specimen. The precursor/template view uses the same field for continuity of explanation; it is not a molecular reconstruction of self-assembly.

The two boundaries of each band are extracted separately with marching cubes. Extracting a narrow band from a sampled max-function can erase the interphase between grid points; that artifact is specifically avoided. Flat specimen boundaries and the movable cut face are clipped to the same scalar intervals. Surface normals face outward, with deliberately sharp normals at the finite sample edges.

The dominant component of every phase spans all three sample axes. Carbon, deposited coating, final cathode and pore connectivity are checked with six-neighbor voxel adjacency; the thin SEI uses 26-neighbor adjacency. At this sampling resolution, carbon has two isolated voxel samples (99.994% in the spanning component), while the thin SEI has a 15-sample secondary component (99.768% in the spanning component). These are reported rather than hidden; finite-grid tests do not prove topology at every sub-grid point. See `production/self-separating-battery/geometry-check.json` for the full fixture.

Carbon and cathode routes begin with breadth-first search in their respective six-connected voxel masks. Every original axis-aligned segment stays in its threshold interval under linear interpolation. A line-of-sight simplification and guarded corner rounding make the displayed route readable; each resulting segment is sampled against the trilinear field at steps no larger than 0.018 display units, then independently checked at 0.009. Rounding that exits its phase is rejected. Tube radius is a visibility aid; the route centerline, not every tube vertex, is checked. No conductivity, percolation probability or transit time is estimated. Cutting or hiding changes rendering only, not these masks or paths.

The enlarged local-interface view is a separate curved patch with the same layer order and colors, not a physical zoom into a particular recovered wall. Its thickness is exaggerated for readability. Li⁺ markers show trans-interface transport; electron markers stay in their electrode layer. Marker speed and recirculation have no physical time interpretation, and the view is not a charge-balanced full-cell simulation.

## Process interpretation

The experimental SEI treatment involves external lithium and liquid electrolyte. It should not be read as spontaneous dry separation. The paper describes polymer de-doping at low potential, SEI generation associated with electrolyte decomposition, and further lithiation/charging steps. The explorer groups those steps in a single “Separation” state and preserves the detailed interpretation here. Polymer deposition precedes the interphase; the model never places a prefabricated separator onto carbon first.

## Figures and rights

The attached PDF is the source of the original embedded JPEGs: Figure 1 at PDF page 14, Figure 2 at page 16. Native dimensions are 1276 × 414 and 1431 × 702. Neither has been repainted, AI-enhanced or upscaled. Panel identities, chemical drawings and scale bars remain intact. Native source resolution limits enlargement; the paper viewer keeps the source accessible independently of the opening animation.

The arXiv record uses the **arXiv non-exclusive distribution license**, not a Creative Commons reuse license: https://arxiv.org/licenses/nonexclusive-distrib/1.0/license.html. This local educational prototype does not assert a blanket public reproduction grant. Public distribution rights for the figures have not been independently cleared. Provenance and hashes are recorded in `provenance.json`. No public deployment is part of this change.

## Deliberate exclusions

No polymer molecular dynamics, electrochemical kinetics, full reaction mechanism, rate/capacity prediction, lithium conservation model or reconstruction from tomography is claimed. The prior ordered double-gyroid example remains in the source comparison but is not mislabeled as this paper’s nonperiodic architecture.

## Advanced exploration: figures, derivations and limits

The optional “Go deeper” mode adds original explanatory visuals and a foundations-to-interpretation reading layer. Its additional native figures are Figure 5 (PDF p.24; 1125 × 794) and Figure 6 (p.25; 1428 × 753), extracted without resampling. Their hashes are in the provenance packet; the same rights statement above applies.

| Advanced content | Basis | Limits |
|---|---|---|
| A detached sampled plane and clipped 3D volume show one field at the same section depth | Existing deterministic field; scalar masks and renderer cut geometry | A 41×41 grid is a sampling device, not a micrograph. Four-neighbor 2D components are not continuous-domain or 3D components. All 41 slices are independently compared with SciPy labeling. |
| Uniform ionic slab resistance R = L/(κA); at fixed κ and A, R/R₀ = L/L₀ | Algebra from j = κΔV/L, I = jA and R = ΔV/I | Constant conductivity, uniform cross-section, ohmic response; excludes contact, charge-transfer and other polarization losses. No device fit. |
| Diffusion timescale ratio t/t₀ = (L/L₀)² | Nondimensionalization of ∂c/∂t = D∂²c/∂x² | Constant D and geometrically similar initial/boundary conditions. No absolute time, inferred D or charging-rate prediction. |
| PAQEDOT has conducting-backbone and redox-pendant functions; outer PEDOT enables contacting | pp.19–22, Figure 4 | The enlarged layered processing diagram is explanatory; it does not show the exact porous specimen or molecular orbitals. |
| Low-potential treatment vs external lithium, subsequent stripping, polymer reduction, then full-cell charging | Figure 5a–d, pp.23–25 | Four visual states group several experimental steps. The intermediate Prepare scene shows the external-Li connection for polymer reduction; the text explains the subsequent full-cell charge. The preceding Deposit state shows material contact, not the electropolymerization apparatus. |
| De-doping, SEI generation and possible lifting of polymer from carbon | pp.23–24 | Authors’ proposed interpretation. The placement of a visible interphase is not a measured growth trajectory. |
| Full-cell cycling occurs after lifting the device from the external bath | pp.25–26 | The final circuit omits external lithium and bath. Intended operation is illustrated; no charge-balanced transport animation is claimed. |
| Initial device: first discharge 120 mAh/g; third discharge 20.8% of theoretical 132 mAh/g | p.26; Figure 6c | PAQEDOT mass basis, not whole-device mass. Third bar is computed: 0.208×132=27.456≈27.5. Ratio to the initial discharge: 27.456/120=22.88%. No second-cycle value is invented or interpolated. |
| Authors report OCP above 3.5 V after a five-hour hold | pp.25–26; Figure 6b/d | Displayed as a reported observation, not a digitized voltage trace, perfect-insulation test or power measurement. |
| Possible conduction/redox mismatch, trapped semiquinones and irreversible contributions | pp.28,30–31 | Candidate mechanisms and unresolved limitations, not proven unique causes. Later optimized cells are not combined with the initial device’s capacity bars. |

The length-scale outline marks L₀; only the current slab thickness changes. The cross-sectional area stays fixed. The illustrative material colors help locate the slab and its boundaries, but κ and D are never taken from the original paper. The network slice uses the same coordinate frame and plane index for the clipped surface, section outline and sampled plane; the plane’s displayed pixelization is intentional and labeled.
