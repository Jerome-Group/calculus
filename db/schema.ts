import {
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const studyRecords = sqliteTable(
  "study_records",
  {
    ownerId: text("owner_id").notNull(),
    recordKey: text("record_key").notNull(),
    revision: integer("revision").notNull(),
    valueJson: text("value_json"),
    mutationId: text("mutation_id").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [primaryKey({ columns: [table.ownerId, table.recordKey] })],
);
