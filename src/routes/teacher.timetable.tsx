import { createFileRoute } from "@tanstack/react-router";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTeacherProfile } from "./teacher";

export const Route = createFileRoute("/teacher/timetable")({
  component: TeacherTimetablePage,
});

function TeacherTimetablePage() {
  const { profile } = useTeacherProfile();
  
  // Static placeholder for timetable (in a real app, this would fetch from a timetable db.function)
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const periods = [
    { time: "08:00 - 08:40", label: "Period 1" },
    { time: "08:40 - 09:20", label: "Period 2" },
    { time: "09:20 - 10:00", label: "Period 3" },
    { time: "10:00 - 10:40", label: "Break", isBreak: true },
    { time: "10:40 - 11:20", label: "Period 4" },
    { time: "11:20 - 12:00", label: "Period 5" },
    { time: "12:00 - 12:40", label: "Period 6" },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Timetable</h1>
        <p className="text-muted-foreground mt-1">Your weekly teaching schedule.</p>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="p-4 text-left font-medium text-muted-foreground w-40">Time</th>
                {days.map(d => (
                  <th key={d} className="p-4 text-left font-medium text-foreground min-w-[150px] border-l border-border">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {periods.map((p, i) => (
                <tr key={i} className={p.isBreak ? "bg-muted/10" : "hover:bg-muted/5 transition-colors"}>
                  <td className="p-4 border-r border-border">
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                      <Clock className="h-4 w-4" />
                      <span>{p.time}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 ml-6">{p.label}</div>
                  </td>
                  {days.map(d => (
                    <td key={d} className="p-4 border-r border-border align-top">
                      {p.isBreak ? (
                        <div className="text-center text-xs text-muted-foreground font-medium py-2 uppercase tracking-widest opacity-50">Break</div>
                      ) : (
                        // Mock sparse schedule
                        (i % 2 === 0 && d !== "Wednesday") ? (
                          <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
                            <p className="font-semibold text-primary">{profile?.assignedClasses?.split(",")[0] || "JSS 1"}</p>
                            <p className="text-xs font-medium mt-1">{profile?.subject || "Subject"}</p>
                            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              Classroom A
                            </p>
                          </div>
                        ) : null
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
