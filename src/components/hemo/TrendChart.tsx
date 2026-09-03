import { useMemo } from "react";
import { forecast, fmtDate, type Reading } from "@/lib/hemo";

type Props = {
  readings: Reading[];
  low: number;
  high: number;
};

const W = 560;
const H = 170;
const PAD_L = 38;
const PAD_R = 16;
const PAD_T = 14;
const PAD_B = 26;

export function TrendChart({ readings, low, high }: Props) {
  const model = useMemo(() => {
    if (readings.length < 2) return null;

    const f2 = forecast(readings, 2);
    const f4 = forecast(readings, 4);

    const values = [...readings.map((r) => r.hb), f4, low, high];
    const minV = Math.floor(Math.min(...values) - 0.6);
    const maxV = Math.ceil(Math.max(...values) + 0.6);

    // x axis spans measured window plus a 4-week forecast tail
    const t0 = new Date(readings[0]!.date).getTime();
    const tLast = new Date(readings[readings.length - 1]!.date).getTime();
    const span = tLast - t0 || 1;
    const tEnd = tLast + 28 * 86_400_000;
    const totalSpan = tEnd - t0;

    const x = (t: number) => PAD_L + ((t - t0) / totalSpan) * (W - PAD_L - PAD_R);
    const y = (v: number) =>
      PAD_T + (1 - (v - minV) / (maxV - minV)) * (H - PAD_T - PAD_B);

    const pts = readings.map((r) => ({
      x: x(new Date(r.date).getTime()),
      y: y(r.hb),
      r,
    }));

    const fc = [
      { x: x(tLast), y: y(readings[readings.length - 1]!.hb) },
      { x: x(tLast + 14 * 86_400_000), y: y(f2) },
      { x: x(tEnd), y: y(f4) },
    ];

    return {
      pts,
      fc,
      f4,
      yLow: y(low),
      yHigh: y(high),
      xNow: x(tLast),
      span,
      line: pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
      fcLine: fc.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "),
    };
  }, [readings, low, high]);

  if (!model) {
    return (
      <div className="grid h-[170px] place-items-center rounded-2xl bg-chip text-sm text-sub">
        Log at least two readings to see your trend.
      </div>
    );
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-[170px] w-full"
      role="img"
      aria-label={`Haemoglobin trend across ${readings.length} readings with a four week forecast of ${model.f4.toFixed(1)} grams per decilitre`}
    >
      {/* healthy band */}
      <rect
        x={PAD_L}
        y={model.yHigh}
        width={W - PAD_L - PAD_R}
        height={Math.max(0, model.yLow - model.yHigh)}
        className="fill-good/10"
      />
      <line x1={PAD_L} y1={model.yLow} x2={W - PAD_R} y2={model.yLow} className="stroke-good/60" strokeWidth="1" strokeDasharray="3 4" />
      <line x1={PAD_L} y1={model.yHigh} x2={W - PAD_R} y2={model.yHigh} className="stroke-border" strokeWidth="1" strokeDasharray="3 4" />

      <text x={2} y={model.yLow + 3} className="fill-good font-mono text-[9px]">{low.toFixed(1)}</text>
      <text x={2} y={model.yHigh + 3} className="fill-sub font-mono text-[9px]">{high.toFixed(1)}</text>

      {/* forecast region divider */}
      <line x1={model.xNow} y1={PAD_T} x2={model.xNow} y2={H - PAD_B} className="stroke-border" strokeWidth="1" />
      <text x={model.xNow + 4} y={PAD_T + 8} className="fill-sub font-mono text-[9px]">forecast</text>

      {/* forecast */}
      <polyline
        points={model.fcLine}
        fill="none"
        className="stroke-accent"
        strokeWidth="2.5"
        strokeDasharray="5 6"
        strokeLinecap="round"
      />
      <circle cx={model.fc[2]!.x} cy={model.fc[2]!.y} r="4" className="fill-accent" />
      <text
        x={model.fc[2]!.x}
        y={model.fc[2]!.y - 9}
        textAnchor="end"
        className="fill-accent font-mono text-[10px]"
      >
        {model.f4.toFixed(1)}
      </text>

      {/* measured */}
      <polyline
        key={model.line}
        points={model.line}
        fill="none"
        className="animate-draw stroke-foreground"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="640"
      />
      {model.pts.map((p, i) => (
        <g key={p.r.id}>
          <circle cx={p.x} cy={p.y} r={i === model.pts.length - 1 ? 4.5 : 2.8} className="fill-foreground" />
          {(i === 0 || i === model.pts.length - 1) && (
            <text x={p.x} y={H - 8} textAnchor={i === 0 ? "start" : "middle"} className="fill-sub font-mono text-[9px]">
              {fmtDate(p.r.date)}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
