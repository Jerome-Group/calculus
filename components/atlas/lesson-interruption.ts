import { z } from "zod";
import { concepts } from "@/lib/curriculum";
import { readLessonHistory, lessonUrl } from "./study-history";
import { readClinicReturn, type ClinicReturn } from "./clinic-history";
import { readWorkshopReturn, type WorkshopReturn } from "./workshop-history";

export type LessonInterruption = {
  version: 1;
  id: string;
  url: string;
  scrollY: number;
  clinicReturn: ClinicReturn | null;
  workshopReturn: WorkshopReturn | null;
};
const historyEntry = z.object({
  prerequisiteReturn: z
    .object({
      version: z.literal(1),
      id: z.string().max(100),
      url: z.string().max(8000),
      scrollY: z.number().finite().min(0).max(10_000_000),
      clinicReturn: z.unknown(),
      workshopReturn: z.unknown(),
    })
    .strict(),
});

export function readLessonInterruption(
  state: unknown,
  currentUrl: URL,
  bounds: (scene: string) => { min: number; max: number },
): LessonInterruption | null {
  if (!concepts.some((concept) => currentUrl.hash === `#${concept.id}`))
    return null;
  const parsed = historyEntry.safeParse(state);
  if (!parsed.success) return null;
  const point = parsed.data.prerequisiteReturn;
  const concept = concepts.find((concept) => concept.id === point.id);
  if (!concept) return null;
  try {
    const url = new URL(point.url, currentUrl);
    if (
      url.origin !== currentUrl.origin ||
      url.pathname !== currentUrl.pathname ||
      url.hash !== `#${point.id}`
    )
      return null;
    const lesson = readLessonHistory(url, concept, bounds);
    if (lesson.kind !== "valid") return null;
    return {
      version: 1,
      id: point.id,
      url: lessonUrl(url, point.id, lesson.value),
      scrollY: point.scrollY,
      clinicReturn: readClinicReturn(point, point.id),
      workshopReturn: readWorkshopReturn(point, point.id),
    };
  } catch {
    return null;
  }
}
