import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PatientView } from "@/components/hemo/PatientView";
import { DoctorView } from "@/components/hemo/DoctorView";
import { AdminView } from "@/components/hemo/AdminView";

const TITLE = "HemoTrack AI — Haemoglobin Tracking & Anaemia Risk Prediction";
const DESC =
  "Track haemoglobin trends, forecast future levels, and predict anaemia risk with role-based dashboards for patients, doctors, and health administrators.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type Role = "patient" | "doctor" | "admin";

function Index() {
  const [role, setRole] = useState<Role>("patient");

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-cool/70 blur-3xl" />
      <div className="pointer-events-none absolute -left-32 top-72 size-[420px] rounded-full bg-accent/8 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 py-5 lg:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative grid size-9 place-items-center rounded-xl bg-foreground">
              <span className="size-3 rounded-full bg-accent" />
              <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-background" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-[15px] font-bold">HemoTrack AI</p>
              <p className="label-mono">Haemoglobin Intelligence</p>
            </div>
          </div>

          <nav className="flex items-center gap-3">
            <div className="flex items-center rounded-full bg-card p-1 ring-1 ring-border">
              {(["patient", "doctor", "admin"] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                    role === r ? "bg-foreground text-background" : "text-sub hover:text-foreground"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <span className="grid size-8 place-items-center rounded-full bg-chip font-display text-xs font-semibold">
                RK
              </span>
              <span className="leading-tight">
                <span className="block text-xs font-semibold">Riya Kapoor</span>
                <span className="block font-mono text-[10px] text-sub">ID HT-4471</span>
              </span>
            </div>
          </nav>
        </header>

        <main key={role}>
          {role === "patient" && <PatientView />}
          {role === "doctor" && <DoctorView />}
          {role === "admin" && <AdminView />}
        </main>

        <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 pb-6 font-mono text-[11px] text-sub">
          <span>HemoTrack AI · Mahi Agarwal · Jaspreet Sindhu · Zigyasa Chaturvedi</span>
          <span>For guidance only — not a medical diagnosis</span>
        </footer>
      </div>
    </div>
  );
}
