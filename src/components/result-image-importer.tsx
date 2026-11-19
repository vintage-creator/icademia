import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, FileImage, Loader2, ScanText, Trash2, Upload, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  extractResultImagesDb,
  getResultImageImportContextDb,
  importReviewedResultsDb,
} from "@/lib/api/team-operations.functions";
import { getCurrentAcademicSession } from "@/lib/utils";

type ImportActor =
  | { kind: "platform"; adminKey: string }
  | { kind: "school"; token: string };
type SchoolOption = { name: string; school_code: string };
type StudentOption = { id: number; name: string; registration_number: string };
type SubjectOption = { id: number; name: string };
type UploadedImage = { name: string; mimeType: "image/jpeg"; base64: string; size: number };
type EditableSubject = { caScore: string; examScore: string };
type EditableRow = {
  rowKey: string;
  studentName: string;
  registrationNumber: string;
  className: string;
  studentId: string;
  attendancePresent: string;
  attendanceTotal: string;
  remarks: string;
  confidence: number;
  warnings: string[];
  subjectScores: Record<string, EditableSubject>;
};

type Props = {
  actor: ImportActor;
  schoolCode?: string;
  schools?: SchoolOption[];
  onImported?: () => void | Promise<void>;
};

function normalise(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function compressImage(file: File): Promise<UploadedImage> {
  if (!file.type.startsWith("image/")) throw new Error(`${file.name} is not an image.`);
  if (file.size > 16 * 1024 * 1024) throw new Error(`${file.name} is larger than 16 MB.`);
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2200 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser could not prepare the image.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("Could not resize the image."))), "image/jpeg", 0.84);
  });
  if (blob.size > 2 * 1024 * 1024) throw new Error(`${file.name} is still too large after resizing. Crop it closer and try again.`);
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(blob);
  });
  return { name: file.name, mimeType: "image/jpeg", base64, size: blob.size };
}

export function ResultImageImporter({ actor, schoolCode: fixedSchoolCode, schools = [], onImported }: Props) {
  const actorIdentity = actor.kind === "platform" ? actor.adminKey : actor.token;
  const stableActor = useMemo<ImportActor>(
    () => actor.kind === "platform" ? { kind: "platform", adminKey: actorIdentity } : { kind: "school", token: actorIdentity },
    [actor.kind, actorIdentity],
  );
  const [selectedSchool, setSelectedSchool] = useState(fixedSchoolCode ?? "");
  const schoolCode = fixedSchoolCode || selectedSchool;
  const [schoolName, setSchoolName] = useState("");
  const [classes, setClasses] = useState<Array<{ class_name: string }>>([]);
  const [className, setClassName] = useState("");
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [term, setTerm] = useState("First Term");
  const [session, setSession] = useState(getCurrentAcademicSession());
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [loadingContext, setLoadingContext] = useState(false);
  const [reading, setReading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!schoolCode) {
      setClasses([]);
      setStudents([]);
      setSubjects([]);
      setSchoolName("");
      setClassName("");
      setRows([]);
      return;
    }
    let cancelled = false;
    setLoadingContext(true);
    getResultImageImportContextDb({
      data: { actor: stableActor, schoolCode, className: className || undefined },
    })
      .then((result) => {
        if (cancelled) return;
        setSchoolName(result.schoolName);
        setClasses(result.classes as unknown as Array<{ class_name: string }>);
        setStudents(result.students as StudentOption[]);
        setSubjects(result.subjects as SubjectOption[]);
      })
      .catch((error) => {
        if (!cancelled) {
          setClasses([]);
          setStudents([]);
          setSubjects([]);
          toast.error(error instanceof Error ? error.message : "Could not load the school setup.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingContext(false);
      });
    return () => {
      cancelled = true;
    };
  }, [stableActor, schoolCode, className]);

  const chooseSchool = (value: string) => {
    setSelectedSchool(value);
    setClassName("");
    setImages([]);
    setImageNames([]);
    setRows([]);
  };

  const chooseClass = (value: string) => {
    setClassName(value);
    setImages([]);
    setImageNames([]);
    setRows([]);
  };

  const selectFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (images.length + selected.length > 8) {
      toast.error("Upload up to 8 images per batch.");
      return;
    }
    const allowed = selected.filter((file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type));
    if (allowed.length !== selected.length) toast.error("Use JPG, PNG or WebP images.");
    if (allowed.length === 0) return;
    setReading(true);
    try {
      const prepared = await Promise.all(allowed.map(compressImage));
      setImages((current) => [...current, ...prepared]);
      setImageNames((current) => [...current, ...prepared.map((image) => image.name)]);
      setRows([]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not prepare the selected image.");
    } finally {
      setReading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setImageNames((current) => current.filter((_, rowIndex) => rowIndex !== index));
    setRows([]);
  };

  const readImages = async () => {
    if (!schoolCode || !className || !term || !session || images.length === 0) return;
    setReading(true);
    setRows([]);
    try {
      const extracted = await extractResultImagesDb({
        data: {
          actor: stableActor,
          schoolCode,
          className,
          term,
          session,
          images: images.map(({ name, mimeType, base64 }) => ({ name, mimeType, base64 })),
        },
      });
      const parsedRows = extracted.rows as Array<{
        rowKey: string;
        studentName: string;
        registrationNumber: string;
        className: string;
        attendancePresent: number | null;
        attendanceTotal: number | null;
        remarks: string;
        confidence: number;
        warnings: string[];
        subjects: Array<{ subject: string; caScore: number | null; examScore: number | null }>;
      }>;
      const nextRows = parsedRows.map((row) => {
        const regMatches = row.registrationNumber
          ? students.filter((student) => normalise(student.registration_number) === normalise(row.registrationNumber))
          : [];
        const nameMatches = students.filter((student) => normalise(student.name) === normalise(row.studentName));
        const automaticMatch = regMatches.length === 1 ? regMatches[0] : regMatches.length === 0 && nameMatches.length === 1 ? nameMatches[0] : null;
        if (!row.registrationNumber && !automaticMatch) row.warnings.push("No unique student match was found. Choose the correct student below.");
        if (row.registrationNumber && regMatches.length > 1) row.warnings.push("This registration number is duplicated in the class. Select the correct student below.");
        const subjectScores = Object.fromEntries(
          subjects.map((subject) => {
            const found = row.subjects.find((item) => item.subject.trim().toLowerCase() === subject.name.trim().toLowerCase());
            return [subject.name, {
              caScore: found?.caScore == null ? "" : String(found.caScore),
              examScore: found?.examScore == null ? "" : String(found.examScore),
            }];
          }),
        );
        return {
          ...row,
          studentId: automaticMatch ? String(automaticMatch.id) : "",
          attendancePresent: row.attendancePresent == null ? "" : String(row.attendancePresent),
          attendanceTotal: row.attendanceTotal == null ? "" : String(row.attendanceTotal),
          subjectScores,
        };
      });
      setRows(nextRows);
      toast.success(`${nextRows.length} student row${nextRows.length === 1 ? "" : "s"} extracted. Review every value before saving.`);
    } catch (error) {
      toast.error("Could not read these result images", {
        description: error instanceof Error ? error.message : "Try sharper images with one class per batch.",
      });
    } finally {
      setReading(false);
    }
  };

  const patchRow = (rowKey: string, update: Partial<EditableRow>) => {
    setRows((current) => current.map((row) => row.rowKey === rowKey ? { ...row, ...update } : row));
  };

  const patchScore = (rowKey: string, subjectName: string, field: keyof EditableSubject, value: string) => {
    setRows((current) => current.map((row) => row.rowKey === rowKey
      ? { ...row, subjectScores: { ...row.subjectScores, [subjectName]: { ...row.subjectScores[subjectName], [field]: value } } }
      : row));
  };

  const validationMessage = useMemo(() => {
    if (!rows.length) return "";
    if (rows.some((row) => row.studentId === "")) return "Match every extracted row to a student, or choose to create a new student record.";
    if (rows.some((row) => row.studentId === "__new__" && (!row.studentName.trim() || !row.registrationNumber.trim()))) {
      return "Enter the student's name and admission number before creating a new roster record.";
    }
    const matched = rows.filter((row) => row.studentId !== "__new__").map((row) => row.studentId);
    if (new Set(matched).size !== matched.length) return "A student is matched more than once. Check for duplicate image rows.";
    const newRegs = rows.filter((row) => row.studentId === "__new__").map((row) => normalise(row.registrationNumber));
    if (new Set(newRegs).size !== newRegs.length) return "A new admission number appears more than once. Check for duplicate image rows.";
    for (const row of rows) {
      for (const subject of subjects) {
        const values = row.subjectScores[subject.name];
        const ca = Number(values?.caScore);
        const exam = Number(values?.examScore);
        if (values?.caScore === "" || values?.examScore === "") return `${row.studentName || "A student"} is missing a CA or exam score. Check the image and complete the row.`;
        if (!Number.isInteger(ca) || ca < 0 || ca > 40) return `${subject.name} CA scores must be whole numbers from 0 to 40.`;
        if (!Number.isInteger(exam) || exam < 0 || exam > 60) return `${subject.name} exam scores must be whole numbers from 0 to 60.`;
      }
      const present = row.attendancePresent === "" ? null : Number(row.attendancePresent);
      const total = row.attendanceTotal === "" ? null : Number(row.attendanceTotal);
      if ((present != null && (!Number.isInteger(present) || present < 0)) || (total != null && (!Number.isInteger(total) || total < 0))) {
        return "Attendance values must be whole numbers greater than or equal to zero.";
      }
      if (present != null && total != null && present > total) return `${row.studentName}'s present days cannot exceed total school days.`;
    }
    return "";
  }, [rows, subjects]);

  const saveResults = async () => {
    if (!schoolCode || !className || validationMessage) return;
    setSaving(true);
    try {
      const result = await importReviewedResultsDb({
        data: {
          actor: stableActor,
          schoolCode,
          className,
          term,
          session,
          rows: rows.map((row) => ({
            studentId: row.studentId === "__new__" ? null : Number(row.studentId),
            createStudent: row.studentId === "__new__",
            studentName: row.studentName.trim(),
            registrationNumber: row.registrationNumber.trim(),
            attendancePresent: row.attendancePresent === "" ? null : Number(row.attendancePresent),
            attendanceTotal: row.attendanceTotal === "" ? null : Number(row.attendanceTotal),
            remarks: row.remarks,
            subjects: subjects.map((subject) => ({
              subject: subject.name,
              caScore: Number(row.subjectScores[subject.name].caScore),
              examScore: Number(row.subjectScores[subject.name].examScore),
            })),
          })),
        },
      });
      toast.success(`${result.imported} results saved for school review`, {
        description: "The school administrator must verify and publish each result before students can view it.",
      });
      setRows([]);
      setImages([]);
      setImageNames([]);
      await onImported?.();
    } catch (error) {
      toast.error("Results were not saved", {
        description: error instanceof Error ? error.message : "Review the student, subject and term details.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-6 overflow-hidden border-primary/20 shadow-card">
      <div className="border-b bg-primary/[0.035] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ScanText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">Import results from images</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Upload clear photos of one class’s result sheets. AI reads the names and marks; you check the student match and every score before the results enter the school’s review queue.
            </p>
          </div>
        </div>
      </div>
      <div className="space-y-5 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {fixedSchoolCode ? (
            <div className="sm:col-span-2 xl:col-span-1">
              <Label>School</Label>
              <Input className="mt-2" value={schoolName || fixedSchoolCode} readOnly />
            </div>
          ) : (
            <div className="sm:col-span-2 xl:col-span-1">
              <Label htmlFor="result-import-school">School</Label>
              <select id="result-import-school" value={selectedSchool} onChange={(event) => chooseSchool(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Choose a school…</option>
                {schools.map((school) => <option key={school.school_code} value={school.school_code}>{school.name} · {school.school_code}</option>)}
              </select>
            </div>
          )}
          <div>
            <Label htmlFor="result-import-class">Class</Label>
            <select id="result-import-class" value={className} onChange={(event) => chooseClass(event.target.value)} disabled={!schoolCode || loadingContext} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-50">
              <option value="">Choose a class…</option>
              {classes.map((item) => <option key={item.class_name} value={item.class_name}>{item.class_name}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="result-import-term">Term</Label>
            <select id="result-import-term" value={term} onChange={(event) => setTerm(event.target.value)} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {["First Term", "Second Term", "Third Term"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="result-import-session">Academic session</Label>
            <Input id="result-import-session" className="mt-2" value={session} onChange={(event) => setSession(event.target.value)} placeholder="2026/2027" />
          </div>
        </div>

        {className ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs leading-5 text-emerald-900">
            iCademia applies the standard grading scale for this class phase: Primary uses A–E; Secondary uses A1–F9. Scores are entered as CA /40 and Exam /60. For an approved custom school policy, contact iCademia before importing.
          </div>
        ) : null}

        <div className="rounded-xl border border-dashed border-border bg-muted/15 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Label htmlFor="result-image-files" className="inline-flex items-center gap-2 font-semibold">
                <FileImage className="h-4 w-4 text-primary" /> Add result sheet images
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG or WebP · up to 8 images per class batch</p>
              <Input id="result-image-files" className="mt-2 max-w-sm" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={!className || reading || saving} onChange={(event) => void selectFiles(event)} />
            </div>
            <Button type="button" disabled={!className || !term || !session.trim() || images.length === 0 || reading || loadingContext || subjects.length === 0} onClick={() => void readImages()}>
              {reading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <WandSparkles className="mr-2 h-4 w-4" />}
              {reading ? "Reading images…" : "Read images with AI"}
            </Button>
          </div>
          {images.length ? (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {imageNames.map((name, index) => (
                <li key={`${name}-${index}`} className="flex min-w-0 items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
                  <FileImage className="h-4 w-4 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <button type="button" onClick={() => removeImage(index)} className="text-muted-foreground hover:text-destructive" aria-label={`Remove ${name}`}><Trash2 className="h-4 w-4" /></button>
                </li>
              ))}
            </ul>
          ) : null}
          <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
            Images are resized in your browser and sent to the configured AI provider for reading. They are not saved with the result records. Check every extracted value against the original sheet before saving.
          </p>
        </div>

        {rows.length ? (
          <section className="space-y-4" aria-labelledby="ocr-review-heading">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 id="ocr-review-heading" className="font-display text-base font-semibold">Check extracted student results</h3>
                <p className="text-xs text-muted-foreground">Match each student and verify every CA and exam number. Grades are calculated by iCademia’s standard scale.</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">{rows.length} student rows</span>
            </div>
            {rows.map((row, rowIndex) => (
              <Card key={row.rowKey} className="overflow-hidden border-border shadow-none">
                <div className="grid gap-4 border-b bg-muted/20 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(260px,1fr)] lg:items-end">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">Image row {rowIndex + 1}: {row.studentName || "Name unreadable"}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${row.confidence >= 0.8 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                        {Math.round(row.confidence * 100)}% OCR confidence
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{row.className ? `Image class: ${row.className}` : "Confirm this row against the source image."}</p>
                  </div>
                  <div>
                    <Label htmlFor={`ocr-name-${row.rowKey}`}>Student name</Label>
                    <Input id={`ocr-name-${row.rowKey}`} className="mt-2" value={row.studentName} onChange={(event) => patchRow(row.rowKey, { studentName: event.target.value, studentId: "" })} />
                  </div>
                  <div>
                    <Label htmlFor={`ocr-registration-${row.rowKey}`}>Admission / registration number</Label>
                    <Input id={`ocr-registration-${row.rowKey}`} className="mt-2" value={row.registrationNumber} onChange={(event) => patchRow(row.rowKey, { registrationNumber: event.target.value, studentId: "" })} />
                  </div>
                  <div className="lg:col-span-3">
                    <Label htmlFor={`match-${row.rowKey}`}>Match to school student</Label>
                    <select id={`match-${row.rowKey}`} value={row.studentId} onChange={(event) => patchRow(row.rowKey, { studentId: event.target.value })} className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                      <option value="">Choose the correct student…</option>
                      {students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.registration_number}</option>)}
                      {row.studentName.trim() && row.registrationNumber.trim() ? (
                        <option value="__new__">Create a new student record: {row.studentName} · {row.registrationNumber}</option>
                      ) : null}
                    </select>
                    {row.studentId === "__new__" ? <p className="mt-1 text-xs text-primary">This import will add the student to the school roster and create a result for review.</p> : null}
                  </div>
                  {row.warnings.length ? (
                    <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950 lg:col-span-2">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <ul className="list-inside list-disc">{row.warnings.map((warning, index) => <li key={`${row.rowKey}-warning-${index}`}>{warning}</li>)}</ul>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-4 p-4">
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[440px] text-sm">
                      <thead className="bg-muted/40 text-xs text-muted-foreground">
                        <tr><th className="px-3 py-2 text-left font-semibold">Subject</th><th className="px-3 py-2 text-center font-semibold">CA /40</th><th className="px-3 py-2 text-center font-semibold">Exam /60</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {subjects.map((subject) => (
                          <tr key={`${row.rowKey}-${subject.id}`}>
                            <th className="px-3 py-2 text-left text-xs font-medium">{subject.name}</th>
                            <td className="px-3 py-1.5"><Input aria-label={`${row.studentName} ${subject.name} CA`} type="number" min={0} max={40} step={1} value={row.subjectScores[subject.name]?.caScore ?? ""} onChange={(event) => patchScore(row.rowKey, subject.name, "caScore", event.target.value)} className="mx-auto h-9 max-w-24 text-center" /></td>
                            <td className="px-3 py-1.5"><Input aria-label={`${row.studentName} ${subject.name} exam`} type="number" min={0} max={60} step={1} value={row.subjectScores[subject.name]?.examScore ?? ""} onChange={(event) => patchScore(row.rowKey, subject.name, "examScore", event.target.value)} className="mx-auto h-9 max-w-24 text-center" /></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-[180px_180px_minmax(0,1fr)]">
                    <div><Label htmlFor={`present-${row.rowKey}`}>Days present</Label><Input id={`present-${row.rowKey}`} type="number" min={0} step={1} className="mt-2" value={row.attendancePresent} onChange={(event) => patchRow(row.rowKey, { attendancePresent: event.target.value })} placeholder="Optional" /></div>
                    <div><Label htmlFor={`total-days-${row.rowKey}`}>School days</Label><Input id={`total-days-${row.rowKey}`} type="number" min={0} step={1} className="mt-2" value={row.attendanceTotal} onChange={(event) => patchRow(row.rowKey, { attendanceTotal: event.target.value })} placeholder="Optional" /></div>
                    <div><Label htmlFor={`remark-${row.rowKey}`}>Teacher’s remark</Label><Textarea id={`remark-${row.rowKey}`} className="mt-2 min-h-10" rows={2} maxLength={500} value={row.remarks} onChange={(event) => patchRow(row.rowKey, { remarks: event.target.value })} placeholder="Leave blank if none was recorded" /></div>
                  </div>
                </div>
              </Card>
            ))}
            {validationMessage ? (
              <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{validationMessage}</p>
            ) : (
              <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs leading-5 text-emerald-950"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />Every row is matched and complete. Saving still sends these results to the school administrator for approval; they are not published.</p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" disabled={saving} onClick={() => setRows([])}>Discard extracted rows</Button>
              <Button type="button" disabled={saving || !!validationMessage} onClick={() => void saveResults()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {saving ? "Saving results…" : `Save ${rows.length} results for review`}
              </Button>
            </div>
          </section>
        ) : null}
      </div>
    </Card>
  );
}
