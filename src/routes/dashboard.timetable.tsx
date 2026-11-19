import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Download,
  Loader2,
  Pencil,
  Plus,
  Printer,
  Trash2,
  Upload,
  UsersRound,
  ChevronDown,
  ChevronUp,
  FileText,
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
  saveTimetableEntryDb,
  generateSchoolAdminIntelligenceDb,
  parseBulkDocxDb,
} from "@/lib/api/db.functions";
import { FormattedAiOutput } from "@/components/formatted-ai-output";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrainCircuit } from "lucide-react";
import { getAdminToken, getSchoolCode } from "@/lib/utils";
import { downloadDocxTemplate, fileToDataUrl, parseCsvRows } from "@/lib/bulk-import";

export const Route = createFileRoute("/dashboard/timetable")({
  head: () => ({ meta: [{ title: "Timetable — iCademia" }] }),
  component: TimetablePage,
});

type Teacher = { id: number; staff_id?: string; name: string; role: string };
type Subject = { id: number; name: string };
type Student = { id: number; class_name: string };
type CurriculumTopic = {
  id: number;
  class_name: string;
  subject_name?: string;
  topic: string;
};
type CurriculumCoverage = { topic_id: number; status: string };
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
  const [students, setStudents] = useState<Student[]>([]);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [view, setView] = useState<"class" | "teacher">("class");
  const [filter, setFilter] = useState("all");
  const [scheduleExpanded, setScheduleExpanded] = useState(true);
  const [parsingImport, setParsingImport] = useState(false);

  const [topics, setTopics] = useState<CurriculumTopic[]>([]);
  const [coverage, setCoverage] = useState<CurriculumCoverage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  const runWorkloadOptimizer = async () => {
    setAiLoading(true);
    setAiOpen(true);
    try {
      const res = await generateSchoolAdminIntelligenceDb({
        data: { token: getAdminToken(), schoolCode: getSchoolCode(), workflow: "workload_optimizer" },
      });
      setAiOutput(res.output);
    } catch (err) {
      toast.error("Failed to run workload optimiser", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAcademicOperationsDb({ data: { token: getAdminToken(), schoolCode: getSchoolCode() } });
      setTeachers(data.teachers as unknown as Teacher[]);
      setSubjects(data.subjects as unknown as Subject[]);
      setStudents(data.students as unknown as Student[]);
      setEntries(data.timetable as unknown as Entry[]);
      setTopics((data.topics || []) as unknown as CurriculumTopic[]);
      setCoverage((data.coverage || []) as unknown as CurriculumCoverage[]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load timetable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const classes = useMemo(() => {
    const names = [
      ...entries.map((entry) => entry.class_name),
      ...students.map((student) => student.class_name),
    ].filter(Boolean);
    return [...new Set(names)].sort();
  }, [entries, students]);
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
          token: getAdminToken(),
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
      setEditorOpen(false);
      await load();
    } catch (error) {
      toast.error("Entry could not be saved", {
        description: error instanceof Error ? error.message : "Check for a timetable conflict.",
      });
    } finally {
      setSaving(false);
    }
  };

  const edit = (entry: Entry) => {
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
    setEditorOpen(true);
  };

  const openNewEntry = () => {
    setForm({ ...emptyForm, className: filter !== "all" && view === "class" ? filter : "" });
    setEditorOpen(true);
  };

  const remove = async (id: number) => {
    await deleteTimetableEntryDb({ data: { token: getAdminToken(), schoolCode: getSchoolCode(), id } });
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
          token: getAdminToken(),
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

  const importSchedule = async (file?: File) => {
    if (!file) return;
    setParsingImport(true);
    try {
      const rows = file.name.toLowerCase().endsWith(".docx")
        ? (
            await parseBulkDocxDb({
              data: { base64: await fileToDataUrl(file), expectedColumns: 10 },
            })
          ).rows
        : parseCsvRows(await file.text());
      const dataRows = rows.filter(
        (row, index) =>
          !(
            index === 0 &&
            row[0]?.toLowerCase().includes("day") &&
            row[1]?.toLowerCase().includes("period")
          ),
      );
      const imported = dataRows.map((row) => {
        const [day, period, className, type, subject, teacher, room, startsAt, endsAt, title] =
          row.map((value) => value.trim());
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
      const result = await bulkImportTimetableDb({
        data: { token: getAdminToken(), schoolCode: getSchoolCode(), entries: imported },
      });
      toast.success(
        `${result.imported} timetable entries imported from ${file.name.endsWith(".docx") ? "Word" : "CSV"}`,
      );
      await load();
    } catch (error) {
      toast.error("Import stopped", {
        description:
          error instanceof Error ? error.message : "Review the template format and conflicts.",
      });
    } finally {
      setParsingImport(false);
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
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button className="col-span-2 sm:order-last sm:col-span-1" onClick={openNewEntry}>
            <Plus className="mr-2 h-4 w-4" /> Add timetable entry
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <Button variant="outline" asChild>
            <label>
              <Upload className="mr-2 h-4 w-4" />
              {parsingImport ? "Reading…" : "Import file"}
              <input
                type="file"
                accept=".csv,.docx"
                className="hidden"
                disabled={parsingImport}
                onChange={(event) => importSchedule(event.target.files?.[0])}
              />
            </label>
          </Button>
          <Button variant="outline" asChild>
            <a
              href="data:text/csv;charset=utf-8,day%2Cperiod%2Cclass%2Ctype%2Csubject%2Cteacher%2Croom%2Cstart%2Cend%2Ctitle%0AMonday%2C1%2CJSS%201%2CLesson%2CMathematics%2CJane%20Doe%2CRoom%201%2C08%3A00%2C08%3A40%2C"
              download="icademia-timetable-template.csv"
            >
              <Download className="mr-2 h-4 w-4" /> CSV template
            </a>
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              void downloadDocxTemplate(
                "icademia-timetable-template.docx",
                "iCademia Timetable Import Template",
                [
                  "Day",
                  "Period",
                  "Class",
                  "Type",
                  "Subject",
                  "Teacher",
                  "Room",
                  "Start",
                  "End",
                  "Title",
                ],
                [
                  [
                    "Monday",
                    "1",
                    "JSS 1 Gold",
                    "Lesson",
                    "Mathematics",
                    "Jane Doe",
                    "Room 1",
                    "08:00",
                    "08:40",
                    "",
                  ],
                ],
              )
            }
          >
            <FileText className="mr-2 h-4 w-4" /> Word template
          </Button>
        </div>
      </header>

      <div className="grid gap-3 print:hidden sm:grid-cols-3">
        <SummaryCard label="Scheduled periods" value={entries.length} icon={CalendarDays} />
        <SummaryCard label="Classes on timetable" value={classes.length} icon={UsersRound} />
        <SummaryCard
          label="Head Teachers scheduled"
          value={workload.filter((teacher) => teacher.periods > 0).length}
          icon={Clock3}
        />
      </div>

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) setForm(emptyForm);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit timetable entry" : "Add timetable entry"}</DialogTitle>
            <DialogDescription>
              Choose the class and time first. iCademia checks teacher, class and room conflicts
              before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Entry type"
              value={form.entryType}
              onChange={(value) => setForm({ ...form, entryType: value as Entry["entry_type"] })}
              options={["Lesson", "Break", "Assembly", "Activity"].map((item) => [item, item])}
            />
            {classes.length ? (
              <SelectField
                label="Class / group"
                value={form.className}
                onChange={(value) => setForm({ ...form, className: value })}
                options={classes.map((item) => [item, item])}
                placeholder="Select a class"
              />
            ) : (
              <Field
                label="Class / group"
                value={form.className}
                onChange={(value) => setForm({ ...form, className: value })}
                placeholder="JSS 1 Gold"
              />
            )}
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
            {form.entryType === "Lesson" && (
              <>
                <SelectField
                  label="Head Teacher"
                  value={form.teacherId}
                  onChange={(value) => setForm({ ...form, teacherId: value })}
                  options={[
                    ["none", "Select Head Teacher"],
                    ...teachers.map((item) => [String(item.id), item.name]),
                  ]}
                />
                <SelectField
                  label="Subject"
                  value={form.subjectId}
                  onChange={(value) => setForm({ ...form, subjectId: value })}
                  options={[
                    ["none", "Select subject"],
                    ...subjects.map((item) => [String(item.id), item.name]),
                  ]}
                />
              </>
            )}
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
              label="Room (optional)"
              value={form.room}
              onChange={(value) => setForm({ ...form, room: value })}
              placeholder="Room 4"
            />
            <Field
              label="Display title (optional)"
              value={form.title}
              onChange={(value) => setForm({ ...form, title: value })}
              placeholder={
                form.entryType === "Lesson"
                  ? "Uses the subject name by default"
                  : "Morning assembly"
              }
            />
          </div>
          <div className="mt-2 grid gap-2 sm:flex sm:justify-end">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={
                saving ||
                !form.className ||
                (form.entryType === "Lesson" &&
                  (form.teacherId === "none" || form.subjectId === "none"))
              }
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {form.id ? "Save changes" : "Add to timetable"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="grid gap-3 border-border p-4 shadow-card print:hidden sm:grid-cols-[11rem_minmax(0,16rem)_1fr] sm:items-end">
        <Select
          value={view}
          onValueChange={(value) => {
            setView(value as "class" | "teacher");
            setFilter("all");
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="class">Class timetable</SelectItem>
            <SelectItem value="teacher">Teacher timetable</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full">
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
        <p className="text-xs leading-5 text-muted-foreground sm:pb-2">
          {filter === "all"
            ? `Showing all ${visibleEntries.length} scheduled entries.`
            : `Showing ${visibleEntries.length} entries for the selected ${view}.`}
        </p>
      </Card>

      <div className="flex items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="font-display text-lg font-semibold">Weekly schedule</h2>
          <p className="text-xs text-muted-foreground">
            Collapse the schedule when you only need workload or import controls.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setScheduleExpanded((expanded) => !expanded)}
          aria-expanded={scheduleExpanded}
        >
          {scheduleExpanded ? (
            <ChevronUp className="mr-2 h-4 w-4" />
          ) : (
            <ChevronDown className="mr-2 h-4 w-4" />
          )}
          {scheduleExpanded ? "Collapse timetable" : "Expand timetable"}
        </Button>
      </div>

      <div className={scheduleExpanded ? "contents" : "hidden print:contents"}>
        <Card className="hidden overflow-x-auto border-border shadow-card md:block">
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
                      (entry) =>
                        entry.day_of_week === dayIndex + 1 && entry.period_number === period,
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
                                    coverage.some(
                                      (c) => c.topic_id === t.id && c.status === "Completed",
                                    ),
                                  );
                                  const percent = classSubjectTopics.length
                                    ? Math.round(
                                        (completed.length / classSubjectTopics.length) * 100,
                                      )
                                    : 0;
                                  const next = classSubjectTopics.find(
                                    (t) =>
                                      !coverage.some(
                                        (c) => c.topic_id === t.id && c.status === "Completed",
                                      ),
                                  );

                                  return (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-muted-foreground">
                                        <span>Syllabus</span>
                                        <span className="font-semibold text-primary">
                                          {percent}%
                                        </span>
                                      </div>
                                      <div className="h-1 w-full overflow-hidden rounded-full bg-primary/10">
                                        <div
                                          className="h-full rounded-full bg-primary transition-all"
                                          style={{ width: `${percent}%` }}
                                        />
                                      </div>
                                      {next ? (
                                        <p className="truncate text-muted-foreground">
                                          Next:{" "}
                                          <span className="font-medium text-foreground">
                                            {next.topic}
                                          </span>
                                        </p>
                                      ) : classSubjectTopics.length > 0 ? (
                                        <p className="text-success font-medium">Syllabus Done 🎉</p>
                                      ) : (
                                        <p className="text-muted-foreground italic">
                                          No topics defined
                                        </p>
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

        <div className="space-y-4 md:hidden print:hidden">
          {days.map((day, dayIndex) => {
            const dayEntries = visibleEntries
              .filter((entry) => entry.day_of_week === dayIndex + 1)
              .sort((a, b) => a.period_number - b.period_number);
            return (
              <Card key={day} className="overflow-hidden border-border shadow-card">
                <div className="flex items-center justify-between border-b border-border bg-[#071a2e] px-4 py-3 text-white">
                  <h2 className="font-display font-semibold">{day}</h2>
                  <span className="text-xs text-white/60">
                    {dayEntries.length} {dayEntries.length === 1 ? "entry" : "entries"}
                  </span>
                </div>
                {dayEntries.length === 0 ? (
                  <p className="px-4 py-5 text-sm text-muted-foreground">Nothing scheduled.</p>
                ) : (
                  <div className="divide-y divide-border">
                    {dayEntries.map((entry) => (
                      <div key={entry.id} className="flex gap-3 p-4">
                        <div className="w-16 shrink-0">
                          <p className="text-xs font-semibold text-primary">
                            Period {entry.period_number}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {entry.starts_at?.slice(0, 5) || "Time unset"}
                          </p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold">
                            {entry.title || entry.subject_name || entry.entry_type}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            {entry.class_name}
                            {entry.teacher_name ? ` · ${entry.teacher_name}` : ""}
                            {entry.room ? ` · ${entry.room}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => edit(entry)}
                            aria-label={`Edit ${entry.title || entry.subject_name || entry.entry_type}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(entry.id)}
                            aria-label={`Delete ${entry.title || entry.subject_name || entry.entry_type}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="border-border p-5 shadow-card print:hidden">
        <div className="grid gap-4 border-b border-border pb-3 sm:flex sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <UsersRound className="h-5 w-5 text-primary" /> Teacher workload summary
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={runWorkloadOptimizer}
            disabled={aiLoading}
            className="w-full border-primary/20 text-foreground/80 hover:border-primary/50 sm:w-auto"
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
                {teacher.staff_id ? `${teacher.staff_id} · ` : ""}
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
              AI Workload Optimisation Report
            </DialogTitle>
          </DialogHeader>
          <div className="mt-3 max-h-[60vh] overflow-y-auto rounded-xl border border-border bg-muted/30 p-5 text-sm leading-relaxed">
            {aiLoading ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span>Analysing timetable entries and staff period allocation...</span>
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
            <div className="grid w-full gap-2 sm:flex sm:justify-end">
              {workload[0]?.periods > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setView("teacher");
                    setFilter(String(workload[0].id));
                    setAiOpen(false);
                  }}
                >
                  Review {workload[0].name}&apos;s timetable
                </Button>
              ) : null}
              <Button asChild variant="outline">
                <Link to="/dashboard/teachers">Manage Head Teachers</Link>
              </Button>
              <Button type="button" onClick={() => setAiOpen(false)}>
                Done
              </Button>
            </div>
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[][];
  placeholder?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-2">
          <SelectValue placeholder={placeholder} />
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

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="flex items-center gap-4 border-border p-4 shadow-card">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-display text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Card>
  );
}
