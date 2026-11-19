import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Save,
  CheckCircle2,
  FileSignature,
  Award,
  GraduationCap,
  ClipboardCheck,
  Loader2,
  FileText,
  Info,
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  BookOpen,
  FlaskConical,
  ShieldCheck,
  PencilLine,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileDrop, type DroppedFile } from "@/components/file-drop";
import {
  getStudentsDb,
  addResultDb,
  uploadToCloudinaryDb,
  generateSchoolAdminIntelligenceDb,
  getSchoolProfileDb,
  getResultsDb,
  reviewResultSubmissionDb,
  getExpectedSubjectsDb,
  getResultReviewDetailDb,
  waiveResultSubjectDb,
} from "@/lib/api/db.functions";
import { FormattedAiOutput } from "@/components/formatted-ai-output";
import { getSchoolCode, getCurrentAcademicSession } from "@/lib/utils";
import { AcademicWorkspaceNav } from "@/components/academic-workspace-nav";
import { ResultImageImporter } from "@/components/result-image-importer";
import {
  detectPhase,
  gradeForPhase,
  gradeBadgeClass,
  scoreBarClass,
  gradeKeyRows,
  PHASE_META,
  type AnyGrade,
  type ClassPhase,
} from "@/lib/class-phase";

export const Route = createFileRoute("/dashboard/results")({
  head: () => ({ meta: [{ title: "Result Control — iCademia" }] }),
  component: ResultsPage,
});

type StudentRecord = {
  id: number;
  name: string;
  class_name: string;
  registration_number: string;
};

type SubjectRecord = {
  id: number;
  name: string;
  code?: string;
};

type SchoolProfile = Partial<{
  name: string;
  motto: string;
  address: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  header_text_color: string;
  letterhead_style: string;
  logo_placement: string;
  font_family: string;
  font_size_scale: string;
  font_weight: string;
}>;

type ReviewGrade = {
  subject: string;
  ca_score?: number;
  exam_score?: number;
  score: number;
  grade: string;
};

type ReviewDetail = {
  result: {
    id: number;
    student_name: string;
    registration_number: string;
    class_name: string;
    term: string;
    session: string;
    average_score?: number;
    remarks?: string;
    principal_remarks?: string;
  };
  grades: ReviewGrade[];
  expectedSubjects: SubjectRecord[];
  missingSubjects: string[];
};

type ReviewResult = {
  id: number;
  student_name: string;
  registration_number: string;
  term: string;
  session: string;
  average_score?: number;
  workflow_status?: string;
  submitted_at?: string;
  review_note?: string;
  scored_subjects?: number;
  expected_subjects?: number;
  waived_subjects_count?: number;
  class_name?: string;
};

type ResultsPageCache = {
  schoolCode: string;
  students: StudentRecord[];
  schoolProfile: SchoolProfile | null;
  reviewResults: ReviewResult[];
};

let resultsPageCache: ResultsPageCache | null = null;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (file.type.startsWith("image/")) {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX_DIM = 1600;
        let width = img.width;
        let height = img.height;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
          return;
        }
        // Fallback if canvas context unavailable
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
      };
      img.src = url;
    } else {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (e) => reject(e);
    }
  });

const getAdminToken = () =>
  typeof window === "undefined" ? "" : localStorage.getItem("icademia_admin_token") || "";

function ResultsPage() {
  const schoolCode = getSchoolCode();
  const cached = resultsPageCache?.schoolCode === schoolCode ? resultsPageCache : null;
  const [students, setStudents] = useState<StudentRecord[]>(cached?.students ?? []);
  const [studentsLoading, setStudentsLoading] = useState(!cached);
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile | null>(
    cached?.schoolProfile ?? null,
  );
  const [reviewResults, setReviewResults] = useState<ReviewResult[]>(cached?.reviewResults ?? []);
  const [expectedSubjects, setExpectedSubjects] = useState<SubjectRecord[]>([]);
  const [subjectSource, setSubjectSource] = useState<"configured" | "inferred">("inferred");
  const [workspaceMode, setWorkspaceMode] = useState<"review" | "manual">("review");
  const [reviewDetail, setReviewDetail] = useState<ReviewDetail | null>(null);
  const [reviewDetailLoading, setReviewDetailLoading] = useState(false);

  const [student, setStudent] = useState("");
  const [term, setTerm] = useState("Second Term");
  const [session, setSession] = useState(getCurrentAcademicSession());
  const [remark, setRemark] = useState("");
  const [principalRemark, setPrincipalRemark] = useState("");
  const [attendancePresent, setAttendancePresent] = useState("");
  const [attendanceTotal, setAttendanceTotal] = useState("");
  const [timesAbsent, setTimesAbsent] = useState("");
  const [resumptionDate, setResumptionDate] = useState("");
  const [promotionStatus, setPromotionStatus] = useState<string>("");
  const [promotedToClass, setPromotedToClass] = useState("");
  const [externalRegNumber, setExternalRegNumber] = useState("");

  // Waived subjects mapping: { [subjectName]: waiverReason }
  const [waivedSubjects, setWaivedSubjects] = useState<Record<string, string>>({});
  const [waivingSubject, setWaivingSubject] = useState<string | null>(null);
  const [waiveReason, setWaiveReason] = useState("Elective Subject Exemption");

  // Affective traits ratings: { [traitName]: rating 1-5 }
  const [affectiveTraits, setAffectiveTraits] = useState<Record<string, number | undefined>>({
    Punctuality: undefined,
    "Neatness & Hygiene": undefined,
    "Attentiveness in Class": undefined,
    "Politeness & Courtesy": undefined,
    "Honesty & Integrity": undefined,
    "Teamwork & Cooperation": undefined,
    "Leadership & Initiative": undefined,
    "Self-Control & Discipline": undefined,
    "Obedience & Compliance": undefined,
  });

  // Psychomotor skills ratings: { [skillName]: rating 1-5 }
  const [psychomotorSkills, setPsychomotorSkills] = useState<Record<string, number | undefined>>({
    "Handwriting & Penmanship": undefined,
    "Sports, Games & Physical Fitness": undefined,
    "Drawing, Arts & Crafts": undefined,
    "Verbal Fluency & Public Speaking": undefined,
    "Science Lab & Tools Handling": undefined,
    "Musical & Performing Arts": undefined,
  });

  // scores[subject] = { ca, exam, mock, practical }
  const [scores, setScores] = useState<
    Record<string, { ca: string; exam: string; mock: string; practical: string }>
  >({});

  const [publishing, setPublishing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [answerScripts, setAnswerScripts] = useState<DroppedFile[]>([]);
  const [testimonials, setTestimonials] = useState<DroppedFile[]>([]);
  const [transcripts, setTranscripts] = useState<DroppedFile[]>([]);

  const [aiLoading, setAiLoading] = useState<"readiness" | "anomaly" | "remarks" | null>(null);
  const [aiOutput, setAiOutput] = useState("");
  const [aiActiveWorkflow, setAiActiveWorkflow] = useState<
    "result_readiness" | "anomaly_detection" | null
  >(null);
  const [suggestedRemarks, setSuggestedRemarks] = useState<string | null>(null);

  // ── Derived phase ────────────────────────────────────────────────────────
  const currentStudent = students.find((s) => s.id.toString() === student);
  const className = currentStudent?.class_name ?? "";
  const phase: ClassPhase = className ? detectPhase(className) : "junior";
  const meta = PHASE_META[phase];

  useEffect(() => {
    if (!className) {
      setExpectedSubjects([]);
      return;
    }
    const token = getAdminToken();
    if (!token) return;
    void getExpectedSubjectsDb({ data: { token, schoolCode, className } })
      .then((result) => {
        setExpectedSubjects(result.subjects as unknown as SubjectRecord[]);
        setSubjectSource(result.source as "configured" | "inferred");
        setScores(
          Object.fromEntries(
            (result.subjects as unknown as SubjectRecord[]).map((item) => [
              item.name,
              { ca: "", exam: "", mock: "", practical: "" },
            ]),
          ),
        );
        setWaivedSubjects({});
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load class subjects."),
      );
  }, [className, schoolCode]);

  // ── AI helpers ───────────────────────────────────────────────────────────
  const runAiAudit = async (workflow: "result_readiness" | "anomaly_detection") => {
    setAiLoading(workflow === "result_readiness" ? "readiness" : "anomaly");
    setAiActiveWorkflow(workflow);
    try {
      const res = await generateSchoolAdminIntelligenceDb({ data: { token: getAdminToken(), schoolCode, workflow } });
      setAiOutput(res.output);
    } catch (err) {
      toast.error("Failed to run AI audit", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setAiLoading(null);
    }
  };

  const draftRemarks = async () => {
    if (!student) {
      toast.error("Please select a student first.");
      return;
    }
    setAiLoading("remarks");
    try {
      const res = await generateSchoolAdminIntelligenceDb({
        data: { token: getAdminToken(), schoolCode, workflow: "remarks_assistant" },
      });
      setSuggestedRemarks(res.output);
      toast.success("Drafted remarks successfully!");
    } catch (err) {
      toast.error("Failed to draft remarks", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setAiLoading(null);
    }
  };
  // ── Data loading ─────────────────────────────────────────────────────────
  useEffect(() => {
    const cachedProfile = localStorage.getItem(`icademia_profile_${schoolCode}`);
    if (cachedProfile) {
      setSchoolProfile(JSON.parse(cachedProfile));
    }

    const load = async () => {
      setStudentsLoading(true);
      try {
        const [list, profileFresh, resultList] = await Promise.all([
          getStudentsDb({ data: { token: getAdminToken(), schoolCode } }),
          getSchoolProfileDb({ data: { schoolCode } }).catch(() => null),
          getResultsDb({ data: { token: getAdminToken(), schoolCode } }),
        ]);
        const nextStudents = list as unknown as StudentRecord[];
        const nextResults = resultList as unknown as ReviewResult[];
        const nextProfile =
          (profileFresh as SchoolProfile | null) ?? resultsPageCache?.schoolProfile ?? null;
        setStudents(nextStudents);
        setReviewResults(nextResults);
        if (profileFresh) {
          setSchoolProfile(profileFresh as SchoolProfile);
          localStorage.setItem(`icademia_profile_${schoolCode}`, JSON.stringify(profileFresh));
        }
        resultsPageCache = {
          schoolCode,
          students: nextStudents,
          schoolProfile: nextProfile,
          reviewResults: nextResults,
        };
        if (list.length > 0) setStudent(list[0].id.toString());
      } catch (err) {
        console.error(err);
      } finally {
        setStudentsLoading(false);
      }
    };
    void load();
  }, [schoolCode]);

  const reviewSubmission = async (resultId: number, decision: "Published" | "Returned") => {
    const note =
      decision === "Returned"
        ? window.prompt("What should the Head Teacher correct?")?.trim()
        : undefined;
    if (decision === "Returned" && !note) return;
    try {
      await reviewResultSubmissionDb({
        data: { token: getAdminToken(), schoolCode, resultId, decision, note },
      });
      setReviewResults((items) =>
        items.map((item) =>
          item.id === resultId ? { ...item, workflow_status: decision, review_note: note } : item,
        ),
      );
      toast.success(
        decision === "Published" ? "Result published" : "Result returned for correction",
      );
      setReviewDetail(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not review submission.");
    }
  };

  const openReviewDetail = async (resultId: number) => {
    setReviewDetailLoading(true);
    try {
      const detail = await getResultReviewDetailDb({
        data: { token: getAdminToken(), schoolCode, resultId },
      });
      setReviewDetail(detail as unknown as ReviewDetail);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load this submission.");
    } finally {
      setReviewDetailLoading(false);
    }
  };

  const waiveReviewSubject = async (subject: string) => {
    if (!reviewDetail?.result?.id) return;
    const reason = window.prompt(`Reason for waiving ${subject} for this student?`)?.trim();
    if (!reason) return;
    try {
      await waiveResultSubjectDb({
        data: {
          token: getAdminToken(),
          schoolCode,
          resultId: Number(reviewDetail.result.id),
          subject,
          reason,
        },
      });
      await openReviewDetail(Number(reviewDetail.result.id));
      setReviewResults((items) =>
        items.map((item) =>
          item.id === Number(reviewDetail.result.id)
            ? { ...item, waived_subjects_count: Number(item.waived_subjects_count ?? 0) + 1 }
            : item,
        ),
      );
      toast.success(`${subject} waived for ${reviewDetail.result.student_name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not record waiver.");
    }
  };

  // ── Score helpers ────────────────────────────────────────────────────────
  const setScore = (subj: string, key: "ca" | "exam" | "mock" | "practical", val: string) =>
    setScores((p) => ({
      ...p,
      [subj]: { ...p[subj], [key]: val.replace(/[^0-9]/g, "") },
    }));

  const getTotal = (subj: string) => {
    const s = scores[subj] ?? { ca: "0", exam: "0", mock: "0", practical: "0" };
    return parseInt(s.ca || "0", 10) + parseInt(s.exam || "0", 10);
  };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student) {
      toast.error("Please select a student first.");
      return;
    }
    setPublishing(true);
    try {
      const uploadedScripts: { subject: string; url: string; score: number; grade: string }[] = [];
      for (const script of answerScripts) {
        if (script.rawFile) {
          const base64 = await fileToBase64(script.rawFile);
          const uploadRes = await uploadToCloudinaryDb({ data: { base64Image: base64 } });
          const matchedSubject =
            expectedSubjects.find((subj) =>
              script.name.toLowerCase().includes(subj.name.toLowerCase()),
            )?.name ??
            expectedSubjects[0]?.name ??
            "General";
          const total = getTotal(matchedSubject);
          uploadedScripts.push({
            subject: matchedSubject,
            url: uploadRes.url,
            score: total,
            grade: total > 0 ? gradeForPhase(total, phase).grade : "N/A",
          });
        }
      }

      // ── Completeness verification ──
      const missingSubjects = expectedSubjects.filter((subj) => {
        const s = subj.name;
        const total = parseInt(scores[s]?.ca || "0", 10) + parseInt(scores[s]?.exam || "0", 10);
        return total === 0 && !waivedSubjects[s];
      });

      if (missingSubjects.length > 0) {
        toast.error("Publication blocked by Result Completeness Rule", {
          description: `Missing scores for: ${missingSubjects.map((s) => s.name).join(", ")}. Enter scores or waive with an administrative note.`,
        });
        setPublishing(false);
        return;
      }

      const gradesList = expectedSubjects
        .map((subject) => {
          const s = subject.name;
          const ca = parseInt(scores[s]?.ca || "0", 10);
          const exam = parseInt(scores[s]?.exam || "0", 10);
          const total = ca + exam;
          const grade = gradeForPhase(total, phase).grade;
          return { subject: s, caScore: ca, examScore: exam, score: total, grade };
        })
        .filter((g) => g.score > 0);

      if (gradesList.length === 0 && Object.keys(waivedSubjects).length === 0) {
        toast.error("Please enter at least one score before publishing.");
        setPublishing(false);
        return;
      }

      const totalSum = gradesList.reduce((acc, g) => acc + g.score, 0);
      const averageScore = gradesList.length > 0 ? totalSum / gradesList.length : 0;
      const totalStudents = students.filter((s) => s.class_name === className).length;

      const affectiveList = Object.entries(affectiveTraits)
        .filter(([, rating]) => rating !== undefined)
        .map(([trait, rating]) => ({ trait, rating: rating! }));

      const psychomotorList = Object.entries(psychomotorSkills)
        .filter(([, rating]) => rating !== undefined)
        .map(([skill, rating]) => ({ skill, rating: rating! }));

      const waivedList = Object.entries(waivedSubjects).map(([subject, reason]) => ({
        subject,
        reason,
      }));

      await addResultDb({
        data: {
          token: getAdminToken(),
          schoolCode,
          studentId: Number(student),
          term,
          session,
          averageScore,
          positionNumber: 0,
          totalStudents,
          remarks: remark,
          principalRemarks: principalRemark,
          attendancePresent: Number(attendancePresent || 0),
          attendanceTotal: Number(attendanceTotal || 0),
          timesAbsent: Number(timesAbsent || 0),
          resumptionDate: resumptionDate || undefined,
          promotionStatus: promotionStatus || undefined,
          promotedToClass: promotedToClass || undefined,
          affectiveTraits: affectiveList,
          psychomotorSkills: psychomotorList,
          waivedSubjects: waivedList,
          grades: gradesList,
          answerScripts: uploadedScripts.map((sc) => ({
            subject: sc.subject,
            score: sc.score,
            grade: sc.grade,
            cloudinaryUrl: sc.url,
          })),
        },
      });

      toast.success("Result published successfully!", {
        description: `Complete report card for ${currentStudent?.name} saved to the official registry.`,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
      setScores(
        Object.fromEntries(
          expectedSubjects.map((s) => [s.name, { ca: "", exam: "", mock: "", practical: "" }]),
        ),
      );
      setWaivedSubjects({});
      setAnswerScripts([]);
      setRemark("");
      setPrincipalRemark("");
      setAttendancePresent("");
      setAttendanceTotal("");
      setTimesAbsent("");
      setPromotionStatus("");
      setPromotedToClass("");
      setAffectiveTraits({
        Punctuality: undefined,
        "Neatness & Hygiene": undefined,
        "Attentiveness in Class": undefined,
        "Politeness & Courtesy": undefined,
        "Honesty & Integrity": undefined,
        "Teamwork & Cooperation": undefined,
        "Leadership & Initiative": undefined,
        "Self-Control & Discipline": undefined,
        "Obedience & Compliance": undefined,
      });
      setPsychomotorSkills({
        "Handwriting & Penmanship": undefined,
        "Sports, Games & Physical Fitness": undefined,
        "Drawing, Arts & Crafts": undefined,
        "Verbal Fluency & Public Speaking": undefined,
        "Science Lab & Tools Handling": undefined,
        "Musical & Performing Arts": undefined,
      });
      setExternalRegNumber("");
    } catch (err) {
      toast.error("Failed to publish result", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setPublishing(false);
    }
  };

  // ── Live preview computed rows ────────────────────────────────────────────
  const computedRows = expectedSubjects.map((subject) => {
    const s = subject.name;
    const ca = parseInt(scores[s]?.ca || "0", 10);
    const ex = parseInt(scores[s]?.exam || "0", 10);
    const total = ca + ex;
    const { grade, remark: gradeRemark } =
      total > 0 ? gradeForPhase(total, phase) : { grade: "—" as const, remark: "—" };
    return { subject: s, ca, ex, total, grade: grade as string, gradeRemark };
  });

  const filledRows = computedRows.filter((r) => r.total > 0);
  const avg =
    filledRows.length > 0
      ? Math.round(filledRows.reduce((a, r) => a + r.total, 0) / filledRows.length)
      : null;

  const keyRows = gradeKeyRows(phase);

  return (
    <>
      <AcademicWorkspaceNav />
      <div className="min-h-screen p-4 sm:p-6 lg:p-8">
        {/* ── Page header ──────────────────────────────────────────────────── */}
        <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Result Review & Publication
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review Head Teacher submissions first. Use manual entry only for authorised
              corrections or record migration.
            </p>
          </div>
          {/* Phase badge — shows as soon as a student is selected */}
          {className && (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${meta.color} ${meta.textColor}`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              {meta.label}
              {meta.externalExamShort && (
                <span className="ml-1 rounded-full bg-white/60 px-1.5 py-0.5 text-[10px] font-bold">
                  {meta.externalExamShort}
                </span>
              )}
            </span>
          )}
        </header>

        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-bold">School Admin review workspace</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Check Head Teacher submissions, return corrections, approve authorised waivers and
                publish complete results.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setWorkspaceMode((current) => (current === "review" ? "manual" : "review"))}
            className="w-full shrink-0 bg-background sm:w-auto"
          >
            {workspaceMode === "manual" ? (
              <><ShieldCheck className="mr-1.5 h-4 w-4" /> Return to review queue</>
            ) : (
              <><PencilLine className="mr-1.5 h-4 w-4" /> Advanced correction or migration</>
            )}
          </Button>
        </div>

        <ResultImageImporter
          actor={{ kind: "school", token: getAdminToken() }}
          schoolCode={schoolCode}
          onImported={async () => {
            const refreshed = (await getResultsDb({
              data: { token: getAdminToken(), schoolCode },
            })) as unknown as ReviewResult[];
            setReviewResults(refreshed);
            if (resultsPageCache?.schoolCode === schoolCode) {
              resultsPageCache = { ...resultsPageCache, reviewResults: refreshed };
            }
          }}
        />

        <Card className={`${workspaceMode === "review" ? "block" : "hidden"} mb-6 border-primary/20 shadow-card`}>
          <div className="border-b p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">Submission review queue</h2>
                <p className="text-xs text-muted-foreground">
                  Approve submitted records or return them with a correction note.
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                {reviewResults.filter((item) => item.workflow_status === "Submitted").length}{" "}
                awaiting review
              </span>
            </div>
          </div>
          <div className="divide-y">
            {reviewResults
              .filter((item) => item.workflow_status === "Submitted")
              .slice(0, 8)
              .map((item) => {
                const expected = Number(item.expected_subjects ?? 0);
                const accountedFor =
                  Number(item.scored_subjects ?? 0) + Number(item.waived_subjects_count ?? 0);
                const missing = Math.max(0, expected - accountedFor);
                const isReady = missing === 0;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words text-sm font-semibold">{item.student_name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                        >
                          {isReady
                            ? "Ready to publish"
                            : `${missing} subject${missing === 1 ? "" : "s"} missing`}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {item.registration_number} · {item.class_name || "Class not recorded"} ·{" "}
                        {item.term} · {item.session}
                        {item.average_score != null
                          ? ` · ${Number(item.average_score).toFixed(1)}%`
                          : ""}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 min-[420px]:flex-row">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => reviewSubmission(item.id, "Returned")}
                      >
                        Return
                      </Button>
                      <Button
                        size="sm"
                        variant={isReady ? "default" : "secondary"}
                        disabled={reviewDetailLoading}
                        onClick={() => openReviewDetail(item.id)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Review record
                      </Button>
                    </div>
                  </div>
                );
              })}
            {reviewResults.every((item) => item.workflow_status !== "Submitted") ? (
              <p className="p-6 text-center text-sm text-muted-foreground">
                Nothing is waiting for review.
              </p>
            ) : null}
          </div>
        </Card>

        {workspaceMode === "review" ? (
          <Card className="border-dashed p-6 text-center shadow-none">
            <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
            <h2 className="mt-3 font-semibold">You are in review mode</h2>
            <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">
              Subject scores belong to each student submission in the queue above. Head Teachers
              enter and submit them; the School Admin reviews, returns, waives when authorised, and
              publishes. Open correction mode only when direct editing is necessary.
            </p>
          </Card>
        ) : null}

        {/* External exam alert banner */}
        {meta.externalExam && className && (
          <div
            className={`mb-5 items-start gap-3 rounded-xl border px-5 py-4 ${workspaceMode === "manual" ? "flex" : "hidden"} ${meta.color} border-current/20`}
          >
            <GraduationCap className={`h-5 w-5 shrink-0 mt-0.5 ${meta.textColor}`} />
            <div>
              <p className={`text-sm font-semibold ${meta.textColor}`}>
                {meta.externalExam} — Exit Year
              </p>
              <p className={`text-xs mt-0.5 opacity-80 ${meta.textColor}`}>
                This class is preparing for an external examination. Mock column and external reg
                number fields are active.
              </p>
            </div>
          </div>
        )}

        <div
          className={`${workspaceMode === "manual" ? "grid" : "hidden"} gap-6 xl:grid-cols-[1fr_420px]`}
        >
          {/* ══ LEFT — Entry form ═══════════════════════════════════════════ */}
          <form onSubmit={handleSave} className="space-y-5">
            {/* Student / Term / Session */}
            <Card className="border-border shadow-card overflow-hidden">
              <div className="border-b border-border bg-muted/30 px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Record owner — scores entered below belong to this student
                </p>
              </div>
              {currentStudent ? (
                <div className="border-b border-primary/15 bg-primary/5 px-5 py-4">
                  <p className="text-base font-bold">{currentStudent.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {currentStudent.registration_number} · {currentStudent.class_name} · {term} ·{" "}
                    {session}
                  </p>
                </div>
              ) : null}
              <div className="grid gap-4 p-5 sm:grid-cols-3">
                <div>
                  <Label className="text-xs font-medium">Student</Label>
                  {studentsLoading ? (
                    <div className="mt-2 flex items-center gap-2 text-muted-foreground text-xs">
                      <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                    </div>
                  ) : students.length === 0 ? (
                    <div className="mt-2 text-xs text-destructive">No students enrolled yet.</div>
                  ) : (
                    <Select value={student} onValueChange={setStudent}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((s) => (
                          <SelectItem key={s.id} value={s.id.toString()}>
                            {s.name} · {s.registration_number}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <Label className="text-xs font-medium">Term</Label>
                  <Select value={term} onValueChange={setTerm}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Term">First Term</SelectItem>
                      <SelectItem value="Second Term">Second Term</SelectItem>
                      <SelectItem value="Third Term">Third Term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-medium">Session</Label>
                  <Input
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    className="mt-1.5"
                    placeholder={`e.g. ${getCurrentAcademicSession()}`}
                  />
                </div>
              </div>
              {/* External reg field — only for exit phases */}
              {meta.hasExternalRegField && className && (
                <div className={`border-t border-border px-5 py-4 ${meta.color}/30`}>
                  <Label className="text-xs font-medium">
                    {meta.externalExamShort} Registration Number
                  </Label>
                  <Input
                    value={externalRegNumber}
                    onChange={(e) => setExternalRegNumber(e.target.value)}
                    className="mt-1.5 font-mono"
                    placeholder={
                      phase === "senior-exit"
                        ? "e.g. 4120122345"
                        : phase === "junior-exit"
                          ? "e.g. NJ/2025/012345"
                          : "e.g. CE/2025/00123"
                    }
                  />
                </div>
              )}
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="scores" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="scores">Scores</TabsTrigger>
                <TabsTrigger value="development">Development</TabsTrigger>
                <TabsTrigger value="documents">Documents</TabsTrigger>
                <TabsTrigger value="ai-audit">AI Audit</TabsTrigger>
              </TabsList>

              {/* ── Scores Tab ─────────────────────────────────────────────── */}
              <TabsContent value="scores" className="mt-4 space-y-4">
                {/* Completeness & Waiver Audit Card */}
                {(() => {
                  const scoredCount = expectedSubjects.filter((s) => getTotal(s.name) > 0).length;
                  const waivedCount = expectedSubjects.filter(
                    (s) => !!waivedSubjects[s.name],
                  ).length;
                  const missingSubjectsList = expectedSubjects.filter(
                    (s) => getTotal(s.name) === 0 && !waivedSubjects[s.name],
                  );
                  const isComplete =
                    expectedSubjects.length > 0 && missingSubjectsList.length === 0;

                  return (
                    <Card
                      className={`border-2 p-4 transition-colors ${isComplete ? "border-emerald-500/40 bg-emerald-50/30" : "border-amber-400/40 bg-amber-50/20"}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          {isComplete ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                                Result Completeness Rule
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isComplete ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                              >
                                {isComplete ? "100% Ready to Publish" : "Publication Blocked"}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {scoredCount} of {expectedSubjects.length} class subjects scored
                              {waivedCount > 0 && ` · ${waivedCount} explicitly waived`}.
                              {!isComplete && (
                                <span className="text-amber-700 font-medium ml-1">
                                  Missing scores for:{" "}
                                  {missingSubjectsList.map((s) => s.name).join(", ")}.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        {!isComplete && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (missingSubjectsList.length > 0) {
                                setWaivingSubject(missingSubjectsList[0].name);
                              }
                            }}
                            className="text-xs border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 shrink-0"
                          >
                            Waive Missing Subject
                          </Button>
                        )}
                      </div>
                      {subjectSource === "inferred" ? (
                        <div className="mt-3 flex flex-col gap-2 border-t border-amber-200 pt-3 text-xs text-amber-800 sm:flex-row sm:items-center sm:justify-between">
                          <span>
                            This class has no confirmed subject offering. The current list was
                            inferred from academic activity.
                          </span>
                          <Button
                            asChild
                            type="button"
                            variant="outline"
                            size="sm"
                            className="w-full border-amber-300 bg-white sm:w-auto"
                          >
                            <Link to="/dashboard/subjects">Configure class subjects</Link>
                          </Button>
                        </div>
                      ) : null}
                    </Card>
                  );
                })()}

                <Card className="border-border shadow-card overflow-hidden">
                  <div className="border-b border-border bg-muted/30 px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Subject Scores
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{meta.assessmentLabel}</p>
                    </div>
                    {avg !== null && (
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${avg >= 50 ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
                      >
                        Avg: {avg}%
                      </span>
                    )}
                  </div>
                  <div className="grid gap-3 p-4 md:hidden">
                    {expectedSubjects.map((subject) => {
                      const subjectName = subject.name;
                      const isWaived = Boolean(waivedSubjects[subjectName]);
                      const total = getTotal(subjectName);
                      const grade = isWaived
                        ? "W"
                        : total > 0
                          ? gradeForPhase(total, phase).grade
                          : "—";
                      return (
                        <div
                          key={subjectName}
                          className={`rounded-xl border p-4 ${isWaived ? "border-amber-200 bg-amber-50/40" : "border-border bg-card"}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="break-words text-sm font-semibold">{subjectName}</p>
                              {isWaived ? (
                                <p className="mt-1 text-[11px] text-amber-700">
                                  Waived: {waivedSubjects[subjectName]}
                                </p>
                              ) : (
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Enter continuous assessment and examination scores.
                                </p>
                              )}
                            </div>
                            <span
                              className={`grid h-9 w-10 shrink-0 place-items-center rounded-lg text-xs font-black ${isWaived ? "bg-amber-100 text-amber-700" : total > 0 ? gradeBadgeClass(grade as AnyGrade) : "bg-muted text-muted-foreground"}`}
                            >
                              {grade}
                            </span>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            <Label className="text-xs text-muted-foreground">
                              CA /40
                              <Input
                                disabled={isWaived}
                                inputMode="numeric"
                                value={isWaived ? "" : scores[subjectName]?.ca || ""}
                                onChange={(event) =>
                                  setScore(subjectName, "ca", event.target.value)
                                }
                                className="mt-1.5 h-10 text-center font-mono"
                                placeholder="0"
                              />
                            </Label>
                            <Label className="text-xs text-muted-foreground">
                              Exam /60
                              <Input
                                disabled={isWaived}
                                inputMode="numeric"
                                value={isWaived ? "" : scores[subjectName]?.exam || ""}
                                onChange={(event) =>
                                  setScore(subjectName, "exam", event.target.value)
                                }
                                className="mt-1.5 h-10 text-center font-mono"
                                placeholder="0"
                              />
                            </Label>
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                            <p className="text-xs text-muted-foreground">
                              Total{" "}
                              <strong className="ml-1 text-base text-foreground">
                                {isWaived || total === 0 ? "—" : total}
                              </strong>
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (isWaived) {
                                  const copy = { ...waivedSubjects };
                                  delete copy[subjectName];
                                  setWaivedSubjects(copy);
                                } else {
                                  setWaivingSubject(subjectName);
                                }
                              }}
                              className={isWaived ? "text-destructive" : "text-muted-foreground"}
                            >
                              {isWaived ? "Remove waiver" : "Waive subject"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[650px] text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/20 text-left text-xs uppercase tracking-wider text-muted-foreground">
                          <th className="px-5 py-3 font-semibold">Subject</th>
                          <th className="px-3 py-3 w-24 font-semibold">CA /40</th>
                          <th className="px-3 py-3 w-24 font-semibold">Exam /60</th>
                          {meta.hasMockColumn && (
                            <th className="px-3 py-3 w-24 font-semibold">Mock</th>
                          )}
                          {meta.hasPractical && (
                            <th className="px-3 py-3 w-24 font-semibold">
                              <span className="flex items-center gap-1">
                                <FlaskConical className="h-3 w-3" /> Practical
                              </span>
                            </th>
                          )}
                          <th className="px-3 py-3 w-20 text-right font-semibold">Total</th>
                          <th className="px-3 py-3 w-16 text-center font-semibold">Grade</th>
                          <th className="px-3 py-3 w-28 text-center font-semibold">
                            Status / Waiver
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {expectedSubjects.map((subject, idx) => {
                          const s = subject.name;
                          const isWaived = !!waivedSubjects[s];
                          const ca = parseInt(scores[s]?.ca || "0", 10);
                          const ex = parseInt(scores[s]?.exam || "0", 10);
                          const total = ca + ex;
                          const g = isWaived
                            ? "W"
                            : total > 0
                              ? gradeForPhase(total, phase).grade
                              : "—";
                          return (
                            <tr
                              key={s}
                              className={`border-b border-border/50 transition-colors hover:bg-primary/3 ${idx % 2 === 0 ? "bg-card" : "bg-muted/10"} ${isWaived ? "opacity-75 bg-muted/30" : ""}`}
                            >
                              <td className="px-5 py-2.5 font-medium text-sm">
                                <div>{s}</div>
                                {isWaived && (
                                  <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                    Waived: {waivedSubjects[s]}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  disabled={isWaived}
                                  value={isWaived ? "" : scores[s]?.ca || ""}
                                  onChange={(e) => setScore(s, "ca", e.target.value)}
                                  maxLength={2}
                                  className="font-mono h-8 text-center text-sm w-20 disabled:bg-muted"
                                  placeholder={isWaived ? "—" : "0"}
                                />
                              </td>
                              <td className="px-3 py-2">
                                <Input
                                  disabled={isWaived}
                                  value={isWaived ? "" : scores[s]?.exam || ""}
                                  onChange={(e) => setScore(s, "exam", e.target.value)}
                                  maxLength={2}
                                  className="font-mono h-8 text-center text-sm w-20 disabled:bg-muted"
                                  placeholder={isWaived ? "—" : "0"}
                                />
                              </td>
                              {meta.hasMockColumn && (
                                <td className="px-3 py-2">
                                  <Input
                                    disabled={isWaived}
                                    value={isWaived ? "" : scores[s]?.mock || ""}
                                    onChange={(e) => setScore(s, "mock", e.target.value)}
                                    maxLength={3}
                                    className="font-mono h-8 text-center text-sm w-20 border-dashed disabled:bg-muted"
                                    placeholder="—"
                                  />
                                </td>
                              )}
                              {meta.hasPractical && (
                                <td className="px-3 py-2">
                                  <Input
                                    disabled={isWaived}
                                    value={isWaived ? "" : scores[s]?.practical || ""}
                                    onChange={(e) => setScore(s, "practical", e.target.value)}
                                    maxLength={3}
                                    className="font-mono h-8 text-center text-sm w-20 border-dashed border-violet-300 disabled:bg-muted"
                                    placeholder="—"
                                  />
                                </td>
                              )}
                              <td className="px-3 py-2.5 text-right font-mono font-bold text-base">
                                {isWaived ? "—" : total > 0 ? total : "—"}
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`inline-grid h-8 w-10 place-items-center rounded-lg text-xs font-black ${isWaived ? "bg-amber-100 text-amber-700" : total > 0 ? gradeBadgeClass(g as AnyGrade) : "text-muted-foreground"}`}
                                >
                                  {g}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                {isWaived ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const copy = { ...waivedSubjects };
                                      delete copy[s];
                                      setWaivedSubjects(copy);
                                      toast.info(`Removed waiver for ${s}`);
                                    }}
                                    className="h-7 text-[11px] text-destructive hover:bg-destructive/10"
                                  >
                                    Unwaive
                                  </Button>
                                ) : (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setWaivingSubject(s)}
                                    className="h-7 text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  >
                                    Waive
                                  </Button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {expectedSubjects.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        No subjects configured. Add subjects in Settings.
                      </p>
                    )}
                  </div>
                  {/* Grade key */}
                  <div className="border-t border-border bg-muted/20 px-5 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                      Grade Key · {meta.gradeScaleLabel}
                    </p>
                    <div className="flex flex-wrap gap-3 text-[10px]">
                      {keyRows.map(({ g, r, color }) => (
                        <span key={g} className="flex items-center gap-1">
                          <span className={`font-black ${color}`}>{g}</span>
                          <span className="text-muted-foreground">{r}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* ── Development Tab ─────────────────────────────────────────── */}
              <TabsContent value="development" className="mt-4 space-y-4">
                <Card className="border-border shadow-card overflow-hidden">
                  <div className="border-b border-border bg-muted/30 px-5 py-3 flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      Attendance & Academic Milestones
                    </p>
                  </div>
                  <div className="p-5 space-y-6">
                    <div className="grid gap-4 sm:grid-cols-4">
                      <div>
                        <Label className="text-xs font-medium">School Days (Total)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={attendanceTotal}
                          onChange={(e) => {
                            setAttendanceTotal(e.target.value);
                            const tot = parseInt(e.target.value || "0", 10);
                            const pres = parseInt(attendancePresent || "0", 10);
                            if (tot >= pres && pres > 0) setTimesAbsent(String(tot - pres));
                          }}
                          className="mt-1.5"
                          placeholder="e.g. 60"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Days Present</Label>
                        <Input
                          type="number"
                          min="0"
                          max={attendanceTotal || undefined}
                          value={attendancePresent}
                          onChange={(e) => {
                            setAttendancePresent(e.target.value);
                            const pres = parseInt(e.target.value || "0", 10);
                            const tot = parseInt(attendanceTotal || "0", 10);
                            if (tot >= pres) setTimesAbsent(String(tot - pres));
                          }}
                          className="mt-1.5"
                          placeholder="e.g. 58"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Days Absent</Label>
                        <Input
                          type="number"
                          min="0"
                          value={timesAbsent}
                          onChange={(e) => setTimesAbsent(e.target.value)}
                          className="mt-1.5"
                          placeholder="e.g. 2"
                        />
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Next Term Resumption</Label>
                        <Input
                          type="date"
                          value={resumptionDate}
                          onChange={(e) => setResumptionDate(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    {/* Promotion Status (especially for 3rd term or exit classes) */}
                    <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-muted/20 p-4 border border-border">
                      <div>
                        <Label className="text-xs font-medium">Promotion Status</Label>
                        <Select value={promotionStatus} onValueChange={setPromotionStatus}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue placeholder="Select an outcome" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Promoted">Promoted</SelectItem>
                            <SelectItem value="Promoted on Trial">Promoted on Trial</SelectItem>
                            <SelectItem value="Advised to Repeat">Advised to Repeat</SelectItem>
                            <SelectItem value="Graduated">Graduated / Completed</SelectItem>
                            <SelectItem value="Not Applicable">
                              Not Applicable (Mid-Session)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs font-medium">Promoted To Class (Optional)</Label>
                        <Input
                          value={promotedToClass}
                          onChange={(e) => setPromotedToClass(e.target.value)}
                          className="mt-1.5"
                          placeholder="e.g. JSS 2A or Primary 4"
                        />
                      </div>
                    </div>

                    {/* Dual 5-Point Rating Scales */}
                    <div className="grid gap-6 lg:grid-cols-2">
                      <RatingInputs
                        title="Affective Domain (Character & Behavior)"
                        ratings={affectiveTraits}
                        onChange={(trait, rating) =>
                          setAffectiveTraits((prev) => ({ ...prev, [trait]: rating }))
                        }
                      />
                      <RatingInputs
                        title="Psychomotor Domain (Practical Skills)"
                        ratings={psychomotorSkills}
                        onChange={(skill, rating) =>
                          setPsychomotorSkills((prev) => ({ ...prev, [skill]: rating }))
                        }
                      />
                    </div>
                  </div>
                </Card>

                <Card className="border-border shadow-card overflow-hidden">
                  <div className="border-b border-border bg-muted/30 px-5 py-3">
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      Official Remarks
                    </p>
                  </div>
                  <div className="grid gap-5 p-5 md:grid-cols-2">
                    <div>
                      <Label htmlFor="remark" className="text-xs font-medium">
                        Class Teacher's Remark
                      </Label>
                      <Textarea
                        id="remark"
                        className="mt-1.5"
                        placeholder="Comment on effort, classroom conduct, learning habits and next steps…"
                        rows={4}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="principal-remark" className="text-xs font-medium">
                        {meta.defaultSignerTitle}'s Remark
                      </Label>
                      <Textarea
                        id="principal-remark"
                        className="mt-1.5"
                        placeholder="Executive summary comment from the Head of School…"
                        rows={4}
                        value={principalRemark}
                        onChange={(e) => setPrincipalRemark(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="border-t border-border bg-muted/10 px-5 py-3 flex justify-start">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={draftRemarks}
                      disabled={aiLoading !== null || !student}
                      className="gap-1.5 text-xs border-primary/20 hover:border-primary/50"
                    >
                      {aiLoading === "remarks" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                      )}
                      Draft remarks with AI Assistant
                    </Button>
                  </div>
                </Card>
              </TabsContent>

              {/* ── Documents Tab ─────────────────────────────────────────────── */}
              <TabsContent value="documents" className="mt-4 space-y-4">
                {/* Answer scripts — always shown */}
                <Card className="border-border shadow-card overflow-hidden">
                  <div className="border-b border-border bg-muted/30 px-5 py-3 flex items-center gap-2">
                    <FileSignature className="h-4 w-4 text-primary" />
                    <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                      Answer Scripts
                    </p>
                  </div>
                  <div className="p-5">
                    <FileDrop
                      label="Drop answer scripts here"
                      hint="PDF or image scans of exam answer sheets. Up to 25 MB per file."
                      accept=".pdf,image/*"
                      files={answerScripts}
                      onChange={setAnswerScripts}
                    />
                  </div>
                </Card>

                {/* Testimonials — secondary only */}
                {(phase === "junior" ||
                  phase === "junior-exit" ||
                  phase === "senior" ||
                  phase === "senior-exit") && (
                  <Card className="border-border shadow-card overflow-hidden">
                    <div className="border-b border-border bg-muted/30 px-5 py-3 flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Testimonials
                      </p>
                      <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Optional
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="mb-4 text-xs text-muted-foreground">
                        Character or leaving testimonials — usually issued in SS 3 or on request.
                      </p>
                      <FileDrop
                        label="Drop testimonial letters here"
                        hint="Signed testimonials. PDF preferred."
                        accept=".pdf,.doc,.docx,image/*"
                        files={testimonials}
                        onChange={setTestimonials}
                      />
                    </div>
                  </Card>
                )}

                {/* Transcript — SS 3 only */}
                {meta.hasTranscript ? (
                  <Card className="border-2 border-emerald-300/50 bg-emerald-50/40 shadow-card overflow-hidden">
                    <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-emerald-700" />
                      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                        Academic Transcript
                      </p>
                      <span className="ml-auto rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                        SS 3 · Required
                      </span>
                    </div>
                    <div className="p-5">
                      <p className="mb-4 text-xs text-muted-foreground">
                        Final-year students need a full transcript spanning SS 1–3 for WAEC/NECO
                        registration and tertiary applications.
                      </p>
                      <FileDrop
                        label="Drop transcript here"
                        hint="Full academic transcript across SS 1–3. PDF or spreadsheet."
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                        files={transcripts}
                        onChange={setTranscripts}
                      />
                    </div>
                  </Card>
                ) : (
                  <Card className="border-dashed border-border bg-muted/20 p-6 text-center">
                    <FileText className="mx-auto h-6 w-6 text-muted-foreground/50" />
                    <p className="mt-3 text-sm font-medium text-muted-foreground">
                      Transcripts aren't required for this class
                    </p>
                    <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground/70">
                      <Info className="h-3.5 w-3.5" /> Required only for SS 3 WAEC/NECO candidates.
                    </p>
                  </Card>
                )}
              </TabsContent>

              {/* ── AI Audit Tab ─────────────────────────────────────────────── */}
              <TabsContent value="ai-audit" className="mt-4 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-border shadow-card flex flex-col overflow-hidden">
                    <div className="border-b border-border bg-muted/30 px-5 py-3 flex items-center gap-2">
                      <ClipboardCheck className="h-4 w-4 text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Readiness Auditor
                      </p>
                    </div>
                    <div className="flex-1 p-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Check for missing scores, remarks and script uploads before official
                        term-end publishing.
                      </p>
                    </div>
                    <div className="border-t border-border px-5 py-3">
                      <Button
                        type="button"
                        onClick={() => runAiAudit("result_readiness")}
                        disabled={aiLoading !== null}
                        className="w-full gap-2"
                      >
                        {aiLoading === "readiness" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BrainCircuit className="h-4 w-4" />
                        )}
                        {aiLoading === "readiness" ? "Auditing…" : "Run readiness audit"}
                      </Button>
                    </div>
                  </Card>

                  <Card className="border-border shadow-card flex flex-col overflow-hidden">
                    <div className="border-b border-border bg-muted/30 px-5 py-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                        Anomaly Scanner
                      </p>
                    </div>
                    <div className="flex-1 p-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Flag duplicated rows, calculation mismatches and scores outside valid
                        limits.
                      </p>
                    </div>
                    <div className="border-t border-border px-5 py-3">
                      <Button
                        type="button"
                        onClick={() => runAiAudit("anomaly_detection")}
                        disabled={aiLoading !== null}
                        className="w-full gap-2"
                      >
                        {aiLoading === "anomaly" ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <BrainCircuit className="h-4 w-4" />
                        )}
                        {aiLoading === "anomaly" ? "Scanning…" : "Scan for anomalies"}
                      </Button>
                    </div>
                  </Card>
                </div>

                {aiActiveWorkflow && (
                  <Card className="border-border shadow-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-border bg-muted/20 px-5 py-3">
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                          AI Audit Report
                        </span>
                        <h3 className="font-display text-base font-bold mt-0.5">
                          {aiActiveWorkflow === "result_readiness"
                            ? "Result Readiness Verdict"
                            : "Anomaly Scan Results"}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        Verified Analysis
                      </span>
                    </div>
                    <div className="min-h-36 p-5 text-sm leading-relaxed">
                      {aiOutput ? (
                        <FormattedAiOutput text={aiOutput} />
                      ) : (
                        <div className="flex items-center justify-center h-36 text-muted-foreground text-sm">
                          Run a workflow above to display output.
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </TabsContent>
            </Tabs>

            {/* Submit row */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {saved && (
                <span className="inline-flex items-center gap-1.5 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" /> Published
                </span>
              )}
              <Button
                type="submit"
                disabled={publishing || students.length === 0}
                className="gradient-primary text-primary-foreground shadow-elegant gap-2"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {publishing ? "Publishing…" : "Publish result"}
              </Button>
            </div>
          </form>

          {/* ══ RIGHT — Live result sheet preview ══════════════════════════ */}
          <div className="xl:sticky xl:top-6 xl:self-start">
            <div
              className={`rounded-2xl border-2 border-primary/20 bg-card shadow-xl overflow-hidden rs-font-${schoolProfile?.font_family || "inter"} rs-scale-${schoolProfile?.font_size_scale || "M"}`}
              style={{ fontWeight: schoolProfile?.font_weight || "600" }}
            >
              {/* Phase label */}
              <div className={`flex items-center gap-2 px-5 py-2 ${meta.color}`}>
                <BookOpen className={`h-3.5 w-3.5 ${meta.textColor}`} />
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${meta.textColor}`}
                >
                  {meta.label}
                  {meta.externalExamShort && ` · ${meta.externalExamShort}`}
                </span>
              </div>

              {/* ── Dynamic Letterhead Preview ───────────────────────── */}
              {(() => {
                const pc = schoolProfile?.primary_color || "#3730A3";
                const sc = schoolProfile?.secondary_color || "#D6A84B";
                const style = schoolProfile?.letterhead_style || "classic-banner";
                const placement = schoolProfile?.logo_placement || "left";
                const isCenter = placement === "center";
                const isRight = placement === "right";
                const hdrColor =
                  !schoolProfile?.header_text_color || schoolProfile?.header_text_color === "auto"
                    ? "#ffffff"
                    : schoolProfile?.header_text_color;
                const schoolName = schoolProfile?.name || "School Name";

                // Dynamically adjust font size to fit long school names within the path
                const fontSize = schoolName.length > 32 ? 18 : schoolName.length > 22 ? 22 : 26;

                const Logo = schoolProfile?.logo_url ? (
                  <img
                    src={schoolProfile.logo_url}
                    alt="crest"
                    className="h-14 w-14 shrink-0 object-contain z-10"
                  />
                ) : null;

                const SchoolInfo = (textColor: string, muted: string) => (
                  <div className={`z-10 min-w-0 ${isCenter ? "text-center" : ""}`}>
                    <h3
                      className="font-bold text-base uppercase tracking-tight truncate"
                      style={{ color: textColor }}
                    >
                      {schoolName}
                    </h3>
                    {schoolProfile?.motto && (
                      <p
                        className="italic text-[10px] truncate opacity-90"
                        style={{ color: muted }}
                      >
                        &ldquo;{schoolProfile.motto}&rdquo;
                      </p>
                    )}
                    <p className="text-[9px] truncate opacity-75 mt-0.5" style={{ color: muted }}>
                      {schoolProfile?.address || "School Location Address"}
                    </p>
                  </div>
                );

                // 1. Classic Banner
                if (style === "classic-banner")
                  return (
                    <div
                      className="relative overflow-hidden px-5 py-6"
                      style={{ background: `linear-gradient(135deg, ${pc}, ${pc}ee)` }}
                    >
                      <div
                        className={`relative flex gap-4 ${isCenter ? "flex-col items-center text-center" : isRight ? "flex-row-reverse items-center justify-between" : "flex-row items-center justify-between"}`}
                      >
                        <div
                          className={`flex items-center gap-3 ${isCenter ? "flex-col" : isRight ? "flex-row-reverse" : "flex-row"}`}
                        >
                          {Logo}
                          {SchoolInfo(hdrColor, hdrColor + "cc")}
                        </div>
                      </div>
                    </div>
                  );

                // 2. Arch Crest (Centered design below curved arc text)
                if (style === "arch-crest")
                  return (
                    <div
                      className="bg-white px-5 pt-6 pb-4 border-b-2"
                      style={{ borderBottomColor: pc }}
                    >
                      <div className="relative w-full text-center">
                        <svg
                          viewBox="0 0 500 110"
                          className="w-full max-w-[280px] mx-auto overflow-visible"
                        >
                          <defs>
                            <path id="rs-arc-preview" d="M 10 95 A 600 600 0 0 1 490 95" />
                          </defs>
                          <text
                            fontWeight="bold"
                            fontSize={fontSize}
                            fill={pc}
                            textAnchor="middle"
                            letterSpacing="2"
                          >
                            <textPath href="#rs-arc-preview" startOffset="50%">
                              {schoolName.toUpperCase()}
                            </textPath>
                          </text>
                        </svg>

                        {/* Centered logo & motto row below the arch */}
                        <div className="flex items-center justify-center gap-3 mt-2">
                          {Logo}
                          {schoolProfile?.motto && (
                            <p
                              className="italic text-[9px] max-w-[160px] text-left leading-snug"
                              style={{ color: pc + "99" }}
                            >
                              &ldquo;{schoolProfile.motto}&rdquo;
                            </p>
                          )}
                        </div>
                      </div>
                      <div
                        className="mt-3 text-[10px] text-center space-y-0.5"
                        style={{ color: pc + "bb" }}
                      >
                        {schoolProfile?.address && <p>{schoolProfile.address}</p>}
                        {(schoolProfile?.contact_phone || schoolProfile?.contact_email) && (
                          <p>
                            {schoolProfile.contact_phone}
                            {schoolProfile.contact_phone && schoolProfile.contact_email
                              ? " | "
                              : ""}
                            {schoolProfile.contact_email}
                          </p>
                        )}
                      </div>
                    </div>
                  );

                // 3. Royal Split
                if (style === "royal-split")
                  return (
                    <div
                      className={`flex border-b border-border bg-white min-h-[90px] ${isRight ? "flex-row-reverse" : ""}`}
                    >
                      <div
                        className="w-20 flex flex-col items-center justify-center p-3 shrink-0"
                        style={{ backgroundColor: pc }}
                      >
                        {Logo}
                      </div>
                      <div className="flex-1 px-4 py-4 flex items-center">
                        {SchoolInfo(pc, "rgba(0,0,0,0.6)")}
                      </div>
                    </div>
                  );

                // 4. Minimalist Line
                if (style === "minimalist-line")
                  return (
                    <div
                      className="bg-white px-5 py-5 border-b-2"
                      style={{ borderBottomColor: pc }}
                    >
                      <div
                        className={`flex gap-4 ${isCenter ? "flex-col items-center text-center" : isRight ? "flex-row-reverse items-center" : "flex-row items-center"}`}
                      >
                        {Logo}
                        {SchoolInfo(pc, "rgba(0,0,0,0.6)")}
                      </div>
                    </div>
                  );

                // 5. Centred Formal
                if (style === "centred-formal")
                  return (
                    <div className="bg-white px-5 py-6 border-b border-border flex flex-col items-center text-center gap-2">
                      {Logo}
                      {SchoolInfo(pc, "rgba(0,0,0,0.6)")}
                    </div>
                  );

                // 6. Modern Gradient
                return (
                  <div className="relative flex flex-col">
                    <div
                      className="px-5 py-6"
                      style={{ background: `linear-gradient(135deg, ${pc}, ${pc}99)` }}
                    >
                      <div
                        className={`relative flex gap-4 ${isCenter ? "flex-col items-center text-center" : isRight ? "flex-row-reverse items-center" : "flex-row items-center"}`}
                      >
                        {Logo}
                        {SchoolInfo(hdrColor, hdrColor + "cc")}
                      </div>
                    </div>
                    <div className="h-1 w-full" style={{ backgroundColor: sc }} />
                  </div>
                );
              })()}

              {/* Student Meta Details Bar & Average Score Badge */}
              <div className="bg-muted/40 border-b border-border px-5 py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-xs leading-none truncate">
                    {currentStudent?.name || "Student Name"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    Reg: {currentStudent?.registration_number || "—"} &middot;{" "}
                    {className || "No class selected"}
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      {term}
                    </span>
                    <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      {session}
                    </span>
                  </div>
                </div>

                {/* Score Average Badge */}
                <div className="shrink-0">
                  {avg !== null ? (
                    <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-center min-w-[70px]">
                      <p className="text-lg font-black font-mono text-primary leading-none">
                        {avg}%
                      </p>
                      <p className="text-[8px] font-bold uppercase text-primary/70 tracking-wider mt-0.5">
                        Average
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-muted/30 px-3 py-1.5 text-center min-w-[70px]">
                      <p className="text-[10px] text-muted-foreground font-semibold">No scores</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Subject table */}
              <div className="overflow-x-auto border-b border-border">
                <table className="w-full min-w-[600px] text-xs">
                  <thead>
                    <tr className="bg-muted/40 text-left">
                      <th className="px-4 py-2.5 font-semibold text-muted-foreground uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-2 py-2.5 font-semibold text-muted-foreground text-center uppercase tracking-wider w-10">
                        CA
                      </th>
                      <th className="px-2 py-2.5 font-semibold text-muted-foreground text-center uppercase tracking-wider w-12">
                        Exam
                      </th>
                      {meta.hasMockColumn && (
                        <th className="px-2 py-2.5 font-semibold text-muted-foreground text-center uppercase tracking-wider w-12">
                          Mock
                        </th>
                      )}
                      <th className="px-2 py-2.5 font-semibold text-muted-foreground text-center uppercase tracking-wider w-12">
                        Total
                      </th>
                      <th className="px-3 py-2.5 font-semibold text-muted-foreground text-center uppercase tracking-wider w-10">
                        Grd
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {computedRows.map((row, idx) => (
                      <tr
                        key={row.subject}
                        className={`border-t border-border/50 ${idx % 2 === 0 ? "bg-card" : "bg-muted/10"}`}
                      >
                        <td className="px-4 py-2 font-medium truncate max-w-[120px]">
                          {row.subject}
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">
                          {row.ca || "—"}
                        </td>
                        <td className="px-2 py-2 text-center text-muted-foreground">
                          {row.ex || "—"}
                        </td>
                        {meta.hasMockColumn && (
                          <td className="px-2 py-2 text-center text-muted-foreground/60 italic">
                            {scores[row.subject]?.mock || "—"}
                          </td>
                        )}
                        <td className="px-2 py-2 text-center">
                          {row.total > 0 ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="font-bold">{row.total}</span>
                              <div className="h-1 w-10 overflow-hidden rounded-full bg-muted">
                                <div
                                  className={`h-full rounded-full ${scoreBarClass(row.total)}`}
                                  style={{ width: `${row.total}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td
                          className={`px-3 py-2 text-center font-black text-sm ${
                            row.total > 0
                              ? gradeBadgeClass(row.grade as AnyGrade)
                                  .split(" ")
                                  .find((c) => c.startsWith("text-"))
                              : "text-muted-foreground/40"
                          }`}
                        >
                          {row.grade}
                        </td>
                      </tr>
                    ))}
                    {computedRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={meta.hasMockColumn ? 6 : 5}
                          className="py-6 text-center text-xs text-muted-foreground"
                        >
                          Enter scores to preview
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Attendance */}
              {(attendancePresent || attendanceTotal) && (
                <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-muted/20">
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Attendance
                    </p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: attendanceTotal
                            ? `${Math.min(100, Math.round((Number(attendancePresent || 0) / Number(attendanceTotal)) * 100))}%`
                            : "0%",
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm font-bold shrink-0">
                    {attendancePresent || "—"} / {attendanceTotal || "—"}
                  </p>
                </div>
              )}

              {/* Remarks */}
              {(remark || principalRemark) && (
                <div className="divide-y divide-border/50">
                  {remark && (
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Teacher's Remark
                      </p>
                      <p className="text-xs leading-relaxed text-foreground/80 italic">
                        "{remark}"
                      </p>
                    </div>
                  )}
                  {principalRemark && (
                    <div className="px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        Principal's Remark
                      </p>
                      <p className="text-xs leading-relaxed text-foreground/80 italic">
                        "{principalRemark}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Grade key */}
              <div className="bg-muted/30 px-4 py-3 border-t border-border">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Grade Key · {meta.gradeScaleLabel}
                </p>
                <div className="flex flex-wrap gap-2 text-[10px]">
                  {keyRows.map(({ g, r, color }) => (
                    <span key={g} className="flex items-center gap-1">
                      <span className={`font-black ${color}`}>{g}</span>
                      <span className="text-muted-foreground">{r}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Remarks Dialog */}
        <Dialog
          open={Boolean(suggestedRemarks)}
          onOpenChange={(open) => !open && setSuggestedRemarks(null)}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-1.5">
                <Sparkles className="h-5 w-5 text-primary" />
                AI Suggested Remarks
              </DialogTitle>
            </DialogHeader>
            <div className="mt-3 max-h-[55vh] overflow-y-auto rounded-xl border border-border bg-muted/20 p-4 text-xs leading-relaxed">
              {suggestedRemarks && <FormattedAiOutput text={suggestedRemarks} />}
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (suggestedRemarks) {
                    navigator.clipboard.writeText(suggestedRemarks);
                    toast.success("Remarks copied!");
                  }
                }}
              >
                Copy
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (suggestedRemarks) {
                    const lines = suggestedRemarks.split("\n");
                    let teacherText = "";
                    let principalText = "";
                    let section: "teacher" | "principal" | null = null;
                    for (const line of lines) {
                      if (/teacher/i.test(line) && /remark/i.test(line)) {
                        section = "teacher";
                        continue;
                      }
                      if (/principal/i.test(line) && /remark/i.test(line)) {
                        section = "principal";
                        continue;
                      }
                      if (section === "teacher")
                        teacherText += line.replace(/^[-*\s\d.]+\s*/, "") + "\n";
                      else if (section === "principal")
                        principalText += line.replace(/^[-*\s\d.]+\s*/, "") + "\n";
                    }
                    setRemark(teacherText.trim() || suggestedRemarks);
                    if (principalText.trim()) setPrincipalRemark(principalText.trim());
                    toast.success("Applied to remark fields!");
                    setSuggestedRemarks(null);
                  }
                }}
              >
                Apply drafts
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog
          open={Boolean(reviewDetail)}
          onOpenChange={(open) => !open && setReviewDetail(null)}
        >
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review student result submission</DialogTitle>
            </DialogHeader>
            {reviewDetail ? (
              <div className="space-y-5">
                <Card className="border-primary/20 bg-primary/5 p-4 shadow-none">
                  <p className="text-lg font-bold">{reviewDetail.result.student_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {reviewDetail.result.registration_number} · {reviewDetail.result.class_name} ·{" "}
                    {reviewDetail.result.term} · {reviewDetail.result.session}
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    Submitted average: {Number(reviewDetail.result.average_score ?? 0).toFixed(1)}%
                  </p>
                </Card>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-bold">Submitted subject scores</h3>
                    <span className="text-xs text-muted-foreground">
                      {reviewDetail.grades.length} submitted
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {reviewDetail.grades.map((grade) => (
                      <div
                        key={grade.subject}
                        className="flex items-center justify-between gap-3 rounded-xl border p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold">{grade.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            CA {Number(grade.ca_score ?? 0)} · Exam {Number(grade.exam_score ?? 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-black">{Number(grade.score)}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">
                            {grade.grade}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {reviewDetail.missingSubjects.length > 0 ? (
                  <Card className="border-amber-300 bg-amber-50/50 p-4 shadow-none">
                    <h3 className="text-sm font-bold text-amber-900">
                      Publication blocked · {reviewDetail.missingSubjects.length} class subjects
                      unaccounted for
                    </h3>
                    <p className="mt-1 text-xs text-amber-800">
                      Return the submission for scoring, or waive only a subject this student was
                      formally exempted from.
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {reviewDetail.missingSubjects.map((subject: string) => (
                        <Button
                          key={subject}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => waiveReviewSubject(subject)}
                          className="border-amber-300 bg-white text-xs"
                        >
                          Waive {subject}
                        </Button>
                      ))}
                    </div>
                  </Card>
                ) : (
                  <Card className="border-emerald-300 bg-emerald-50/50 p-4 text-sm font-semibold text-emerald-800 shadow-none">
                    <CheckCircle2 className="mr-2 inline h-4 w-4" /> All class subjects are scored
                    or explicitly waived.
                  </Card>
                )}

                {reviewDetail.result.remarks || reviewDetail.result.principal_remarks ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Card className="p-4 shadow-none">
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        Head Teacher remark
                      </p>
                      <p className="mt-2 text-sm">
                        {reviewDetail.result.remarks || "Not provided"}
                      </p>
                    </Card>
                    <Card className="p-4 shadow-none">
                      <p className="text-xs font-bold uppercase text-muted-foreground">
                        School leadership remark
                      </p>
                      <p className="mt-2 text-sm">
                        {reviewDetail.result.principal_remarks || "Not provided"}
                      </p>
                    </Card>
                  </div>
                ) : null}

                <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => reviewSubmission(Number(reviewDetail.result.id), "Returned")}
                  >
                    Return with correction note
                  </Button>
                  <Button
                    disabled={reviewDetail.missingSubjects.length > 0}
                    onClick={() => reviewSubmission(Number(reviewDetail.result.id), "Published")}
                  >
                    Approve & publish
                  </Button>
                </div>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
        {/* Waive Subject Dialog */}
        <Dialog
          open={Boolean(waivingSubject)}
          onOpenChange={(open) => !open && setWaivingSubject(null)}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                Explicit Subject Waiver
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                By waiving <strong className="text-foreground">{waivingSubject}</strong>, you grant
                an administrative exemption so that the student's result publication is not blocked.
                This waiver will be recorded in the audit trail.
              </p>
              <div>
                <Label className="text-xs font-semibold">Exemption / Waiver Reason</Label>
                <Select value={waiveReason} onValueChange={setWaiveReason}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Elective Subject Exemption">
                      Elective Subject Exemption
                    </SelectItem>
                    <SelectItem value="Medical Exemption">Medical Exemption</SelectItem>
                    <SelectItem value="Mid-Term Admission Exemption">
                      Mid-Term Admission Exemption
                    </SelectItem>
                    <SelectItem value="Subject Department Swap">
                      Subject Department Swap (Arts/Sci)
                    </SelectItem>
                    <SelectItem value="Authorised School Admin Waiver">
                      Authorised School Admin Waiver
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setWaivingSubject(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (waivingSubject) {
                      setWaivedSubjects((prev) => ({ ...prev, [waivingSubject]: waiveReason }));
                      toast.success(`Waived ${waivingSubject}`, {
                        description: `Reason: ${waiveReason}`,
                      });
                      setWaivingSubject(null);
                    }
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Confirm Subject Waiver
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function RatingInputs({
  title,
  ratings,
  onChange,
}: {
  title: string;
  ratings: Record<string, number | undefined>;
  onChange: (key: string, rating: number) => void;
}) {
  const ratingLabels: Record<number, string> = {
    5: "5 - Excellent",
    4: "4 - Good",
    3: "3 - Fair",
    2: "2 - Poor",
    1: "1 - Very Poor",
  };

  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
        <span className="text-[10px] text-muted-foreground font-mono">1 (Low) → 5 (High)</span>
      </div>
      <div className="space-y-2.5 pt-1">
        {Object.entries(ratings).map(([trait, rating]) => (
          <div
            key={trait}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2"
          >
            <span className="text-xs font-medium text-foreground/90">{trait}</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((num) => {
                const isSelected = rating === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChange(trait, num)}
                    title={ratingLabels[num]}
                    className={`h-7 w-7 rounded-md text-xs font-bold transition-all ${
                      isSelected
                        ? num >= 4
                          ? "bg-emerald-600 text-white shadow-xs scale-105"
                          : num === 3
                            ? "bg-amber-500 text-white shadow-xs scale-105"
                            : "bg-red-500 text-white shadow-xs scale-105"
                        : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                    }`}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
