import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  BrainCircuit,
  FileSearch,
  Loader2,
  Presentation,
  ShieldCheck,
  Sparkles,
  ChevronRight,
  CalendarDays,
  ClipboardCheck,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { generateSchoolAdminIntelligenceDb } from "@/lib/api/db.functions";
import { getAdminToken, getSchoolCode } from "@/lib/utils";
import { FormattedAiOutput } from "@/components/formatted-ai-output";

export const Route = createFileRoute("/dashboard/ai")({
  head: () => ({ meta: [{ title: "AI Operations Brief — iCademia" }] }),
  component: AiOperationsBriefPage,
});

type Workflow = "leadership" | "principal_copilot";

const briefs: Array<{
  id: Workflow;
  icon: typeof BrainCircuit;
  label: string;
  title: string;
  description: string;
  outcome: string;
  scope: string;
}> = [
  {
    id: "leadership",
    icon: Presentation,
    label: "Executive brief",
    title: "Principal's Decision Memo",
    description:
      "Compress your school's full academic position — results, attendance, curriculum coverage, interventions, staff workload and compliance — into a structured principal-level memo with a 30-day operating rhythm.",
    outcome: "Executive memo · 30-day action plan · Verified data only",
    scope: "Runs across: Results · Attendance · Curriculum · Interventions · Timetable · Compliance",
  },
  {
    id: "principal_copilot",
    icon: FileSearch,
    label: "Data copilot",
    title: "Principal's Data Copilot",
    description:
      "Ask any question about your school data and receive a specific, cited answer drawn from verified records. Missing data is surfaced explicitly — nothing is invented.",
    outcome: "Cited facts · Data gaps named · Inferences labelled",
    scope: "Runs across: All available school records",
  },
];

function AiOperationsBriefPage() {
  const [selected, setSelected] = useState<Workflow>("leadership");
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [question, setQuestion] = useState("");
  const [hasRun, setHasRun] = useState(false);

  const activeBrief = briefs.find((b) => b.id === selected)!;

  const run = async () => {
    if (selected === "principal_copilot" && question.trim().length < 5) {
      toast.error("Please type a question first.");
      return;
    }
    setLoading(true);
    setOutput("");
    try {
      const result = await generateSchoolAdminIntelligenceDb({
        data: {
          token: getAdminToken(),
          schoolCode: getSchoolCode(),
          workflow: selected,
          question: selected === "principal_copilot" ? question : undefined,
        },
      });
      setOutput(result.output);
      setHasRun(true);
    } catch (error) {
      toast.error("Intelligence brief could not run", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 space-y-8">
      {/* ── Page header ─────────────────────────────────────── */}
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            AI Operations Brief
          </span>
        </div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          Strategic intelligence for school leadership
        </h1>
        <p className="text-muted-foreground leading-relaxed max-w-2xl">
          Cross-application briefings that synthesise results, attendance, curriculum, staff and
          compliance into a single coherent picture. Evidence first — no data, no conclusion.
        </p>
      </header>

      {/* ── Brief selector ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:max-w-3xl">
        {briefs.map((brief) => {
          const isActive = selected === brief.id;
          return (
            <button
              key={brief.id}
              onClick={() => {
                setSelected(brief.id);
                setOutput("");
                setHasRun(false);
              }}
              className={`group relative flex flex-col gap-3 rounded-2xl border p-5 text-left transition-all duration-200 ${
                isActive
                  ? "border-primary/40 bg-primary/5 ring-2 ring-primary/20 shadow-md"
                  : "border-border bg-card hover:border-primary/20 hover:bg-primary/3 shadow-card"
              }`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {brief.label}
                </span>
                <ChevronRight
                  className={`h-4 w-4 transition-transform ${
                    isActive ? "text-primary rotate-90" : "text-muted-foreground/40 group-hover:text-primary/50"
                  }`}
                />
              </div>
              <div className="space-y-1">
                <brief.icon
                  className={`h-6 w-6 ${isActive ? "text-primary" : "text-muted-foreground"}`}
                />
                <h2 className="font-display text-base font-semibold">{brief.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{brief.description}</p>
              </div>
              <div className="mt-auto space-y-1 border-t border-border/50 pt-3">
                <p className="text-xs font-medium text-foreground">{brief.outcome}</p>
                <p className="text-[10px] text-muted-foreground/70">{brief.scope}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Copilot question input ───────────────────────────── */}
      {selected === "principal_copilot" && (
        <Card className="max-w-3xl border-border shadow-card p-5 space-y-3">
          <label htmlFor="copilot-question" className="font-display text-sm font-semibold block">
            What would you like to know about your school data?
          </label>
          <p className="text-xs text-muted-foreground">
            Examples: "Which JSS 2 subjects declined this term?" · "Are there students with 3 or
            more consecutive absences?" · "Which teachers are handling the most periods?"
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="copilot-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && void run()}
              placeholder="Type your question…"
              className="flex-1"
            />
            <Button
              onClick={run}
              disabled={loading || question.trim().length < 5}
              className="gap-2 shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="h-4 w-4" />
              )}
              {loading ? "Analysing…" : "Get Answer"}
            </Button>
          </div>
        </Card>
      )}

      {/* ── Run button (for leadership brief) ───────────────── */}
      {selected === "leadership" && (
        <div>
          <Button
            onClick={run}
            disabled={loading}
            size="lg"
            className="gap-2 px-6"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Presentation className="h-4 w-4" />
            )}
            {loading ? "Generating brief…" : "Generate Executive Brief"}
          </Button>
          {!hasRun && (
            <p className="mt-2 text-xs text-muted-foreground">
              Reads across all available school records — typically takes 10–20 seconds.
            </p>
          )}
        </div>
      )}

      {/* ── Output panel ────────────────────────────────────── */}
      <Card className="border-border shadow-card overflow-hidden">
        {/* Output header */}
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border bg-muted/20 px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Reviewed output
            </p>
            <h2 className="mt-0.5 font-display text-lg font-semibold">{activeBrief.title}</h2>
            <p className="text-xs text-muted-foreground">{activeBrief.outcome}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success border border-success/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            Source-limited analysis
          </span>
        </div>

        {/* Output body */}
        <div className="min-h-72 p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
              <div className="relative">
                <div className="h-14 w-14 rounded-full border-2 border-primary/20" />
                <Loader2 className="absolute inset-0 m-auto h-7 w-7 animate-spin text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  {selected === "leadership"
                    ? "Compiling executive brief…"
                    : "Searching school records…"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reading verified data across all modules. This may take a moment.
                </p>
              </div>
            </div>
          ) : output ? (
            <div className="space-y-6">
              <div className="prose-sm max-w-none">
                <FormattedAiOutput text={output} />
              </div>
              <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Continue in iCademia
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <Button asChild variant="outline" className="justify-start bg-background">
                    <Link to="/dashboard/timetable">
                      <CalendarDays className="mr-2 h-4 w-4" /> Review timetable
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start bg-background">
                    <Link to="/dashboard/teachers">
                      <UsersRound className="mr-2 h-4 w-4" /> Manage Head Teachers
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="justify-start bg-background">
                    <Link to="/dashboard/results">
                      <ClipboardCheck className="mr-2 h-4 w-4" /> Open Result Control
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <activeBrief.icon className="h-10 w-10 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">
                {selected === "leadership"
                  ? "Click “Generate Executive Brief” to produce the principal’s decision memo."
                  : "Type a question above and press “Get Answer”."}
              </p>
              <p className="text-xs text-muted-foreground/60 max-w-sm">
                If the necessary school records are not yet available, iCademia will tell you which
                data is missing — it will never invent a conclusion.
              </p>
            </div>
          )}
        </div>

        {/* Output footer */}
        <div className="border-t border-border bg-muted/10 px-6 py-3">
          <p className="text-xs text-muted-foreground/70">
            Outputs are strategic drafts for human review. The system does not automatically alter
            scores, publish results, message families, assign staff or make decisions about a student.
          </p>
        </div>
      </Card>
    </div>
  );
}
