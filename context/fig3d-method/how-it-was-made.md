# How the interwoven battery companion was made

A playbook for another coding agent (Codex or anyone else) to reproduce the method, not just the result. It describes what was actually done on 3 October 2026 for `site/self-separating-battery.html` (PR #8). File references are to the Fig.3D repo.

The short version: the beauty did not come from effects. It came from five habits.

1. Let the source figure set the look.
2. Make the 3D land *on* the figure instead of fading to it.
3. Hold everything to reading speed.
4. Look at every state as a picture before calling it done.
5. Let automated checks catch what eyes miss.

---

## 1. Start from the paper, not from the page

- **Read the paper itself.** Then write a claim ledger before touching code. Each claim gets four things:
  - what the companion will say;
  - the figure or section that supports it;
  - a label: **observation**, **derivation**, **illustration** or **proposed mechanism**;
  - what it does *not* claim.

  See `site/references/self-separating-battery/scientific-notes.md`, section "Redesign — claim mapping".
- **Re-check every concrete fact against the text, not memory.** Examples from this paper:
  - the Fig 6 values: OCP > 3.5 V after 5 h; first discharge 120 mAh/g; third discharge 20.8% of 132;
  - that the device was "lifted out" of the liquid before cycling;
  - which lead each processing step connects to.

  Several earlier visuals were wrong because these had been paraphrased.
- **When you infer something, say so.** The terminal mapping (working electrode on +, external Li on −) is read from the Figure 5 insets, not stated in the text. The notes say exactly that.
- **Why this matters for beauty:** a visual that is scientifically confused looks confused. Distinct, correct states produce distinct, legible pictures.

## 2. Take the palette and the viewpoint from the figure

**Palette.** Use the paper's own colours so the reader can compare model and figure at a glance. Defined once in `PHASES`, `site/self-separating-battery-model.mjs`:

| Phase | Mesh colour | UI swatch |
|---|---|---|
| Carbon | `0x45484f` | `#8a8e96` |
| PAQEDOT (cathode) | `0x0f4f8a` | `#3f8fd6` |
| SEI | `0x6fbf96` | `#8fd8b2` |
| Template | `0xb5363d` | `#d0545a` |
| Resol precursor | `0x2a3aa6` | `#5865d4` |

- **Keep two values per material.** Use a darker mesh colour, because lighting brightens it, and a lighter UI swatch so the legend reads on near-black.
- **Convert sRGB to linear** before handing colours to Three.js (`new THREE.Color(hex).convertSRGBToLinear()`). Skipping this made the Connections section plane look washed out.

**Viewpoint.** Measure the printed object instead of guessing.

- The cube in Fig 1c was measured in native pixels: visible face widths 169 : 140 px, top-edge slopes 43 : 51 px.
- An orthographic pose was fitted to those numbers: yaw 0.70, elevation 0.31 (`PAPER_POSE`).
- The working view afterwards is `HOME` = yaw 0.56, elevation 0.44.
- Anchor boxes for each printed cube are stored in native pixels (`ANCHORS`). For example, Fig 1c is `[937,56,1246,365]`, and each Fig 2 stage cube has its own box.

**Lighting.** Neutral, so grey stays grey and blue stays blue. See `lighting()` in `site/self-separating-battery-scene.mjs`.

- **Environment:** PMREM from a small dark studio scene (background `0x15181f`) with four soft emissive panels.
- **Lights:**
  - hemisphere `0xe4ebff`/`0x15171d` at 0.32;
  - key `0xffffff` at 1.3 with 1024² soft shadows (bias −0.00015, normalBias 0.015);
  - cool fill `0xb9c8ff` at 0.55;
  - warm rim `0xfff0de` at 1.25.
- **Tone mapping exposure:** 0.86. The first pass was too bright and the paper colours looked pastel; lowering exposure and light intensity fixed it.
- **Materials** are `MeshStandardMaterial` per phase. Carbon is slightly metallic and rough (0.18 / 0.6). The cathode is smoother (roughness 0.36), so its curved pore walls catch a highlight. SEI gets a faint emissive (`0x16301f`, 0.2) so the thin interphase never goes black in shadow.
- **Cut faces** use the same colours but rougher (0.72, no metal), so a cross-section reads as a flat cut, not a shiny surface.

## 3. Make the model emerge *from* the figure

This is the moment people notice. A crossfade is not enough; the model has to take the printed object's exact place. See `site/self-separating-battery-emergence.mjs`.

1. **Zoom the real figure.** A DOM copy of the visible figure scales about its corner until the printed cube's box matches the model's on-screen box at `PAPER_POSE`. Cap the zoom at about 1.35× native pixels so the raster never looks soft.
2. **Hand over the same pixels.** At the moment of handover, the figure becomes a textured plane *inside* the WebGL scene, at the same screen position (`MeshBasicMaterial`, `toneMapped:false`, sRGB texture). Nothing visibly changes, but now it can move in 3D.
3. **Reveal the model in place.** A cropped copy of just the printed cube sits in front (`depthTest:false`) and dissolves, revealing the shaded 3D cube underneath in the same pose.
4. **Lay the page back.** The page group rotates −1.45 rad about the camera's right axis, hinged at the printed cube's base, and dims as it recedes. At the same time the camera eases from the paper pose to the working pose.

Timing profiles:

| Profile | Zoom | Reveal | Lift | Hold |
|---|---|---|---|---|
| Opening | 2600 ms | 1300 ms | 3000 ms | 500 ms |
| Return from a figure | 560 ms | 340 ms | 760 ms | 0 ms |

Repeated comparisons must be quick. Use `easeInOut` (cubic) everywhere, and cap frame deltas at 250 ms so a slow frame never makes the motion jump.

**Rules that keep it trustworthy:**
- **Any input yields.** A drag, wheel, key or click on the stage calls `yieldCamera()`: the page clears quickly, the reader gets the camera and the opening never resumes. A capture-phase listener on the whole stage is needed, because during the zoom phase the canvas is not the topmost element.
- **Truthful buttons.** One `display` value drives both the stage and the buttons (`'model'|'1'|'2'|'5'|'6'`), so the selected button always matches the content.
- **Reduced motion** skips the emergence entirely.

## 4. Pace the opening for reading

- **Reading time:** `max(4 s, characters / 15 + 0.5 s)` per beat (`readingTime`, `openingSchedule()`).
- **Four beats:**
  1. the original figure;
  2. "Panel c, given depth" (the emergence);
  3. a slow cut into the volume;
  4. isolating the cathode network.

  The opening runs about 41 s.
- **One visible change per beat.** Each beat names its own visible state, so captions, buttons and scene can't disagree.
- **Controls:** a discreet Pause and "Explore now". Pause freezes both the clock and the emergence.
- **No headline periods.** Line breaks are chosen by hand ("Panel c,\ngiven depth").

## 5. Explain with distinct pictures, not more text

"Go deeper" was rebuilt so that every step changes the scene, not only the caption.

**Connections** (`site/self-separating-battery-depth-scene.mjs`, `hiddenConnection()` in `site/self-separating-battery-depth.mjs`):
- the volume and the same section shown flattened beside it;
- a breadth-first search through carbon samples finds a route joining two patches that look separate in the slice;
- the route is drawn as a tube that leaves the plane.

**Length scales:**
- an ideal slab with fixed area and adjustable thickness L, with a plot of R ∝ L and t ∝ L²;
- labelled as an ideal comparison, not a device fit.

**Formation** (`site/self-separating-battery-formation.mjs`): six states, each one data row driving two linked views.
- **The bench** follows the Figure 5/6 insets: vial, liquid, Li chip, the device's two leads, an instrument with red + and black − terminals, and cables only to the leads in use. The device sinks into or rises above the liquid.
- **The magnified wall** (SVG, crisp at any size) shows carbon | SEI | PAQEDOT backbone and pendants | pore. It shows what that step changes: SEI appearing, Li plating then stripping, pendants filling, anions returning, "e⁻ blocked".

**Evidence:**
- the original Figure 6 panels, unaltered;
- thin marks placed at the reported values, using axis calibrations measured on the native image (for example panel b: y = 316 − 63.56·V).

**Labels** live in the scene as HTML anchored to 3D points (`placeLabels()`), with leaders only where needed. On narrow stages, text is shortened rather than shrunk (for example "Flattened section" instead of "The same section, flattened").

## 6. Look at every state, at every size

This is where most of the quality came from. The loop, repeated many times:

1. A Playwright script clicks through every state and saves a screenshot of each: overview, layered, routes, four fabrication stages, interface, the four deep topics, six Formation steps and both evidence views.
2. A small Python script tiles them into a contact sheet. Look at the sheet, write down every flaw, fix and repeat.
3. Do it at 390, 600, 768, 1440 and 1920 px wide, and at 720 px with 2× density as a stand-in for 200% zoom.

Things this caught that no unit test would:
- **Labels:** "Device" overlapped "Electrolyte"; "Cathode", "Ion conductor" and "Anode" sat on top of the slab; a vertical "e⁻ blocked" sat on a narrow band.
- **Text:** a wall heading wrapped onto two lines; "Length scales" wrapped inside its tab; "PAQEDOT · de-doped" collided with "Pore · liquid".
- **Framing:** the Connections volume was clipped at the left edge.
- **Phone layout:** the magnified wall completely covered the Formation bench. Fixed by a taller stage with the bench above and the wall below; the camera framing follows the same 560 px breakpoint as the CSS.
- **Hidden prose:** with all prose hidden, the moving dots in Interface were unnamed. Fixed with a small key: "Li⁺ ion" and "Electron".

**Turn the visual checks into an audit.** Every label's box is checked against every other label, the stage edge and the magnified wall, plus horizontal overflow, in 25 states at 5 widths. See `production/self-separating-battery/verification/browser/layout.mjs`.

## 7. Test the interaction like a reader

`verification/browser/interaction.mjs` runs 27 checks in a real browser:
- **Opening:** the selected button matches the visible content across 60 samples during the opening; pause holds it.
- **Hand-over:** a drag at 3 s, 12 s or 17 s ends the opening for good.
- **Drag sign:** dragging right decreases yaw; elevation stops at ±1.08.
- **Input:** arrow keys rotate; click without a drag selects a material; Reset works.
- **State preservation:** cut, material, view, camera and each figure's zoom return exactly after visiting figures.
- **Navigation:** Escape returns to the model; 18 rapid figure/model clicks settle on the last choice.
- **Preferences and failure:** reduced motion, and the no-3D fallback.

**Bugs these found:**
- A second figure-to-model return crashed: an instance field named `texture` overwrote the `texture()` method, and `plan` overwrote `plan()`. Never reuse a method name for a field.
- Escape only worked when focus was inside the figure.
- A drag during the zoom phase didn't reach anything.
- Camera "home" used stale canvas dimensions; it now measures first.

## 8. Review in motion, at true speed

- **Record videos for every motion change,** desktop (1512×982) and phone (390×844 at 2×).
- **On a slow software renderer, use a virtual clock.** Override `requestAnimationFrame` and `performance.now`, then step the clock 1/24 s per captured frame and screenshot each frame. Assemble with ffmpeg (`libx264`, `yuv420p`, `crf 20`). The video then plays at the authored speed, however slow rendering is. See `verification/browser/record-review.mjs`.
- **Watch the videos frame by frame** at key moments. The phone video revealed two more issues:
  - a headline lost its space where a `<br>` was hidden on phones;
  - the "Drag to turn" hint crowded the Pause bar during the opening.

## 9. Art direction rules that were enforced every round

- **Colour and type:** near-black background; blue and dark-violet accents only in the interface; material colours come from the paper; Sora type.
- **Avoid:** cards, dashboards, tiny labels, extra dividers, glow, cartoon objects, headline periods, "not to scale" captions, olive or lime.
- **Placement:** explanation sits beside the visual; the reading accordion is next to the controls, not below a gap.
- **Source figures:** native resolution, never repainted or upscaled, always one click away in the same stage.

## 10. Prompt you can give Codex

> Before designing, read the source paper and write a claim ledger labelling each statement as observation, derivation, illustration or proposed mechanism. Take the palette and the camera pose from the paper's own figure: measure the printed object in native pixels and fit the pose. When the 3D appears, register it onto the printed object (zoom the real figure until the object matches the model's screen box, hand the same pixels to a textured plane in the 3D scene, dissolve a front crop to reveal the model, then lay the page back while the camera turns). Use neutral lighting and exposure so the paper's colours survive. Pace text at 15 characters per second with a 4 s minimum. Let any reader input end the animation permanently. Keep one state value that drives both the buttons and the stage. Then screenshot every state at 390, 768, 1440 and 1920 px, tile them on a contact sheet, list every flaw, fix it and repeat. Add automated checks for label overlap, overflow, drag sign, state preservation and rapid clicking. Record desktop and phone videos on a virtual clock, review them frame by frame, and fix what you see before calling it done.

## Honest limits

- **What was tested:** everything ran in headless Chromium with software rendering.
- **Not tested:** Safari, Firefox, a real phone, screen readers and real GPU frame rates.
- **What came from the earlier Codex version:** the base geometry (the generated interwoven field and meshes), Sora and the overall page shell. This round changed how they are seen and explained.
