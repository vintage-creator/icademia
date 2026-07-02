import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trophy, Crown, Sparkles, Star, Quote, Filter } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HALL_OF_FAME, HALL_OF_FAME_AVATAR, type HallOfFameEntry } from "@/lib/mock-data";

export const Route = createFileRoute("/wall-of-fame")({
  head: () => ({
    meta: [
      { title: "Wall of Fame — iCademia" },
      { name: "description", content: "Celebrating the brightest students across iCademia partner schools — crested each academic session for excellence in academics, sports and the arts." },
      { property: "og:title", content: "Wall of Fame — iCademia" },
      { property: "og:description", content: "Top performers of every academic session, immortalised on the iCademia Wall of Fame." },
    ],
  }),
  component: WallOfFame,
});

const CATEGORIES = ["All", "Academics", "STEM", "Arts", "Languages", "Innovation"] as const;
type Category = typeof CATEGORIES[number];

function WallOfFame() {
  const [category, setCategory] = useState<Category>("All");
  const [selected, setSelected] = useState<HallOfFameEntry | null>(null);
  const top = HALL_OF_FAME[0];
  const rest = HALL_OF_FAME.slice(1);

  const filtered = useMemo(
    () => (category === "All" ? rest : rest.filter((s) => s.category === category)),
    [category, rest]
  );

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden gradient-academic">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-16 text-center text-primary-foreground sm:px-6 sm:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> 2024/2025 Session
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-6xl">
              The <span className="bg-gradient-to-r from-accent to-[oklch(0.88_0.10_75)] bg-clip-text text-transparent">Wall of Fame</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-white/75 sm:text-lg">
              Every session, iCademia honours the students who set the bar — across academics, the arts, sports and innovation.
            </p>
          </div>
        </section>

        {/* Featured — Overall Best */}
        <section className="mx-auto -mt-14 w-full max-w-5xl px-4 sm:-mt-16 sm:px-6">
          <Card className="border-border bg-card p-6 shadow-elegant ring-1 ring-accent/30 sm:p-8">
            <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr_auto] sm:gap-8">
              <div className="relative mx-auto">
                <div className="absolute -inset-2 rounded-full bg-accent/40 blur-xl" />
                <img
                  src={HALL_OF_FAME_AVATAR(top.avatarSeed)}
                  alt={top.name}
                  className="relative h-28 w-28 rounded-full border-4 border-accent bg-white shadow-elegant sm:h-32 sm:w-32"
                  loading="lazy"
                  width={128}
                  height={128}
                />
                <span className="absolute -bottom-1 -right-1 grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground shadow-elegant">
                  <Crown className="h-5 w-5" />
                </span>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{top.award}</p>
                <h2 className="mt-1 font-display text-2xl font-bold tracking-tight sm:text-3xl">{top.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{top.school} · {top.className} · {top.session}</p>
                <blockquote className="mt-3 flex items-start gap-2 text-sm italic text-foreground/80">
                  <Quote className="h-4 w-4 shrink-0 text-accent" />
                  <span>{top.quote}</span>
                </blockquote>
              </div>
              <div className="text-center">
                <p className="font-display text-4xl font-bold text-primary sm:text-5xl">{top.avg}%</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Session average</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Filter */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-16 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
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
                    : "border-border bg-card text-foreground/70 hover:border-primary/30 hover:text-foreground"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        {/* Honour roll */}
        <section className="mx-auto w-full max-w-7xl px-4 pt-6 pb-20 sm:px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary">Honour Roll</p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">Top performers, 2024/2025</h3>
            </div>
            <p className="text-sm text-muted-foreground">{filtered.length} crested {category !== "All" ? `in ${category}` : "students"}</p>
          </div>
          {filtered.length === 0 ? (
            <Card className="border-dashed p-10 text-center text-sm text-muted-foreground">
              No crested students in this category yet.
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <button
                  key={s.rank}
                  type="button"
                  onClick={() => setSelected(s)}
                  className="group text-left"
                >
                  <Card className="h-full border-border p-6 shadow-card transition-all group-hover:-translate-y-1 group-hover:shadow-elegant">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <img
                          src={HALL_OF_FAME_AVATAR(s.avatarSeed)}
                          alt={s.name}
                          className="h-14 w-14 shrink-0 rounded-full border-2 border-primary/20 bg-white"
                          loading="lazy"
                          width={56}
                          height={56}
                        />
                        <div className="min-w-0">
                          <h4 className="font-display text-lg font-bold truncate">{s.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{s.school}</p>
                        </div>
                      </div>
                      <span className="shrink-0 rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">#{s.rank}</span>
                    </div>
                    <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary">
                      <Star className="h-3.5 w-3.5 fill-current" /> <span className="truncate">{s.award}</span>
                    </p>
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{s.category}</span>
                      <span className="font-display text-lg font-bold">{s.avg}%</span>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-card sm:p-10">
            <Trophy className="mx-auto h-10 w-10 text-accent" />
            <h3 className="mt-4 font-display text-2xl font-bold tracking-tight sm:text-3xl">Is your school not yet on the wall?</h3>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Partner with iCademia and your top students get crested at the end of every academic session — for life.</p>
            <Button asChild size="lg" className="mt-6 gradient-primary text-primary-foreground shadow-elegant">
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
                src={HALL_OF_FAME_AVATAR(selected.avatarSeed)}
                alt={selected.name}
                className="mx-auto h-24 w-24 rounded-full border-4 border-accent bg-white"
                width={96}
                height={96}
              />
              <h3 className="mt-4 font-display text-2xl font-bold">{selected.name}</h3>
              <p className="text-sm text-white/70">{selected.school} · {selected.className}</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">{selected.award}</p>
              <blockquote className="mt-3 flex items-start gap-2 text-sm italic text-foreground/80">
                <Quote className="h-4 w-4 shrink-0 text-accent" />
                <span>{selected.quote}</span>
              </blockquote>
              <div className="mt-6 grid grid-cols-3 gap-3 text-center">
                <Stat label="Rank" value={`#${selected.rank}`} />
                <Stat label="Average" value={`${selected.avg}%`} />
                <Stat label="Category" value={selected.category} />
              </div>
              <Button className="mt-6 w-full" variant="outline" onClick={() => setSelected(null)}>Close</Button>
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
