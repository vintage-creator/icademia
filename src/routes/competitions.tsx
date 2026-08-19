import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BellRing, CalendarX2, Medal, ShieldCheck, Trophy } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCompetitionsDb } from "@/lib/api/db.functions";

type Competition = {
  id: number;
  title: string;
  description: string;
  category: string;
  deadline: string;
  eligibility: string;
  registration_link: string;
  status: string;
};

export const Route = createFileRoute("/competitions")({
  head: () => ({
    meta: [
      { title: "Competitions — iCademia" },
      {
        name: "description",
        content:
          "Verified student competitions and inter-school opportunities published by iCademia.",
      },
    ],
  }),
  component: CompetitionsPage,
});

function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCompetitionsDb();
        setCompetitions(data as unknown as Competition[]);
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
          <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:28px_28px]" />
          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 py-16 text-primary-foreground lg:grid-cols-[1fr_0.8fr] lg:items-center lg:py-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
                <Medal className="h-3.5 w-3.5 text-accent" /> Verified school opportunities
              </span>
              <h1 className="mt-5 max-w-3xl font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
                A trusted stage for student talent.
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-white/70">
                When a competition is published here, schools will see its organiser, eligibility,
                deadlines, requirements and official registration route.
              </p>
            </div>
            <img
              src="/nigerian-school-community.jpg"
              alt="Students and their teacher outside a Nigerian school"
              className="h-80 w-full rounded-3xl object-cover shadow-2xl"
            />
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 py-20">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading competitions...</div>
          ) : competitions.length === 0 ? (
            <Card className="overflow-hidden border-border shadow-card max-w-4xl mx-auto">
              <div className="grid gap-8 p-7 sm:p-10 md:grid-cols-[auto_1fr]">
                <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <CalendarX2 className="h-7 w-7" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    Current status
                  </p>
                  <h2 className="mt-2 font-display text-3xl font-bold">
                    No verified competition is currently open.
                  </h2>
                  <p className="mt-4 leading-7 text-muted-foreground">
                    New opportunities are being reviewed. Listings will appear here when their
                    organiser, eligibility, dates, participation requirements and official
                    registration channel have been verified.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild>
                      <Link to="/register-school">
                        <BellRing className="mr-2 h-4 w-4" /> Register for school alerts
                      </Link>
                    </Button>
                    <Button asChild variant="outline">
                      <a href="mailto:hello@icademia.app?subject=Submit%20a%20student%20competition">
                        Submit an opportunity
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {competitions.map((comp) => (
                <Card key={comp.id} className="flex flex-col border-border shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant overflow-hidden">
                  <div className="p-6 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {comp.category}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                        {comp.status}
                      </span>
                    </div>
                    <h3 className="font-display text-2xl font-bold tracking-tight mb-2">{comp.title}</h3>
                    <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                      {comp.description}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center text-sm border-b pb-2">
                        <span className="text-muted-foreground">Eligibility</span>
                        <span className="font-semibold">{comp.eligibility}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-b pb-2">
                        <span className="text-muted-foreground">Deadline</span>
                        <span className="font-semibold font-mono text-destructive">
                          {comp.deadline ? new Date(comp.deadline).toLocaleDateString() : 'TBA'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 bg-muted/30 border-t">
                    <Button asChild className="w-full" variant={comp.status.toLowerCase() === 'active' ? 'default' : 'secondary'}>
                      {comp.registration_link ? (
                        <a href={comp.registration_link} target="_blank" rel="noreferrer">
                          {comp.status.toLowerCase() === 'active' ? 'Register Now' : 'View Details'}
                        </a>
                      ) : (
                        <span>Registration Not Open</span>
                      )}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-16 border-t border-border pt-8 text-center max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm leading-6 text-muted-foreground">
              All featured opportunities are manually vetted. Organisers can request listing details at <a href="mailto:hello@icademia.app?subject=Submit%20a%20student%20competition" className="text-primary hover:underline font-semibold">hello@icademia.app</a>.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
