import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { checkResultDb, getSchoolProfileDb } from "@/lib/api/db.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/widget/result-checker")({
  validateSearch: (search: Record<string, unknown>) => ({
    school: typeof search.school === "string" ? search.school : "",
    colour: typeof search.colour === "string" ? search.colour : "#3730A3",
    compact: search.compact === "true",
  }),
  head: () => ({ meta: [{ title: "Result Checker — iCademia" }] }),
  component: ResultCheckerWidget,
});

function ResultCheckerWidget() {
  const config = Route.useSearch();
  const [schoolName, setSchoolName] = useState("Your school");
  const [pin, setPin] = useState("");
  const [registration, setRegistration] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    studentName: string;
    className: string;
    term: string;
    session: string;
    averageScore: number;
  } | null>(null);

  useEffect(() => {
    if (!config.school) return;
    getSchoolProfileDb({ data: { schoolCode: config.school } })
      .then((school) => school?.name && setSchoolName(school.name))
      .catch(() => undefined);
  }, [config.school]);

  const check = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await checkResultDb({ data: { pin, regNumber: registration } });
      setResult(response);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Result could not be retrieved.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-muted/20 p-3 sm:p-5 relative overflow-hidden flex items-center justify-center"
      style={{ "--widget-colour": config.colour } as React.CSSProperties}
    >
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(#000_1px,transparent_1px),linear-gradient(90deg,#000_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--widget-colour)] opacity-[0.05] blur-[80px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--widget-colour)] opacity-[0.05] blur-[80px] pointer-events-none rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full mx-auto max-w-lg overflow-hidden rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl relative z-10"
      >
        <div className="h-1.5 w-full bg-[var(--widget-colour)] relative overflow-hidden">
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
        <div className={config.compact ? "p-4" : "p-7"}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center h-10 w-10 rounded-xl bg-muted/50 border border-border/50 shadow-sm">
                <img src="/icademia-logo.png" alt="" className="h-6 w-6" />
              </div>
              <div>
                <p className="font-display font-semibold text-foreground tracking-tight">{schoolName}</p>
                <p className="text-xs text-muted-foreground font-medium">Secure result checker</p>
              </div>
            </div>
            <div className="h-8 w-8 rounded-full bg-[var(--widget-colour)]/10 grid place-items-center">
              <ShieldCheck className="h-4 w-4 text-[var(--widget-colour)]" />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="mt-7 rounded-xl bg-success/5 border border-success/20 p-6 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 bg-success/10 rounded-bl-full opacity-50" />
                <CheckCircle2 className="h-7 w-7 text-success relative z-10" />
                <p className="mt-4 font-display text-2xl font-bold tracking-tight relative z-10">{result.studentName}</p>
                <p className="mt-1.5 text-sm text-muted-foreground font-medium relative z-10">
                  {result.className} <span className="mx-1.5 opacity-50">•</span> {result.term} Term <span className="mx-1.5 opacity-50">•</span> {result.session}
                </p>
                <div className="mt-5 inline-block rounded-lg bg-background border border-border px-4 py-2 shadow-sm relative z-10">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">Average Score</p>
                  <p className="text-lg font-bold text-[var(--widget-colour)]">{Number(result.averageScore).toFixed(1)}%</p>
                </div>
                <Button asChild className="mt-6 w-full bg-[var(--widget-colour)] text-white hover:opacity-90 hover:scale-[1.02] hover:shadow-lg transition-all duration-300 relative z-10">
                  <a href="https://www.icademia.app/check-result" target="_blank" rel="noreferrer">
                    Open complete result <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={check} 
                className="mt-7 space-y-5"
              >
                <div className="space-y-2">
                  <Label htmlFor="widget-registration" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registration number</Label>
                  <Input
                    id="widget-registration"
                    value={registration}
                    onChange={(event) => setRegistration(event.target.value)}
                    placeholder="Enter registration number"
                    className="h-11 transition-all focus:ring-2 focus:ring-[var(--widget-colour)]/30 focus:border-[var(--widget-colour)]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="widget-pin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Scratch-card PIN</Label>
                  <Input
                    id="widget-pin"
                    value={pin}
                    onChange={(event) => setPin(event.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX-XXXX"
                    className="h-11 font-mono tracking-wider transition-all focus:ring-2 focus:ring-[var(--widget-colour)]/30 focus:border-[var(--widget-colour)]"
                    required
                  />
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-11 w-full bg-[var(--widget-colour)] text-white hover:opacity-90 hover:scale-[1.02] hover:shadow-lg hover:shadow-[var(--widget-colour)]/20 transition-all duration-300 font-medium"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {loading ? "Checking securely…" : "Check result"}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
          <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] font-medium text-muted-foreground/70 uppercase tracking-wider">
            <Lock className="h-3 w-3" />
            <span>Secured & powered by iCademia</span>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
