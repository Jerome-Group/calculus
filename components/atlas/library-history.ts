import type { CourseId } from "@/lib/curriculum";

export type LibraryHistory = {
  version: 1;
  course: CourseId;
  query: string;
};

export type LibraryHistoryRead =
  | { kind: "legacy" }
  | { kind: "valid"; value: LibraryHistory }
  | { kind: "invalid"; explanation: string };

function validateLibrary(value: unknown): LibraryHistory {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("invalid library state");
  const state = value as Record<string, unknown>;
  if (state.version !== 1) throw new Error("obsolete library state");
  if (
    !Object.keys(state).every((key) =>
      ["version", "course", "query"].includes(key),
    )
  )
    throw new Error("unknown library field");
  if (
    typeof state.course !== "string" ||
    !["MH1100", "MH1101", "MH2100"].includes(state.course)
  )
    throw new Error("unknown course");
  if (typeof state.query !== "string" || state.query.length > 100)
    throw new Error("search must contain at most 100 characters");
  return { version: 1, course: state.course as CourseId, query: state.query };
}

export function libraryUrl(url: URL, course: CourseId, query: string): string {
  const value = validateLibrary({ version: 1, course, query });
  const next = new URL(url);
  next.hash = "course";
  next.searchParams.delete("study");
  next.searchParams.delete("graph");
  next.searchParams.set("library", JSON.stringify(value));
  return `${next.pathname}${next.search}${next.hash}`;
}

export function readLibraryHistory(url: URL): LibraryHistoryRead {
  const encoded = url.searchParams.get("library");
  if (encoded === null) return { kind: "legacy" };
  try {
    if (encoded.length > 800) throw new Error("oversized library state");
    return { kind: "valid", value: validateLibrary(JSON.parse(encoded)) };
  } catch (error) {
    return {
      kind: "invalid",
      explanation: `The shared library could not be restored (${(error as Error).message}). Showing Calculus I with an empty search.`,
    };
  }
}
