import type { GamFigureSpec } from "@/lib/types/gam";

/**
 * Pack figures are drawn from the spec, never shipped as images.
 *
 * Same rule as Figure Sequences in Module A, for the same reasons: the figure
 * stays inspectable, validated and legible at any size, and no binary asset can
 * drift from the data the questions were validated against.
 */
export function GamFigure({
  spec,
  caption,
}: {
  spec: GamFigureSpec;
  caption: string;
}) {
  return (
    <figure className="space-y-2">
      <div className="border-border bg-card overflow-x-auto rounded-xl border p-4">
        {spec.type === "line-chart" ? (
          <LineChart spec={spec} />
        ) : (
          <Schematic spec={spec} />
        )}
      </div>
      <figcaption className="text-muted-foreground text-xs">
        {caption}
      </figcaption>
    </figure>
  );
}

const W = 520;
const H = 260;
const PAD = { top: 16, right: 16, bottom: 40, left: 52 };

function LineChart({
  spec,
}: {
  spec: Extract<GamFigureSpec, { type: "line-chart" }>;
}) {
  const points = spec.series.flatMap((s) => s.points);
  if (!points.length) return null;
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  // Charts read wrong when the y-axis floats: start at zero unless the data is
  // clustered far from it, where a zero baseline would flatten the whole shape.
  const rawMinY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const minY = rawMinY > 0 && rawMinY / maxY > 0.5 ? rawMinY * 0.9 : 0;

  /**
   * An annotation is only drawable if it says where it goes.
   *
   * The lake-oxygen pack — the one active pack with a chart — carries three
   * annotations that describe the readings in words and pin none of them to a
   * coordinate. Reading `a.at[0]` on those threw, and the error boundary took
   * the whole page: `/module-b/practice/gam-natural-sciences-lake-oxygen-001`
   * showed "This page didn't load", and so did the Module B results screen,
   * which draws every pack's source at once. Prose annotations are read out
   * under the chart instead of being dropped, because in that pack they are
   * where the numbers live.
   */
  const positioned = (spec.annotations ?? []).filter(
    (a): a is { at: [number, number]; label: string } =>
      Array.isArray(a.at) && a.at.length === 2,
  );
  const described = (spec.annotations ?? []).filter(
    (a) => !Array.isArray(a.at),
  );

  const px = (x: number) =>
    PAD.left + ((x - minX) / (maxX - minX || 1)) * (W - PAD.left - PAD.right);
  const py = (y: number) =>
    H -
    PAD.bottom -
    ((y - minY) / (maxY - minY || 1)) * (H - PAD.top - PAD.bottom);

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full min-w-[420px]"
        role="img"
      >
        {/* Axes only — the design separates with hairlines, never with a grid. */}
        <line
          x1={PAD.left}
          y1={PAD.top}
          x2={PAD.left}
          y2={H - PAD.bottom}
          className="stroke-border"
        />
        <line
          x1={PAD.left}
          y1={H - PAD.bottom}
          x2={W - PAD.right}
          y2={H - PAD.bottom}
          className="stroke-border"
        />
        {spec.series.map((s, i) => (
          <polyline
            key={s.id}
            fill="none"
            strokeWidth={2}
            className={
              i === 0 ? "stroke-foreground" : "stroke-muted-foreground"
            }
            strokeDasharray={i === 0 ? undefined : "5 4"}
            points={s.points.map(([x, y]) => `${px(x)},${py(y)}`).join(" ")}
          />
        ))}
        {positioned.map((a, i) => (
          <g key={i}>
            <circle
              cx={px(a.at[0])}
              cy={py(a.at[1])}
              r={3}
              className="fill-foreground"
            />
            <text
              x={px(a.at[0]) + 6}
              y={py(a.at[1]) - 6}
              className="fill-muted-foreground text-[9px]"
            >
              {a.label}
            </text>
          </g>
        ))}
        <text
          x={PAD.left}
          y={H - 10}
          className="fill-muted-foreground text-[10px]"
        >
          {spec.xLabel}
        </text>
        <text
          x={-(H / 2)}
          y={13}
          transform="rotate(-90)"
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          {spec.yLabel}
        </text>
        {spec.series.map((s, i) => (
          <text
            key={s.id}
            x={W - PAD.right}
            y={PAD.top + 10 + i * 13}
            textAnchor="end"
            className="fill-muted-foreground text-[10px]"
          >
            {s.label}
          </text>
        ))}
      </svg>
      {described.length > 0 ? (
        /* Same treatment a schematic gives its annotations, so a reader meets
           one pattern across both figure kinds. */
        <dl className="text-muted-foreground grid gap-1 text-xs sm:grid-cols-2">
          {described.map((a, i) => (
            <div key={i} className="flex gap-2">
              <dt className="text-foreground font-medium">{a.label}</dt>
              {a.detail ? <dd>{a.detail}</dd> : null}
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

function Schematic({
  spec,
}: {
  spec: Extract<GamFigureSpec, { type: "schematic" }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {spec.parts.map((part) => (
          <div
            key={part.id}
            className="border-border min-w-40 flex-1 rounded-md border p-3"
          >
            <p className="text-sm font-medium">{part.label}</p>
            {part.detail ? (
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                {part.detail}
              </p>
            ) : null}
          </div>
        ))}
      </div>
      {(spec.annotations ?? []).length > 0 ? (
        <dl className="text-muted-foreground grid gap-1 text-xs sm:grid-cols-2">
          {(spec.annotations ?? []).map((a, i) => (
            <div key={i} className="flex gap-2">
              <dt className="text-foreground font-medium">{a.label}</dt>
              {a.detail ? <dd>{a.detail}</dd> : null}
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
