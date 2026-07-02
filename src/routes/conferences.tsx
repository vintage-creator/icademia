import { createFileRoute, Link } from "@tanstack/react-router";
import { Presentation, MapPin, CalendarDays, Users, Sparkles, GraduationCap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CONFERENCES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/conferences")({
  head: () => ({
    meta: [
      { title: "Teacher Conferences — iCademia" },
      { name: "description", content: "iCademia hosts conferences and masterclasses to train and encourage teachers — because at the foundation, we need to get it right." },
      { property: "og:title", content: "iCademia Teacher Conferences" },
      { property: "og:description", content: "Training the teachers who train the children — one conference, one classroom at a time." },
    ],
  }),
  component: Conferences,
});

function Conferences() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden gradient-academic">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 text-primary-foreground sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-accent" /> Teacher training programme
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Training the teachers who <span className="bg-gradient-to-r from-accent to-[oklch(0.88_0.10_75)] bg-clip-text text-transparent">train the nation.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
                Foundational education is the most important work in any country. iCademia hosts conferences, masterclasses and retreats to sharpen the pedagogy, mental health and leadership of the teachers behind our classrooms.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90">
                  <a href="#upcoming">See upcoming events</a>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/25 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground">
                  <Link to="/register-school">Bring your school</Link>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 self-center">
              <Metric icon={Users} label="Teachers trained" value="1,200+" />
              <Metric icon={GraduationCap} label="Schools reached" value="86" />
              <Metric icon={Presentation} label="Sessions held" value="24" />
              <Metric icon={CalendarDays} label="Upcoming in 2025" value="3" />
            </div>
          </div>
        </section>

        {/* Upcoming */}
        <section id="upcoming" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">Programme</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Upcoming conferences</h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">Curated for primary and secondary school educators. Every event is capped so the workshops stay hands-on.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {CONFERENCES.map((c) => {
              const concluded = c.status === "Concluded";
              const waitlist = c.status === "Waitlist";
              return (
                <Card key={c.id} className={cn("border-border p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant", concluded && "opacity-70")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">{c.focus}</p>
                      <h3 className="mt-1 font-display text-xl font-bold tracking-tight">{c.title}</h3>
                    </div>
                    <span className={cn(
                      "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      c.status === "Registration open" && "bg-success/15 text-success",
                      waitlist && "bg-warning/20 text-warning-foreground",
                      concluded && "bg-muted text-muted-foreground",
                    )}>{c.status}</span>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">{c.blurb}</p>
                  <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 text-primary" /> {c.date}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {c.city}</span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> {c.seats} seats</span>
                  </div>
                  <div className="mt-5">
                    <Button
                      disabled={concluded}
                      onClick={() => {
                        if (concluded) return;
                        toast.success(waitlist ? "Added to waitlist" : "Reservation received", {
                          description: `We'll email you with details for ${c.title}. (demo)`,
                        });
                      }}
                      className={cn("w-full", !concluded && "gradient-primary text-primary-foreground shadow-elegant")}
                      variant={concluded ? "outline" : "default"}
                    >
                      {concluded ? "Recap coming soon" : waitlist ? "Join waitlist" : "Reserve a seat"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        {/* What we cover */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
          <div className="rounded-3xl border border-border bg-muted/30 p-6 sm:p-10">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">What we cover</p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Foundation-first pedagogy</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Early literacy and phonics",
                "Classroom mental health & child psychology",
                "Modern subject pedagogy (STEM, Language, Arts)",
                "Assessment design and fair grading",
                "Using AI tools responsibly in the classroom",
                "School leadership, culture and retention",
              ].map((t) => (
                <div key={t} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  <p className="text-sm font-medium">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <Icon className="h-5 w-5 text-accent" />
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wider text-white/60">{label}</p>
    </div>
  );
}
