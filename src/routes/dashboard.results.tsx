import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { gradeFor, MOCK_STUDENTS } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/results")({
  head: () => ({ meta: [{ title: "Upload Results — ScholarGrade" }] }),
  component: ResultsPage,
});

const SUBJECTS = ["Mathematics", "English Language", "Basic Science", "Social Studies", "Civic Education", "Computer Studies", "Agricultural Sci.", "Creative Arts"];

function ResultsPage() {
  const [student, setStudent] = useState(MOCK_STUDENTS[0].reg);
  const [scores, setScores] = useState<Record<string, { ca: string; exam: string }>>(
    Object.fromEntries(SUBJECTS.map((s) => [s, { ca: "", exam: "" }]))
  );
  const [saved, setSaved] = useState(false);

  const set = (s: string, k: "ca" | "exam", v: string) =>
    setScores((p) => ({ ...p, [s]: { ...p[s], [k]: v.replace(/[^0-9]/g, "") } }));

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  };

  return (
    <div className="space-y-6 p-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Upload results</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter continuous assessment and exam scores per subject. Grades are computed automatically.</p>
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

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="h-4 w-4" /> Saved (demo)
            </span>
          )}
          <Button type="button" variant="outline">Save draft</Button>
          <Button type="submit" className="gradient-primary text-primary-foreground shadow-elegant">
            <Save className="mr-1 h-4 w-4" /> Publish result
          </Button>
        </div>
      </form>
    </div>
  );
}
