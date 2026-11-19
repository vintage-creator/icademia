import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Pencil,
  Loader2,
  Users,
  Trash2,
  UploadCloud,
  FileSpreadsheet,
  UserPlus,
  Shield,
  CheckCircle2,
  Download,
  FileText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getStudentsDb,
  addStudentDb,
  updateStudentDb,
  deleteStudentDb,
  uploadToCloudinaryDb,
  batchAddStudentsDb,
  updateStudentResultAccessDb,
  parseBulkDocxDb,
  getClassSummaryDb,
} from "@/lib/api/db.functions";
import { getAdminToken, getSchoolCode } from "@/lib/utils";
import { downloadDocxTemplate, fileToDataUrl, parseCsvRows } from "@/lib/bulk-import";

export const Route = createFileRoute("/dashboard/students")({
  head: () => ({ meta: [{ title: "Students — iCademia" }] }),
  component: StudentsPage,
});

type Student = {
  id: number;
  name: string;
  registration_number: string;
  class_name: string;
  photo_url?: string;
  results_count?: number;
  guardian_name?: string;
  guardian_phone?: string;
  result_access_status?: "Allowed" | "Restricted";
  result_restriction_reason?: string;
  result_restriction_expires_at?: string;
};

type BulkRow = {
  name: string;
  regNumber: string;
  className: string;
  guardianName: string;
  guardianPhone: string;
};

function StudentsPage() {
  const [q, setQ] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [students, setStudents] = useState<Student[]>([]);
  const [configuredClasses, setConfiguredClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Single Enrolment Dialog
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [className, setClassName] = useState("JSS 1");
  const [photoUrl, setPhotoUrl] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState("Parent");

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [accessStudent, setAccessStudent] = useState<Student | null>(null);
  const [accessStatus, setAccessStatus] = useState<"Allowed" | "Restricted">("Allowed");
  const [accessReason, setAccessReason] = useState("");
  const [accessExpires, setAccessExpires] = useState("");
  const [savingAccess, setSavingAccess] = useState(false);

  // Bulk Enrolment Dialog
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkTab, setBulkTab] = useState<"grid" | "csv">("grid");
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([
    { name: "", regNumber: "", className: "JSS 1", guardianName: "", guardianPhone: "" },
    { name: "", regNumber: "", className: "JSS 1", guardianName: "", guardianPhone: "" },
    { name: "", regNumber: "", className: "JSS 1", guardianName: "", guardianPhone: "" },
    { name: "", regNumber: "", className: "JSS 1", guardianName: "", guardianPhone: "" },
    { name: "", regNumber: "", className: "JSS 1", guardianName: "", guardianPhone: "" },
  ]);
  const [csvText, setCsvText] = useState("");
  const [importSource, setImportSource] = useState<"CSV" | "Word">("CSV");
  const [parsingDocument, setParsingDocument] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  const schoolCode = getSchoolCode();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [list, classSummary] = await Promise.all([
        getStudentsDb({ data: { token: getAdminToken(), schoolCode } }),
        getClassSummaryDb({ data: { token: getAdminToken(), schoolCode } }),
      ]);
      setStudents(list as unknown as Student[]);
      const classNames = (classSummary as unknown as Array<{ class_name: string }>).map(
        (item) => item.class_name,
      );
      setConfiguredClasses(classNames);
      setClassName((current) => current || classNames[0] || "");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [schoolCode]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !regNumber) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await updateStudentDb({
          data: {
            schoolCode,
            token: getAdminToken(),
            id: editingId,
            name,
            regNumber,
            className,
            photoUrl: photoUrl || undefined,
          },
        });
      } else {
        await addStudentDb({
          data: {
            schoolCode,
            token: getAdminToken(),
            name,
            regNumber,
            className,
            photoUrl: photoUrl || undefined,
          },
        });
      }
      toast.success(editingId ? "Student record updated" : "Student enrolled successfully!");
      setOpen(false);
      resetForm();
      fetchStudents();
    } catch (err) {
      toast.error("Failed to add student", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setRegNumber("");
    setPhotoUrl("");
    setGuardianName("");
    setGuardianPhone("");
    setGuardianEmail("");
    setGuardianRelationship("Parent");
  };

  const editStudent = (student: Student) => {
    setEditingId(student.id);
    setName(student.name);
    setRegNumber(student.registration_number);
    setClassName(student.class_name);
    setPhotoUrl(student.photo_url || "");
    setOpen(true);
  };

  const removeStudent = async (student: Student) => {
    if (
      !window.confirm(
        `Remove ${student.name}? This also removes the student's published reports and scripts.`,
      )
    )
      return;
    await deleteStudentDb({ data: { token: getAdminToken(), schoolCode, id: student.id } });
    toast.success("Student removed");
    await fetchStudents();
  };

  const openAccessControl = (student: Student) => {
    setAccessStudent(student);
    setAccessStatus(student.result_access_status || "Allowed");
    setAccessReason(student.result_restriction_reason || "");
    setAccessExpires(student.result_restriction_expires_at?.slice(0, 10) || "");
  };

  const saveStudentAccess = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!accessStudent) return;
    setSavingAccess(true);
    try {
      await updateStudentResultAccessDb({
        data: {
          token: localStorage.getItem("icademia_admin_token") ?? "",
          schoolCode,
          studentId: accessStudent.id,
          status: accessStatus,
          reason: accessStatus === "Restricted" ? accessReason : undefined,
          expiresAt: accessStatus === "Restricted" && accessExpires ? accessExpires : undefined,
        },
      });
      toast.success(
        accessStatus === "Restricted"
          ? `${accessStudent.name}'s result access is restricted`
          : `${accessStudent.name}'s result access is restored`,
      );
      setAccessStudent(null);
      await fetchStudents();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update result access.");
    } finally {
      setSavingAccess(false);
    }
  };

  // Bulk Row Actions
  const updateBulkRow = (index: number, field: keyof BulkRow, val: string) => {
    setBulkRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const addBulkRow = () => {
    const lastClass = bulkRows[bulkRows.length - 1]?.className || "JSS 1";
    setBulkRows((prev) => [
      ...prev,
      { name: "", regNumber: "", className: lastClass, guardianName: "", guardianPhone: "" },
    ]);
  };

  const handleBulkSubmitGrid = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = bulkRows.filter((r) => r.name.trim() && r.regNumber.trim());
    if (validRows.length === 0) {
      toast.error("Please enter at least one student's name and registration number.");
      return;
    }

    setBulkSubmitting(true);
    try {
      const res = await batchAddStudentsDb({
        data: {
          schoolCode,
          token: getAdminToken(),
          students: validRows.map((r) => ({
            name: r.name,
            regNumber: r.regNumber,
            className: r.className || "JSS 1",
            guardianName: r.guardianName,
            guardianPhone: r.guardianPhone,
          })),
        },
      });

      toast.success(`Enrolled ${res.inserted} students!`, {
        description:
          res.skipped > 0 ? `${res.skipped} duplicates skipped.` : "All records saved cleanly.",
      });
      setBulkOpen(false);
      await fetchStudents();
    } catch (err) {
      toast.error("Bulk enrolment failed", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleParseCsv = async () => {
    if (!csvText.trim()) return;
    const lines = parseCsvRows(csvText);
    const parsed: BulkRow[] = [];

    for (let i = 0; i < lines.length; i++) {
      const parts = lines[i];
      if (parts.length >= 2) {
        // Skip header if line 0 looks like header
        if (
          i === 0 &&
          (parts[0].toLowerCase().includes("name") || parts[1].toLowerCase().includes("reg"))
        )
          continue;
        parsed.push({
          name: parts[0] || "",
          regNumber: parts[1] || `REG-${Math.floor(1000 + Math.random() * 9000)}`,
          className: parts[2] || "JSS 1",
          guardianName: parts[3] || "",
          guardianPhone: parts[4] || "",
        });
      }
    }

    if (parsed.length === 0) {
      toast.error("Could not parse CSV format.", {
        description: "Use format: Name, RegNumber, Class, GuardianName, GuardianPhone",
      });
      return;
    }

    setBulkSubmitting(true);
    try {
      const res = await batchAddStudentsDb({
        data: {
          schoolCode,
          token: getAdminToken(),
          students: parsed,
        },
      });
      toast.success(`Batch enrolled ${res.inserted} students from ${importSource}`, {
        description:
          res.skipped > 0 ? `${res.skipped} duplicates skipped.` : "All student records imported.",
      });
      setBulkOpen(false);
      setCsvText("");
      await fetchStudents();
    } catch (err) {
      toast.error(`${importSource} import failed`, {
        description: err instanceof Error ? err.message : "Check format and try again.",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleImportFile = async (file?: File) => {
    if (!file) return;
    if (file.name.toLowerCase().endsWith(".csv")) {
      setCsvText(await file.text());
      setImportSource("CSV");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".docx")) {
      toast.error("Choose a CSV or Word .docx file.");
      return;
    }
    setParsingDocument(true);
    try {
      const result = await parseBulkDocxDb({
        data: { base64: await fileToDataUrl(file), expectedColumns: 5 },
      });
      setCsvText(result.rows.map((row) => row.slice(0, 5).join(",")).join("\n"));
      setImportSource("Word");
      toast.success(`${result.rows.length} Word table rows ready to review`);
    } catch (error) {
      toast.error("Could not read the Word table", {
        description: error instanceof Error ? error.message : "Use the downloadable template.",
      });
    } finally {
      setParsingDocument(false);
    }
  };

  const availableClasses = Array.from(
    new Set([...configuredClasses, ...students.map((s) => s.class_name)].filter(Boolean)),
  ).sort();

  const filtered = students.filter((s) => {
    const matchesQ =
      s.name.toLowerCase().includes(q.toLowerCase()) ||
      s.registration_number.toLowerCase().includes(q.toLowerCase());
    const matchesClass = classFilter === "All" || s.class_name === classFilter;
    return matchesQ && matchesClass;
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage enrolled students, registration numbers, and linked parent/guardian contacts.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Bulk Enrolment Trigger */}
          <Button
            variant="outline"
            onClick={() => setBulkOpen(true)}
            className="border-primary/30 text-xs gap-1.5 shadow-sm hover:bg-primary/5"
          >
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            Bulk Enrol (500+ Students)
          </Button>

          {/* Single Enrolment Dialog */}
          <Dialog
            open={open}
            onOpenChange={(next) => {
              setOpen(next);
              if (!next) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground shadow-elegant text-xs gap-1.5">
                <Plus className="h-4 w-4" /> Enrol Single Student
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Edit Student & Guardian" : "Enrol a New Student"}
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleAddStudent} className="space-y-4 mt-2">
                <div className="space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">
                    Student Information
                  </p>
                  <div>
                    <Label className="text-xs">Full Name *</Label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Chukwudi Emmanuel Okafor"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Registration Number *</Label>
                      <Input
                        value={regNumber}
                        onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                        placeholder="e.g. SCH/2026/042"
                        required
                        className="mt-1 font-mono uppercase"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Class / Section *</Label>
                      <Select value={className} onValueChange={setClassName} required>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Choose a configured class" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableClasses.map((item) => (
                            <SelectItem key={item} value={item}>{item}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {availableClasses.length === 0 ? (
                        <p className="mt-1 text-[11px] text-amber-700">
                          Create a class in Academic Setup before enrolling students.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Guardian Details */}
                <div className="space-y-3 pt-3 border-t border-border">
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" /> Parent / Guardian Details
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Guardian Name</Label>
                      <Input
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="e.g. Chief O. Okafor"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Guardian Phone</Label>
                      <Input
                        value={guardianPhone}
                        onChange={(e) => setGuardianPhone(e.target.value)}
                        placeholder="e.g. 0803 000 0000"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={submitting || !className} className="w-full mt-2">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {editingId ? "Update Student Record" : "Enrol Student"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search student by name or registration number..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Classes ({students.length})</SelectItem>
            {availableClasses.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <Card className="grid min-h-56 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg font-semibold">No students found</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {students.length === 0
              ? "Start by adding students or importing in bulk."
              : "No student matches your search query."}
          </p>
        </Card>
      ) : (
        <Card className="border-border p-4 shadow-card">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Student Name</th>
                  <th className="py-2.5 px-3">Reg Number</th>
                  <th className="py-2.5 px-3">Class</th>
                  <th className="py-2.5 px-3">Parent / Guardian</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-3 font-semibold text-foreground">{s.name}</td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">
                      {s.registration_number}
                    </td>
                    <td className="py-3 px-3">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary">
                        {s.class_name}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">
                      {s.guardian_name ? (
                        <span>
                          {s.guardian_name} {s.guardian_phone ? `(${s.guardian_phone})` : ""}
                        </span>
                      ) : (
                        <span className="italic text-[11px] text-muted-foreground/60">
                          Not supplied
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          title="Manage result access"
                          onClick={() => openAccessControl(s)}
                        >
                          <Shield
                            className={`h-3.5 w-3.5 ${s.result_access_status === "Restricted" ? "text-destructive" : ""}`}
                          />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => editStudent(s)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => removeStudent(s)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {filtered.map((student) => (
              <article key={student.id} className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold">{student.name}</h3>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                      {student.registration_number}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                    {student.class_name}
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {student.guardian_name
                    ? `${student.guardian_name}${student.guardian_phone ? ` · ${student.guardian_phone}` : ""}`
                    : "Guardian details not supplied"}
                </p>
                <div className="mt-3 flex justify-end gap-1 border-t pt-2">
                  <Button variant="ghost" size="sm" onClick={() => openAccessControl(student)}>
                    <Shield
                      className={`mr-1 h-3.5 w-3.5 ${student.result_access_status === "Restricted" ? "text-destructive" : ""}`}
                    />{" "}
                    {student.result_access_status === "Restricted" ? "Restricted" : "Access"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => editStudent(student)}>
                    <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => removeStudent(student)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> Remove
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </Card>
      )}

      <Dialog
        open={Boolean(accessStudent)}
        onOpenChange={(next) => !next && setAccessStudent(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Result access · {accessStudent?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This student-level setting is enforced before any scratch card is accepted.
          </p>
          <form onSubmit={saveStudentAccess} className="space-y-4">
            <div>
              <Label>Access status</Label>
              <Select
                value={accessStatus}
                onValueChange={(value) => setAccessStatus(value as "Allowed" | "Restricted")}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Allowed">Allowed</SelectItem>
                  <SelectItem value="Restricted">Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {accessStatus === "Restricted" && (
              <>
                <div>
                  <Label>Reason shown to student</Label>
                  <Input
                    className="mt-2"
                    required
                    value={accessReason}
                    onChange={(event) => setAccessReason(event.target.value)}
                    placeholder="Please contact the school office for clearance."
                  />
                </div>
                <div>
                  <Label>
                    Automatic restoration date{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    className="mt-2"
                    type="date"
                    value={accessExpires}
                    onChange={(event) => setAccessExpires(event.target.value)}
                  />
                </div>
              </>
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setAccessStudent(null)}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={savingAccess}>
                {savingAccess && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save access
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Enrolment Modal */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-4">
              <span>Bulk Student & Guardian Enrolment</span>
              <div className="flex gap-1 text-xs">
                <Button
                  size="sm"
                  variant={bulkTab === "grid" ? "default" : "outline"}
                  onClick={() => setBulkTab("grid")}
                  className="h-7 text-xs"
                >
                  Quick Multi-Row Grid
                </Button>
                <Button
                  size="sm"
                  variant={bulkTab === "csv" ? "default" : "outline"}
                  onClick={() => setBulkTab("csv")}
                  className="h-7 text-xs"
                >
                  File Import
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {bulkTab === "grid" ? (
            <form onSubmit={handleBulkSubmitGrid} className="space-y-4 mt-2">
              <p className="text-xs text-muted-foreground">
                Enter multiple student records below. Add rows as needed to enrol large batches of
                students at once.
              </p>
              <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                {bulkRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 items-center bg-muted/20 p-2 rounded-lg border border-border/50"
                  >
                    <div className="col-span-3">
                      <Input
                        placeholder="Student Full Name *"
                        value={row.name}
                        onChange={(e) => updateBulkRow(idx, "name", e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Reg Number *"
                        value={row.regNumber}
                        onChange={(e) =>
                          updateBulkRow(idx, "regNumber", e.target.value.toUpperCase())
                        }
                        className="h-8 text-xs font-mono uppercase bg-background"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Class"
                        value={row.className}
                        onChange={(e) => updateBulkRow(idx, "className", e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        placeholder="Guardian Name"
                        value={row.guardianName}
                        onChange={(e) => updateBulkRow(idx, "guardianName", e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Guardian Phone"
                        value={row.guardianPhone}
                        onChange={(e) => updateBulkRow(idx, "guardianPhone", e.target.value)}
                        className="h-8 text-xs bg-background"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBulkRow}
                  className="text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Another Row
                </Button>
                <Button
                  type="submit"
                  disabled={bulkSubmitting}
                  className="gradient-primary text-primary-foreground text-xs"
                >
                  {bulkSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Enrol Batch ({bulkRows.filter((r) => r.name.trim()).length} Students)
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4 mt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upload a CSV or a structured Word table (.docx), or paste comma-separated rows. Keep
                this column order:
                <br />
                <code className="bg-muted px-2 py-0.5 rounded text-[11px] font-mono">
                  Full Name, RegNumber, Class, GuardianName, GuardianPhone
                </code>
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <Button variant="outline" asChild className="w-full">
                  <label>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    {parsingDocument ? "Reading document…" : "Choose CSV or DOCX"}
                    <input
                      type="file"
                      accept=".csv,.docx"
                      className="hidden"
                      disabled={parsingDocument}
                      onChange={(event) => void handleImportFile(event.target.files?.[0])}
                    />
                  </label>
                </Button>
                <Button variant="outline" asChild className="w-full">
                  <a
                    href="data:text/csv;charset=utf-8,Full%20Name%2CRegNumber%2CClass%2CGuardianName%2CGuardianPhone%0AChukwudi%20Okafor%2CSCH%2F2026%2F001%2CJSS%201%20Gold%2CChief%20Okafor%2C08030000001"
                    download="icademia-student-import-template.csv"
                  >
                    <Download className="mr-2 h-4 w-4" /> CSV template
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    void downloadDocxTemplate(
                      "icademia-student-import-template.docx",
                      "iCademia Student Import Template",
                      ["Full Name", "RegNumber", "Class", "GuardianName", "GuardianPhone"],
                      [
                        [
                          "Chukwudi Okafor",
                          "SCH/2026/001",
                          "JSS 1 Gold",
                          "Chief Okafor",
                          "08030000001",
                        ],
                      ],
                    )
                  }
                >
                  <FileText className="mr-2 h-4 w-4" /> Word template
                </Button>
              </div>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={`Chukwudi Okafor, SCH/2026/001, JSS 1 Gold, Chief Okafor, 08030000001\nAmina Yusuf, SCH/2026/002, JSS 1 Gold, Mallam Yusuf, 08030000002`}
                className="w-full h-44 p-3 font-mono text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end">
                <Button
                  onClick={handleParseCsv}
                  disabled={bulkSubmitting || !csvText.trim()}
                  className="gradient-primary text-primary-foreground text-xs"
                >
                  {bulkSubmitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                  Import {importSource} records
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
