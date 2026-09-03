import { riskBand } from "@/lib/hemo";

export function RiskGauge({ score }: { score: number }) {
  const band = riskBand(score);
  // -90deg at 0, +90deg at 100
  const angle = -90 + (Math.min(100, Math.max(0, score)) / 100) * 180;

  return (
    <div className="mt-4">
      <div className="relative mx-auto h-[112px] w-[224px] overflow-hidden">
        <div
          className="absolute inset-0 rounded-t-full"
          style={{
            background:
              "conic-gradient(from 270deg at 50% 100%, var(--good) 0deg 60deg, var(--warn) 60deg 120deg, var(--crit) 120deg 180deg, transparent 180deg)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 mx-auto h-[112px] w-[152px] rounded-t-full bg-card" />
        <div
          className="animate-sweep absolute bottom-0 left-1/2 h-[100px] w-[2px] origin-bottom rounded-full bg-foreground"
          style={{ transform: `rotate(${angle}deg)`, transition: "transform 700ms var(--ease-clinical)" }}
        />
        <div className="absolute -bottom-1.5 left-1/2 size-3 -translate-x-1/2 rounded-full bg-foreground" />
      </div>
      <div className="mt-1 grid grid-cols-3 text-center">
        <span className="label-mono">Low</span>
        <span className="label-mono">Moderate</span>
        <span className="label-mono">High</span>
      </div>
      <p className="mt-3 text-center font-display text-3xl tabular-nums">
        {score}
        <span className="ml-1 font-sans text-sm font-medium text-sub">/ 100 · {band}</span>
      </p>
    </div>
  );
}
