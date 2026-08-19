import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Trophy, Crown, Star, Quote, Filter, Medal, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getCurrentAcademicSession } from "@/lib/utils";
import {
  computeGlobalWallOfFameDb,
  computeGlobalClassWallOfFameDb,
} from "@/lib/api/db.functions";

type GlobalPerformer = {
  student_id: number;
  student_name: string;
  class_level: string;
  school_name: string;
  city: string;
  session: string;
  photo_url?: string;
  average_score: number;
};

type ClassPerformer = {
  school_id: number;
  school_name: string;
  city: string;
  class_level: string;
  session: string;
  average_score: number;
};

export const Route = createFileRoute("/wall-of-fame")({
  head: () => ({
    meta: [
      { title: "Wall of Fame — iCademia" },
      {
        name: "description",
        content:
          "Celebrating the brightest students across iCademia partner schools — crested each academic session for excellence in academics, sports and the arts.",
      },
      { property: "og:title", content: "Wall of Fame — iCademia" },
      {
        property: "og:description",
        content:
          "Top performers of every academic session, immortalised on the iCademia Wall of Fame.",
      },
    ],
  }),
  component: WallOfFame,
});

const CATEGORIES = ["All", "JSS1", "JSS2", "JSS3", "SSS1", "SSS2", "SSS3", "Primary"] as const;
type Category = (typeof CATEGORIES)[number];

function WallOfFame() {
  const [viewMode, setViewMode] = useState<"students" | "classes">("students");
  const [category, setCategory] = useState<Category>("All");
  const [selected, setSelected] = useState<GlobalPerformer | null>(null);
  const [performers, setPerformers] = useState<GlobalPerformer[]>([]);
  const [classPerformers, setClassPerformers] = useState<ClassPerformer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const currentSession = getCurrentAcademicSession();
        const [studentData, classData] = await Promise.all([
          computeGlobalWallOfFameDb({ data: { session: currentSession, limit: 200 } }),
          computeGlobalClassWallOfFameDb({ data: { session: currentSession, limit: 100 } }),
        ]);
        setPerformers(studentData as unknown as GlobalPerformer[]);
        setClassPerformers(classData as unknown as ClassPerformer[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    if (category === "All") return performers;
    return performers.filter((s) => s.class_level.toUpperCase().includes(category.toUpperCase()));
  }, [category, performers]);

  const filteredClasses = useMemo(() => {
    if (category === "All") return classPerformers;
    return classPerformers.filter((c) => c.class_level.toUpperCase().includes(category.toUpperCase()));
  }, [category, classPerformers]);

  const top = filtered.length > 0 ? filtered[0] : null;
  const rest = filtered.length > 1 ? filtered.slice(1) : [];

  const topClass = filteredClasses.length > 0 ? filteredClasses[0] : null;
  const restClasses = filteredClasses.length > 1 ? filteredClasses.slice(1) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden gradient-academic">
          <img
            src="/nigerian-students-study.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/80 to-primary/65" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "28px 28px",
            }}
          />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-16 text-center text-primary-foreground sm:px-6 sm:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
              <Medal className="h-3.5 w-3.5 text-accent" /> {getCurrentAcademicSession()} Session · Verified honours
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">
              The{" "}
              <span className="bg-gradient-to-r from-accent to-[oklch(0.88_0.10_75)] bg-clip-text text-transparent">
                Wall of Fame
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/75 sm:text-lg">
              A permanent, verified archive of distinction—recognising achievement with the
              student's school, category, session and performance record.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-5 text-xs text-white/65">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-accent" /> School-approved records
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-accent" /> Session-based honours
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Medal className="h-4 w-4 text-accent" /> Multiple award categories
              </span>
            </div>
          </div>
        </section>

        {/* Featured — Overall Best */}
        {viewMode === "students" && top && (
          <section className="mx-auto -mt-14 w-full max-w-5xl px-4 sm:-mt-16 sm:px-6">
            <Card className="border-border bg-card p-6 shadow-elegant ring-1 ring-accent/30 sm:p-8">
              <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr_auto] sm:gap-8">
                <div className="relative mx-auto">
                  <div className="absolute -inset-2 rounded-full bg-accent/40 blur-xl" />
                  <img
                    src={top.photo_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${top.student_id}&backgroundColor=f1f5f9`}
                    alt={top.student_name}
                    className="relative h-28 w-28 rounded-full border-4 border-accent bg-white shadow-elegant sm:h-32 sm:w-32 object-cover"
                    loading="lazy"
                    width={128}
                    height={128}
                  />
                  <span className="absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground shadow-elegant">
                    <Crown className="h-5 w-5" />
                  </span>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Overall Best — {top.class_level}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {top.student_name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {top.school_name} ({top.city}) · {top.session}
                  </p>
                  <blockquote className="mt-3 flex items-start gap-2 text-sm italic text-foreground/80">
                    <Quote className="h-4 w-4 shrink-0 text-accent" />
                    <span>Leading the global leaderboard across all partner schools for {top.class_level}.</span>
                  </blockquote>
                </div>
                <div className="text-center">
                  <p className="font-display text-4xl font-bold text-primary sm:text-5xl">
                    {top.average_score}%
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    Session average
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {viewMode === "classes" && topClass && (
          <section className="mx-auto -mt-14 w-full max-w-5xl px-4 sm:-mt-16 sm:px-6">
            <Card className="border-border bg-card p-6 shadow-elegant ring-1 ring-accent/30 sm:p-8">
              <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr_auto] sm:gap-8">
                <div className="relative mx-auto">
                  <div className="absolute -inset-2 rounded-full bg-accent/40 blur-xl" />
                  <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-accent bg-white shadow-elegant sm:h-32 sm:w-32">
                    <Crown className="h-12 w-12 text-accent" />
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Best Performing Class — {topClass.class_level}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                    {topClass.school_name}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {topClass.city} · {topClass.session}
                  </p>
                  <blockquote className="mt-3 flex items-start gap-2 text-sm italic text-foreground/80">
                    <Quote className="h-4 w-4 shrink-0 text-accent" />
                    <span>This class boasts the highest combined academic average of all {topClass.class_level} classes across the global network.</span>
                  </blockquote>
                </div>
                <div className="text-center">
                  <p className="font-display text-4xl font-bold text-primary sm:text-5xl">
                    {topClass.average_score}%
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    Class average
                  </p>
                </div>
              </div>
            </Card>
          </section>
        )}

        {/* Filter & View Mode */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-border pb-6">
            <div className="flex rounded-lg bg-muted/40 p-1 ring-1 ring-border">
              <button
                type="button"
                onClick={() => setViewMode("students")}
                className={cn(
                  "rounded-md px-5 py-2 text-sm font-semibold transition-all",
                  viewMode === "students" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Top Students
              </button>
              <button
                type="button"
                onClick={() => setViewMode("classes")}
                className={cn(
                  "rounded-md px-5 py-2 text-sm font-semibold transition-all",
                  viewMode === "classes" ? "bg-white text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Top Classes
              </button>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <span className="mr-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Filter className="h-3.5 w-3.5" /> Filter
              </span>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                    category === c
                      ? "border-primary bg-primary text-primary-foreground shadow-elegant"
                      : "border-border bg-card text-foreground/70 hover:border-primary/30 hover:text-foreground",
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Honour roll */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-6 pb-20 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary">
                Honour Roll
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {viewMode === "students" ? `Top performers, ${getCurrentAcademicSession()}` : `Top performing classes, ${getCurrentAcademicSession()}`}
              </h3>
            </div>
            <p className="text-sm text-muted-foreground">
              {viewMode === "students" ? filtered.length : filteredClasses.length} {viewMode === "students" ? "crested" : "ranked"} {category !== "All" ? `in ${category}` : (viewMode === "students" ? "students" : "classes")}
            </p>
          </div>
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading the global leaderboard...</div>
          ) : viewMode === "students" ? (
            rest.length === 0 ? (
              <Card className="border-dashed p-10 text-center text-sm text-muted-foreground">
                No crested students in this category yet.
              </Card>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((s, idx) => (
                  <button
                    key={s.student_id}
                    type="button"
                    onClick={() => setSelected(s)}
                    className="group text-left"
                  >
                    <Card className="h-full border-border p-6 shadow-card transition-all group-hover:-translate-y-1 group-hover:shadow-elegant">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <img
                            src={s.photo_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${s.student_id}&backgroundColor=f1f5f9`}
                            alt={s.student_name}
                            className="h-14 w-14 shrink-0 rounded-full border-2 border-primary/20 bg-white object-cover"
                            loading="lazy"
                            width={56}
                            height={56}
                          />
                          <div className="min-w-0">
                            <h4 className="font-display text-lg font-bold truncate">{s.student_name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{s.school_name}</p>
                          </div>
                        </div>
                        <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                          #{idx + 2}
                        </span>
                      </div>
                      <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
                        <Star className="h-3.5 w-3.5 fill-current" />{" "}
                        <span className="truncate">Top Performer</span>
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {s.class_level}
                        </span>
                        <span className="font-display text-lg font-bold">{s.average_score}%</span>
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
            )
          ) : (
            restClasses.length === 0 ? (
              <Card className="border-dashed p-10 text-center text-sm text-muted-foreground">
                No ranked classes in this category yet.
              </Card>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {restClasses.map((c, idx) => (
                  <Card key={`${c.school_id}-${c.class_level}`} className="h-full border-border p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border-2 border-primary/20 bg-muted">
                          <Crown className="h-6 w-6 text-primary/60" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-display text-lg font-bold truncate">{c.school_name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{c.city} · {c.class_level}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                        #{idx + 2}
                      </span>
                    </div>
                    <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Class Average
                      </span>
                      <span className="font-display text-lg font-bold">{c.average_score}%</span>
                    </div>
                  </Card>
                ))}
              </div>
            )
          )}
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card sm:p-10">
            <Trophy className="mx-auto h-10 w-10 text-accent" />
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Is your school not yet on the wall?
            </h3>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Partner with iCademia and your top students get crested at the end of every academic
              session — for life.
            </p>
            <Button
              asChild
              size="lg"
              className="mt-6 gradient-primary text-primary-foreground shadow-elegant"
            >
              <a href="/register-school">Become a partner school</a>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />

      {/* Detail modal */}
      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setSelected(null)}
          className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm animate-in fade-in"
        >
          <Card
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden border-border p-0 shadow-elegant"
          >
            <div className="gradient-academic p-6 text-center text-primary-foreground">
              <img
                src={selected.photo_url || `https://api.dicebear.com/7.x/notionists/svg?seed=${selected.student_id}&backgroundColor=f1f5f9`}
                alt={selected.student_name}
                className="mx-auto h-24 w-24 rounded-full border-4 border-accent bg-white object-cover"
                width={96}
                height={96}
              />
              <h3 className="mt-4 font-display text-2xl font-bold">{selected.student_name}</h3>
              <p className="text-sm text-white/70">
                {selected.school_name} · {selected.class_level}
              </p>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Global Top Performer
              </p>
              <blockquote className="mt-3 flex items-start gap-2 text-sm italic text-foreground/80">
                <Quote className="h-4 w-4 shrink-0 text-accent" />
                <span>An outstanding academic performance in the {selected.session} session.</span>
              </blockquote>
              <div className="mt-6 grid grid-cols-2 gap-3 text-center">
                <Stat label="Average Score" value={`${selected.average_score}%`} />
                <Stat label="Class Level" value={selected.class_level} />
              </div>
              <Button className="mt-6 w-full" variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-sm font-bold">{value}</p>
    </div>
  );
}
