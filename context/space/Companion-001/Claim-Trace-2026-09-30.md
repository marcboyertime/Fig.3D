# Companion 001 claim trace (30 September 2026)

This traces every scientific statement in the preserved original app, `site/references/rocksalt-li-pathways-user-original.html`, against the bundled source paper, `site/references/hau-2025-source-paper.pdf` (Hau et al., *Adv. Mater.* 2025, 37, 2502766). Page numbers are the PDF's own "(n of 27)" pages. The quoted passages come from a text extraction of that PDF.

It is the first pass at Verification-Tasks and Next-Steps items 2 and 3. It checks wording against the paper only. It does not verify the app's simulation code, its Monte Carlo output or its rendered geometry, and none of it is peer review. The local hop geometry is already covered by `site/references/hop-scientific-audit.md`.

Dispositions: **Supported** means the paper states it under the conditions given. **Supported with conditions** means the app should say the conditions the paper attaches. **External** means it is correct in general but not from this paper, so it needs its own citation. **Unsupported** means the paper does not say it and the app should reword or drop it.

## Mechanism and local environments

| App statement | Paper | Disposition |
| --- | --- | --- |
| Li moves octahedral → tetrahedral → octahedral ("o–t–o diffusion"). | p. 2: "Li in layered structures migrate between octahedral sites via an intermediate tetrahedral site (o-t-o diffusion) through a di-vacancy mechanism". | Supported |
| Each tetrahedral site face-shares with four octahedral sites; the environment is labelled by how many hold TM. | p. 2: "The migration barrier of this hop is determined by the number of TM that face-share with the intermediate tetrahedral sites." The four-site geometry is checked in `hop-verification.mjs`. | Supported |
| Only 0-TM and 1-TM count as active; 2-TM and above have too much repulsion. | p. 2: "only 0-TM and 1-TM are considered active, as the other tetrahedral sites have too strong an electrostatic repulsion". | Supported |
| Li migration in layered and DRX cathodes is a divacancy hop, so mobility depends on how much Li is present. | p. 2: di-vacancy mechanism for layered, and "Similar to layered structures, where Li migrates through a di-vacancy mechanism" for DRX. The Li-content dependence is the app's inference. | Supported; the Li-content sentence is an inference and should read as one |
| "At the tetrahedral site the Li is squeezed closest to all four corners. That is the highest-energy point of the hop, and it sets the migration barrier." | Not stated. The paper places spinel Li *at rest* in 0-TM tetrahedral 8a sites near 4 V (p. 12), which contradicts a universal "tetrahedral site is the maximum". | **Unsupported.** Reword to "the tetrahedral environment controls the barrier" (p. 2) without naming a saddle point. This matches the current hop audit, which makes no saddle claim. |
| A second empty corner (divacancy) lowers the barrier more than a Li-occupied corner; the relative barrier curves are schematic. | The paper names the di-vacancy mechanism but gives no ordering for "one empty" versus "two empty". | Schematic; keep the existing "schematic, not computed" label and add that the ordering comes from the divacancy literature cited as refs 5, 8, 21 and 22 on p. 2, not from this review. |

## Layered and spinel

| App statement | Paper | Disposition |
| --- | --- | --- |
| Layered (R-3m): only 1-TM and 3-TM environments; 1-TM channels form a 2-D percolating network. | p. 2, verbatim. | Supported |
| Slab spacing 2.6–2.7 Å gives a barrier below 500 meV. | p. 2: "With a typical slab distance of 2.6–2.7 Å, the migration barrier is below 500 meV for layered structures.[8]" | Supported (the paper cites ref. 8) |
| Spinel (Fd-3m): TM on 16d creates 0-TM, 2-TM and 4-TM environments; 0-TM tetrahedra give low-barrier 3-D percolation. | p. 2, verbatim. | Supported |
| Drawn as fully lithiated Li₂M₂O₄: TM on 16d, Li on 16c. | p. 12: Li occupies "8a-like tetrahedral sites … at around 4 V before further lithiation moves all Li ions to the octahedral, 16c-like sites at 3 V." | Supported for the lithiated (≈3 V) state. This answers the open "spinel occupancy / lithiation state" question in the Claim Ledger: the app shows the 16c state, and the text should name that state. |
| In ordinary LiMn₂O₄, Li rests in the 0-TM tetrahedral 8a sites. | p. 12 (8a at ≈4 V) and the p. 11 Figure 6 caption ("Td-8a site illustrates Li migration through a 0-TM channel"). | Supported |

## Percolation and DRX

| App statement | Paper | Disposition |
| --- | --- | --- |
| On a square grid the percolation switch is near 59% open. | Not in the paper. This is the standard square-lattice site-percolation threshold, p_c ≈ 0.5927. | External; add a textbook citation (for example Stauffer & Aharony, *Introduction to Percolation Theory*). |
| A fully random cation arrangement needs at least ≈9% Li excess for a percolating 0-TM network. | p. 3: "for a fully random distribution of cations, at least 9% of Li-excess is required to achieve a percolating network of 0-TM sites.[5,8]" Repeated on p. 9. | Supported with conditions: fully random, 0-TM only, Monte Carlo result. The app's "≈9%" slider mark is fine, but the app's own finite 3–6 cell crystals are not shown to reproduce it (see Open checks below). |
| DRX typically uses 10–20% Li excess; early DRX without excess gave low capacity. | p. 3, verbatim. | Supported |
| The 9% figure assumes a large particle; nano-sized DRX can work with less excess. | p. 3: "less Li excess is needed for nano-sized materials with very short diffusion lengths". The paper never says 9% assumes a large particle. | Supported with a reword: say that small particles need less, and drop "assumes … a large particle". |
| Most SRO types found in DRX reduce 0-TM percolation. | p. 3: "most SRO types typically found in DRX materials tend to reduce the percolation of 0-TM channels." | Supported |
| The "Li–TM mixing" side of the slider is the percolation-reducing SRO; "Li with Li" creates more 0-TM clusters. | Not stated in this form. The paper says SRO "can modify the percolation limit" (p. 9) and that large TM like Zr⁴⁺ "mix well around a tetrahedron, reducing the probability of forming" 0-TM (p. 9). | Model interpretation. The direction is consistent with p. 9, but the slider's two ends need their own definition and source. |
| Site-energy disorder can cut Li diffusivity by one or two orders of magnitude (not modelled). | p. 3: "reduction of the lithium diffusivity by one or two orders of magnitude"; p. 10: "up to two orders of magnitude". | Supported |
| Example ions Mn³⁺, Ni³⁺, Co³⁺, Ti⁴⁺ as TM corners. | Illustrative examples only; the paper discusses Mn, Ti, Ni and others. | Illustrative; harmless |

## Open checks this trace does not close

1. **Does the app's own model reproduce ≈9%? Partly; see `evidence/rocksalt-percolation/`.** `sweep.mjs` runs the app's unchanged lattice core. The ordered structures come out right: spinel has only 0/2/4-TM tetrahedra and a 3-D 0-TM network, and layered has only 1/3-TM with no 0-TM network, crossing only once 1-TM is allowed (p. 2). For random DRX, the chance that the 0-TM Li network crosses the crystal at x = 0.09 is only 0.17, 0.15 and 0.22 in the app's 3, 4 and 6 cell crystals. It rises to 0.25 at 16 cells, where the transition sharpens between x ≈ 0.09 and 0.12. So the model is consistent with a threshold near 9% for large crystals. In the sizes the app actually shows, though, a reader who sets the slider to the "≈9%" mark will usually see no crossing network, and the switch is smeared from roughly 0% to 30%. Before release, the DRX step should say that its small crystals rarely cross at 9%, or show the crossing probability rather than one random crystal. This is a sweep of the app's own model, not an independent check of the paper's Monte Carlo.
2. **What exactly do the "Li excess" and "short-range order" sliders map to?** The realized site counts and the SRO algorithm are not documented (see Model-Assumptions).
3. **The ion-release animation** is a connectivity probe, not a trajectory or a rate. Its label should say so (Claim Ledger row 4).

## Suggested rewording for the one unsupported claim

Replace "That is the highest-energy point of the hop, and it sets the migration barrier." with "How crowded this tetrahedral site is, and by what, controls how hard the hop is."

## Applied

`site/rocksalt.html` is a working copy of the original app with three text edits from this trace: the tetrahedral-site sentence is reworded as suggested above, the DRX step now says that its small crystals rarely cross at 9% (with numbers from the sweep), and the "Real DRX" step no longer says the 9% figure assumes a large particle. The simulation code is unchanged, and the reference file under `site/references/` still matches its recorded checksum. The working copy is linked from the collection as a companion preview, restyled with the Fig.3D shell (Sora, blue/dark surfaces, a way back). Its science beyond this trace is still unreleased.
