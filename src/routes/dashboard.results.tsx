import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, CheckCircle2, FileSignature, Award, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { gradeFor, MOCK_STUDENTS } from "@/lib/mock-data";
import { FileDrop, type DroppedFile } from "@/components/file-drop";

export const Route = createFileRoute("/dashboard/results")({
  head: () => ({ meta: [{ title: "Upload Results — iCademia" }] }),
  component: ResultsPage,
});

const SUBJECTS = ["Mathematics", "English Language", "Basic Science", "Social Studies", "Civic Education", "Computer Studies", "Agricultural Sci.", "Creative Arts"];

import { DEMO_ANSWER_SCRIPTS } from "@/lib/mock-data";
import { FileText, Info } from "lucide-react";

const DEMO_PRELOADED: DroppedFile[] = DEMO_ANSWER_SCRIPTS.map((f) => ({ id: f.id, name: f.name, size: 0, type: "application/pdf" }));

function ResultsPage() {
  const [student, setStudent] = useState(MOCK_STUDENTS[0].reg);
  const [scores, setScores] = useState<Record<string, { ca: string; exam: string }>>(
    Object.fromEntries(SUBJECTS.map((s) => [s, { ca: "", exam: "" }]))
  );
  const [saved, setSaved] = useState(false);
  const [answerScripts, setAnswerScripts] = useState<DroppedFile[]>(DEMO_PRELOADED);
  const [testimonials, setTestimonials] = useState<DroppedFile[]>([]);
  const [transcripts, setTranscripts] = useState<DroppedFile[]>([]);

  const currentStudent = MOCK_STUDENTS.find((s) => s.reg === student);
  const className = currentStudent?.class ?? "";
  const isSS3 = /SS\s?3/i.test(className);
  const isSecondary = /SS\s?\d|JSS\s?\d/i.test(className);

  const set = (s: string, k: "ca" | "exam", v: string) =>
    setScores((p) => ({ ...p, [s]: { ...p[s], [k]: v.replace(/[^0-9]/g, "") } }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    const total = answerScripts.length + testimonials.length + transcripts.length;
    toast.success("Result published", {
      description: `Scores for ${currentStudent?.name} saved${total ? ` · ${total} document${total > 1 ? "s" : ""} attached` : ""} (demo).`,
    });
    setTimeout(() => setSaved(false), 2400);
  };

  const saveDraft = () => toast("Draft saved", { description: "You can resume editing later." });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Upload results</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter scores and attach supporting documents. Grades compute automatically.</p>
      </header>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="border-border p-6 shadow-card">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Student</Label>
              <Select value={student} onValueChange={setStudent}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MOCK_STUDENTS.map((s) => (
                    <SelectItem key={s.reg} value={s.reg}>{s.name} · {s.reg}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Term</Label>
              <Select defaultValue="Second">
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="First">First Term</SelectItem>
                  <SelectItem value="Second">Second Term</SelectItem>
                  <SelectItem value="Third">Third Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Session</Label>
              <Input defaultValue="2024/2025" className="mt-2" />
            </div>
          </div>
        </Card>

        <Tabs defaultValue="scores" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:max-w-md">
            <TabsTrigger value="scores">Subject scores</TabsTrigger>
            <TabsTrigger value="documents">Documents & attachments</TabsTrigger>
          </TabsList>

          <TabsContent value="scores" className="mt-4 space-y-6">
            <Card className="border-border p-6 shadow-card">
              <h2 className="font-display text-lg font-semibold">Subject scores</h2>
              <p className="mt-1 text-sm text-muted-foreground">CA out of 40 · Exam out of 60</p>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="py-2.5">Subject</th>
                      <th className="py-2.5 w-28">CA /40</th>
                      <th className="py-2.5 w-28">Exam /60</th>
                      <th className="py-2.5 w-20 text-right">Total</th>
                      <th className="py-2.5 w-20 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SUBJECTS.map((s) => {
                      const ca = parseInt(scores[s].ca || "0", 10);
                      const ex = parseInt(scores[s].exam || "0", 10);
                      const t = ca + ex;
                      const g = t > 0 ? gradeFor(t).grade : "—";
                      return (
                        <tr key={s} className="border-b border-border/60">
                          <td className="py-2.5 font-medium">{s}</td>
                          <td className="py-2"><Input value={scores[s].ca} onChange={(e) => set(s, "ca", e.target.value)} maxLength={2} className="font-mono" /></td>
                          <td className="py-2"><Input value={scores[s].exam} onChange={(e) => set(s, "exam", e.target.value)} maxLength={2} className="font-mono" /></td>
                          <td className="py-2.5 text-right font-mono font-semibold">{t || "—"}</td>
                          <td className="py-2.5 text-center font-display font-bold text-primary">{g}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="border-border p-6 shadow-card">
              <Label htmlFor="remark">Teacher's remark</Label>
              <Textarea id="remark" className="mt-2" placeholder="A brief comment on the student's performance…" rows={3} />
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4 space-y-6">
            <Card className="border-border p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold">Answer scripts</h2>
              </div>
              <FileDrop
                label="Drop answer scripts here"
                hint="PDF or image scans of exam answer sheets. Up to 25 MB per file."
                accept=".pdf,image/*"
                files={answerScripts}
                onChange={setAnswerScripts}
              />
            </Card>

            {isSecondary ? (
              <Card className="border-border p-6 shadow-card">
                <div className="mb-1 flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold">Testimonials</h2>
                  <span className="ml-auto rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Optional</span>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">Character or leaving testimonials — usually issued in SS 3 or on request.</p>
                <FileDrop
                  label="Drop testimonial letters here"
                  hint="Signed testimonials. PDF preferred."
                  accept=".pdf,.doc,.docx,image/*"
                  files={testimonials}
                  onChange={setTestimonials}
                />
              </Card>
            ) : null}

            {isSS3 ? (
              <Card className="border-2 border-accent/40 bg-accent/5 p-6 shadow-card">
                <div className="mb-1 flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-lg font-semibold">Academic transcript</h2>
                  <span className="ml-auto rounded-full bg-accent/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">SS 3 · Recommended</span>
                </div>
                <p className="mb-4 text-xs text-muted-foreground">Final-year students need a full transcript spanning SS 1–3 for tertiary applications.</p>
                <FileDrop
                  label="Drop transcript here"
                  hint="Full academic transcript across SS 1–3. PDF or spreadsheet."
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                  files={transcripts}
                  onChange={setTranscripts}
                />
              </Card>
            ) : (
              <Card className="border-dashed border-border bg-muted/30 p-6 text-center">
                <FileText className="mx-auto h-6 w-6 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Transcripts aren't required for this class</p>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" /> Transcripts are usually issued in SS 3 for tertiary applications.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Saved (demo)
            </span>
          )}
          <Button type="button" variant="outline" onClick={saveDraft}>Save draft</Button>
          <Button type="submit" className="gradient-primary text-primary-foreground shadow-elegant">
            <Save className="mr-1 h-4 w-4" /> Publish result
          </Button>
        </div>
      </form>
    </div>
  );
}
