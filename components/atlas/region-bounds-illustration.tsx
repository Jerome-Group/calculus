import { Formula } from "./math-text";

export function RegionBoundsIllustration({ lessonId }: { lessonId: string }) {
  if (lessonId === "linearity-additivity") {
    return (
      <aside className="scale-note" aria-label="Split region bounds example">
        <h3>When one fiber needs two intervals</h3>
        <svg
          viewBox="0 0 500 260"
          role="img"
          aria-labelledby="annulus-title annulus-desc"
        >
          <title id="annulus-title">
            Annular region and its vertical fiber
          </title>
          <desc id="annulus-desc">
            Left: the annulus between radii one and two is shaded. At x equals
            zero, the valid y intervals are minus two to minus one and one to
            two. Right: the proposed single bound shades the full disk,
            including the erroneous inner disk.
          </desc>
          <path
            d="M 120 20 A 100 100 0 1 0 120 220 A 100 100 0 1 0 120 20 Z M 120 70 A 50 50 0 1 1 120 170 A 50 50 0 1 1 120 70 Z"
            fill="currentColor"
            fillOpacity="0.25"
            fillRule="evenodd"
            stroke="currentColor"
          />
          <path
            d="M 120 20 V 70 M 120 170 V 220"
            stroke="currentColor"
            strokeWidth="5"
          />
          <path
            d="M 120 70 V 170"
            stroke="currentColor"
            strokeDasharray="5 5"
          />
          <circle
            cx="370"
            cy="120"
            r="100"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
          />
          <circle
            cx="370"
            cy="120"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeDasharray="5 5"
          />
          <text x="75" y="250" fill="currentColor">
            Intended annulus
          </text>
          <text x="320" y="250" fill="currentColor">
            Single bound
          </text>
        </svg>
        <p>
          <Formula>{String.raw`1\le x^2+y^2\le4;\quad x=0:\ y\in[-2,-1]\cup[1,2]`}</Formula>
        </p>
        <p>
          Proposed single bounds:{" "}
          <Formula>{String.raw`-2\le x\le2,\quad-\sqrt{4-x^2}\le y\le\sqrt{4-x^2}`}</Formula>
        </p>
        <p>
          The right panel shades the actual set implied by the single bound −2 ≤
          y ≤ 2 at x=0, extended to the full disk. Its dashed inner disk is an
          erroneous inclusion. Split the vertical fiber at the inner circle. The
          intended annulus has area 3π; the proposed full disk has area 4π,
          including π of unwanted hole.
        </p>
      </aside>
    );
  }
  if (lessonId === "spherical-integration") {
    return (
      <aside
        className="scale-note"
        aria-label="Variable spherical radial bound example"
      >
        <h3>A radius set by direction</h3>
        <svg
          viewBox="0 0 240 220"
          role="img"
          aria-labelledby="sphere-title sphere-desc"
        >
          <title id="sphere-title">Meridian of an offset sphere</title>
          <desc id="sphere-desc">
            The sphere touches the origin. In a meridian plane its section is a
            disk centered half a unit above the origin. At inclination pi over
            four, the ray enters at the origin and leaves at radius cos pi over
            four, which is one over square root two.
          </desc>
          <circle
            cx="90"
            cy="120"
            r="70"
            fill="currentColor"
            fillOpacity="0.25"
            stroke="currentColor"
          />
          <path d="M 90 190 V 35 M 90 190 H 210" stroke="currentColor" />
          <path d="M 90 190 L 160 120" stroke="currentColor" strokeWidth="4" />
          <circle cx="160" cy="120" r="4" fill="currentColor" />
          <text x="165" y="116" fill="currentColor">
            ρ=cos φ
          </text>
          <text x="96" y="185" fill="currentColor">
            φ
          </text>
        </svg>
        <p>
          <Formula>{String.raw`x^2+y^2+z^2=z\iff0\le\rho\le\cos\phi,\quad0\le\phi\le\pi/2`}</Formula>
        </p>
        <p>
          The whole azimuth is 0 ≤ θ ≤ 2π. The radial bound describes the
          domain; the volume Jacobian is separately ρ² sin φ. For density f,
          substitute x, y, z into f before multiplying by that Jacobian.
        </p>
      </aside>
    );
  }
  return null;
}
