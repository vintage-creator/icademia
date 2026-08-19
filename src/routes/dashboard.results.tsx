import { createFileRoute } from "@tanstack/react-router";
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
  getSubjectsDb,
  addResultDb,
  uploadToCloudinaryDb,
  generateSchoolAdminIntelligenceDb,
  getSchoolProfileDb,
} from "@/lib/api/db.functions";
import { FormattedAiOutput } from "@/components/formatted-ai-output";
import { getSchoolCode, getCurrentAcademicSession } from "@/lib/utils";
import {
  detectPhase,
  gradeForPhase,
  gradeBadgeClass,
  scoreBarClass,
  gradeKeyRows,
  PHASE_META,
  type ClassPhase,
} from "@/lib/class-phase";

export const Route = createFileRoute("/dashboard/results")({
  head: () => ({ meta: [{ title: "Upload Results — iCademia" }] }),
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

function ResultsPage() {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [subjects, setSubjects] = useState<SubjectRecord[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [schoolProfile, setSchoolProfile] = useState<any>(null);
  console.log("RESULTS PREVIEW LOG - schoolProfile:", schoolProfile);

  const [student, setStudent] = useState("");
  const [term, setTerm] = useState("Second Term");
  const [session, setSession] = useState(getCurrentAcademicSession());
  const [remark, setRemark] = useState("");
  const [principalRemark, setPrincipalRemark] = useState("");
  const [attendancePresent, setAttendancePresent] = useState("");
  const [attendanceTotal, setAttendanceTotal] = useState("");
  const [externalRegNumber, setExternalRegNumber] = useState("");

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

  const schoolCode = getSchoolCode();

  // ── Derived phase ────────────────────────────────────────────────────────
  const currentStudent = students.find((s) => s.id.toString() === student);
  const className = currentStudent?.class_name ?? "";
  const phase: ClassPhase = className ? detectPhase(className) : "junior";
  const meta = PHASE_META[phase];

  // ── AI helpers ───────────────────────────────────────────────────────────
  const runAiAudit = async (workflow: "result_readiness" | "anomaly_detection") => {
    setAiLoading(workflow === "result_readiness" ? "readiness" : "anomaly");
    setAiActiveWorkflow(workflow);
    try {
      const res = await generateSchoolAdminIntelligenceDb({ data: { schoolCode, workflow } });
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
    if (!student) { toast.error("Please select a student first."); return; }
    setAiLoading("remarks");
    try {
      const res = await generateSchoolAdminIntelligenceDb({
        data: { schoolCode, workflow: "remarks_assistant" },
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
        const [list, subjectList, profileFresh] = await Promise.all([
          getStudentsDb({ data: { schoolCode } }),
          getSubjectsDb({ data: { schoolCode } }),
          getSchoolProfileDb({ data: { schoolCode } }).catch(() => null),
        ]);
        setStudents(list as unknown as StudentRecord[]);
        setSubjects(subjectList as unknown as SubjectRecord[]);
        if (profileFresh) {
          setSchoolProfile(profileFresh);
          localStorage.setItem(`icademia_profile_${schoolCode}`, JSON.stringify(profileFresh));
        }
        setScores(
          Object.fromEntries(
            (subjectList as unknown as SubjectRecord[]).map((s) => [
              s.name,
              { ca: "", exam: "", mock: "", practical: "" },
            ]),
          ),
        );
        if (list.length > 0) setStudent(list[0].id.toString());
      } catch (err) {
        console.error(err);
      } finally {
        setStudentsLoading(false);
      }
    };
    void load();
  }, [schoolCode]);

  // ── Score helpers ────────────────────────────────────────────────────────
  const setScore = (
    subj: string,
    key: "ca" | "exam" | "mock" | "practical",
    val: string,
  ) =>
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
    if (!student) { toast.error("Please select a student first."); return; }
    setPublishing(true);
    try {
      const uploadedScripts: { subject: string; url: string; score: number; grade: string }[] = [];
      for (const script of answerScripts) {
        if (script.rawFile) {
          const base64 = await fileToBase64(script.rawFile);
          const uploadRes = await uploadToCloudinaryDb({ data: { base64Image: base64 } });
          const matchedSubject =
            subjects.find((subj) =>
              script.name.toLowerCase().includes(subj.name.toLowerCase()),
            )?.name ??
            subjects[0]?.name ??
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

      const gradesList = subjects
        .map((subject) => {
          const s = subject.name;
          const ca = parseInt(scores[s]?.ca || "0", 10);
          const exam = parseInt(scores[s]?.exam || "0", 10);
          const total = ca + exam;
          const grade = gradeForPhase(total, phase).grade;
          return { subject: s, caScore: ca, examScore: exam, score: total, grade };
        })
        .filter((g) => g.score > 0);

      if (gradesList.length === 0) {
        toast.error("Please enter at least one score before publishing.");
        setPublishing(false);
        return;
      }

      const totalSum = gradesList.reduce((acc, g) => acc + g.score, 0);
      const averageScore = totalSum / gradesList.length;
      const totalStudents = students.filter((s) => s.class_name === className).length;

      await addResultDb({
        data: {
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
        description: `Scores for ${currentStudent?.name} saved to the database.`,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2400);
      setScores(
        Object.fromEntries(
          subjects.map((s) => [s.name, { ca: "", exam: "", mock: "", practical: "" }]),
        ),
      );
      setAnswerScripts([]);
      setRemark("");
      setPrincipalRemark("");
      setAttendancePresent("");
      setAttendanceTotal("");
      setExternalRegNumber("");
    } catch (err) {
      toast.error("Failed to publish result", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setPublishing(false);
    }
  };

  const saveDraft = () => toast("Draft saved", { description: "You can resume editing later." });

  // ── Live preview computed rows ────────────────────────────────────────────
  const computedRows = subjects.map((subject) => {
    const s = subject.name;
    const ca = parseInt(scores[s]?.ca || "0", 10);
    const ex = parseInt(scores[s]?.exam || "0", 10);
    const total = ca + ex;
    const { grade, remark: gradeRemark } = total > 0
      ? gradeForPhase(total, phase)
      : { grade: "—" as const, remark: "—" };
    return { subject: s, ca, ex, total, grade: grade as string, gradeRemark };
  });

  const filledRows = computedRows.filter((r) => r.total > 0);
  const avg = filledRows.length > 0
    ? Math.round(filledRows.reduce((a, r) => a + r.total, 0) / filledRows.length)
    : null;

  const keyRows = gradeKeyRows(phase);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Result Entry
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter scores below — grades and the live preview update automatically.
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

      {/* External exam alert banner */}
      {meta.externalExam && className && (
        <div
          className={`mb-5 flex items-start gap-3 rounded-xl border px-5 py-4 ${meta.color} border-current/20`}
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

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        {/* ══ LEFT — Entry form ═══════════════════════════════════════════ */}
        <form onSubmit={handleSave} className="space-y-5">

          {/* Student / Term / Session */}
          <Card className="border-border shadow-card overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Student Information
              </p>
            </div>
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
            <TabsContent value="scores" className="mt-4">
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
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-sm">
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
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map((subject, idx) => {
                        const s = subject.name;
                        const ca = parseInt(scores[s]?.ca || "0", 10);
                        const ex = parseInt(scores[s]?.exam || "0", 10);
                        const total = ca + ex;
                        const g = total > 0 ? gradeForPhase(total, phase).grade : "—";
                        return (
                          <tr
                            key={s}
                            className={`border-b border-border/50 transition-colors hover:bg-primary/3 ${idx % 2 === 0 ? "bg-card" : "bg-muted/10"}`}
                          >
                            <td className="px-5 py-2.5 font-medium text-sm">{s}</td>
                            <td className="px-3 py-2">
                              <Input
                                value={scores[s]?.ca || ""}
                                onChange={(e) => setScore(s, "ca", e.target.value)}
                                maxLength={2}
                                className="font-mono h-8 text-center text-sm w-20"
                                placeholder="0"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                value={scores[s]?.exam || ""}
                                onChange={(e) => setScore(s, "exam", e.target.value)}
                                maxLength={2}
                                className="font-mono h-8 text-center text-sm w-20"
                                placeholder="0"
                              />
                            </td>
                            {meta.hasMockColumn && (
                              <td className="px-3 py-2">
                                <Input
                                  value={scores[s]?.mock || ""}
                                  onChange={(e) => setScore(s, "mock", e.target.value)}
                                  maxLength={3}
                                  className="font-mono h-8 text-center text-sm w-20 border-dashed"
                                  placeholder="—"
                                />
                              </td>
                            )}
                            {meta.hasPractical && (
                              <td className="px-3 py-2">
                                <Input
                                  value={scores[s]?.practical || ""}
                                  onChange={(e) => setScore(s, "practical", e.target.value)}
                                  maxLength={3}
                                  className="font-mono h-8 text-center text-sm w-20 border-dashed border-violet-300"
                                  placeholder="—"
                                />
                              </td>
                            )}
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-base">
                              {total > 0 ? total : "—"}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span
                                className={`inline-grid h-8 w-10 place-items-center rounded-lg text-xs font-black ${total > 0 ? gradeBadgeClass(g as any) : "text-muted-foreground"}`}
                              >
                                {g}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {subjects.length === 0 && (
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
                    Attendance & Learner Development
                  </p>
                </div>
                <div className="p-5 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <Label className="text-xs font-medium">School days (total)</Label>
                      <Input
                        type="number" min="0"
                        value={attendanceTotal}
                        onChange={(e) => setAttendanceTotal(e.target.value)}
                        className="mt-1.5" placeholder="e.g. 60"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Days present</Label>
                      <Input
                        type="number" min="0" max={attendanceTotal || undefined}
                        value={attendancePresent}
                        onChange={(e) => setAttendancePresent(e.target.value)}
                        className="mt-1.5" placeholder="e.g. 58"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Next term begins</Label>
                      <Input type="date" className="mt-1.5" />
                    </div>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-2">
                    <RatingInputs
                      title="Affective Traits"
                      labels={["Punctuality", "Neatness", "Attentiveness", "Teamwork", "Leadership"]}
                    />
                    <RatingInputs
                      title="Psychomotor Skills"
                      labels={["Handwriting", "Sports", "Creativity", "Technical skills"]}
                    />
                  </div>
                </div>
              </Card>

              <Card className="border-border shadow-card overflow-hidden">
                <div className="border-b border-border bg-muted/30 px-5 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                    Remarks
                  </p>
                </div>
                <div className="grid gap-5 p-5 md:grid-cols-2">
                  <div>
                    <Label htmlFor="remark" className="text-xs font-medium">
                      Class Teacher's Remark
                    </Label>
                    <Textarea
                      id="remark" className="mt-1.5"
                      placeholder="Comment on effort, progress and next steps…"
                      rows={4} value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="principal-remark" className="text-xs font-medium">
                      Principal's Remark
                    </Label>
                    <Textarea
                      id="principal-remark" className="mt-1.5"
                      placeholder="Leadership comment for the official report…"
                      rows={4} value={principalRemark}
                      onChange={(e) => setPrincipalRemark(e.target.value)}
                    />
                  </div>
                </div>
                <div className="border-t border-border bg-muted/10 px-5 py-3 flex justify-start">
                  <Button
                    type="button" variant="outline" size="sm"
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
              {(phase === "junior" || phase === "junior-exit" || phase === "senior" || phase === "senior-exit") && (
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
            <Button type="button" variant="outline" onClick={saveDraft}>
              Save draft
            </Button>
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
          <div className={`rounded-2xl border-2 border-primary/20 bg-card shadow-xl overflow-hidden rs-font-${schoolProfile?.font_family || 'inter'} rs-scale-${schoolProfile?.font_size_scale || 'M'}`}
            style={{ fontWeight: schoolProfile?.font_weight || '600' }}>

            {/* Phase label */}
            <div className={`flex items-center gap-2 px-5 py-2 ${meta.color}`}>
              <BookOpen className={`h-3.5 w-3.5 ${meta.textColor}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.textColor}`}>
                {meta.label}
                {meta.externalExamShort && ` · ${meta.externalExamShort}`}
              </span>
            </div>

            {/* ── Dynamic Letterhead Preview ───────────────────────── */}
            {(() => {
              const pc = schoolProfile?.primary_color || '#3730A3';
              const sc = schoolProfile?.secondary_color || '#D6A84B';
              const style = schoolProfile?.letterhead_style || 'classic-banner';
              const placement = schoolProfile?.logo_placement || 'left';
              const isCenter = placement === 'center';
              const isRight = placement === 'right';
              const hdrColor = (!schoolProfile?.header_text_color || schoolProfile?.header_text_color === 'auto') ? '#ffffff' : schoolProfile?.header_text_color;
              const schoolName = schoolProfile?.name || 'School Name';

              // Dynamically adjust font size to fit long school names within the path
              const fontSize = schoolName.length > 32 ? 18 : schoolName.length > 22 ? 22 : 26;

              const Logo = schoolProfile?.logo_url ? (
                <img src={schoolProfile.logo_url} alt="crest"
                  className="h-14 w-14 shrink-0 object-contain z-10" />
              ) : null;

              const SchoolInfo = (textColor: string, muted: string) => (
                <div className={`z-10 min-w-0 ${isCenter ? 'text-center' : ''}`}>
                  <h3 className="font-bold text-base uppercase tracking-tight truncate" style={{ color: textColor }}>
                    {schoolName}
                  </h3>
                  {schoolProfile?.motto && (
                    <p className="italic text-[10px] truncate opacity-90" style={{ color: muted }}>
                      &ldquo;{schoolProfile.motto}&rdquo;
                    </p>
                  )}
                  <p className="text-[9px] truncate opacity-75 mt-0.5" style={{ color: muted }}>
                    {schoolProfile?.address || 'School Location Address'}
                  </p>
                </div>
              );

              // 1. Classic Banner
              if (style === 'classic-banner') return (
                <div className="relative overflow-hidden px-5 py-6"
                  style={{ background: `linear-gradient(135deg, ${pc}, ${pc}ee)` }}>
                  <div className={`relative flex gap-4 ${isCenter ? 'flex-col items-center text-center' : isRight ? 'flex-row-reverse items-center justify-between' : 'flex-row items-center justify-between'}`}>
                    <div className={`flex items-center gap-3 ${isCenter ? 'flex-col' : isRight ? 'flex-row-reverse' : 'flex-row'}`}>
                      {Logo}
                      {SchoolInfo(hdrColor, hdrColor + 'cc')}
                    </div>
                  </div>
                </div>
              );

              // 2. Arch Crest (Centered design below curved arc text)
              if (style === 'arch-crest') return (
                <div className="bg-white px-5 pt-6 pb-4 border-b-2" style={{ borderBottomColor: pc }}>
                  <div className="relative w-full text-center">
                    <svg viewBox="0 0 500 110" className="w-full max-w-[280px] mx-auto overflow-visible">
                      <defs><path id="rs-arc-preview" d="M 10 95 A 600 600 0 0 1 490 95" /></defs>
                      <text fontWeight="bold" fontSize={fontSize} fill={pc} textAnchor="middle" letterSpacing="2">
                        <textPath href="#rs-arc-preview" startOffset="50%">{schoolName.toUpperCase()}</textPath>
                      </text>
                    </svg>
                    
                    {/* Centered logo & motto row below the arch */}
                    <div className="flex items-center justify-center gap-3 mt-2">
                      {Logo}
                      {schoolProfile?.motto && (
                        <p className="italic text-[9px] max-w-[160px] text-left leading-snug" style={{ color: pc + '99' }}>
                          &ldquo;{schoolProfile.motto}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 text-[10px] text-center space-y-0.5" style={{ color: pc + 'bb' }}>
                    {schoolProfile?.address && <p>{schoolProfile.address}</p>}
                    {(schoolProfile?.contact_phone || schoolProfile?.contact_email) && (
                      <p>{schoolProfile.contact_phone}{schoolProfile.contact_phone && schoolProfile.contact_email ? ' | ' : ''}{schoolProfile.contact_email}</p>
                    )}
                  </div>
                </div>
              );

              // 3. Royal Split
              if (style === 'royal-split') return (
                <div className={`flex border-b border-border bg-white min-h-[90px] ${isRight ? 'flex-row-reverse' : ''}`}>
                  <div className="w-20 flex flex-col items-center justify-center p-3 shrink-0"
                    style={{ backgroundColor: pc }}>
                    {Logo}
                  </div>
                  <div className="flex-1 px-4 py-4 flex items-center">
                    {SchoolInfo(pc, 'rgba(0,0,0,0.6)')}
                  </div>
                </div>
              );

              // 4. Minimalist Line
              if (style === 'minimalist-line') return (
                <div className="bg-white px-5 py-5 border-b-2" style={{ borderBottomColor: pc }}>
                  <div className={`flex gap-4 ${isCenter ? 'flex-col items-center text-center' : isRight ? 'flex-row-reverse items-center' : 'flex-row items-center'}`}>
                    {Logo}
                    {SchoolInfo(pc, 'rgba(0,0,0,0.6)')}
                  </div>
                </div>
              );

              // 5. Centred Formal
              if (style === 'centred-formal') return (
                <div className="bg-white px-5 py-6 border-b border-border flex flex-col items-center text-center gap-2">
                  {Logo}
                  {SchoolInfo(pc, 'rgba(0,0,0,0.6)')}
                </div>
              );

              // 6. Modern Gradient
              return (
                <div className="relative flex flex-col">
                  <div className="px-5 py-6" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}99)` }}>
                    <div className={`relative flex gap-4 ${isCenter ? 'flex-col items-center text-center' : isRight ? 'flex-row-reverse items-center' : 'flex-row items-center'}`}>
                      {Logo}
                      {SchoolInfo(hdrColor, hdrColor + 'cc')}
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
                  Reg: {currentStudent?.registration_number || "—"} &middot; {className || "No class selected"}
                </p>
                <div className="flex gap-1.5 mt-2">
                  <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">{term}</span>
                  <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">{session}</span>
                </div>
              </div>
              
              {/* Score Average Badge */}
              <div className="shrink-0">
                {avg !== null ? (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-center min-w-[70px]">
                    <p className="text-lg font-black font-mono text-primary leading-none">{avg}%</p>
                    <p className="text-[8px] font-bold uppercase text-primary/70 tracking-wider mt-0.5">Average</p>
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
                        className={`px-3 py-2 text-center font-black text-sm ${row.total > 0 ? gradeBadgeClass(row.grade as any).split(" ").find((c) => c.startsWith("text-")) : "text-muted-foreground/40"}`}
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
              type="button" variant="outline" size="sm"
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
              type="button" size="sm"
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
                    if (section === "teacher") teacherText += line.replace(/^[-*\s\d.]+\s*/, "") + "\n";
                    else if (section === "principal") principalText += line.replace(/^[-*\s\d.]+\s*/, "") + "\n";
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
    </div>
  );
}

function RatingInputs({ title, labels }: { title: string; labels: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-2">
        {labels.map((label) => (
          <div key={label} className="grid grid-cols-[1fr_5rem] items-center gap-3">
            <Label className="font-normal text-muted-foreground text-xs">{label}</Label>
            <Select defaultValue="4">
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <SelectItem key={rating} value={String(rating)}>
                    {rating} / 5
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
