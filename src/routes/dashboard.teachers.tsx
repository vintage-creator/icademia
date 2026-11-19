import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  UserPlus,
  Copy,
  Search,
  Mail,
  ShieldCheck,
  Loader2,
  Pencil,
  Trash2,
  Send,
} from "lucide-react";
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
import { getAdminToken, getSchoolCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/teachers")({
  head: () => ({ meta: [{ title: "Teachers — iCademia" }] }),
  component: TeachersPage,
});

type Teacher = {
  id: number;
  staff_id: string;
  name: string;
  email: string;
  role: "Teacher" | "Head Teacher";
  subject: string;
  assigned_classes: string;
  headed_classes?: string;
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
    role: "Teacher" as "Teacher" | "Head Teacher",
    subject: "",
    classes: "",
    status: "Invited" as "Invited" | "Active" | "Suspended",
  });
  const schoolCode = getSchoolCode();

  const loadTeachers = () =>
    getTeachersDb({ data: { token: getAdminToken(), schoolCode } })
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
        ? await updateTeacherDb({ data: { token: getAdminToken(), schoolCode, id: editingId, ...form } })
        : await addTeacherDb({
            data: {
              schoolCode,
              token: getAdminToken(),
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
        role: "Teacher",
        subject: "",
        classes: "",
        status: "Active",
      });
      toast.success(editingId ? `${teacher.name} updated` : `${teacher.name} added`, {
        description: editingId
          ? teacher.role === "Head Teacher"
            ? "Profile saved. Head Teacher workspace access is enabled."
            : "Profile saved without Head Teacher workspace access."
          : teacher.role === "Head Teacher"
            ? `Staff ID ${teacher.staff_id} created and the workspace invite was queued.`
            : `Staff ID ${teacher.staff_id} created for timetable and academic allocation.`,
      });
      await loadTeachers();
    } catch (error) {
      toast.error("Could not save teacher", {
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
      await deleteTeacherDb({ data: { token: getAdminToken(), schoolCode, id: teacherToDelete.id } });
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
      await resendTeacherInviteDb({ data: { token: getAdminToken(), schoolCode, id: teacher.id } });
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
    <div className="space-y-6 p-4 sm:p-6 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Teachers & Access</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep every teacher available for timetable and subject allocation. Grant the Head
            Teacher workspace only to staff who need academic portal access.
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
                  : "Add an ordinary teacher record or explicitly grant Head Teacher access."}
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
              {editingId && form.role === "Head Teacher" ? (
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
              <div className="sm:col-span-2">
                <Label>Staff type & workspace access</Label>
                <Select
                  value={form.role}
                  onValueChange={(role) =>
                    setForm({
                      ...form,
                      role: role as "Teacher" | "Head Teacher",
                      status: role === "Head Teacher" ? "Invited" : "Active",
                    })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Teacher">Teacher — no portal access</SelectItem>
                    <SelectItem value="Head Teacher">Head Teacher — academic workspace</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  You can promote a Teacher later. Removing Head Teacher access signs the person out
                  immediately.
                </p>
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
                <Label>Teaching classes</Label>
                <Input
                  value={form.classes}
                  onChange={(e) => setForm({ ...form, classes: e.target.value })}
                  className="mt-2"
                  placeholder="JSS 1 – 3"
                />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  These are teaching responsibilities. Assign the one accountable class Head Teacher
                  from Academic Setup → Classes.
                </p>
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
                  {editingId
                    ? "Save teacher changes"
                    : form.role === "Head Teacher"
                      ? "Add & invite Head Teacher"
                      : "Add teacher"}
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
                Are you sure you want to remove <strong>{teacherToDelete?.name}</strong>? This will
                remove their timetable and academic responsibility record
                {teacherToDelete?.role === "Head Teacher"
                  ? " and revoke their Head Teacher access immediately."
                  : "."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={removeTeacher}
                disabled={deleting}
                className="gap-2"
              >
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
              <h3 className="text-sm font-semibold text-foreground">
                Staff records and workspace access are separate
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-2xl">
                Ordinary Teachers appear in timetable, class and subject allocation only. They
                cannot activate or sign in to the Head Teacher dashboard. The School Admin must
                explicitly promote a person before iCademia grants workspace access.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-border/60 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-border/50 bg-card p-3">
              <span className="text-xs font-bold">Teacher</span>
              <p className="mt-1 text-xs text-muted-foreground">
                Available for timetable, subjects and teaching responsibility. No dashboard login.
              </p>
            </div>
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <span className="text-xs font-bold text-primary">Head Teacher</span>
              <p className="mt-1 text-xs text-muted-foreground">
                Can sign in and work only with classes assigned by the School Admin.
              </p>
            </div>
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
            <table className="hidden w-full min-w-[700px] text-sm md:table">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3">Teacher</th>
                  <th className="py-3">Staff ID</th>
                  <th className="py-3">Workspace access</th>
                  <th className="py-3">Academic responsibility</th>
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
                    <td className="py-3">
                      <span
                        className={
                          t.role === "Head Teacher"
                            ? "font-semibold text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        {t.role === "Head Teacher" ? "Head Teacher portal" : "No portal access"}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      <p>
                        {t.subject || "No subject"} · {t.assigned_classes || "No teaching classes"}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-primary">
                        {t.role === "Head Teacher" && t.headed_classes
                          ? `Class Head Teacher: ${t.headed_classes}`
                          : t.role === "Head Teacher"
                            ? "Portal access granted · no class-head responsibility"
                            : "Teaching staff record"}
                      </p>
                    </td>
                    <td className="py-3">
                      <StatusPill role={t.role} status={t.status} hasPassword={!!t.password_hash} />
                    </td>
                    <td className="py-3 text-right">
                      {t.role === "Head Teacher" && t.status === "Invited" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Resend invite to ${t.name}`}
                          onClick={() => resendInvite(t)}
                          disabled={resendingId === t.id}
                        >
                          {resendingId === t.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
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
                      No teachers added yet. Use “Add teacher” to create your staff list.
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
        {!loading && (
          <div className="mt-4 grid gap-3 md:hidden">
            {filtered.map((t) => (
              <div key={t.id} className="rounded-xl border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.email}</p>
                  </div>
                  <StatusPill role={t.role} status={t.status} hasPassword={!!t.password_hash} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {t.subject || "All subjects"} · {t.assigned_classes || "No teaching classes"}
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  {t.role === "Head Teacher" && t.headed_classes
                    ? `Class Head Teacher: ${t.headed_classes}`
                    : t.role === "Head Teacher"
                      ? "Portal access granted · no class-head responsibility"
                      : "Teacher · no portal access"}
                </p>
                <div className="mt-3 flex justify-end">
                  <Button variant="ghost" size="sm" onClick={() => editTeacher(t)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => requestRemoveTeacher(t)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
function StatusPill({
  role,
  status,
  hasPassword,
}: {
  role: Teacher["role"];
  status: string;
  hasPassword: boolean;
}) {
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
        {role === "Teacher" && status !== "Suspended" ? "Active staff" : status}
      </span>
      {role === "Head Teacher" && status !== "Suspended" && (
        <span className="text-[10px] text-muted-foreground">
          {hasPassword ? "✓ Password set" : "Awaiting setup"}
        </span>
      )}
    </div>
  );
}
