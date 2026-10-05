# Silicon nanowire companion — source and model ledger

Source: X. H. Liu et al., *Anisotropic Swelling and Fracture of Silicon Nanowires during Lithiation*, Nano Letters **11**, 3312–3318 (2011), https://doi.org/10.1021/nl201684d.
Author manuscript: https://iebl.ucsd.edu/sites/default/files/iebl/2017-05/Nano_Letter_July_2011.pdf.
Supporting methods: https://acs.figshare.com/articles/journal_contribution/2624698 (file nl201684d_si_001.pdf). Supporting inventory and original PDFs are preserved in production/silicon-nanowire/sources.

## Representation decision

The public supporting archive contains rendered microscopy/simulation movies and an 18-page methods supplement, not downloadable FE meshes, nodal fields, ABAQUS input or UMATHT source. Movie 010 was inspected as a shape-sequence reference. We do not recover nodal stress or kinetics from its raster colors. The browser is a **schematic geometry reconstruction**, not a rerun of the paper's coupled diffusion/plasticity solver. Source stress panels remain original raster images with their printed scales. Only the source images carry quantitative stress. The interactive normal-stress view uses discrete arrows of equal length to explain sign, never a numerical field.

## Claim → source → visual → limit

| Claim | Source and status | Visual | Limit |
|---|---|---|---|
| Round pristine wire becomes anisotropically swollen | Fig. 1e–g, 3d–h; observation | Round-to-two-lobed section; quick end/side views | This paper's crystalline wires, not all silicon anodes |
| Lithiation travels longitudinally with shell ahead of core | Fig. 2a–i,l–o; observed, Fig. 5a–c modeled | Continuous outer surface and tapered core; movable plane | Normalized illustrative progress; no seconds or rate |
| Wire direction [112]; transverse x1=[1 −1 0], x2=[1 1 −1] | Fig. 3b and native Fig. 5a axes | Persistent section axes and wire-axis label | Bars must not be dropped by text extraction; selected orthonormal basis is right-handed |
| Residual cross-section core elongated in x2 | Fig. 5d, S9a; simulation | Narrow horizontal, taller vertical core | Analytic illustrative ellipse, not FE nodal geometry |
| Fully lithiated H/D0=2.62, V/D0=1.14 in FE | Fig. S8b–c; simulated shape fitted to experiment | Target outer extents of final schematic section | Intermediate contours and neck depth are authored, not a fit or time series |
| Core approximately Li deficient; shell Li rich | Fig. 2l; EELS observation. Fig. 5b,d; modeled c | Stable blue-to-amber illustrative Li legend, c≈0 core / c≈1 shell | Sharp two-region idealization; no inventory/conservation/flux prediction |
| c is normalized by fully lithiated concentration at x=3.75 | Fig. 5 caption; model definition | Definition beside lithium view; original Fig. 5 colorbar retained | No claim every real shell is a single Li15Si4 phase; product groups crystalline/amorphous alloy and other phases |
| Internal transformation mismatch produces stress without applied load | Main text pp. E–F; SI pp. 16–18 | Core/shell cutaway plus opposing normal-stress arrows | Not a force-balanced numerical solution; arrows are sign-only |
| Surface σ11 is compressive early, tensile at indent later; center reverses sign | Fig. S10a–d; simulation | Explicit Early/Late comparison, corresponding source panel | Discrete source-supported stages; switch is not a fracture threshold or quantitative time mapping |
| σ11 is normal stress along x1, not axial stress | Fig. 5a,f and S10 | Tension/compression key with x1 label | No MPa or GPa attached to our arrows |
| von Mises stress nonnegative and measures distortional stress | Fig. 5e and SI J2 definition | Original 5e with source legend 0–3.3 GPa | Unsigned; not tensile/compressive; authored model yield parameter 3 GPa, do not conflate with top printed colorbar |
| Shrinking central compressive region permits unstable neck growth | Fig. 5f, S10; authors' mechanical interpretation | Post-neck section, residual-core label and source inset | No crack initiation law or stress cutoff is implemented |
| Cracks observed where core depleted, with continued longitudinal growth | Fig. 2e–i,m–o; observation | Native microscopy panel and selectable source, no generated crack prediction | Separate experimental specimen from model; no synthetic fracture trajectory |
| Perspective changes apparent diameter greatly | Fig. 3g–h; observation | One-click views along x1 and x2; source tilt images | 155→180 and 155→485 nm refer to that observed wire; not used as strain parameters |
| Anisotropic diffusivity models interface motion | Main pp. E–F, SI pp. 15–17 | Methods explanation | D11/D22≈100 is effective assigned anisotropy, not measured intrinsic diffusion |
| Transformation strain coefficients β11=1.5, β22=.4, β33=0 | SI p.16; fitted modeling parameters | Methods explanation only | Not measured overall elongations or dimensions; not this explorer's deformation law |

## Geometry specification

Coordinates are in units of pristine radius R0, with x=x1, y=x2, z=x3. Basis directions are [1,−1,0]/√2, [1,1,−1]/√3, [1,1,2]/√6. The transverse plane is (112); a longitudinal cut at x2=0 has normal [1,1,−1]. The source applies incoming Li at the front end. The position control s runs from 0 at the supplied end to 1 at the far end; the renderer uses z=L(0.5−s), with the supplied end at +L/2. Overall length L=14R0 is chosen for composition, not a specimen measurement.

The pure model defines local transformation q = smoothstep(0,0.65,1.7p−s), p∈[0,1]. This makes the surface and reaction front advance from the supplied end, with a diminishing residual core behind the front. It is an illustrative ordering, not a diffusion calculation. Cross-section x=a cosθ, y=b sinθ (1−n exp(−(x/(0.34a))²)), with a=1+1.62q, b chosen so maximum half-height is 1+0.14q, n=0.34 smoothstep(0.35,0.95,q). The analytical curve is simple and symmetric. Core semiaxes are (1−q)^1.45 and (1−q)^0.58, contained within the outer boundary; its elongation in x2 demonstrates the paper's topology. At q=1 it disappears.

Lithium colors are illustrative phase values (0 core, 1 transformed shell). They do not estimate a spatial gradient, chemical potential, moles, reaction rate or physical time. All views read the same cross-section evaluator. Cutting the view does not change the scientific state.

## Stress treatment and deeper reasoning

The normal-stress arrows convey the patterns of S10b and S10d. Early/Late selects those reference stages and an illustrative corresponding geometric state. Arrow length has no magnitude meaning. Figure 5e is a fixed reported post-necking von Mises field. Figure 5f is a schematic of longitudinal neck growth with a simulated σ11 section. Do not imply either changes with the explorer slider. The paper's printed rainbow scales are retained as evidence; our illustration uses explicitly labeled two-color sign encoding.

The source uses ε=εchemical+εelastic+εplastic incrementally; chemical strain ∝dc with fitted anisotropic coefficients. It uses concentration-dependent E (80→30 GPa), ν (.28→.24), J2 plasticity, assumed 3 GPa yield, plane strain for the 2D model and a surface skin with effective diffusivity 300×D11 in 3D. These are source assumptions, not independently measured material constants nor inputs exposed as fake physical sliders.

## Figure provenance

Figures 1, 2, 3 and 5 are embedded image objects extracted from the author PDF at native resolution. Insets are crops of those images, with panel/scale identities retained in the full-figure viewer. Figures S8 and S10 are also extracted native image objects from the supplement, with the source axes preserved. All are attributed to Liu et al. (2011), © American Chemical Society. The illustrative scene is separate. Figure source files are never repainted, AI upscaled, recolored or presented as new experimental data.

## Verification status

See production/silicon-nanowire/verification-report.md for actual executed checks and limitations. No human expert review is claimed.
