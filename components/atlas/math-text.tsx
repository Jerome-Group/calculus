import katex from "katex";
export function Formula({
  children,
  block = false,
}: {
  children: string;
  block?: boolean;
}) {
  return (
    <span
      className={block ? "formula display" : "formula"}
      dangerouslySetInnerHTML={{
        __html: katex.renderToString(children, {
          displayMode: block,
          throwOnError: false,
          strict: "ignore",
          trust: false,
          output: "htmlAndMathml",
        }),
      }}
    />
  );
}
export function MathText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g).map((p, i) =>
        p.startsWith("$$") ? (
          <Formula key={i} block>
            {p.slice(2, -2)}
          </Formula>
        ) : p.startsWith("$") ? (
          <Formula key={i}>{p.slice(1, -1)}</Formula>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
