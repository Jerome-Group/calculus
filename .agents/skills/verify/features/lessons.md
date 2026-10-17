# Lessons

## Sub-features

Learn, Explore, Practice, Revise, definition and assumptions, reasoning, worked applications, distinctions, prerequisite return, sources, pilot lessons, and lesson pagination.

## How to get to it (user POV)

Choose a lesson from the library, sidebar lecture list, or search results. Direct `/#<lesson-id>` links open it too.
Use Previous concept and Next concept at the footer. Use Lesson prerequisites, Need a prerequisite refresher, and Return to interrupted step for supporting lessons.
Choose a reading mode. Follow the argument buttons move to the definition, experiment, reasoning, worked application, distinction, or practice.
Learn includes Concepts in this exploration, source page links, optional reading, and continuation links where supplied.
Pilot Revise offers independent tasks and error history. Standard Revise offers Open the full reasoning and supporting practice.
Drafts, hints, solutions, self-assessment, and confidence are in [study](study.md); graphs and interactive examples are in [experiments](experiments.md) and [graph](graph.md).

## Driving it with Playwright

Run `npm run agent -- browser run --features lessons --output outputs/browser/lessons`.
The driver opens `limits-one-sided`, `partial-fractions`, and `multivariable-chain-rule`, selecting all four modes and checking MathML without KaTeX errors.
It uses argument buttons, source guidance, prerequisite links and return, sidebar search, and footer pagination.
Source anchors must retain their page locators, new-tab behavior, and `noreferrer` protection.
It visits the epsilon-delta pilot's Learn, Explore, and Revise entry points and opens independent tasks.
It checks malformed shared-state explanation and page width at 320px.

## Gotchas

Course PDFs remain external and access controlled. Anchor inspection does not establish permission or source freshness.
Browser proof covers the listed representative lessons. The complete inventory and mathematical checks retain all 125 lessons.
Written reasoning is not automatically graded. Agent checks establish neither learner understanding nor mastery.
