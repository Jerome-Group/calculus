import { z } from "zod";
import {
  investigation,
  isInvestigationId,
  type InvestigationId,
} from "@/lib/workshop";

const investigationId = z.string().refine(isInvestigationId);
const selection = z
  .object({ version: z.literal(1), id: investigationId })
  .strict();
const position = z
  .object({
    version: z.literal(1),
    id: investigationId,
    focus: z.enum(["construction", "result"]),
    scrollY: z.number().finite().min(0).max(10_000_000),
  })
  .strict();
export type WorkshopReturn = z.infer<typeof position>;
export type WorkshopLocation = { id: InvestigationId; notice: string };
export const workshopFocusIds = {
  construction: "workshop-construction",
  result: "workshop-result",
};
const invalid: WorkshopLocation = {
  id: "linear-bound",
  notice:
    "This workshop link could not be restored. Showing the first investigation. No construction or explanation was loaded from the link.",
};

export function readWorkshopHistory(url: URL): WorkshopLocation {
  const values = url.searchParams.getAll("workshop");
  if (!values.length) return { id: "linear-bound", notice: "" };
  if (values.length === 1 && values[0].length <= 200) {
    try {
      const parsed = selection.safeParse(JSON.parse(values[0]));
      if (parsed.success) return { id: parsed.data.id, notice: "" };
    } catch {
      return invalid;
    }
  }
  return invalid;
}
export function workshopUrl(url: URL, id: InvestigationId): string {
  const next = new URL(url);
  next.hash = "workshop";
  for (const key of ["study", "graph", "library", "clinic", "workshop"])
    next.searchParams.delete(key);
  next.searchParams.set("workshop", JSON.stringify({ version: 1, id }));
  return `${next.pathname}${next.search}${next.hash}`;
}
export function readWorkshopReturn(
  state: unknown,
  lessonId: string,
): WorkshopReturn | null {
  const parsed = z.object({ workshopReturn: position }).safeParse(state);
  return parsed.success &&
    investigation(parsed.data.workshopReturn.id).lessons.includes(lessonId)
    ? parsed.data.workshopReturn
    : null;
}
export function readWorkshopPosition(
  state: unknown,
  id: InvestigationId,
): WorkshopReturn | null {
  const parsed = z.object({ workshopPosition: position }).safeParse(state);
  return parsed.success && parsed.data.workshopPosition.id === id
    ? parsed.data.workshopPosition
    : null;
}
