# Calculus visual comparison

final result: passed

## Evidence and scope

- Visual target: generated hybrid `exec-8a131d0c-b5ef-417b-8c52-988ec4501eb2.png`, viewed in this task. User requested the first black/chartreuse sidebar and notes, the second cobalt graph, more reading space, collapsible panels, and removal of irrelevant slogans.
- Implementation: native in-app browser screenshots of the local lesson, graph studio and mobile reading state. The browser returned inline captures; no separate screenshot file was exported. Source and implementation were displayed together in the same comparison call, twice.
- Reference pixels: 1487 × 1058. Desktop override requested 1440 × 1024; browser captures reflected the user's existing scaling, approximately 1309 × 931. Compared at the same aspect ratio, not claimed as a pixel-perfect trace. Mobile override requested 390 × 844; observed CSS width 354 at existing scaling.
- State: MH2100 directional derivatives, parameter 0.8, sidebar open and split layout; then sidebar closed and graph minimised. Graph studio also checked with a helix and typeset vector preview.

## Comparison history

1. The first implementation left the lesson heading across the entire workspace, pushing graph controls below the viewport. The surface window also dwarfed the selected tangent. Classified P2: poor notes/graph proportions and weak experiment legibility.
2. Moved the heading into the notes column in split view; kept it full width for wide and minimised modes. Reduced the default graph height, retained a wide graph option, adjusted the surface window, and made mathematical direction annotations visible over surfaces. Repeated combined visual comparison: graph controls and readable notes now share the desktop viewport.
3. Mobile minimised reading checked: no document-level horizontal overflow, no KaTeX error nodes, visible expand and sidebar controls. Large display mathematics may scroll within its own formula container.

## Required surfaces

- Typography: Anton display/wordmark, readable serif mathematical prose, ordinary sans controls. KaTeX carries mathematical notation and MathML. Intentional variation from the generated mock: preserve complete definitions and the existing derivation/example/pitfall semantics rather than reproduce its abbreviated, sometimes inaccurate content.
- Spacing: black sidebar, paper notes and cobalt graph form clear regions. Split, wide and minimised layouts are functional. Mobile stacks the regions and offers full-width reading.
- Colors: black/chartreuse selection, warm paper, cobalt experiment, pale surface shading and orange direction controls. Mathematical labels and graph status were corrected for contrast.
- Imagery: the graph is actual parameterised geometry, not a raster mock. Its interactive finite mesh intentionally differs from the generated illustration. SVG compatibility rendering was visually checked; WebGL hardware rendering is not separately verified.
- Copy: unrelated slogans removed. Official citations are grouped by source, with exact page/result links behind disclosure controls; optional reading stays labelled.

## Interaction and technical checks

Native WebMCP verified course browsing, cross-course concept lookup, lesson navigation, notes tabs, scene variants, parameter updates, animation, reset, graph configuration and layout changes. Invalid input checks and all four graph representations were exercised. Overlapping graph requests cancel the prior request; only the newer graph is acknowledged after its own frame. The mobile inspection returned zero KaTeX errors and no document overflow. Runtime exception monitoring was enabled after a clean reload; development hot-reload hook changes were cleared by reloading before verification.

No actionable P0/P1/P2 finding remains. Residual polish: SVG surface shading is less vivid than the generated target; hardware WebGL appearance remains a test gap.
