import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Users, Search, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getTeacherMyStudentsDb } from "@/lib/api/db.functions";
import { toast } from "sonner";
import { useTeacherProfile } from "./teacher";

export const Route = createFileRoute("/teacher/classes")({
  component: TeacherClassesPage,
});

function TeacherClassesPage() {
  const { profile } = useTeacherProfile();
  
  const classList = profile?.assignedClasses 
    ? profile.assignedClasses.split(",").map((c: string) => c.trim())
    : [];

  const [selectedClass, setSelectedClass] = useState<string>(classList[0] || "");
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!selectedClass) return;
    const fetchStudents = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("teacher_token");
        if (!token) return;
        const data = await getTeacherMyStudentsDb({ data: { token, className: selectedClass } });
        setStudents(data);
      } catch (err) {
        toast.error("Failed to load students.");
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedClass]);

  const filtered = students.filter(s => 
    s.name.toLowerCase().includes(q.toLowerCase()) || 
    s.registration_number?.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
        <p className="text-muted-foreground mt-1">View student rosters for your assigned classes.</p>
      </div>

      {classList.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No Classes Assigned</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              You haven't been assigned to any classes yet. The school administrator will need to assign classes to your profile.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Class List sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">Classes ({classList.length})</h3>
            {classList.map((c: string) => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`w-full text-left px-4 py-3 rounded-xl border transition-all flex items-center justify-between ${
                  selectedClass === c 
                    ? "border-primary bg-primary/5 text-primary shadow-sm" 
                    : "border-transparent hover:bg-muted text-foreground"
                }`}
              >
                <span className="font-medium text-sm">{c}</span>
              </button>
            ))}
          </div>

          {/* Student List */}
          <div className="lg:col-span-3">
            <Card className="border-border shadow-sm">
              <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedClass}</h3>
                  <p className="text-sm text-muted-foreground">{students.length} students enrolled</p>
                </div>
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search students..." 
                    className="pl-9 h-9" 
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
              </div>

              <div className="p-0">
                {loading ? (
                  <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p className="text-sm">Loading student roster...</p>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-12 text-muted-foreground text-center">
                    <p className="text-sm">No students found matching your search.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filtered.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                        <div className="w-8 text-xs text-muted-foreground font-medium text-right">{i + 1}.</div>
                        <div className="h-9 w-9 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-xs">
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{s.name}</p>
                          <p className="text-xs text-muted-foreground uppercase font-mono">{s.registration_number || 'No ID'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
