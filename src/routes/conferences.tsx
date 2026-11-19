import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  MapPin,
  Users,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getConferencesDb } from "@/lib/api/db.functions";

type Conference = {
  id: number;
  title: string;
  description: string;
  event_date: string;
  location: string;
  speaker: string;
  registration_link: string;
};

export const Route = createFileRoute("/conferences")({
  head: () => ({
    meta: [
      { title: "Teacher Conferences — iCademia" },
      {
        name: "description",
        content:
          "Practical iCademia conferences and masterclasses for teachers and school leaders.",
      },
    ],
  }),
  component: Conferences,
});

function Conferences() {
  const [selected, setSelected] = useState<Conference | null>(null);
  const [upcoming, setUpcoming] = useState<Conference[]>([]);
  const [past, setPast] = useState<Conference[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getConferencesDb();
        const confs = data as unknown as Conference[];
        const now = new Date();
        const _upcoming = confs.filter(c => new Date(c.event_date) >= now);
        const _past = confs.filter(c => new Date(c.event_date) < now);
        setUpcoming(_upcoming);
        setPast(_past);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden gradient-academic">
          <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:28px_28px]" />
          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 text-primary-foreground sm:px-6 sm:py-20 lg:grid-cols-[1.15fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
                <BookOpenCheck className="h-3.5 w-3.5 text-accent" /> Teacher development programme
              </span>
              <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Training the teachers who{" "}
                <span className="bg-gradient-to-r from-accent to-[oklch(0.88_0.10_75)] bg-clip-text text-transparent">
                  train the nation.
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base text-white/75 sm:text-lg">
                Practical conferences, masterclasses and retreats that strengthen pedagogy,
                classroom wellbeing, assessment and the leadership behind excellent schools.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto"
                >
                  <a href="#programme">Explore past programmes</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-white/25 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground sm:w-auto"
                >
                  <Link to="/register-school">Bring your school</Link>
                </Button>
              </div>
            </div>
            <div className="relative self-center">
              <div className="absolute -inset-3 -rotate-2 rounded-3xl border border-accent/30" />
              <img
                src="/teacher-training-classroom.png"
                alt="Adult educators participating in a professional-development workshop"
                className="relative h-[25rem] w-full rounded-3xl object-cover shadow-2xl"
              />
              <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-white/15 bg-black/55 p-4 backdrop-blur">
                <p className="text-xs uppercase tracking-wider text-accent">Teacher development</p>
                <p className="mt-1 font-display text-lg font-semibold">
                  Better-supported teachers create stronger classrooms.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="programme" className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mb-8 grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                Previous programmes
              </p>
              <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Built around the realities teachers face.
              </h2>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Registration has closed for the programmes below. Open any event to see its
                audience, learning outcomes and format.
              </p>
            </div>
            {upcoming.length === 0 ? (
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 lg:max-w-sm">
                <div className="flex gap-3">
                  <BellRing className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="text-sm font-semibold">No upcoming event is published yet</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Register your school to receive priority notice when the next conference
                      opens.
                    </p>
                    <Link
                      to="/register-school"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                    >
                      Register your school <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {upcoming.length > 0 ? (
            <div className="mb-12">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-success">
                    Registration notices
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-semibold">Upcoming conferences</h3>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {upcoming.map((conference) => (
                  <button
                    type="button"
                    key={conference.id}
                    onClick={() => setSelected(conference)}
                    className="rounded-2xl border border-success/20 bg-success/5 p-6 text-left transition hover:-translate-y-1 hover:shadow-card"
                  >
                    <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-semibold text-success">
                      Upcoming
                    </span>
                    <h4 className="mt-4 font-display text-xl font-semibold">{conference.title}</h4>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {conference.description}
                    </p>
                    <p className="mt-4 text-xs font-medium text-primary">
                      {conference.event_date
                        ? new Date(conference.event_date).toLocaleDateString()
                        : "Date to be announced"}{" "}
                      · {conference.location || "Location to be announced"}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-6 md:grid-cols-2">
            {past.map((conference) => (
              <button
                type="button"
                key={conference.id}
                onClick={() => setSelected(conference)}
                className="text-left"
              >
                <Card className="h-full border-border p-6 shadow-card transition-all hover:-translate-y-1 hover:border-primary/25 hover:shadow-elegant">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Past Programme
                      </p>
                      <h3 className="mt-1 font-display text-xl font-bold tracking-tight">
                        {conference.title}
                      </h3>
                    </div>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                      Registration closed
                    </span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground line-clamp-3">{conference.description}</p>
                  <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-primary" /> {new Date(conference.event_date).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {conference.location}
                    </span>
                  </div>
                  <div className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    View programme details <ArrowRight className="h-4 w-4" />
                  </div>
                </Card>
              </button>
            ))}
            {loading && <div className="text-muted-foreground">Loading programmes...</div>}
            {!loading && past.length === 0 && <div className="text-muted-foreground">No past programmes.</div>}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6">
          <div className="rounded-3xl border border-border bg-muted/30 p-6 sm:p-10">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              What we cover
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Foundation-first pedagogy
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Early literacy and phonics",
                "Classroom mental health & child psychology",
                "Modern subject pedagogy (STEM, Language, Arts)",
                "Assessment design and fair grading",
                "Using AI tools responsibly in the classroom",
                "School leadership, culture and retention",
              ].map((topic) => (
                <div
                  key={topic}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                >
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
                  <p className="text-sm font-medium">{topic}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />

      <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected ? (
            <>
              <DialogHeader>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {selected.location}
                </p>
                <DialogTitle className="font-display text-2xl">{selected.title}</DialogTitle>
                <DialogDescription>{selected.description}</DialogDescription>
              </DialogHeader>
              <div className="grid gap-3 sm:grid-cols-2">
                <Detail label="Programme date" value={new Date(selected.event_date).toLocaleDateString()} />
                <Detail label="Location" value={selected.location} />
              </div>
              <div className="rounded-2xl bg-muted/45 p-5">
                <p className="font-display font-semibold">What participants work on</p>
                <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                  {[
                    "Practical classroom strategies",
                    "Peer review and facilitated discussion",
                    "Implementation plan for each school",
                    "Resources for continued staff development",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Partner schools will hear about new dates first.
                </p>
                {new Date(selected.event_date) >= new Date() ? (
                  <Button asChild className="w-full sm:w-auto">
                    <a href={selected.registration_link || "#"} target="_blank" rel="noreferrer">Register Now</a>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link to="/register-school">Register for future notices</Link>
                  </Button>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
