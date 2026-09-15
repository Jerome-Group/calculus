"use client";
import { BookOpen, FunctionSquare } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { CourseLibrary } from "./course-library";
import { useStudyController } from "./use-study-controller";
import { CourseSidebar } from "./course-sidebar";
import { LessonWorkspace } from "./lesson-workspace";
import { GraphStudio } from "./graph-studio";
function AtlasInner() {
  const study = useStudyController();
  const {
    selected,
    route,
    search,
    course,
    concept,
    open,
    show,
    webmcp,
    setCourse,
    setExpanded,
  } = study;
  return (
    <>
      <CourseSidebar study={study} />
      <main className="atlas-main">
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
                  : "Course overview"}
            </span>
          </div>
          <div className="top-tabs">
            <button
              className={route !== "graph" ? "selected" : ""}
              onClick={() => open(selected)}
            >
              <BookOpen size={15} /> Learn
            </button>
            <button
              className={route === "graph" ? "selected" : ""}
              onClick={() => show("graph")}
            >
              <FunctionSquare size={15} /> Explore
            </button>
          </div>
        </header>
        {route === "lesson" ? (
          <LessonWorkspace study={study} />
        ) : route === "graph" ? (
          <GraphStudio study={study} />
        ) : (
          <CourseLibrary
            course={course}
            query={search}
            chooseCourse={(id) => {
              setCourse(id);
              setExpanded(1);
            }}
            open={open}
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
    <SidebarProvider
      defaultOpen
      style={{ "--sidebar-width": "230px" } as React.CSSProperties}
    >
      <AtlasInner />
    </SidebarProvider>
  );
}
