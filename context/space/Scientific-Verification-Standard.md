# Scientific Verification Standard

Source: https://chatgpt.com/space/page_8687a8e805848191b7fc7e78a4943081

Exported 2026-09-30. Historical project planning snapshot; later decisions in the handoff and current implementation take precedence. Statements about missing source files or absent checks may be superseded.

This standard defines what evidence Fig.3D needs before publishing a companion. Human expert review is optional and is not required for release. AI agreement is not empirical validation or peer review.

## Three distinct questions

Scientific suitability asks whether the declared model supports the lesson’s claim. Implementation correctness asks whether code implements that model. Explanatory accuracy asks whether readers will infer only what the model and sources support. Screenshots alone cannot establish scientific suitability or implementation correctness.

## Required workflow

1. Assemble a source packet with exact paper version, figure and caption, methods, supporting information, underlying primary references, and available structure or data files. Record unavailable evidence.

2. Maintain a claim ledger. Each substantive explanation, displayed value, and visual relationship links to a source location, applicable conditions, implementation, and verification evidence.

3. Write a model specification before implementation: entities, coordinates, species, occupancy, equations or graph rules, units, boundaries, parameter ranges, outputs, and omissions.

4. Establish independent references or hand-checkable fixtures. Do not compute every expected result with the implementation being tested.

5. Check relevant invariants, dimensions, conservation, symmetry, limiting cases, boundaries, convergence, and reproducible random sampling.

6. Run adversarial AI critique for unsupported assumptions, units, geometry, controls, source mismatches, and misleading wording. Record findings and resolutions.

7. Check controls and the rendered explanation in a browser. Verify labels, legends, slider meaning, reset behavior, accessibility, and visual correspondence to calculations.

8. Save a versioned verification report and approve publication within the declared scope.

## Claim and model classifications

Claims are reported, derived, schematic, or hypothetical. Distinguish direct observation from a derived result, interpretation, and hypothesis.

Representation type is independent of verification status: conceptual schematic, qualitative model, or quantitative model checked against specified references. Do not imply calibrated numerical precision for a teaching illustration.

## Publication labels

| Label | Meaning |
| --- | --- |
| source-traced | Claims have exact sources, conditions, and a documented source packet. |
| model-checked | The declared model passed documented independent and invariant checks for the named version and scope. |
| release-verified | Required scientific, implementation, editorial, and browser checks passed for the release artifact. |
| expert-reviewed | Optional additional human review of a recorded scope and version. |

These labels are evidence records, not universal assurances. Assign them only after the relevant work is complete. The rocksalt prototype currently has unresolved issues and no completed release verification established here.

## Verification report fields

Record version or commit, artifact checksum, representation type, supported claims, source packet, model assumptions, fixture origins, expected and actual results, tolerances, browser checks, AI critique findings, remaining limitations, and publication decision.

Optional human review may be added later with reviewer permission, scope, findings, date, and exact version. Lack of human review alone never blocks release. A failed required check still blocks the affected claim or implementation; narrow the scope or resolve the failure.

## AI authoring roles

Use AI for source extraction, prerequisite mapping, teaching design, implementation, adversarial critique, and editorial assistance. Missing evidence must remain a gap. Source updates or failures may prompt draft changes, but scientific content should not silently rewrite or publish itself.

