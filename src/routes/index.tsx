import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, KeyRound, Upload, BarChart3, Lock, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "iCademia — Secure School Result Management" },
      { name: "description", content: "Manage student records, upload results, issue scratch-card PINs, and let parents check results online — all in one secure platform." },
      { property: "og:title", content: "iCademia — Secure School Result Management" },
      { property: "og:description", content: "A centralized, encrypted result management platform for primary, secondary, and tertiary institutions." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: ShieldCheck, title: "Encrypted end-to-end", body: "All records and PINs are encrypted at rest and in transit. Role-based access keeps data scoped." },
  { icon: KeyRound, title: "Scratch-card PINs", body: "Generate batches of single- or multi-use PINs. Track issuance, usage, and revocation in real time." },
  { icon: Upload, title: "Teacher uploads", body: "Assigned teachers enter scores per subject with auto grading, term averages, and class positions." },
  { icon: BarChart3, title: "Insightful dashboards", body: "Track performance per class, subject, and term. Spot trends before report cards go out." },
  { icon: Lock, title: "Parent access", body: "Parents check results using a PIN + reg number — no account creation, no friction." },
  { icon: Users, title: "Multi-school ready", body: "Run one school or a whole group. Sessions, terms, classes, and users are fully configurable." },
];

const stats = [
  { v: "1,284", l: "Students managed" },
  { v: "64", l: "Active teachers" },
  { v: "1,480", l: "PINs issued" },
  { v: "99.97%", l: "Uptime SLA" },
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-academic" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1.1fr_1fr] lg:py-32">
            <div className="text-primary-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                New · Term 2 grading sheets are live
              </span>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Result management,<br />
                <span className="bg-gradient-to-r from-accent to-[oklch(0.88_0.10_75)] bg-clip-text text-transparent">securely delivered.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/75">
                A centralized platform for schools to upload results, issue scratch-card PINs, and give students and parents instant, private access to grades.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/check-result">
                    Check a result <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                  <Link to="/dashboard">Explore admin dashboard</Link>
                </Button>
              </div>
              <dl className="mt-14 grid max-w-lg grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
                {stats.map((s) => (
                  <div key={s.l}>
                    <dt className="font-display text-2xl font-semibold text-accent">{s.v}</dt>
                    <dd className="text-xs uppercase tracking-wider text-white/60">{s.l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Mock result card */}
            <div className="relative">
              <div className="absolute -inset-6 -z-10 rounded-3xl bg-accent/20 blur-3xl" />
              <div className="rotate-1 rounded-2xl bg-card p-6 shadow-elegant ring-1 ring-white/10">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Term Report</p>
                    <p className="font-display text-lg font-semibold">Adaeze Okonkwo</p>
                    <p className="text-xs text-muted-foreground">JSS 2 · 2024/2025 · Second Term</p>
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-lg gradient-primary text-primary-foreground">
                    <GradePill />
                  </div>
                </div>
                <ul className="mt-4 space-y-2.5 text-sm">
                  {[
                    ["Mathematics", 83, "A"],
                    ["English Language", 78, "A"],
                    ["Basic Science", 90, "A"],
                    ["Social Studies", 78, "A"],
                    ["Computer Studies", 90, "A"],
                  ].map(([s, t, g]) => (
                    <li key={s as string} className="flex items-center justify-between">
                      <span className="text-foreground/80">{s}</span>
                      <span className="flex items-center gap-3">
                        <span className="font-mono text-foreground">{t}</span>
                        <span className="grid h-6 w-6 place-items-center rounded-md bg-success/15 text-xs font-semibold text-success">{g}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 flex items-center justify-between rounded-lg bg-muted px-4 py-3">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Position</span>
                  <span className="font-display text-base font-semibold">3rd of 42</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-7xl px-6 py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">Why iCademia</p>
            <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Built for the realities of running a school.</h2>
            <p className="mt-4 text-muted-foreground">From staff workflows to parent communication — every piece is designed to feel calm and trustworthy.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-7xl px-6 pb-24">
          <div className="relative overflow-hidden rounded-3xl gradient-academic px-8 py-16 text-center sm:px-16">
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
            <div className="relative mx-auto max-w-2xl text-primary-foreground">
              <h2 className="font-display text-4xl font-semibold tracking-tight">Ready to issue this term's results?</h2>
              <p className="mt-4 text-white/75">Set up your school in minutes. Generate PIN batches and let parents check results the same day.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/dashboard">Open dashboard</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                  <Link to="/check-result">Try the PIN checker</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function GradePill() {
  return <span className="font-display text-lg font-bold">A</span>;
}
