# Project Blueprint

Source: https://chatgpt.com/space/page_195267697a00819183928111ed7e11d3

Exported 2026-09-30. Historical project planning snapshot; later decisions in the handoff and current implementation take precedence. Statements about missing source files or absent checks may be superseded.

Fig.3D is an interactive publication and teaching library for materials science papers, starting with energy materials, nanomaterials, and electrochemistry. Its promise is to help a reader understand what a scientific figure is trying to tell them and return to the paper able to understand and question its argument.

## Audience and scope

The initial audience is advanced undergraduates, beginning graduate students, and experimental researchers entering an unfamiliar subfield. Instructors and journal clubs are an early reuse audience. Begin with one excellent companion and one active production effort at a time.

Every companion connects physical intuition → formal terminology → interactive model → experimental observable → the paper’s actual claim. Choose concepts with a specific confusion that a specific interaction can resolve.

## Initial collection

1. Lithium pathways in rocksalt derived cathodes is the flagship. Resolve geometry, occupancy, connectivity, and interpretation before release.

2. Diffusion inside a nanoparticle is a candidate next companion. Select one geometry, transport model, and boundary condition.

3. Electrochemical impedance is a candidate based on a deliberately simple, declared response model.

4. Nucleation and nanocrystal growth should anchor to a specific system and paper.

5. Porous electrode transport or structural transformations remain later possibilities.

Only the flagship has an existing prototype discussed in the source record. Other anchor papers remain to be selected.

## Product format

Learn introduces one idea at a time. Explore adds meaningful parameters and comparisons. Verify presents sources, assumptions, checks, version history, and limits. Use the pattern predict → manipulate → observe → explain.

Keep live AI tutors, arbitrary PDF uploads, user accounts, subscriptions, and automatic publishing outside the first release. The public lesson should run approved code and approved prose without a live language model.

## Project homes

The Space is the research and project headquarters. A versioned repository will hold canonical code, tests, sources, and release records. A public website will serve readers. The proposed architecture is Astro, Markdown or MDX, TypeScript, Three.js, SVG diagrams and plots, and offline reference calculations where useful.

## Scientific standard

Human expert review is optional, not a release requirement. Publication requires source traceability, an explicit model specification, independent reference or fixture checks, model and invariant checks, adversarial AI critique, and browser and visual semantic checks. An optional expert-reviewed label applies only to the documented scope and version.

## Decision record

The original blueprint proposed a required human review gate. The user explicitly removed that requirement afterward. That later decision governs all current standards and launch plans.

## Source and migration limits

This Page consolidates the recoverable Fig.3D blueprint in [ADHD Idea Dump](https://chatgpt.com/c/6aaadf10-056c-83ea-a58e-809ac9bd2c0e). The accessible transcript ends partway through the naming section. The full revised blueprint and launch pack are referenced there but their file bytes have not yet been imported. No domain, repository, hosting account, or deployed site is confirmed.

