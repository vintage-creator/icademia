import { createFileRoute } from "@tanstack/react-router";
import { Users, KeyRound, GraduationCap, TrendingUp, ArrowUpRight, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { STATS, MOCK_STUDENTS, MOCK_PINS } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Dashboard — iCademia" }] }),
  component: Overview,
});

const kpis = [
  { label: "Students", value: STATS.students.toLocaleString(), delta: "+38 this term", icon: Users, tone: "primary" },
  { label: "Teachers", value: STATS.teachers, delta: "All active", icon: GraduationCap, tone: "accent" },
  { label: "PINs issued", value: STATS.pinsIssued.toLocaleString(), delta: `${STATS.pinsUsed} used`, icon: KeyRound, tone: "success" },
  { label: "Avg. class score", value: "74.6%", delta: "+2.3% vs T1", icon: TrendingUp, tone: "warning" },
];

const activity = [
  { who: "Mr. Femi (Teacher)", what: "uploaded scores for JSS 2 — Mathematics", when: "12 min ago" },
  { who: "Mrs. Adekunle", what: "generated 200 PIN cards (Batch #B-104)", when: "2 hours ago" },
  { who: "System", what: "term average recomputed for SS 1 Sapphire", when: "5 hours ago" },
  { who: "Mr. Okafor", what: "revoked PIN SRC-5B6Q-08F9", when: "Yesterday" },
];

function Overview() {
  return (
    <div className="space-y-8 p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back, Amaka.</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Term overview</h1>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs">
          <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
          <span className="text-muted-foreground">Session</span>
          <span className="font-medium">2024/2025 · 2nd Term</span>
        </div>
      </header>

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
            <h2 className="font-display text-lg font-semibold">Top performers</h2>
            <span className="text-xs text-muted-foreground">2nd Term · all classes</span>
          </div>
          <ul className="mt-5 divide-y divide-border">
            {MOCK_STUDENTS.sort((a, b) => b.avg - a.avg).slice(0, 5).map((s, i) => (
              <li key={s.reg} className="flex items-center gap-4 py-3">
                <span className="grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-sm font-semibold text-primary">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.class} · {s.reg}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-semibold">{s.avg.toFixed(1)}%</p>
                  <p className="text-[11px] text-success">Above average</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-border p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent activity</h2>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <ol className="mt-5 space-y-4">
            {activity.map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="text-sm">
                  <p><span className="font-medium">{a.who}</span> <span className="text-muted-foreground">{a.what}</span></p>
                  <p className="text-xs text-muted-foreground">{a.when}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <Card className="border-border p-6 shadow-card">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Latest PIN batch</h2>
          <span className="text-xs text-muted-foreground">Batch #B-104</span>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
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
              {MOCK_PINS.map((p) => (
                <tr key={p.id} className="border-b border-border/60">
                  <td className="py-3 font-mono text-xs">{p.serial}</td>
                  <td className="py-3 font-mono">{p.pin}</td>
                  <td className="py-3"><StatusPill status={p.status} /></td>
                  <td className="py-3 text-muted-foreground">{p.usedBy ?? "—"}</td>
                  <td className="py-3 text-muted-foreground">{p.generatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function toneBg(t: string) {
  switch (t) {
    case "primary": return "bg-primary/10 text-primary";
    case "accent": return "bg-accent/25 text-accent-foreground";
    case "success": return "bg-success/15 text-success";
    case "warning": return "bg-warning/20 text-warning-foreground";
    default: return "bg-muted text-foreground";
  }
}

export function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Used: "bg-success/15 text-success",
    Unused: "bg-primary/10 text-primary",
    Revoked: "bg-destructive/10 text-destructive",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
