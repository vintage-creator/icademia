import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Download,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Upload,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  bulkImportTimetableDb,
  deleteTimetableEntryDb,
  getAcademicOperationsDb,
  saveAcademicOperationDb,
  saveTimetableEntryDb,
  generateSchoolAdminIntelligenceDb,
} from "@/lib/api/db.functions";
import { FormattedAiOutput } from "@/components/formatted-ai-output";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BrainCircuit, Sparkles } from "lucide-react";
import { getSchoolCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/timetable")({
  head: () => ({ meta: [{ title: "Timetable — iCademia" }] }),
  component: TimetablePage,
});

type Teacher = { id: number; name: string; role: string };
type Subject = { id: number; name: string };
type Entry = {
  id: number;
  teacher_id: number | null;
  subject_id: number | null;
  class_name: string;
  day_of_week: number;
  period_number: number;
  starts_at?: string;
  ends_at?: string;
  room?: string;
  entry_type: "Lesson" | "Break" | "Assembly" | "Activity";
  title?: string;
  teacher_name?: string;
  subject_name?: string;
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const periods = Array.from({ length: 10 }, (_, index) => index + 1);
const emptyForm = {
  id: 0,
  teacherId: "none",
  subjectId: "none",
  className: "",
  dayOfWeek: "1",
  periodNumber: "1",
  startsAt: "",
  endsAt: "",
  room: "",
  entryType: "Lesson" as Entry["entry_type"],
  title: "",
};

function TimetablePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState<"class" | "teacher">("class");
  const [filter, setFilter] = useState("all");

  const [topics, setTopics] = useState<any[]>([]);
  const [coverage, setCoverage] = useState<any[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  const runWorkloadOptimizer = async () => {
    setAiLoading(true);
    setAiOpen(true);
    try {
      const res = await generateSchoolAdminIntelligenceDb({
        data: { schoolCode: getSchoolCode(), workflow: "workload_optimizer" },
      });
      setAiOutput(res.output);
    } catch (err) {
      toast.error("Failed to run workload optimizer", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAcademicOperationsDb({ data: { schoolCode: getSchoolCode() } });
      setTeachers(data.teachers as unknown as Teacher[]);
      setSubjects(data.subjects as unknown as Subject[]);
      setEntries(data.timetable as unknown as Entry[]);
      setTopics(data.topics || []);
      setCoverage(data.coverage || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load timetable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const classes = useMemo(
    () => [...new Set(entries.map((entry) => entry.class_name).filter(Boolean))].sort(),
    [entries],
  );
  const visibleEntries = entries.filter((entry) => {
    if (filter === "all") return true;
    return view === "class"
      ? entry.class_name === filter
      : String(entry.teacher_id ?? "") === filter;
  });
  const workload = teachers
    .map((teacher) => ({
      ...teacher,
      periods: entries.filter((entry) => entry.teacher_id === teacher.id).length,
      classes: new Set(
        entries.filter((entry) => entry.teacher_id === teacher.id).map((entry) => entry.class_name),
      ).size,
    }))
    .sort((a, b) => b.periods - a.periods);

  const save = async () => {
    setSaving(true);
    try {
      await saveTimetableEntryDb({
        data: {
          schoolCode: getSchoolCode(),
          entry: {
            id: form.id || undefined,
            teacherId: form.teacherId === "none" ? null : Number(form.teacherId),
            subjectId: form.subjectId === "none" ? null : Number(form.subjectId),
            className: form.className,
            dayOfWeek: Number(form.dayOfWeek),
            periodNumber: Number(form.periodNumber),
            startsAt: form.startsAt || undefined,
            endsAt: form.endsAt || undefined,
            room: form.room,
            entryType: form.entryType,
            title: form.title,
          },
        },
      });
      toast.success(form.id ? "Timetable entry updated" : "Timetable entry added");
      setForm(emptyForm);
      await load();
    } catch (error) {
      toast.error("Entry could not be saved", {
        description: error instanceof Error ? error.message : "Check for a timetable conflict.",
      });
    } finally {
      setSaving(false);
    }
  };

  const edit = (entry: Entry) =>
    setForm({
      id: entry.id,
      teacherId: entry.teacher_id ? String(entry.teacher_id) : "none",
      subjectId: entry.subject_id ? String(entry.subject_id) : "none",
      className: entry.class_name,
      dayOfWeek: String(entry.day_of_week),
      periodNumber: String(entry.period_number),
      startsAt: entry.starts_at?.slice(0, 5) ?? "",
      endsAt: entry.ends_at?.slice(0, 5) ?? "",
      room: entry.room ?? "",
      entryType: entry.entry_type,
      title: entry.title ?? "",
    });

  const remove = async (id: number) => {
    await deleteTimetableEntryDb({ data: { schoolCode: getSchoolCode(), id } });
    toast.success("Entry removed");
    await load();
  };

  const move = async (entry: Entry, day: number, period: number) => {
    if (entry.day_of_week === day && entry.period_number === period) return;
    const previousEntries = entries;
    setEntries((current) =>
      current.map((item) =>
        item.id === entry.id ? { ...item, day_of_week: day, period_number: period } : item,
      ),
    );
    try {
      await saveTimetableEntryDb({
        data: {
          schoolCode: getSchoolCode(),
          entry: {
            id: entry.id,
            teacherId: entry.teacher_id,
            subjectId: entry.subject_id,
            className: entry.class_name,
            dayOfWeek: day,
            periodNumber: period,
            startsAt: entry.starts_at,
            endsAt: entry.ends_at,
            room: entry.room,
            entryType: entry.entry_type,
            title: entry.title,
          },
        },
      });
      toast.success("Timetable entry moved");
    } catch (error) {
      setEntries(previousEntries);
      toast.error(error instanceof Error ? error.message : "This move creates a conflict.");
    }
  };

  const importCsv = async (file?: File) => {
    if (!file) return;
    const lines = (await file.text()).split(/\r?\n/).filter(Boolean);
    const imported = lines.slice(1).map((line) => {
      const [day, period, className, type, subject, teacher, room, startsAt, endsAt, title] = line
        .split(",")
        .map((value) => value.trim());
      return {
        dayOfWeek: Math.max(
          1,
          days.findIndex((item) => item.toLowerCase() === day.toLowerCase()) + 1,
        ),
        periodNumber: Number(period),
        className,
        entryType: (["Lesson", "Break", "Assembly", "Activity"].includes(type)
          ? type
          : "Lesson") as Entry["entry_type"],
        subjectId:
          subjects.find((item) => item.name.toLowerCase() === subject.toLowerCase())?.id ?? null,
        teacherId:
          teachers.find((item) => item.name.toLowerCase() === teacher.toLowerCase())?.id ?? null,
        room,
        startsAt,
        endsAt,
        title,
      };
    });
    try {
      const result = await bulkImportTimetableDb({
        data: { schoolCode: getSchoolCode(), entries: imported },
      });
      toast.success(`${result.imported} timetable entries imported`);
      await load();
    } catch (error) {
      toast.error("Import stopped", {
        description:
          error instanceof Error ? error.message : "Review the CSV format and conflicts.",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-7 p-4 sm:p-6 lg:p-8 print:p-0">
      <header className="flex flex-wrap items-end justify-between gap-4 print:hidden">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Academic planning
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold">School timetable</h1>
          <p className="mt-2 text-muted-foreground">
            Build weekly schedules with class, teacher and room conflict protection.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" asChild>
            <label>
              <Upload className="mr-2 h-4 w-4" /> Import CSV
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(event) => importCsv(event.target.files?.[0])}
              />
            </label>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="data:text/csv;charset=utf-8,day%2Cperiod%2Cclass%2Ctype%2Csubject%2Cteacher%2Croom%2Cstart%2Cend%2Ctitle%0AMonday%2C1%2CJSS%201%2CLesson%2CMathematics%2CJane%20Doe%2CRoom%201%2C08%3A00%2C08%3A40%2C"
              download="icademia-timetable-template.csv"
            >
              <Download className="mr-2 h-4 w-4" /> Template
            </a>
          </Button>
        </div>
      </header>

      <Card className="grid gap-5 border-border p-5 shadow-card print:hidden md:grid-cols-4">
        <SelectField
          label="Entry type"
          value={form.entryType}
          onChange={(value) => setForm({ ...form, entryType: value as Entry["entry_type"] })}
          options={["Lesson", "Break", "Assembly", "Activity"].map((item) => [item, item])}
        />
        <Field
          label="Class / group"
          value={form.className}
          onChange={(value) => setForm({ ...form, className: value })}
          placeholder="JSS 1"
        />
        <SelectField
          label="Teacher"
          value={form.teacherId}
          onChange={(value) => setForm({ ...form, teacherId: value })}
          options={[
            ["none", "No teacher"],
            ...teachers.map((item) => [String(item.id), item.name]),
          ]}
        />
        <SelectField
          label="Subject"
          value={form.subjectId}
          onChange={(value) => setForm({ ...form, subjectId: value })}
          options={[
            ["none", "No subject"],
            ...subjects.map((item) => [String(item.id), item.name]),
          ]}
        />
        <SelectField
          label="Day"
          value={form.dayOfWeek}
          onChange={(value) => setForm({ ...form, dayOfWeek: value })}
          options={days.map((item, index) => [String(index + 1), item])}
        />
        <SelectField
          label="Period"
          value={form.periodNumber}
          onChange={(value) => setForm({ ...form, periodNumber: value })}
          options={periods.map((item) => [String(item), `Period ${item}`])}
        />
        <Field
          label="Starts"
          type="time"
          value={form.startsAt}
          onChange={(value) => setForm({ ...form, startsAt: value })}
        />
        <Field
          label="Ends"
          type="time"
          value={form.endsAt}
          onChange={(value) => setForm({ ...form, endsAt: value })}
        />
        <Field
          label="Room"
          value={form.room}
          onChange={(value) => setForm({ ...form, room: value })}
          placeholder="Room 4"
        />
        <Field
          label="Title"
          value={form.title}
          onChange={(value) => setForm({ ...form, title: value })}
          placeholder="Morning assembly"
        />
        <div className="flex items-end gap-2 md:col-span-2">
          <Button onClick={save} disabled={saving || !form.className} className="flex-1">
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {form.id ? "Update entry" : "Add entry"}
          </Button>
          {form.id ? (
            <Button variant="ghost" onClick={() => setForm(emptyForm)}>
              Cancel
            </Button>
          ) : null}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3 print:hidden">
        <Select
          value={view}
          onValueChange={(value) => {
            setView(value as "class" | "teacher");
            setFilter("all");
          }}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="class">Class timetable</SelectItem>
            <SelectItem value="teacher">Teacher timetable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Show all</SelectItem>
            {(view === "class"
              ? classes.map((item) => [item, item])
              : teachers.map((item) => [String(item.id), item.name])
            ).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="overflow-x-auto border-border shadow-card">
        <table className="min-w-[1000px] w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#071a2e] text-white">
              <th className="w-24 p-3 text-left">Period</th>
              {days.map((day) => (
                <th key={day} className="p-3 text-left">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((period) => (
              <tr key={period} className="border-b border-border">
                <th className="bg-muted/40 p-3 text-left">Period {period}</th>
                {days.map((_, dayIndex) => {
                  const cell = visibleEntries.filter(
                    (entry) => entry.day_of_week === dayIndex + 1 && entry.period_number === period,
                  );
                  return (
                    <td
                      key={dayIndex}
                      className="h-28 min-w-44 border-l border-border p-2 align-top"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        const id = Number(event.dataTransfer.getData("text/plain"));
                        const entry = entries.find((item) => item.id === id);
                        if (entry) void move(entry, dayIndex + 1, period);
                      }}
                    >
                      {cell.map((entry) => (
                        <div
                          key={entry.id}
                          draggable
                          onDragStart={(event) =>
                            event.dataTransfer.setData("text/plain", String(entry.id))
                          }
                          className="mb-2 cursor-grab rounded-lg border border-primary/15 bg-primary/5 p-2.5"
                        >
                          <p className="font-semibold">
                            {entry.title || entry.subject_name || entry.entry_type}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {entry.class_name}
                            {entry.teacher_name ? ` · ${entry.teacher_name}` : ""}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.room || "No room"}{" "}
                            {entry.starts_at ? `· ${entry.starts_at.slice(0, 5)}` : ""}
                          </p>
                          {entry.entry_type === "Lesson" && entry.subject_name && (
                            <div className="mt-2 border-t border-primary/10 pt-2 text-[10px]">
                              {(() => {
                                const classSubjectTopics = topics.filter(
                                  (t) =>
                                    t.class_name === entry.class_name &&
                                    t.subject_name === entry.subject_name,
                                );
                                const completed = classSubjectTopics.filter((t) =>
                                  coverage.some((c) => c.topic_id === t.id && c.status === "Completed"),
                                );
                                const percent = classSubjectTopics.length
                                  ? Math.round((completed.length / classSubjectTopics.length) * 100)
                                  : 0;
                                const next = classSubjectTopics.find(
                                  (t) =>
                                    !coverage.some((c) => c.topic_id === t.id && c.status === "Completed"),
                                );

                                return (
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between text-muted-foreground">
                                      <span>Syllabus</span>
                                      <span className="font-semibold text-primary">{percent}%</span>
                                    </div>
                                    <div className="h-1 w-full overflow-hidden rounded-full bg-primary/10">
                                      <div
                                        className="h-full rounded-full bg-primary transition-all"
                                        style={{ width: `${percent}%` }}
                                      />
                                    </div>
                                    {next ? (
                                      <p className="truncate text-muted-foreground">
                                        Next: <span className="font-medium text-foreground">{next.topic}</span>
                                      </p>
                                    ) : classSubjectTopics.length > 0 ? (
                                      <p className="text-success font-medium">Syllabus Done 🎉</p>
                                    ) : (
                                      <p className="text-muted-foreground italic">No topics defined</p>
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          <div className="mt-2 flex gap-1 print:hidden">
                            <button onClick={() => edit(entry)} aria-label="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => remove(entry.id)} aria-label="Delete">
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="border-border p-5 shadow-card print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-3">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <UsersRound className="h-5 w-5 text-primary" /> Teacher workload summary
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={runWorkloadOptimizer}
            disabled={aiLoading}
            className="border-primary/20 hover:border-primary/50 text-foreground/80"
          >
            {aiLoading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <BrainCircuit className="mr-1.5 h-3.5 w-3.5 text-primary" />
            )}
            Run AI Workload Optimiser
          </Button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {workload.map((teacher) => (
            <div key={teacher.id} className="rounded-xl border border-border p-4">
              <p className="font-medium">{teacher.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {teacher.periods} periods · {teacher.classes} classes
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 px-0"
                onClick={() => {
                  setView("teacher");
                  setFilter(String(teacher.id));
                }}
              >
                <CalendarDays className="mr-1 h-3.5 w-3.5" /> View timetable
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5">
              <BrainCircuit className="h-5 w-5 text-primary" />
              AI Workload Optimization Report
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed">
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span>Analyzing timetable entries and staff periods allocation...</span>
              </div>
            ) : aiOutput ? (
              <FormattedAiOutput text={aiOutput} />
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                No analysis could be completed. Please ensure timetable entries are set.
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={() => setAiOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input
        className="mt-2"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, optionLabel]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {optionLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
