import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  createHeadTeacherAssignmentDb,
  getHeadTeacherAssignmentsDb,
  getHeadTeacherClassSubjectsDb,
} from "@/lib/api/db.functions";
import { useTeacherProfile } from "./teacher";

export const Route = createFileRoute("/teacher/assignments")({ component: AssignmentsPage });

function AssignmentsPage() {
  type Assignment = {
    id: number;
    title: string;
    subject: string;
    class_name: string;
    instructions: string;
    due_date: string;
    student_count: number;
  };
  const { profile } = useTeacherProfile();
  const classes = useMemo(
    () =>
      (profile?.assignedClasses || "")
        .split(",")
        .map((v: string) => v.trim())
        .filter(Boolean),
    [profile],
  );
  const [items, setItems] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    className: classes[0] || "",
    subject: "",
    title: "",
    instructions: "",
    dueDate: "",
  });

  const load = async () => {
    const token = localStorage.getItem("teacher_token");
    if (!token) return;
    try {
      setItems((await getHeadTeacherAssignmentsDb({ data: { token } })) as unknown as Assignment[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load assignments.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  useEffect(() => {
    setForm((current) => ({
      ...current,
      className: current.className || classes[0] || "",
      subject: current.subject,
    }));
  }, [classes]);
  useEffect(() => {
    if (!form.className) return;
    const token = localStorage.getItem("teacher_token");
    if (!token) return;
    void getHeadTeacherClassSubjectsDb({ data: { token, className: form.className } })
      .then((result) => {
        const nextSubjects = result.subjects as unknown as Array<{ id: number; name: string }>;
        setSubjects(nextSubjects);
        setForm((current) => ({
          ...current,
          subject: nextSubjects.some((item) => item.name === current.subject)
            ? current.subject
            : nextSubjects[0]?.name || "",
        }));
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load class subjects."),
      );
  }, [form.className]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem("teacher_token");
    if (!token) return;
    setSaving(true);
    try {
      const created = await createHeadTeacherAssignmentDb({ data: { token, ...form } });
      toast.success(`Assignment published to ${created.student_count} students`);
      setForm((current) => ({ ...current, title: "", instructions: "", dueDate: "" }));
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish assignment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 md:p-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish work to every enrolled student in a class.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Plus className="h-4 w-4" /> New assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {classes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No classes are assigned to this account. Ask the School Admin to assign at least one
                class.
              </p>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <Label>Class</Label>
                  <select
                    className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                  >
                    {classes.map((c: string) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Subject</Label>
                  <select
                    className="mt-2 h-10 w-full rounded-md border bg-background px-3 text-sm"
                    required
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  >
                    {subjects.length === 0 ? <option value="">No subjects configured</option> : null}
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.name}>{subject.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    className="mt-2"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Instructions</Label>
                  <Textarea
                    className="mt-2 min-h-28"
                    required
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Due date</Label>
                  <Input
                    className="mt-2"
                    type="date"
                    required
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
                <Button disabled={saving} className="w-full">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publish assignment
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Published assignments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin" />
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <ClipboardCheck className="mx-auto mb-3 h-8 w-8 opacity-40" />
                No assignments published yet.
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">
                        {item.subject} · {item.class_name}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      {item.student_count} students
                    </span>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm">{item.instructions}</p>
                  <p className="mt-3 text-xs font-medium text-muted-foreground">
                    Due {new Date(item.due_date).toLocaleDateString()}
                  </p>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
