# Verification report: Lithium that moves together

Page: `site/fast-ion-diffusion.html`. Paper: He, Zhu & Mo, *Nat. Commun.* 8, 15893 (2017), with SI. Checked 6 October 2026 in headless Chromium 1512 × 982 and 390 × 844 with SwiftShader WebGL. No human expert review took place.

The checks are in three separate parts, as the brief asked. Part 1 asks whether the numbers and geometry match the source. Part 2 asks whether the page does what it says. Part 3 asks whether what the page says is a fair reading.

## 1. Scientific fidelity

Automated: `node site/fast-ion-diffusion-verification.mjs` runs 27 checks, all passing. The checks are written against the data files the page loads.

| Check | Result |
|---|---|
| Fig. 3b: 17 markers, max 0.2618 eV, start 0.063, end 0.0006 eV | Pass; y calibration residual 5 × 10⁻⁵ eV at 84.23 pt/eV |
| Fig. 3e: 14 markers, max 0.5808 eV at mid-path, ends ≤ 0.001 eV | Pass |
| Printed barriers 0.26 and 0.58 eV recovered from the vectors | Pass (0.262, 0.581) |
| Plots reproduce the markers exactly; straight lines between them, as printed | Pass |
| Channel: 8 sites alternating O/T, 1.988 Å apart | Pass |
| T site 4 × O at 1.935 Å; O cavity 6 × O at 2.03–2.45 Å; Zr–O 2.10 Å; min O–O > 2.4 Å | Pass |
| Five ions each advance exactly one site; O→T, O→T, T→O, T→O, O→T | Pass; matches the paper's LLZO rule |
| Occupancy pattern after = before shifted one site | Pass |
| T endpoints at 24d centres; O endpoints on 96h, 0.408 Å from 48g | Pass |
| Hop lengths 1.62 or 2.37 Å only | Pass |
| Endpoint Li–O ≥ 1.78 Å (1.94 at T, 1.79 at 96h) | Pass |
| Interpolation endpoints exact; closest Li–Li 1.775 Å mid-event (disclosed) | Pass |
| Endpoint Li–Li > 2.3 Å | Pass |
| Single-ion path T2 → O2 → T3 passes the O2 centre at s = 0.5 | Pass |
| Registration: 13 oxygens at 3.22 px RMS = 0.07 Å; next-best walk 18.6 px | Pass |
| Fig. 4 landscapes: a top 0.6, low 0; b 0.3 eV pocket at high sites (Methods) | Pass |
| 1D model rows: E = Σφ + repulsion exactly (to stored precision) | Pass |
| Re-run vs printed 4c at K = 3: 0.319 vs 0.330 (a), 1.528 vs 1.547 (b) | Pass |
| Re-run vs every printed 4d point within 0.07 eV (actual max 0.022) | Pass |
| Landscape a barrier below 0.6 eV for K = 2–6; landscape b above | Pass |

Manual:

- The opening's handover was checked at 50 % blend: the printed inset and the live model, overlaid at the fitted pose and scale. The printed oxygens sit on the model's oxygens. The streak tails (white) sit at the model's start positions.
- Panel crops were checked against the PDF render: 3b, 3e, 2e, and the native-resolution inset.

Units on the page:

| Quantity | Unit and reference |
|---|---|
| Energies | eV, each curve from its own lower end |
| Event coordinate | Normalized 0–1 |
| Model shift | Å, 0–3 |
| K | eV·Å |
| Distances | Å |

## 2. Implementation

**Automated browser check.** `production/fast-ion-diffusion/verification/browser-check.mjs` runs 45 checks, all passing. It covers the following.

Later visit and the event:

- A later visit opens on the model with no opening.
- Scrubbing moves the ions to the interpolated positions (within 0.02 Å), the Fig. 3b marker and the readout. At s = 0.5 the readout shows "0.22 eV, NEB image 9 of 17".
- Compare with the single ion: it resets the coordinate, switches the caption, and reads about 0.58 eV at mid-path.
- The ion chips select and clear. A click on ion 2 in the canvas selects it. A drag rotates without selecting. The arrow keys rotate.
- All three framework modes reach their target visibility.
- Play advances and pause stops.

Displays and questions:

- Figure 3 opens and returning keeps the coordinate.
- Each question keeps its own progress.
- "Why it's lower" opens the 1D model with the 3D scene hidden. The K slider snaps and the landscape b caption changes.
- "Where it sits" hides the scrubber. Average occupancy and the whole cell work.
- The tabs respond to the arrow keys.

Opening, fallbacks and phone:

- **First visit.** The opening waits for the stage to be in view. A click on the stage ends it on the model. "Explore now" skips it.
- **Reduced motion.** No opening and no build-in.
- **No WebGL.** Falls back to Figure 3, with the 3D button disabled. The plots and readout still work.
- **Phone.** No horizontal scroll, and all five ion chips sit on one row.

**Other automated checks.** All 10 existing Node checks in `site/*-verification.mjs` pass, unchanged by this work.

**Visual review.** Done on stills and videos in `/mnt/project-files/fig3d-review/fast-ion-diffusion/`:

- 21 desktop and 12 phone stills, covering initial, intermediate and final states in both the structural and the energy views.
- Desktop and phone review videos, recorded on a virtual clock at 15 fps so motion plays at its authored speed.

**Problems found and fixed during review:**

- `?no-opening` had also switched on reduced motion. It now only skips the opening.
- `?display=…` was overridden when the opening was skipped.
- The 3D canvas showed through the 1D model.
- SVG text colours were overridden by a CSS rule.
- Off-channel oxygens cluttered the cage view. They now appear only with the full framework.
- The inset zoom blurred. It is now laid out rather than scaled, with a native-resolution inset.
- Panel crops included slivers of neighbouring panels.
- The 1D model was unreadable at phone width. It now uses a tall layout.
- The bar labels collided. The bars are now horizontal.
- The no-WebGL note covered the figure.
- A heading lost a space at phone width.
- The primer said "within a few picoseconds" where the SI groups hops within 1 ps.

## 3. Interpretation

Each item is checked against `site/references/fast-ion-diffusion/scientific-notes.md` §2 ("What the page does not claim").

- **The two energy curves are never overlaid.**
  - They are drawn side by side on the same 0–0.7 eV scale. Each is labelled as measured from its own lower end.
  - "Go deeper" explains why: different systems, different x axes, different references.
- **Interpolated motion is labelled.**
  - It is labelled under the scrubber ("Event coordinate, start to end. Not time.").
  - It is labelled in the caption note and in "What the animation does not show". That section names the 1.78 Å close approach as a drawing artifact.
  - Playback speed is described as meaningless.
- **No per-ion energy split for LLZO.** Bars appear only for the 1D model, where they are exact, and the page says so.
- **Collective migration does not always help.**
  - Landscape b is one tap away, with its own caption.
  - The 4d plot and SI Note 4 (LiTiS₂) are cited.
- **NEB barrier, AIMD Ea and experimental Ea are kept apart.** They appear as three numbers in "Barrier, activation energy, conductivity", with what else conductivity depends on.
- **Connectivity.** The whole-cell view is labelled "connectivity only… does not establish how well the network conducts over long distances".
- **Partial occupancy.**
  - "One moment" shows only the event's five ions as atoms.
  - "Average occupancy" uses small translucent spheres, captioned as a time average and not 72 ions.
  - Branch sites are rings, never atoms.
- **Inferences are labelled.** The start-above-end reading is marked as "our reading, not a statement in the paper".
- **Material choice.** Only LLZO is modelled. LGPS and LATP appear as numbers with their sources, with no switch.

## Untested limits

- **Browsers and devices.**
  - Only headless Chromium with software WebGL was used.
  - Safari, Firefox, real phones and real GPUs are unchecked.
  - Touch was emulated, not performed on a device.
- **Performance.** Not measured on low-end hardware. SwiftShader runs about 1 s a frame, which says nothing about real frame rates.
- **Accessibility.** Screen-reader output was not checked with a real screen reader. ARIA labels and live regions are present, and keyboard paths are covered by the automated check.
- **Live deployment.** The page is not deployed. Merging to main deploys it, and that waits for the owner's approval.
- **Expert review.** No materials scientist has reviewed the page.
