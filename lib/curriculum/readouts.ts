import { decimal as f } from "./planar";
const tex = String.raw;
export function parameterTex(label: string) {
  const symbols: Record<string, string> = {
    θ: "\\theta",
    ε: "\\varepsilon",
    α: "\\alpha",
    φ: "\\varphi",
  };
  let s = label.replace(/[θεαφ]/g, (c) => `$${symbols[c]}$`);
  s = s.replace(/\b([a-zA-Z])\b/g, "$$$1$");
  return s;
}
export function readoutTex(id: string, p: number): string {
  switch (id) {
    case "reviewBox":
      return tex`X=${f(p)},\quad V=${f(384 * p * (1 - p * p))},\quad V_{\max}=256/\sqrt3`;
    case "reviewCritical": {
      const points = [
        [-1, 1, -3],
        [1, 1, -3],
        [0, -1, 2],
        [-1, -1, 1],
        [1, -1, 1],
        [0, 1, -2],
      ];
      const q = points[Math.round(p)];
      return tex`(x,y)=(${q[0]},${q[1]}),\quad f=${q[2]},\quad H=\operatorname{diag}(${12 * q[0] ** 2 - 4},${6 * q[1]})`;
    }
    case "chainNonconstant":
      return tex`\begin{gathered}f_x\,x'=${f(2 * p)},\quad f_y\,y'=${f(4 * p ** 3)}\\\frac{df}{dt}=${f(2 * p + 4 * p ** 3)}\end{gathered}`;
    case "fluxOblique":
      return tex`\mathbf F\cdot\mathbf n=${f(Math.cos(p))},\quad\iint_S\mathbf F\cdot\mathbf n\,dS=0`;

    case "curves":
      return tex`\mathbf r(t)\approx(${f(Math.cos(p))},${f(Math.sin(p))},${f(p)}),\quad\|\mathbf r\prime(t)\|=\sqrt2`;
    case "arc":
      return tex`L(t)=\sqrt2\,t\approx${f(Math.SQRT2 * p)}`;
    case "surface":
      return tex`z=c=${f(p)},\quad r=\sqrt c\approx${f(Math.sqrt(p))}`;
    case "limits":
      return tex`f(r\cos\theta,r\sin\theta)=\cos\theta\sin\theta\approx${f(Math.cos(p) * Math.sin(p))}`;
    case "hiddenpath":
      return tex`f(x,kx^2)=\frac{k}{1+k^2}\approx${f(p / (1 + p * p))}`;
    case "partial":
      return tex`z=x^2+${f(p * p)},\quad f_x(1,b)=2`;
    case "tangent":
      return tex`\frac{|f-L|}{r}=r=${f(p)}`;
    case "taylor":
      return tex`|f-L|=r^2=${f(p * p)},\quad |f-T_2|=0`;
    case "differential":
      return tex`D_uf(0)=\cos^3\theta\approx${f(Math.cos(p) ** 3)},\quad L(u)=\cos\theta\approx${f(Math.cos(p))}`;
    case "extrema":
      return tex`\det H=4a=${f(4 * p)}\quad\text{${p > 0 ? "strict minimum" : p < 0 ? "saddle" : "non-strict minima along x=0"}}`;
    case "gradient":
    case "directional":
      return tex`D_uf(1,1)=2\cos\theta+2\sin\theta\approx${f(2 * Math.cos(p) + 2 * Math.sin(p))}`;
    case "chain":
      return tex`f(\mathbf r(t))=1,\quad\nabla f(\mathbf r(t))\cdot\mathbf r\prime(t)=0`;
    case "lagrange":
      return tex`f=\cos\theta+\sin\theta\approx${f(Math.cos(p) + Math.sin(p))}\in[-\sqrt2,\sqrt2]`;
    case "constraintSphere":
      return tex`f=\sqrt2\sin\theta+\cos\theta\approx${f(Math.SQRT2 * Math.sin(p) + Math.cos(p))},\quad f_{\max,\min}=\pm\sqrt3`;
    case "constraintTwo":
      return tex`f\approx${f(Math.cos(p) + Math.sin(p))},\quad\operatorname{rank}\begin{pmatrix}\nabla g\\\nabla h\end{pmatrix}=2`;
    case "riemann":
      return tex`M_n=\frac{32}3+\frac4{3n^2}\approx${f(32 / 3 + 4 / (3 * Math.round(p) ** 2))}`;
    case "double":
      return tex`x=${f(p)},\quad0\le y\le${f(2 - p)},\quad V=\frac{14}3`;
    case "polar":
      return tex`r=2,\quad A=2\theta\approx${f(2 * p)}`;
    case "triple":
      return tex`A(z)=\pi(2-z)\approx${f(Math.PI * (2 - p))},\quad V=2\pi`;
    case "cylindrical":
      return tex`r\le1,\quad0\le z\le2,\quad V=\theta\approx${f(p)}`;
    case "spherical":
      return tex`V=\frac{16\pi}3(1-\cos\alpha)\approx${f(((16 * Math.PI) / 3) * (1 - Math.cos(p)))}`;
    case "jacobian":
      return tex`|\det DT_s|=1+2s=${f(1 + 2 * p)}`;
    case "lineScalar":
      return tex`\int_0^t(2+\cos s)\,ds=2t+\sin t\approx${f(2 * p + Math.sin(p))}`;
    case "lineintegral":
      return tex`\mathbf F(\mathbf r(t))\cdot\mathbf r\prime(t)=1,\quad W(0,t)=t\approx${f(p)}`;
    case "field":
      return tex`\nabla\cdot\mathbf F=3a=${f(3 * p)},\quad\nabla\times\mathbf F=(0,0,${f(2 * (1 - p))})`;
    case "conservative":
      return tex`\phi(\mathbf r(t))-\phi(0)=t^2+t^4\approx${f(p * p + p ** 4)}`;
    case "green":
      return tex`\int_{C_{[0,t]}}\mathbf F\cdot d\mathbf r=\frac t2\approx${f(p / 2)},\quad\oint_C\mathbf F\cdot d\mathbf r=\pi`;
    case "parametric":
      return tex`\|\mathbf r_u\times\mathbf r_v\|=4\sin u\approx${f(4 * Math.sin(p))}`;
    case "flux":
      return tex`\Phi=16\pi(1-\cos\alpha)\approx${f(16 * Math.PI * (1 - Math.cos(p)))}`;
    case "stokes":
      return tex`h=${f(p)},\quad\oint_C\mathbf F\cdot d\mathbf r=\iint_{S_h}(\nabla\times\mathbf F)\cdot\mathbf n\,dS=\pi`;
    case "divergence":
      return tex`\Phi=4\pi R^3\approx${f(4 * Math.PI * p ** 3)}=3V`;
    case "vectors":
      return tex`\mathbf u\cdot\mathbf v=\cos\theta\approx${f(Math.cos(p))},\quad\|\mathbf u+\mathbf v\|\approx${f(Math.sqrt(2 + 2 * Math.cos(p)))}`;
    case "elementarycurves":
    case "curveCycloid":
      return tex`\mathbf r(t)\approx(${f(p - Math.sin(p))},${f(1 - Math.cos(p))},0),\quad\|\mathbf r\prime(t)\|\approx${f(2 * Math.abs(Math.sin(p / 2)))}`;
    case "curveCircle":
      return tex`\mathbf r(t)\approx(${f(Math.cos(p))},${f(Math.sin(p))},0),\quad\|\mathbf r\prime(t)\|=1`;
    case "curveEllipse":
      return tex`\mathbf r(t)\approx(${f(2 * Math.cos(p))},${f(Math.sin(p))},0),\quad\|\mathbf r\prime(t)\|\approx${f(Math.sqrt(4 * Math.sin(p) ** 2 + Math.cos(p) ** 2))}`;
    case "curveCusp":
      return tex`\mathbf r\prime(t)=(3t^2,2t,0)=(${f(3 * p * p)},${f(2 * p)},0)`;
    case "curveLine":
      return tex`\mathbf r(t)=(${f(p)},0,0),\quad\mathbf r\prime(t)=(1,0,0)`;
    case "topology":
      return Math.abs(p) < 1
        ? tex`|s|=${f(Math.abs(p))}<1,\quad d(p,\partial D)=${f(1 - Math.abs(p))}`
        : tex`|s|=${f(Math.abs(p))}\ge1,\quad p\notin D`;
    case "epsilon":
      return tex`\delta=\sqrt\varepsilon\approx${f(Math.sqrt(p))},\quad0<\|(x,y)\|<\delta\Rightarrow |f(x,y)|<\varepsilon`;
    case "squeeze":
      return tex`|f|\le3r=${f(3 * p)}`;
    case "infinity":
      return tex`r>N\Rightarrow |f|\le\frac1r<\frac1N\approx${f(1 / p)}`;
    case "cross":
      return p < 0
        ? tex`\mathbf b\times\mathbf a=(2,2,-1)`
        : tex`\mathbf a\times\mathbf b=(-2,-2,1)`;
    case "implicit":
      return tex`F_z(p)=2\cos\alpha\approx${f(2 * Math.cos(p))}`;
    case "mixed":
      return tex`f_x(1,b)=2b=${f(2 * p)},\quad f_{xy}(1,b)=2`;
    case "global":
      return tex`\min_D f=0,\quad\max_D f=9,\quad(1,1)\text{ is a saddle}`;
    case "vortex":
      return tex`\nabla\times\mathbf F=0\quad(r>0),\quad\int_{C_{[0,t]}}\mathbf F\cdot d\mathbf r\approx${f(p)}`;
    case "mobius":
      return tex`t=${f(p)},\quad\mathbf n(2\pi)=-\mathbf n(0)`;
    default:
      throw new Error("Missing mathematical readout for " + id);
  }
}
