import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { BookOpen, Loader2, Pencil, UserRoundCog, Users2, Plus, Printer, Eye, UserCheck, Shield, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getClassSummaryDb, renameClassDb, getTeachersDb, assignClassTeacherDb, getStudentsDb, deleteClassDb } from "@/lib/api/db.functions";
import { getSchoolCode } from "@/lib/utils";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/classes")({
  head: () => ({ meta: [{ title: "Classes & Responsibilities — iCademia" }] }),
  component: ClassesPage,
});

type ClassSummary = {
  class_name: string;
  students: number;
  class_heads: string;
};

type Teacher = {
  id: number;
  name: string;
  role: string;
  assigned_classes?: string;
};

type Student = {
  id: number;
  name: string;
  registration_number: string;
  class_name: string;
};

function ClassesPage() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [editing, setEditing] = useState<ClassSummary | null>(null);
  const [newName, setNewName] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [savingClass, setSavingClass] = useState(false);

  // New Class Arm Modal (Structured)
  const [addClassOpen, setAddClassOpen] = useState(false);
  const [parentClass, setParentClass] = useState("JSS 1");
  const [customParent, setCustomParent] = useState("");
  const [branchName, setBranchName] = useState("");

  // Roster Modal
  const [rosterClass, setRosterClass] = useState<string | null>(null);

  // Delete Confirmation Modal
  const [deletingClass, setDeletingClass] = useState<string | null>(null);

  const parseClassName = (fullName: string) => {
    const clean = fullName.trim();
    
    const capitalizeWords = (str: string) => {
      return str.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    };

    const match = clean.match(/^(JSS\s*\d|SSS\s*\d|Primary\s*\d|Grade\s*\d|Basic\s*\d|Nursery\s*\d|Creche|Toddler|Kindergarten)(?:\s+(.+))?$/i);
    if (match) {
      let parent = match[1].toUpperCase().replace(/\s+/g, "");
      parent = parent.replace(/^([A-Z]+)(\d+)$/, "$1 $2");
      const arm = match[2] ? capitalizeWords(match[2]) : "Main";
      return { parent, arm };
    }
    
    const spaceIdx = clean.indexOf(" ");
    if (spaceIdx > 0) {
      let parent = clean.substring(0, spaceIdx).toUpperCase().replace(/\s+/g, "");
      parent = parent.replace(/^([A-Z]+)(\d+)$/, "$1 $2");
      const arm = capitalizeWords(clean.substring(spaceIdx + 1));
      return { parent, arm };
    }
    
    let parent = clean.toUpperCase().replace(/\s+/g, "");
    parent = parent.replace(/^([A-Z]+)(\d+)$/, "$1 $2");
    return { parent, arm: "Main" };
  };

  const groupedClasses = useMemo(() => {
    const map: Record<string, ClassSummary[]> = {};
    for (const item of classes) {
      const { parent } = parseClassName(item.class_name);
      const key = parent.toUpperCase();
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(item);
    }
    return map;
  }, [classes]);

  const schoolCode = getSchoolCode();

  const load = async () => {
    setLoading(true);
    try {
      const [classRows, teacherRows, studentRows] = await Promise.all([
        getClassSummaryDb({ data: { schoolCode } }),
        getTeachersDb({ data: { schoolCode } }),
        getStudentsDb({ data: { schoolCode } }),
      ]);
      setClasses(classRows as unknown as ClassSummary[]);
      setTeachers(teacherRows as unknown as Teacher[]);
      setAllStudents(studentRows as unknown as Student[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [schoolCode]);

  const handleEditClass = (item: ClassSummary) => {
    setEditing(item);
    setNewName(item.class_name);
    setSelectedTeacherId("");
  };

  const saveClassDetails = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    setSavingClass(true);
    try {
      // 1. Rename if name changed
      if (newName.trim() !== editing.class_name) {
        await renameClassDb({
          data: {
            schoolCode,
            currentName: editing.class_name,
            newName: newName.trim(),
          },
        });
      }

      // 2. Assign Form Teacher if selected
      if (selectedTeacherId) {
        await assignClassTeacherDb({
          data: {
            schoolCode,
            className: newName.trim() || editing.class_name,
            teacherId: Number(selectedTeacherId),
          },
        });
      }

      toast.success("Class record updated", {
        description: "Class details and teacher assignment updated successfully.",
      });
      setEditing(null);
      await load();
    } catch (err) {
      toast.error("Failed to update class", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSavingClass(false);
    }
  };

  const handleCreateNewClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const pGroup = parentClass === "Custom" ? customParent.trim() : parentClass;
    if (!pGroup) {
      toast.error("Please specify a year group.");
      return;
    }
    const finalClassName = branchName.trim() ? `${pGroup} ${branchName.trim()}` : pGroup;

    setSavingClass(true);
    try {
      if (selectedTeacherId) {
        await assignClassTeacherDb({
          data: {
            schoolCode,
            className: finalClassName,
            teacherId: Number(selectedTeacherId),
          },
        });
      }
      toast.success(`Class section "${finalClassName}" created`, {
        description: "Enrol students to this section anytime from the Students page."
      });
      setAddClassOpen(false);
      setParentClass("JSS 1");
      setCustomParent("");
      setBranchName("");
      setSelectedTeacherId("");
      await load();
    } catch (err) {
      toast.error("Failed to create class section", {
        description: err instanceof Error ? err.message : "Please try again."
      });
    } finally {
      setSavingClass(false);
    }
  };

  const handleDeleteClass = async (className: string) => {
    setSavingClass(true);
    try {
      await deleteClassDb({ data: { schoolCode, className } });
      toast.success(`Class section "${className}" deleted`, {
        description: "Class cleared from all student and staff references successfully."
      });
      setDeletingClass(null);
      await load();
    } catch (err) {
      toast.error("Failed to delete class", {
        description: err instanceof Error ? err.message : "Please try again."
      });
    } finally {
      setSavingClass(false);
    }
  };

  const printAttendanceRegister = (className: string) => {
    const classStudents = allStudents.filter(s => s.class_name === className);
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>${className} — Official Class Register</title>
          <style>
            body { font-family: sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            p { font-size: 12px; color: #666; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 12px; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background: #f0f0f5; font-weight: bold; }
            .col-box { width: 24px; text-align: center; }
          </style>
        </head>
        <body>
          <h1>Official Attendance Register — ${className}</h1>
          <p>Total Enrolled Students: ${classStudents.length} · Date: ___________________</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Reg No.</th>
                <th>Student Full Name</th>
                <th class="col-box">M</th>
                <th class="col-box">T</th>
                <th class="col-box">W</th>
                <th class="col-box">T</th>
                <th class="col-box">F</th>
                <th>Teacher's Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${classStudents.map((s, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td style="font-family:monospace">${s.registration_number}</td>
                  <td><strong>${s.name}</strong></td>
                  <td class="col-box"></td>
                  <td class="col-box"></td>
                  <td class="col-box"></td>
                  <td class="col-box"></td>
                  <td class="col-box"></td>
                  <td></td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const rosterStudents = rosterClass ? allStudents.filter(s => s.class_name === rosterClass) : [];

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Academic structure
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Classes & responsibilities
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage class sections, assigned Form Teachers, student enrolment counts, and print attendance registers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setAddClassOpen(true)}
            className="shadow-sm border-border text-xs gap-1.5"
          >
            <Plus className="h-4 w-4 text-primary" />
            New Class Arm / Section
          </Button>
          <Button asChild className="gradient-primary text-primary-foreground shadow-elegant text-xs">
            <Link to="/dashboard/teachers">
              <UserRoundCog className="mr-1.5 h-4 w-4" />
              Manage Staff Roles
            </Link>
          </Button>
        </div>
      </header>

      {loading ? (
        <Card className="grid min-h-56 place-items-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </Card>
      ) : classes.length === 0 ? (
        <Card className="border-dashed p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-4 font-display text-lg font-semibold">No classes configured yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Classes appear automatically as students are added, or you can create class arms manually.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button variant="outline" onClick={() => setAddClassOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Create Class Arm
            </Button>
            <Button asChild variant="default">
              <Link to="/dashboard/students">Enrol Students</Link>
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedClasses).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })).map((parentGroup) => (
            <div key={parentGroup} className="space-y-4">
              <div className="flex items-center gap-2 border-b border-border/80 pb-2">
                <span className="p-1 rounded-lg bg-primary/10 text-primary">
                  <Layers className="h-4 w-4" />
                </span>
                <h3 className="font-display font-bold text-foreground text-sm uppercase tracking-wider">
                  {parentGroup} Group
                </h3>
                <span className="text-[10px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-muted border border-border/60">
                  {groupedClasses[parentGroup].length} {groupedClasses[parentGroup].length === 1 ? "branch" : "branches"}
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {groupedClasses[parentGroup].map((item) => {
                  const hasHead = item.class_heads && item.class_heads !== "Not assigned";
                  const { arm } = parseClassName(item.class_name);
                  return (
                    <Card key={item.class_name} className="border-border p-5 shadow-card flex flex-col justify-between space-y-4 transition-all hover:shadow-md hover:border-primary/20">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-display text-lg font-bold text-foreground flex items-baseline gap-1.5">
                              <span>{item.class_name}</span>
                              {arm && arm !== "Main" && (
                                <span className="text-xs font-semibold text-muted-foreground">({arm} Arm)</span>
                              )}
                            </p>
                            <span className="inline-block mt-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                              {item.students} Students Enrolled
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${item.class_name}`}
                            onClick={() => handleEditClass(item)}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </div>

                        <div className="mt-4 space-y-2 border-t border-border pt-3">
                          <div className="flex items-center gap-2 text-xs">
                            <UserCheck className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-muted-foreground">Form Teacher:</span>
                            <span className={`font-semibold ${hasHead ? "text-foreground" : "text-muted-foreground italic"}`}>
                              {item.class_heads}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRosterClass(item.class_name)}
                          className="flex-1 text-xs gap-1.5 h-8 font-semibold"
                        >
                          <Eye className="h-3.5 w-3.5" /> View Roster
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => printAttendanceRegister(item.class_name)}
                          className="text-xs gap-1.5 h-8 text-muted-foreground hover:text-foreground font-semibold"
                          title="Print Attendance Register"
                        >
                          <Printer className="h-3.5 w-3.5" /> Print Roll Call
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Class & Assign Teacher Dialog */}
      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Class Settings & Responsibility</DialogTitle>
          </DialogHeader>
          <form onSubmit={saveClassDetails} className="space-y-4">
            <div>
              <Label className="text-xs font-semibold">Class Section Name</Label>
              <Input
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="e.g. JSS 1 Gold"
                required
                className="mt-1.5"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                Renaming will update all student records and teacher assignments for this class.
              </p>
            </div>

            <div>
              <Label className="text-xs font-semibold">Assign Form Teacher / Class Master</Label>
              <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Select a teacher from staff list..." />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.name} ({t.role || "Teacher"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-destructive hover:bg-destructive hover:text-white text-xs h-9 text-destructive font-semibold flex-1"
                onClick={() => {
                  if (editing) {
                    setDeletingClass(editing.class_name);
                    setEditing(null);
                  }
                }}
                disabled={savingClass}
              >
                Delete Class Arm
              </Button>
              <Button type="submit" disabled={savingClass} className="flex-1">
                {savingClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add New Class Arm Dialog */}
      <Dialog open={addClassOpen} onOpenChange={setAddClassOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Class Arm / Section</DialogTitle>
          </DialogHeader>
          {teachers.length === 0 ? (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-800 dark:text-amber-300 space-y-2.5">
              <p className="font-semibold">Staff Setup Required</p>
              <p>Every class section requires an assigned Form Teacher to initialize in the database. Please add a teacher to your faculty roster first.</p>
              <Button asChild size="sm" variant="outline" className="w-full text-xs font-semibold border-amber-500/30 text-amber-800 dark:text-amber-200">
                <Link to="/dashboard/teachers">Invite Faculty & Teachers</Link>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCreateNewClass} className="space-y-4 text-xs">
              <div>
                <Label className="text-xs font-semibold">Class Group / Grade Level</Label>
                <Select value={parentClass} onValueChange={setParentClass}>
                  <SelectTrigger className="mt-1.5 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="JSS 1">JSS 1</SelectItem>
                    <SelectItem value="JSS 2">JSS 2</SelectItem>
                    <SelectItem value="JSS 3">JSS 3</SelectItem>
                    <SelectItem value="SSS 1">SSS 1</SelectItem>
                    <SelectItem value="SSS 2">SSS 2</SelectItem>
                    <SelectItem value="SSS 3">SSS 3</SelectItem>
                    <SelectItem value="Primary 1">Primary 1</SelectItem>
                    <SelectItem value="Primary 2">Primary 2</SelectItem>
                    <SelectItem value="Primary 3">Primary 3</SelectItem>
                    <SelectItem value="Primary 4">Primary 4</SelectItem>
                    <SelectItem value="Primary 5">Primary 5</SelectItem>
                    <SelectItem value="Primary 6">Primary 6</SelectItem>
                    <SelectItem value="Nursery 1">Nursery 1</SelectItem>
                    <SelectItem value="Nursery 2">Nursery 2</SelectItem>
                    <SelectItem value="Nursery 3">Nursery 3</SelectItem>
                    <SelectItem value="Creche">Creche</SelectItem>
                    <SelectItem value="Toddler">Toddler</SelectItem>
                    <SelectItem value="Custom">Custom Group...</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {parentClass === "Custom" && (
                <div>
                  <Label className="text-xs font-semibold">Specify Custom Group *</Label>
                  <Input
                    value={customParent}
                    onChange={(e) => setCustomParent(e.target.value)}
                    placeholder="e.g. Grade 7, Basic 1"
                    required
                    className="mt-1.5 text-xs"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs font-semibold">Arm / Branch Name (Optional)</Label>
                <Input
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Gold, Pink, Emerald, Science A"
                  className="mt-1.5 text-xs"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Leave blank if this year group has only one main section.
                </p>
              </div>

              {/* Dynamic registration name preview */}
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">System Registration Preview</p>
                <p className="text-sm font-bold text-foreground">
                  {(() => {
                    const group = parentClass === "Custom" ? customParent.trim() : parentClass;
                    const arm = branchName.trim();
                    return (group ? `${group} ${arm}` : "—").trim();
                  })()}
                </p>
                <p className="text-[9px] text-muted-foreground leading-relaxed">
                  *This combined name will be saved in student registers and academic transcripts for full system compatibility.
                </p>
              </div>

              <div>
                <Label className="text-xs font-semibold">Form Teacher *</Label>
                <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Assign a teacher..." />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name} ({t.role || "Teacher"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1.5 text-[11px] text-muted-foreground leading-relaxed">
                  Every class section requires a Form Teacher to initialize. You can reassign teachers or enroll students from their rosters at any time.
                </p>
              </div>
              <Button type="submit" disabled={savingClass || !selectedTeacherId} className="w-full font-semibold">
                {savingClass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Class Section"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Roster View Dialog */}
      <Dialog open={Boolean(rosterClass)} onOpenChange={(open) => !open && setRosterClass(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between pr-6">
              <span>{rosterClass} — Enrolled Student Roster</span>
              <span className="text-xs font-normal text-muted-foreground">{rosterStudents.length} Students</span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2 pr-1">
            {rosterStudents.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <p className="text-sm text-muted-foreground">
                  No students enrolled in {rosterClass} yet.
                </p>
                <Button asChild size="sm" className="gradient-primary text-primary-foreground shadow-sm text-xs gap-1.5 font-semibold">
                  <Link to="/dashboard/students" onClick={() => setRosterClass(null)}>
                    Go to Student Roster to Enroll
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {rosterStudents.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between py-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-muted-foreground text-[10px] w-5 text-right">{idx + 1}.</span>
                      <div>
                        <p className="font-semibold text-foreground">{s.name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{s.registration_number}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Delete Class Confirmation Dialog */}
      <Dialog open={Boolean(deletingClass)} onOpenChange={(open) => !open && setDeletingClass(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/10 text-destructive">
                <Shield className="h-4 w-4" />
              </span>
              <span>Confirm Delete Class Arm</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              Are you sure you want to delete the class section <strong className="text-foreground">"{deletingClass}"</strong>? This action will:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-xs border border-border rounded-xl p-4 bg-muted/40 my-1 leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="text-destructive font-bold">•</span>
              <span><strong>Students:</strong> Clears the assigned class from all students currently enrolled in this section. Their profiles will remain active, but they will become unassigned.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-destructive font-bold">•</span>
              <span><strong>Teachers:</strong> Removes this section from all assigned Form Teacher registers.</span>
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingClass(null)} className="flex-1 text-xs font-semibold">
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deletingClass && handleDeleteClass(deletingClass)}
              disabled={savingClass}
              className="flex-1 text-xs font-semibold gap-1.5"
            >
              {savingClass ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
