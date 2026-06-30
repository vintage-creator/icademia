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

function ResultsPage() {
  const [student, setStudent] = useState(MOCK_STUDENTS[0].reg);
  const [scores, setScores] = useState<Record<string, { ca: string; exam: string }>>(
    Object.fromEntries(SUBJECTS.map((s) => [s, { ca: "", exam: "" }]))
  );
  const [saved, setSaved] = useState(false);
  const [answerScripts, setAnswerScripts] = useState<DroppedFile[]>([]);
  const [testimonials, setTestimonials] = useState<DroppedFile[]>([]);
  const [transcripts, setTranscripts] = useState<DroppedFile[]>([]);

  const set = (s: string, k: "ca" | "exam", v: string) =>
    setScores((p) => ({ ...p, [s]: { ...p[s], [k]: v.replace(/[^0-9]/g, "") } }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    const total = answerScripts.length + testimonials.length + transcripts.length;
    toast.success("Result published", {
      description: `Scores for ${MOCK_STUDENTS.find(s => s.reg === student)?.name} saved${total ? ` · ${total} document${total > 1 ? "s" : ""} attached` : ""} (demo).`,
    });
    setTimeout(() => setSaved(false), 2400);
  };

  const saveDraft = () => toast("Draft saved", { description: "You can resume editing later." });

  return (
    <div className="space-y-6 p-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Upload results</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter scores, attach answer scripts, testimonials and transcripts. Grades compute automatically.</p>
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

            <Card className="border-border p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold">Testimonials</h2>
              </div>
              <FileDrop
                label="Drop testimonial letters here"
                hint="Signed character or leaving testimonials issued by the school. PDF preferred."
                accept=".pdf,.doc,.docx,image/*"
                files={testimonials}
                onChange={setTestimonials}
              />
            </Card>

            <Card className="border-border p-6 shadow-card">
              <div className="mb-4 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold">Transcripts</h2>
              </div>
              <FileDrop
                label="Drop transcripts here"
                hint="Full academic transcripts across sessions. PDF, DOC or spreadsheet."
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                files={transcripts}
                onChange={setTranscripts}
              />
            </Card>
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
