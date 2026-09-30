# Start here — continue Fig.3D in Claude

You are receiving the complete portable current Fig.3D website plus the broader project context recovered during its development. Treat this as a design, science and implementation handoff. The user wants you to inspect, run, test and continue the work with the judgment of an excellent scientific interaction designer and frontend engineer, without unnecessary permission loops for routine reversible work.

First read `DESIGN_AND_PRODUCT_HANDOFF.md`, then `ENGINEERING_STATE.md`. Read `context/README.md` and the project Blueprint, Scientific Verification Standard and Ideas & Backlog exports. Read the current hero audit and battery model notes before changing scientific content. The detailed `context/Fig3D-Scientific-Visuals-Guide.md` preserves broader research, tools and future visualization possibilities. Historical Page exports contain stale status and lesson language; the later directions in the handoff govern.

Then run the site from this extracted folder:

```sh
python3 -m http.server 4173 --bind 127.0.0.1 --directory site
```

Open `http://127.0.0.1:4173/` and `/battery.html`. Use an ordinary local HTTP server; do not open the main app through file://. Everything needed at runtime is bundled. There is no npm setup or build step. Use another port if 4173 is occupied. If your environment cannot run a browser, say so precisely and keep browser-dependent claims unverified.

Run these focused checks before changing code:

```sh
node site/hop-verification.mjs
node site/hero-controller-verification.mjs
node site/battery-verification.mjs
node site/battery-controller-verification.mjs
```

Inspect the actual moving experience at desktop and 390px phone width, not only screenshots or source code. Watch the figure-to-3D continuity, arrows, materials/lighting, battery teaser, cell/graphite transitions and charge/discharge roles. Evaluate scientific meaning as carefully as appearance. Use evidence screenshots and notes to understand the current stopping point; do not mistake them for user acceptance.

Continue from the existing files. Preserve the overall homepage, which the user said was looking pretty great; focus remaining work where it materially improves the stated intent. Do not restart the entire design or migrate frameworks by default. The latest arrow/teaser and battery corrections are implemented but still deserve your visual judgment. Keep the wider library vision in mind while improving an individual visualization. Advance a bounded useful iteration, verify the relevant behavior/science, and return a working preview with concise evidence and honest limitations.

The current package is a stable prototype, not a completed published product. No public deployment is authorized by this handoff. Human expert review is optional, never a release gate. Routine local fixes, previews and checks should proceed without repeatedly asking the user to reconfirm the brief. Ask only when a necessary missing source or a genuine product/science decision cannot be resolved from the context.

Preserve untouched references and licenses. Do not revive rejected generic battery art, cropped UI screenshots, soft gradient-ball rendering, olive/lime branding, fake search, course navigation, or motion that silently loops finite inventory. Do not claim empirical validation or peer review from AI agreement or software tests.

The package also contains future plans, rejected approaches and explicit missing historical downloads. These are context, not commitments to implement everything at once. Keep scope clear, leave source gaps visible, and maintain the distinction between what is built, what was tested, what the user approved and what remains an idea.
