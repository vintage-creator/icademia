import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { KeyRound, Loader2, ShieldCheck, ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PIN_DB, DEMO_RESULT, type StudentResult } from "@/lib/mock-data";

export const Route = createFileRoute("/check-result")({
  head: () => ({
    meta: [
      { title: "Check Result — iCademia" },
      { name: "description", content: "Enter your scratch-card PIN and registration number to view your term result instantly." },
    ],
  }),
  component: CheckResult,
});

function CheckResult() {
  const [pin, setPin] = useState("");
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StudentResult | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setTimeout(() => {
      const key = `${pin.trim().toUpperCase()}|${reg.trim().toUpperCase()}`;
      const found = PIN_DB[key];
      if (found) setResult(found);
      else setError("Invalid PIN or registration number. Try the demo credentials below.");
      setLoading(false);
    }, 700);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto w-full max-w-5xl px-6 py-12">
          {!result ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr]">
              <div>
                <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="h-4 w-4" /> Back home
                </Link>
                <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">Check your result</h1>
                <p className="mt-3 text-muted-foreground">
                  Enter the 12-character PIN printed on your scratch card together with your registration number.
                </p>
                <div className="mt-8 space-y-4">
                  <Bullet icon={ShieldCheck} text="PIN traffic is encrypted and validated per request." />
                  <Bullet icon={KeyRound} text="Each PIN can be configured for single or multiple uses." />
                </div>
                <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-5 text-sm">
                  <p className="font-medium">Demo credentials</p>
                  <p className="mt-2 text-muted-foreground">PIN: <span className="font-mono text-foreground">{DEMO_RESULT.pin}</span></p>
                  <p className="text-muted-foreground">Reg No: <span className="font-mono text-foreground">{DEMO_RESULT.regNumber}</span></p>
                </div>
              </div>

              <Card className="border-border p-8 shadow-card">
                <form onSubmit={submit} className="space-y-5">
                  <div>
                    <Label htmlFor="pin">Scratch-card PIN</Label>
                    <Input id="pin" placeholder="ICA-XXXX-XXXX" value={pin} onChange={(e) => setPin(e.target.value)} className="mt-2 font-mono uppercase tracking-wider" required />
                  </div>
                  <div>
                    <Label htmlFor="reg">Registration number</Label>
                    <Input id="reg" placeholder="BHS/2025/0142" value={reg} onChange={(e) => setReg(e.target.value)} className="mt-2 font-mono uppercase" required />
                  </div>
                  {error && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
                  )}
                  <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground shadow-elegant" size="lg">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    {loading ? "Verifying…" : "View result"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Need a card? Ask your school administrator.
                  </p>
                </form>
              </Card>
            </div>
          ) : (
            <ResultSheet result={result} onBack={() => setResult(null)} />
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Bullet({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <p className="text-sm text-foreground/80">{text}</p>
    </div>
  );
}

function ResultSheet({ result, onBack }: { result: StudentResult; onBack: () => void }) {
  const total = result.subjects.reduce((s, x) => s + x.total, 0);
  const avg = (total / result.subjects.length).toFixed(2);
  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Check another
        </Button>
        <Button size="sm" onClick={() => window.print()} variant="outline">
          <Printer className="mr-1 h-4 w-4" /> Print
        </Button>
      </div>
      <Card className="overflow-hidden border-border p-0 shadow-card">
        <div className="gradient-academic px-8 py-7 text-primary-foreground">
          <p className="text-xs uppercase tracking-widest text-accent">{result.school}</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">Student Term Report</h2>
          <p className="mt-1 text-sm text-white/70">{result.session} · {result.term} Term</p>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-4">
          <InfoCell label="Student" value={result.studentName} />
          <InfoCell label="Reg No" value={result.regNumber} mono />
          <InfoCell label="Class" value={result.className} />
          <InfoCell label="Position" value={result.position} />
        </div>
        <div className="overflow-x-auto p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3">Subject</th>
                <th className="py-3 text-right">CA /40</th>
                <th className="py-3 text-right">Exam /60</th>
                <th className="py-3 text-right">Total /100</th>
                <th className="py-3 text-center">Grade</th>
                <th className="py-3">Remark</th>
              </tr>
            </thead>
            <tbody>
              {result.subjects.map((s) => (
                <tr key={s.subject} className="border-b border-border/60">
                  <td className="py-3 font-medium">{s.subject}</td>
                  <td className="py-3 text-right font-mono">{s.ca}</td>
                  <td className="py-3 text-right font-mono">{s.exam}</td>
                  <td className="py-3 text-right font-mono font-semibold">{s.total}</td>
                  <td className="py-3 text-center">
                    <span className={`inline-grid h-7 w-7 place-items-center rounded-md text-xs font-bold ${gradeBg(s.grade)}`}>{s.grade}</span>
                  </td>
                  <td className="py-3 text-muted-foreground">{s.remark}</td>
                </tr>
              ))}
              <tr className="bg-muted/40">
                <td className="py-3 font-display font-semibold">Total / Average</td>
                <td colSpan={2} />
                <td className="py-3 text-right font-mono font-bold">{total}</td>
                <td className="py-3 text-center font-display font-bold text-primary">{avg}%</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
        <div className="grid gap-px bg-border sm:grid-cols-2">
          <InfoCell label="Teacher's remark" value={result.teacherRemark} />
          <InfoCell label="Principal's remark" value={result.principalRemark} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4 text-xs text-muted-foreground">
          <span>Attendance: {result.attendance.present}/{result.attendance.total} days</span>
          <span>PIN: <span className="font-mono">{result.pin}</span></span>
        </div>
      </Card>
    </div>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-card px-5 py-4">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-medium ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function gradeBg(g: string) {
  switch (g) {
    case "A": return "bg-success/15 text-success";
    case "B": return "bg-primary/15 text-primary";
    case "C": return "bg-accent/25 text-accent-foreground";
    case "D": return "bg-warning/20 text-warning-foreground";
    default: return "bg-destructive/15 text-destructive";
  }
}
