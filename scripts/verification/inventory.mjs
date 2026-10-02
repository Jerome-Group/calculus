import { readdir, readFile, access, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createServer } from "vite";
import { browserPlan } from "./browser-plan.mjs";

const readJson = async (root, file) =>
  JSON.parse(await readFile(path.join(root, file), "utf8"));

async function filesIn(root, relative) {
  const entries = await readdir(path.join(root, relative), {
    withFileTypes: true,
  });
  const nested = await Promise.all(
    entries.map((entry) => {
      const file = path.posix.join(relative, entry.name);
      return entry.isDirectory() ? filesIn(root, file) : [file];
    }),
  );
  return nested.flat().sort();
}

export async function inventory(root) {
  const cacheDir = await mkdtemp(path.join(os.tmpdir(), "calculus-inventory-"));
  const vite = await createServer({
    cacheDir,
    appType: "custom",
    configFile: false,
    logLevel: "silent",
    root,
    resolve: { alias: { "@": root } },
    server: { middlewareMode: true, hmr: false, ws: false },
    optimizeDeps: { noDiscovery: true, include: [] },
  }).catch(async (error) => {
    await rm(cacheDir, { recursive: true, force: true });
    throw error;
  });
  try {
    const load = (file) => vite.ssrLoadModule(file);
    const [
      curriculum,
      learning,
      variants,
      planar,
      spatial,
      tools,
      inline,
      examples,
      bridges,
    ] = await Promise.all([
      load("/lib/curriculum/index.ts"),
      load("/lib/curriculum/learning.ts"),
      load("/lib/curriculum/scene-variants.ts"),
      load("/lib/curriculum/planar.ts"),
      load("/lib/atlas/scenes.ts"),
      load("/components/atlas/study-tools.ts"),
      load("/lib/curriculum/inline-experiments.ts"),
      load("/lib/curriculum/example-registry.ts"),
      load("/lib/curriculum/prerequisite-routes.ts"),
    ]);
    const [pkg, lock, ledger, sourceManifest, sourceObservation] =
      await Promise.all([
        readJson(root, "package.json"),
        readJson(root, "package-lock.json"),
        readJson(root, "lib/curriculum/outcome-ledger.json"),
        readJson(root, "lib/curriculum/source-manifest.json"),
        readJson(root, "lib/curriculum/source-observation.json"),
      ]);
    const sceneIds = [
      ...new Set(curriculum.concepts.flatMap(variants.sceneVariants)),
    ].sort();
    const scenes = sceneIds.map((id) => {
      const model = id.startsWith("plane-")
        ? planar.planarModel(id)
        : spatial.sceneInfo(id);
      return {
        id,
        dimension: id.startsWith("plane-") ? 2 : 3,
        renderer: id.startsWith("plane-")
          ? "svg"
          : "webgl-or-svg-compatibility",
        parameter: Object.fromEntries(
          ["label", "min", "max", "step", "initial"].map((key) => [
            key,
            model[key],
          ]),
        ),
        formula: id.startsWith("plane-") ? model.formula : spatial.sceneTex(id),
        note: model.note,
      };
    });
    let comparisonLabs = [],
      labsAvailable = false;
    try {
      await access(path.join(root, "lib/curriculum/comparison-labs.ts"));
      labsAvailable = true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (labsAvailable) {
      const labs = await load("/lib/curriculum/comparison-labs.ts");
      comparisonLabs = labs.comparisonCoverage();
    }
    const tests = await testCatalog(root, curriculum.concepts, sceneIds);
    const sourceFiles = (
      await Promise.all(
        [
          "app",
          "components",
          "lib",
          "hooks",
          "build",
          "worker",
          "db",
          "examples",
        ].map((area) => filesIn(root, area)),
      )
    )
      .flat()
      .filter((file) => /\.(tsx?|json)$/.test(file));
    const dependencyGraph = [];
    for (const file of sourceFiles.filter((file) => /\.tsx?$/.test(file))) {
      const text = await readFile(path.join(root, file), "utf8");
      const imports = [
        ...text.matchAll(/(?:from\s*|import\s*\(?\s*)(["'])([^"']+)\1/g),
      ].map((match) => match[2]);
      dependencyGraph.push({
        file,
        imports: [...new Set(imports)].sort(),
        basis: "static-import-specifiers",
      });
    }
    return {
      schemaVersion: 1,
      effects:
        "Read source files; create isolated temporary Vite cache and remove it on completion.",
      browserPlan,
      application: "calculus",
      routes: [
        {
          id: "course",
          url: "/#course",
          type: "library",
          query: "library",
          stateVersion: 1,
          state: {
            course: Object.keys(curriculum.courses),
            query: { type: "string", maxLength: 100 },
          },
          restoration: {
            parser: "components/atlas/library-history.ts#readLibraryHistory",
            maxEncodedLength: 800,
            rejectsUnknownFields: true,
            invalidState: "Calculus I and empty search, with an explanation",
            legacyUrl: "supported",
          },
        },
        {
          id: "graph",
          url: "/#graph",
          type: "graph",
          query: "graph",
          stateVersion: 1,
          modes: ["surface", "parametric", "curve", "implicit"],
        },
        ...curriculum.concepts.map((concept) => ({
          id: concept.id,
          url: `/#${concept.id}`,
          type: "lesson",
          query: "study",
          stateVersion: 1,
        })),
      ],
      courses: curriculum.courses,
      lessons: curriculum.concepts.map((concept) => ({
        ...concept,
        guide: learning.learningGuides[concept.id],
        sceneVariants: variants.sceneVariants(concept),
        inlineExperiments: inline.inlineExperimentCatalog(concept.id),
        comparisonLab:
          comparisonLabs.find((lab) => lab.conceptId === concept.id) ?? null,
        examples: examples.examplesForConcept(concept.id),
      })),
      scenes,
      comparisonLabs,
      features: featureCatalog(),
      tools: tools
        .studyTools(curriculum.concepts, () => {
          throw new Error("Inventory never executes study actions.");
        })
        .map((tool) => ({
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          ...(tool.annotations ? { annotations: tool.annotations } : {}),
        })),
      prerequisites: {
        edges: curriculum.concepts.flatMap((concept) =>
          (learning.learningGuides[concept.id]?.prerequisites ?? []).map(
            (prerequisite) => ({ lesson: concept.id, prerequisite }),
          ),
        ),
        forwardBridges: bridges.forwardBridges,
        issues: bridges.prerequisiteIssues(
          curriculum.concepts.map((concept) => concept.id),
          learning.learningGuides,
        ),
      },
      sources: curriculum.sources,
      sourceManifest,
      sourceObservation,
      outcomeLedger: ledger,
      dependencies: Object.entries({
        ...pkg.dependencies,
        ...pkg.devDependencies,
      })
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, declared]) => ({
          name,
          declared,
          locked: lock.packages?.[`node_modules/${name}`]?.version ?? null,
          development: Object.hasOwn(pkg.devDependencies ?? {}, name),
        })),
      dependencyGraph,
      tests,
      limitations: [
        "Static test references are discovery hints, never a behavioral coverage claim.",
        "SSR/KaTeX checks verify renderable content; hydrated controls, focus, visual layout, browser history, and GPU rendering require browser evidence.",
        "Finite samples/geometry are illustrations, not universal mathematical proofs.",
        "Source freshness compares recorded observations, not live Drive state.",
        "Learner participants unavailable; no learner mastery or usability claim.",
        "Persistent native fullscreen, screen-reader sessions, and unobserved device/GPU environments are not certified by IAB automation.",
      ],
    };
  } finally {
    try {
      await vite.close();
    } finally {
      await rm(cacheDir, { recursive: true, force: true });
    }
  }
}

async function testCatalog(root, concepts, sceneIds) {
  const files = (await filesIn(root, "tests")).filter((file) =>
    file.endsWith(".test.mjs"),
  );
  return Promise.all(
    files.map(async (file) => {
      const text = await readFile(path.join(root, file), "utf8");
      return {
        file,
        names: [...text.matchAll(/test\(\s*["']([^"']+)["']/g)].map(
          (match) => match[1],
        ),
        inferredLessonReferences: concepts
          .filter(
            (concept) =>
              text.includes(`"${concept.id}"`) ||
              text.includes(`'${concept.id}'`),
          )
          .map((concept) => concept.id),
        inferredSceneReferences: sceneIds.filter(
          (id) => text.includes(`"${id}"`) || text.includes(`'${id}'`),
        ),
        mechanisms: [
          text.includes("renderToStaticMarkup") && "static-react-render",
          text.includes("worker.fetch") && "built-worker-response",
          /buildScene|buildGraph|planarModel|expression\(/.test(text) &&
            "mathematical-or-geometry-model",
          /readFile|readFileSync/.test(text) && "source-or-data-inspection",
        ].filter(Boolean),
        basis: "static-discovery; inspect assertions before claiming coverage",
      };
    }),
  );
}

export function featureCatalog() {
  return [
    {
      id: "course-library",
      entry: "components/atlas/course-library.tsx",
      actions: ["browse", "search", "select-course", "open-lesson"],
    },
    {
      id: "lesson-modes",
      entry: "components/atlas/lesson-workspace.tsx",
      actions: ["learn", "explore", "practice", "revise"],
    },
    {
      id: "lesson-practice",
      entry: "components/atlas/lesson-practice.tsx",
      actions: ["answer", "hint", "solution", "draft", "reload"],
    },
    {
      id: "pilot-practice",
      entry: "components/atlas/pilot-practice.tsx",
      actions: ["choice", "feedback", "retry"],
    },
    {
      id: "experiments",
      entry: "components/atlas/lesson-experiment.tsx",
      actions: ["parameter", "variant", "play", "pause", "reset"],
    },
    {
      id: "comparison-labs",
      entry: "components/atlas/comparison-labs.tsx",
      actions: ["compare", "predict", "parameter", "readout"],
    },
    {
      id: "graph-studio",
      entry: "components/atlas/graph-studio.tsx",
      actions: [
        "surface",
        "parametric",
        "curve",
        "implicit",
        "expression-validation",
        "bounds",
        "plot",
      ],
    },
    {
      id: "viewport",
      entry: "components/atlas/viewport.tsx",
      actions: [
        "orbit",
        "zoom",
        "fullscreen",
        "reset-camera",
        "compatibility",
        "render-failure",
      ],
    },
    {
      id: "workspace",
      entry: "components/atlas/atlas.tsx",
      actions: ["sidebar", "split", "wide", "minimised", "mobile-navigation"],
    },
    {
      id: "history",
      entry: "components/atlas/study-history.ts",
      actions: [
        "share-url",
        "reload",
        "back",
        "forward",
        "invalid-state-fallback",
      ],
    },
    {
      id: "webmcp",
      entry: "components/atlas/webmcp.ts",
      actions: ["discovery", "validation", "abort", "unavailable-fallback"],
    },
    {
      id: "sources",
      entry: "components/atlas/source-references.tsx",
      actions: ["source-pages", "external-link", "access-controlled-reference"],
    },
    {
      id: "progress",
      entry: "components/atlas/study-progress.tsx",
      actions: ["record", "clear", "storage-disabled-fallback"],
    },
  ];
}

export function experienceMap(value) {
  return {
    schemaVersion: value.schemaVersion,
    browserPlan: value.browserPlan,
    application: value.application,
    routes: value.routes,
    lessons: value.lessons.map(
      ({
        id,
        course,
        lecture,
        scene,
        sceneVariants,
        guide,
        inlineExperiments,
        sources,
      }) => ({
        id,
        course,
        unit: lecture,
        scene,
        sceneVariants,
        inlineExperiments,
        sources,
        prerequisites: guide?.prerequisites ?? [],
        blocks: [
          ...(guide?.contentBlocks ?? []),
          ...(guide?.supplementalBlocks ?? []),
        ].map(({ id, kind }) => ({ id, kind })),
        exercises: [
          { id: `${id}:exercise`, kind: "primary" },
          ...(guide?.exercises ?? []).map(({ id, kind }) => ({ id, kind })),
        ],
      }),
    ),
    scenes: value.scenes,
    comparisonLabs: value.comparisonLabs,
    features: value.features,
    tools: value.tools,
    prerequisites: value.prerequisites,
    dependencies: value.dependencies,
    tests: value.tests,
    limitations: value.limitations,
  };
}

export function inventoryIssues(value) {
  const issues = [...value.prerequisites.issues];
  const ids = new Set();
  for (const lesson of value.lessons) {
    if (ids.has(lesson.id)) issues.push(`Duplicate lesson ${lesson.id}`);
    ids.add(lesson.id);
    if (!lesson.guide) issues.push(`Missing guide ${lesson.id}`);
    for (const citation of lesson.sources) {
      const source = value.sources[citation.sourceId];
      if (!source)
        issues.push(`Missing source ${lesson.id}: ${citation.sourceId}`);
      else
        for (const page of citation.pages)
          if (!Number.isInteger(page) || page < 1 || page > source.pages)
            issues.push(
              `Invalid page ${lesson.id}: ${citation.sourceId}:${page}`,
            );
    }
    for (const key of ["contentBlocks", "supplementalBlocks", "exercises"]) {
      const items = lesson.guide?.[key] ?? [];
      if (new Set(items.map((item) => item.id)).size !== items.length)
        issues.push(`Duplicate ${key} ID in ${lesson.id}`);
    }
    for (const key of ["nextStep", "relatedStep"]) {
      const next = lesson.guide?.[key]?.id;
      if (next && !value.lessons.some((item) => item.id === next))
        issues.push(`Missing ${key} ${lesson.id}: ${next}`);
    }
  }
  for (const scene of value.scenes)
    if (
      ![
        scene.parameter.min,
        scene.parameter.max,
        scene.parameter.initial,
        scene.parameter.step,
      ].every(Number.isFinite) ||
      scene.parameter.min >= scene.parameter.max ||
      scene.parameter.initial < scene.parameter.min ||
      scene.parameter.initial > scene.parameter.max
    )
      issues.push(`Invalid scene bounds ${scene.id}`);
  for (const scene of value.scenes)
    if (!scene.formula) issues.push(`Missing scene formula ${scene.id}`);
  for (const dependency of value.dependencies)
    if (!dependency.locked)
      issues.push(`Dependency missing lock entry ${dependency.name}`);
  return issues;
}
