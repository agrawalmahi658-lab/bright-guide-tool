import { useMemo, useState } from "react";
import { NORMAL_RANGE, classify, doctorQueue, severityLabel, type Patient } from "@/lib/hemo";

type Filter = "all" | "critical" | "moderate" | "stable";

function bandOf(p: Patient): Filter {
  const sev = classify(p.hb, p.sex);
  if (sev === "severe" || sev === "moderate") return "critical";
  if (sev === "mild") return "moderate";
  return "stable";
}

export function DoctorView() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Patient>(doctorQueue[0]!);

  const counts = useMemo(() => {
    const c = { critical: 0, moderate: 0, stable: 0 };
    doctorQueue.forEach((p) => c[bandOf(p) as keyof typeof c]++);
    return c;
  }, []);

  const rows = useMemo(
    () =>
      doctorQueue
        .filter((p) => filter === "all" || bandOf(p) === filter)
        .sort((a, b) => a.hb - b.hb),
    [filter],
  );

  const [low] = NORMAL_RANGE[selected.sex];

  return (
    <>
      <div className="animate-rise mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Clinical queue</h1>
          <p className="mt-1 text-sm text-sub">Dr. A. Mehta · Haematology · {doctorQueue.length} patients under review</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["all", `All ${doctorQueue.length}`],
              ["critical", `Critical ${counts.critical}`],
              ["moderate", `Moderate ${counts.moderate}`],
              ["stable", `Stable ${counts.stable}`],
            ] as [Filter, string][]
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                filter === k ? "bg-foreground text-background" : "bg-card text-sub ring-1 ring-border hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-12">
        <div className="animate-rise overflow-hidden rounded-3xl bg-card ring-1 ring-border lg:col-span-8">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-border px-5 py-3">
            <span className="label-mono">Patient</span>
            <span className="label-mono text-right">Hb g/dL</span>
            <span className="label-mono w-24 text-right">Status</span>
          </div>
          <ul>
            {rows.map((p) => {
              const band = bandOf(p);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => setSelected(p)}
                    className={`grid w-full grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-3.5 text-left transition-colors ${
                      selected.id === p.id ? "bg-background" : "hover:bg-background/60"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span
                        className={`grid size-9 shrink-0 place-items-center rounded-full font-display text-xs font-semibold ${
                          band === "critical" ? "bg-crit/12 text-crit" : "bg-chip"
                        }`}
                      >
                        {p.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                      <span className="leading-tight">
                        <span className="block text-sm font-semibold">{p.name}</span>
                        <span className="block font-mono text-[10px] text-sub">
                          {p.id} · {p.age}y · {p.lastSeen}
                        </span>
                      </span>
                    </span>
                    <span className="text-right">
                      <span className="block font-mono text-sm tabular-nums">{p.hb.toFixed(1)}</span>
                      <span
                        className={`block font-mono text-[10px] ${
                          p.delta < 0 ? "text-crit" : p.delta > 0 ? "text-good" : "text-sub"
                        }`}
                      >
                        {p.delta > 0 ? "▲" : p.delta < 0 ? "▼" : "—"} {Math.abs(p.delta).toFixed(1)}
                      </span>
                    </span>
                    <span
                      className={`w-24 text-right font-mono text-[10px] uppercase tracking-wide ${
                        band === "critical" ? "text-crit" : band === "moderate" ? "text-foreground" : "text-sub"
                      }`}
                    >
                      {band}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="animate-rise rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.28_0.045_262)] p-6 text-primary-foreground lg:col-span-4">
          <p className="label-mono !text-primary-foreground/60">Selected patient</p>
          <h2 className="mt-2 text-xl">{selected.name}</h2>
          <p className="mt-1 font-mono text-[11px] text-primary-foreground/60">
            {selected.id} · {selected.age}y · {selected.sex}
          </p>

          <div className="mt-5 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
            <p className="font-display text-4xl font-bold tabular-nums">{selected.hb.toFixed(1)}</p>
            <p className="mt-1 text-xs text-primary-foreground/70">
              {severityLabel[classify(selected.hb, selected.sex)]} · floor {low.toFixed(1)} g/dL
            </p>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">{selected.note}</p>

          <div className="mt-5 space-y-2">
            <button className="w-full rounded-full bg-accent py-2.5 text-sm font-semibold text-accent-foreground transition hover:brightness-95">
              Start consultation
            </button>
            <button className="w-full rounded-full py-2.5 text-sm font-semibold ring-1 ring-white/20 transition-colors hover:bg-white/10">
              Request repeat CBC
            </button>
          </div>
        </aside>
      </section>
    </>
  );
}
