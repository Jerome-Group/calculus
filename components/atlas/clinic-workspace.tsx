"use client";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Link2 } from "lucide-react";
import { courseIds, courses } from "@/lib/curriculum";
import {
  clinicCase,
  clinicCaseIds,
  isClinicCaseId,
  type ClinicCase,
} from "@/lib/clinic/cases";
import type { ClinicController } from "./use-clinic-session";
import {
  clinicUrl,
  type ClinicLocation,
  type ClinicReturn,
} from "./clinic-history";
import { ClinicCaseAttempt } from "./clinic-case";

export type ClinicWorkspaceProps = {
  clinic: ClinicController;
  location: ClinicLocation;
  openCase: (id: ClinicCase["id"] | null) => void;
  recover: (lessonId: string, origin: ClinicReturn) => void;
};
export function ClinicWorkspace({
  clinic,
  location,
  openCase,
  recover,
}: ClinicWorkspaceProps) {
  const [share, setShare] = useState<{
    caseId: ClinicLocation["caseId"];
    url: string;
    copied: boolean;
  } | null>(null);
  const content = location.caseId ? clinicCase(location.caseId) : null;
  const copyLink = async () => {
    const url = new URL(
      clinicUrl(new URL(window.location.href), location.caseId),
      window.location.origin,
    ).href;
    try {
      await navigator.clipboard.writeText(url);
      setShare({ caseId: location.caseId, url, copied: true });
    } catch {
      setShare({ caseId: location.caseId, url, copied: false });
    }
  };
  return (
    <div className="clinic-workspace">
      <header className="clinic-heading">
        <div>
          <span className="eyebrow">CALCULUS CLINIC · NINE ORIGINAL CASES</span>
          <h1 id="clinic-title" tabIndex={-1}>
            A decision.
            <br />
            <em>A reason to revisit.</em>
          </h1>
          <p>
            Find the assumption that changes the answer. Commit a choice,
            inspect an exact argument, then try the idea in a new situation.
          </p>
        </div>
        <div className="clinic-heading-note">
          <span aria-hidden="true">?</span>
          <p>
            Where does
            <br />
            the theorem
            <br />
            <em>actually apply?</em>
          </p>
        </div>
      </header>
      <div className="clinic-memory">
        <span className="clinic-memory-dot" aria-hidden="true" />
        <p>
          Answers and scratch work stay in this tab until reload. Reloading
          keeps the selected case and resets answers. Clinic does not save to
          your account or mark mastery.
        </p>
      </div>
      {location.notice && (
        <p className="clinic-notice" role="status">
          {location.notice}
        </p>
      )}
      {content ? (
        <>
          <nav className="clinic-case-nav" aria-label="Clinic cases">
            <button
              onClick={() => {
                setShare(null);
                openCase(null);
              }}
            >
              <ArrowLeft size={16} /> All cases
            </button>
            <label>
              Switch case
              <select
                aria-label="Switch Clinic case"
                value={content.id}
                onChange={(event) => {
                  if (isClinicCaseId(event.target.value)) {
                    setShare(null);
                    openCase(event.target.value);
                  }
                }}
              >
                {courseIds.map((course) => (
                  <optgroup key={course} label={course}>
                    {clinicCaseIds
                      .filter((id) => clinicCase(id).course === course)
                      .map((id) => (
                        <option key={id} value={id}>
                          {clinicCase(id).title}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <button onClick={copyLink}>
              <Link2 size={16} /> Copy case link
            </button>
          </nav>
          {share && share.caseId === location.caseId && (
            <div className="clinic-share">
              <p role="status">
                {share.copied
                  ? "Case link copied. Answers are not included."
                  : "Copy this case link. Answers are not included."}
              </p>
              <input
                aria-label="Shareable Clinic case link"
                readOnly
                value={share.url}
                onFocus={(event) => event.target.select()}
              />
            </div>
          )}
          <div className="clinic-case-heading">
            <span className="eyebrow">
              {content.course} · CASE{" "}
              {String(clinicCaseIds.indexOf(content.id) + 1).padStart(2, "0")} /
              09 · {content.theme}
            </span>
            <h2 id="clinic-case-title" tabIndex={-1}>
              {content.title}
            </h2>
          </div>
          <ClinicCaseAttempt
            key={content.id}
            content={content}
            attempt={clinic.attempt(content.id)}
            dispatch={clinic.dispatch}
            recover={recover}
            next={() => {
              setShare(null);
              openCase(
                clinicCaseIds[
                  (clinicCaseIds.indexOf(content.id) + 1) % clinicCaseIds.length
                ],
              );
            }}
          />
        </>
      ) : (
        <section className="clinic-picker" aria-label="Choose a Clinic case">
          {courseIds.map((course) => (
            <div className="clinic-course" key={course}>
              <header>
                <span className="eyebrow">{course}</span>
                <h2>{courses[course].title}</h2>
                <span>03 CASES</span>
              </header>
              <div className="clinic-case-cards">
                {clinicCaseIds
                  .filter((id) => clinicCase(id).course === course)
                  .map((id) => {
                    const item = clinicCase(id),
                      attempt = clinic.attempts[id];
                    return (
                      <button key={id} onClick={() => openCase(id)}>
                        <span className="clinic-card-number">
                          {String(clinicCaseIds.indexOf(id) + 1).padStart(
                            2,
                            "0",
                          )}
                        </span>
                        <small>{item.theme}</small>
                        <h3>{item.title}</h3>
                        <span className="clinic-card-foot">
                          {attempt && attempt.phase !== "decision"
                            ? "Continue in this tab"
                            : "Open case"}
                          <ArrowRight size={18} />
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
