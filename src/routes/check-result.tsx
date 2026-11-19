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
  BookOpenCheck,
  Plus,
  Info,
  QrCode,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Check,
  Award,
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
  generateStudentQuizDb,
  submitStudentQuizDb,
  emailReportCardDb,
} from "@/lib/api/db.functions";
import { toast } from "sonner";
import { FormattedAiOutput } from "@/components/formatted-ai-output";
import { OfficialSchoolSeal } from "@/components/official-school-seal";
import { getOrdinalSuffix } from "@/lib/utils";
import {
  detectPhase,
  gradeKeyRows,
  PHASE_META,
  gradeBadgeClass,
  scoreBarClass,
} from "@/lib/class-phase";

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

type AcademicHistoryItem = {
  resultId: number;
  term: string;
  session: string;
  averageScore: number;
  positionNumber?: number;
  totalStudents?: number;
};

type StudentAssignment = {
  id: number;
  title: string;
  subject: string;
  instructions: string;
  dueDate: string;
};

type ResultView = StudentResult & {
  resultId: number;
  studentIdentity?: string;
  academicHistory: AcademicHistoryItem[];
  assignments?: StudentAssignment[];
  answerScripts?: ResultAnswerScript[];
  waivedSubjects?: Array<{ subject: string; reason: string }>;
  schoolLogoUrl?: string;
  schoolCity?: string;
  schoolPrimaryColor?: string;
  schoolSecondaryColor?: string;
  schoolHeadTitle?: string;
  schoolSignatureUrl?: string;
  schoolStampUrl?: string;
  totalStudents?: number;
  timesAbsent?: number;
  resumptionDate?: string;
  promotionStatus?: string;
  promotedToClass?: string;
};

function CheckResult() {
  const [pin, setPin] = useState("");
  const [reg, setReg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultView | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await checkResultDb({
        data: { pin: pin.trim(), regNumber: reg.trim() },
      });

      const mapped: ResultView = {
        resultId: res.resultId,
        studentIdentity: res.studentIdentity ?? undefined,
        academicHistory: res.academicHistory,
        assignments: res.assignments as StudentAssignment[],
        pin: pin.trim(),
        regNumber: res.regNumber,
        studentName: res.studentName,
        admissionNumber: res.regNumber,
        className: res.className,
        school: res.schoolName,
        schoolCity: res.schoolCity ?? undefined,
        schoolLogoUrl: res.schoolLogoUrl ?? undefined,
        schoolPrimaryColor: res.schoolPrimaryColor ?? undefined,
        schoolSecondaryColor: res.schoolSecondaryColor ?? undefined,
        schoolHeadTitle: res.schoolHeadTitle ?? undefined,
        schoolSignatureUrl: res.schoolSignatureUrl ?? undefined,
        schoolStampUrl: res.schoolStampUrl ?? undefined,
        schoolLetterheadStyle: res.schoolLetterheadStyle ?? "classic-banner",
        schoolLogoPlacement: res.schoolLogoPlacement ?? "left",
        schoolFontFamily: res.schoolFontFamily ?? "inter",
        schoolFontWeight: res.schoolFontWeight ?? "600",
        schoolFontSizeScale: res.schoolFontSizeScale ?? "M",
        schoolHeaderTextColor: res.schoolHeaderTextColor ?? "auto",
        term: res.term,
        session: res.session,
        dateOfBirth: "",
        gender: res.gender,
        photoUrl: res.photoUrl ?? undefined,
        responsibilities: res.responsibilities ?? undefined,
        attendance: {
          present: res.attendancePresent ?? 0,
          total: res.attendanceTotal ?? 0,
        },
        timesAbsent: res.timesAbsent ?? 0,
        resumptionDate: res.resumptionDate ?? undefined,
        promotionStatus: res.promotionStatus ?? undefined,
        promotedToClass: res.promotedToClass ?? undefined,
        subjects: res.grades.map((g) => {
          const total = g.score;
          const ca = g.caScore ?? Math.round(total * 0.4);
          const exam = g.examScore ?? total - ca;
          const computedGrade = g.grade?.trim() || "—";
          return {
            subject: g.subject,
            ca,
            exam,
            total,
            grade: computedGrade as any,
            classAverage: g.classAverage,
            classHighest: g.classHighest,
            classLowest: g.classLowest,
            classPosition: g.classPosition,
            classSize: g.classSize,
            remark: "",
          };
        }),
        classAverage: res.classAverage,
        highestAverage: res.highestAverage,
        lowestAverage: res.lowestAverage,
        position: res.position ?? "Not recorded",
        positionNumber: res.positionNumber,
        totalStudents: res.totalStudents,
        affectiveTraits: res.affectiveTraits ?? [],
        psychomotorSkills: res.psychomotorSkills ?? [],
        waivedSubjects: res.waivedSubjects ?? [],
        teacherRemark: res.remarks ?? "",
        principalRemark: res.principalRemarks ?? "",
        nextTermBegins: res.resumptionDate || res.nextTermBegins || "To be announced",
        answerScripts: res.answerScripts,
      };

      setResult(mapped);
      toast.success("Result retrieved successfully!");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Double-check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  const selectHistoricalResult = async (resultId: number) => {
    setLoading(true);
    try {
      const res = await checkResultDb({
        data: { pin: pin.trim(), regNumber: reg.trim(), resultId },
      });
      const subjects = res.grades.map((g) => ({
        subject: g.subject,
        ca: g.caScore ?? Math.round(g.score * 0.4),
        exam: g.examScore ?? Math.round(g.score * 0.6),
        total: g.score,
        grade: g.grade?.trim() || "—",
        classAverage: g.classAverage,
        classHighest: g.classHighest,
        classLowest: g.classLowest,
        classPosition: g.classPosition,
        classSize: g.classSize,
        remark: "",
      }));
      setResult((current) =>
        current
          ? {
              ...current,
              resultId: res.resultId,
              academicHistory: res.academicHistory,
              assignments: res.assignments as StudentAssignment[],
              term: res.term,
              session: res.session,
              subjects,
              classAverage: res.classAverage,
              highestAverage: res.highestAverage,
              lowestAverage: res.lowestAverage,
              position: res.position ?? "Not recorded",
              positionNumber: res.positionNumber,
              totalStudents: res.totalStudents,
              attendance: { present: res.attendancePresent ?? 0, total: res.attendanceTotal ?? 0 },
              timesAbsent: res.timesAbsent ?? 0,
              resumptionDate: res.resumptionDate ?? undefined,
              promotionStatus: res.promotionStatus ?? undefined,
              promotedToClass: res.promotedToClass ?? undefined,
              affectiveTraits: res.affectiveTraits ?? [],
              psychomotorSkills: res.psychomotorSkills ?? [],
              waivedSubjects: res.waivedSubjects ?? [],
              teacherRemark: res.remarks ?? "",
              principalRemark: res.principalRemarks ?? "",
              nextTermBegins: res.resumptionDate || res.nextTermBegins || "To be announced",
              answerScripts: res.answerScripts,
            }
          : null,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load that result.");
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
          
          /* Let longer records continue cleanly instead of cropping content. */
          .result-sheet {
            max-height: none !important;
            overflow: visible !important;
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
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Raleway:wght@300;400;500;600;700;800;900&family=Oswald:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&family=Lora:wght@400;500;600;700&family=EB+Garamond:wght@400;500;600;700;800&family=Crimson+Text:wght@400;600;700&family=Libre+Baskerville:wght@400;700&display=swap"
        rel="stylesheet"
      />
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
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground">
                      1
                    </span>
                    Verify your access
                  </div>
                  <h1 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">
                    Check your result
                  </h1>
                  <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
                    Enter the two details printed on your school-issued card.
                  </p>
                </div>

                <form onSubmit={submit} className="space-y-4">
                  <div>
                    <Label htmlFor="pin" className="font-semibold">
                      Scratch-card PIN
                    </Label>
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
                    <Label htmlFor="reg" className="font-semibold">
                      Registration number
                    </Label>
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
                    {loading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="mr-2 h-4 w-4" />
                    )}
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
                    <a
                      href="mailto:hello@icademia.app"
                      className="font-semibold text-primary hover:underline"
                    >
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
                <Link
                  to="/"
                  className="relative hidden lg:inline-flex items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4" /> Back home
                </Link>

                <p className="relative mt-8 lg:mt-12 text-xs font-semibold uppercase tracking-[0.22em] text-[#d6a84b]">
                  Secure student access
                </p>
                <h2 className="relative mt-3 max-w-md font-display text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                  Your academic record, ready when you are.
                </h2>
                <p className="relative mt-4 max-w-lg leading-7 text-white/65 text-sm">
                  Enter the PIN printed on your scratch card together with your registration number.
                  Your result will appear instantly — beautifully formatted and ready to print.
                </p>
                <div className="relative mt-7 space-y-3.5">
                  <Bullet
                    icon={CalendarCheck}
                    text="One card grants 365 days of access to all published results."
                    dark
                  />
                  <Bullet
                    icon={ShieldCheck}
                    text="Your PIN is validated securely and never stored with your result."
                    dark
                  />
                  <Bullet
                    icon={FileCheck2}
                    text="Download marked answer scripts when your school attaches them."
                    dark
                  />
                </div>
                <div className="relative mt-8 rounded-2xl border border-white/10 bg-white/[0.06] p-5 text-sm">
                  <p className="font-semibold text-white">Need a card?</p>
                  <p className="mt-2 leading-6 text-white/60 text-xs">
                    Ask your school administrator for an iCademia annual card. It costs ₦1,500 and
                    remains valid for 365 days after activation.
                  </p>
                  <a
                    href="mailto:hello@icademia.app"
                    className="mt-3 inline-block font-medium text-[#f5d996] hover:underline text-xs"
                  >
                    hello@icademia.app
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <ResultSheet
              result={result}
              onBack={() => setResult(null)}
              onSelectResult={selectHistoricalResult}
              loadingResult={loading}
            />
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
      <span
        className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md ${dark ? "bg-[#d6a84b]/12 text-[#f5d996]" : "bg-primary/10 text-primary"}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className={`text-sm leading-6 ${dark ? "text-white/70" : "text-foreground/80"}`}>{text}</p>
    </div>
  );
}

function gradeBg(g: string) {
  if (g === "—") return "bg-muted text-muted-foreground border border-border";
  if (g === "A1" || g === "A") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (g === "B2" || g === "B3" || g === "B")
    return "bg-blue-100 text-blue-700 border border-blue-200";
  if (g === "C4" || g === "C5" || g === "C6" || g === "C")
    return "bg-amber-100 text-amber-700 border border-amber-200";
  if (g === "D7" || g === "E8" || g === "D" || g === "E")
    return "bg-orange-100 text-orange-700 border border-orange-200";
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

function termLabel(term: string) {
  return term.replace(/\s+Term$/i, "");
}

function ResultSheet({
  result,
  onBack,
  onSelectResult,
  loadingResult,
}: {
  result: ResultView;
  onBack: () => void;
  onSelectResult: (resultId: number) => void;
  loadingResult: boolean;
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
  const [quizLoading, setQuizLoading] = useState(false);
  const [quiz, setQuiz] = useState<null | {
    attemptToken: string;
    focus: string;
    questions: Array<{ subject: string; question: string; options: string[] }>;
  }>(null);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizReview, setQuizReview] = useState<null | {
    score: number;
    correct: number;
    review: Array<{
      subject: string;
      question: string;
      options: string[];
      answerIndex: number;
      selectedIndex: number;
      explanation: string;
      correct: boolean;
    }>;
  }>(null);

  const quickPrompts = [
    "Explain my result in plain English",
    "Build my next-term improvement plan",
    "Create practice assignments with answers",
    "Give my parent a simple progress summary",
    "Show my weakest topics and how to improve",
  ];

  const getAiRecommendations = async (q?: string) => {
    const question = q ?? aiQuestion.trim();
    setAiLoading(true);
    setAiOpen(true);
    setAiInsights(null);
    try {
      const res = await generateAiInsightsDb({
        data: {
          pin: result.pin,
          regNumber: result.regNumber,
          resultId: result.resultId,
          studentName: result.studentName,
          className: result.className,
          term: result.term,
          session: result.session,
          question: question || undefined,
          grades: result.subjects.map((s) => ({
            subject: s.subject,
            score: s.total,
            grade: s.grade,
          })),
        },
      });
      setAiInsights(res.insights);
    } catch {
      toast.error("Could not generate AI insights at this time.");
    } finally {
      setAiLoading(false);
    }
  };

  const createQuiz = async () => {
    setQuizLoading(true);
    setQuizReview(null);
    try {
      const generated = await generateStudentQuizDb({
        data: { pin: result.pin, regNumber: result.regNumber, resultId: result.resultId },
      });
      setQuiz(generated);
      setQuizAnswers(generated.questions.map(() => -1));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create a quiz.");
    } finally {
      setQuizLoading(false);
    }
  };

  const submitQuiz = async () => {
    if (!quiz || quizAnswers.some((answer) => answer < 0)) return;
    setQuizLoading(true);
    try {
      const review = await submitStudentQuizDb({
        data: { attemptToken: quiz.attemptToken, answers: quizAnswers },
      });
      setQuizReview(review);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not mark this quiz.");
    } finally {
      setQuizLoading(false);
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
          grades: result.subjects.map((s) => ({
            subject: s.subject,
            score: s.total,
            grade: s.grade,
          })),
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
  const trendColor =
    diff > 2 ? "text-emerald-600" : diff < -2 ? "text-red-500" : "text-muted-foreground";

  /** Smart print: sets the page title to the student's name so the browser
   *  uses it as the PDF filename / print header, then restores it. */
  const printResultSheet = () => {
    const prev = document.title;
    document.title = `Result — ${result.studentName} · ${termLabel(result.term)} Term ${result.session}`;
    window.print();
    const restore = () => {
      document.title = prev;
    };
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
      <Card className="print:hidden border-border p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Academic journey
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanent ID:{" "}
              <span className="font-mono font-medium text-foreground">
                {result.studentIdentity ?? result.regNumber}
              </span>
            </p>
          </div>
          <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
            {result.academicHistory.map((item) => (
              <button
                key={item.resultId}
                onClick={() => onSelectResult(item.resultId)}
                disabled={loadingResult || item.resultId === result.resultId}
                className={`min-w-[132px] rounded-xl border px-3 py-2 text-left transition-colors ${item.resultId === result.resultId ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}
              >
                <span className="block text-xs font-semibold">{termLabel(item.term)} Term</span>
                <span
                  className={`block text-[11px] ${item.resultId === result.resultId ? "text-primary-foreground/75" : "text-muted-foreground"}`}
                >
                  {item.session} · {item.averageScore.toFixed(1)}%
                </span>
              </button>
            ))}
          </div>
        </div>
      </Card>
      {/* Action bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <ArrowLeft className="h-4 w-4" /> Check another result
        </Button>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() =>
              document.getElementById("ai-learning-centre")?.scrollIntoView({ behavior: "smooth" })
            }
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" /> AI learning help
          </Button>
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center gap-1 rounded-md border border-border bg-card p-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.05))}
              title="Decrease text size"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-[10px] font-mono w-8 text-center text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setZoom((z) => Math.min(1.2, z + 0.05))}
              title="Increase text size"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsFlipped(!isFlipped)}
            className="gap-1.5 hidden lg:flex"
          >
            <FileCheck2 className="h-4 w-4" /> {isFlipped ? "View Front Page" : "View Back Page"}
          </Button>
          <Button size="sm" variant="outline" onClick={printResultSheet} className="gap-1.5">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      {result.assignments?.length ? (
        <Card className="print:hidden overflow-hidden border-primary/20 shadow-card">
          <div className="border-b bg-primary/[0.035] px-4 py-3 sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Keep learning</p>
                <h2 className="mt-1 font-display text-base font-semibold sm:text-lg">Class assignments & revision</h2>
              </div>
              <BookOpenCheck className="h-5 w-5 shrink-0 text-primary" />
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Work published by your Head Teacher for {result.className}.</p>
          </div>
          <div className="divide-y">
            {result.assignments.map((assignment) => (
              <article key={assignment.id} className="p-4 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold">{assignment.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{assignment.subject}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800">
                    Due {new Date(assignment.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground/80">{assignment.instructions}</p>
              </article>
            ))}
          </div>
        </Card>
      ) : null}

      <div className="flex justify-center print:hidden pb-6 lg:hidden">
        <Button
          onClick={() => setIsFlipped(!isFlipped)}
          variant="outline"
          className="gap-2 rounded-full px-6"
        >
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
          <div
            className={`result-sheet bg-white overflow-hidden rounded-2xl border-2 border-border shadow-[0_24px_80px_rgba(0,0,0,.14)] print:border-none print:shadow-none print:rounded-none mx-auto backface-hidden print:static rs-font-${result?.schoolFontFamily || "inter"} rs-scale-${result?.schoolFontSizeScale || "M"}`}
            style={{ fontWeight: result?.schoolFontWeight || "400" }}
          >
            {/* ── Letterhead — 6 real styles ───────────────────────── */}
            {(() => {
              const style = result.schoolLetterheadStyle ?? "classic-banner";
              const placement = result.schoolLogoPlacement ?? "left";
              const isCenter = placement === "center";
              const isRight = placement === "right";
              const hdrColor =
                !result.schoolHeaderTextColor || result.schoolHeaderTextColor === "auto"
                  ? "#ffffff"
                  : result.schoolHeaderTextColor;
              const printDate = new Date().toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });

              // Layout helpers
              const rowLayout = isCenter
                ? "flex-col items-center text-center"
                : "flex-row items-center justify-between";

              const Logo = result.schoolLogoUrl ? (
                <img
                  src={result.schoolLogoUrl}
                  alt={`${result.school} logo`}
                  className="result-logo h-20 w-20 shrink-0 object-contain z-10 sm:h-24 sm:w-24"
                />
              ) : null;

              const SchoolInfo = (textColor: string, muted: string) => (
                <div className={`z-10 flex-1 ${isCenter ? "text-center" : ""}`}>
                  <h2
                    className="break-words font-bold text-2xl uppercase leading-tight tracking-tight [overflow-wrap:anywhere] sm:text-4xl"
                    style={{ color: textColor }}
                  >
                    {result.school}
                  </h2>
                  {result.schoolMotto && (
                    <p
                      className="mt-1 break-words italic text-sm sm:text-base"
                      style={{ color: muted }}
                    >
                      &ldquo;{result.schoolMotto}&rdquo;
                    </p>
                  )}
                </div>
              );

              // Professional contact strip — used by all styles
              const ContactStrip = (textColor: string, bg?: string) => (
                <div
                  className={`flex flex-wrap items-center gap-x-5 gap-y-1 mt-3 text-[10px] ${isCenter ? "justify-center" : ""}`}
                  style={{
                    color: textColor,
                    ...(bg ? { backgroundColor: bg, padding: "6px 12px", borderRadius: 4 } : {}),
                  }}
                >
                  {result.schoolAddress && (
                    <span className="flex items-center gap-1">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {result.schoolAddress}
                    </span>
                  )}
                  {result.schoolContactPhone && (
                    <span className="flex items-center gap-1">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.93 16.92Z" />
                      </svg>
                      {result.schoolContactPhone}
                    </span>
                  )}
                  {result.schoolContactEmail && (
                    <span className="flex items-center gap-1">
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                      {result.schoolContactEmail}
                    </span>
                  )}
                </div>
              );

              const TermBadge = (onDark: boolean) => (
                <div
                  className={`mt-3 flex items-center gap-3 ${isCenter ? "justify-center" : "justify-between"}`}
                >
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.28em] rounded px-3 py-1"
                    style={
                      onDark
                        ? { backgroundColor: "rgba(255,255,255,0.2)", color: "#ffffff" }
                        : { backgroundColor: primaryColor, color: "#ffffff" }
                    }
                  >
                    Official Academic Record
                  </p>
                  <p
                    className="text-[11px] font-medium"
                    style={{ color: onDark ? "rgba(255,255,255,0.85)" : primaryColor + "cc" }}
                  >
                    {termLabel(result.term)} Term &middot; {result.session} &middot; {printDate}
                  </p>
                </div>
              );

              // Helper: renders logo + school info in correct left/right/center order
              const HeaderRow = (textColor: string, muted: string) => (
                <div className={`relative flex gap-6 ${rowLayout}`}>
                  {isRight ? (
                    <>
                      {SchoolInfo(textColor, muted)}
                      {Logo}
                    </>
                  ) : (
                    <>
                      {Logo}
                      {SchoolInfo(textColor, muted)}
                    </>
                  )}
                </div>
              );

              // ── 1. Classic Banner ──────────────────────────────────────────
              if (style === "classic-banner")
                return (
                  <div
                    className="relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}ee)`,
                    }}
                  >
                    <div
                      className="absolute -right-12 -top-12 h-48 w-48 rounded-full border-[32px] opacity-10"
                      style={{ borderColor: goldColor }}
                    />
                    <div
                      className="absolute -bottom-16 -left-16 h-56 w-56 rounded-full border opacity-10"
                      style={{ borderColor: goldColor }}
                    />
                    <div className="relative px-8 pt-8 pb-4 sm:px-10">
                      {HeaderRow(hdrColor, hdrColor + "bb")}
                      {ContactStrip(hdrColor + "cc")}
                      {TermBadge(true)}
                    </div>
                    <div
                      className="h-[3px]"
                      style={{
                        background: `linear-gradient(90deg, ${goldColor}, ${goldColor}44, ${goldColor})`,
                      }}
                    />
                  </div>
                );

              // ── 2. Arch Crest ─────────────────────────────────────────────
              if (style === "arch-crest")
                return (
                  <div className="bg-white">
                    {/* Arch header: school name curves along an upward arc */}
                    <div
                      className="relative w-full pt-4 px-8 sm:px-10"
                      style={{ overflow: "visible" }}
                    >
                      <svg
                        viewBox="0 0 600 125"
                        preserveAspectRatio="xMidYMid meet"
                        className="w-full"
                        style={{ display: "block", overflow: "visible" }}
                      >
                        <defs>
                          <path id="rs-arch-top" d="M 20 120 A 600 600 0 0 1 580 120" />
                        </defs>
                        <path
                          d="M 20 120 A 600 600 0 0 1 580 120"
                          fill="none"
                          stroke={primaryColor}
                          strokeWidth="1"
                          opacity="0.15"
                        />
                        <text
                          fontWeight="bold"
                          fontSize="28"
                          fill={primaryColor}
                          textAnchor="middle"
                          letterSpacing="4"
                        >
                          <textPath href="#rs-arch-top" startOffset="50%">
                            {result.school.toUpperCase()}
                          </textPath>
                        </text>
                      </svg>

                      {/* Logo + motto row, centred below the arch */}
                      <div className="flex items-center justify-center gap-4 mt-2">
                        {Logo}
                        {result.schoolMotto && (
                          <p
                            className="italic text-sm max-w-xs"
                            style={{ color: primaryColor + "99" }}
                          >
                            &ldquo;{result.schoolMotto}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Contact strip + term badge */}
                    <div className="px-8 pb-3 sm:px-10 text-center">
                      {ContactStrip(primaryColor + "99")}
                    </div>
                    <div className="border-b-4" style={{ borderBottomColor: primaryColor }} />
                    <div className="px-8 py-2 sm:px-10">{TermBadge(false)}</div>
                  </div>
                );

              // ── 3. Royal Split ────────────────────────────────────────────
              if (style === "royal-split")
                return (
                  <div className={`flex min-h-[160px] ${isRight ? "flex-row-reverse" : ""}`}>
                    {/* Coloured sidebar with logo */}
                    <div
                      className="w-36 sm:w-48 flex flex-col items-center justify-center gap-3 px-3 py-6 shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {Logo}
                    </div>
                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="px-6 py-5">
                        <h2
                          className="font-bold text-2xl sm:text-3xl uppercase leading-tight"
                          style={{ color: primaryColor }}
                        >
                          {result.school}
                        </h2>
                        {result.schoolMotto && (
                          <p className="mt-1 italic text-sm text-muted-foreground">
                            &ldquo;{result.schoolMotto}&rdquo;
                          </p>
                        )}
                        {ContactStrip(primaryColor + "88")}
                      </div>
                      <div className="px-6 pb-4 border-t border-border/40">{TermBadge(false)}</div>
                    </div>
                  </div>
                );

              // ── 4. Minimalist Line ────────────────────────────────────────
              if (style === "minimalist-line")
                return (
                  <div className="bg-white px-8 pt-7 pb-4 sm:px-10">
                    {/* Logo + name row */}
                    <div
                      className={`flex gap-4 items-center ${isCenter ? "flex-col text-center" : isRight ? "justify-between" : ""}`}
                    >
                      {isRight ? (
                        <>
                          {SchoolInfo(primaryColor, primaryColor + "99")}
                          {Logo}
                        </>
                      ) : (
                        <>
                          {Logo}
                          <div className={`flex-1 ${isCenter ? "text-center" : ""}`}>
                            <h2
                              className="font-bold text-3xl sm:text-4xl uppercase leading-tight"
                              style={{ color: primaryColor }}
                            >
                              {result.school}
                            </h2>
                            {result.schoolMotto && (
                              <p
                                className="mt-1 italic text-sm"
                                style={{ color: primaryColor + "99" }}
                              >
                                &ldquo;{result.schoolMotto}&rdquo;
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {/* Thick rule */}
                    <div
                      className="mt-4 h-[3px] w-full"
                      style={{
                        background: `linear-gradient(90deg, ${primaryColor}, ${goldColor}, ${primaryColor})`,
                      }}
                    />
                    <div
                      className="mt-1 h-[1px] w-full"
                      style={{ backgroundColor: primaryColor + "33" }}
                    />
                    {/* Contact info row */}
                    {ContactStrip(primaryColor + "88")}
                    {TermBadge(false)}
                  </div>
                );

              // ── 5. Centred Formal ─────────────────────────────────────────
              if (style === "centred-formal")
                return (
                  <div className="bg-white px-8 pt-7 pb-0 sm:px-10">
                    {/* Top decorative rule */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex-1 h-[2px]" style={{ backgroundColor: primaryColor }} />
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: goldColor }}
                      />
                      <div className="flex-1 h-[2px]" style={{ backgroundColor: primaryColor }} />
                    </div>
                    {/* Centred logo + name */}
                    <div className="flex flex-col items-center text-center">
                      {Logo}
                      <h2
                        className="mt-3 font-bold text-3xl sm:text-4xl uppercase tracking-wide"
                        style={{ color: primaryColor }}
                      >
                        {result.school}
                      </h2>
                      {result.schoolMotto && (
                        <p className="mt-1 italic text-sm" style={{ color: primaryColor + "99" }}>
                          &ldquo;{result.schoolMotto}&rdquo;
                        </p>
                      )}
                      {ContactStrip(primaryColor + "88")}
                    </div>
                    {/* Bottom double rule */}
                    <div className="mt-4 flex items-center gap-3">
                      <div className="flex-1 h-[2px]" style={{ backgroundColor: primaryColor }} />
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: goldColor }}
                      />
                      <div className="flex-1 h-[2px]" style={{ backgroundColor: primaryColor }} />
                    </div>
                    <div className="mt-1.5 px-8">{TermBadge(false)}</div>
                  </div>
                );

              // ── 6. Modern Gradient ────────────────────────────────────────
              if (style === "modern-gradient")
                return (
                  <div
                    className="relative overflow-hidden"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}f5, ${primaryColor}bb)`,
                    }}
                  >
                    {/* Geometric accent */}
                    <div
                      className="absolute right-0 top-0 h-full w-2/5 opacity-10"
                      style={{ background: `linear-gradient(135deg, transparent, ${goldColor})` }}
                    />
                    <div className="relative px-8 pt-8 pb-0 sm:px-10">
                      {HeaderRow(hdrColor, hdrColor + "aa")}
                      {ContactStrip(hdrColor + "bb")}
                    </div>
                    <div className="h-1.5 mt-3" style={{ backgroundColor: goldColor }} />
                    <div className="px-8 py-2 sm:px-10">{TermBadge(true)}</div>
                  </div>
                );

              // Fallback
              return null;
            })()}

            {/* ── Student Biodata & Passport Grid ────────────────────────── */}
            <div className="relative border-b-2 border-border bg-muted/15 px-6 py-4 sm:px-8">
              {/* Watermark Crest behind the sheet */}
              {result.schoolLogoUrl && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035] overflow-hidden">
                  <img
                    src={result.schoolLogoUrl}
                    alt=""
                    className="w-80 h-80 object-contain grayscale"
                  />
                </div>
              )}

              <div className="relative z-10 flex flex-col md:flex-row gap-4 items-start justify-between">
                {/* Biodata fields table */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2.5 text-xs w-full">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Pupil / Student Name
                    </p>
                    <p className="mt-0.5 font-bold text-sm text-foreground uppercase tracking-tight">
                      {result.studentName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Admission / Reg No.
                    </p>
                    <p className="mt-0.5 font-mono font-bold text-sm text-primary">
                      {result.regNumber || result.admissionNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Permanent Student ID
                    </p>
                    <p className="mt-0.5 font-mono font-medium text-xs text-muted-foreground">
                      {result.studentIdentity ?? "ICA-STU-VERIFIED"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Class & Arm
                    </p>
                    <p className="mt-0.5 font-semibold text-xs text-foreground">
                      {result.className}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Gender
                    </p>
                    <p className="mt-0.5 font-semibold text-xs text-foreground capitalize">
                      {result.gender || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Academic Term & Session
                    </p>
                    <p className="mt-0.5 font-semibold text-xs text-foreground">
                      {termLabel(result.term)} Term &middot; {result.session}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Term Attendance
                    </p>
                    <p className="mt-0.5 font-semibold text-xs text-foreground">
                      {result.attendance.total > 0
                        ? `${result.attendance.present} / ${result.attendance.total} days (${Math.round((result.attendance.present / result.attendance.total) * 100)}%)`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Days Absent
                    </p>
                    <p className="mt-0.5 font-semibold text-xs text-foreground">
                      {result.timesAbsent ??
                        (result.attendance.total > result.attendance.present
                          ? result.attendance.total - result.attendance.present
                          : 0)}{" "}
                      days
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Next Term Resumption
                    </p>
                    <p className="mt-0.5 font-bold text-xs text-primary">{result.nextTermBegins}</p>
                  </div>
                </div>

                {/* Passport photo box */}
                <div className="shrink-0 self-center md:self-start">
                  <div className="w-24 h-28 rounded-lg border-2 border-border bg-muted/40 p-1 flex flex-col items-center justify-center text-center shadow-xs overflow-hidden">
                    {result.photoUrl ? (
                      <img
                        src={result.photoUrl}
                        alt={result.studentName}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <UserCheck className="h-7 w-7 opacity-40 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest leading-tight">
                          Passport Photo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── PHASE-SPECIFIC SUBJECT PERFORMANCE TABLE ─────────────────────── */}
            <div className="px-4 py-4 sm:px-8">
              {(() => {
                const isPrimary = phase === "primary" || phase === "primary-exit";
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        {isPrimary ? (
                          /* Primary School Table Header */
                          <tr className="border-y-2 border-border bg-muted/40 text-left text-[10px] font-bold uppercase tracking-wider text-foreground">
                            <th className="py-2.5 px-3 w-10 text-center">S/N</th>
                            <th className="py-2.5 px-3">Subject</th>
                            <th className="py-2.5 px-2 text-center w-20">CA (40)</th>
                            <th className="py-2.5 px-2 text-center w-20">Exam (60)</th>
                            <th className="py-2.5 px-2 text-center w-20">Total (100)</th>
                            <th className="py-2.5 px-2 text-center w-16">Grade</th>
                            <th className="py-2.5 px-3 text-left">Remark</th>
                            <th className="py-2.5 px-3 text-center w-16">Sign</th>
                          </tr>
                        ) : (
                          /* Secondary School (WAEC / NECO Standard) Table Header */
                          <tr className="border-y-2 border-border bg-muted/40 text-left text-[10px] font-bold uppercase tracking-wider text-foreground">
                            <th className="py-2.5 px-3 w-10 text-center">S/N</th>
                            <th className="py-2.5 px-3">Subject</th>
                            <th className="py-2.5 px-2 text-center w-16">CA (40)</th>
                            <th className="py-2.5 px-2 text-center w-16">Exam (60)</th>
                            <th className="py-2.5 px-2 text-center w-16 font-extrabold">
                              Total (100)
                            </th>
                            <th className="py-2.5 px-2 text-center w-16 text-muted-foreground">
                              Class Avg
                            </th>
                            <th className="py-2.5 px-2 text-center w-16 text-muted-foreground">
                              Highest
                            </th>
                            <th className="py-2.5 px-2 text-center w-16 text-muted-foreground">
                              Lowest
                            </th>
                            <th className="py-2.5 px-2 text-center w-16 font-semibold">Pos</th>
                            <th className="py-2.5 px-2 text-center w-16">Grade</th>
                            <th className="py-2.5 px-3 text-left">Remark</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {result.subjects.map((s, i) => {
                          return isPrimary ? (
                            /* Primary row */
                            <tr
                              key={i}
                              className={`hover:bg-primary/[0.02] transition-colors ${i % 2 === 0 ? "bg-white" : "bg-muted/15"}`}
                            >
                              <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="py-2 px-3 font-semibold text-foreground">
                                {s.subject}
                              </td>
                              <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                                {s.ca}
                              </td>
                              <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                                {s.exam}
                              </td>
                              <td className="py-2 px-2 text-center font-mono font-bold text-foreground text-sm">
                                {s.total}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span
                                  className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-black ${gradeBg(s.grade)}`}
                                >
                                  {s.grade}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground font-medium">
                                {s.remark || "—"}
                              </td>
                              <td className="py-2 px-3 text-center text-muted-foreground text-[10px] italic">
                                ✓
                              </td>
                            </tr>
                          ) : (
                            /* Secondary row */
                            <tr
                              key={i}
                              className={`hover:bg-primary/[0.02] transition-colors ${i % 2 === 0 ? "bg-white" : "bg-muted/15"}`}
                            >
                              <td className="py-2 px-3 text-center font-mono text-muted-foreground">
                                {i + 1}
                              </td>
                              <td className="py-2 px-3 font-semibold text-foreground">
                                {s.subject}
                              </td>
                              <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                                {s.ca}
                              </td>
                              <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                                {s.exam}
                              </td>
                              <td className="py-2 px-2 text-center font-mono font-bold text-foreground text-sm">
                                {s.total}
                              </td>
                              <td className="py-2 px-2 text-center font-mono text-muted-foreground text-[11px]">
                                {s.classAverage == null ? "—" : s.classAverage.toFixed(1)}
                              </td>
                              <td className="py-2 px-2 text-center font-mono text-muted-foreground text-[11px]">
                                {s.classHighest ?? "—"}
                              </td>
                              <td className="py-2 px-2 text-center font-mono text-muted-foreground text-[11px]">
                                {s.classLowest ?? "—"}
                              </td>
                              <td className="py-2 px-2 text-center font-mono text-muted-foreground text-[11px]">
                                {s.classPosition && s.classSize
                                  ? `${getOrdinalSuffix(s.classPosition)} / ${s.classSize}`
                                  : "—"}
                              </td>
                              <td className="py-2 px-2 text-center">
                                <span
                                  className={`inline-flex items-center justify-center rounded px-2 py-0.5 text-xs font-black ${gradeBg(s.grade)}`}
                                >
                                  {s.grade}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-muted-foreground font-medium">
                                {s.remark || "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>

            {/* ── ACADEMIC SUMMARY & PROMOTION BANNER ───────────────────────── */}
            <div className="border-y-2 border-border bg-muted/25 px-6 py-4 sm:px-8">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-center">
                <SumCell
                  label="Marks Obtained / Obtainable"
                  value={`${total} / ${result.subjects.length * 100}`}
                  bold
                />
                <SumCell label="Overall Term Average" value={`${avg}%`} bold />
                <SumCell
                  label="Class Position"
                  value={
                    result.positionNumber && result.totalStudents
                      ? `${getOrdinalSuffix(result.positionNumber)} of ${result.totalStudents}`
                      : (result.position ?? "Not recorded")
                  }
                  bold
                />
                <SumCell
                  label="Class Average"
                  value={
                    result.classAverage == null ? "—" : `${result.classAverage.toFixed(1)}%`
                  }
                />

                {/* Promotion Verdict Badge */}
                <div className="col-span-2 sm:col-span-1 text-center bg-card rounded-xl border border-border p-2 shadow-xs">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    Promotion Verdict
                  </p>
                  <p
                    className={`mt-0.5 text-xs font-extrabold uppercase tracking-tight ${result.promotionStatus ? "text-emerald-700" : "text-muted-foreground"}`}
                  >
                    {result.promotionStatus || "Not recorded"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── DUAL 5-POINT RATING MATRICES (AFFECTIVE & PSYCHOMOTOR) ─────────── */}
            <div className="grid gap-6 border-b-2 border-border px-6 py-5 sm:grid-cols-2 sm:px-8 bg-white">
              {/* Affective Domain Table */}
              <div className="rounded-xl border border-border/80 overflow-hidden">
                <div className="bg-muted/30 px-3.5 py-2 border-b flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                    Affective Domain (Behavior & Character)
                  </p>
                  <span className="text-[9px] text-muted-foreground font-mono">5=High → 1=Low</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/10 text-[10px] font-semibold text-muted-foreground text-center">
                      <th className="py-1 px-3 text-left">Behavioral Trait</th>
                      <th className="py-1 w-6">5</th>
                      <th className="py-1 w-6">4</th>
                      <th className="py-1 w-6">3</th>
                      <th className="py-1 w-6">2</th>
                      <th className="py-1 w-6">1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {[
                      { trait: "Punctuality" },
                      { trait: "Neatness & Hygiene" },
                      { trait: "Attentiveness in Class" },
                      { trait: "Politeness & Courtesy" },
                      { trait: "Honesty & Integrity" },
                      { trait: "Teamwork & Cooperation" },
                      { trait: "Leadership & Initiative" },
                      { trait: "Self-Control & Discipline" },
                      { trait: "Obedience & Compliance" },
                    ].map((row, i) => {
                      const matched = result.affectiveTraits?.find(
                        (t: any) => (t.label || t.trait) === row.trait,
                      );
                      const rating = matched?.rating;
                      return (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                          <td className="py-1.5 px-3 text-foreground font-medium text-[11px]">
                            {row.trait}
                          </td>
                          {rating ? (
                            [5, 4, 3, 2, 1].map((col) => (
                              <td
                                key={col}
                                className="py-1.5 text-center font-mono font-bold text-xs text-primary"
                              >
                                {rating === col ? "✓" : "—"}
                              </td>
                            ))
                          ) : (
                            <td
                              colSpan={5}
                              className="py-1.5 text-center text-[10px] italic text-muted-foreground"
                            >
                              Not recorded
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Psychomotor Skills Table */}
              <div className="rounded-xl border border-border/80 overflow-hidden">
                <div className="bg-muted/30 px-3.5 py-2 border-b flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-foreground">
                    Psychomotor Domain (Practical Skills)
                  </p>
                  <span className="text-[9px] text-muted-foreground font-mono">5=High → 1=Low</span>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/10 text-[10px] font-semibold text-muted-foreground text-center">
                      <th className="py-1 px-3 text-left">Practical & Physical Skill</th>
                      <th className="py-1 w-6">5</th>
                      <th className="py-1 w-6">4</th>
                      <th className="py-1 w-6">3</th>
                      <th className="py-1 w-6">2</th>
                      <th className="py-1 w-6">1</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {[
                      { skill: "Handwriting & Penmanship" },
                      { skill: "Sports, Games & Physical Fitness" },
                      { skill: "Drawing, Arts & Crafts" },
                      { skill: "Verbal Fluency & Public Speaking" },
                      { skill: "Science Lab & Tools Handling" },
                      { skill: "Musical & Performing Arts" },
                    ].map((row, i) => {
                      const matched = result.psychomotorSkills?.find(
                        (s: any) => (s.label || s.skill) === row.skill,
                      );
                      const rating = matched?.rating;
                      return (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-muted/10"}>
                          <td className="py-1.5 px-3 text-foreground font-medium text-[11px]">
                            {row.skill}
                          </td>
                          {rating ? (
                            [5, 4, 3, 2, 1].map((col) => (
                              <td
                                key={col}
                                className="py-1.5 text-center font-mono font-bold text-xs text-primary"
                              >
                                {rating === col ? "✓" : "—"}
                              </td>
                            ))
                          ) : (
                            <td
                              colSpan={5}
                              className="py-1.5 text-center text-[10px] italic text-muted-foreground"
                            >
                              Not recorded
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── WAIVED SUBJECTS AUDIT NOTE (If any) ────────────────────────── */}
            {result.waivedSubjects && result.waivedSubjects.length > 0 && (
              <div className="border-b-2 border-border bg-amber-50/40 px-6 py-3 sm:px-8 text-xs text-amber-900">
                <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px] text-amber-800">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Official Administrative Subject Waivers
                </div>
                <p className="mt-1 leading-relaxed text-muted-foreground text-[11px]">
                  The following subjects were explicitly waived for this evaluation period under
                  School Admin authorisation:{" "}
                  {result.waivedSubjects.map((w, idx) => (
                    <span key={idx} className="font-semibold text-foreground">
                      {w.subject} ({w.reason}){idx < result.waivedSubjects!.length - 1 ? ", " : "."}
                    </span>
                  ))}
                </p>
              </div>
            )}

            {/* ── OFFICIAL REMARKS SECTION ─────────────────────────────────── */}
            <div className="grid gap-4 border-b-2 border-border bg-muted/10 px-6 py-4 sm:grid-cols-2 sm:px-8">
              <div className="rounded-xl border border-border/80 bg-white p-3.5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Class Teacher's Remark
                </p>
                <p
                  className={`mt-1.5 text-xs leading-relaxed ${result.teacherRemark ? "italic text-foreground/90" : "text-muted-foreground"}`}
                >
                  {result.teacherRemark
                    ? `“${result.teacherRemark}”`
                    : "No class-teacher remark was recorded for this term."}
                </p>
              </div>
              <div className="rounded-xl border border-border/80 bg-white p-3.5 shadow-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {result.schoolHeadTitle ??
                    (phase === "primary" || phase === "primary-exit"
                      ? "Head Teacher"
                      : "Principal")}
                  's Remark
                </p>
                <p
                  className={`mt-1.5 text-xs leading-relaxed ${result.principalRemark ? "italic text-foreground/90" : "text-muted-foreground"}`}
                >
                  {result.principalRemark
                    ? `“${result.principalRemark}”`
                    : "No school-leadership remark was recorded for this term."}
                </p>
              </div>
            </div>

            {/* ── OFFICIAL AUTHENTICATION, SIGNATURES & VERIFICATION SEAL ───────── */}
            <div className="p-6 sm:px-8 bg-white flex flex-col sm:flex-row items-center justify-between gap-6">
              {/* Teacher Sign-off */}
              <div className="text-center sm:text-left">
                <div className="mb-1 h-12 w-40 border-b-2 border-dashed border-border/80 flex items-end justify-center sm:justify-start">
                  <span className="font-serif italic text-xs text-primary/70 mb-1">
                    Class Teacher Signed
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Form / Class Teacher
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date().toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              {/* Digital Tamper-proof Verification Seal */}
              <div className="flex items-center gap-3 rounded-2xl border-2 border-primary/20 bg-primary/[0.03] p-3 text-left">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <QrCode className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-primary">
                    Tamper-Proof Verification
                  </p>
                  <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                    ID: {result.studentIdentity ?? result.regNumber}
                  </p>
                  <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
                    <ShieldCheck className="h-3 w-3" /> Digitally Certified Registry
                  </p>
                </div>
              </div>

              {/* Principal Signature & Official Stamp */}
              <div className="flex items-center gap-4 text-center sm:text-right">
                <div>
                  <div className="mb-1 h-12 w-40 border-b-2 border-dashed border-border/80 flex items-end justify-center sm:justify-end">
                    {result.schoolSignatureUrl ? (
                      <img
                        src={result.schoolSignatureUrl}
                        alt="Signature"
                        className="result-signature h-full w-full object-contain object-right-bottom"
                      />
                    ) : (
                      <span className="font-serif italic text-xs text-primary mb-1">
                        Authorised Signature
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {result.schoolHeadTitle ??
                      (phase === "primary" || phase === "primary-exit"
                        ? "Head Teacher"
                        : "Principal")}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date().toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="relative shrink-0 -rotate-3 select-none transition-transform duration-300 hover:rotate-0">
                  <OfficialSchoolSeal
                    stampUrl={result.schoolStampUrl}
                    schoolName={result.school}
                    city={result.schoolCity}
                    className="h-24 w-24 opacity-95 drop-shadow-[0_2px_4px_rgba(26,54,128,0.08)] sm:h-28 sm:w-28"
                  />
                </div>
              </div>
            </div>

            {/* ── GRADE SCALE LEGEND FOOTER ─────────────────────────────────── */}
            <div className="border-t border-border bg-muted/30 px-6 py-2.5 sm:px-8 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <span className="font-bold text-muted-foreground uppercase tracking-wider">
                  Official Grading Scale ({phaseMeta.label}):
                </span>
                <div className="flex flex-wrap gap-2.5 font-mono">
                  {keyRows.map(({ g, r, color }) => (
                    <span key={g} className="flex items-center gap-1">
                      <span className={`font-black ${color}`}>{g}</span>
                      <span className="text-muted-foreground">({r})</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── BACK PAGE (flipped) ───────────────────────────────── */}
          <div
            className="result-sheet absolute inset-0 bg-white overflow-hidden rounded-2xl border-2 border-border shadow-[0_24px_80px_rgba(0,0,0,.14)] print:hidden backface-hidden mx-auto"
            style={{ transform: "rotateY(180deg)" }}
          >
            <div className="border-b border-border bg-muted/30 px-8 py-4 sm:px-10">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {result.school}
              </p>
              <p className="mt-0.5 font-display text-base font-semibold">
                {backPageTitle} — {termLabel(result.term)} Term {result.session}
              </p>
            </div>

            {/* Answer scripts section */}
            {result.answerScripts && result.answerScripts.length > 0 && (
              <div className="px-8 py-5 sm:px-10">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Marked answer scripts
                </p>
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
                        <p className="text-[10px] text-muted-foreground">
                          Score: {script.score} · Click to view
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Performance summary on back page */}
            <div className="px-8 py-4 sm:px-10 border-t border-border">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Performance summary
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center rounded-xl border border-border p-3">
                  <p className="text-2xl font-bold text-foreground">{avg}%</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Average score</p>
                </div>
                {result.classAverage != null && (
                  <div className="text-center rounded-xl border border-border p-3">
                    <p
                      className={`text-2xl font-bold flex items-center justify-center gap-1 ${trendColor}`}
                    >
                      {result.classAverage.toFixed(1)}%
                      <TrendIcon className="h-4 w-4" />
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Class average</p>
                  </div>
                )}
                {result.positionNumber && result.totalStudents && (
                  <div className="text-center rounded-xl border border-border p-3">
                    <p className="text-2xl font-bold text-foreground">
                      {getOrdinalSuffix(result.positionNumber)}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      of {result.totalStudents} students
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ══ AI INSIGHTS ══════════════════════════════════════════════ */}
      <Card
        id="ai-learning-centre"
        className="scroll-mt-6 border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent p-5 shadow-card print:hidden sm:p-6"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
              <BrainCircuit className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold">Your AI learning centre</h3>
              <p className="text-xs text-muted-foreground">
                Understand the result, get a next-term plan, or create practice work with answers.
              </p>
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
          onSubmit={(e) => {
            e.preventDefault();
            getAiRecommendations();
          }}
          className="mt-3 flex gap-2"
        >
          <Input
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            placeholder="Ask anything about this result…"
            className="flex-1 text-sm"
            disabled={aiLoading}
          />
          <Button
            type="submit"
            size="sm"
            disabled={aiLoading || !aiQuestion.trim()}
            className="gap-1.5"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
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

      <Card
        id="practice-quiz"
        className="scroll-mt-6 border-border p-5 shadow-card print:hidden sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10">
              <BookOpenCheck className="h-5 w-5 text-emerald-600" />
            </span>
            <div>
              <h3 className="font-display text-base font-semibold">Practice from this result</h3>
              <p className="text-xs text-muted-foreground">
                Five focused questions for each weak-subject category, with answers revealed after
                submission.
              </p>
            </div>
          </div>
          <Button
            onClick={createQuiz}
            disabled={quizLoading}
            variant={quiz ? "outline" : "default"}
            className="shrink-0 gap-2"
          >
            {quizLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {quiz ? "Create another quiz" : "Create practice quiz"}
          </Button>
        </div>

        {quiz && (
          <div className="mt-5 space-y-4">
            <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <strong className="text-foreground">Focus:</strong> {quiz.focus}
            </p>
            {quiz.questions.map((question, questionIndex) => {
              const reviewed = quizReview?.review[questionIndex];
              return (
                <div
                  key={`${question.subject}-${questionIndex}`}
                  className="rounded-xl border border-border p-4"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {question.subject}
                  </p>
                  <p className="mt-1 text-sm font-semibold leading-6">
                    {questionIndex + 1}. {question.question}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <button
                        key={optionIndex}
                        type="button"
                        disabled={Boolean(quizReview)}
                        onClick={() =>
                          setQuizAnswers((answers) =>
                            answers.map((value, index) =>
                              index === questionIndex ? optionIndex : value,
                            ),
                          )
                        }
                        className={`rounded-lg border px-3 py-2 text-left text-xs transition-colors ${reviewed ? (optionIndex === reviewed.answerIndex ? "border-emerald-500 bg-emerald-50 text-emerald-800" : optionIndex === reviewed.selectedIndex ? "border-red-400 bg-red-50 text-red-700" : "border-border") : quizAnswers[questionIndex] === optionIndex ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40"}`}
                      >
                        {String.fromCharCode(65 + optionIndex)}. {option}
                      </button>
                    ))}
                  </div>
                  {reviewed && (
                    <p
                      className={`mt-3 rounded-lg px-3 py-2 text-xs leading-5 ${reviewed.correct ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900"}`}
                    >
                      {reviewed.explanation}
                    </p>
                  )}
                </div>
              );
            })}
            {quizReview ? (
              <div className="rounded-xl bg-[#071a2e] p-4 text-white">
                <p className="text-lg font-semibold">You scored {quizReview.score}%</p>
                <p className="mt-1 text-xs text-white/70">
                  {quizReview.correct} of {quizReview.review.length} correct. Review the
                  explanations above before trying another quiz.
                </p>
              </div>
            ) : (
              <Button
                onClick={submitQuiz}
                disabled={quizLoading || quizAnswers.some((answer) => answer < 0)}
                className="w-full sm:w-auto"
              >
                Submit answers
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* ══ EMAIL REPORT CARD ════════════════════════════════════════ */}
      <Card className="print:hidden border-border p-5 shadow-card sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10">
            <Mail className="h-5 w-5 text-primary" />
          </span>
          <div>
            <h3 className="font-display text-base font-semibold">Email this report card</h3>
            <p className="text-xs text-muted-foreground">
              Send a formatted copy to a parent or guardian
            </p>
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
            {emailLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
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
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xs font-semibold text-foreground">{value}</p>
    </div>
  );
}

function SumCell({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-0.5 text-sm ${bold ? "font-bold text-foreground" : "text-muted-foreground"}`}
      >
        {value}
      </p>
    </div>
  );
}
