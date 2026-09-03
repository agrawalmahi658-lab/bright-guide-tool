import { useMemo, useState } from "react";
import { TrendChart } from "./TrendChart";
import { RiskGauge } from "./RiskGauge";
import {
  NORMAL_RANGE,
  classify,
  donationEligible,
  fmtDate,
  forecast,
  recommendations,
  riskScore,
  seedReadings,
  seedReminders,
  seedSymptoms,
  severityLabel,
  trendPerWeek,
  type Reading,
  type Reminder,
  type Sex,
  type Symptom,
} from "@/lib/hemo";

const toneClass = {
  good: "bg-good/12 text-good",
  neutral: "bg-chip text-foreground",
  crit: "bg-crit/12 text-crit",
} as const;

export function PatientView() {
  const [sex, setSex] = useState<Sex>("female");
  const [readings, setReadings] = useState<Reading[]>(seedReadings);
  const [symptoms, setSymptoms] = useState<Symptom[]>(seedSymptoms);
  const [reminders, setReminders] = useState<Reminder[]>(seedReminders);

  const [hbInput, setHbInput] = useState("");
  const [symptomName, setSymptomName] = useState("");
  const [symptomSeverity, setSymptomSeverity] = useState(5);

  const [low, high] = NORMAL_RANGE[sex];
  const latest = readings[readings.length - 1]!;
  const sev = classify(latest.hb, sex);
  const score = useMemo(() => riskScore(readings, symptoms, sex), [readings, symptoms, sex]);
  const slope = trendPerWeek(readings);
  const f4 = forecast(readings, 4);
  const recs = recommendations(latest.hb, sex, score);
  const donation = donationEligible(latest.hb, sex);

  // marker position on the 8 – 18 g/dL scale
  const markerPct = Math.max(0, Math.min(100, ((latest.hb - 8) / 10) * 100));
  const bandLeft = ((low - 8) / 10) * 100;
  const bandWidth = ((high - low) / 10) * 100;

  function addReading(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(hbInput);
    if (!Number.isFinite(v) || v < 3 || v > 22) return;
    setReadings((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        date: new Date().toISOString().slice(0, 10),
        hb: Math.round(v * 10) / 10,
        source: "Self-reported",
      },
    ]);
    setHbInput("");
  }

  function addSymptom(e: React.FormEvent) {
    e.preventDefault();
    if (!symptomName.trim()) return;
    setSymptoms((prev) => [
      { id: crypto.randomUUID(), name: symptomName.trim(), severity: symptomSeverity, date: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
    setSymptomName("");
    setSymptomSeverity(5);
  }

  return (
    <>
      <div className="animate-rise mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl">Good morning, Riya</h1>
          <p className="mt-1 text-sm text-sub">
            Last drawn {fmtDate(latest.date)} · {latest.source} · {readings.length} readings on file
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-card p-1 ring-1 ring-border">
          {(["female", "male"] as Sex[]).map((s) => (
            <button
              key={s}
              onClick={() => setSex(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                sex === s ? "bg-foreground text-background" : "text-sub hover:text-foreground"
              }`}
            >
              {s} ranges
            </button>
          ))}
        </div>
      </div>

      <section className="mt-5 grid gap-5 lg:grid-cols-12">
        {/* Hero metric + chart */}
        <div className="animate-rise rounded-3xl bg-gradient-to-br from-card to-cool/50 p-6 ring-1 ring-border lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="label-mono">Current haemoglobin</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold tabular-nums">{latest.hb.toFixed(1)}</span>
                <span className="font-mono text-sm text-sub">g/dL</span>
              </div>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                sev === "normal" ? "bg-good/12 text-good" : "bg-crit/12 text-crit"
              }`}
            >
              {severityLabel[sev]}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <span className="whitespace-nowrap text-xs text-sub">
              Healthy {low.toFixed(1)}–{high.toFixed(1)}
            </span>
            <div className="relative h-2 flex-1 rounded-full bg-chip">
              <span
                className="absolute inset-y-0 rounded-full bg-good/30"
                style={{ left: `${bandLeft}%`, width: `${bandWidth}%` }}
              />
              <span
                className="absolute -top-1 size-3.5 rounded-full ring-2 ring-card transition-[left] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                style={{
                  left: `calc(${markerPct}% - 7px)`,
                  background: sev === "normal" ? "var(--good)" : "var(--crit)",
                }}
              />
            </div>
            <span className="font-mono text-[10px] text-sub">{latest.hb.toFixed(1)}</span>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-between">
              <p className="label-mono">Trend + 4-week AI forecast</p>
              <span className="font-mono text-[10px] text-sub">
                {slope >= 0 ? "+" : ""}
                {slope.toFixed(2)} g/dL per week
              </span>
            </div>
            <TrendChart readings={readings} low={low} high={high} />
          </div>

          <form onSubmit={addReading} className="mt-4 flex flex-wrap items-center gap-2">
            <label htmlFor="hb" className="label-mono">
              Log reading
            </label>
            <input
              id="hb"
              value={hbInput}
              onChange={(e) => setHbInput(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 11.9"
              className="w-28 rounded-full bg-card px-4 py-2 font-mono text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-accent"
            >
              Add g/dL
            </button>
            {readings.length > seedReadings.length && (
              <button
                type="button"
                onClick={() => setReadings(seedReadings)}
                className="rounded-full px-3 py-2 text-xs font-medium text-sub hover:text-foreground"
              >
                Reset
              </button>
            )}
          </form>
        </div>

        {/* Risk */}
        <div className="animate-rise flex flex-col rounded-3xl bg-card p-6 ring-1 ring-border lg:col-span-5">
          <div className="flex items-center justify-between">
            <p className="label-mono">Anaemia risk</p>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                score < 34 ? "bg-good/12 text-good" : score < 67 ? "bg-warn/20 text-foreground" : "bg-crit/12 text-crit"
              }`}
            >
              {score < 34 ? "Low" : score < 67 ? "Moderate" : "High"}
            </span>
          </div>

          <RiskGauge score={score} />

          <p className="mt-4 text-sm leading-relaxed text-sub">
            Composite of Hb deficit, {slope >= 0 ? "rising" : "falling"} trajectory and symptom burden. AI projects{" "}
            <span className="font-semibold text-foreground">{f4.toFixed(1)} g/dL</span> in 4 weeks
            {f4 >= low ? " — inside the healthy band." : " — still below the healthy band."}
          </p>

          <div className="mt-4 rounded-2xl bg-background p-4">
            <p className="label-mono">Blood donation assistant</p>
            <p className="mt-2 text-sm">
              {donation.eligible ? (
                <span className="font-semibold text-good">Eligible to donate</span>
              ) : (
                <span className="font-semibold text-crit">Not eligible yet</span>
              )}
              <span className="text-sub">
                {" "}
                · threshold {donation.floor.toFixed(1)} g/dL
                {donation.eligible ? "" : ` · ${(donation.floor - latest.hb).toFixed(1)} to go`}
              </span>
            </p>
          </div>

          <label className="mt-auto block cursor-pointer pt-4">
            <input type="file" accept=".pdf,image/*" className="sr-only" />
            <span className="block rounded-full bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-foreground ring-1 ring-black/5 transition hover:brightness-95">
              Upload CBC report
            </span>
          </label>
        </div>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-3">
        {/* Recommendations */}
        <div className="animate-rise rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="label-mono">Personalised plan</p>
          <ul className="mt-4 space-y-4">
            {recs.map((r, i) => (
              <li key={r.title} className="flex items-start gap-3">
                <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-md font-mono text-xs ${toneClass[r.tone]}`}>
                  {i + 1}
                </span>
                <div>
                  <p className="text-sm font-semibold">{r.title}</p>
                  <p className="mt-0.5 text-xs text-sub">{r.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Reminders */}
        <div className="animate-rise rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="label-mono">Reminders</p>
          <ul className="mt-4 space-y-3">
            {reminders.map((m) => (
              <li key={m.id}>
                <button
                  onClick={() =>
                    setReminders((prev) => prev.map((x) => (x.id === m.id ? { ...x, done: !x.done } : x)))
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-1 py-1 text-left transition-colors hover:bg-background"
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-lg font-mono text-[10px] ${
                      m.done ? "bg-good/15 text-good" : "bg-chip text-foreground"
                    }`}
                  >
                    {m.done ? "✓" : m.time}
                  </span>
                  <span className="flex-1">
                    <span className={`block text-sm font-semibold ${m.done ? "text-sub line-through" : ""}`}>{m.title}</span>
                    <span className="block text-xs text-sub">{m.detail}</span>
                  </span>
                  <span className="font-mono text-[10px] text-sub">{m.when}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Symptoms */}
        <div className="animate-rise rounded-3xl bg-card p-5 ring-1 ring-border">
          <p className="label-mono">Symptom log</p>
          <p className="mt-3 font-display text-3xl font-bold">
            {symptoms.length}
            <span className="ml-2 font-sans text-sm font-medium text-sub">entries</span>
          </p>
          <ul className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">
            {symptoms.map((s) => (
              <li key={s.id} className="flex items-center justify-between rounded-xl bg-background px-3 py-2.5">
                <span className="text-sm">{s.name}</span>
                <span className="font-mono text-[10px] text-sub">
                  {fmtDate(s.date)} · {s.severity}/10
                </span>
              </li>
            ))}
          </ul>
          <form onSubmit={addSymptom} className="mt-4 space-y-2">
            <input
              value={symptomName}
              onChange={(e) => setSymptomName(e.target.value)}
              placeholder="How do you feel?"
              className="w-full rounded-full bg-background px-4 py-2 text-sm outline-none ring-1 ring-border focus:ring-2 focus:ring-ring"
            />
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={symptomSeverity}
                onChange={(e) => setSymptomSeverity(Number(e.target.value))}
                className="flex-1 accent-[var(--accent)]"
                aria-label="Severity"
              />
              <span className="w-10 font-mono text-xs text-sub">{symptomSeverity}/10</span>
            </div>
            <button
              type="submit"
              className="w-full rounded-full py-2.5 text-sm font-semibold ring-1 ring-border transition-colors hover:bg-chip"
            >
              + Log symptom
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
