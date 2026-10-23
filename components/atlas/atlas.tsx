"use client";
import { BookOpen, FunctionSquare, Stethoscope, Pencil } from "lucide-react";
import { useReducer } from "react";
import { createWorkshop, workshopTransition } from "@/lib/workshop";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CourseLibrary } from "./course-library";
import { useStudyController } from "./use-study-controller";
import { CourseSidebar } from "./course-sidebar";
import { LessonWorkspace } from "./lesson-workspace";
import { GraphStudio } from "./graph-studio";
import { StudyRecordsProvider } from "./study-records";
import { StudyAccount } from "./study-account";
import { ClinicWorkspace } from "./clinic-workspace";
import { useClinicSession } from "./use-clinic-session";
import { WorkshopWorkspace } from "./workshop-workspace";
function AtlasInner() {
  const study = useStudyController();
  const clinic = useClinicSession();
  const [workshop, dispatchWorkshop] = useReducer(
    workshopTransition,
    undefined,
    createWorkshop,
  );
  const { selected, route, search, course, concept, open, show, webmcp } =
    study;
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus({ preventScroll: true });
          main?.scrollIntoView({ block: "start" });
        }}
      >
        Skip to mathematics
      </a>
      <CourseSidebar study={study} />
      <main className="atlas-main" id="main-content" tabIndex={-1}>
        <header className="topbar">
          <div>
            <SidebarTrigger aria-label="Toggle lecture navigation" />
            <button className="library-home" onClick={() => show("course")}>
              Library
            </button>
            <span className="slash">/</span>
            <span>
              {route === "lesson"
                ? `${concept.course} · ${concept.course === "MH1101" ? "Chapter" : "Lecture"} ${concept.lecture}`
                : route === "graph"
                  ? "Graph studio"
                  : route === "clinic"
                    ? "Calculus Clinic"
                    : route === "workshop"
                      ? "Proof workshop"
                      : "Course overview"}
            </span>
          </div>
          <div className="top-tabs">
            {route !== "lesson" && (
              <button onClick={() => open(selected)}>
                <BookOpen size={15} /> Resume lesson
              </button>
            )}
            <button
              className={route === "workshop" ? "selected" : ""}
              onClick={() => study.openWorkshop()}
            >
              <Pencil size={15} /> Proof workshop
            </button>
            <button
              className={route === "clinic" ? "selected" : ""}
              onClick={() => study.openClinic()}
            >
              <Stethoscope size={15} /> Clinic
            </button>
            <button
              className={route === "graph" ? "selected" : ""}
              onClick={() => show("graph")}
            >
              <FunctionSquare size={15} /> Graph studio
            </button>
          </div>
        </header>
        <StudyAccount />
        {route === "lesson" ? (
          <LessonWorkspace study={study} />
        ) : route === "clinic" ? (
          <ClinicWorkspace
            clinic={clinic}
            location={study.clinicLocation}
            openCase={study.openClinic}
            recover={study.openClinicRecovery}
          />
        ) : route === "workshop" ? (
          <WorkshopWorkspace
            state={workshop[study.workshopLocation.id]}
            dispatch={dispatchWorkshop}
            study={study}
          />
        ) : route === "graph" ? (
          <GraphStudio study={study} />
        ) : (
          <CourseLibrary
            course={course}
            query={search}
            setQuery={study.setSearch}
            notice={study.historyNotice}
            chooseCourse={study.chooseCourse}
            open={open}
            openClinic={() => study.openClinic()}
            openWorkshop={() => study.openWorkshop()}
          />
        )}
        <details className="agent-status">
          <summary>Browser tools</summary>
          <p>{webmcp}</p>
        </details>
        <div className="site-bottom">Calculus · MH1100 / MH1101 / MH2100</div>
      </main>
    </>
  );
}
export default function Atlas() {
  return (
    <StudyRecordsProvider>
      <SidebarProvider
        defaultOpen
        style={{ "--sidebar-width": "230px" } as React.CSSProperties}
      >
        <AtlasInner />
      </SidebarProvider>
    </StudyRecordsProvider>
  );
}
