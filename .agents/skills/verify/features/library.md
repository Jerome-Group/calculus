# Library

## Sub-features

Course cards and rail, lesson lists, cross-course search, no matches and clear, URL restoration, resume, phone navigation, keyboard skip link, and browser-tool availability.

## How to get to it (user POV)

Open `/` or `/#course`. Use the Calculus brand link, sidebar Course overview, topbar Library, or any sidebar course button.
Choose MH1100, MH1101, or MH2100 from the course cards or rail.
Type into Search the entire library or sidebar Find a concept. Open a result or an expanded lecture's concept.
Use Resume lesson in the topbar. On a phone, open Toggle lecture navigation first.
Study-specific Resume and Revisit entries are in [study](study.md).

## Driving it with Playwright

Run `npm run agent -- browser run --features library --output outputs/browser/library`.
The driver requires the first Tab to focus Skip to mathematics and Enter to focus the mathematics landmark, selects every course through both controls with distinct rail transitions, and counts 24, 30, and 71 rendered exploration buttons.
It searches `integral`, checks result labels from MH1101 and MH2100, reloads, opens a result, uses Back and Forward, exercises no matches and clear, and searches `Jacobian` from the sidebar.
It uses brand, overview, Library, and Resume lesson entry points, requiring Resume to restore the selected lesson ID.
It opens malformed library state, clears its explanation through search and through course selection, and selects a course from the 390px phone drawer.
It opens Browser tools without relying on WebMCP.
Back to bare root must restore Calculus I and an empty query. A malformed lesson's warning must disappear on Library arrival. Collapsed desktop navigation must be inert and hidden from accessibility, exclude successive Tab targets, and return focus to the visible trigger when closed from inside.

## Gotchas

Search spans all courses. Course selection and query belong to the library URL.
Server-rendered library controls can appear before the client restores URL state. After reload, wait for the existing application-ready signal before checking values; the exact query assertion remains required.
The skip link precedes the sidebar and must remain the first keyboard-focusable page control, covered by regression #235.
Selecting a valid course must clear an obsolete malformed-state notice, covered by regression #204.
Private course links need existing Drive permissions; library verification does not fetch them.
