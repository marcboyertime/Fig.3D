# Why some crystals let lithium fly: scientific notes and claim ledger

Companion to Yan Wang, William Davidson Richards, Shyue Ping Ong, Lincoln J. Miara, Jae Chul Kim, Yifei Mo & Gerbrand Ceder, "Design principles for solid-state lithium superionic conductors", *Nature Materials* 14, 1026–1031 (2015), doi:10.1038/nmat4369, and its Supplementary Information (SI). The article is © Macmillan Publishers Limited; the page shows its figures unchanged, with attribution, as a study aid that sends readers to the original.

This file covers what the page claims, where each claim comes from, what was computed or inferred here, and what the page does not claim. `site/anion-framework-verification.mjs` checks the numbers below against the data the page draws (`node anion-framework-verification.mjs` from `site/`).

## 1. Scope

The page explains the paper's central result: with sulfur fixed and nothing else present, a lithium ion hops between face-sharing tetrahedral sites in a bcc sulfur lattice over 0.15 eV, while fcc and hcp force it through an octahedral site. Three questions follow the paper's order:

- **One hop** (Fig. 2): the bcc T–T path, the fcc T–O–T path, the three hcp paths, and the site network each lattice makes.
- **Squeeze it** (Fig. 3, SI Figs S4–S6): every path at the seven volumes the paper computed, 28.5–70.8 Å³ per S.
- **Real crystals** (Figs 1, 4, 5): LGPS reduced to its sulfur, matched to bcc, with its lithium sites on bcc tetrahedral sites; Li₂S as the exact-fcc counter-case.

Na⁺/Mg²⁺ results, the AIMD activation energies of Table 1 and the Li₃BS₃/β-Li₃PS₄ predictions are mentioned only in "Go deeper" or not at all.

## 2. Claim ledger

Status codes: **P** stated in the paper or SI; **D** digitized here from the PDF; **C** computed here from stated inputs; **I** our inference, labelled on the page; **S** schematic, labelled on the page.

| # | Claim on the page | Status | Source |
|---|---|---|---|
| 1 | Single Li⁺ in a fixed S²⁻ lattice, no other cations, 40 Å³ per S (same as LGPS) | P | Main text, "Anion lattice…" paragraph |
| 2 | bcc T–T barrier 0.15 eV; fcc T–O–T 0.39 eV; hcp T–O–T 0.40 eV; hcp T–T 0.20 eV; hcp O–O 0.19 eV | P/D | Main text; Fig. 2 markers read to 0.150, 0.388, 0.396, 0.202 and 0.190 above the O site |
| 3 | Lithium is most stable in the tetrahedral site in all three lattices at 40 Å³ | P | Main text |
| 4 | In fcc and hcp the octahedral site lies about 0.30 eV above the tetrahedral one at 40 Å³ | D | Fig. 2b,c: 0.292 eV |
| 5 | The bcc octahedral site is unstable at every volume | P | SI Table S2 |
| 6 | hcp T–T pairs do not percolate; long-range motion alternates T–T and T–O–T | P | Main text |
| 7 | "About three orders of magnitude" in room-temperature conductivity | P | Main text, σ ∝ exp(−Eₐ/kT). The bare factor exp(0.24 eV / kT) is about 10⁴ (C); "Go deeper" gives both. |
| 8 | Volumes 28.5–70.8 Å³ per S span lithium sulfides in the ICSD | P | Main text, SI Fig. S2 |
| 9 | bcc barrier falls steadily with volume and is lowest at every volume | P/D | Main text, Fig. 3 |
| 10 | Regimes I/II/III in fcc and hcp; boundaries "about 31 Å³" and "about 44 Å³" | P/C | Regimes: main text and Fig. 3. Boundary values read from Fig. 3's shading (31.0 and 43.5 Å³). |
| 11 | Barrier and site energy at each volume | D | SI Figs S4–S6 raster markers found by colour; agree with Fig. 3's vector markers to 0.008 eV |
| 12 | bcc reaches no barrier near 62 Å³ | D | SI Fig. S4 (0.000 eV at 62.1, 0.005 at 70.8) |
| 13 | hcp O–O was computed only at 28.5, 34 and 40 Å³ | D | SI Fig. S6c has those three panels only |
| 14 | Stars: Li₇P₃S₁₁ 0.18 eV at 37.7 Å³; LGPS 0.22 eV; γ-Li₃PS₄ 0.49 eV; Li₄GeS₄ 0.53 eV | P | Main text and Fig. 3 |
| 15 | LGPS 12 mS cm⁻¹ at room temperature; Eₐ 0.22–0.25 eV | P | Introduction |
| 16 | LGPS sulfur matches bcc with a = b = 4.35, c = 4.20 Å, R = 0.58 Å | P/C | SI Table S1; our fit of the Kamaya structure gives R = 0.579 Å |
| 17 | Every LGPS lithium site lies within 0.7 Å of a bcc tetrahedral site (median 0.29 Å) | C | Our fit, `production/anion-framework/build-scene.py` |
| 18 | Li₂S sulfur is an exact fcc lattice, a = 5.76 Å; lithium fills every tetrahedral site | P | SI Table S1 (R = 0); antifluorite structure |
| 19 | LGPS has partly occupied lithium sites (for example 69%), about 20 Li per cell | P | Kamaya et al. 2011 structure (via pymatgen's test files); formula Li₁₀GeP₂S₁₂, Z = 2 |
| 20 | Figure 4: AIMD at 900 K; LGPS channels, Li₇P₃S₁₁ 3D network, Li₂S isolated sites, Li₄GeS₄ pairs | P | Fig. 4 caption and text |
| 21 | Only 25 transition-metal-free lithium sulfides match bcc, most of them badly | P | Main text on Fig. 5 |
| 22 | Methods: PBE, PAW (VASP), climbing-image NEB, 3 × 3 × 3 supercell, uniform background charge, only Li moves | P | Methods |
| 23 | The 3D model's sulfur lands within 0.03 Å (1.4 px) of the ten spheres in the Fig. 2a render | C | `production/anion-framework/registration/fit-figure-2a.py`, perspective camera fit |
| 24 | bcc T sites form one connected network; fcc T sites share no faces; hcp T sites pair up | C | Ideal lattices, face-sharing test in `build-scene.py` |

## 3. What is drawn rather than calculated

- **The lithium's route.** Each path is drawn straight from site to face centroid to site. The paper's NEB images are evenly spaced along the energy axis; the faint spheres mark that spacing on the drawn route, not computed positions. Stated under the plot ("drawn, not calculated").
- **Regime III.** The paper says the path bypasses the octahedron's centre; the drawing keeps the straight route through it. Stated in the Squeeze it note.
- **Scaling.** Each lattice is scaled evenly with the cube root of volume. The paper fixes the sulfur in every calculation, so this is the same lattice at a different spacing, not a relaxation.
- **LGPS morph.** Step 3 moves each sulfur in a straight line to its bcc point. It shows the match, not a physical transformation.
- **Playback.** A reading pace; the slider is labelled "Position along the path, start to end. Not time."

## 4. What the page does not claim

- That a bcc sulfur lattice guarantees a fast conductor. The paper calls it a descriptor; real crystals add cation repulsion, and LGPS measures 0.22–0.25 eV against the bare 0.15 eV.
- That the bare-lattice barrier equals a measured activation energy. The stars on the volume plot are kept separate from the curves.
- Anything about transition-state geometry, timing or rates beyond the paper's barriers.
- That LGPS's average structure is a snapshot. Partly filled sites are drawn faint and labelled as an average.

## 5. Figures

All figures are rasterised unchanged from the article PDF by `production/anion-framework/extract-figures.py`. The SI figures were digitized for data but are not shown on the page.
