# Design System

Source: https://chatgpt.com/space/page_888842efed3881918cd4edd8c3912bf8

Exported 2026-09-30. Historical project planning snapshot; later decisions in the handoff and current implementation take precedence. Statements about missing source files or absent checks may be superseded.

Fig.3D teaches through purposeful interaction and progressive explanations. Visual polish must make the science easier to understand.

## Learn Explore Verify

Learn is the default: one question, one emphasized object, a stable camera, limited controls, and a short comprehension check. Explore exposes parameters, comparisons, and advanced views. Verify reveals sources, assumptions, tests, limitations, and version history.

For the rocksalt companion, the progression is what these objects are → what happens locally → how local events connect → what the model can tell us → what the paper concludes.

## Interaction rules

Use predict → manipulate → observe → explain. Explain unexpected results in random realizations. Every slider states whether it controls a physical parameter, a normalized teaching value, or a display preference.

Use meaningful 3D when spatial structure matters, SVG or 2D when those explain better, synchronized plots when evidence matters, and step controls when a mechanism unfolds over time. Do not use decorative animation as evidence.

## Rocksalt visual requirements

Begin with a single local environment. Use strong tetrahedron edges, readable labels, camera presets, cutaways, and optional contextual atoms. Avoid faint tetrahedra, overwhelming crystal views, and default autorotation.

Distinguish oxygen coordination from the tetrahedron of neighboring cation positions. Hiding oxygen is a display operation and must not appear to remove oxygen physically. A moving path marker must be labeled a connectivity probe until a physical trajectory model is established.

## Explanation depth

Offer intuition, technical detail, and deeper reasoning where helpful. Introduce prerequisite battery and crystallography concepts when needed. Define the proper scientific term and connect it to this paper; do not assume the reader remembers earlier lessons.

## Accessibility and resilience

Controls should work by keyboard. Provide readable labels and legends, pausable motion, reduced motion behavior, visible reset, responsive layouts, and useful explanatory text without WebGL. Color alone should not carry species or status meaning.

## Verification of design

Check that labels match model entities, shown geometry matches calculations, percentages retain their denominators, and controls never imply unvalidated rates or thresholds. Specific typography, palette, and component tokens remain to be chosen; the available conversation does not establish them.

