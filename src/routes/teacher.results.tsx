import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileSpreadsheet, Loader2, Save, BookOpenCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  getHeadTeacherClassSubjectsDb,
  getTeacherMyResultsDb,
  saveTeacherBulkResultsDb,
} from "@/lib/api/db.functions";
import { getCurrentAcademicSession } from "@/lib/utils";
import { toast } from "sonner";
import { useTeacherProfile } from "./teacher";

export const Route = createFileRoute("/teacher/results")({
  component: TeacherResultsPage,
});

function TeacherResultsPage() {
  const { profile } = useTeacherProfile();

  const classList = profile?.assignedClasses
    ? profile.assignedClasses.split(",").map((c: string) => c.trim())
    : [];

  const [selectedClass, setSelectedClass] = useState<string>(classList[0] || "");
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [term, setTerm] = useState("First Term");
  const [session, setSession] = useState(getCurrentAcademicSession());

  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<number, { ca: string; exam: string }>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const enteredCount = students.filter((student) => {
    const row = scores[student.student_id];
    if (!row || (row.ca === "" && row.exam === "")) return false;
    const ca = Number(row.ca || 0);
    const exam = Number(row.exam || 0);
    return Number.isFinite(ca) && Number.isFinite(exam) && ca >= 0 && ca <= 40 && exam >= 0 && exam <= 60;
  }).length;

  const updateScore = (studentId: number, field: "ca" | "exam", value: string) => {
    const maximum = field === "ca" ? 40 : 60;
    if (value === "" || (/^\d{1,2}$/.test(value) && Number(value) <= maximum)) {
      setScores((previous) => ({
        ...previous,
        [studentId]: {
          ...(previous[studentId] ?? { ca: "", exam: "" }),
          [field]: value,
        },
      }));
    }
  };

  useEffect(() => {
    if (!selectedClass) {
      setSubjects([]);
      setSelectedSubject("");
      return;
    }
    const token = localStorage.getItem("teacher_token");
    if (!token) return;
    setLoading(true);
    void getHeadTeacherClassSubjectsDb({ data: { token, className: selectedClass } })
      .then((result) => {
        const nextSubjects = result.subjects as unknown as Array<{ id: number; name: string }>;
        setSubjects(nextSubjects);
        setSelectedSubject((current) =>
          nextSubjects.some((item) => item.name === current) ? current : nextSubjects[0]?.name || "",
        );
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load class subjects."),
      )
      .finally(() => setLoading(false));
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedSubject) {
      setStudents([]);
      setScores({});
      return;
    }
    const fetchResults = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("teacher_token");
        if (!token) return;
        const data = await getTeacherMyResultsDb({
          data: { token, className: selectedClass, term, session, subject: selectedSubject },
        });
        setStudents(data);
        const initScores: Record<number, { ca: string; exam: string }> = {};
        data.forEach((s) => {
          if (s.ca_score !== null || s.exam_score !== null) {
            initScores[s.student_id] = {
              ca: s.ca_score == null ? "" : String(s.ca_score),
              exam: s.exam_score == null ? "" : String(s.exam_score),
            };
          }
        });
        setScores(initScores);
      } catch (err) {
        toast.error("Failed to load student results.");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [selectedClass, selectedSubject, term, session]);

  const handleSaveAll = async () => {
    if (enteredCount === 0) {
      toast.error("Enter at least one valid score before submitting.");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("teacher_token");
      if (!token) return;
      await saveTeacherBulkResultsDb({
        data: {
          token,
          className: selectedClass,
          term,
          session,
          subject: selectedSubject,
          scores,
        },
      });
      toast.success(`${selectedSubject} scores submitted for School Admin review.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Class Result Book</h1>
        <p className="text-muted-foreground mt-1">
          Enter continuous assessment and examination scores for every subject offered by your
          assigned class.
        </p>
      </div>

      {classList.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 opacity-50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No Classes Assigned</h3>
            <p className="text-sm mt-1 max-w-md">You haven't been assigned to any classes yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
        <Card className="border-primary/20 bg-primary/5 shadow-none">
          <CardContent className="flex gap-3 p-4 text-sm">
            <BookOpenCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div>
              <p className="font-semibold">One class, one accountable Head Teacher</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Ordinary Teachers may supply their marked scores offline. You are responsible for
                entering the complete class record. The School Admin checks completeness and publishes.
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-col justify-between gap-4 border-b border-border bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:px-6">
            <div className="grid w-full grid-cols-1 gap-3 min-[440px]:grid-cols-2 lg:grid-cols-4 sm:w-auto">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm"
              >
                {classList.map((c: string) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm font-medium shadow-sm"
                aria-label="Subject"
              >
                {subjects.length === 0 ? <option value="">No subjects configured</option> : null}
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name}
                  </option>
                ))}
              </select>
              <select
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option>{getCurrentAcademicSession()}</option>
              </select>
            </div>

            <Button onClick={handleSaveAll} disabled={saving || loading || enteredCount === 0} size="sm" className="w-full gap-2 sm:w-auto">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save {selectedSubject || "subject"} · {enteredCount}/{students.length}
            </Button>
          </CardHeader>

          <CardContent className="p-0">
            {students.some((item) => item.workflow_status === "Returned") ? (
              <div className="border-b border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <strong>Returned for correction:</strong>{" "}
                {students.find((item) => item.workflow_status === "Returned")?.review_note ||
                  "Review the submitted scores and submit again."}
              </div>
            ) : null}
            {loading ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p className="text-sm">Loading student list...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center">
                <p className="text-sm">No students found in this class.</p>
              </div>
            ) : (
              <>
              <div className="grid gap-3 p-4 md:hidden">
                {students.map((student, index) => (
                  <div key={student.student_id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold">{index + 1}. {student.name}</p>
                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                          {student.registration_number || "No registration number"}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                        Total /100
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <label className="block text-xs font-medium text-muted-foreground">
                        CA /40
                        <Input type="number" min="0" max="40" inputMode="numeric" placeholder="0"
                          className="mt-1.5 h-10 text-base font-semibold"
                          value={scores[student.student_id]?.ca || ""}
                          onChange={(event) => updateScore(student.student_id, "ca", event.target.value)} />
                      </label>
                      <label className="block text-xs font-medium text-muted-foreground">
                        Exam /60
                        <Input type="number" min="0" max="60" inputMode="numeric" placeholder="0"
                          className="mt-1.5 h-10 text-base font-semibold"
                          value={scores[student.student_id]?.exam || ""}
                          onChange={(event) => updateScore(student.student_id, "exam", event.target.value)} />
                      </label>
                    </div>
                    <p className="mt-3 text-right text-sm font-bold">
                      Total: {Number(scores[student.student_id]?.ca || 0) + Number(scores[student.student_id]?.exam || 0)}/100
                    </p>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground w-12">
                        #
                      </th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">
                        Student Name
                      </th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground w-32">
                        Reg No.
                      </th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground w-28">
                        CA (/40)
                      </th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground w-28">
                        Exam (/60)
                      </th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground w-24">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((s, i) => (
                      <tr key={s.student_id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 text-muted-foreground">{i + 1}</td>
                        <td className="p-4 font-medium">{s.name}</td>
                        <td className="p-4 text-muted-foreground font-mono text-xs">
                          {s.registration_number || "—"}
                        </td>
                        <td className="p-4 text-right">
                          <Input
                            type="number"
                            min="0"
                            max="40"
                            placeholder="0"
                            className="w-20 text-right h-8 ml-auto font-medium"
                            value={scores[s.student_id]?.ca || ""}
                            onChange={(e) => updateScore(s.student_id, "ca", e.target.value)}
                          />
                        </td>
                        <td className="p-4 text-right">
                          <Input type="number" min="0" max="60" placeholder="0"
                            className="w-20 text-right h-8 ml-auto font-medium"
                            value={scores[s.student_id]?.exam || ""}
                            onChange={(e) => updateScore(s.student_id, "exam", e.target.value)} />
                        </td>
                        <td className="p-4 text-right font-bold">
                          {Number(scores[s.student_id]?.ca || 0) + Number(scores[s.student_id]?.exam || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
}
