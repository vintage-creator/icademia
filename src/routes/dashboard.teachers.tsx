import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UserPlus, Copy, Search, MoreHorizontal, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MOCK_TEACHERS, type Teacher } from "@/lib/mock-data";

export const Route = createFileRoute("/dashboard/teachers")({
  head: () => ({ meta: [{ title: "Teachers — iCademia" }] }),
  component: TeachersPage,
});

const newStaffId = () => "ICA-TCH-" + Math.floor(1000 + Math.random() * 9000);

function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>(MOCK_TEACHERS);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "Form Teacher" as Teacher["role"], subject: "", classes: "" });

  const filtered = teachers.filter(t => (t.name + t.email + t.staffId).toLowerCase().includes(q.toLowerCase()));

  const addTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    const t: Teacher = { id: String(Date.now()), staffId: newStaffId(), status: "Invited", ...form };
    setTeachers([t, ...teachers]);
    setOpen(false);
    setForm({ name: "", email: "", role: "Form Teacher", subject: "", classes: "" });
    toast.success(`${t.name} added`, { description: `Staff ID ${t.staffId} generated. Invite sent to ${t.email}.` });
  };

  const copy = (id: string) => {
    navigator.clipboard?.writeText(id).catch(() => {});
    toast("Staff ID copied", { description: id });
  };

  return (
    <div className="space-y-6 p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add head teachers, form teachers and exam officers. Each gets a unique staff ID for sign in.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground shadow-elegant">
              <UserPlus className="mr-1 h-4 w-4" /> Add teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new teacher</DialogTitle>
              <DialogDescription>iCademia will generate a unique staff ID and send the invite by email.</DialogDescription>
            </DialogHeader>
            <form onSubmit={addTeacher} className="mt-2 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Full name</Label><Input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-2" placeholder="Mary Bello" /></div>
              <div className="sm:col-span-2"><Label>Work email</Label><Input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-2" placeholder="mary@yourschool.edu" /></div>
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Teacher["role"] })}>
                  <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Head Teacher">Head Teacher</SelectItem>
                    <SelectItem value="Form Teacher">Form Teacher</SelectItem>
                    <SelectItem value="Subject Teacher">Subject Teacher</SelectItem>
                    <SelectItem value="Exam Officer">Exam Officer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Subject</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="mt-2" placeholder="Mathematics" /></div>
              <div className="sm:col-span-2"><Label>Classes</Label><Input value={form.classes} onChange={e => setForm({ ...form, classes: e.target.value })} className="mt-2" placeholder="JSS 1 – 3" /></div>
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" className="gradient-primary text-primary-foreground shadow-elegant">Generate staff ID & invite</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="border-border p-4 shadow-card">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Staff IDs are unique per school. Teachers sign in at <span className="font-mono text-foreground">your-school.icademia.app</span> with their staff ID and password.
        </div>
      </Card>

      <Card className="border-border p-6 shadow-card">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email, staff ID…" className="pl-9" />
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-3">Teacher</th>
                <th className="py-3">Staff ID</th>
                <th className="py-3">Role</th>
                <th className="py-3">Subject · Classes</th>
                <th className="py-3">Status</th>
                <th className="py-3 text-right" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border/60 hover:bg-muted/40">
                  <td className="py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {t.name.split(" ").map(p => p[0]).slice(0, 2).join("")}
                      </span>
                      <div>
                        <p className="font-medium">{t.name}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground"><Mail className="h-3 w-3" />{t.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">
                    <button onClick={() => copy(t.staffId)} className="group inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-xs hover:bg-muted">
                      {t.staffId} <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                    </button>
                  </td>
                  <td className="py-3">{t.role}</td>
                  <td className="py-3 text-muted-foreground">{t.subject} · {t.classes}</td>
                  <td className="py-3"><StatusPill status={t.status} /></td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => toast("Coming soon", { description: `Edit ${t.name}` })}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No teachers match "{q}"</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-success/15 text-success",
    Invited: "bg-accent/25 text-accent-foreground",
    Suspended: "bg-destructive/10 text-destructive",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted"}`}>{status}</span>;
}
