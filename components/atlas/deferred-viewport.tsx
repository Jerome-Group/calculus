"use client";
import {
  Component,
  lazy,
  Suspense,
  type ComponentProps,
  type ReactNode,
} from "react";
import type { Viewport as SpatialViewport } from "./viewport";

const SpatialDrawing = lazy(() =>
  import("./viewport").then((module) => ({ default: module.Viewport })),
);

class DrawingBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed)
      return (
        <div className="viewport-loading" role="alert">
          <p>
            The drawing could not load. You can continue reading the
            mathematics.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Reload to retry drawing
          </button>
        </div>
      );
    return this.props.children;
  }
}

export function Viewport(props: ComponentProps<typeof SpatialViewport>) {
  return (
    <DrawingBoundary>
      <Suspense
        fallback={
          <div className="viewport-loading" role="status">
            Preparing the mathematical drawing…
          </div>
        }
      >
        <SpatialDrawing {...props} />
      </Suspense>
    </DrawingBoundary>
  );
}
