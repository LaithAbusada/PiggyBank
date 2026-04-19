type Mode = "area" | "line" | "bar";

type Props = {
  income: number[];
  expense: number[];
  labels: string[];
  height?: number;
  mode?: Mode;
};

const EXPENSE_COLOR = "oklch(0.66 0.21 25)";

export default function AreaChart({ income, expense, labels, height = 180, mode = "area" }: Props) {
  const max = Math.max(...income, ...expense, 1);
  const w = 100;
  const n = income.length;
  const step = n > 1 ? w / (n - 1) : w;

  const toPath = (arr: number[], close = false) => {
    const pts = arr.map((v, i) => [i * step, height - (v / max) * (height - 20) - 4] as const);
    if (pts.length === 0) return "";
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      d += ` Q ${cx} ${y0}, ${cx} ${(y0 + y1) / 2} T ${x1} ${y1}`;
    }
    if (close) d += ` L ${w} ${height} L 0 ${height} Z`;
    return d;
  };

  const gridLines = (
    <>
      {[0.25, 0.5, 0.75].map((p) => (
        <line
          key={p}
          x1="0"
          x2={w}
          y1={height * p}
          y2={height * p}
          stroke="var(--line-2)"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </>
  );

  return (
    <div>
      <svg
        viewBox={`0 0 ${w} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height, display: "block" }}
      >
        {mode === "area" && (
          <defs>
            <linearGradient id="incArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="expArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={EXPENSE_COLOR} stopOpacity="0.22" />
              <stop offset="100%" stopColor={EXPENSE_COLOR} stopOpacity="0" />
            </linearGradient>
          </defs>
        )}
        {gridLines}

        {mode === "bar" ? (
          <g>
            {income.map((iv, i) => {
              const ev = expense[i] ?? 0;
              const groupW = w / n;
              const barW = Math.max(0.5, (groupW / 2) * 0.72);
              const gap = (groupW - barW * 2) / 2;
              const xBase = i * groupW + gap;
              const ih = (iv / max) * (height - 20);
              const eh = (ev / max) * (height - 20);
              return (
                <g key={i}>
                  <rect
                    x={xBase}
                    y={height - ih - 4}
                    width={barW}
                    height={ih}
                    rx={barW * 0.25}
                    fill="var(--accent)"
                  />
                  <rect
                    x={xBase + barW}
                    y={height - eh - 4}
                    width={barW}
                    height={eh}
                    rx={barW * 0.25}
                    fill={EXPENSE_COLOR}
                    opacity={0.85}
                  />
                </g>
              );
            })}
          </g>
        ) : (
          <>
            {mode === "area" && (
              <>
                <path d={toPath(income, true)} fill="url(#incArea)" />
                <path d={toPath(expense, true)} fill="url(#expArea)" />
              </>
            )}
            <path
              d={toPath(income)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.8"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={toPath(expense)}
              fill="none"
              stroke={EXPENSE_COLOR}
              strokeWidth="1.8"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--ink-3)", marginTop: 6 }}>
        {labels.map((l, i) => (
          <span key={i}>{l}</span>
        ))}
      </div>
    </div>
  );
}
