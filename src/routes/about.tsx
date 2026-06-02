import { createFileRoute } from "@tanstack/react-router";
import { Target, Heart, ShieldCheck, Globe, Award, Lightbulb } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — ScholarGrade" },
      { name: "description", content: "Learn about ScholarGrade, our mission, and our founder Nmesoma Ajaero." },
    ],
  }),
  component: AboutPage,
});

const values = [
  { icon: ShieldCheck, title: "Trust & Security", body: "Every record is encrypted. Every PIN is traceable. We build systems schools can stake their reputation on." },
  { icon: Heart, title: "Student-Centered", body: "Results shape futures. Our platform ensures accuracy, fairness, and clarity in every grade published." },
  { icon: Globe, title: "Accessibility", body: "Parents check results from anywhere — no app install, no account creation, just a PIN and a reg number." },
  { icon: Award, title: "Excellence", body: "From primary schools to universities, we uphold the highest standard in academic record management." },
  { icon: Target, title: "Precision", body: "Auto-grading, class rankings, and term averages — computed instantly, with zero manual errors." },
  { icon: Lightbulb, title: "Innovation", body: "We continuously improve our platform to serve the evolving needs of modern educational institutions." },
];

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-academic" />
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
          <div className="relative mx-auto w-full max-w-7xl px-6 py-20 text-center lg:py-28">
            <p className="text-sm font-medium uppercase tracking-wider text-accent">About ScholarGrade</p>
            <h1 className="mx-auto mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Built by educators,<br />engineered for scale.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/75">
              ScholarGrade is a secure, centralized result management platform designed for primary schools, secondary schools, colleges, and educational institutions across the globe.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="mx-auto w-full max-w-7xl px-6 py-24">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary">Our Mission</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Empowering schools with transparent, secure academic records.
              </h2>
              <p className="mt-5 text-muted-foreground leading-relaxed">
                We believe every student deserves accurate, timely access to their academic performance — and every school deserves a system that makes that effortless. ScholarGrade bridges the gap between administrative efficiency and parent satisfaction by delivering a platform that is both powerful and delightfully simple to use.
              </p>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                From scratch-card PIN generation to real-time result checking, from bulk uploads to insightful dashboards — we handle the complexity so schools can focus on what matters most: educating the next generation.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/10 blur-2xl" />
              <div className="rounded-2xl bg-card p-8 shadow-elegant ring-1 ring-border">
                <div className="flex items-center gap-4">
                  <div className="grid h-14 w-14 place-items-center rounded-xl gradient-primary text-primary-foreground">
                    <Globe className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-display text-xl font-semibold">Trusted by schools worldwide</p>
                    <p className="text-sm text-muted-foreground">Serving institutions across Africa, Europe, and beyond.</p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    { v: "50+", l: "Schools" },
                    { v: "12K+", l: "Students" },
                    { v: "99.9%", l: "Uptime" },
                  ].map((s) => (
                    <div key={s.l} className="rounded-xl bg-muted p-4 text-center">
                      <p className="font-display text-2xl font-semibold text-foreground">{s.v}</p>
                      <p className="text-xs text-muted-foreground">{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Founder */}
        <section className="bg-muted/40">
          <div className="mx-auto w-full max-w-7xl px-6 py-24">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
              <div className="flex flex-col items-center lg:items-start">
                <Avatar className="h-48 w-48 ring-4 ring-primary/20 ring-offset-4 ring-offset-background shadow-elegant">
                  <AvatarImage src="/nmesoma-ajaero.jpg" alt="Nmesoma Ajaero" />
                  <AvatarFallback className="font-display text-4xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
                    NA
                  </AvatarFallback>
                </Avatar>
                <div className="mt-8 text-center lg:text-left">
                  <h2 className="font-display text-3xl font-semibold tracking-tight">Nmesoma Ajaero</h2>
                  <p className="mt-1 text-primary font-medium">Founder & CEO, ScholarGrade</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-primary">Meet the Founder</p>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">
                  A vision born from the classroom.
                </h3>
                <p className="mt-5 text-muted-foreground leading-relaxed">
                  Nmesoma Ajaero founded ScholarGrade with a clear mission: to eliminate the chaos of paper-based result management and give every school a secure, digital alternative. With a deep background in education technology and a passion for student success, she saw firsthand how delays, errors, and insecure processes were undermining trust between schools and families.
                </p>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  Under her leadership, ScholarGrade has grown from a simple result-checker into a full-stack academic management platform — serving schools with tools for grading, PIN issuance, analytics, and parent communication. Nmesoma remains deeply involved in product strategy, ensuring every feature reflects the real-world needs of educators and administrators.
                </p>
                <blockquote className="mt-6 border-l-4 border-accent bg-accent/5 pl-5 py-3 rounded-r-lg">
                  <p className="italic text-foreground/90">
                    "Every student deserves to see their progress clearly. Every parent deserves peace of mind. And every school deserves a system that just works."
                  </p>
                  <p className="mt-2 text-sm font-medium text-muted-foreground">— Nmesoma Ajaero</p>
                </blockquote>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="mx-auto w-full max-w-7xl px-6 py-24">
          <div className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">What We Stand For</p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Our Core Values</h2>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant">
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
