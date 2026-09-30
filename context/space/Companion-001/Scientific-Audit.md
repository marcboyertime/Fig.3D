# Scientific Audit

Source: https://chatgpt.com/space/page_832796b18b988191a00dc6e7c6abff53

Exported 2026-09-30. Historical planning record; current local audits and engineering evidence supersede obsolete statements about missing files or checks. The full original rocksalt application is not release-verified.

This Page consolidates the preliminary rocksalt audit issues recoverable from the Fig.3D blueprint. It is an issue register, not a completed validation. The full code specific audit and inspected file checksum remain in the launch pack pending recovery.

## Open issues

| Issue | Why it matters | Required resolution | State |
| --- | --- | --- | --- |
| Tetrahedron identity | Oxygen coordination geometry and a tetrahedron of neighboring cation positions convey different meanings. | Identify each rendered vertex, center, edge, and site; reconcile with source geometry and lesson labels. | Open |
| Spinel state and occupancy | The intended composition and lithiation state determine which sites lithium occupies and how pathways are interpreted. | Specify the intended state and exact site mapping; check against the anchor source and independent structure reference. | Open |
| Moving marker interpretation | Connectivity does not establish a physical lithium trajectory or diffusion rate. | Audit occupancy and vacancy constraints, rates, and time units; retain connectivity probe wording until supported. | Open |
| Composition and rounding | Percentages can hide their denominator and finite cells require integer counts. | Define composition convention, realized counts, rounding, and displayed values. | Open |
| Order control | A normalized teaching control can be mistaken for measured short range order. | Define the algorithm, limits, and relationship to any reported order parameter. | Open |
| Percolation threshold | A reported fully random model threshold need not hold in one small illustrative realization. | Trace source conditions and show finite size and sampling limits. | Open |
| Model and visual correspondence | Improved visual clarity does not establish improved scientific fidelity. | Check graph outputs separately from rendered geometry and reader inference. | Open |

## Evidence to recover

The exact inspected HTML, checksum, full audit, source packet, primary references, test outputs, and revision history have not been imported. Each open issue needs an exact source location, implementation pointer, independent expected result, observed result, and disposition.

## Optional expert review

A human expert may review selected claims or occupancy questions later. That review is optional and not required for release. Any expert-reviewed label must name the reviewed scope and version.

## Completion rule

Close an issue only with evidence. If the model cannot support a claim, narrow the claim, label the illustration honestly, or remove the unsupported relationship.

