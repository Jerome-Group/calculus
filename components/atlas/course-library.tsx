import { ArrowRight, ArrowUpRight } from "lucide-react";
import { concepts, courses, courseIds, type CourseId } from "@/lib/curriculum";
import { matchesConcept } from "@/lib/curriculum/search";
import { StudyProgress } from "./study-progress";
import { Formula } from "./math-text";
export function CourseLibrary({
  course,
  query,
  chooseCourse,
  open,
}: {
  course: CourseId;
  query: string;
  chooseCourse: (c: CourseId) => void;
  open: (id: string) => void;
}) {
  const selected = courses[course];
  const matches = concepts.filter(
    (c) => c.course === course && matchesConcept(c, query),
  );
  return (
    <div className="library">
      <header className="library-heading">
        <div>
          <span className="eyebrow">MH1100 / MH1101 / MH2100</span>
          <h1>
            Calculus.
            <br />
            <em>
              From limits
              <br />
              to fields.
            </em>
          </h1>
          <p>
            One connected library, from the first limit to vector calculus.
            Choose a course or follow a concept.
          </p>
        </div>
        <div className="library-equation">
          <Formula
            block
          >{String.raw`\underbrace{\frac{d}{dx}}_{\text{local change}}\;\underbrace{\int_a^x f(t)\,dt}_{\text{accumulation}}=f(x)`}</Formula>
        </div>
      </header>
      <StudyProgress open={open} />
      <div className="course-paths">
        {courseIds.map((id, i) => (
          <button
            key={id}
            onClick={() => chooseCourse(id)}
            className={course === id ? "active" : ""}
            aria-pressed={course === id}
          >
            <span className="path-number">0{i + 1}</span>
            <span className="path-meta">
              {id}
              <ArrowUpRight size={18} />
            </span>
            <h2>{courses[id].title}</h2>
            <p>{courses[id].description}</p>
            <span>
              {concepts.filter((c) => c.course === id).length} explorations
            </span>
          </button>
        ))}
      </div>
      <section className="unit-library">
        <header>
          <div>
            <span className="eyebrow">{course} · STUDY PATH</span>
            <h2>{selected.title}</h2>
          </div>
          <span>
            {matches.length} explorations
            {query ? " matching “" + query + "”" : ""}
          </span>
        </header>
        {selected.units.map((title, i) => {
          const cs = matches.filter((c) => c.lecture === i + 1);
          return cs.length ? (
            <article key={title}>
              <span className="unit-index">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <h3>{title}</h3>
                <div className="unit-concepts">
                  {cs.map((c) => (
                    <button key={c.id} onClick={() => open(c.id)}>
                      <span>{c.title}</span>
                      <ArrowRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ) : null;
        })}
        {matches.length === 0 && (
          <p>
            No matching concepts in this course. Choose another course or clear
            your search.
          </p>
        )}
      </section>
      <section className="library-method">
        <h2>How to use this library</h2>
        <p>
          Make a prediction. Move the parameter. Read the definition and its
          assumptions, then open the argument or worked example. Each
          exploration links back to the course pages; extra reading stays
          optional.
        </p>
        <p>
          Independent study companion. Course paths follow the supplied MH1100
          and MH1101 materials from AY2025–26, and MH2100 materials from
          AY2026–27. This is not an official NTU publication.
        </p>
      </section>
    </div>
  );
}
