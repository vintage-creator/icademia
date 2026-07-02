import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, KeyRound, Upload, Trophy, Users, Sparkles, GraduationCap, Presentation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PIN_PRICE_NGN, PLATFORM_FEE_NGN } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "iCademia — Where Schools, Parents and Students Meet" },
      { name: "description", content: "iCademia is the academic community platform for African schools — result checking, teacher training conferences, inter-school competitions and a virtual Wall of Fame." },
      { property: "og:title", content: "iCademia — Where Schools, Parents and Students Meet" },
      { property: "og:description", content: "More than result checking. Conferences, competitions and a Wall of Fame that celebrates the best of every session." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: KeyRound, title: "iCademia Scratch Cards", body: "We print and distribute secure PIN scratch cards. Schools sell for ₦2,500 — we take ₦1,000 to keep the platform running, the rest goes to the school." },
  { icon: Upload, title: "Result & document uploads", body: "Teachers upload scores, answer scripts, testimonials and transcripts — organised per class, term and session." },
  { icon: Presentation, title: "Teacher training conferences", body: "We host conferences and masterclasses to train the teachers who train the children — because the foundation must be right." },
  { icon: Trophy, title: "Wall of Fame", body: "Top performers of every academic session are crested on our virtual Wall of Fame — for life." },
  { icon: ShieldCheck, title: "Encrypted end-to-end", body: "Every result, PIN and document is encrypted at rest and in transit. Role-based access keeps records scoped." },
  { icon: Users, title: "One school community", body: "Administrators, form teachers, head teachers, parents and students — one platform, distinct dashboards, seamless flow." },
];

const stats = [
  { v: "1,284", l: "Students on iCademia" },
  { v: "64", l: "Trained teachers" },
  { v: "1,480", l: "PINs issued" },
  { v: "8", l: "Partner schools" },
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
          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-32">
            <div className="text-primary-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Train a child · Build a nation
              </span>
              <h1 className="mt-6 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
                One platform for the<br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-accent to-[oklch(0.88_0.10_75)] bg-clip-text text-transparent">whole school community.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base text-white/75 sm:text-lg">
                iCademia goes beyond result checking. We connect primary and secondary schools, parents and students — through secure results, teacher training conferences, inter-school competitions and a virtual Wall of Fame that celebrates excellence.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/check-result">
                    Check a result <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                  <Link to="/register-school">Register your school</Link>
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
            <div className="relative mt-4 lg:mt-0">
              <div className="absolute -inset-6 -z-10 rounded-3xl bg-accent/20 blur-3xl" />
              <div className="rotate-1 rounded-2xl bg-card p-5 shadow-elegant ring-1 ring-white/10 sm:p-6">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Term Report</p>
                    <p className="font-display text-lg font-semibold truncate">Adaeze Okonkwo</p>
                    <p className="text-xs text-muted-foreground truncate">JSS 2 · 2024/2025 · Second Term</p>
                  </div>
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg gradient-primary text-primary-foreground">
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
                      <span className="text-foreground/80 truncate">{s}</span>
                      <span className="flex items-center gap-3 shrink-0">
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
        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">Why iCademia</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Beyond result checking — the academic community platform.</h2>
            <p className="mt-4 text-muted-foreground">Because getting the foundation right takes more than a report card. We join the efforts of schools and parents to nurture the next generation.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant sm:p-7">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scratch card pricing */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
          <div className="grid gap-8 rounded-3xl border border-border bg-card p-6 shadow-card sm:p-10 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary">How the scratch card works</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">iCademia prints the cards. Schools sell them.</h2>
              <p className="mt-4 text-muted-foreground">To keep the platform secure, fair and sustainable, iCademia is the sole issuer of scratch-card PINs. Schools receive branded card batches, sell to parents, and keep most of the revenue.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="gradient-primary text-primary-foreground shadow-elegant">
                  <Link to="/register-school">Order scratch cards</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/check-result">Try the checker</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <PriceStat label="Card price" value={`₦${PIN_PRICE_NGN.toLocaleString()}`} sub="per PIN card" tone="primary" />
              <PriceStat label="School earns" value={`₦${(PIN_PRICE_NGN - PLATFORM_FEE_NGN).toLocaleString()}`} sub="revenue to school" tone="success" />
              <PriceStat label="iCademia fee" value={`₦${PLATFORM_FEE_NGN.toLocaleString()}`} sub="platform & printing" tone="accent" />
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="relative overflow-hidden rounded-3xl gradient-academic px-6 py-14 text-center sm:px-16 sm:py-16">
            <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "24px 24px" }} />
            <div className="relative mx-auto max-w-2xl text-primary-foreground">
              <GraduationCap className="mx-auto h-10 w-10 text-accent" />
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Bring your school into the community.</h2>
              <p className="mt-4 text-white/75">Get set up in minutes — order scratch cards, publish results, and be part of our next teacher training conference.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link to="/register-school">Register your school</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                  <Link to="/conferences">See conferences</Link>
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

function PriceStat({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: "primary" | "success" | "accent" }) {
  const bg = tone === "primary" ? "bg-primary/10 text-primary" : tone === "success" ? "bg-success/15 text-success" : "bg-accent/25 text-accent-foreground";
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5">
      <p className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${bg}`}>{label}</p>
      <p className="mt-3 font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function GradePill() {
  return <span className="font-display text-lg font-bold">A</span>;
}
