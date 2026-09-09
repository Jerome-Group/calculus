import { ExternalLink } from "lucide-react";
import { MathText } from "./math-text";
import { sources, type Concept, type Citation } from "@/lib/curriculum";
export function SourceReferences({ concept }: { concept: Concept }) {
  const groups = new Map<string, Citation[]>();
  for (const citation of concept.sources)
    groups.set(citation.sourceId, [
      ...(groups.get(citation.sourceId) ?? []),
      citation,
    ]);
  const extra =
    concept.course !== "MH2100"
      ? {
          url: "https://www.3blue1brown.com/lessons/essence-of-calculus/",
          label: "3Blue1Brown · calculus visual series",
        }
      : [
            "double-riemann-sums",
            "fubini-double",
            "general-double-integrals",
            "type-one-two-regions",
          ].includes(concept.id)
        ? {
            url: "https://mathinsight.org/double_integral_volume",
            label: "Math Insight · double-integral geometry",
          }
        : null;
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
        <summary>A little further</summary>
        <p>
          <MathText text={concept.enrichment} />
        </p>
        {extra && (
          <a href={extra.url} target="_blank" rel="noreferrer">
            {extra.label}
            <ExternalLink size={13} />
          </a>
        )}
        <p className="source-caption">
          Optional visual perspective. These interactive models are original
          examples.
        </p>
      </details>
    </section>
  );
}
