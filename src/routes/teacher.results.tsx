import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileSpreadsheet, Loader2, Save, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getTeacherMyResultsDb, saveTeacherBulkResultsDb } from "@/lib/api/db.functions";
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
  const [term, setTerm] = useState("First Term");
  const [session, setSession] = useState("2025/2026");
  
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!selectedClass || !profile?.subject) return;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("teacher_token");
        if (!token) return;
        const data = await getTeacherMyResultsDb({ 
          data: { token, className: selectedClass, term, session } 
        });
        setStudents(data);
        const initScores: Record<number, string> = {};
        data.forEach(s => {
          if (s.score !== null && s.score !== undefined) {
            initScores[s.student_id] = String(s.score);
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
  }, [selectedClass, term, session, profile?.subject]);

  const handleSaveAll = async () => {
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
          scores,
        }
      });
      toast.success("Scores saved successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save scores");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Enter Results</h1>
        <p className="text-muted-foreground mt-1">
          Subject: <strong className="text-foreground">{profile?.subject || "No subject assigned"}</strong>
        </p>
      </div>

      {!profile?.subject ? (
        <Card className="border-warning bg-warning/5">
          <CardContent className="flex flex-col items-center justify-center p-8 text-center text-warning">
            <AlertCircle className="h-10 w-10 mb-3" />
            <h3 className="text-lg font-semibold">No Subject Assigned</h3>
            <p className="text-sm mt-1">You must be assigned a subject to enter results. Please contact the administrator.</p>
          </CardContent>
        </Card>
      ) : classList.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 opacity-50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No Classes Assigned</h3>
            <p className="text-sm mt-1 max-w-md">You haven't been assigned to any classes yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-sm">
          <CardHeader className="border-b border-border bg-muted/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <select 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm font-medium"
              >
                {classList.map((c: string) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                value={term} 
                onChange={e => setTerm(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
              <select 
                value={session} 
                onChange={e => setSession(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
              >
                <option>2025/2026</option>
                <option>{getCurrentAcademicSession()}</option>
              </select>
            </div>
            
            <Button onClick={handleSaveAll} disabled={saving} size="sm" className="gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save All Scores
            </Button>
          </CardHeader>

          <CardContent className="p-0">
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/10">
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground w-12">#</th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground">Student Name</th>
                      <th className="h-10 px-4 text-left font-medium text-muted-foreground w-32">Reg No.</th>
                      <th className="h-10 px-4 text-right font-medium text-muted-foreground w-32">Score (/100)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((s, i) => (
                      <tr key={s.student_id} className="hover:bg-muted/10 transition-colors">
                        <td className="p-4 text-muted-foreground">{i + 1}</td>
                        <td className="p-4 font-medium">{s.name}</td>
                        <td className="p-4 text-muted-foreground font-mono text-xs">{s.registration_number || '—'}</td>
                        <td className="p-4 text-right">
                          <Input 
                            type="number"
                            min="0" max="100"
                            placeholder="-"
                            className="w-20 text-right h-8 ml-auto font-medium"
                            value={scores[s.student_id] || ""}
                            onChange={e => {
                              const val = e.target.value;
                              setScores(p => ({ ...p, [s.student_id]: val }));
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
