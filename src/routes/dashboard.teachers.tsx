import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { UserPlus, Copy, Search, Mail, ShieldCheck, Loader2, Pencil, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addTeacherDb,
  deleteTeacherDb,
  getTeachersDb,
  updateTeacherDb,
  resendTeacherInviteDb,
} from "@/lib/api/db.functions";
import { getSchoolCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/teachers")({
  head: () => ({ meta: [{ title: "Teachers — iCademia" }] }),
  component: TeachersPage,
});

type Teacher = {
  id: number;
  staff_id: string;
  name: string;
  email: string;
  role: "Head Teacher" | "Form Teacher" | "Subject Teacher" | "Exam Officer";
  subject: string;
  assigned_classes: string;
  status: string;
  password_hash: string | null;
};

function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<Teacher | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Resend state
  const [resendingId, setResendingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "Form Teacher" as Teacher["role"],
    subject: "",
    classes: "",
    status: "Invited" as "Invited" | "Active" | "Suspended",
  });
const schoolCode = getSchoolCode();
  const roleGuidance: Record<Teacher["role"], string> = {
    "Head Teacher": "Oversees teaching quality and class activity. Does not need a subject unless they also teach one.",
    "Form Teacher": "Owns one class roster, attendance and parent-facing remarks. Assign the class they lead.",
    "Subject Teacher": "Enters scores only for their assigned subject and classes. Assign both subject and classes.",
    "Exam Officer": "Coordinates exam records and result readiness. Use this for the staff member responsible for assessment administration.",
  };

  const loadTeachers = () =>
    getTeachersDb({ data: { schoolCode } })
      .then((rows) => setTeachers(rows as unknown as Teacher[]))
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load staff."),
      )
      .finally(() => setLoading(false));

  useEffect(() => {
    loadTeachers();
  }, [schoolCode]);

  const filtered = teachers.filter((t) =>
    (t.name + t.email + t.staff_id).toLowerCase().includes(q.toLowerCase()),
  );

  const addTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const teacher = editingId
        ? await updateTeacherDb({ data: { schoolCode, id: editingId, ...form } })
        : await addTeacherDb({
            data: {
              schoolCode,
              name: form.name,
              email: form.email,
              role: form.role,
              subject: form.subject,
              classes: form.classes,
            },
          });
      setOpen(false);
      setEditingId(null);
      setForm({
        name: "",
        email: "",
        role: "Form Teacher",
        subject: "",
        classes: "",
        status: "Invited",
      });
      toast.success(editingId ? `${teacher.name} updated` : `${teacher.name} invited`, {
        description: editingId
          ? "The teacher profile and responsibility assignment were saved."
          : `Staff ID ${teacher.staff_id} created and the email invite was queued.`,
      });
      await loadTeachers();
    } catch (error) {
      toast.error("Could not invite staff", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const editTeacher = (teacher: Teacher) => {
    setEditingId(teacher.id);
    setForm({
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      subject: teacher.subject || "",
      classes: teacher.assigned_classes || "",
      status: teacher.status as "Invited" | "Active" | "Suspended",
    });
    setOpen(true);
  };

  const requestRemoveTeacher = (teacher: Teacher) => {
    setTeacherToDelete(teacher);
    setDeleteOpen(true);
  };

  const removeTeacher = async () => {
    if (!teacherToDelete) return;
    setDeleting(true);
    try {
      await deleteTeacherDb({ data: { schoolCode, id: teacherToDelete.id } });
      toast.success("Teacher removed");
      setDeleteOpen(false);
      setTeacherToDelete(null);
      await loadTeachers();
    } catch (e) {
      toast.error("Failed to remove teacher.");
    } finally {
      setDeleting(false);
    }
  };

  const resendInvite = async (teacher: Teacher) => {
    setResendingId(teacher.id);
    try {
      await resendTeacherInviteDb({ data: { schoolCode, id: teacher.id } });
      toast.success(`Invite sent to ${teacher.name}`);
    } catch (e) {
      toast.error("Failed to send invite.");
    } finally {
      setResendingId(null);
    }
  };

  const copy = (id: string) => {
    navigator.clipboard?.writeText(id).catch(() => {});
    toast("Staff ID copied", { description: id });
  };

  return (
    <div className="space-y-6 p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Teachers & Staff</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Invite staff and assign roles. Each staff member receives a unique Staff ID for secure login.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setEditingId(null);
          }}
        >
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground shadow-elegant">
              <UserPlus className="mr-1 h-4 w-4" /> Add teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit teacher profile" : "Add a new teacher"}</DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Update identity, teaching responsibilities and account status."
                  : "iCademia will generate a unique staff ID and send the invite by email."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={addTeacher} className="mt-2 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label>Full name</Label>
                <Input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-2"
                  placeholder="Mary Bello"
                />
              </div>
              {editingId ? (
                <div className="sm:col-span-2">
                  <Label>Account status</Label>
                  <Select
                    value={form.status}
                    onValueChange={(status) =>
                      setForm({
                        ...form,
                        status: status as "Invited" | "Active" | "Suspended",
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Invited">Invited</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <Label>Work email</Label>
                <Input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-2"
                  placeholder="mary@yourschool.edu"
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm({ ...form, role: v as Teacher["role"] })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Head Teacher">Head Teacher</SelectItem>
                    <SelectItem value="Form Teacher">Form Teacher</SelectItem>
                    <SelectItem value="Subject Teacher">Subject Teacher</SelectItem>
                    <SelectItem value="Exam Officer">Exam Officer</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">{roleGuidance[form.role]}</p>
              </div>
              <div>
                <Label>Subject</Label>
                <Input
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="mt-2"
                  placeholder="Mathematics"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Classes</Label>
                <Input
                  value={form.classes}
                  onChange={(e) => setForm({ ...form, classes: e.target.value })}
                  className="mt-2"
                  placeholder="JSS 1 – 3"
                />
              </div>
              <DialogFooter className="sm:col-span-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="gradient-primary text-primary-foreground shadow-elegant"
                >
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingId ? "Save teacher changes" : "Generate staff ID & invite"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Teacher?</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove <strong>{teacherToDelete?.name}</strong>? This will revoke their access to the teacher portal.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" onClick={removeTeacher} disabled={deleting} className="gap-2">
                {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {deleting ? "Removing..." : "Remove Teacher"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <Card className="border-border p-5 shadow-card bg-gradient-to-r from-primary/5 via-background to-muted/20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">How Staff Roles & Access Work</h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-2xl">
                Assigning the right role ensures staff only see what they need to see. Teachers sign in with their unique <span className="font-mono text-foreground font-semibold">Staff ID</span> at <span className="font-mono text-primary font-medium">icademia.app/teacher-login</span>.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 border-t border-border/60 pt-4">
          <div className="rounded-lg border border-border/50 bg-card p-3">
            <span className="inline-block rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
              Head Teacher
            </span>
            <p className="mt-1.5 text-xs text-muted-foreground leading-snug">
              Academic oversight & remarks across all classes. Signs official result cards.
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card p-3">
            <span className="inline-block rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
              Form Teacher
            </span>
            <p className="mt-1.5 text-xs text-muted-foreground leading-snug">
              Manages a single class roster, registers attendance & writes tutor remarks.
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card p-3">
            <span className="inline-block rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
              Subject Teacher
            </span>
            <p className="mt-1.5 text-xs text-muted-foreground leading-snug">
              Only enters CA & exam scores for their specific assigned subjects and classes.
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-card p-3">
            <span className="inline-block rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
              Exam Officer
            </span>
            <p className="mt-1.5 text-xs text-muted-foreground leading-snug">
              Audits score readiness, compiles rankings & publishes final term results.
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-border p-6 shadow-card">
        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, staff ID…"
            className="pl-9"
          />
        </div>
        <div className="mt-5 overflow-x-auto">
          {loading ? (
            <div className="grid min-h-48 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <table className="w-full min-w-[600px] text-sm">
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
                          {t.name
                            .split(" ")
                            .map((p) => p[0])
                            .slice(0, 2)
                            .join("")}
                        </span>
                        <div>
                          <p className="font-medium">{t.name}</p>
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {t.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <button
                        onClick={() => copy(t.staff_id)}
                        className="group inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-xs hover:bg-muted"
                      >
                        {t.staff_id}{" "}
                        <Copy className="h-3 w-3 text-muted-foreground group-hover:text-foreground" />
                      </button>
                    </td>
                    <td className="py-3">{t.role}</td>
                    <td className="py-3 text-muted-foreground">
                      {t.subject || "—"} · {t.assigned_classes || "Not assigned"}
                    </td>
                  <td className="py-3">
                      <StatusPill status={t.status} hasPassword={!!t.password_hash} />
                    </td>
                    <td className="py-3 text-right">
                      {t.status === "Invited" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Resend invite to ${t.name}`}
                          onClick={() => resendInvite(t)}
                          disabled={resendingId === t.id}
                        >
                          {resendingId === t.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${t.name}`}
                        onClick={() => editTeacher(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Remove ${t.name}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => requestRemoveTeacher(t)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {teachers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No teachers added yet. Click "Add teacher" to invite your staff.
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No teachers match "{q}"
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
function StatusPill({ status, hasPassword }: { status: string; hasPassword: boolean }) {
  const map: Record<string, string> = {
    Active: "bg-success/15 text-success",
    Invited: "bg-accent/25 text-accent-foreground",
    Suspended: "bg-destructive/10 text-destructive",
  };
  return (
    <div className="flex flex-col items-start gap-1">
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${map[status] ?? "bg-muted"}`}
      >
        {status}
      </span>
      {status !== "Suspended" && (
        <span className="text-[10px] text-muted-foreground">
          {hasPassword ? "✓ Password set" : "Awaiting setup"}
        </span>
      )}
    </div>
  );
}
