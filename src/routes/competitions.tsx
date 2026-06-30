import { createFileRoute } from "@tanstack/react-router";
import { Trophy, Users, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { COMPETITIONS } from "@/lib/mock-data";

export const Route = createFileRoute("/competitions")({
  head: () => ({
    meta: [
      { title: "Competitions — iCademia" },
      { name: "description", content: "Inter-school competitions on iCademia: Math Olympiads, Spelling Bees, Hackathons and more — bringing schools together to celebrate student talent." },
      { property: "og:title", content: "iCademia Competitions" },
      { property: "og:description", content: "Inter-school competitions across STEM, language, tech and the arts." },
    ],
  }),
  component: CompetitionsPage,
});

function CompetitionsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden gradient-academic">
          <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
          <div className="relative mx-auto w-full max-w-7xl px-6 py-20 text-primary-foreground">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-accent" /> Inter-school playground
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
              Where schools meet, <br />and champions rise.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-white/75">
              From Math Olympiads to creative showcases — iCademia hosts the competitions that turn classrooms into communities.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-6 py-20">
          <div className="grid gap-6 lg:grid-cols-2">
            {COMPETITIONS.map((c) => (
              <Card key={c.id} className="border-border p-7 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">{c.category}</span>
                    <h3 className="mt-3 font-display text-2xl font-bold">{c.title}</h3>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{c.blurb}</p>
                <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border pt-5 text-sm">
                  <Meta icon={Users} label="Schools" value={`${c.schools}`} />
                  <Meta icon={Trophy} label="Prize" value={c.prize} />
                  <Meta icon={Calendar} label="When" value={c.date} />
                </div>
                <div className="mt-6 flex gap-2">
                  <Button
                    onClick={() => toast.success(`Registered for ${c.title}`, { description: "Your school will receive next steps by email (demo)." })}
                    disabled={c.status === "Closed"}
                    className="gradient-primary text-primary-foreground shadow-elegant"
                  >
                    {c.status === "Closed" ? "Registration closed" : "Register school"}
                  </Button>
                  <Button variant="outline" onClick={() => toast("Brochure sent", { description: `Details for ${c.title} downloaded.` })}>
                    Brochure
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Open: "bg-success/15 text-success",
    Live: "bg-accent/25 text-accent-foreground animate-pulse",
    Closed: "bg-muted text-muted-foreground",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status]}`}>{status}</span>;
}

function Meta({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] uppercase tracking-wider text-muted-foreground"><Icon className="h-3 w-3" />{label}</p>
      <p className="mt-1 font-medium">{value}</p>
    </div>
  );
}
