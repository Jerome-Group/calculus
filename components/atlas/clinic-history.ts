import { z } from "zod";
import {
  clinicCase,
  isClinicCaseId,
  type ClinicCaseId,
} from "@/lib/clinic/cases";

const caseId = z.string().refine(isClinicCaseId);
const selection = z.object({ version: z.literal(1), caseId }).strict();
const returnPoint = z
  .object({
    version: z.literal(1),
    caseId,
    focus: z.enum(["case", "diagnosis", "transfer", "feedback"]),
    scrollY: z.number().finite().min(0).max(10_000_000),
  })
  .strict();
export type ClinicReturn = z.infer<typeof returnPoint>;
export type ClinicLocation = { caseId: ClinicCaseId | null; notice: string };
export const clinicFocusIds = {
  case: "clinic-case-title",
  diagnosis: "clinic-diagnosis",
  transfer: "clinic-transfer-title",
  feedback: "clinic-transfer-feedback",
};

const invalidClinicLink: ClinicLocation = {
  caseId: null,
  notice:
    "This Clinic link could not be restored. Choose a case below. No answers were loaded from the link.",
};

export function readClinicHistory(url: URL): ClinicLocation {
  const encoded = url.searchParams.getAll("clinic");
  if (!encoded.length) return { caseId: null, notice: "" };
  if (encoded.length === 1 && encoded[0].length <= 300) {
    try {
      const parsed = selection.safeParse(JSON.parse(encoded[0]));
      if (parsed.success) return { caseId: parsed.data.caseId, notice: "" };
    } catch {
      return invalidClinicLink;
    }
  }
  return invalidClinicLink;
}
export function clinicUrl(url: URL, id: ClinicCaseId | null): string {
  const next = new URL(url);
  next.hash = "clinic";
  for (const key of ["study", "graph", "library", "clinic"])
    next.searchParams.delete(key);
  if (id)
    next.searchParams.set("clinic", JSON.stringify({ version: 1, caseId: id }));
  return `${next.pathname}${next.search}${next.hash}`;
}
export function readClinicReturn(
  state: unknown,
  lessonId: string,
): ClinicReturn | null {
  const parsed = z.object({ clinicReturn: returnPoint }).safeParse(state);
  if (!parsed.success) return null;
  const point = parsed.data.clinicReturn;
  const content = clinicCase(point.caseId);
  return [...content.decision.choices, ...content.transfer.choices].some(
    (choice) => choice.recovery === lessonId,
  )
    ? point
    : null;
}
export function readClinicPosition(
  state: unknown,
  id: ClinicCaseId | null,
): ClinicReturn | null {
  const parsed = z.object({ clinicPosition: returnPoint }).safeParse(state);
  return parsed.success && parsed.data.clinicPosition.caseId === id
    ? parsed.data.clinicPosition
    : null;
}
