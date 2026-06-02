import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MOCK_STUDENTS } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/students")({
  head: () => ({ meta: [{ title: "Students — ScholarGrade" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const [q, setQ] = useState("");
  const rows = MOCK_STUDENTS.filter(
    (s) => s.name.toLowerCase().includes(q.toLowerCase()) || s.reg.toLowerCase().includes(q.toLowerCase())
  );
  return (
    <div className="space-y-6 p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage enrolled students and their registration records.</p>
        </div>
        <Button className="gradient-primary text-primary-foreground shadow-elegant">
          <Plus className="mr-1 h-4 w-4" /> Add student
        </Button>
      </header>
      <Card className="border-border p-6 shadow-card">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or reg no…" className="pl-9" />
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3">Student</th>
                <th className="py-3">Reg No</th>
                <th className="py-3">Class</th>
                <th className="py-3 text-right">Term Avg</th>
                <th className="py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.reg} className="border-b border-border/60 hover:bg-muted/40">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </span>
                      <span className="font-medium">{s.name}</span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-xs">{s.reg}</td>
                  <td className="py-3 text-muted-foreground">{s.class}</td>
                  <td className="py-3 text-right font-display font-semibold">{s.avg.toFixed(1)}%</td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-muted-foreground">No students match "{q}"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
