"use client";
import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { SVGRenderer } from "three/examples/jsm/renderers/SVGRenderer.js";
import katex from "katex";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { buildScene, buildGraph, builder } from "@/lib/atlas/geometry";
import type { GraphSpec } from "@/lib/atlas/math";
import { RotateCcw, Maximize, Minimize, Move3D } from "lucide-react";
function dispose(g: T.Object3D) {
  g.traverse((o: any) => {
    o.geometry?.dispose();
    const m = Array.isArray(o.material) ? o.material : [o.material];
    for (const a of m) {
      a?.map?.dispose();
      a?.dispose();
    }
  });
}
export function viewportAccessibleLabel(
  scene: string,
  graph?: GraphSpec,
  description?: string,
) {
  const name = description || (graph ? "Graph studio visualization" : scene);
  return `${name}. Sampled 3D illustration. Drag to orbit; arrow keys rotate; plus and minus zoom. Formulas and current values follow the graph.`;
}
export function Viewport({
  scene,
  parameter,
  graph,
  resetKey = 0,
  onStatus,
  description,
  descriptionId,
}: {
  scene: string;
  parameter: number;
  graph?: GraphSpec;
  resetKey?: number;
  onStatus?: (s: string, fingerprint?: string) => void;
  description?: string;
  descriptionId?: string;
}) {
  const host = useRef<HTMLDivElement>(null),
    api = useRef<any>(null);
  const [error, setError] = useState(""),
    [full, setFull] = useState(false),
    [fallback, setFallback] = useState(false),
    [preferCompatibility, setPreferCompatibility] = useState(false);
  const status = useRef(onStatus);
  status.current = onStatus;
  useEffect(() => {
    if (!host.current) return;
    const el = host.current;
    let renderer: any;
    let cpu = false;
    try {
      if (preferCompatibility) throw new Error("Compatibility mode selected");
      renderer = new T.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      setFallback(false);
    } catch {
      renderer = new SVGRenderer();
      renderer.setPrecision(2);
      cpu = true;
      setFallback(true);
    }
    renderer.setPixelRatio?.(Math.min(window.devicePixelRatio, 2));
    if (cpu) renderer.setClearColor(new T.Color(0x073cba));
    else renderer.setClearColor(0x073cba, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      "Interactive 3D mathematical scene. Drag to orbit; use arrow keys to rotate and plus or minus to zoom.",
    );
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("tabindex", "0");
    const contextLost = (event: Event) => {
      event.preventDefault();
      setPreferCompatibility(true);
    };
    if (!cpu)
      renderer.domElement.addEventListener("webglcontextlost", contextLost);
    const world = new T.Scene(),
      camera = new T.PerspectiveCamera(40, 1, 0.01, 10000);
    camera.up.set(0, 0, 1);
    camera.position.set(7, -9, 7);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 0.1;
    controls.maxDistance = 5000;
    world.add(new T.AmbientLight(0xffffff, cpu ? 0.55 : 1.7));
    const light = new T.DirectionalLight(0xcff7ff, cpu ? 0.75 : 2.6);
    light.position.set(3, -4, 8);
    world.add(light);
    const rim = new T.DirectionalLight(0x789cda, cpu ? 0.35 : 1.6);
    rim.position.set(-5, 2, 4);
    world.add(rim);
    const content = new T.Group(),
      axes = new T.Group();
    world.add(content, axes);
    content.userData.lowQuality = cpu;
    let lastScene = "";
    let dirty = true;
    const fit = () => {
      const box = new T.Box3().setFromObject(content);
      if (box.isEmpty())
        box.setFromCenterAndSize(new T.Vector3(), new T.Vector3(4, 4, 4));
      const center = box.getCenter(new T.Vector3());
      const span = Math.max(...box.getSize(new T.Vector3()).toArray(), 2);
      controls.target.copy(center);
      camera.position
        .copy(center)
        .add(
          new T.Vector3(1.5, -1, 1.5).normalize().multiplyScalar(span * 2.1),
        );
      camera.near = Math.max(0.001, span / 1000);
      camera.far = Math.max(1000, span * 100);
      camera.updateProjectionMatrix();
      controls.update();
    };
    const axisLabels: { element: HTMLSpanElement; position: T.Vector3 }[] = [];
    const drawAxes = () => {
      axisLabels.splice(0).forEach(({ element }) => element.remove());
      dispose(axes);
      axes.clear();
      const box = new T.Box3().setFromObject(content);
      const size = box.isEmpty()
        ? 3
        : Math.min(
            1000,
            Math.max(2, ...box.getSize(new T.Vector3()).toArray()) * 0.6,
          );
      const s = Math.ceil(size),
        zs = Math.min(s, Math.max(1, box.max.z + 0.3));
      const { line, arrow } = builder(axes);
      for (let i = -5; i <= 5; i++) {
        const v = (i * s) / 5;
        line(
          [
            [-s, v, 0],
            [s, v, 0],
          ],
          0x3562be,
        );
        line(
          [
            [v, -s, 0],
            [v, s, 0],
          ],
          0x3562be,
        );
      }
      arrow([0, 0, 0], [s, 0, 0], 0xe0edff);
      arrow([0, 0, 0], [0, s, 0], 0xe0edff);
      arrow([0, 0, 0], [0, 0, zs], 0xe0edff);
      for (const [name, pos, color] of [
        ["x", [s + 0.14, 0, 0], "#ffffff"],
        ["y", [0, s + 0.14, 0], "#ffffff"],
        ["z", [0, 0, zs + 0.14], "#ffffff"],
      ] as const) {
        const element = document.createElement("span");
        element.className = "axis-label";
        element.style.color = color;
        element.innerHTML = katex.renderToString(name, {
          throwOnError: true,
          output: "htmlAndMathml",
          trust: false,
        });
        el.appendChild(element);
        axisLabels.push({ element, position: new T.Vector3(...pos) });
      }
    };
    api.current = {
      content,
      fit,
      drawAxes,
      controls,
      camera,
      lastScene,
      markDirty: () => {
        dirty = true;
      },
    };
    controls.addEventListener("change", () => {
      dirty = true;
    });
    const resize = new ResizeObserver(() => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height);
      dirty = true;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    });
    resize.observe(el);
    let frame = 0;
    const render = () => {
      frame = requestAnimationFrame(render);
      controls.update();
      if (dirty) {
        renderer.render(world, camera);
        for (const { element, position } of axisLabels) {
          const q = position.clone().project(camera);
          element.style.left = `${((q.x + 1) * el.clientWidth) / 2}px`;
          element.style.top = `${((1 - q.y) * el.clientHeight) / 2}px`;
          element.hidden = q.z < -1 || q.z > 1;
        }
        dirty = false;
        const done = api.current?.afterFrame;
        if (done) {
          api.current.afterFrame = null;
          done();
        }
      }
    };
    render();
    const key = (e: KeyboardEvent) => {
      const offset = camera.position.clone().sub(controls.target);
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        offset.applyAxisAngle(
          new T.Vector3(0, 0, 1),
          e.key === "ArrowLeft" ? 0.12 : -0.12,
        );
      } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        offset.applyAxisAngle(
          new T.Vector3()
            .crossVectors(offset, new T.Vector3(0, 0, 1))
            .normalize(),
          e.key === "ArrowUp" ? 0.1 : -0.1,
        );
      } else if (e.key === "+" || e.key === "=") offset.multiplyScalar(0.9);
      else if (e.key === "-") offset.multiplyScalar(1.1);
      else return;
      e.preventDefault();
      camera.position.copy(controls.target).add(offset);
      controls.update();
    };
    renderer.domElement.addEventListener("keydown", key);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      dispose(world);
      renderer.dispose?.();
      renderer.domElement.remove();
      axisLabels.forEach(({ element }) => element.remove());
      api.current = null;
    };
  }, [preferCompatibility]);
  useEffect(() => {
    const canvas = host.current?.querySelector("canvas, svg");
    if (descriptionId) canvas?.setAttribute("aria-describedby", descriptionId);
    else canvas?.removeAttribute("aria-describedby");
    canvas?.setAttribute(
      "aria-label",
      viewportAccessibleLabel(scene, graph, description),
    );
  }, [description, descriptionId, scene, graph, preferCompatibility]);

  useEffect(() => {
    const a = api.current;
    if (!a) return;
    dispose(a.content);
    a.content.clear();
    try {
      const report = graph
        ? buildGraph(graph, a.content)
        : buildScene(scene, parameter, a.content);
      setError("");
      a.afterFrame = () =>
        status.current?.(
          report || "Scene rendered",
          graph ? JSON.stringify(graph) : undefined,
        );
      const key = scene + (graph ? JSON.stringify({ ...graph, a: 0 }) : "");
      if (a.lastScene !== key) {
        a.drawAxes();
        a.fit();
        a.lastScene = key;
      }
      a.markDirty();
    } catch (e) {
      setError((e as Error).message);
      status.current?.(
        "Error: " + (e as Error).message,
        graph ? JSON.stringify(graph) : undefined,
      );
    }
  }, [scene, parameter, graph, preferCompatibility]);
  useEffect(() => {
    api.current?.fit();
  }, [resetKey]);
  useEffect(() => {
    const fn = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", fn);
    return () => document.removeEventListener("fullscreenchange", fn);
  }, []);
  return (
    <div className={"viewport-shell" + (full ? " expanded" : "")}>
      <div className="viewport-top">
        <span>
          <Move3D size={15} /> 3D EXPLORATION
          {fallback ? " · COMPATIBILITY MODE" : ""}
        </span>
        <div>
          <button
            type="button"
            aria-pressed={preferCompatibility}
            disabled={fallback && !preferCompatibility}
            onClick={() => setPreferCompatibility((value) => !value)}
            title="Toggle compatibility rendering"
          >
            {preferCompatibility
              ? "Try WebGL"
              : fallback
                ? "Compatibility active"
                : "Use compatibility view"}
          </button>
          <button
            aria-label="Reset camera"
            onClick={() => api.current?.fit()}
            title="Reset camera"
          >
            <RotateCcw size={17} />
          </button>
          <button
            aria-label={full ? "Exit fullscreen" : "Fullscreen visualization"}
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else host.current?.closest(".experience")?.requestFullscreen?.();
            }}
            title="Fullscreen"
          >
            {full ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>
        </div>
      </div>
      <div ref={host} className="canvas-host" />
      {error && (
        <div className="scene-error" role="alert">
          {error}
        </div>
      )}
      <div className="orbit-hint">
        Drag to orbit <span>·</span> Scroll or pinch to zoom <span>·</span>{" "}
        Arrow keys to rotate
      </div>
    </div>
  );
}
