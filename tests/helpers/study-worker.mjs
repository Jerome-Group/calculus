import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";

export async function createStudyWorker({ database = true } = {}) {
  const serverRoot = new URL("../../dist/server/", import.meta.url);
  const paths = await readdir(serverRoot, { recursive: true });
  const modules = [
    "index.js",
    ...paths.filter((path) => path.endsWith(".js") && path !== "index.js"),
  ].map((path) => ({
    type: "ESModule",
    path: fileURLToPath(new URL(path, serverRoot)),
  }));
  const worker = new Miniflare(
    convertV4MiniflareOptions({
      modules,
      modulesRoot: fileURLToPath(serverRoot),
      compatibilityDate: "2026-09-11",
      compatibilityFlags: ["nodejs_compat"],
      d1Databases: database ? ["DB"] : [],
    }),
  );
  try {
    if (database) {
      const db = await worker.getD1Database("DB");
      const journal = JSON.parse(
        await readFile(
          new URL("../../drizzle/meta/_journal.json", import.meta.url),
          "utf8",
        ),
      );
      for (const migration of journal.entries) {
        const sql = await readFile(
          new URL(`../../drizzle/${migration.tag}.sql`, import.meta.url),
          "utf8",
        );
        for (const statement of sql
          .split("--> statement-breakpoint")
          .filter((value) => value.trim()))
          await db.prepare(statement).run();
      }
    }
    return worker;
  } catch (error) {
    await worker.dispose();
    throw error;
  }
}
