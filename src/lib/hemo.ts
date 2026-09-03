export type Sex = "female" | "male";

export type Reading = {
  id: string;
  /** ISO date */
  date: string;
  hb: number;
  source: "Venous CBC" | "Point-of-care" | "Self-reported";
};

export type Symptom = {
  id: string;
  name: string;
  severity: number; // 1-10
  date: string;
};

export type Reminder = {
  id: string;
  time: string;
  title: string;
  detail: string;
  when: string;
  done: boolean;
};

export const NORMAL_RANGE: Record<Sex, [number, number]> = {
  female: [12.0, 15.5],
  male: [13.5, 17.5],
};

export type Severity = "normal" | "mild" | "moderate" | "severe";

export function classify(hb: number, sex: Sex): Severity {
  const low = NORMAL_RANGE[sex][0];
  if (hb >= low) return "normal";
  if (hb >= low - 1.0) return "mild";
  if (hb >= 8) return "moderate";
  return "severe";
}

export const severityLabel: Record<Severity, string> = {
  normal: "Normal range",
  mild: "Mildly low",
  moderate: "Moderate anaemia",
  severe: "Severe anaemia",
};

/** Least-squares slope of hb over days. */
export function trendPerWeek(readings: Reading[]): number {
  if (readings.length < 2) return 0;
  const t0 = new Date(readings[0].date).getTime();
  const pts = readings.map((r) => ({
    x: (new Date(r.date).getTime() - t0) / 86_400_000,
    y: r.hb,
  }));
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  const num = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
  const den = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0);
  if (den === 0) return 0;
  return (num / den) * 7;
}

/** Projected Hb `weeks` ahead, damped so it never runs away. */
export function forecast(readings: Reading[], weeks: number): number {
  if (!readings.length) return 0;
  const last = readings[readings.length - 1].hb;
  const slope = trendPerWeek(readings);
  const damped = Math.sign(slope) * Math.min(Math.abs(slope), 0.35);
  return Math.max(4, Math.min(19, last + damped * weeks));
}

/**
 * Composite anaemia risk 0-100 from current Hb, trajectory and symptom burden.
 */
export function riskScore(
  readings: Reading[],
  symptoms: Symptom[],
  sex: Sex,
): number {
  if (!readings.length) return 0;
  const hb = readings[readings.length - 1].hb;
  const low = NORMAL_RANGE[sex][0];

  // deficit term: 0 at normal, 60 at 4 g/dL below normal
  const deficit = Math.max(0, low - hb);
  const deficitScore = Math.min(60, (deficit / 4) * 60);

  // trajectory: falling adds risk, rising subtracts
  const slope = trendPerWeek(readings);
  const trendScore = Math.max(-12, Math.min(22, -slope * 45));

  // symptom burden over the last 30 days
  const cutoff = Date.now() - 30 * 86_400_000;
  const recent = symptoms.filter((s) => new Date(s.date).getTime() >= cutoff);
  const burden = recent.reduce((s, x) => s + x.severity, 0);
  const symptomScore = Math.min(18, burden * 1.2);

  return Math.round(Math.max(0, Math.min(100, deficitScore + trendScore + symptomScore)));
}

export type RiskBand = "Low" | "Moderate" | "High";

export function riskBand(score: number): RiskBand {
  if (score < 34) return "Low";
  if (score < 67) return "Moderate";
  return "High";
}

export type Recommendation = { title: string; detail: string; tone: "good" | "neutral" | "crit" };

export function recommendations(
  hb: number,
  sex: Sex,
  score: number,
): Recommendation[] {
  const sev = classify(hb, sex);
  const list: Recommendation[] = [];

  if (sev === "severe") {
    list.push({
      title: "Seek clinical review today",
      detail: "Hb below 8 g/dL. Contact your physician for urgent assessment.",
      tone: "crit",
    });
  }
  if (sev !== "normal") {
    list.push({
      title: "Ferrous sulfate 100 mg",
      detail: "Morning, on an empty stomach · review in 8 weeks",
      tone: "neutral",
    });
    list.push({
      title: "Vitamin C 200 mg",
      detail: "With meals — raises iron absorption by up to 3×",
      tone: "neutral",
    });
    list.push({
      title: "Iron-rich foods daily",
      detail: "Spinach, lentils, jaggery, lean red meat",
      tone: "neutral",
    });
    list.push({
      title: "Space tea and coffee",
      detail: "Avoid within 1 hour of an iron dose — tannins block uptake",
      tone: "neutral",
    });
  } else {
    list.push({
      title: "Maintain current intake",
      detail: "Hb is within the healthy range for you. Keep the routine.",
      tone: "good",
    });
    list.push({
      title: "Recheck in 6 months",
      detail: "A twice-yearly CBC keeps the trend line honest.",
      tone: "neutral",
    });
  }

  if (score >= 67) {
    list.push({
      title: "Share report with your physician",
      detail: "High composite risk — book a follow-up within 2 weeks.",
      tone: "crit",
    });
  }
  return list;
}

export function donationEligible(hb: number, sex: Sex) {
  const floor = sex === "female" ? 12.5 : 13.0;
  return {
    eligible: hb >= floor,
    floor,
  };
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

export const seedReadings: Reading[] = [
  { id: "r1", date: daysAgo(84), hb: 10.2, source: "Venous CBC" },
  { id: "r2", date: daysAgo(70), hb: 10.4, source: "Venous CBC" },
  { id: "r3", date: daysAgo(56), hb: 10.5, source: "Point-of-care" },
  { id: "r4", date: daysAgo(42), hb: 10.9, source: "Venous CBC" },
  { id: "r5", date: daysAgo(28), hb: 11.0, source: "Point-of-care" },
  { id: "r6", date: daysAgo(14), hb: 11.2, source: "Venous CBC" },
  { id: "r7", date: daysAgo(2), hb: 11.4, source: "Venous CBC" },
];

export const seedSymptoms: Symptom[] = [
  { id: "s1", name: "Mild fatigue", severity: 6, date: daysAgo(6) },
  { id: "s2", name: "Shortness of breath", severity: 4, date: daysAgo(4) },
  { id: "s3", name: "Dizziness on standing", severity: 3, date: daysAgo(1) },
];

export const seedReminders: Reminder[] = [
  { id: "m1", time: "08:00", title: "Ferrous sulfate", detail: "100 mg · with water", when: "Today", done: false },
  { id: "m2", time: "20:00", title: "Vitamin C", detail: "200 mg · after dinner", when: "Today", done: false },
  { id: "m3", time: "—", title: "CBC recheck", detail: "Dr. Mehta · MediCore Clinic", when: "In 14 days", done: false },
];

export type Patient = {
  id: string;
  name: string;
  age: number;
  sex: Sex;
  hb: number;
  delta: number;
  lastSeen: string;
  note: string;
};

export const doctorQueue: Patient[] = [
  { id: "HT-2201", name: "Aisha Siddiqui", age: 27, sex: "female", hb: 8.2, delta: -0.6, lastSeen: "2 days ago", note: "Pregnant, 2nd trimester" },
  { id: "HT-3390", name: "Devika Nair", age: 34, sex: "female", hb: 8.9, delta: -0.3, lastSeen: "5 days ago", note: "Heavy menstrual loss" },
  { id: "HT-1187", name: "Rahul Bose", age: 52, sex: "male", hb: 9.6, delta: -0.4, lastSeen: "1 day ago", note: "Post-surgical recovery" },
  { id: "HT-4471", name: "Riya Kapoor", age: 29, sex: "female", hb: 11.4, delta: 0.2, lastSeen: "Today", note: "On iron therapy, improving" },
  { id: "HT-5512", name: "Vikram Menon", age: 41, sex: "male", hb: 10.1, delta: 0.0, lastSeen: "3 days ago", note: "Plateaued, review dose" },
  { id: "HT-6023", name: "Sana Qureshi", age: 22, sex: "female", hb: 12.8, delta: 0.5, lastSeen: "1 week ago", note: "Stable, discharge candidate" },
  { id: "HT-7734", name: "Arjun Pillai", age: 36, sex: "male", hb: 14.1, delta: 0.1, lastSeen: "2 weeks ago", note: "Donor eligible" },
];

export const cohorts = [
  { label: "Women 15–49", prevalence: 57, n: 4820 },
  { label: "Children 6–59 mo", prevalence: 67, n: 2140 },
  { label: "Pregnant women", prevalence: 52, n: 910 },
  { label: "Men 15–49", prevalence: 25, n: 3660 },
];
