import { ExternalLink } from "lucide-react";
import { MathText } from "./math-text";
import { learningGuide } from "@/lib/curriculum/learning";
import { sources, type Concept, type Citation } from "@/lib/curriculum";
export function SourceReferences({ concept }: { concept: Concept }) {
  const groups = new Map<string, Citation[]>();
  for (const citation of concept.sources)
    groups.set(citation.sourceId, [
      ...(groups.get(citation.sourceId) ?? []),
      citation,
    ]);
  const extra = publicReading(concept.id);
  return (
    <section className="source-references" aria-label="Sources">
      <h2>Read the source</h2>
      <p className="source-caption">
        PDF pages count from the first page of the linked file. Drive access
        follows its existing permissions; the page number is supplied even when
        Drive opens at the beginning.
      </p>
      {[...groups].map(([id, citations]) => {
        const source = sources[id];
        const links = (
          <ul className="citation-pages">
            {citations.map((citation, i) => (
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
                  <span>{citation.detail}</span>
                  <ExternalLink size={12} />
                </a>
              </li>
            ))}
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
          Read the cited course pages first. Compare their assumptions with the
          hypotheses above, then return to this question without looking at the
          worked answer:
        </p>
        <p>
          <MathText text={learningGuide(concept).exercise.prompt} />
        </p>
        {extra && <p>{extra.purpose}</p>}
        {extra && (
          <a href={extra.url} target="_blank" rel="noreferrer">
            {extra.label}
            <ExternalLink size={13} />
          </a>
        )}
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
      label: "OpenStax · The precise definition of a limit",
      purpose:
        "For a public second explanation, compare the order of the epsilon and delta choices. Check how the definition changes for a one-sided or infinite limit before applying the same argument.",
    };
  if (id === "partial-fractions")
    return {
      url: "https://openstax.org/books/calculus-volume-2/pages/3-4-partial-fractions",
      label: "OpenStax · Partial fractions",
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
      label: "OpenStax · Change of variables in multiple integrals",
      purpose:
        "Compare the source region, mapped region and absolute Jacobian separately. Identify where the map is one-to-one and where its determinant vanishes before changing the integral bounds.",
    };
  return null;
}
