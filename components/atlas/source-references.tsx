import { ExternalLink } from "lucide-react";
import { MathText } from "./math-text";
import { learningGuide } from "@/lib/curriculum/learning";
import { sources, type Concept, type Citation } from "@/lib/curriculum";
import {
  citationUse,
  goldPathReadings,
} from "@/lib/curriculum/reading-references";
export function SourceReferences({ concept }: { concept: Concept }) {
  const groups = new Map<string, Citation[]>();
  for (const citation of concept.sources)
    groups.set(citation.sourceId, [
      ...(groups.get(citation.sourceId) ?? []),
      citation,
    ]);
  const legacyPublicReading = publicReading(concept.id);
  const publicReadings =
    goldPathReadings[concept.id] ??
    (legacyPublicReading ? [legacyPublicReading] : []);
  return (
    <section className="source-references" aria-label="Sources">
      <h2>Read the source</h2>
      <p className="source-caption">
        PDF pages count from the first page of the linked file. Drive access
        follows its existing permissions; the page number is supplied even when
        Drive opens at the beginning.
      </p>
      {publicReadings.length > 0 && (
        <section aria-label="Public optional reading">
          <h3>Public optional reading</h3>
          <p>
            The explanation, worked steps and practice on this page are
            available without opening a course PDF. These readings offer a
            second explanation.
          </p>
          <ul>
            {publicReadings.map((reading) => (
              <li key={reading.url}>
                <a href={reading.url} target="_blank" rel="noreferrer">
                  {reading.locator} <ExternalLink size={12} />
                </a>
                <p>
                  <MathText text={reading.purpose} />
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {[...groups].map(([id, citations]) => {
        const source = sources[id];
        const links = (
          <ul className="citation-pages">
            {citations.map((citation, i) => {
              const use = citationUse(citation, source, concept);
              return (
                <li key={i}>
                  <a
                    href={`${source.url}#page=${citation.pages[0]}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <strong>
                      {citation.pages[0] === citation.pages[1]
                        ? `PDF p. ${citation.pages[0]}`
                        : `PDF pp. ${citation.pages.join("–")}`}
                    </strong>
                    <span>
                      <MathText text={citation.detail} />
                    </span>
                    <ExternalLink size={12} />
                  </a>
                  <p>
                    <strong>{use.role}.</strong> <MathText text={use.purpose} />
                  </p>
                </li>
              );
            })}
          </ul>
        );
        return (
          <div className="source-group" key={id}>
            <span className="source-type">
              {source.kind === "lecture"
                ? "COURSE SOURCE"
                : "OPTIONAL TEXTBOOK"}
            </span>
            <h3>{source.title}</h3>
            {source.errata?.map((note) => (
              <aside className="source-erratum" key={note.page}>
                <strong>Source erratum · PDF p. {note.page}</strong>
                <p>
                  <MathText text={note.printed} />
                </p>
                <p>
                  <MathText text={`${note.correction} ${note.justification}`} />
                </p>
                <small>{note.provenance}</small>
              </aside>
            ))}
            {citations.length > 3 ? (
              <details>
                <summary>Exact page references · {citations.length}</summary>
                {links}
              </details>
            ) : (
              links
            )}
          </div>
        );
      })}
      <details>
        <summary>How to use these references</summary>
        <p>
          If you have access, use the cited course pages to cross-check their
          assumptions against this lesson. Then try this original task before
          opening its worked answer:
        </p>
        <p>
          <MathText text={learningGuide(concept).exercise.prompt} />
        </p>
        <p className="source-caption">
          Public reading is optional and uses its own notation and examples. The
          course references determine course scope; the interactive models and
          practice questions here are original learning aids.
        </p>
      </details>
    </section>
  );
}

function publicReading(id: string) {
  if (
    [
      "limits-one-sided",
      "infinite-limits",
      "epsilon-delta-one-variable",
    ].includes(id)
  )
    return {
      url: "https://openstax.org/books/calculus-volume-1/pages/2-5-the-precise-definition-of-a-limit",
      locator: "OpenStax Calculus 1 §2.5 · The Precise Definition of a Limit",
      purpose:
        "For a public second explanation, compare the order of the epsilon and delta choices. Check how the definition changes for a one-sided or infinite limit before applying the same argument.",
    };
  if (id === "partial-fractions")
    return {
      url: "https://openstax.org/books/calculus-volume-2/pages/3-4-partial-fractions",
      locator: "OpenStax Calculus 2 §3.4 · Partial Fractions",
      purpose:
        "Compare the decompositions for repeated linear factors and irreducible quadratic factors. Write the required numerator degrees before solving for coefficients.",
    };
  if (
    [
      "plane-jacobian",
      "space-jacobians",
      "change-of-variables",
      "inverse-jacobian",
      "review-change-of-variables",
      "polar-regions",
      "linear-area-change",
    ].includes(id)
  )
    return {
      url: "https://openstax.org/books/calculus-volume-3/pages/5-7-change-of-variables-in-multiple-integrals",
      locator:
        "OpenStax Calculus 3 §5.7 · Change of Variables in Multiple Integrals",
      purpose:
        "Compare the source region, mapped region and absolute Jacobian separately. Identify where the map is one-to-one and where its determinant vanishes before changing the integral bounds.",
    };
  return null;
}
