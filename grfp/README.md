# The Working Catalyst — GRFP proposal study guide

An offline, single-file interactive guide to the NSF GRFP proposal *Learning to Make the Working Catalyst: Autonomous Synthesis–Activation Co-Design*. It rebuilds the earlier `reference/original-guide.html`, keeping its sources and sentence annotations.

**Open `working-catalyst-guide.html` directly in a browser.** No server or network is needed. Google Fonts load when online; local serif and sans fonts are used otherwise. Paper links need internet.

## What is in it

- **29 lessons** in four parts: the scientific problem, the materials experiment, the self-driving lab, and defending the proposal. Every lesson has an Intuitive/Rigorous depth switch.
- **Interactives:**
  - transformation pathway
  - grain-terminology explorer
  - 2×2 calculator with predict-before-reveal mode
  - charge-partition calculator
  - thermal-dose model
  - causal-pathway explorer
  - product accounting
  - collection-delay windows
  - companion-mismatch model
  - nested-replication exercise
  - variance components
  - claim ladder
  - equivalence intervals
  - station map
  - scheduler timeline
  - action anatomy
  - failure classifier
  - Gaussian-process posterior explorer
  - θ(t) explorer
  - make/measure/repeat decision sandbox
  - pay-to-reveal replay archive
  - holdout/leakage builder
  - outcome verdicts
  - feasibility gates
  - teach-back
- **Every-sentence mode.** All 61 proposal sentences, shown verbatim. Each one has a plain-English version, its purpose, an evidence status, its hidden assumptions, what it does not claim, a reviewer challenge, a best defense and related lessons.
- **Scientific foundation.** Each of the eight cited papers is summarized: what it found, why it is cited, what it does not establish, and which proposal sentences depend on it.
- **Study tools:**
  - glossary (100+ terms)
  - full-text search (`/` or Ctrl/⌘K)
  - oral-defense bank (30 questions) with model answers and weak answers
  - spaced review
  - concept-mastery tracking
  - notebook with lesson, sentence and paper notes plus four lists, saved to localStorage, with export (JSON and Markdown) and import
- **Original sources.** The two proposal pages, the PDF and the refinement notes are all embedded. The PDF's SHA-256 is recorded in `proposal-base.js`.

Every claim is labeled as one of these categories, each shown with both a glyph and a word:

- established by prior work
- proposed
- hypothesis
- assumption
- pilot-dependent choice
- teaching simulation
- unresolved question
- background outside the proposal

## Building

The page is assembled from `src/` with no dependencies:

```sh
node grfp/tools/extract-source.mjs   # re-extract verbatim proposal text from reference/original-guide.html
node grfp/build.mjs                  # → grfp/working-catalyst-guide.html
node grfp/build.mjs --artifact       # also → grfp/dist/artifact.html (no html/head/body wrapper)
```

## Checks

These use Playwright with the preinstalled Chromium. The axe check needs `axe-core` from npm.

```sh
node grfp/test/smoke.cjs 1440        # every route renders, no widget failures, no horizontal overflow
node grfp/test/smoke.cjs 390
node grfp/test/interactions.cjs      # quizzes, persistence, search, sentence↔lesson return, export/import, defense
node grfp/test/axe.cjs path/to/axe.min.js 390
```

Current state:
- **Smoke tests:** clean at 1440 px and 390 px, in light and dark mode.
- **Interaction checks:** all 24 pass.
- **axe:** no violations except `skip-link`. That one is a known false positive for hash-routed links (`#sentences`, `#l-…`), which axe reads as skip links with missing targets.
- **Not yet checked:** real devices, Safari and Firefox.

## Scientific provenance

The paper summaries were checked against the published abstracts and indexed summaries in October 2026. Publisher full texts were not reachable from the build environment, so the guide quotes only numbers that appear in the abstracts.

All numbers inside interactives are invented teaching values, and each interactive is labeled as a simulation.
