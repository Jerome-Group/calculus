export function graphObservation({ previousDrawing } = {}) {
  const svg = document.querySelector(".canvas-host svg");
  const status = document.querySelector(".graph-status")?.textContent ?? "";
  if (!svg) return false;
  let representation = "surface";
  try {
    const state = new URL(window.location.href).searchParams.get("graph");
    if (state) representation = JSON.parse(state).graph.mode;
  } catch {
    representation = "surface";
  }
  const statuses = {
    surface:
      /[1-9]\d*\/\d+ sampled points displayed.*[1-9]\d* approximate mesh triangles/,
    parametric:
      /[1-9]\d*\/\d+ parameter samples displayed.*[1-9]\d* approximate mesh triangles/,
    curve: /^[1-9]\d* sampled curve segments.*[1-9]\d* evaluations/,
    implicit:
      /^[1-9]\d* approximate zero-set triangles.*[1-9]\d*\/\d+ finite grid samples/,
  };
  if (!statuses[representation]?.test(status)) return false;
  const geometry = [];
  for (const path of svg.querySelectorAll("path")) {
    const fill = path.style.fill.replaceAll(" ", "").toLowerCase();
    const stroke = path.style.stroke.replaceAll(" ", "").toLowerCase();
    const surface =
      representation === "curve"
        ? ["rgb(155,223,255)", "#9bdfff"].includes(stroke)
        : fill &&
          fill !== "none" &&
          !["rgb(224,237,255)", "#e0edff"].includes(fill);
    if (!surface) continue;
    const d = path.getAttribute("d") ?? "";
    const coordinates = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
    if (
      !/[ML]/i.test(d) ||
      coordinates.length < (representation === "curve" ? 4 : 6) ||
      /NaN|Infinity/.test(d) ||
      !coordinates.every((value) => Number.isFinite(Number(value)))
    )
      return false;
    geometry.push({ d, fill, stroke });
  }
  if (!geometry.length) return false;
  const drawing = JSON.stringify(geometry);
  return drawing !== previousDrawing && drawing;
}
