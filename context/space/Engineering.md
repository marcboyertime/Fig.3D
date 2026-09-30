# Engineering

Source: https://chatgpt.com/space/page_79934c5c6b208191813fa6b9cd617599

Exported 2026-09-30. Historical project planning snapshot; later decisions in the handoff and current implementation take precedence. Statements about missing source files or absent checks may be superseded.

The proposed Fig.3D foundation is a static publication with selectively loaded scientific interactives. These are planning decisions from the conversation; repository and deployment setup remain pending.

## Architecture

Use Astro with Markdown or MDX for lesson content, TypeScript for model and interface logic, Three.js for meaningful 3D, SVG for diagrams and plots, and optional offline Python reference calculations.

Separate lesson content, scientific calculations, viewers, and verification records. A camera change must not change the transport calculation. A prose edit must not silently change a scientific parameter.

## Prototype migration

Preserve the original and improved rocksalt HTML as versioned baselines. Record a checksum when the actual files are recovered. Extract pure geometry and graph logic gradually; avoid changing framework, physics, and visual design in the same unreviewable step.

## Suggested repository responsibilities

- Content: chapters, definitions, claims, citations, and figure commentary.

- Models: deterministic geometry, occupancy, graph construction, and declared outputs.

- Viewers: scene composition, controls, labels, plots, and responsive behavior.

- Verification: independent fixtures, invariants, reference calculations, audit findings, and release reports.

- Assets: authorized source data and explanatory assets with provenance and rights records.

## Quality and release workflow

Proposed change → source and model checks → independent fixtures → invariant checks → adversarial AI critique → browser and visual semantic checks → preview → approved merge → deployment.

Human expert review is optional. A missing human review is not a release failure. Record expert review only when performed for the specific scope and version.

Keep public lessons independent of live AI, accounts, API keys, and model service availability. Record material AI assisted changes and preserve sources and specifications.

## Hosting and website plan

The conversation proposes GitHub for source and Cloudflare Pages for static hosting, with GitHub Pages as a portable alternative. Treat these as options pending setup and a current capability and cost check.

Initial site pages: homepage, companion pages, About and Methods, contribution instructions, and corrections and changelog. Provide stable URLs, attribution, and eventually links to selected lesson states. RSS is an early option; search and newsletters can wait.

## Immediate implementation tasks

- Recover and preserve the existing HTML and revised launch pack.

- Specify lattice coordinates, occupancy, hop rules, boundaries, and random seeds.

- Create manually checked graph fixtures and a separate reference calculation where useful.

- Extract calculation logic from rendering.

- Add verified labels, accessible controls, text fallback, and reproducible previews.

- Save a release verification report before publication.

