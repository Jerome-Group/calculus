import { z } from "zod";
import { concepts } from "../curriculum";
import { learningGuides } from "../curriculum/learning";
import { pilotLessons } from "../curriculum/learning-modes";
import {
  inlineExperimentCatalog,
  initialInlineExperimentValue,
  normalizeInlineExperimentValue,
} from "../curriculum/inline-experiments";

const lessonIds = new Set(concepts.map(({ id }) => id));
export const lessonIdSchema = z
  .string()
  .refine((id) => lessonIds.has(id), "Unknown lesson");
const exerciseExists = (lessonId: string, exerciseId: string) =>
  exerciseId === "core" ||
  learningGuides[lessonId]?.exercises?.some(({ id }) => id === exerciseId);
const lessonPart = { lessonId: lessonIdSchema };
const exercisePart = { ...lessonPart, exerciseId: z.string().max(100) };
const taskPart = { ...lessonPart, taskId: z.string().max(100) };
export const mutableKeySchema = z
  .discriminatedUnion("kind", [
    z.object({ kind: z.literal("assessment"), ...exercisePart }).strict(),
    z.object({ kind: z.literal("confidence"), ...lessonPart }).strict(),
    z.object({ kind: z.literal("practice-draft"), ...exercisePart }).strict(),
    z.object({ kind: z.literal("pilot-draft"), ...taskPart }).strict(),
    z.object({ kind: z.literal("resume") }).strict(),
    z
      .object({
        kind: z.literal("inline-control"),
        ...lessonPart,
        experimentId: z.string().max(100),
        parameter: z.enum(["value", "radius", "angle"]),
      })
      .strict(),
  ])
  .superRefine((key, ctx) => {
    if (
      (key.kind === "assessment" || key.kind === "practice-draft") &&
      !exerciseExists(key.lessonId, key.exerciseId)
    )
      ctx.addIssue({ code: "custom", message: "Unknown exercise" });
    if (
      (key.kind === "confidence" || key.kind === "pilot-draft") &&
      !pilotLessons[key.lessonId]
    )
      ctx.addIssue({ code: "custom", message: "Unknown pilot lesson" });
    if (key.kind === "pilot-draft" && !pilotTask(key.lessonId, key.taskId))
      ctx.addIssue({ code: "custom", message: "Unknown task" });
    if (
      key.kind === "inline-control" &&
      !inlineExperimentCatalog(key.lessonId).some(
        ({ id, parameters }) =>
          id === key.experimentId && parameters.includes(key.parameter),
      )
    )
      ctx.addIssue({ code: "custom", message: "Unknown control" });
  });
export type MutableStudyKey = z.infer<typeof mutableKeySchema>;
export const practiceStatusSchema = z.enum([
  "Needs practice",
  "Can explain independently",
]);
const atSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value).toISOString());
export const assessmentSchema = z
  .object({ status: practiceStatusSchema, date: atSchema })
  .strict();
export const practiceDraftSchema = z
  .object({
    answer: z.string().max(16384),
    hintOpen: z.boolean(),
    solutionOpen: z.boolean(),
  })
  .strict();
export const pilotDraftSchema = z
  .object({
    choice: z.string().max(100),
    reasoning: z.string().max(16384),
    support: z.enum(["none", "hint"]),
    feedback: z.string().max(8192),
  })
  .strict();
const confidenceSchema = z.enum(["unsure", "confident"]);
const resumeSchema = z.object({ lessonId: lessonIdSchema }).strict();
export type StudyValues = {
  assessment: z.infer<typeof assessmentSchema>;
  confidence: z.infer<typeof confidenceSchema>;
  "practice-draft": z.infer<typeof practiceDraftSchema>;
  "pilot-draft": z.infer<typeof pilotDraftSchema>;
  resume: z.infer<typeof resumeSchema>;
  "inline-control": number;
};
export type MutableValue = StudyValues[keyof StudyValues];
export type StudyValue<K extends MutableStudyKey> = StudyValues[K["kind"]];
const valueSchemas = {
  assessment: assessmentSchema,
  confidence: confidenceSchema,
  "practice-draft": practiceDraftSchema,
  "pilot-draft": pilotDraftSchema,
  resume: resumeSchema,
  "inline-control": z.number().finite(),
};

export function pilotTask(lessonId: string, taskId: string) {
  return pilotLessons[lessonId]?.practice.find(({ id }) => id === taskId);
}
export function parseMutableValue(
  key: MutableStudyKey,
  value: unknown,
): MutableValue | null {
  if (value === null) return null;
  const parsed = valueSchemas[key.kind].parse(value);
  if (key.kind === "pilot-draft") {
    const draft = pilotDraftSchema.parse(parsed);
    if (
      draft.choice &&
      !pilotTask(key.lessonId, key.taskId)?.choices.some(
        ({ id }) => id === draft.choice,
      )
    )
      throw new Error("Unknown choice");
  }
  if (key.kind === "inline-control")
    return normalizeInlineExperimentValue(
      key.lessonId,
      key.experimentId,
      key.parameter,
      z.number().parse(parsed),
    );
  return parsed;
}
export function recordKey(key: MutableStudyKey): string {
  switch (key.kind) {
    case "resume":
      return "resume";
    case "assessment":
    case "practice-draft":
      return `${key.kind}:${key.lessonId}:${key.exerciseId}`;
    case "confidence":
      return `${key.kind}:${key.lessonId}`;
    case "pilot-draft":
      return `${key.kind}:${key.lessonId}:${key.taskId}`;
    case "inline-control":
      return `${key.kind}:${key.lessonId}:${key.experimentId}:${key.parameter}`;
  }
}
export function parseRecordKey(raw: string): MutableStudyKey {
  const [kind, lessonId, part, parameter, ...extra] = raw.split(":");
  if (extra.length) throw new Error("Invalid key");
  const fields =
    kind === "resume"
      ? { kind }
      : kind === "assessment" || kind === "practice-draft"
        ? { kind, lessonId, exerciseId: part }
        : kind === "pilot-draft"
          ? { kind, lessonId, taskId: part }
          : kind === "inline-control"
            ? { kind, lessonId, experimentId: part, parameter }
            : { kind, lessonId };
  const key = mutableKeySchema.parse(fields);
  if (recordKey(key) !== raw) throw new Error("Noncanonical key");
  return key;
}
export function emptyStudyValue<K extends MutableStudyKey>(
  key: K,
): StudyValue<K> | null {
  const value =
    key.kind === "practice-draft"
      ? { answer: "", hintOpen: false, solutionOpen: false }
      : key.kind === "pilot-draft"
        ? { choice: "", reasoning: "", support: "none", feedback: "" }
        : key.kind === "inline-control"
          ? initialInlineExperimentValue(
              key.lessonId,
              key.experimentId,
              key.parameter,
            )
          : null;
  return value as StudyValue<K> | null;
}

export const attemptInputSchema = z
  .object({
    id: z.string().uuid(),
    lessonId: lessonIdSchema,
    taskId: z.string().max(100),
    choice: z.string().max(100),
    support: z.enum(["none", "hint"]),
    at: atSchema,
  })
  .strict()
  .superRefine((attempt, ctx) => {
    if (
      !pilotTask(attempt.lessonId, attempt.taskId)?.choices.some(
        ({ id }) => id === attempt.choice,
      )
    )
      ctx.addIssue({ code: "custom", message: "Unknown task or choice" });
  });
export type AttemptInput = z.infer<typeof attemptInputSchema>;
export const attemptSchema = z
  .object({
    id: z.string().uuid(),
    lessonId: lessonIdSchema,
    taskId: z.string().max(100),
    choice: z.string().max(100).optional(),
    kind: z.enum(["recognition", "setup", "transfer"]),
    correct: z.boolean(),
    support: z.enum(["none", "hint"]),
    errorCode: z.string().max(100).optional(),
    at: atSchema,
    source: z.enum(["choice", "legacy"]),
  })
  .strict()
  .superRefine((attempt, ctx) => {
    const task = pilotTask(attempt.lessonId, attempt.taskId);
    if (!task || task.kind !== attempt.kind)
      ctx.addIssue({ code: "custom", message: "Unknown task or kind" });
    if (attempt.source === "choice") {
      const choice = task?.choices.find(({ id }) => id === attempt.choice);
      if (
        !choice ||
        attempt.correct !== (choice.id === task?.answer) ||
        attempt.errorCode !== choice.errorCode
      )
        ctx.addIssue({
          code: "custom",
          message: "Choice result does not match known task",
        });
    }
  });
export type StudyAttempt = z.infer<typeof attemptSchema>;
export type PracticeRecord = z.infer<typeof assessmentSchema>;
export type PilotRecord = {
  attempts: Pick<
    StudyAttempt,
    "taskId" | "kind" | "correct" | "support" | "errorCode" | "at"
  >[];
  nextReview?: string;
};
export function hasDelayedIndependentChoiceEvidence(record?: PilotRecord) {
  const attempts =
    record?.attempts.filter(
      (attempt) =>
        attempt.kind === "transfer" &&
        attempt.correct &&
        attempt.support === "none",
    ) ?? [];
  return attempts.some((first, index) =>
    attempts
      .slice(index + 1)
      .some(
        (later) =>
          Math.abs(Date.parse(later.at) - Date.parse(first.at)) >= 86400000,
      ),
  );
}
export function checkedAttempt(input: AttemptInput): StudyAttempt {
  const task = pilotTask(input.lessonId, input.taskId)!;
  const selected = task.choices.find(({ id }) => id === input.choice)!;
  return {
    id: input.id,
    lessonId: input.lessonId,
    taskId: input.taskId,
    choice: input.choice,
    kind: task.kind,
    correct: selected.id === task.answer,
    support: input.support,
    ...(selected.errorCode ? { errorCode: selected.errorCode } : {}),
    at: input.at,
    source: "choice",
  };
}
export function nextReview(
  attempt: Pick<StudyAttempt, "at" | "correct" | "support">,
) {
  return new Date(
    Date.parse(attempt.at) +
      (attempt.correct && attempt.support === "none" ? 3 : 1) * 86400000,
  ).toISOString();
}
export const userSchema = z.object({
  id: z.string().min(1).max(512),
  email: z.string(),
  displayName: z.string(),
  fullName: z.string().nullable(),
});
export type StudyUser = z.infer<typeof userSchema>;
export const wireRecordSchema = z
  .object({
    key: z.string().max(512),
    revision: z.number().int().positive(),
    mutationId: z.string().uuid(),
    value: z.unknown(),
    updatedAt: atSchema,
  })
  .superRefine((row, ctx) => {
    try {
      if (row.key.startsWith("attempt:")) {
        const value = attemptSchema.parse(row.value);
        if (row.key !== `attempt:${value.id}`)
          throw new Error("Invalid attempt ID");
      } else parseMutableValue(parseRecordKey(row.key), row.value);
    } catch {
      ctx.addIssue({ code: "custom", message: "Invalid stored record" });
    }
  });
export type WireRecord = z.infer<typeof wireRecordSchema>;
export const overviewSchema = z.object({
  explainable: z.number().int().nonnegative(),
  needsPractice: z.number().int().nonnegative(),
  choices: z.number().int().nonnegative(),
  practice: z.array(lessonIdSchema),
  resume: lessonIdSchema.nullable(),
});
export type StudyOverview = z.infer<typeof overviewSchema>;
export const emptyOverview: StudyOverview = {
  explainable: 0,
  needsPractice: 0,
  choices: 0,
  practice: [],
  resume: null,
};
export const readResponseSchema = z.object({
  user: userSchema,
  records: z.array(wireRecordSchema).max(1000),
  overview: overviewSchema.optional(),
  cursor: z.string().nullable().optional(),
  total: z.number().int().nonnegative().optional(),
});
export const writeResponseSchema = z.object({
  user: userSchema,
  record: wireRecordSchema,
});
export const conflictResponseSchema = z.object({
  error: z.literal("conflict"),
  user: userSchema,
  record: wireRecordSchema.nullable(),
});
export const importItemSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("mutable"),
      key: z.unknown(),
      value: z.unknown(),
    })
    .strict(),
  z.object({ kind: z.literal("attempt"), value: attemptSchema }).strict(),
]);
export type ImportItem = z.infer<typeof importItemSchema>;
export const importResultSchema = z.object({
  index: z.number().int().nonnegative(),
  outcome: z.enum(["imported", "retained-existing", "rejected", "failed"]),
  message: z.string().optional(),
});
export type ImportResult = z.infer<typeof importResultSchema>;

export type SaveOutcome = {
  kind:
    | "saved"
    | "guest"
    | "unsaved"
    | "conflict"
    | "account-changed"
    | "superseded";
};
export type Persistence =
  | {
      kind: "loading" | "guest" | "ready" | "saving" | "saved";
      message: string;
    }
  | {
      kind: "unsaved";
      reason: "offline" | "service" | "invalid";
      message: string;
    }
  | { kind: "conflict"; message: string };
