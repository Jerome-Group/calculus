import type { CourseId } from "@/lib/curriculum";

export type ClinicChoice = {
  id: string;
  text: string;
  correct: boolean;
  title: string;
  explanation: string;
  recovery: string;
};
export type ClinicQuestion = {
  prompt: string;
  choices: readonly ClinicChoice[];
};
type ClinicContent = {
  course: CourseId;
  title: string;
  theme: string;
  situation: string;
  decision: ClinicQuestion;
  argument: readonly { title: string; text: string }[];
  transfer: ClinicQuestion;
};

const cases = {
  "rolle-corner": {
    course: "MH1100",
    title: "Equal endpoints. Missing tangent.",
    theme: "Theorem hypotheses",
    situation: String.raw`Let $f(x)=|x|$ on $[-1,1]$. The graph is continuous and $f(-1)=f(1)=1$.`,
    decision: {
      prompt: String.raw`Does Rolle's theorem guarantee a $c\in(-1,1)$ with $f'(c)=0$?`,
      choices: [
        {
          id: "endpoints-suffice",
          text: "Yes. The endpoint values agree.",
          correct: false,
          title: "An endpoint check is only one hypothesis",
          explanation: String.raw`Equal endpoint values and continuity do not replace differentiability throughout $(-1,1)$. The corner at $0$ is the obstruction.`,
          recovery: "rolle-mean-value",
        },
        {
          id: "corner-breaks-hypothesis",
          text: "No. Differentiability fails at the corner.",
          correct: true,
          title: "You checked the interior hypothesis",
          explanation: String.raw`Rolle's theorem requires differentiability at every interior point. Here $f'(0)$ does not exist, and no other interior derivative is zero.`,
          recovery: "differentiability-corners",
        },
        {
          id: "corner-slope-zero",
          text: "Yes. The minimum at zero has derivative zero.",
          correct: false,
          title: "A minimum need not have a derivative",
          explanation: String.raw`Fermat's stationary-point conclusion requires differentiability. The one-sided slopes at this minimum are $-1$ and $1$.`,
          recovery: "differentiability-corners",
        },
      ],
    },
    argument: [
      {
        title: "Name every assumption",
        text: String.raw`Rolle requires continuity on $[a,b]$, differentiability on $(a,b)$ and $f(a)=f(b)$. Only the differentiability assumption fails here.`,
      },
      {
        title: "Calculate the slopes",
        text: String.raw`For $x<0$, $f'(x)=-1$. For $x>0$, $f'(x)=1$. At $0$, the difference quotient is $|h|/h$, with one-sided limits $-1$ and $1$. Thus $f'(0)$ does not exist and there is no $c$ with $f'(c)=0$.`,
      },
    ],
    transfer: {
      prompt: String.raw`Replace $f$ with $g(x)=x^2$ on $[-1,1]$. Which conclusion is justified?`,
      choices: [
        {
          id: "smooth-rolle",
          text: String.raw`Rolle applies, and $c=0$ works.`,
          correct: true,
          title: "All three hypotheses now hold",
          explanation: String.raw`The polynomial is continuous and differentiable, $g(-1)=g(1)=1$, and $g'(x)=2x$, so $g'(0)=0$.`,
          recovery: "rolle-mean-value",
        },
        {
          id: "minimum-forbids",
          text: "A minimum prevents Rolle from applying.",
          correct: false,
          title: "A smooth minimum is compatible with Rolle",
          explanation: String.raw`The obstruction in the original case was the corner. This polynomial has derivative $2x$ everywhere, including zero.`,
          recovery: "differentiability-corners",
        },
        {
          id: "endpoint-derivative",
          text: String.raw`Only $c=1$ works.`,
          correct: false,
          title: "The point must lie in the open interval",
          explanation: String.raw`Rolle's conclusion asks for $c\in(-1,1)$. Also $g'(1)=2$, whereas $g'(0)=0$.`,
          recovery: "rolle-mean-value",
        },
      ],
    },
  },
  "chain-composition": {
    course: "MH1100",
    title: "The derivative inside the derivative",
    theme: "Composition",
    situation: String.raw`A model gives $f(x)=\sin(x^2)$. You need its rate of change with respect to $x$.`,
    decision: {
      prompt: String.raw`Which expression is $f'(x)$?`,
      choices: [
        {
          id: "outer-only",
          text: String.raw`$\cos(x^2)$`,
          correct: false,
          title: "The inner rate is missing",
          explanation: String.raw`Differentiating sine gives $\cos(x^2)$, but its input $x^2$ also changes. Multiply by $2x$.`,
          recovery: "chain-rule-single",
        },
        {
          id: "separate-arguments",
          text: String.raw`$2x\cos x$`,
          correct: false,
          title: "Keep the original inner input",
          explanation: String.raw`The outer derivative is evaluated at $x^2$, so its cosine factor is $\cos(x^2)$, not $\cos x$.`,
          recovery: "chain-rule-single",
        },
        {
          id: "outer-times-inner",
          text: String.raw`$2x\cos(x^2)$`,
          correct: true,
          title: "Both rates are present",
          explanation: String.raw`For $u(x)=x^2$ and $v(u)=\sin u$, the derivative is $v'(u(x))u'(x)=\cos(x^2)\,2x$.`,
          recovery: "chain-rule-single",
        },
      ],
    },
    argument: [
      {
        title: "Separate the maps",
        text: String.raw`The inner map is $u(x)=x^2$ with $u'(x)=2x$. The outer map is $v(u)=\sin u$ with $v'(u)=\cos u$. Both are differentiable on all of $\mathbb R$.`,
      },
      {
        title: "Compose the derivatives",
        text: String.raw`The chain rule gives $(v\circ u)'(x)=v'(u(x))u'(x)=2x\cos(x^2)$. For example, at $x=0$ the derivative is $0$, which the outer-only answer would incorrectly make $1$.`,
      },
    ],
    transfer: {
      prompt: String.raw`What is the derivative of $h(x)=e^{3x}$?`,
      choices: [
        {
          id: "exp-outer-only",
          text: String.raw`$e^{3x}$`,
          correct: false,
          title: "The exponent has a rate too",
          explanation: String.raw`The derivative of the exponent $3x$ is $3$. The chain rule multiplies $e^{3x}$ by that factor.`,
          recovery: "chain-rule-single",
        },
        {
          id: "exp-chain",
          text: String.raw`$3e^{3x}$`,
          correct: true,
          title: "The inner factor transfers",
          explanation: String.raw`With $u=3x$, $d(e^u)/du=e^u$ and $du/dx=3$, so $h'(x)=3e^{3x}$.`,
          recovery: "chain-rule-single",
        },
        {
          id: "exp-argument-lost",
          text: String.raw`$3e^x$`,
          correct: false,
          title: "Evaluation at the inner map still matters",
          explanation: String.raw`The exponential factor keeps its input $3x$. Differentiating the input contributes a multiplier, not a replacement input.`,
          recovery: "chain-rule-single",
        },
      ],
    },
  },
  "lhopital-nonconverse": {
    course: "MH1100",
    title: "When a rule falls silent",
    theme: "Limits and sufficient conditions",
    situation: String.raw`As $x\to0$, consider $\dfrac{x^2\sin(1/x)}{x}$. Differentiating numerator and denominator gives $2x\sin(1/x)-\cos(1/x)$, which has no limit.`,
    decision: {
      prompt: "What follows about the original limit?",
      choices: [
        {
          id: "derivative-divergence",
          text: "The original limit cannot exist.",
          correct: false,
          title: "A sufficient rule has no converse here",
          explanation: String.raw`Failure of the derivative quotient to converge makes L'Hôpital inconclusive. It does not decide the original quotient.`,
          recovery: "lhopital",
        },
        {
          id: "squeeze-original",
          text: String.raw`The original limit is $0$, by squeezing.`,
          correct: true,
          title: "The original expression gives a stronger route",
          explanation: String.raw`For $x\ne0$ the quotient equals $x\sin(1/x)$, whose absolute value is at most $|x|$.`,
          recovery: "limit-laws-squeeze",
        },
        {
          id: "oscillation-alone",
          text: "The sine oscillation forces the original quotient to oscillate without a limit.",
          correct: false,
          title: "A shrinking factor can control oscillation",
          explanation: String.raw`The oscillation is multiplied by $x$. The bound $|x\sin(1/x)|\le |x|$ tends to zero.`,
          recovery: "limit-laws-squeeze",
        },
      ],
    },
    argument: [
      {
        title: "Work on the punctured domain",
        text: String.raw`For $x\ne0$, $x^2\sin(1/x)/x=x\sin(1/x)$. Since $-|x|\le x\sin(1/x)\le |x|$, both outer limits are zero and the squeeze theorem gives limit $0$.`,
      },
      {
        title: "Check what L'Hôpital did not say",
        text: String.raw`Take $x_n=1/(2\pi n)$ and $y_n=1/((2n+1)\pi)$. The derivative quotient is $-1$ at every $x_n$ and $1$ at every $y_n$. It has no limit. L'Hôpital's limit hypothesis fails, so this route gives no conclusion about the original limit.`,
      },
    ],
    transfer: {
      prompt: String.raw`For $\lim_{x\to0}\sin x/x$, does L'Hôpital apply?`,
      choices: [
        {
          id: "sine-rule-valid",
          text: String.raw`Yes. The derivative quotient tends to $1$.`,
          correct: true,
          title: "This time the rule's hypotheses hold",
          explanation: String.raw`Both functions tend to zero, are differentiable near zero, the denominator derivative is $1$, and $\cos x/1\to1$. Thus the original limit is $1$.`,
          recovery: "lhopital",
        },
        {
          id: "zero-denominator-forbids",
          text: "No. A zero denominator limit always forbids the rule.",
          correct: false,
          title: "Zero over zero is an eligible form",
          explanation: String.raw`The rule requires a nonzero denominator derivative on a punctured neighborhood, not a nonzero denominator limit. Here that derivative is $1$.`,
          recovery: "lhopital",
        },
        {
          id: "quotient-derivative",
          text: String.raw`Yes, by differentiating the entire quotient.`,
          correct: false,
          title: "L'Hôpital uses a quotient of derivatives",
          explanation: String.raw`It compares $f/g$ with $f'/g'$. It does not replace a function limit with the limit of $(f/g)'$.`,
          recovery: "lhopital",
        },
      ],
    },
  },
  "improper-cancellation": {
    course: "MH1101",
    title: "Cancellation across a singularity",
    theme: "Improper integrals",
    situation: String.raw`Someone uses the oddness of $1/x$ to claim $\int_{-1}^{1} dx/x=0$. The integrand is undefined at $0$.`,
    decision: {
      prompt: "Does the ordinary improper integral converge to zero?",
      choices: [
        {
          id: "odd-cancellation",
          text: "Yes. Opposite signed areas cancel.",
          correct: false,
          title: "The two improper limits must exist separately",
          explanation: String.raw`Oddness only gives symmetric cancellation. The ordinary definition splits at $0$ and requires each one-sided integral to converge to a finite value.`,
          recovery: "improper-integrals",
        },
        {
          id: "log-endpoints",
          text: String.raw`Yes. $\log|1|-\log|-1|=0$.`,
          correct: false,
          title: "An antiderivative cannot cross the singularity",
          explanation: String.raw`The fundamental theorem cannot be used on an interval where the integrand is undefined. Split at zero before taking limits.`,
          recovery: "improper-integrals",
        },
        {
          id: "separate-divergence",
          text: "No. Each side diverges, despite principal value zero.",
          correct: true,
          title: "You distinguished two notions of integral",
          explanation: String.raw`The left integral tends to $-\infty$ and the right to $+\infty$. Their ordinary sum is undefined. The symmetric Cauchy principal value is zero.`,
          recovery: "improper-integrals",
        },
      ],
    },
    argument: [
      {
        title: "Split at the problem point",
        text: String.raw`For $a<0<b$, $\int_{-1}^{a} dx/x=\log|a|\to-\infty$ as $a\to0^-$, while $\int_b^1 dx/x=-\log b\to+\infty$ as $b\to0^+$. Neither side converges to a finite number.`,
      },
      {
        title: "Identify the different limit",
        text: String.raw`For $\varepsilon>0$, $\int_{-1}^{-\varepsilon}dx/x+\int_{\varepsilon}^1dx/x=\log\varepsilon-\log\varepsilon=0$. Sending the same $\varepsilon$ to zero defines a principal value. It does not establish ordinary convergence.`,
      },
    ],
    transfer: {
      prompt: String.raw`What happens to $\int_0^1 x^{-1/2}\,dx$?`,
      choices: [
        {
          id: "unbounded-forbids",
          text: "It diverges because the integrand is unbounded.",
          correct: false,
          title: "Unboundedness calls for a limit",
          explanation: String.raw`An unbounded integrand can still have a finite improper integral. Evaluate from $\varepsilon$ to $1$, then take $\varepsilon\to0^+$.`,
          recovery: "improper-integrals",
        },
        {
          id: "root-converges",
          text: String.raw`It converges to $2$.`,
          correct: true,
          title: "The one-sided limit is finite",
          explanation: String.raw`$\int_\varepsilon^1x^{-1/2}\,dx=[2\sqrt{x}]_\varepsilon^1=2-2\sqrt\varepsilon\to2$.`,
          recovery: "improper-integrals",
        },
        {
          id: "root-principal-only",
          text: "Only a symmetric principal value exists.",
          correct: false,
          title: "No cancellation is needed",
          explanation: String.raw`There is one singular endpoint and a finite one-sided limit, $2$. This is ordinary improper convergence.`,
          recovery: "improper-integrals",
        },
      ],
    },
  },
  "conditional-rearrangement": {
    course: "MH1101",
    title: "Convergent does not mean reorderable",
    theme: "Absolute convergence",
    situation: String.raw`Consider $\sum_{n=1}^{\infty}(-1)^{n+1}/n$. You want to rearrange its terms without changing its sum.`,
    decision: {
      prompt: "Does convergence alone justify arbitrary rearrangement?",
      choices: [
        {
          id: "conditional-warning",
          text: "No. This series is conditionally convergent.",
          correct: true,
          title: "You checked the absolute series",
          explanation: String.raw`The alternating series converges, but $\sum 1/n$ diverges. The guarantee that every rearrangement has the same sum requires absolute convergence.`,
          recovery: "absolute-conditional-alternating",
        },
        {
          id: "convergence-enough",
          text: "Yes. Every convergent series permits arbitrary rearrangement.",
          correct: false,
          title: "Order matters for conditional convergence",
          explanation: String.raw`The alternating harmonic series converges without converging absolutely. Arbitrary rearrangements need not preserve its sum.`,
          recovery: "absolute-conditional-alternating",
        },
        {
          id: "signs-diverge",
          text: "No, because alternating signs make this series divergent.",
          correct: false,
          title: "Alternation can establish convergence",
          explanation: String.raw`The positive magnitudes $1/n$ decrease to zero, so the alternating series test applies. It is the absolute series that diverges.`,
          recovery: "absolute-conditional-alternating",
        },
      ],
    },
    argument: [
      {
        title: "Establish ordinary convergence",
        text: String.raw`The sequence $b_n=1/n$ is positive, decreases and tends to zero. The alternating series test therefore proves $\sum(-1)^{n+1}b_n$ converges.`,
      },
      {
        title: "Test the stronger property",
        text: String.raw`The absolute series is $\sum1/n$. In the block $n=2^{k-1}+1,\ldots,2^k$, its $2^{k-1}$ terms are each at least $1/2^k$, so each block contributes at least $1/2$. It diverges. Thus the original series is conditional, and the arbitrary-rearrangement guarantee does not apply.`,
      },
    ],
    transfer: {
      prompt: String.raw`May every rearrangement of $\sum_{n=1}^{\infty}1/n^2$ keep the same sum?`,
      choices: [
        {
          id: "infinite-order-forbids",
          text: "No infinite series can be rearranged safely.",
          correct: false,
          title: "Absolute convergence supplies the guarantee",
          explanation: String.raw`The $p$-series $\sum1/n^2$ converges and all terms are nonnegative, so its absolute series is the same convergent series.`,
          recovery: "absolute-conditional-alternating",
        },
        {
          id: "terms-zero-enough",
          text: "Yes, solely because its terms tend to zero.",
          correct: false,
          title: "The term test is not a convergence proof",
          explanation: String.raw`Terms tending to zero are necessary, but the harmonic series shows they are not sufficient. Here the $p$-series test gives absolute convergence.`,
          recovery: "absolute-conditional-alternating",
        },
        {
          id: "absolute-preserves",
          text: "Yes. It converges absolutely.",
          correct: true,
          title: "The stronger hypothesis is available",
          explanation: String.raw`Since $p=2>1$, $\sum|1/n^2|$ converges. The absolute-convergence rearrangement theorem preserves its sum under every rearrangement.`,
          recovery: "absolute-conditional-alternating",
        },
      ],
    },
  },
  "power-series-boundary": {
    course: "MH1101",
    title: "The radius leaves two questions",
    theme: "Power-series endpoints",
    situation: String.raw`For $|x|<1$, $\log(1+x)=\sum_{n=1}^{\infty}(-1)^{n+1}x^n/n$. The radius of convergence is $1$.`,
    decision: {
      prompt: "Which endpoint conclusion is correct?",
      choices: [
        {
          id: "radius-includes-both",
          text: String.raw`Both $x=-1$ and $x=1$ converge.`,
          correct: false,
          title: "The radius does not settle the boundary",
          explanation: String.raw`At $x=-1$ every term is $-1/n$, so that endpoint diverges. Each endpoint needs its own test.`,
          recovery: "power-series-radius",
        },
        {
          id: "separate-endpoints",
          text: String.raw`At $1$ it converges to $\log2$; at $-1$ it diverges.`,
          correct: true,
          title: "You tested both boundary series",
          explanation: String.raw`At $1$ the alternating harmonic series converges. At $-1$ the negative harmonic series diverges to $-\infty$. The endpoint value at $1$ is $\log2$.`,
          recovery: "power-series-radius",
        },
        {
          id: "radius-excludes-both",
          text: "Both endpoints diverge because they lie outside the open interval.",
          correct: false,
          title: "Outside and on the boundary differ",
          explanation: String.raw`A radius of $1$ guarantees convergence for $|x|<1$ and divergence for $|x|>1$. It leaves $|x|=1$ undecided.`,
          recovery: "power-series-radius",
        },
      ],
    },
    argument: [
      {
        title: "Substitute into the series",
        text: String.raw`At $x=1$, the alternating series test gives convergence of $\sum(-1)^{n+1}/n$. At $x=-1$, the terms are $-1/n$ and the partial sums tend to $-\infty$.`,
      },
      {
        title: "Identify the finite endpoint value",
        text: String.raw`The finite geometric identity gives $\sum_{n=1}^N(-1)^{n+1}/n=\int_0^1\sum_{k=0}^{N-1}(-t)^k\,dt=\log2-\int_0^1(-t)^N/(1+t)\,dt$. The last integral has absolute value at most $1/(N+1)$, so the sum tends to $\log2$.`,
      },
    ],
    transfer: {
      prompt: String.raw`Termwise differentiation gives $\sum_{n=1}^{\infty}(-1)^{n+1}x^{n-1}=1/(1+x)$ for $|x|<1$. What happens at $x=1$?`,
      choices: [
        {
          id: "derivative-boundary-diverges",
          text: "The differentiated series diverges because its terms do not tend to zero.",
          correct: true,
          title: "Differentiation need not preserve endpoint convergence",
          explanation: String.raw`At $1$ its terms are $1,-1,1,-1,\ldots$, which do not tend to zero. The identity on $(-1,1)$ does not include that endpoint.`,
          recovery: "power-series-operations",
        },
        {
          id: "derivative-endpoint-half",
          text: String.raw`It converges to $1/2$ by substitution.`,
          correct: false,
          title: "An interior identity has a domain",
          explanation: String.raw`Although $1/(1+1)=1/2$, the series terms at $1$ fail the necessary term test. Substitution beyond the proved interval is invalid.`,
          recovery: "power-series-operations",
        },
        {
          id: "endpoint-inherited",
          text: "It converges because the original series converges there.",
          correct: false,
          title: "The radius survives, the endpoints need new tests",
          explanation: String.raw`Termwise differentiation keeps the radius of convergence. It can change endpoint behavior, as the nonvanishing terms show here.`,
          recovery: "power-series-operations",
        },
      ],
    },
  },
  "partials-without-plane": {
    course: "MH2100",
    title: "Two slices do not make a plane",
    theme: "Total differentiability",
    situation: String.raw`Set $f(x,y)=xy/\sqrt{x^2+y^2}$ away from $(0,0)$ and $f(0,0)=0$. Both coordinate partial derivatives at the origin are zero.`,
    decision: {
      prompt: "Is this function differentiable at the origin?",
      choices: [
        {
          id: "partials-suffice",
          text: "Yes. Both partial derivatives exist.",
          correct: false,
          title: "Partial derivatives test only coordinate directions",
          explanation: String.raw`Differentiability requires one linear approximation with error $o(\sqrt{x^2+y^2})$ on all approaches. The diagonal disproves that requirement.`,
          recovery: "total-differentiability",
        },
        {
          id: "continuity-suffices",
          text: "Yes. Continuity and zero partials are enough.",
          correct: false,
          title: "Continuity does not control the normalized error",
          explanation: String.raw`The function is continuous, but its error relative to distance stays nonzero along $x=y>0$.`,
          recovery: "total-differentiability",
        },
        {
          id: "diagonal-obstruction",
          text: "No. Its normalized remainder stays nonzero on the diagonal.",
          correct: true,
          title: "You tested the full approximation",
          explanation: String.raw`The only candidate derivative is zero. Along $(t,t)$ with $t>0$, $f(t,t)/\sqrt{2t^2}=1/2$.`,
          recovery: "total-differentiability",
        },
      ],
    },
    argument: [
      {
        title: "Check continuity and candidate derivative",
        text: String.raw`Write $r=\sqrt{x^2+y^2}$. Since $2|xy|\le x^2+y^2$, $|f(x,y)|\le r/2\to0$. Also $f(h,0)=f(0,h)=0$, so both partials are zero. Any derivative must therefore be the zero linear map.`,
      },
      {
        title: "Divide the remainder by distance",
        text: String.raw`For $t>0$, $f(t,t)=t/\sqrt2$ and $\|(t,t)\|=\sqrt2t$. Hence $[f(t,t)-f(0,0)-0]/\|(t,t)\|=1/2$, not zero. The required remainder limit fails.`,
      },
    ],
    transfer: {
      prompt:
        "Which stronger condition is sufficient for differentiability at a point?",
      choices: [
        {
          id: "continuous-partials-nearby",
          text: "Both partials exist on a neighborhood and are continuous at the point.",
          correct: true,
          title: "A sufficient neighborhood condition",
          explanation:
            "Continuous partial derivatives at the point, defined throughout a neighborhood, imply differentiability there. This is sufficient, though not necessary.",
          recovery: "total-differentiability",
        },
        {
          id: "point-partials-only",
          text: "Both partials exist only at the point.",
          correct: false,
          title: "The original example already has that property",
          explanation:
            "Existence at a single point controls only two slices. It does not give a uniform linear approximation.",
          recovery: "total-differentiability",
        },
        {
          id: "continuous-function-only",
          text: "The function is continuous at the point.",
          correct: false,
          title: "Continuity has a weaker error scale",
          explanation: String.raw`Continuity asks for error tending to zero. Differentiability asks for error divided by distance tending to zero.`,
          recovery: "total-differentiability",
        },
      ],
    },
  },
  "curl-domain-hole": {
    course: "MH2100",
    title: "A curl-free field around a hole",
    theme: "Local and global conditions",
    situation: String.raw`On $D=\mathbb R^2\setminus\{(0,0)\}$, let $F=(P,Q)=(-y/(x^2+y^2),\,x/(x^2+y^2))$. Its scalar curl $Q_x-P_y$ is zero.`,
    decision: {
      prompt: String.raw`Does $F$ have a single-valued potential on all of $D$?`,
      choices: [
        {
          id: "curl-global",
          text: "Yes. Zero curl always gives a global potential.",
          correct: false,
          title: "The domain hypothesis is missing",
          explanation: String.raw`Zero curl is a local test. On this punctured domain, a loop can wind around the missing origin and have nonzero circulation.`,
          recovery: "conservative-domains",
        },
        {
          id: "circle-obstruction",
          text: String.raw`No. The unit-circle circulation is $2\pi$.`,
          correct: true,
          title: "A closed loop detects the obstruction",
          explanation: String.raw`A gradient field has zero integral around every closed curve. This field has circulation $2\pi$ counterclockwise around the origin.`,
          recovery: "fundamental-line-theorem",
        },
        {
          id: "undefined-everywhere",
          text: "No. The field is not differentiable anywhere.",
          correct: false,
          title: "The field is smooth on its stated domain",
          explanation: String.raw`Its rational components are smooth wherever $x^2+y^2>0$. The obstruction is global topology, not a local derivative failure in $D$.`,
          recovery: "conservative-domains",
        },
      ],
    },
    argument: [
      {
        title: "Check the local test",
        text: String.raw`On $D$, $Q_x=(y^2-x^2)/(x^2+y^2)^2=P_y$. Thus $Q_x-P_y=0$. The missing origin prevents applying the simply connected domain criterion to all of $D$.`,
      },
      {
        title: "Integrate around the hole",
        text: String.raw`For $r(t)=(\cos t,\sin t)$, $0\le t\le2\pi$, $F(r(t))=(-\sin t,\cos t)=r'(t)$. Therefore $\oint F\cdot dr=\int_0^{2\pi}1\,dt=2\pi$. A potential would force this to be zero, a contradiction.`,
      },
    ],
    transfer: {
      prompt: String.raw`Restrict $F$ to the right half-plane $x>0$. Which statement holds?`,
      choices: [
        {
          id: "hole-remains",
          text: "No potential exists because the original domain had a hole.",
          correct: false,
          title: "A restriction can remove the obstruction",
          explanation: String.raw`The right half-plane is convex and excludes loops winding around the origin. A single branch of angle works there.`,
          recovery: "conservative-domains",
        },
        {
          id: "angle-swapped",
          text: String.raw`$\phi(x,y)=\arctan(x/y)$ is a potential everywhere on $x>0$.`,
          correct: false,
          title: "Check the formula's domain and gradient",
          explanation: String.raw`This expression is undefined at $y=0$ and gives the wrong signs where defined. The branch $\arctan(y/x)$ works for every $x>0$.`,
          recovery: "fundamental-line-theorem",
        },
        {
          id: "right-angle-potential",
          text: String.raw`$\phi(x,y)=\arctan(y/x)$ is a potential.`,
          correct: true,
          title: "A global angle branch now exists",
          explanation: String.raw`For $x>0$, $\phi_x=-y/(x^2+y^2)$ and $\phi_y=x/(x^2+y^2)$, so $\nabla\phi=F$.`,
          recovery: "conservative-domains",
        },
      ],
    },
  },
  "hemisphere-flux": {
    course: "MH2100",
    title: "Close the surface before Gauss",
    theme: "Flux and orientation",
    situation: String.raw`Let $F(x,y,z)=(x,y,z)$ and let $S$ be the upper unit hemisphere $x^2+y^2+z^2=1$, $z\ge0$, oriented outward from the half-ball.`,
    decision: {
      prompt: String.raw`What is the outward flux $\iint_S F\cdot n\,dS$?`,
      choices: [
        {
          id: "halfball-flux",
          text: String.raw`$2\pi$, after closing with the bottom disk.`,
          correct: true,
          title: "The added boundary contributes zero",
          explanation: String.raw`The divergence is $3$. Close the hemisphere with its disk at $z=0$; the disk has zero flux. The half-ball volume is $2\pi/3$.`,
          recovery: "divergence-theorem",
        },
        {
          id: "whole-ball",
          text: String.raw`$4\pi$, using the unit-ball volume.`,
          correct: false,
          title: "The enclosed region is only half the ball",
          explanation: String.raw`After adding the bottom disk, the closed surface encloses volume $2\pi/3$, not $4\pi/3$. Multiply the half-ball volume by divergence $3$.`,
          recovery: "divergence-theorem",
        },
        {
          id: "curl-zero-flux",
          text: String.raw`$0$, because $F$ has zero curl.`,
          correct: false,
          title: "Flux is governed by divergence",
          explanation: String.raw`Curl controls circulation in Stokes' theorem. This flux uses divergence, $\nabla\cdot F=3$, with an outward closed boundary.`,
          recovery: "flux-through-surfaces",
        },
      ],
    },
    argument: [
      {
        title: "Close and orient the boundary",
        text: String.raw`Let $V$ be the upper unit half-ball. Its boundary is $S$ together with the disk $B$ at $z=0$, whose outward normal is $(0,0,-1)$. There $F\cdot n=-z=0$. The polynomial field is $C^1$ on a neighborhood of $V$.`,
      },
      {
        title: "Use divergence on the closed surface",
        text: String.raw`The divergence theorem gives $\iint_S F\cdot n\,dS+\iint_BF\cdot n\,dS=\iiint_V3\,dV=3(\tfrac12\cdot\tfrac{4\pi}{3})=2\pi$. The disk integral vanishes, so the hemisphere flux is $2\pi$.`,
      },
    ],
    transfer: {
      prompt:
        "Keep the same hemisphere and field, but reverse the normal. What is the flux?",
      choices: [
        {
          id: "orientation-unchanged",
          text: String.raw`$2\pi$`,
          correct: false,
          title: "Flux is signed by the normal",
          explanation: String.raw`Changing $n$ to $-n$ changes $F\cdot n$ to its negative at every point.`,
          recovery: "flux-through-surfaces",
        },
        {
          id: "orientation-reversed",
          text: String.raw`$-2\pi$`,
          correct: true,
          title: "The orientation changes the sign",
          explanation: String.raw`Linearity gives $\iint_S F\cdot(-n)\,dS=-\iint_SF\cdot n\,dS=-2\pi$.`,
          recovery: "flux-through-surfaces",
        },
        {
          id: "orientation-cancels",
          text: String.raw`$0$`,
          correct: false,
          title: "Reversing does not average orientations",
          explanation:
            "The reversed surface has one consistent opposite normal. Its integral is the negative of the original, not a cancellation of both orientations.",
          recovery: "flux-through-surfaces",
        },
      ],
    },
  },
} satisfies Record<string, ClinicContent>;

export type ClinicCaseId = keyof typeof cases;
export function isClinicCaseId(value: string): value is ClinicCaseId {
  return Object.hasOwn(cases, value);
}
export function clinicCase(id: ClinicCaseId) {
  return { id, ...cases[id] };
}
export type ClinicCase = ReturnType<typeof clinicCase>;

export const clinicCaseIds = Object.keys(cases).filter(isClinicCaseId);
