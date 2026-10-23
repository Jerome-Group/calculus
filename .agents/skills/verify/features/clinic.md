# Clinic

## Sub-features

Nine original cases, three per course. Decision-specific diagnosis, exact arguments, distinct transfer questions, ungraded scratch work, existing-lesson recovery, restart, next case, share links, transient memory, history, keyboard focus and 320px layout.

## How to get to it (user POV)

Use Open Calculus Clinic in the library, Clinic in the topbar, or Calculus Clinic in the sidebar. Open a case or use Switch Clinic case. Choose a radio option and Explain my decision. Read the feedback and argument, then Try the transfer check and Check transfer choice. Review the idea opens its existing lesson. Return to Clinic case restores the current tab attempt. Copy case link shares selection only.

## Driving it with Playwright

Run `npm run agent -- browser run --features clinic --output outputs/browser/clinic`.
The journey checks all nine sound decisions and transfers through real radio controls and explicit commits. It also checks a wrong Rolle decision and transfer, recovery to the matching lesson and back, retained scratch work and feedback focus, restart, next case, Back and Forward, share link and reload reset, invalid encodings and topbar/sidebar entry. At 320px, transfer recovery preserves the exact feedback scroll and attempt. Reloading its recovery lesson clears both choices, feedback and scratch work. Returning then focuses the fresh case heading and checks its bounding rectangle against the viewport and sticky topbar. The journey drives native keyboard controls at 320px, checks no overflow, MathML, no KaTeX errors and no account writes. It never invokes application actions or internal modules.

The recovery journey takes two nested prerequisite detours, uses Back and Forward, restores the exact interrupted lesson URL, and returns to the same Clinic choice, scratch work, and diagnosis focus.

## Gotchas

The selected case is versioned URL state. Choices and scratch work live only in the mounted Atlas session. Case switching and same-tab recovery retain them. Reload clears all attempts while retaining the selected case. A recovery history entry contains only validated case, fixed focus and finite scroll metadata. Feedback checks authored choices. Written reasoning is ungraded, and neither choice feedback nor agent browser checks establish mastery. Hosted native sign-in and participant outcomes are outside this journey.

Sidebar navigation schedules destination focus on the next animation frame. Wait for the drawer to close and the Clinic heading to receive focus before focusing a case card and sending keyboard input. A visible picker alone does not establish that navigation focus has finished.
