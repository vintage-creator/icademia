import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, CalendarRange, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/classes")({
  head: () => ({ meta: [{ title: "Classes & Terms — iCademia" }] }),
  component: ClassesPage,
});

const classes = [
  { name: "JSS 1 - Ruby", teacher: "Mr. Femi Adekoya", students: 38 },
  { name: "JSS 2 - Diamond", teacher: "Mrs. Adekunle", students: 42 },
  { name: "JSS 3 - Pearl", teacher: "Mr. Okafor", students: 40 },
  { name: "SS 1 - Sapphire", teacher: "Mrs. Bello", students: 36 },
  { name: "SS 2 - Emerald", teacher: "Mr. Lawal", students: 34 },
  { name: "SS 3 - Obsidian", teacher: "Mrs. Eze", students: 31 },
];

const terms = [
  { session: "2024/2025", term: "First", status: "Closed", window: "Sep 16 — Dec 13, 2024" },
  { session: "2024/2025", term: "Second", status: "Active", window: "Jan 8 — Apr 4, 2025" },
  { session: "2024/2025", term: "Third", status: "Upcoming", window: "Apr 28 — Jul 25, 2025" },
];

function ClassesPage() {
  return (
    <div className="space-y-8 p-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Classes & Terms</h1>
        <p className="mt-1 text-sm text-muted-foreground">Organise classes, assign teachers, and configure academic terms.</p>
      </header>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><BookOpen className="h-4 w-4 text-primary" /> Classes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <Card key={c.name} className="border-border p-5 shadow-card transition hover:shadow-elegant">
              <p className="font-display text-lg font-semibold">{c.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">Form teacher · {c.teacher}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Users2 className="h-4 w-4" /> {c.students} students
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><CalendarRange className="h-4 w-4 text-primary" /> Terms</h2>
        <Card className="border-border p-6 shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5">Session</th>
                <th className="py-2.5">Term</th>
                <th className="py-2.5">Window</th>
                <th className="py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {terms.map((t) => (
                <tr key={t.term} className="border-b border-border/60">
                  <td className="py-3 font-medium">{t.session}</td>
                  <td className="py-3">{t.term}</td>
                  <td className="py-3 text-muted-foreground">{t.window}</td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.status === "Active" ? "bg-success/15 text-success" :
                      t.status === "Upcoming" ? "bg-primary/10 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>{t.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
}
