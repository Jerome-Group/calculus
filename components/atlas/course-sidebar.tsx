"use client";
import { MathText } from "./math-text";
import Image from "next/image";
import {
  ArrowRight,
  ChevronDown,
  PanelLeftClose,
  FunctionSquare,
  List,
  Search,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { concepts, courses, courseIds } from "@/lib/curriculum";
import type { StudyController } from "./use-study-controller";
export function CourseSidebar({ study }: { study: StudyController }) {
  const {
    selected,
    route,
    expanded,
    search,
    course,
    lectures,
    sidebar,
    open,
    show,
    filtered,
    setCourse,
    setExpanded,
    setSearch,
  } = study;
  return (
    <Sidebar className="atlas-sidebar">
      <SidebarHeader className="brand">
        <a
          href="#course"
          onClick={(e) => {
            e.preventDefault();
            show("course");
          }}
          className="brand-link"
        >
          <Image
            src="/calculus-logo.png"
            alt=""
            width={36}
            height={36}
            className="brand-mark"
            unoptimized
          />
          <span className="atlas-wordmark">Calculus</span>
        </a>
        <button
          className="collapse-sidebar"
          aria-label="Minimise sidebar"
          onClick={sidebar.toggleSidebar}
        >
          <PanelLeftClose size={19} />
        </button>
      </SidebarHeader>
      <SidebarContent>
        <div className="nav-intro">
          <span>EXPLORE THE LIBRARY</span>
          <button aria-label="Course overview" onClick={() => show("course")}>
            <List size={17} />
          </button>
        </div>
        <nav className="course-rail" aria-label="Courses">
          {courseIds.map((id) => (
            <button
              key={id}
              aria-current={course === id ? "true" : undefined}
              onClick={() => {
                setCourse(id);
                setExpanded(1);
                show("course");
              }}
            >
              {id}
              <span>{courses[id].title}</span>
            </button>
          ))}
        </nav>
        <label className="concept-search">
          <Search size={15} />
          <input
            aria-label="Find a concept"
            placeholder="Find a concept…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button aria-label="Clear search" onClick={() => setSearch("")}>
              <X size={14} />
            </button>
          )}
        </label>
        <nav aria-label="Course concepts">
          {search ? (
            <div className="global-search-results">
              {courseIds.map((id) => {
                const matches = concepts.filter(
                  (c) => c.course === id && filtered(c),
                );
                return matches.length ? (
                  <div className="lecture-group" key={id}>
                    <span className="search-course-label">{id}</span>
                    <div className="concept-nav">
                      {matches.map((c) => (
                        <button key={c.id} onClick={() => open(c.id)}>
                          <MathText text={c.title} />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            lectures.map((title, i) => {
              const list = concepts.filter(
                (c) =>
                  c.course === course && c.lecture === i + 1 && filtered(c),
              );
              if (!list.length) return null;
              return (
                <div className="lecture-group" key={title}>
                  <button
                    className={
                      "lecture-toggle" + (expanded === i + 1 ? " expanded" : "")
                    }
                    onClick={() => setExpanded(expanded === i + 1 ? 0 : i + 1)}
                    aria-expanded={expanded === i + 1 || !!search}
                  >
                    <span className="lecture-num">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{title}</span>
                    <ChevronDown size={14} />
                  </button>
                  {(expanded === i + 1 || search) && (
                    <div className="concept-nav">
                      {list.map((c) => (
                        <button
                          key={c.id}
                          className={
                            selected === c.id && route === "lesson"
                              ? "active"
                              : ""
                          }
                          onClick={() => open(c.id)}
                          aria-current={
                            selected === c.id && route === "lesson"
                              ? "page"
                              : undefined
                          }
                        >
                          <MathText text={c.title} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
          {search && !concepts.some(filtered) && (
            <p className="empty-search">
              No matching concept. Try “limit”, “flux”, or “Jacobian”.
            </p>
          )}
        </nav>
      </SidebarContent>
      <SidebarFooter className="side-footer">
        <button
          className={"graph-link " + (route === "graph" ? "active" : "")}
          onClick={() => show("graph")}
        >
          <FunctionSquare size={20} />
          <span>
            Graph studio<small>Your functions, in 3D</small>
          </span>
          <ArrowRight size={16} />
        </button>
        <span className="source-note">
          Independent study companion
          <br />
          MH1100 · MH1101 · MH2100
        </span>
      </SidebarFooter>
    </Sidebar>
  );
}
