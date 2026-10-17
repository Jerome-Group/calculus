import { z } from "zod";
import { chatGPTUserFromHeaders } from "../../app/chatgpt-auth";
import { getStudyDatabase } from "../../db";
import {
  attemptInputSchema,
  attemptSchema,
  checkedAttempt,
  emptyOverview,
  lessonIdSchema,
  mutableKeySchema,
  nextReview,
  parseMutableValue,
  parseRecordKey,
  recordKey,
  wireRecordSchema,
  type ImportResult,
  type StudyOverview,
  type StudyUser,
  type WireRecord,
} from "./model";

type Database = ReturnType<typeof getStudyDatabase>;
type Row = {
  record_key: string;
  revision: number;
  value_json: string | null;
  mutation_id: string;
  updated_at: string;
};
const columns = "record_key, revision, value_json, mutation_id, updated_at";
const mutationSchema = z
  .object({
    operation: z.literal("write"),
    expectedOwner: z.string(),
    key: mutableKeySchema,
    value: z.unknown(),
    baseRevision: z
      .number()
      .int()
      .min(0)
      .max(Number.MAX_SAFE_INTEGER - 1),
    mutationId: z.string().uuid(),
  })
  .strict();
const attemptRequestSchema = z
  .object({
    operation: z.literal("attempt"),
    expectedOwner: z.string(),
    attempt: attemptInputSchema,
  })
  .strict();
const importSchema = z
  .object({
    operation: z.literal("import"),
    expectedOwner: z.string(),
    items: z.array(z.unknown()).min(1).max(200),
  })
  .strict();
const requestSchema = z.union([
  mutationSchema,
  attemptRequestSchema,
  importSchema,
]);
const mutableImportSchema = z
  .object({
    kind: z.literal("mutable"),
    key: mutableKeySchema,
    value: z.unknown(),
  })
  .strict();
const attemptImportSchema = z
  .object({ kind: z.literal("attempt"), value: attemptSchema })
  .strict();
const noStore = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie, oai-authenticated-user-id",
};
function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers: noStore });
}
function wire(row: Row): WireRecord {
  return wireRecordSchema.parse({
    key: row.record_key,
    revision: row.revision,
    mutationId: row.mutation_id,
    value: row.value_json === null ? null : JSON.parse(row.value_json),
    updatedAt: row.updated_at,
  });
}
async function current(db: Database, owner: string, key: string) {
  return db
    .prepare(
      `SELECT ${columns} FROM study_records WHERE owner_id = ? AND record_key = ?`,
    )
    .bind(owner, key)
    .first<Row>();
}
async function insert(
  db: Database,
  owner: string,
  key: string,
  json: string | null,
  mutation: string,
) {
  return db
    .prepare(
      `INSERT INTO study_records (owner_id, record_key, revision, value_json, mutation_id, updated_at) VALUES (?, ?, 1, ?, ?, ?) ON CONFLICT(owner_id, record_key) DO NOTHING RETURNING ${columns}`,
    )
    .bind(owner, key, json, mutation, new Date().toISOString())
    .first<Row>();
}
function sameMutation(row: Row | null, mutation: string, json: string | null) {
  return row?.mutation_id === mutation && row.value_json === json;
}
async function writeMutable(
  db: Database,
  user: StudyUser,
  command: z.infer<typeof mutationSchema>,
) {
  const key = recordKey(command.key);
  const value = parseMutableValue(command.key, command.value);
  const json = value === null ? null : JSON.stringify(value);
  const before = await current(db, user.id, key);
  if (before?.mutation_id === command.mutationId)
    return sameMutation(before, command.mutationId, json)
      ? reply({ user, record: wire(before) })
      : reply({ error: "conflict", user, record: wire(before) }, 409);
  const row =
    command.baseRevision === 0
      ? await insert(db, user.id, key, json, command.mutationId)
      : await db
          .prepare(
            `UPDATE study_records SET value_json = ?, revision = revision + 1, mutation_id = ?, updated_at = ? WHERE owner_id = ? AND record_key = ? AND revision = ? RETURNING ${columns}`,
          )
          .bind(
            json,
            command.mutationId,
            new Date().toISOString(),
            user.id,
            key,
            command.baseRevision,
          )
          .first<Row>();
  if (row) return reply({ user, record: wire(row) });
  const existing = await current(db, user.id, key);
  if (existing && sameMutation(existing, command.mutationId, json))
    return reply({ user, record: wire(existing) });
  return reply(
    { error: "conflict", user, record: existing ? wire(existing) : null },
    409,
  );
}
async function writeAttempt(
  db: Database,
  user: StudyUser,
  input: z.infer<typeof attemptInputSchema>,
) {
  const value = checkedAttempt(input);
  const key = `attempt:${value.id}`;
  const json = JSON.stringify(value);
  const row = await insert(db, user.id, key, json, value.id);
  if (row) return reply({ user, record: wire(row) });
  const existing = await current(db, user.id, key);
  if (existing?.value_json === json)
    return reply({ user, record: wire(existing) });
  return reply(
    { error: "conflict", user, record: existing ? wire(existing) : null },
    409,
  );
}

async function importItems(db: Database, user: StudyUser, items: unknown[]) {
  const results: ImportResult[] = [];
  for (const [index, item] of items.entries()) {
    let key: string, json: string, mutation: string;
    try {
      const attempt = attemptImportSchema.safeParse(item);
      if (attempt.success) {
        if (attempt.data.value.source !== "legacy")
          throw new Error("Imported attempts must retain legacy provenance");
        key = `attempt:${attempt.data.value.id}`;
        json = JSON.stringify(attempt.data.value);
        mutation = attempt.data.value.id;
      } else {
        const mutable = mutableImportSchema.parse(item);
        const value = parseMutableValue(mutable.key, mutable.value);
        if (value === null) throw new Error("Empty import");
        key = recordKey(mutable.key);
        json = JSON.stringify(value);
        mutation = crypto.randomUUID();
      }
    } catch {
      results.push({
        index,
        outcome: "rejected",
        message: "Invalid legacy record",
      });
      continue;
    }
    try {
      const inserted = await insert(db, user.id, key, json, mutation);
      if (inserted) results.push({ index, outcome: "imported" });
      else {
        const existing = await current(db, user.id, key);
        results.push({
          index,
          outcome:
            key.startsWith("attempt:") && existing?.value_json !== json
              ? "rejected"
              : "retained-existing",
          ...(key.startsWith("attempt:") && existing?.value_json !== json
            ? { message: "Attempt ID already has different evidence" }
            : {}),
        });
      }
    } catch {
      results.push({
        index,
        outcome: "failed",
        message: "Service unavailable. Retry this item.",
      });
    }
  }
  return reply({ user, results });
}

async function overview(db: Database, owner: string): Promise<StudyOverview> {
  const { results: mutable } = await db
    .prepare(
      "SELECT record_key, value_json FROM study_records WHERE owner_id = ? AND value_json IS NOT NULL AND (record_key LIKE 'assessment:%' OR record_key = 'resume') LIMIT 1000",
    )
    .bind(owner)
    .all<Pick<Row, "record_key" | "value_json">>();
  const count = await db
    .prepare(
      "SELECT COUNT(*) AS total FROM study_records WHERE owner_id = ? AND record_key LIKE 'attempt:%'",
    )
    .bind(owner)
    .first<{ total: number }>();
  const { results: latestTasks } = await db
    .prepare(
      "SELECT value_json FROM (SELECT value_json, ROW_NUMBER() OVER (PARTITION BY json_extract(value_json, '$.lessonId'), json_extract(value_json, '$.taskId') ORDER BY json_extract(value_json, '$.at') DESC, record_key DESC) AS rank FROM study_records WHERE owner_id = ? AND record_key LIKE 'attempt:%' AND value_json IS NOT NULL) WHERE rank = 1 LIMIT 1000",
    )
    .bind(owner)
    .all<{ value_json: string }>();
  const summary: StudyOverview = {
    ...emptyOverview,
    choices: count?.total ?? 0,
    practice: [],
  };
  const practice = new Set<string>();
  for (const row of mutable) {
    const key = parseRecordKey(row.record_key);
    const value = parseMutableValue(key, JSON.parse(row.value_json!));
    if (
      key.kind === "resume" &&
      value &&
      typeof value === "object" &&
      "lessonId" in value
    )
      summary.resume = value.lessonId;
    if (
      key.kind === "assessment" &&
      value &&
      typeof value === "object" &&
      "status" in value
    ) {
      if (value.status === "Needs practice") {
        summary.needsPractice++;
        practice.add(key.lessonId);
      } else summary.explainable++;
    }
  }
  const latestLesson = new Map<string, z.infer<typeof attemptSchema>>();
  for (const row of latestTasks) {
    const attempt = attemptSchema.parse(JSON.parse(row.value_json));
    if (!attempt.correct || attempt.support === "hint")
      practice.add(attempt.lessonId);
    const previous = latestLesson.get(attempt.lessonId);
    if (!previous || previous.at < attempt.at)
      latestLesson.set(attempt.lessonId, attempt);
  }
  for (const attempt of latestLesson.values())
    if (Date.parse(nextReview(attempt)) <= Date.now())
      practice.add(attempt.lessonId);
  summary.practice = [...practice];
  return summary;
}

async function read(db: Database, user: StudyUser, url: URL) {
  const scope = url.searchParams.get("scope") || "overview";
  if (scope === "overview") {
    const { results } = await db
      .prepare(
        `SELECT ${columns} FROM study_records WHERE owner_id = ? AND (record_key LIKE 'assessment:%' OR record_key LIKE 'confidence:%' OR record_key = 'resume') ORDER BY record_key LIMIT 1000`,
      )
      .bind(user.id)
      .all<Row>();
    return reply({
      user,
      records: results.map(wire),
      overview: await overview(db, user.id),
    });
  }
  const lessonId = lessonIdSchema.parse(url.searchParams.get("lessonId"));
  if (scope === "lesson") {
    const { results } = await db
      .prepare(
        `SELECT ${columns} FROM study_records WHERE owner_id = ? AND (record_key LIKE ? OR record_key = ? OR record_key LIKE ? OR record_key LIKE ? OR record_key LIKE ?) ORDER BY record_key LIMIT 200`,
      )
      .bind(
        user.id,
        `assessment:${lessonId}:%`,
        `confidence:${lessonId}`,
        `practice-draft:${lessonId}:%`,
        `pilot-draft:${lessonId}:%`,
        `inline-control:${lessonId}:%`,
      )
      .all<Row>();
    return reply({ user, records: results.map(wire) });
  }
  if (scope !== "history")
    return reply({ error: "invalid", message: "Unknown read scope" }, 422);
  const limit = z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .parse(url.searchParams.get("limit") || 50);
  const cursor = url.searchParams.get("cursor");
  let cursorAt = "9999",
    cursorKey = "~";
  if (cursor) {
    const [at, key] = z
      .tuple([z.string().datetime(), z.string().uuid()])
      .parse(JSON.parse(cursor));
    cursorAt = at;
    cursorKey = `attempt:${key}`;
  }
  const { results } = await db
    .prepare(
      `SELECT ${columns} FROM study_records WHERE owner_id = ? AND record_key LIKE 'attempt:%' AND json_extract(value_json, '$.lessonId') = ? AND (json_extract(value_json, '$.at') < ? OR (json_extract(value_json, '$.at') = ? AND record_key < ?)) ORDER BY json_extract(value_json, '$.at') DESC, record_key DESC LIMIT ?`,
    )
    .bind(user.id, lessonId, cursorAt, cursorAt, cursorKey, limit + 1)
    .all<Row>();
  const total = await db
    .prepare(
      "SELECT COUNT(*) AS total FROM study_records WHERE owner_id = ? AND record_key LIKE 'attempt:%' AND json_extract(value_json, '$.lessonId') = ?",
    )
    .bind(user.id, lessonId)
    .first<{ total: number }>();
  const rows = results.slice(0, limit).map(wire);
  const last = rows.at(-1);
  const lastAttempt = last ? attemptSchema.parse(last.value) : null;
  return reply({
    user,
    records: rows,
    total: total?.total ?? 0,
    cursor:
      results.length > limit && lastAttempt
        ? JSON.stringify([lastAttempt.at, lastAttempt.id])
        : null,
  });
}

async function boundedBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("invalid-body");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > 262144) {
      await reader.cancel();
      throw new Error("body-limit");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return {
    value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(body)),
    bytes,
  };
}

export async function handleStudyRequest(request: Request): Promise<Response> {
  const user = chatGPTUserFromHeaders(request.headers);
  if (!user) return reply({ error: "signed-out", user: null }, 401);
  const url = new URL(request.url);
  if (request.method === "GET" && url.searchParams.get("scope") === "identity")
    return reply({ user });
  let command: z.infer<typeof requestSchema> | undefined;
  if (request.method !== "GET") {
    if (
      request.method !== "POST" ||
      request.headers.get("Origin") !== url.origin ||
      request.headers
        .get("Content-Type")
        ?.split(";")[0]
        .trim()
        .toLowerCase() !== "application/json" ||
      request.headers.get("Sec-Fetch-Site") === "cross-site"
    )
      return reply({ error: "invalid", message: "Use same-origin JSON" }, 422);
    try {
      const body = await boundedBody(request);
      command = requestSchema.parse(body.value);
      if (command.operation !== "import" && body.bytes > 65536)
        return reply({ error: "body-limit" }, 413);
    } catch (error) {
      return reply(
        {
          error:
            error instanceof Error && error.message === "body-limit"
              ? "body-limit"
              : "invalid",
        },
        error instanceof Error && error.message === "body-limit" ? 413 : 422,
      );
    }
    if (command.expectedOwner !== user.id)
      return reply({ error: "account-changed", user }, 409);
    if (command.operation === "write") {
      try {
        parseMutableValue(command.key, command.value);
      } catch {
        return reply({ error: "invalid", message: "Invalid study value" }, 422);
      }
    }
  }
  let db: Database;
  try {
    db = getStudyDatabase();
  } catch {
    return reply({ error: "service", user }, 503);
  }
  try {
    if (!command) return await read(db, user, url);
    if (command.operation === "write")
      return await writeMutable(db, user, command);
    if (command.operation === "attempt")
      return await writeAttempt(db, user, command.attempt);
    return await importItems(db, user, command.items);
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError)
      return reply({ error: "invalid", user }, 422);
    return reply({ error: "service", user }, 503);
  }
}
