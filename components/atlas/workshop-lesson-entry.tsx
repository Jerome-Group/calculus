import { investigationsForLesson, type InvestigationId } from "@/lib/workshop";

export function WorkshopLessonEntry({
  lessonId,
  open,
}: {
  lessonId: string;
  open: (id: InvestigationId) => void;
}) {
  const entries = investigationsForLesson(lessonId);
  return entries.length ? (
    <div className="lesson-question workshop-lesson-entry">
      <span className="label">CONSTRUCT AN ARGUMENT</span>
      <p>Build an object and inspect its exact certificate or obstruction.</p>
      {entries.map((item) => (
        <button key={item.id} onClick={() => open(item.id)}>
          {item.title} · Proof workshop
        </button>
      ))}
    </div>
  ) : null;
}
