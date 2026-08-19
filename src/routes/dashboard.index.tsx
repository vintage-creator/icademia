import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Users,
  KeyRound,
  GraduationCap,
  TrendingUp,
  ArrowUpRight,
  CheckCircle2,
  Loader2,
  BrainCircuit,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDashboardStatsDb, getStudentsDb, getPinsDb } from "@/lib/api/db.functions";
import { cn, getSchoolCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — iCademia" }] }),
  component: Overview,
});

function Overview() {
  type DashboardStats = {
    studentsCount: number;
    teachersCount: number;
    pinsTotal: number;
    pinsUsed: number;
    pinsUnused: number;
    resultsCount: number;
  };
  type DashboardStudent = {
    id: number;
    name: string;
    class_name?: string | null;
    registration_number: string;
    average_score?: number | string | null;
    results_count: number;
  };
  type DashboardPin = {
    id: number;
    serial: string;
    pin: string;
    status: string;
    used_by?: string | null;
    created_at?: string;
  };
  const [dbStats, setDbStats] = useState<DashboardStats | null>(null);
  const [students, setStudents] = useState<DashboardStudent[]>([]);
  const [pins, setPins] = useState<DashboardPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [openStep, setOpenStep] = useState<number | null>(0);

  const schoolCode = getSchoolCode();

  useEffect(() => {
    const loadOverview = async () => {
      setLoading(true);
      try {
        const [statsData, studentsData, pinsData] = await Promise.all([
          getDashboardStatsDb({ data: { schoolCode } }),
          getStudentsDb({ data: { schoolCode } }),
          getPinsDb({ data: { schoolCode } }),
        ]);
        setDbStats(statsData);
        setStudents(studentsData as unknown as DashboardStudent[]);
        setPins(pinsData.slice(0, 5) as unknown as DashboardPin[]); // Just show latest 5
      } catch (err) {
        console.error("Dashboard overview load failed:", err);
      } finally {
        setLoading(false);
      }
    };
    loadOverview();
  }, [schoolCode]);

  const stats = dbStats || {
    studentsCount: 0,
    teachersCount: 0,
    pinsTotal: 0,
    pinsUsed: 0,
    pinsUnused: 0,
    resultsCount: 0,
  };

  const kpis = [
    {
      label: "Students",
      value: stats.studentsCount.toLocaleString(),
      delta: `Total enrolled`,
      icon: Users,
      tone: "primary",
    },
    {
      label: "Teachers",
      value: stats.teachersCount,
      delta: "All active",
      icon: GraduationCap,
      tone: "accent",
    },
    {
      label: "PINs issued",
      value: stats.pinsTotal.toLocaleString(),
      delta: `${stats.pinsUsed} used · ${stats.pinsUnused} unused`,
      icon: KeyRound,
      tone: "success",
    },
    {
      label: "Published Reports",
      value: stats.resultsCount.toString(),
      delta: "Generated report cards",
      icon: TrendingUp,
      tone: "warning",
    },
  ];
  return (
    <div className="space-y-8 p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">School administrator workspace</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Term overview</h1>
        </div>
      </header>

      <Card className="relative overflow-hidden border-border bg-[#07111f] text-white shadow-card">
        <div>
          <div className="relative p-6 sm:p-8">
            <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:24px_24px]" />
            <div className="relative">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#d6a84b]">
                Administrator intelligence
              </p>
              <h2 className="mt-2 max-w-xl font-display text-2xl font-semibold">
                Turn this term’s records into decisions, not more spreadsheets.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                Audit result readiness, design learning interventions, plan staff responsibilities
                and prepare a principal’s decision memo from de-identified school data.
              </p>
              <Link
                to="/dashboard/ai"
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#07111f]"
              >
                <BrainCircuit className="h-4 w-4" /> Open AI command centre
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border p-5 shadow-card">
            <div className="flex items-start justify-between">
              <span className={`grid h-10 w-10 place-items-center rounded-lg ${toneBg(k.tone)}`}>
                <k.icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">{k.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold">{k.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.delta}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card className="border-border p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Top Performers</h2>
            <span className="text-xs text-muted-foreground">Term Report · all classes</span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : students.length === 0 ? (
            <p className="mt-5 text-sm text-muted-foreground text-center py-6">
              No student records created yet.
            </p>
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {students.slice(0, 5).map((s, i) => (
                <li key={s.id} className="flex items-center gap-4 py-3">
                  <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-sm font-semibold text-primary">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.class_name || "Class"} · {s.registration_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-base font-semibold">
                      {s.average_score ? `${Number(s.average_score).toFixed(1)}%` : "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {s.results_count} published report(s)
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border-border p-6 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold">Onboarding progress</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Understand and configure the platform for your school</p>
              </div>
              <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full shrink-0">
                {[
                  stats.studentsCount > 0,
                  stats.teachersCount > 0,
                  true, // Classes mapped active
                  stats.resultsCount > 0,
                  stats.pinsTotal > 0
                ].filter(Boolean).length} / 5 completed
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {[
                {
                  id: 0,
                  title: "1. Set up classes & subjects",
                  desc: "Create the classes and subjects your school teaches before adding people to them.",
                  role: "This structure determines which classes and subjects staff can be assigned to.",
                  link: "/dashboard/classes",
                  btnText: "Define Structure",
                  complete: true, // Seeded default
                },
                {
                  id: 1,
                  title: "2. Invite teachers",
                  desc: "Invite staff and give each person one clear responsibility: form teacher, subject teacher, head teacher or exam officer.",
                  role: "Subject teachers enter only their assigned scores. Form teachers manage their class. Exam officers coordinate publishing.",
                  link: "/dashboard/teachers",
                  btnText: "Manage teachers",
                  complete: stats.teachersCount > 0,
                },
                {
                  id: 2,
                  title: "3. Add students",
                  desc: "Add your student roster one at a time or import all 70 Britarch students from a CSV template.",
                  role: "Administrators maintain the roster and each student’s unique registration number.",
                  link: "/dashboard/students",
                  btnText: "Add students",
                  complete: stats.studentsCount > 0,
                },
                {
                  id: 3,
                  title: "4. Publish term results",
                  desc: "Review compiled grades, view class rankings, and publish student results.",
                  role: "Teachers submit scores; Admins preview, digitally sign, and stamp report cards.",
                  link: "/dashboard/results",
                  btnText: "Review & Publish",
                  complete: stats.resultsCount > 0,
                },
                {
                  id: 4,
                  title: "5. Issue Scratch Cards",
                  desc: "Order annual access cards matching your current school enrollment.",
                  role: "A single card grants parents 365-day access to term sheets and tutor remarks.",
                  link: "/dashboard/pins",
                  btnText: "Order Cards",
                  complete: stats.pinsTotal > 0,
                }
              ].map((step, idx) => {
                const isOpen = openStep === idx;
                return (
                  <div key={step.title} className={cn("border border-border rounded-xl transition-all overflow-hidden", step.complete ? "bg-card" : "bg-muted/10")}>
                    <button
                      type="button"
                      onClick={() => setOpenStep(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className={cn("grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold shrink-0", step.complete ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                          {step.complete ? "✓" : idx + 1}
                        </span>
                        <span className={cn(step.complete ? "text-foreground font-semibold" : "text-muted-foreground")}>{step.title}</span>
                      </div>
                      <span className="text-muted-foreground text-xs font-normal">
                        {isOpen ? "Hide" : "Show Guide"}
                      </span>
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border bg-muted/20 animate-in slide-in-from-top-1 duration-150">
                        <p className="text-xs text-foreground leading-relaxed font-medium">{step.desc}</p>
                        <div className="p-2.5 rounded-lg bg-card border border-border text-[11px] text-muted-foreground leading-relaxed">
                          <strong className="text-foreground">Role & Responsibilities:</strong> {step.role}
                        </div>
                        <Link to={step.link}>
                          <Button size="sm" className="w-full mt-1 text-xs font-semibold gradient-primary text-primary-foreground shadow-sm gap-1">
                            {step.btnText} <ArrowUpRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-border p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Latest PIN batch</h2>
          <span className="text-xs text-muted-foreground">Trial & Purchased Batches</span>
        </div>
        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : pins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No PIN cards generated yet.
            </p>
          ) : (
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5">Serial</th>
                  <th className="py-2.5">PIN</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Used by</th>
                  <th className="py-2.5">Generated</th>
                </tr>
              </thead>
              <tbody>
                {pins.map((p) => (
                  <tr key={p.id} className="border-b border-border/60">
                    <td className="py-3 font-mono text-xs">{p.serial}</td>
                    <td className="py-3 font-mono">{p.pin}</td>
                    <td className="py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="py-3 text-muted-foreground">{p.used_by ?? "—"}</td>
                    <td className="py-3 text-muted-foreground">
                      {p.created_at
                        ? new Date(p.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

function toneBg(t: string) {
  switch (t) {
    case "primary":
      return "bg-primary/10 text-primary";
    case "accent":
      return "bg-accent/25 text-accent-foreground";
    case "success":
      return "bg-success/15 text-success";
    case "warning":
      return "bg-warning/20 text-warning-foreground";
    default:
      return "bg-muted text-foreground";
  }
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Used: "bg-success/15 text-success",
    Unused: "bg-primary/10 text-primary",
    Revoked: "bg-destructive/10 text-destructive",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted"}`}
    >
      {status}
    </span>
  );
}
