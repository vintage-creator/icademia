import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  BookOpenCheck,
  ClipboardList,
  Loader2,
  Save,
  ShieldCheck,
  UserRoundCheck,
  Sparkles,
  Zap,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Star,
  Layers,
  LayoutGrid,
  Users,
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
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  getAcademicOperationsDb,
  saveAcademicOperationDb,
  generateSchoolAdminIntelligenceDb,
  saveBatchAttendanceDb,
  bulkAddObservationsDb,
} from "@/lib/api/db.functions";
import { FormattedAiOutput } from "@/components/formatted-ai-output";
import { getSchoolCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/records")({
  head: () => ({ meta: [{ title: "Academic Records — iCademia" }] }),
  component: AcademicRecordsPage,
});

type RecordType =
  | "attendance"
  | "curriculum"
  | "coverage"
  | "intervention"
  | "observation"
  | "lifecycle"
  | "compliance"
  | "availability";

type Student = { id: number; name: string; registration_number: string; class_name: string };
type Teacher = { id: number; name: string };
type Subject = { id: number; name: string };
type Topic = { id: number; topic: string; class_name: string; subject_name?: string; subject_id?: number };
type Operations = {
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  topics: Topic[];
  coverage: Array<Record<string, unknown>>;
  availability: Array<Record<string, unknown>>;
  attendance: Array<Record<string, unknown>>;
  interventions: Array<Record<string, unknown>>;
  guardians: Array<Record<string, unknown>>;
  observations: Array<Record<string, unknown>>;
  lifecycle: Array<Record<string, unknown>>;
  compliance: Array<Record<string, unknown>>;
};

const initial = {
  studentId: "",
  teacherId: "",
  subjectId: "",
  topicId: "",
  date: new Date().toISOString().slice(0, 10),
  status: "Present",
  note: "",
  className: "",
  term: "First",
  session: "2026/2027",
  topic: "",
  sequence: "1",
  expectedBy: "",
  percentage: "0",
  evidenceUrl: "",
  title: "",
  ownerRole: "Subject Teacher",
  baseline: "40",
  target: "75",
  reviewOn: "",
  name: "",
  relationship: "Parent",
  email: "",
  phone: "",
  channel: "Email",
  consent: true,
  emergency: true,
  category: "Participation",
  rating: "5",
  eventType: "Admission",
  reason: "Regular admission",
  destination: "",
  authority: "Ministry of Education",
  requirementType: "Inspection",
  dueDate: "",
  inspectionStart: "",
  inspectionEnd: "",
  dayOfWeek: "1",
  periodNumber: "1",
  isAvailable: false,
};

const types: Array<[RecordType, string, string, string]> = [
  ["attendance", "Daily attendance", "Record presence, absence, lateness and leave in class batches.", "Class presence & registers"],
  ["curriculum", "Curriculum topics", "Define syllabus topics each class must cover for a term.", "Term syllabus & topics"],
  ["coverage", "Topic completion", "Record topic completion %, status, evidence and teacher notes.", "Coverage %, status & evidence"],
  ["intervention", "Interventions", "Assign learning actions, owners, target baseline %, and review dates.", "Learning actions & targets"],
  ["observation", "Engagement observations", "Capture factual participation or behavioural observations with 5-star rating.", "5-star student ratings"],
  ["lifecycle", "Admissions & retention", "Record student admissions, transfers, withdrawals and graduation milestones.", "Admissions, transfers & exits"],
  ["compliance", "Compliance & inspections", "Track regulatory requirements, inspection periods, evidence and lead owners.", "Audits & regulatory checks"],
  ["availability", "Teacher availability", "Manage weekly period availability matrix for teachers.", "Weekly timetable matrix"],
];

function RecentRecordCard({ type, item, data }: { type: RecordType; item: any; data: Operations }) {
  const fmt = (v: unknown): string => {
    if (v == null) return "—";
    if (v instanceof Date) return v.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    return String(v);
  };

  if (type === "attendance") {
    const student = data.students.find((s) => s.id === item.student_id);
    const badgeColor =
      item.status === "Present"
        ? "bg-success/10 text-success border-success/20"
        : item.status === "Absent"
          ? "bg-destructive/10 text-destructive border-destructive/20"
          : "bg-warning/10 text-warning-foreground border-warning/20";
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border p-3.5 sm:p-4 shadow-card bg-card w-full">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-sm truncate">{student?.name || `Student #${item.student_id}`}</p>
            <p className="text-xs text-muted-foreground truncate">
              {student?.class_name} · Date: {fmt(item.attendance_date || item.date)}
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider border shrink-0 ${badgeColor}`}>
            {item.status}
          </span>
        </div>
        {item.note && <p className="text-xs text-foreground/80 mt-1 italic break-words">"{item.note}"</p>}
      </div>
    );
  }

  if (type === "curriculum") {
    const subject = data.subjects.find((s) => s.id === item.subject_id);
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border p-3.5 sm:p-4 shadow-card bg-card w-full">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-sm break-words">{item.sequence_number ? `Week ${item.sequence_number}: ` : ""}{item.topic}</p>
            <p className="text-xs text-muted-foreground break-words">
              {item.subject_name || subject?.name || "Subject"} · {item.class_name} · {item.term} Term ({item.session || "2026/2027"})
            </p>
          </div>
          {item.expected_by && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary shrink-0">
              Target: {fmt(item.expected_by)}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (type === "coverage") {
    const topic = data.topics.find((t) => t.id === item.topic_id);
    const teacher = data.teachers.find((t) => t.id === item.teacher_id);
    const badgeColor =
      item.status === "Completed"
        ? "bg-success/10 text-success border-success/20"
        : item.status === "Reteaching required"
          ? "bg-warning/10 text-warning-foreground border-warning/20"
          : "bg-muted text-muted-foreground border-border";
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border p-3.5 sm:p-4 shadow-card bg-card w-full">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-sm break-words">{topic?.topic || item.topic || "Topic"}</p>
            <p className="text-xs text-muted-foreground break-words">
              {topic?.subject_name || "Subject"} · {topic?.class_name || "Class"}
            </p>
            {teacher && <p className="text-xs text-muted-foreground">Teacher: <strong className="text-foreground">{teacher.name}</strong></p>}
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider border shrink-0 ${badgeColor}`}>
            {item.status}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Coverage Progress</span>
            <span className="font-semibold text-foreground">{item.percentage || item.coverage_percent || 0}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${item.percentage || item.coverage_percent || 0}%` }}
            />
          </div>
        </div>
        {item.evidence_url && (
          <p className="text-xs text-primary underline truncate">Evidence: {item.evidence_url}</p>
        )}
        {item.note && <p className="text-xs text-foreground/80 mt-1 italic break-words">"{item.note}"</p>}
      </div>
    );
  }

  if (type === "intervention") {
    const student = data.students.find((s) => s.id === item.student_id);
    const badgeColor =
      item.status === "Completed" || item.status === "Closed"
        ? "bg-success/10 text-success border-success/20"
        : item.overdue
          ? "bg-destructive/10 text-destructive animate-pulse border-destructive/20"
          : "bg-warning/10 text-warning-foreground border-warning/20";
    return (
      <div className="flex flex-col gap-3 rounded-xl border border-border p-3.5 sm:p-4 shadow-card bg-card w-full">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-sm break-words">{item.title}</p>
            <p className="text-xs text-muted-foreground break-words">
              Student: <strong className="text-foreground">{item.student_name || student?.name || "Student"}</strong> ({item.class_name || student?.class_name})
            </p>
            {item.subject && <p className="text-xs text-muted-foreground">Subject: <span className="font-medium text-foreground">{item.subject}</span></p>}
            <p className="text-xs text-muted-foreground">
              Lead Owner: <span className="font-medium text-foreground">{item.owner_role || item.ownerRole}</span>
            </p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider border shrink-0 ${badgeColor}`}>
            {item.status || "Active"} {item.overdue ? "· Overdue" : ""}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs border-t border-border pt-2 mt-1 bg-muted/20 p-2 rounded-lg">
          <div><span className="text-muted-foreground">Baseline:</span> <strong>{item.baseline || item.baseline_value || 0}%</strong></div>
          <div><span className="text-muted-foreground">Target:</span> <strong className="text-primary">{item.target || item.target_value || 0}%</strong></div>
          <div><span className="text-muted-foreground">Start:</span> {fmt(item.starts_on || item.startsOn)}</div>
          <div><span className="text-muted-foreground">Review:</span> {fmt(item.review_on || item.reviewOn)}</div>
        </div>
        {item.rationale && <p className="text-xs text-foreground/80 mt-1 italic break-words">"{item.rationale}"</p>}
      </div>
    );
  }

  if (type === "observation") {
    const student = data.students.find((s) => s.id === item.student_id);
    const rating = Number(item.rating || 5);
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border p-3.5 sm:p-4 shadow-card bg-card w-full">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-sm truncate">{item.student_name || student?.name}</p>
            <p className="text-xs text-muted-foreground break-words">
              Category: <strong className="text-foreground">{fmt(item.category)}</strong> · Date: {fmt(item.observation_date || item.date)}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
            <span>{rating} / 5</span>
          </div>
        </div>
        {item.note && <p className="text-xs text-foreground/80 mt-1 italic break-words">"{item.note}"</p>}
      </div>
    );
  }

  if (type === "lifecycle") {
    const student = data.students.find((s) => s.id === item.student_id);
    const badgeColor =
      item.event_type === "Admission" || item.eventType === "Admission"
        ? "bg-success/10 text-success border-success/20"
        : item.event_type === "Withdrawal" || item.eventType === "Withdrawal"
          ? "bg-destructive/10 text-destructive border-destructive/20"
          : "bg-warning/10 text-warning-foreground border-warning/20";
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border p-3.5 sm:p-4 shadow-card bg-card w-full">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-sm truncate">{item.student_name || student?.name}</p>
            <p className="text-xs text-muted-foreground">Event Date: {fmt(item.event_date || item.date)}</p>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider border shrink-0 ${badgeColor}`}>
            {item.event_type || item.eventType}
          </span>
        </div>
        <div className="text-xs space-y-1 mt-1 border-t border-border pt-2">
          {item.reason && <p className="break-words"><span className="text-muted-foreground">Reason:</span> <strong className="text-foreground">{item.reason}</strong></p>}
          {item.destination && <p className="break-words"><span className="text-muted-foreground">Destination:</span> {item.destination}</p>}
          {item.note && <p className="text-xs text-foreground/80 mt-1 italic break-words">"{item.note}"</p>}
        </div>
      </div>
    );
  }

  if (type === "compliance") {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-border p-3.5 sm:p-4 shadow-card bg-card w-full">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className="font-semibold text-sm break-words">{item.title}</p>
            <p className="text-xs text-muted-foreground break-words">
              Authority: <strong className="text-foreground">{item.authority}</strong> · Type: {item.requirement_type || item.requirementType}
            </p>
            <p className="text-xs text-muted-foreground">
              Lead Owner: <span className="font-medium text-foreground">{item.owner_role || item.ownerRole}</span>
            </p>
          </div>
          {(item.due_date || item.dueDate) && (
            <span className="rounded-full bg-warning/10 text-warning-foreground border border-warning/20 px-2.5 py-0.5 text-[10px] font-bold uppercase shrink-0">
              Due {fmt(item.due_date || item.dueDate)}
            </span>
          )}
        </div>
        <div className="text-xs space-y-1 mt-1 border-t border-border pt-2">
          {(item.inspection_start || item.inspectionStart) && (
            <p className="break-words">
              <span className="text-muted-foreground">Inspection Period:</span>{" "}
              {fmt(item.inspection_start || item.inspectionStart)} to {fmt(item.inspection_end || item.inspectionEnd)}
            </p>
          )}
          {item.note && <p className="text-xs text-foreground/80 mt-1 italic break-words">"{item.note}"</p>}
        </div>
      </div>
    );
  }

  if (type === "availability") {
    const teacher = data.teachers.find((t) => Number(t.id) === Number(item.teacher_id));
    const daysName = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const day = daysName[(item.day_of_week as number) - 1] || `Day ${item.day_of_week}`;
    const isAvail = item.is_available ?? item.isAvailable ?? true;
    const badgeColor = isAvail
      ? "bg-success/10 text-success border-success/20"
      : "bg-destructive/10 text-destructive border-destructive/20";
    return (
      <div className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-border p-3.5 sm:p-4 shadow-card bg-card w-full">
        <div className="space-y-0.5 min-w-0">
          <p className="font-semibold text-sm truncate">{teacher?.name || `Teacher #${item.teacher_id}`}</p>
          <p className="text-xs text-muted-foreground">
            {day} · Period {item.period_number}
          </p>
          {item.note && <p className="text-xs text-foreground/80 mt-1 italic break-words">"{item.note}"</p>}
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider border shrink-0 ${badgeColor}`}>
          {isAvail ? "Available" : "Unavailable"}
        </span>
      </div>
    );
  }

  return null;
}

function AcademicRecordsPage() {
  const [type, setType] = useState<RecordType>("attendance");
  const [data, setData] = useState<Operations | null>(null);
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [mobileGridView, setMobileGridView] = useState(false);

  // Batch Attendance States
  const [attendanceClass, setAttendanceClass] = useState("All");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const [attendanceStatusFilter, setAttendanceStatusFilter] = useState("All");
  const [attendanceMap, setAttendanceMap] = useState<
    Record<number, { status: "Present" | "Absent" | "Late" | "Excused"; note: string }>
  >({});
  const [batchSaving, setBatchSaving] = useState(false);

  // Teacher Availability Matrix State
  const [availTeacherId, setAvailTeacherId] = useState<string>("");

  // AI states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  // Batch Engagement Observation States
  const [obsClass, setObsClass] = useState("All");
  const [obsCategory, setObsCategory] = useState("Participation");
  const [obsDate, setObsDate] = useState(new Date().toISOString().slice(0, 10));
  const [obsMode, setObsMode] = useState<"single" | "batch">("single");
  const [obsMap, setObsMap] = useState<
    Record<number, { rating: number; note: string }>
  >({});

  const schoolCode = getSchoolCode();

  const load = async () => {
    const result = await getAcademicOperationsDb({ data: { schoolCode } });
    setData(result as unknown as Operations);
  };

  useEffect(() => {
    void load();
  }, []);

  const classList = useMemo(() => {
    if (!data?.students) return [];
    return Array.from(new Set(data.students.map((s) => s.class_name))).sort();
  }, [data?.students]);

  // Attendance Students (Class filter + Search query)
  const attendanceStudents = useMemo(() => {
    if (!data?.students) return [];
    let list = data.students;
    if (attendanceClass !== "All") {
      list = list.filter((s) => s.class_name === attendanceClass);
    }
    if (attendanceSearch.trim()) {
      const q = attendanceSearch.toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.registration_number.toLowerCase().includes(q));
    }
    if (attendanceStatusFilter !== "All") {
      list = list.filter((s) => (attendanceMap[s.id]?.status || "Present") === attendanceStatusFilter);
    }
    return list;
  }, [data?.students, attendanceClass, attendanceSearch, attendanceStatusFilter, attendanceMap]);

  const obsStudents = useMemo(() => {
    if (!data?.students || obsClass === "All") return [];
    return data.students.filter((s) => s.class_name === obsClass);
  }, [data?.students, obsClass]);

  // Total enrolled in selected class
  const classEnrolledCount = useMemo(() => {
    if (!data?.students) return 0;
    if (attendanceClass === "All") return data.students.length;
    return data.students.filter((s) => s.class_name === attendanceClass).length;
  }, [data?.students, attendanceClass]);

  // Initialize attendance map for date
  useEffect(() => {
    if (!data?.students) return;
    const initialMap: Record<number, { status: "Present" | "Absent" | "Late" | "Excused"; note: string }> = {};

    data.students.forEach((s) => {
      const existing = data.attendance?.find(
        (a: any) => a.student_id === s.id && (a.attendance_date === attendanceDate || a.date === attendanceDate)
      );
      initialMap[s.id] = {
        status: (existing?.status as any) || "Present",
        note: (existing?.note as any) || "",
      };
    });
    setAttendanceMap(initialMap);
  }, [attendanceDate, data]);

  // Filter recent entries list — MUST be defined BEFORE conditional returns for React Rules of Hooks!
  const recent = useMemo(() => {
    if (!data) return [];
    let list: Array<Record<string, unknown>> = [];
    if (type === "attendance") list = data.attendance;
    else if (type === "intervention") list = data.interventions;
    else if (type === "observation") list = data.observations;
    else if (type === "lifecycle") list = data.lifecycle;
    else if (type === "compliance") list = data.compliance;
    else if (type === "curriculum") list = data.topics;
    else if (type === "coverage") list = data.coverage;
    else if (type === "availability") {
      list = data.availability;
      if (availTeacherId) {
        list = list.filter((a: any) => Number(a.teacher_id) === Number(availTeacherId));
      }
    }
    return list;
  }, [data, type, availTeacherId]);

  const markAllStatus = (status: "Present" | "Absent") => {
    setAttendanceMap((prev) => {
      const next = { ...prev };
      attendanceStudents.forEach((s) => {
        next[s.id] = { ...next[s.id], status };
      });
      return next;
    });
  };

  const setStudentStatus = (studentId: number, status: "Present" | "Absent" | "Late" | "Excused") => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { note: "" }), status },
    }));
  };

  const setStudentNote = (studentId: number, note: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || { status: "Present" }), note },
    }));
  };

  const handleSaveBatchAttendance = async () => {
    if (attendanceStudents.length === 0) return;
    setBatchSaving(true);
    try {
      const records = attendanceStudents.map((s) => ({
        studentId: s.id,
        status: attendanceMap[s.id]?.status || "Present",
        note: attendanceMap[s.id]?.note || undefined,
      }));

      const res = await saveBatchAttendanceDb({
        data: {
          schoolCode,
          date: attendanceDate,
          records,
        },
      });

      toast.success(`Saved register for ${attendanceClass === "All" ? "All Classes" : attendanceClass}`, {
        description: `Updated ${res.count} student attendance records for ${attendanceDate}.`,
      });
      await load();
    } catch (err) {
      toast.error("Failed to save batch attendance", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBatchSaving(false);
    }
  };

  const runContextAi = async (workflow: string) => {
    setAiLoading(true);
    setAiOpen(true);
    try {
      const res = await generateSchoolAdminIntelligenceDb({
        data: { schoolCode: getSchoolCode(), workflow: workflow as any },
      });
      setAiOutput(res.output);
    } catch (err) {
      toast.error("Failed to run AI Assistant", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setAiLoading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const base = { schoolCode };
      if (type === "curriculum") {
        await saveAcademicOperationDb({
          data: {
            ...base,
            record: {
              kind: type,
              subjectId: form.subjectId ? Number(form.subjectId) : null,
              className: form.className,
              term: form.term,
              session: form.session,
              topic: form.topic,
              sequenceNumber: form.sequence ? Number(form.sequence) : undefined,
              expectedBy: form.expectedBy || undefined,
            },
          },
        });
      } else if (type === "coverage") {
        await saveAcademicOperationDb({
          data: {
            ...base,
            record: {
              kind: type,
              topicId: Number(form.topicId),
              teacherId: form.teacherId ? Number(form.teacherId) : null,
              status: form.status as "Not started",
              percentage: Number(form.percentage),
              evidenceUrl: form.evidenceUrl,
              note: form.note,
            },
          },
        });
      } else if (type === "intervention") {
        const studentObj = data?.students.find(s => String(s.id) === form.studentId);
        await saveAcademicOperationDb({
          data: {
            ...base,
            record: {
              kind: type,
              studentId: form.studentId ? Number(form.studentId) : null,
              className: studentObj?.class_name || form.className,
              subject: data?.subjects.find((item) => String(item.id) === form.subjectId)?.name,
              title: form.title,
              rationale: form.note,
              ownerRole: form.ownerRole,
              baseline: form.baseline ? Number(form.baseline) : undefined,
              target: form.target ? Number(form.target) : undefined,
              startsOn: form.date,
              reviewOn: form.reviewOn || undefined,
            },
          },
        });
      } else if (type === "observation") {
        await saveAcademicOperationDb({
          data: {
            ...base,
            record: {
              kind: type,
              studentId: Number(form.studentId),
              date: form.date,
              category: form.category,
              rating: Number(form.rating),
              note: form.note,
            },
          },
        });
      } else if (type === "lifecycle") {
        await saveAcademicOperationDb({
          data: {
            ...base,
            record: {
              kind: type,
              studentId: Number(form.studentId),
              eventType: form.eventType as "Admission",
              date: form.date,
              reason: form.reason,
              destination: form.destination,
              note: form.note,
            },
          },
        });
      } else if (type === "compliance") {
        await saveAcademicOperationDb({
          data: {
            ...base,
            record: {
              kind: type,
              title: form.title,
              authority: form.authority,
              requirementType: form.requirementType,
              dueDate: form.dueDate || undefined,
              inspectionStart: form.inspectionStart || undefined,
              inspectionEnd: form.inspectionEnd || undefined,
              ownerRole: form.ownerRole,
              note: form.note,
            },
          },
        });
      } else if (type === "availability") {
        await saveAcademicOperationDb({
          data: {
            ...base,
            record: {
              kind: type,
              teacherId: Number(form.teacherId),
              dayOfWeek: Number(form.dayOfWeek),
              periodNumber: Number(form.periodNumber),
              isAvailable: form.isAvailable,
              note: form.note,
            },
          },
        });
      }
      toast.success("Record saved successfully");
      setForm(initial);
      await load();
    } catch (error) {
      toast.error("Record could not be saved", {
        description: error instanceof Error ? error.message : "Review the required information.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBatchObservations = async () => {
    if (obsStudents.length === 0) {
      toast.error("No students found in the selected class section.");
      return;
    }
    setSaving(true);
    try {
      const payload = obsStudents.map((s) => {
        const custom = obsMap[s.id] || { rating: 5, note: "Satisfactory participation and conduct." };
        return {
          studentId: s.id,
          date: obsDate,
          category: obsCategory,
          rating: custom.rating,
          note: custom.note || "Satisfactory participation and conduct.",
        };
      });

      await bulkAddObservationsDb({
        data: {
          schoolCode,
          observations: payload,
        },
      });

      toast.success("Batch observations recorded successfully!", {
        description: `Successfully logged observations for ${payload.length} students.`,
      });
      setObsMap({});
      void load();
    } catch (err) {
      toast.error("Failed to record batch observations", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!data)
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    );

  const selectedType = types.find((item) => item[0] === type)!;

  const typeToWorkflow: Record<RecordType, string | null> = {
    attendance: null,
    curriculum: "curriculum_coverage",
    coverage: "curriculum_coverage",
    intervention: "intervention_tracker",
    observation: null,
    lifecycle: "retention_intelligence",
    compliance: "compliance_assistant",
    availability: null,
  };

  // Attendance Stats calculation for selected class roster
  const totalRosterCount = attendanceStudents.length;
  const presentCount = attendanceStudents.filter((s) => (attendanceMap[s.id]?.status || "Present") === "Present").length;
  const absentCount = attendanceStudents.filter((s) => attendanceMap[s.id]?.status === "Absent").length;
  const lateCount = attendanceStudents.filter((s) => attendanceMap[s.id]?.status === "Late").length;
  const excusedCount = attendanceStudents.filter((s) => attendanceMap[s.id]?.status === "Excused").length;
  const attendanceRate = totalRosterCount > 0 ? Math.round((presentCount / totalRosterCount) * 100) : 0;

  return (
    <div className="space-y-6 p-3 sm:p-6 lg:p-8 w-full max-w-full">
      <header>
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-primary">
          Structured school data
        </p>
        <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold break-words">Academic operations records</h1>
        <p className="mt-1.5 max-w-3xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Capture attendance registers, curriculum coverage, student interventions, observations and school compliance.
        </p>
      </header>

      {/* ══ MOBILE & TABLET NATIVE SECTION SELECTOR ════════════════════════ */}
      <div className="xl:hidden space-y-3">
        <Card className="border-border p-3.5 shadow-card bg-card">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <Label className="text-xs uppercase tracking-wider text-primary font-bold">Record Operations Section</Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMobileGridView(!mobileGridView)}
              className="h-7 px-2 text-[11px] gap-1 text-muted-foreground"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {mobileGridView ? "Use Dropdown" : "Card Grid"}
            </Button>
          </div>

          {!mobileGridView ? (
            <Select value={type} onValueChange={(val) => setType(val as RecordType)}>
              <SelectTrigger className="w-full h-11 text-xs font-semibold bg-background border-primary/30 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[340px]">
                {types.map(([val, label, _desc, abridged]) => (
                  <SelectItem key={val} value={val} className="py-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-bold text-xs text-foreground truncate">{label}</span>
                      <span className="text-[10px] text-muted-foreground truncate">{abridged}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="grid grid-cols-2 gap-2 pt-1">
              {types.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setType(value);
                    setMobileGridView(false);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition ${
                    type === value
                      ? "bg-primary text-primary-foreground font-bold border-primary shadow-sm"
                      : "bg-muted/30 hover:bg-muted text-foreground border-border"
                  }`}
                >
                  <p className="text-xs font-semibold leading-tight">{label}</p>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_1fr] w-full max-w-full">
        {/* DESKTOP VERTICAL SIDEBAR (hidden on mobile/tablet) */}
        <Card className="hidden xl:flex h-fit border-border p-3 shadow-card flex-col gap-1 shrink-0 w-full">
          {types.map(([value, label, description]) => (
            <button
              key={value}
              onClick={() => setType(value)}
              className={`w-full rounded-xl p-3 text-left transition ${type === value ? "bg-primary text-primary-foreground shadow-sm font-medium" : "bg-muted/30 hover:bg-muted text-foreground"}`}
            >
              <p className="text-sm font-semibold leading-tight">{label}</p>
              <p
                className={`mt-1 text-xs leading-relaxed ${type === value ? "text-primary-foreground/80" : "text-muted-foreground"}`}
              >
                {description}
              </p>
            </button>
          ))}
        </Card>

        {/* MAIN OPERATIONS WORKSPACE */}
        <div className="space-y-6 min-w-0 w-full">
          <Card className="border-border p-4 sm:p-6 shadow-card w-full">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                {type === "curriculum" || type === "coverage" ? (
                  <BookOpenCheck className="h-5 w-5" />
                ) : type === "compliance" ? (
                  <ShieldCheck className="h-5 w-5" />
                ) : type === "attendance" ? (
                  <UserRoundCheck className="h-5 w-5" />
                ) : (
                  <ClipboardList className="h-5 w-5" />
                )}
              </span>
              <div className="flex flex-1 flex-wrap items-start justify-between gap-3 min-w-0">
                <div className="min-w-0">
                  <h2 className="font-display text-lg sm:text-xl font-semibold break-words">{selectedType[1]}</h2>
                  <p className="mt-0.5 text-xs sm:text-sm text-muted-foreground">{selectedType[2]}</p>
                </div>
                {typeToWorkflow[type] && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-primary/20 hover:border-primary/50 text-foreground/80 shrink-0"
                    onClick={() => runContextAi(typeToWorkflow[type]!)}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
                    )}
                    AI Insights
                  </Button>
                )}
              </div>
            </div>

            {/* ══ BATCH ATTENDANCE MARKER UX ════════════════════════════════════ */}
            {type === "attendance" ? (
              <div className="mt-6 space-y-5 w-full">
                {/* Control Bar */}
                <div className="grid gap-3 bg-muted/30 p-3 sm:p-4 rounded-xl border border-border w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex-1 sm:flex-none">
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Select Class</Label>
                        <Select value={attendanceClass} onValueChange={setAttendanceClass}>
                          <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs mt-1">
                            <SelectValue placeholder="All Classes" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Classes ({data.students.length})</SelectItem>
                            {classList.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c} ({data.students.filter((s) => s.class_name === c).length})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1 sm:flex-none">
                        <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Attendance Date</Label>
                        <Input
                          type="date"
                          value={attendanceDate}
                          onChange={(e) => setAttendanceDate(e.target.value)}
                          className="h-9 text-xs mt-1 w-full sm:w-[150px]"
                        />
                      </div>
                    </div>

                    {/* 1-Click Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => markAllStatus("Present")}
                        className="h-9 text-xs border-success/30 text-success hover:bg-success/10 gap-1.5 flex-1 sm:flex-none"
                      >
                        <Zap className="h-3.5 w-3.5" /> Mark All Present
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => markAllStatus("Absent")}
                        className="h-9 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 gap-1.5 flex-1 sm:flex-none"
                      >
                        Mark All Absent
                      </Button>
                      <Button
                        type="button"
                        disabled={batchSaving || attendanceStudents.length === 0}
                        onClick={handleSaveBatchAttendance}
                        className="gradient-primary text-primary-foreground h-9 text-xs gap-1.5 shadow-elegant w-full sm:w-auto"
                      >
                        {batchSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save Register ({attendanceClass === "All" ? "All" : attendanceClass} · {classEnrolledCount})
                      </Button>
                    </div>
                  </div>

                  {/* Filter & Search In Table */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-border/50">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Search student name or reg number..."
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        className="pl-8 h-8 text-xs bg-background w-full"
                      />
                    </div>
                    <div className="flex items-center gap-1 text-xs overflow-x-auto pb-1 sm:pb-0">
                      <span className="text-[11px] text-muted-foreground mr-1 shrink-0">Filter Status:</span>
                      {(["All", "Present", "Absent", "Late", "Excused"] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setAttendanceStatusFilter(st)}
                          className={`px-2 py-0.5 rounded text-[11px] border shrink-0 ${
                            attendanceStatusFilter === st
                              ? "bg-primary text-primary-foreground font-semibold border-primary"
                              : "bg-background text-muted-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Stats Summary Banner */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                  <div className="rounded-xl border border-success/30 bg-success/5 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-success">Present</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">{presentCount}</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-success opacity-80" />
                  </div>
                  <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-destructive">Absent</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">{absentCount}</p>
                    </div>
                    <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive opacity-80" />
                  </div>
                  <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-warning-foreground">Late / Excused</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">{lateCount + excusedCount}</p>
                    </div>
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-warning-foreground opacity-80" />
                  </div>
                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-primary">Attendance Rate</p>
                      <p className="text-lg sm:text-xl font-bold text-foreground">{attendanceRate}%</p>
                    </div>
                    <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full">{attendanceRate}%</span>
                  </div>
                </div>

                {/* Interactive Roster Table Container */}
                <div className="rounded-xl border border-border overflow-hidden w-full max-w-full">
                  <div className="max-h-[500px] overflow-y-auto overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[650px]">
                      <thead className="sticky top-0 bg-muted border-b border-border uppercase tracking-wider text-[10px] text-muted-foreground font-semibold z-10">
                        <tr>
                          <th className="py-3 px-3 sm:px-4">#</th>
                          <th className="py-3 px-3 sm:px-4">Student Name</th>
                          <th className="py-3 px-3 sm:px-4">Reg No</th>
                          <th className="py-3 px-3 sm:px-4">Class</th>
                          <th className="py-3 px-3 sm:px-4">Attendance Status</th>
                          <th className="py-3 px-3 sm:px-4">Note / Remark</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-card">
                        {attendanceStudents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-muted-foreground">
                              No students found matching your filters.
                            </td>
                          </tr>
                        ) : (
                          attendanceStudents.map((s, idx) => {
                            const curStatus = attendanceMap[s.id]?.status || "Present";
                            const curNote = attendanceMap[s.id]?.note || "";

                            return (
                              <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                                <td className="py-2.5 px-3 sm:px-4 font-mono text-muted-foreground">{idx + 1}</td>
                                <td className="py-2.5 px-3 sm:px-4 font-semibold text-foreground">{s.name}</td>
                                <td className="py-2.5 px-3 sm:px-4 font-mono text-muted-foreground text-[11px]">{s.registration_number}</td>
                                <td className="py-2.5 px-3 sm:px-4">
                                  <span className="rounded-full bg-muted px-2 py-0.5 font-medium">{s.class_name}</span>
                                </td>
                                <td className="py-2.5 px-3 sm:px-4">
                                  <div className="flex flex-wrap gap-1">
                                    {(["Present", "Absent", "Late", "Excused"] as const).map((st) => {
                                      const isSel = curStatus === st;
                                      const cls =
                                        st === "Present"
                                          ? isSel
                                            ? "bg-success text-success-foreground font-bold shadow-sm"
                                            : "hover:bg-success/10 text-muted-foreground"
                                          : st === "Absent"
                                          ? isSel
                                            ? "bg-destructive text-destructive-foreground font-bold shadow-sm"
                                            : "hover:bg-destructive/10 text-muted-foreground"
                                          : st === "Late"
                                          ? isSel
                                            ? "bg-warning text-warning-foreground font-bold shadow-sm"
                                            : "hover:bg-warning/10 text-muted-foreground"
                                          : isSel
                                          ? "bg-primary text-primary-foreground font-bold shadow-sm"
                                          : "hover:bg-primary/10 text-muted-foreground";

                                      return (
                                        <button
                                          key={st}
                                          type="button"
                                          onClick={() => setStudentStatus(s.id, st)}
                                          className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[10px] sm:text-[11px] transition-all border border-border/50 ${cls}`}
                                        >
                                          {st}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 sm:px-4">
                                  <Input
                                    value={curNote}
                                    onChange={(e) => setStudentNote(s.id, e.target.value)}
                                    placeholder={curStatus === "Absent" ? "e.g. Sick bay" : curStatus === "Late" ? "e.g. Arrived 8:30am" : "Optional note"}
                                    className="h-8 text-xs max-w-[180px]"
                                  />
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    disabled={batchSaving || attendanceStudents.length === 0}
                    onClick={handleSaveBatchAttendance}
                    className="gradient-primary text-primary-foreground shadow-elegant gap-2 w-full sm:w-auto"
                  >
                    {batchSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Attendance Register ({attendanceClass === "All" ? "All" : attendanceClass} · {classEnrolledCount})
                  </Button>
                </div>
              </div>
            ) : type === "curriculum" ? (
              /* ══ CURRICULUM TOPICS FORM ════════════════════════════════════════ */
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Class *</Label>
                    <Select value={form.className} onValueChange={(val) => setForm({ ...form, className: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select class" /></SelectTrigger>
                      <SelectContent>
                        {classList.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Subject *</Label>
                    <Select value={form.subjectId} onValueChange={(val) => setForm({ ...form, subjectId: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {data.subjects.map((sub) => (
                          <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Topic Title *</Label>
                    <Input
                      value={form.topic}
                      onChange={(e) => setForm({ ...form, topic: e.target.value })}
                      placeholder="e.g. Algebraic Processes & Factorisation"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Academic Term</Label>
                    <Select value={form.term} onValueChange={(val) => setForm({ ...form, term: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="First">First Term</SelectItem>
                        <SelectItem value="Second">Second Term</SelectItem>
                        <SelectItem value="Third">Third Term</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Academic Session</Label>
                    <Input
                      value={form.session}
                      onChange={(e) => setForm({ ...form, session: e.target.value })}
                      placeholder="2026/2027"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Sequence / Week Number</Label>
                    <Input
                      type="number"
                      value={form.sequence}
                      onChange={(e) => setForm({ ...form, sequence: e.target.value })}
                      placeholder="1"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Expected Completion Date</Label>
                    <Input
                      type="date"
                      value={form.expectedBy}
                      onChange={(e) => setForm({ ...form, expectedBy: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="button" disabled={saving} onClick={save} className="gradient-primary text-primary-foreground shadow-elegant w-full sm:w-auto">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Curriculum Topic
                  </Button>
                </div>
              </div>
            ) : type === "coverage" ? (
              /* ══ TOPIC COMPLETION (COVERAGE) FORM ═════════════════════════════ */
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Curriculum Topic *</Label>
                    <Select value={form.topicId} onValueChange={(val) => setForm({ ...form, topicId: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select topic" /></SelectTrigger>
                      <SelectContent>
                        {data.topics.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.topic} ({t.class_name} · {t.subject_name || "Subject"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Assigned Teacher</Label>
                    <Select value={form.teacherId} onValueChange={(val) => setForm({ ...form, teacherId: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select teacher" /></SelectTrigger>
                      <SelectContent>
                        {data.teachers.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Completion Percentage (%) *</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={form.percentage}
                      onChange={(e) => setForm({ ...form, percentage: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Coverage Status *</Label>
                    <Select value={form.status} onValueChange={(val) => setForm({ ...form, status: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="In progress">In progress</SelectItem>
                        <SelectItem value="Reteaching required">Reteaching required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Evidence URL / Google Drive link</Label>
                    <Input
                      value={form.evidenceUrl}
                      onChange={(e) => setForm({ ...form, evidenceUrl: e.target.value })}
                      placeholder="https://drive.google.com/..."
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Teacher Remarks & Notes</Label>
                    <Textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="e.g. 85% of students passed the end-of-topic quiz. Remainder require remedial coaching."
                      className="mt-1 h-20"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="button" disabled={saving} onClick={save} className="gradient-primary text-primary-foreground shadow-elegant w-full sm:w-auto">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Topic Completion Record
                  </Button>
                </div>
              </div>
            ) : type === "intervention" ? (
              /* ══ INTERVENTIONS FORM ═══════════════════════════════════════════ */
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Student *</Label>
                    <Select value={form.studentId} onValueChange={(val) => setForm({ ...form, studentId: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>
                        {data.students.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.class_name})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Target Subject</Label>
                    <Select value={form.subjectId} onValueChange={(val) => setForm({ ...form, subjectId: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select subject" /></SelectTrigger>
                      <SelectContent>
                        {data.subjects.map((sub) => (
                          <SelectItem key={sub.id} value={String(sub.id)}>{sub.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Intervention Action Title *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Weekly Remedial Math Coaching"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Lead Role / Owner *</Label>
                    <Select value={form.ownerRole} onValueChange={(val) => setForm({ ...form, ownerRole: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Subject Teacher">Subject Teacher</SelectItem>
                        <SelectItem value="Form Teacher">Form Teacher</SelectItem>
                        <SelectItem value="Head Teacher / Principal">Head Teacher / Principal</SelectItem>
                        <SelectItem value="Guidance Counsellor">Guidance Counsellor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Baseline Score (%)</Label>
                      <Input
                        type="number"
                        value={form.baseline}
                        onChange={(e) => setForm({ ...form, baseline: e.target.value })}
                        placeholder="40"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Target Score (%)</Label>
                      <Input
                        type="number"
                        value={form.target}
                        onChange={(e) => setForm({ ...form, target: e.target.value })}
                        placeholder="75"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Start Date</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Review Date</Label>
                    <Input
                      type="date"
                      value={form.reviewOn}
                      onChange={(e) => setForm({ ...form, reviewOn: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Rationale & Action Plan Details</Label>
                    <Textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="e.g. Student scored below 45% in mid-term algebra test. Requires 2 extra practice sessions weekly."
                      className="mt-1 h-20"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="button" disabled={saving} onClick={save} className="gradient-primary text-primary-foreground shadow-elegant w-full sm:w-auto">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Create Academic Intervention
                  </Button>
                </div>
              </div>
            ) : type === "observation" ? (
              /* ══ ENGAGEMENT OBSERVATIONS FORM ═════════════════════════════════ */
              <div className="mt-6 space-y-5">
                {/* Mode Selector */}
                <div className="flex justify-center border-b border-border/60 pb-4">
                  <div className="inline-flex rounded-xl bg-muted p-1 border border-border/10">
                    <button
                      type="button"
                      onClick={() => setObsMode("single")}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        obsMode === "single"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Single Student
                    </button>
                    <button
                      type="button"
                      onClick={() => setObsMode("batch")}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        obsMode === "batch"
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Batch Class Ratings (Recommended)
                    </button>
                  </div>
                </div>

                {obsMode === "single" ? (
                  /* ── Single Student Mode ── */
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs">Student *</Label>
                        <Select value={form.studentId} onValueChange={(val) => setForm({ ...form, studentId: val })}>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select student" /></SelectTrigger>
                          <SelectContent>
                            {data.students.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.class_name})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Category *</Label>
                        <Select value={form.category} onValueChange={(val) => setForm({ ...form, category: val })}>
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Participation">Class Participation</SelectItem>
                            <SelectItem value="Homework & Submission">Homework & Submission</SelectItem>
                            <SelectItem value="Conduct & Behaviour">Conduct & Behaviour</SelectItem>
                            <SelectItem value="Punctuality">Punctuality</SelectItem>
                            <SelectItem value="Teamwork">Teamwork & Collaboration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Observation Rating (1 to 5 Stars)</Label>
                        <div className="flex items-center gap-2 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setForm({ ...form, rating: String(star) })}
                              className={`p-1.5 rounded-lg border transition ${
                                Number(form.rating) >= star
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                                  : "border-border text-muted-foreground hover:bg-muted"
                              }`}
                            >
                              <Star className={`h-5 w-5 ${Number(form.rating) >= star ? "fill-amber-500" : ""}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Observation Date</Label>
                        <Input
                          type="date"
                          value={form.date}
                          onChange={(e) => setForm({ ...form, date: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Label className="text-xs">Factual Observation Notes</Label>
                        <Textarea
                          value={form.note}
                          onChange={(e) => setForm({ ...form, note: e.target.value })}
                          placeholder="e.g. Demonstrated outstanding leadership during group science project."
                          className="mt-1 h-20"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="button" disabled={saving} onClick={save} className="gradient-primary text-primary-foreground shadow-elegant w-full sm:w-auto">
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Record Observation
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── Batch Class Ratings Mode ── */
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label className="text-xs">Class / Section *</Label>
                        <Select value={obsClass} onValueChange={setObsClass}>
                          <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select class..." /></SelectTrigger>
                          <SelectContent>
                            {classList.map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Observation Date</Label>
                        <Input
                          type="date"
                          value={obsDate}
                          onChange={(e) => setObsDate(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Category *</Label>
                        <Select value={obsCategory} onValueChange={setObsCategory}>
                          <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Participation">Class Participation</SelectItem>
                            <SelectItem value="Homework & Submission">Homework & Submission</SelectItem>
                            <SelectItem value="Conduct & Behaviour">Conduct & Behaviour</SelectItem>
                            <SelectItem value="Punctuality">Punctuality</SelectItem>
                            <SelectItem value="Teamwork">Teamwork & Collaboration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {obsClass === "All" ? (
                      <div className="border border-dashed border-border rounded-xl p-8 text-center bg-muted/20">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-semibold mt-3">No Class Selected</p>
                        <p className="text-xs text-muted-foreground mt-1">Select a class section above to load and rate students in bulk.</p>
                      </div>
                    ) : obsStudents.length === 0 ? (
                      <div className="border border-dashed border-border rounded-xl p-8 text-center bg-muted/20">
                        <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="text-sm font-semibold mt-3">No Students Enrolled</p>
                        <p className="text-xs text-muted-foreground mt-1">No students are currently registered under class section "{obsClass}".</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="rounded-xl border border-border overflow-hidden">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                                <th className="p-3 w-[220px]">Student Name</th>
                                <th className="p-3 w-[150px]">Engagement Rating</th>
                                <th className="p-3">Quick Template & Rating Presets</th>
                                <th className="p-3">Observation Note</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {obsStudents.map((student) => {
                                const current = obsMap[student.id] || { rating: 5, note: "Satisfactory participation and conduct." };
                                return (
                                  <tr key={student.id} className="hover:bg-muted/10 transition-colors">
                                    <td className="p-3">
                                      <p className="font-semibold text-foreground">{student.name}</p>
                                      <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{student.registration_number}</p>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex items-center gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => setObsMap({
                                              ...obsMap,
                                              [student.id]: { ...current, rating: star }
                                            })}
                                            className="text-muted-foreground hover:scale-110 transition"
                                          >
                                            <Star className={`h-4.5 w-4.5 ${
                                              current.rating >= star
                                                ? "fill-amber-500 text-amber-500"
                                                : "text-muted-foreground/45"
                                            }`} />
                                          </button>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <div className="flex flex-wrap gap-1.5">
                                        {([
                                          { label: "🌟 Excellent", rating: 5, note: "Outstanding participation and focus in class today." },
                                          { label: "📝 Homework Done", rating: 5, note: "Homework completed on time with excellent effort." },
                                          { label: "⏰ Arrived Late", rating: 2, note: "Arrived late to class. Reminded to be punctual." },
                                          { label: "⚠️ Distracted", rating: 3, note: "Needs to avoid distractions and maintain class focus." },
                                          { label: "💬 Team Player", rating: 5, note: "Collaborated exceptionally well in group activities." },
                                        ] as const).map((preset) => (
                                          <button
                                            key={preset.label}
                                            type="button"
                                            onClick={() => setObsMap({
                                              ...obsMap,
                                              [student.id]: { rating: preset.rating, note: preset.note }
                                            })}
                                            className="px-2 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-all text-[10px] font-medium border border-border/30"
                                          >
                                            {preset.label}
                                          </button>
                                        ))}
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      <Input
                                        value={current.note}
                                        onChange={(e) => setObsMap({
                                          ...obsMap,
                                          [student.id]: { ...current, note: e.target.value }
                                        })}
                                        className="h-8 text-xs placeholder:text-muted-foreground/50"
                                        placeholder="Add comment..."
                                      />
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex justify-end pt-2">
                          <Button
                            type="button"
                            disabled={saving}
                            onClick={handleSaveBatchObservations}
                            className="gradient-primary text-primary-foreground shadow-elegant w-full sm:w-auto font-semibold gap-1.5"
                          >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Record Class Observations ({obsStudents.length} Students)
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : type === "lifecycle" ? (
              /* ══ ADMISSIONS & RETENTION (LIFECYCLE) FORM ══════════════════════ */
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Student *</Label>
                    <Select value={form.studentId} onValueChange={(val) => setForm({ ...form, studentId: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select student" /></SelectTrigger>
                      <SelectContent>
                        {data.students.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name} ({s.class_name})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Event Type *</Label>
                    <Select value={form.eventType} onValueChange={(val) => setForm({ ...form, eventType: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Admission">Admission</SelectItem>
                        <SelectItem value="Transfer">Transfer Out / In</SelectItem>
                        <SelectItem value="Withdrawal">Withdrawal</SelectItem>
                        <SelectItem value="Graduation">Graduation</SelectItem>
                        <SelectItem value="Suspension">Suspension</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Event Date *</Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Reason / Explanation *</Label>
                    <Input
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      placeholder="e.g. Regular entrance admission / Relocation"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Destination School / Institution (if transfer/exit)</Label>
                    <Input
                      value={form.destination}
                      onChange={(e) => setForm({ ...form, destination: e.target.value })}
                      placeholder="e.g. Federal Government College, Enugu"
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Detailed Remarks & Entrance/Exit Note</Label>
                    <Textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="e.g. Admitted after successful entrance assessment, interview, and fee clearance."
                      className="mt-1 h-20"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="button" disabled={saving} onClick={save} className="gradient-primary text-primary-foreground shadow-elegant w-full sm:w-auto">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Lifecycle Record
                  </Button>
                </div>
              </div>
            ) : type === "compliance" ? (
              /* ══ COMPLIANCE & INSPECTIONS FORM ═════════════════════════════════ */
              <div className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Requirement / Inspection Title *</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g. Annual Ministry School Quality Audit & Result Register"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Regulatory Authority *</Label>
                    <Input
                      value={form.authority}
                      onChange={(e) => setForm({ ...form, authority: e.target.value })}
                      placeholder="e.g. Ministry of Education / WAEC Board"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Requirement Type *</Label>
                    <Select value={form.requirementType} onValueChange={(val) => setForm({ ...form, requirementType: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inspection">Inspection</SelectItem>
                        <SelectItem value="Audit">Audit</SelectItem>
                        <SelectItem value="Renewal">License Renewal</SelectItem>
                        <SelectItem value="Certification">Certification</SelectItem>
                        <SelectItem value="Evidence Pack">Result Register Evidence Pack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Lead Owner Role *</Label>
                    <Select value={form.ownerRole} onValueChange={(val) => setForm({ ...form, ownerRole: val })}>
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Principal">Principal / Head Teacher</SelectItem>
                        <SelectItem value="Vice Principal">Vice Principal Academic</SelectItem>
                        <SelectItem value="Exam Officer">Exam Officer</SelectItem>
                        <SelectItem value="Bursar">Bursar / Financial Officer</SelectItem>
                        <SelectItem value="HOD">HOD / Quality Coordinator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Due Date</Label>
                    <Input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Inspection Start Date</Label>
                    <Input
                      type="date"
                      value={form.inspectionStart}
                      onChange={(e) => setForm({ ...form, inspectionStart: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Inspection End Date</Label>
                    <Input
                      type="date"
                      value={form.inspectionEnd}
                      onChange={(e) => setForm({ ...form, inspectionEnd: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs">Action Plan & Requirements Note</Label>
                    <Textarea
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      placeholder="e.g. Prepare signed result register, attendance summary and marked-script sample."
                      className="mt-1 h-20"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="button" disabled={saving} onClick={save} className="gradient-primary text-primary-foreground shadow-elegant w-full sm:w-auto">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Compliance Record
                  </Button>
                </div>
              </div>
            ) : type === "availability" ? (
              /* ══ TEACHER AVAILABILITY MATRIX UX ═══════════════════════════════ */
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 p-3 sm:p-4 rounded-xl border border-border">
                  <div>
                    <Label className="text-xs font-semibold">Select Teacher to Manage Schedule</Label>
                    <Select value={availTeacherId} onValueChange={setAvailTeacherId}>
                      <SelectTrigger className="w-full sm:w-[220px] h-9 text-xs mt-1">
                        <SelectValue placeholder="Choose a teacher..." />
                      </SelectTrigger>
                      <SelectContent>
                        {data.teachers.map((t) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {availTeacherId && (
                    <p className="text-xs text-muted-foreground">
                      Click any period slot below to toggle between <strong className="text-success">Available</strong> and <strong className="text-destructive font-semibold">Blocked</strong>.
                    </p>
                  )}
                </div>

                {availTeacherId ? (
                  <div className="rounded-xl border border-border overflow-hidden w-full max-w-full">
                    <div className="overflow-x-auto">
                      <table className="w-full text-center text-xs min-w-[650px]">
                        <thead className="bg-muted border-b border-border text-[11px] font-semibold text-muted-foreground">
                          <tr>
                            <th className="py-3 px-3 text-left">Day</th>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                              <th key={p} className="py-3 px-2">Period {p}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                          {[
                            { dayNum: 1, dayName: "Monday" },
                            { dayNum: 2, dayName: "Tuesday" },
                            { dayNum: 3, dayName: "Wednesday" },
                            { dayNum: 4, dayName: "Thursday" },
                            { dayNum: 5, dayName: "Friday" },
                          ].map(({ dayNum, dayName }) => (
                            <tr key={dayNum}>
                              <td className="py-3 px-3 font-semibold text-left text-foreground bg-muted/20">{dayName}</td>
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((period) => {
                                const existing = data.availability.find(
                                  (av: any) =>
                                    Number(av.teacher_id) === Number(availTeacherId) &&
                                    Number(av.day_of_week) === dayNum &&
                                    Number(av.period_number) === period
                                );
                                const isAvail = existing ? (existing.is_available ?? existing.isAvailable) : true;

                                const toggleAvail = async () => {
                                  const nextAvail = !isAvail;
                                  // Optimistically update React state immediately!
                                  setData((prev) => {
                                    if (!prev) return prev;
                                    const nextAvailList = [...prev.availability];
                                    const idx = nextAvailList.findIndex(
                                      (av: any) =>
                                        Number(av.teacher_id) === Number(availTeacherId) &&
                                        Number(av.day_of_week) === dayNum &&
                                        Number(av.period_number) === period
                                    );
                                    if (idx >= 0) {
                                      nextAvailList[idx] = { ...nextAvailList[idx], is_available: nextAvail, isAvailable: nextAvail };
                                    } else {
                                      nextAvailList.push({
                                        teacher_id: Number(availTeacherId),
                                        day_of_week: dayNum,
                                        period_number: period,
                                        is_available: nextAvail,
                                        isAvailable: nextAvail,
                                      });
                                    }
                                    return { ...prev, availability: nextAvailList };
                                  });

                                  try {
                                    await saveAcademicOperationDb({
                                      data: {
                                        schoolCode,
                                        record: {
                                          kind: "availability",
                                          teacherId: Number(availTeacherId),
                                          dayOfWeek: dayNum,
                                          periodNumber: period,
                                          isAvailable: nextAvail,
                                          note: `Schedule updated`,
                                        },
                                      },
                                    });
                                    toast.success(`${dayName} Period ${period}: ${nextAvail ? "Available" : "Blocked"}`);
                                  } catch (e) {
                                    toast.error("Failed to update availability");
                                    await load(); // Revert on failure
                                  }
                                };

                                return (
                                  <td key={period} className="py-2 px-1">
                                    <button
                                      type="button"
                                      onClick={toggleAvail}
                                      className={`w-full py-1.5 rounded text-[10px] font-bold transition border ${
                                        isAvail
                                          ? "bg-success/15 text-success border-success/30 hover:bg-success/25"
                                          : "bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/25"
                                      }`}
                                    >
                                      {isAvail ? "✓ Available" : "✕ Blocked"}
                                    </button>
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-8 border border-dashed rounded-xl">
                    Select a teacher above to view and manage their weekly timetable period availability matrix.
                  </p>
                )}
              </div>
            ) : null}
          </Card>

          {/* ══ RECENT RECORDS LIST ═════════════════════════════════════════════ */}
          <Card className="border-border p-4 sm:p-6 shadow-card w-full">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="font-display text-base sm:text-lg font-semibold break-words">
                Recent {selectedType[1]} entries ({recent.length})
              </h2>
              {type === "availability" && availTeacherId && (
                <span className="text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-full font-semibold">
                  Filtered for {data.teachers.find(t => Number(t.id) === Number(availTeacherId))?.name}
                </span>
              )}
            </div>
            {recent.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground py-6">
                No recent entries recorded for {selectedType[1].toLowerCase()}{type === "availability" && availTeacherId ? " for this teacher" : ""}.
              </p>
            ) : (
              <div className="space-y-3 w-full">
                {recent.slice(0, 25).map((item: any, idx: number) => (
                  <RecentRecordCard key={item.id || idx} type={type} item={item} data={data} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* AI Assistant Dialog */}
      <Dialog open={aiOpen} onOpenChange={setAiOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> AI Operational Intelligence
            </DialogTitle>
          </DialogHeader>
          {aiLoading ? (
            <div className="grid min-h-48 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <FormattedAiOutput text={aiOutput} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
