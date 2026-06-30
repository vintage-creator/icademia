import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Crown, Sparkles, Star } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { HALL_OF_FAME } from "@/lib/mock-data";

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

function WallOfFame() {
  const top = HALL_OF_FAME[0];
  const rest = HALL_OF_FAME.slice(1);
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden gradient-academic">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
          <div className="relative mx-auto w-full max-w-7xl px-6 py-20 text-center text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> 2024/2025 Session
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl font-display text-5xl font-bold tracking-tight sm:text-6xl">
              The <span className="bg-gradient-to-r from-accent to-[oklch(0.88_0.10_75)] bg-clip-text text-transparent">Wall of Fame</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/75">
              Every session, iCademia honours the students who set the bar — across academics, the arts, sports and innovation.
            </p>
          </div>
        </section>

        <section className="mx-auto -mt-16 w-full max-w-5xl px-6">
          <Card className="border-border bg-card p-8 shadow-elegant ring-1 ring-accent/30">
            <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr_auto]">
              <div className="mx-auto grid h-28 w-28 place-items-center rounded-full gradient-primary text-primary-foreground shadow-elegant">
                <Crown className="h-12 w-12" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-semibold uppercase tracking-widest text-accent-foreground">{top.award}</p>
                <h2 className="mt-1 font-display text-3xl font-bold tracking-tight">{top.name}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{top.school} · {top.className} · {top.session}</p>
              </div>
              <div className="text-center">
                <p className="font-display text-5xl font-bold text-primary">{top.avg}%</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Session average</p>
              </div>
            </div>
          </Card>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-20">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-wider text-primary">Honour Roll</p>
              <h3 className="mt-2 font-display text-3xl font-bold tracking-tight">Top performers, 2024/2025</h3>
            </div>
            <p className="hidden text-sm text-muted-foreground sm:block">Crested across partner schools</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((s) => (
              <Card key={s.rank} className="group border-border p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant">
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-2xl">{s.emoji}</span>
                  <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">#{s.rank}</span>
                </div>
                <h4 className="mt-5 font-display text-xl font-bold">{s.name}</h4>
                <p className="mt-1 text-xs text-muted-foreground">{s.school} · {s.className}</p>
                <p className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary"><Star className="h-3.5 w-3.5 fill-current" /> {s.award}</p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Avg</span>
                  <span className="font-display text-lg font-bold">{s.avg}%</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 pb-24">
          <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-card">
            <Trophy className="mx-auto h-10 w-10 text-accent" />
            <h3 className="mt-4 font-display text-3xl font-bold tracking-tight">Is your school not yet on the wall?</h3>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Partner with iCademia and your top students get crested at the end of every academic session — for life.</p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
