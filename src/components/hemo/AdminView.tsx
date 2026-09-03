import { cohorts, doctorQueue } from "@/lib/hemo";

const programmes = [
  { site: "Sector 14 PHC", screened: 1240, flagged: 612, trend: "-4.2%" },
  { site: "Govt. Girls School, Rohtak", screened: 860, flagged: 559, trend: "-1.8%" },
  { site: "Blood donation camp — Pune", screened: 430, flagged: 96, trend: "-6.1%" },
  { site: "Anganwadi cluster, Bihar", screened: 2100, flagged: 1409, trend: "+0.4%" },
];

export function AdminView() {
  const totalScreened = programmes.reduce((s, p) => s + p.screened, 0);
  const totalFlagged = programmes.reduce((s, p) => s + p.flagged, 0);

  return (
    <>
      <div className="animate-rise mt-6">
        <h1 className="text-2xl sm:text-3xl">Community analytics</h1>
        <p className="mt-1 text-sm text-sub">Population-level anaemia insights across 4 active screening programmes</p>
      </div>

      <section className="animate-rise mt-5 grid gap-5 sm:grid-cols-3">
        {[
          { label: "People screened", value: totalScreened.toLocaleString("en-IN"), sub: "this quarter" },
          {
            label: "Flagged anaemic",
            value: `${Math.round((totalFlagged / totalScreened) * 100)}%`,
            sub: `${totalFlagged.toLocaleString("en-IN")} individuals`,
          },
          { label: "Active clinicians", value: "18", sub: `${doctorQueue.length} open cases` },
        ].map((k) => (
          <div key={k.label} className="rounded-3xl bg-card p-5 ring-1 ring-border">
            <p className="label-mono">{k.label}</p>
            <p className="mt-2 font-display text-4xl font-bold tabular-nums">{k.value}</p>
            <p className="mt-1 text-xs text-sub">{k.sub}</p>
          </div>
        ))}
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-12">
        <div className="animate-rise rounded-3xl bg-card p-6 ring-1 ring-border lg:col-span-7">
          <p className="label-mono">Prevalence by cohort</p>
          <ul className="mt-5 space-y-5">
            {cohorts.map((c) => (
              <li key={c.label}>
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-semibold">{c.label}</span>
                  <span className="font-mono text-xs text-sub">
                    {c.prevalence}% · n={c.n.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-chip">
                  <div
                    className="h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                    style={{
                      width: `${c.prevalence}%`,
                      background: c.prevalence > 50 ? "var(--crit)" : c.prevalence > 30 ? "var(--warn)" : "var(--good)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-sub">Baseline reference: NFHS-5, India.</p>
        </div>

        <div className="animate-rise rounded-3xl bg-card p-6 ring-1 ring-border lg:col-span-5">
          <p className="label-mono">Screening sites</p>
          <ul className="mt-4 space-y-3">
            {programmes.map((p) => (
              <li key={p.site} className="rounded-2xl bg-background p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold">{p.site}</span>
                  <span
                    className={`font-mono text-[10px] ${p.trend.startsWith("-") ? "text-good" : "text-crit"}`}
                  >
                    {p.trend}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[10px] text-sub">
                  {p.screened.toLocaleString("en-IN")} screened · {p.flagged.toLocaleString("en-IN")} flagged
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
