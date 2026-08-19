import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  KeyRound,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Printer,
  Download,
  CalendarCheck,
  FileCheck2,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Mail,
  BrainCircuit,
  Plus,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import type { StudentResult } from "@/lib/mock-data";
import {
  checkResultDb,
  generateAiInsightsDb,
  emailReportCardDb,
} from "@/lib/api/db.functions";
import { toast } from "sonner";
import { FormattedAiOutput } from "@/components/formatted-ai-output";
import { getOrdinalSuffix } from "@/lib/utils";
import { detectPhase, gradeKeyRows, PHASE_META, gradeBadgeClass, scoreBarClass } from "@/lib/class-phase";

export const Route = createFileRoute("/check-result")({
  head: () => ({
    meta: [
      { title: "Check Result — iCademia" },
      {
        name: "description",
        content:
          "Enter your scratch-card PIN and registration number to view your term result instantly.",
      },
    ],
  }),
  component: CheckResult,
});

type ResultAnswerScript = {
  subject: string;
  score: number;
  cloudinaryUrl: string;
};

function CheckResult() {
  const [pin, setPin] = useState("");
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<
    | (StudentResult & {
        answerScripts?: ResultAnswerScript[];
        schoolLogoUrl?: string;
        schoolPrimaryColor?: string;
        schoolSecondaryColor?: string;
        schoolHeadTitle?: string;
        schoolSignatureUrl?: string;
        schoolStampUrl?: string;
      })
    | null
  >(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await checkResultDb({
        data: { pin: pin.trim(), regNumber: reg.trim() },
      });

      const mapped: StudentResult & {
        answerScripts?: ResultAnswerScript[];
        schoolLogoUrl?: string;
        schoolPrimaryColor?: string;
        schoolSecondaryColor?: string;
        schoolHeadTitle?: string;
        schoolSignatureUrl?: string;
        schoolStampUrl?: string;
        totalStudents?: number;
      } = {
        pin: pin.trim(),
        regNumber: res.regNumber,
        studentName: res.studentName,
        admissionNumber: res.regNumber,
        className: res.className,
        school: res.schoolName,
        schoolLogoUrl:       res.schoolLogoUrl       ?? undefined,
        schoolPrimaryColor:  res.schoolPrimaryColor   ?? undefined,
        schoolSecondaryColor:res.schoolSecondaryColor ?? undefined,
        schoolHeadTitle:     res.schoolHeadTitle      ?? undefined,
        schoolSignatureUrl:  res.schoolSignatureUrl   ?? undefined,
        schoolStampUrl:      res.schoolStampUrl       ?? undefined,
        schoolLetterheadStyle: res.schoolLetterheadStyle ?? 'classic-banner',
        schoolLogoPlacement:   res.schoolLogoPlacement  ?? 'left',
        schoolFontFamily:      res.schoolFontFamily     ?? 'inter',
        schoolFontWeight:      res.schoolFontWeight     ?? '600',
        schoolFontSizeScale:   res.schoolFontSizeScale  ?? 'M',
        schoolHeaderTextColor: res.schoolHeaderTextColor ?? 'auto',
        term: res.term,
        session: res.session,
        dateOfBirth: "Not supplied",
        gender: "Not supplied",
        attendance: {
          present: res.attendancePresent ?? 0,
          total: res.attendanceTotal ?? 0,
        },
        subjects: res.grades.map((g) => ({
          subject: g.subject,
          ca: g.caScore ?? Math.round(g.score * 0.4),
          exam: g.examScore ?? Math.round(g.score * 0.6),
          total: g.score,
          grade: g.grade,
          remark:
            g.score >= 75
              ? "Excellent"
              : g.score >= 65
                ? "Very Good"
                : g.score >= 55
                  ? "Good"
                  : g.score >= 45
                    ? "Pass"
                    : "Needs Improvement",
        })),
        classAverage: res.classAverage,
        highestAverage: res.highestAverage,
        lowestAverage: res.lowestAverage,
        position: res.position,
        positionNumber: res.positionNumber,
        totalStudents: res.totalStudents,
        affectiveTraits: res.affectiveTraits ?? [],
        psychomotorSkills: res.psychomotorSkills ?? [],
        teacherRemark: res.remarks ?? "",
        principalRemark: res.principalRemarks ?? "",
        nextTermBegins: res.nextTermBegins ?? "To be announced",
        answerScripts: res.answerScripts,
      };

      setResult(mapped);
      toast.success("Result retrieved successfully!");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Authentication failed. Double-check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col print:bg-white">
      <style>{`
        @media print {
          @page { margin: 0.6cm; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: white !important; }
          .print\\:transform-none { transform: none !important; }
          .backface-hidden { transform: none !important; position: static !important; }
          
          /* Single-page A4 protection for multi-subject classrooms */
          .result-sheet {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            max-height: 100vh !important;
            overflow: hidden !important;
          }
          .result-sheet td, .result-sheet th {
            padding-top: 3px !important;
            padding-bottom: 3px !important;
          }
        }
        .perspective-\\[2000px\\] { perspective: 2000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; -webkit-backface-visibility: hidden; }

        /* Font family mapping */
        .rs-font-inter      { font-family: 'Inter', sans-serif; }
        .rs-font-poppins    { font-family: 'Poppins', sans-serif; }
        .rs-font-montserrat { font-family: 'Montserrat', sans-serif; }
        .rs-font-raleway    { font-family: 'Raleway', sans-serif; }
        .rs-font-oswald     { font-family: 'Oswald', sans-serif; }
        .rs-font-playfair   { font-family: 'Playfair Display', serif; }
        .rs-font-lora       { font-family: 'Lora', serif; }
        .rs-font-garamond   { font-family: 'EB Garamond', serif; }
        .rs-font-crimson    { font-family: 'Crimson Text', serif; }
        .rs-font-libre      { font-family: 'Libre Baskerville', serif; }

        /* Font size scale */
        .rs-scale-XS  { font-size: 9pt; }
        .rs-scale-S   { font-size: 10pt; }
        .rs-scale-M   { font-size: 11pt; }
        .rs-scale-L   { font-size: 12pt; }
        .rs-scale-XL  { font-size: 13pt; }
        .rs-scale-2XL { font-size: 14pt; }
        .rs-scale-3XL { font-size: 15pt; }
      `}</style>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Raleway:wght@300;400;500;600;700;800;900&family=Oswald:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&family=Lora:wght@400;500;600;700&family=EB+Garamond:wght@400;500;600;700;800&family=Crimson+Text:wght@400;600;700&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet" />
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <main className="relative flex-1 overflow-hidden bg-[#f5f7fb] print:overflow-visible print:bg-transparent print:p-0">
        {/* Background gradient — desktop only so mobile stays clean */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_15%_20%,rgba(214,168,75,.2),transparent_28%),linear-gradient(115deg,#07111f,#172c56)] hidden lg:block print:hidden" />

        <div className="relative mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-10 lg:py-14">
          {!result ? (
            /* ── PIN entry panel ───────────────────────────────────── */
            <div className="flex flex-col gap-0 overflow-hidden rounded-2xl lg:rounded-[2rem] border border-white/10 bg-white shadow-[0_28px_90px_rgba(7,17,31,.16)] lg:grid lg:grid-cols-[1fr_1.05fr]">

              {/* ── FORM (always first / top on mobile) ───────────── */}
              <Card className="order-1 flex flex-col justify-center rounded-none border-0 p-6 shadow-none sm:p-8 lg:order-2 lg:p-14">
                {/* Mobile back link */}
                <Link
                  to="/"
                  className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4" /> Back home
                </Link>

                <div className="mb-5 sm:mb-6">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">1</span>
                    Verify your access
                  </div>
                  <h1 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">Check your result</h1>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Enter the two details printed on your school-issued card.
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <Label htmlFor="pin" className="font-semibold">Scratch-card PIN</Label>
                    <Input
                      id="pin"
                      placeholder="6F3A-9C8D-41B2"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="mt-2 font-mono uppercase tracking-wider text-base h-12"
                      required
                      autoComplete="off"
                      autoFocus
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg" className="font-semibold">Registration number</Label>
                    <Input
                      id="reg"
                      placeholder="BSS/2025/0142"
                      value={reg}
                      onChange={(e) => setReg(e.target.value)}
                      className="mt-2 font-mono uppercase text-base h-12"
                      required
                      autoComplete="off"
                    />
                  </div>
                  {error && (
                    <p className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                      {error}
                    </p>
                  )}
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full gradient-primary text-primary-foreground shadow-elegant h-12 text-base font-semibold"
                    size="lg"
                  >
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    {loading ? "Verifying…" : "View my result"}
                  </Button>

                  {/* Trust indicators below submit */}
                  <div className="rounded-xl bg-muted/40 border border-border/60 px-4 py-3">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">Secure & private</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                          Your PIN is validated securely and never displayed with your result.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-xs text-muted-foreground pt-1">
                    Don't have a card?{" "}
                    <a href="mailto:hello@icademia.app" className="font-semibold text-primary hover:underline">
                      Contact your school
                    </a>
                  </p>
                </form>
              </Card>

              {/* ── BRANDING PANEL (below form on mobile, left side on desktop) ── */}
              <div className="order-2 relative overflow-hidden bg-[#0b1930] px-6 py-8 text-white sm:px-8 sm:py-10 lg:order-1 lg:px-12 lg:py-14">
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full border-[38px] border-[#d6a84b]/10" />
                <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full border border-white/10" />

                {/* Desktop back link */}
                <Link to="/" className="relative hidden lg:inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white">
                  <ArrowLeft className="h-4 w-4" /> Back home
                </Link>

                <p className="relative mt-8 lg:mt-12 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6a84b]">
                  Secure student access
                </p>
                <h2 className="relative mt-3 max-w-md font-display text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  Your academic record, ready when you are.
                </h2>
                <p className="relative mt-4 max-w-lg leading-7 text-white/65 text-sm">
                  Enter the PIN printed on your scratch card together with your registration number. Your result will appear instantly — beautifully formatted and ready to print.
                </p>
                <div className="relative mt-7 space-y-3.5">
                  <Bullet icon={CalendarCheck} text="One card grants 365 days of access to all published results." dark />
                  <Bullet icon={ShieldCheck} text="Your PIN is validated securely and never stored with your result." dark />
                  <Bullet icon={FileCheck2} text="Download marked answer scripts when your school attaches them." dark />
                </div>
                <div className="relative mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-sm">
                  <p className="font-semibold text-white">Need a card?</p>
                  <p className="mt-2 leading-6 text-white/60 text-xs">
                    Ask your school administrator for an iCademia annual card. It costs ₦1,500 and remains valid for 365 days after activation.
                  </p>
                  <a href="mailto:hello@icademia.app" className="mt-3 inline-block font-medium text-[#f5d996] hover:underline text-xs">
                    hello@icademia.app
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <ResultSheet result={result} onBack={() => setResult(null)} />
          )}
        </div>
      </main>
      <div className="print:hidden">
        <SiteFooter />
      </div>
    </div>
  );
}

function Bullet({
  icon: Icon,
  text,
  dark = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  text: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md ${dark ? "bg-[#d6a84b]/12 text-[#f5d996]" : "bg-primary/10 text-primary"}`}>
        <Icon className="h-4 w-4" />
      </span>
      <p className={`text-sm leading-6 ${dark ? "text-white/70" : "text-foreground/80"}`}>{text}</p>
    </div>
  );
}

function gradeBg(g: string) {
  if (g === "A1" || g === "A") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (g === "B2" || g === "B3" || g === "B") return "bg-blue-100 text-blue-700 border border-blue-200";
  if (g === "C4" || g === "C5" || g === "C6" || g === "C") return "bg-amber-100 text-amber-700 border border-amber-200";
  if (g === "D7" || g === "E8" || g === "D" || g === "E") return "bg-orange-100 text-orange-700 border border-orange-200";
  return "bg-red-100 text-red-700 border border-red-200";
}

function gradeBarWidth(score: number) {
  return `${Math.min(100, score)}%`;
}

function gradeBarColor(score: number) {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 65) return "bg-blue-500";
  if (score >= 55) return "bg-amber-500";
  if (score >= 45) return "bg-orange-500";
  return "bg-red-500";
}

function ResultSheet({
  result,
  onBack,
}: {
  result: StudentResult & {
    answerScripts?: ResultAnswerScript[];
    schoolLogoUrl?: string;
    schoolPrimaryColor?: string;
    schoolSecondaryColor?: string;
    totalStudents?: number;
    schoolHeadTitle?: string;
    schoolSignatureUrl?: string;
    schoolStampUrl?: string;
  };
  onBack: () => void;
}) {
  const total = result.subjects.reduce((s, x) => s + x.total, 0);
  const avg = result.subjects.length > 0 ? (total / result.subjects.length).toFixed(1) : "0";
  const avgNum = parseFloat(avg);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  const quickPrompts = ["Explain my performance", "Find my learning gaps", "Build my study plan", "Which subjects need most focus?"];

  const getAiRecommendations = async (q?: string) => {
    const question = q ?? aiQuestion.trim();
    setAiLoading(true);
    setAiOpen(true);
    setAiInsights(null);
    try {
      const res = await generateAiInsightsDb({
        data: {
          studentName: result.studentName,
          className: result.className,
          term: result.term,
          question: question || undefined,
          grades: result.subjects.map((s) => ({ subject: s.subject, score: s.total, grade: s.grade })),
        },
      });
      setAiInsights(res.insights);
    } catch {
      toast.error("Could not generate AI insights at this time.");
    } finally {
      setAiLoading(false);
    }
  };

  const sendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo) return;
    setEmailLoading(true);
    try {
      await emailReportCardDb({
        data: {
          toEmail: emailTo,
          studentName: result.studentName,
          className: result.className,
          term: result.term,
          session: result.session,
          averageScore: avgNum,
          position: result.position,
          grades: result.subjects.map((s) => ({ subject: s.subject, score: s.total, grade: s.grade })),
        },
      });
      toast.success(`Report card emailed to ${emailTo}!`);
      setEmailTo("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to email report card.");
    } finally {
      setEmailLoading(false);
    }
  };

  const phase = detectPhase(result.className);
  const phaseMeta = PHASE_META[phase];
  const keyRows = gradeKeyRows(phase);

  const primaryColor = result.schoolPrimaryColor ?? "#1e3a5f";
  const goldColor = result.schoolSecondaryColor ?? "#d6a84b";

  // Compare student avg vs class avg
  const diff = avgNum - (result.classAverage ?? 0);
  const TrendIcon = diff > 2 ? TrendingUp : diff < -2 ? TrendingDown : Minus;
  const trendColor = diff > 2 ? "text-emerald-600" : diff < -2 ? "text-red-500" : "text-muted-foreground";

  /** Smart print: sets the page title to the student's name so the browser
   *  uses it as the PDF filename / print header, then restores it. */
  const printResultSheet = () => {
    const prev = document.title;
    document.title = `Result — ${result.studentName} · ${result.term} Term ${result.session}`;
    window.print();
    const restore = () => { document.title = prev; };
    window.addEventListener("afterprint", restore, { once: true });
    setTimeout(restore, 2000);
  };


  const [zoom, setZoom] = useState(0.9);
  const [isFlipped, setIsFlipped] = useState(false);

  // Determine if it's a graduating class for the transcript title
  const isGraduating = result.className.match(/(SS|SSS|JSS|JS)\s*3/i);
  const backPageTitle = isGraduating ? "Official Transcript" : "Termly Report Card";

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Check another result
        </Button>
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 rounded-md border border-border bg-card p-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.max(0.6, z - 0.05))} title="Decrease text size">
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-[10px] font-mono w-8 text-center text-muted-foreground">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setZoom(z => Math.min(1.2, z + 0.05))} title="Increase text size">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => setIsFlipped(!isFlipped)} className="gap-1.5 hidden lg:flex">
            <FileCheck2 className="h-4 w-4" /> {isFlipped ? "View Front Page" : "View Back Page"}
          </Button>
          <Button size="sm" variant="outline" onClick={printResultSheet} className="gap-1.5">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      <div className="flex justify-center print:hidden pb-6 lg:hidden">
        <Button onClick={() => setIsFlipped(!isFlipped)} variant="outline" className="gap-2 rounded-full px-6">
          <FileCheck2 className="h-4 w-4" />
          {isFlipped ? "View Front Page" : "View Back Page (Transcript)"}
        </Button>
      </div>

      {/* ══ OFFICIAL RESULT SHEET ══════════════════════════════════════ */}
      <div className="overflow-x-auto pb-4 perspective-[2000px] print:perspective-none pt-4">
        <motion.div 
          className="relative mx-auto origin-center transform-style-3d transition-all duration-700 print:transform-none print:!rotate-y-0"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          style={{ zoom }}
        >
          {/* ── FRONT PAGE ───────────────────────────────────────────── */}
          <div className={`result-sheet bg-white overflow-hidden rounded-2xl border-2 border-border shadow-[0_24px_80px_rgba(0,0,0,.14)] print:border-none print:shadow-none print:rounded-none mx-auto backface-hidden print:static rs-font-${result?.schoolFontFamily || 'inter'} rs-scale-${result?.schoolFontSizeScale || 'M'}`}
            style={{ fontWeight: result?.schoolFontWeight || '400' }}>
            {/* ── Letterhead — 6 real styles ───────────────────────── */}
            {(() => {
              const style = result.schoolLetterheadStyle ?? 'classic-banner';
              const placement = result.schoolLogoPlacement ?? 'left';
              const isCenter = placement === 'center';
              const isRight = placement === 'right';
              const hdrColor = (!result.schoolHeaderTextColor || result.schoolHeaderTextColor === 'auto') ? '#ffffff' : result.schoolHeaderTextColor;
              const printDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

              // Layout helpers
              const rowLayout = isCenter
                ? 'flex-col items-center text-center'
                : 'flex-row items-center justify-between';

              const Logo = result.schoolLogoUrl ? (
                <img src={result.schoolLogoUrl} alt={`${result.school} logo`}
                  className="h-24 w-24 shrink-0 object-contain z-10" />
              ) : null;

              const SchoolInfo = (textColor: string, muted: string) => (
                <div className={`z-10 flex-1 ${isCenter ? 'text-center' : ''}`}>
                  <h2 className="font-bold text-3xl sm:text-4xl uppercase tracking-tight" style={{ color: textColor }}>
                    {result.school}
                  </h2>
                  {result.schoolMotto && (
                    <p className="mt-1 italic text-sm sm:text-base" style={{ color: muted }}>
                      &ldquo;{result.schoolMotto}&rdquo;
                    </p>
                  )}
                </div>
              );

              // Professional contact strip — used by all styles
              const ContactStrip = (textColor: string, bg?: string) => (
                <div className={`flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-[10px] ${isCenter ? 'justify-center' : ''}`}
                  style={{ color: textColor, ...(bg ? { backgroundColor: bg, padding: '6px 12px', borderRadius: 4 } : {}) }}>
                  {result.schoolAddress && (
                    <span className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      {result.schoolAddress}
                    </span>
                  )}
                  {result.schoolContactPhone && (
                    <span className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.93 16.92Z"/></svg>
                      {result.schoolContactPhone}
                    </span>
                  )}
                  {result.schoolContactEmail && (
                    <span className="flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      {result.schoolContactEmail}
                    </span>
                  )}
                </div>
              );

              const TermBadge = (onDark: boolean) => (
                <div className={`mt-3 flex items-center gap-3 ${isCenter ? 'justify-center' : 'justify-between'}`}>
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] rounded px-3 py-1"
                    style={onDark ? { backgroundColor: 'rgba(255,255,255,0.2)', color: '#ffffff' } : { backgroundColor: primaryColor, color: '#ffffff' }}>
                    Official Academic Record
                  </p>
                  <p className="text-[11px] font-medium" style={{ color: onDark ? 'rgba(255,255,255,0.85)' : primaryColor + 'cc' }}>
                    {result.term} Term &middot; {result.session} &middot; {printDate}
                  </p>
                </div>
              );

              // Helper: renders logo + school info in correct left/right/center order
              const HeaderRow = (textColor: string, muted: string) => (
                <div className={`relative flex gap-6 ${rowLayout}`}>
                  {isRight
                    ? <>{SchoolInfo(textColor, muted)}{Logo}</>
                    : <>{Logo}{SchoolInfo(textColor, muted)}</>
                  }
                </div>
              );

              // ── 1. Classic Banner ──────────────────────────────────────────
              if (style === 'classic-banner') return (
                <div className="relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}ee)` }}>
                  <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border-[32px] opacity-10" style={{ borderColor: goldColor }} />
                  <div className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full border opacity-10" style={{ borderColor: goldColor }} />
                  <div className="relative px-8 pt-8 pb-4 sm:px-10">
                    {HeaderRow(hdrColor, hdrColor + 'bb')}
                    {ContactStrip(hdrColor + 'cc')}
                    {TermBadge(true)}
                  </div>
                  <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${goldColor}, ${goldColor}44, ${goldColor})` }} />
                </div>
              );

              // ── 2. Arch Crest ─────────────────────────────────────────────
              if (style === 'arch-crest') return (
                <div className="bg-white">
                  {/* Arch header: school name curves along an upward arc */}
                  <div className="relative w-full pt-4 px-8 sm:px-10" style={{ overflow: 'visible' }}>
                    <svg
                      viewBox="0 0 600 125"
                      preserveAspectRatio="xMidYMid meet"
                      className="w-full"
                      style={{ display: 'block', overflow: 'visible' }}
                    >
                      <defs>
                        <path id="rs-arch-top" d="M 20 120 A 600 600 0 0 1 580 120" />
                      </defs>
                      <path d="M 20 120 A 600 600 0 0 1 580 120" fill="none" stroke={primaryColor} strokeWidth="1" opacity="0.15" />
                      <text fontWeight="bold" fontSize="28" fill={primaryColor} textAnchor="middle" letterSpacing="4">
                        <textPath href="#rs-arch-top" startOffset="50%">{result.school.toUpperCase()}</textPath>
                      </text>
                    </svg>

                    {/* Logo + motto row, centred below the arch */}
                    <div className="flex items-center justify-center gap-4 mt-2">
                      {Logo}
                      {result.schoolMotto && (
                        <p className="italic text-sm max-w-xs" style={{ color: primaryColor + '99' }}>&ldquo;{result.schoolMotto}&rdquo;</p>
                      )}
                    </div>
                  </div>

                  {/* Contact strip + term badge */}
                  <div className="px-8 pb-3 sm:px-10 text-center">
                    {ContactStrip(primaryColor + '99')}
                  </div>
                  <div className="border-b-4" style={{ borderBottomColor: primaryColor }} />
                  <div className="px-8 py-2 sm:px-10">
                    {TermBadge(false)}
                  </div>
                </div>
              );

              // ── 3. Royal Split ────────────────────────────────────────────
              if (style === 'royal-split') return (
                <div className={`flex min-h-[160px] ${isRight ? 'flex-row-reverse' : ''}`}>
                  {/* Coloured sidebar with logo */}
                  <div className="w-36 sm:w-48 flex flex-col items-center justify-center gap-3 px-3 py-6 shrink-0"
                    style={{ backgroundColor: primaryColor }}>
                    {Logo}
                  </div>
                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="px-6 py-5">
                      <h2 className="font-bold text-2xl sm:text-3xl uppercase leading-tight" style={{ color: primaryColor }}>{result.school}</h2>
                      {result.schoolMotto && <p className="mt-1 italic text-sm text-muted-foreground">&ldquo;{result.schoolMotto}&rdquo;</p>}
                      {ContactStrip(primaryColor + '88')}
                    </div>
                    <div className="px-6 pb-4 border-t border-border/40">
                      {TermBadge(false)}
                    </div>
                  </div>
                </div>
              );

              // ── 4. Minimalist Line ────────────────────────────────────────
              if (style === 'minimalist-line') return (
                <div className="bg-white px-8 pt-7 pb-4 sm:px-10">
                  {/* Logo + name row */}
                  <div className={`flex gap-4 items-center ${isCenter ? 'flex-col text-center' : isRight ? 'justify-between' : ''}`}>
                    {isRight
                      ? <>{SchoolInfo(primaryColor, primaryColor + '99')}{Logo}</>
                      : <>{Logo}<div className={`flex-1 ${isCenter ? 'text-center' : ''}`}>
                          <h2 className="font-bold text-3xl sm:text-4xl uppercase leading-tight" style={{ color: primaryColor }}>{result.school}</h2>
                          {result.schoolMotto && <p className="mt-1 italic text-sm" style={{ color: primaryColor + '99' }}>&ldquo;{result.schoolMotto}&rdquo;</p>}
                        </div>
                      </>}
                  </div>
                  {/* Thick rule */}
                  <div className="mt-4 h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${primaryColor}, ${goldColor}, ${primaryColor})` }} />
                  <div className="mt-1 h-[1px] w-full" style={{ backgroundColor: primaryColor + '33' }} />
                  {/* Contact info row */}
                  {ContactStrip(primaryColor + '88')}
                  {TermBadge(false)}
                </div>
              );

              // ── 5. Centred Formal ─────────────────────────────────────────
              if (style === 'centred-formal') return (
                <div className="bg-white px-8 pt-7 pb-0 sm:px-10">
                  {/* Top decorative rule */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-[2px]" style={{ backgroundColor: primaryColor }} />
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: goldColor }} />
                    <div className="flex-1 h-[2px]" style={{ backgroundColor: primaryColor }} />
                  </div>
                  {/* Centred logo + name */}
                  <div className="flex flex-col items-center text-center">
                    {Logo}
                    <h2 className="mt-3 font-bold text-3xl sm:text-4xl uppercase tracking-wide" style={{ color: primaryColor }}>{result.school}</h2>
                    {result.schoolMotto && <p className="mt-1 italic text-sm" style={{ color: primaryColor + '99' }}>&ldquo;{result.schoolMotto}&rdquo;</p>}
                    {ContactStrip(primaryColor + '88')}
                  </div>
                  {/* Bottom double rule */}
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1 h-[2px]" style={{ backgroundColor: primaryColor }} />
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: goldColor }} />
                    <div className="flex-1 h-[2px]" style={{ backgroundColor: primaryColor }} />
                  </div>
                  <div className="mt-1.5 px-8">
                    {TermBadge(false)}
                  </div>
                </div>
              );

              // ── 6. Modern Gradient ────────────────────────────────────────
              if (style === 'modern-gradient') return (
                <div className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}f5, ${primaryColor}bb)` }}>
                  {/* Geometric accent */}
                  <div className="absolute right-0 top-0 h-full w-2/5 opacity-10"
                    style={{ background: `linear-gradient(135deg, transparent, ${goldColor})` }} />
                  <div className="relative px-8 pt-8 pb-0 sm:px-10">
                    {HeaderRow(hdrColor, hdrColor + 'aa')}
                    {ContactStrip(hdrColor + 'bb')}
                  </div>
                  <div className="h-1.5 mt-3" style={{ backgroundColor: goldColor }} />
                  <div className="px-8 py-2 sm:px-10">
                    {TermBadge(true)}
                  </div>
                </div>
              );

              // Fallback
              return null;
            })()}

            {/* ── Student info strip ────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 border-b border-border bg-muted/25 px-8 py-5 text-xs sm:grid-cols-4 sm:px-10">
              <InfoCell label="Student name" value={result.studentName} />
              <InfoCell label="Class" value={result.className} />
              <InfoCell label="Reg. number" value={result.regNumber || result.admissionNumber} />
              <InfoCell label="Term / Session" value={`${result.term} · ${result.session}`} />
              {result.attendance.total > 0 && (
                <InfoCell label="Attendance" value={`${result.attendance.present} / ${result.attendance.total} days`} />
              )}
              {result.position && (
                <InfoCell label="Class position" value={`${result.positionNumber}${getOrdinalSuffix(result.positionNumber ?? 0)} of ${result.totalStudents ?? "—"}`} />
              )}
              {result.nextTermBegins && result.nextTermBegins !== "To be announced" && (
                <InfoCell label="Next term begins" value={result.nextTermBegins} />
              )}
            </div>

            {/* ── Subject table ─────────────────────────────────────── */}
            <div className="px-4 py-5 sm:px-8">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b-2 border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 font-semibold">Subject</th>
                    <th className="pb-2 text-center font-semibold">CA</th>
                    <th className="pb-2 text-center font-semibold">Exam</th>
                    <th className="pb-2 text-center font-semibold">Total</th>
                    <th className="pb-2 pl-2 font-semibold">Performance</th>
                    <th className="pb-2 text-center font-semibold">Grade</th>
                    <th className="pb-2 text-right font-semibold">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {result.subjects.map((s, i) => (
                    <tr key={i} className={`border-b border-border/40 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <td className="py-2 font-medium">{s.subject}</td>
                      <td className="py-2 text-center text-muted-foreground">{s.ca}</td>
                      <td className="py-2 text-center text-muted-foreground">{s.exam}</td>
                      <td className="py-2 text-center font-bold">{s.total}</td>
                      <td className="py-2 pl-2 pr-4">
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${gradeBarColor(s.total)}`} style={{ width: gradeBarWidth(s.total) }} />
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${gradeBg(s.grade)}`}>
                          {s.grade}
                        </span>
                      </td>
                      <td className="py-2 text-right text-muted-foreground">{s.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Summary stats ─────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 border-t border-border bg-muted/20 px-6 py-4 sm:grid-cols-4 sm:px-8">
              <SumCell label="Total score" value={`${total}`} />
              <SumCell label="Average" value={`${avg}%`} bold />
              {result.classAverage && <SumCell label="Class average" value={`${result.classAverage.toFixed(1)}%`} />}
              {result.position && <SumCell label="Position" value={result.position} bold />}
            </div>

            {/* ── Grade key ─────────────────────────────────────────── */}
            <div className="border-t border-border px-6 py-3 sm:px-8">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {phaseMeta.label} grading scale
              </p>
              <div className="flex flex-wrap gap-1.5">
                {keyRows.map((row) => (
                  <span key={row.grade} className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[9px] font-semibold ${gradeBadgeClass(row.grade)}`}>
                    {row.grade}: {row.range} — {row.remark}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Affective / Psychomotor ───────────────────────────── */}
            {(result.affectiveTraits?.length > 0 || result.psychomotorSkills?.length > 0) && (
              <div className="grid gap-4 border-t border-border px-6 py-4 sm:grid-cols-2 sm:px-8">
                {result.affectiveTraits?.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Affective domain</p>
                    <div className="space-y-1">
                      {result.affectiveTraits.map((t: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-foreground/80">{t.label}</span>
                          <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${scoreBarClass(t.rating)}`}>{t.rating}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.psychomotorSkills?.length > 0 && (
                  <div>
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Psychomotor skills</p>
                    <div className="space-y-1">
                      {result.psychomotorSkills.map((s: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-foreground/80">{s.label}</span>
                          <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-bold ${scoreBarClass(s.rating)}`}>{s.rating}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Remarks ───────────────────────────────────────────── */}
            {(result.teacherRemark || result.principalRemark) && (
              <div className="grid gap-4 border-t border-border bg-muted/10 px-6 py-4 sm:grid-cols-2 sm:px-8">
                {result.teacherRemark && (
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Form teacher's remark</p>
                    <p className="text-xs italic leading-relaxed text-foreground/80">"{result.teacherRemark}"</p>
                  </div>
                )}
                {result.principalRemark && (
                  <div>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Principal's remark</p>
                    <p className="text-xs italic leading-relaxed text-foreground/80">"{result.principalRemark}"</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Signature & Stamp ─────────────────────────────────── */}
            <div className="flex items-end justify-between border-t border-border px-6 py-5 sm:px-8">
              <div>
                <div className="mb-1 h-10 w-36 border-b-2 border-dashed border-border">
                  {result.schoolSignatureUrl && (
                    <img src={result.schoolSignatureUrl} alt="Signature" className="h-full w-full object-contain object-left-bottom" />
                  )}
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {result.schoolHeadTitle ?? "Principal"}
                </p>
              </div>
              {result.schoolStampUrl && (
                <img src={result.schoolStampUrl} alt="School stamp" className="h-20 w-20 object-contain opacity-80" />
              )}
            </div>
          </div>

          {/* ── BACK PAGE (flipped) ───────────────────────────────── */}
          <div
            className="result-sheet absolute inset-0 bg-white overflow-hidden rounded-2xl border-2 border-border shadow-[0_24px_80px_rgba(0,0,0,.14)] print:hidden backface-hidden mx-auto"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="border-b border-border bg-muted/30 px-8 py-4 sm:px-10">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{result.school}</p>
              <p className="mt-0.5 font-display text-base font-semibold">{backPageTitle} — {result.term} Term {result.session}</p>
            </div>

            {/* Answer scripts section */}
            {result.answerScripts && result.answerScripts.length > 0 && (
              <div className="px-8 py-5 sm:px-10">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Marked answer scripts</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {result.answerScripts.map((script: ResultAnswerScript, i: number) => (
                    <a
                      key={i}
                      href={script.cloudinaryUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                    >
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10">
                        <Download className="h-4 w-4 text-primary" />
                      </span>
                      <div>
                        <p className="text-xs font-semibold">{script.subject}</p>
                        <p className="text-[10px] text-muted-foreground">Score: {script.score} · Click to view</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Performance summary on back page */}
            <div className="px-8 py-4 sm:px-10 border-t border-border">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Performance summary</p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center rounded-xl border border-border p-3">
                  <p className="text-2xl font-bold text-foreground">{avg}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Average score</p>
                </div>
                {result.classAverage && (
                  <div className="text-center rounded-xl border border-border p-3">
                    <p className={`text-2xl font-bold flex items-center justify-center gap-1 ${trendColor}`}>
                      {result.classAverage.toFixed(1)}%
                      <TrendIcon className="h-4 w-4" />
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Class average</p>
                  </div>
                )}
                {result.position && (
                  <div className="text-center rounded-xl border border-border p-3">
                    <p className="text-2xl font-bold text-foreground">{result.positionNumber}{getOrdinalSuffix(result.positionNumber ?? 0)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">of {result.totalStudents} students</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══ AI INSIGHTS ══════════════════════════════════════════════ */}
      <Card className="print:hidden border-border p-5 shadow-card sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold">AI Study Coach</h3>
              <p className="text-xs text-muted-foreground">Get personalised insights based on this result</p>
            </div>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="mt-4 flex flex-wrap gap-2">
          {quickPrompts.map((q) => (
            <button
              key={q}
              onClick={() => getAiRecommendations(q)}
              disabled={aiLoading}
              className="rounded-full border border-border bg-muted/40 px-3 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-primary/10 hover:border-primary/40 hover:text-primary disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Custom question */}
        <form
          onSubmit={(e) => { e.preventDefault(); getAiRecommendations(); }}
          className="mt-3 flex gap-2"
        >
          <Input
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            placeholder="Ask anything about this result…"
            className="flex-1 text-sm"
            disabled={aiLoading}
          />
          <Button type="submit" size="sm" disabled={aiLoading || !aiQuestion.trim()} className="gap-1.5">
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {aiLoading ? "Thinking…" : "Ask AI"}
          </Button>
        </form>

        {/* AI response */}
        <AnimatePresence>
          {aiOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                {aiLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    Generating insights…
                  </div>
                ) : aiInsights ? (
                  <FormattedAiOutput text={aiInsights} />
                ) : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ══ EMAIL REPORT CARD ════════════════════════════════════════ */}
      <Card className="print:hidden border-border p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold">Email this report card</h3>
            <p className="text-xs text-muted-foreground">Send a formatted copy to a parent or guardian</p>
          </div>
        </div>
        <form onSubmit={sendEmail} className="flex flex-col sm:flex-row gap-2">
          <Input
            type="email"
            value={emailTo}
            onChange={(e) => setEmailTo(e.target.value)}
            placeholder="parent@example.com"
            className="flex-1"
            required
          />
          <Button type="submit" disabled={emailLoading} className="gap-1.5 shrink-0">
            {emailLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {emailLoading ? "Sending…" : "Send report"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SumCell({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}>{value}</p>
    </div>
  );
}
