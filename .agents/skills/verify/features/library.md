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
The driver tabs to Skip to mathematics and checks landmark focus, selects every course through both controls, and checks 24, 30, and 71 explorations.
It searches `path`, reloads, opens a result, uses Back and Forward, exercises no matches and clear, and searches `Jacobian` from the sidebar.
It uses brand, overview, Library, and Resume lesson entry points.
It opens malformed library state, checks the explanation, and selects a course from the 390px phone drawer.
It opens Browser tools without relying on WebMCP.

## Gotchas

Search spans all courses. Course selection and query belong to the library URL.
The skip link follows sidebar controls in the current DOM, so the driver reaches it through bounded Tab navigation.
Selecting a valid course must clear an obsolete malformed-state notice. The current interface retains that notice, tracked as #204.
Private course links need existing Drive permissions; library verification does not fetch them.
