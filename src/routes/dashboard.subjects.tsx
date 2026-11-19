import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  BookMarked,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Sparkles,
  Search,
  CheckCircle2,
  Settings2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  deleteSubjectDb,
  getSubjectsDb,
  saveSubjectDb,
  addSubjectPresetBundleDb,
  getClassSubjectSetupDb,
  saveClassSubjectSetupDb,
} from "@/lib/api/db.functions";
import { getSchoolCode } from "@/lib/utils";
import { AcademicWorkspaceNav } from "@/components/academic-workspace-nav";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/dashboard/subjects")({
  head: () => ({ meta: [{ title: "Subjects — iCademia" }] }),
  component: SubjectsPage,
});

type Subject = {
  id: number;
  name: string;
  code: string;
  category: string;
  status: "Active" | "Archived";
};

const blank = { name: "", code: "", category: "Core", status: "Active" as const };

type SubjectsPageCache = {
  schoolCode: string;
  subjects: Subject[];
  classNames: string[];
  classAssignments: Record<string, number[]>;
};

let subjectsPageCache: SubjectsPageCache | null = null;

const autoGenerateSubjectCode = (name: string): string => {
  const clean = name.trim().toLowerCase().replace(/\s+/g, " ");
  if (!clean) return "";
  const map: Record<string, string> = {
    // Mathematics
    mathematics: "MTH",
    mathematucs: "MTH",
    maths: "MTH",
    math: "MTH",
    "general mathematics": "MTH",
    "further mathematics": "FMTH",
    "further maths": "FMTH",
    // Sciences
    "basic science": "BSC",
    "basic science & technology": "BST",
    "basic science and technology": "BST",
    "integrated science": "ISC",
    "agricultural science": "AGRIC",
    "agric science": "AGRIC",
    agriculture: "AGRIC",
    biology: "BIO",
    chemistry: "CHM",
    physics: "PHY",
    "computer studies": "ICT",
    "computer science": "ICT",
    "computer studies / ict": "ICT",
    "information technology": "ICT",
    ict: "ICT",
    // English & Languages
    "english language": "ENG",
    "english studies": "ENG",
    english: "ENG",
    "literature-in-english": "LIT",
    "literature in english": "LIT",
    literature: "LIT",
    french: "FRE",
    yoruba: "YOR",
    igbo: "IGB",
    hausa: "HAU",
    arabic: "ARB",
    // Social Sciences & Humanities
    "civic education": "CIVIC",
    "social studies": "SOS",
    economics: "ECO",
    government: "GOV",
    geography: "GEO",
    history: "HIS",
    "christian religious studies": "CRS",
    "christian religious knowledge": "CRK",
    crs: "CRS",
    crk: "CRK",
    "islamic religious studies": "IRS",
    "islamic religious knowledge": "IRK",
    irs: "IRS",
    irk: "IRK",
    // Commercial & Vocational
    "financial accounting": "ACC",
    accounting: "ACC",
    accounts: "ACC",
    commerce: "COM",
    "commercial studies": "CMS",
    "business studies": "BUS",
    "office practice": "OFP",
    "home economics": "HEC",
    "physical & health education": "PHE",
    "physical and health education": "PHE",
    "physical education": "PE",
    phe: "PHE",
    "fine arts": "ART",
    "creative arts": "ART",
    "cultural & creative arts": "CCA",
    "technical drawing": "TD",
    "introductory technology": "INT TECH",
    "basic technology": "BTECH",
    music: "MUS",
    "food & nutrition": "F&N",
    "foods and nutrition": "F&N",
  };
  if (map[clean]) return map[clean];
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 4);
  }
  return clean.slice(0, 3).toUpperCase();
};

function SubjectsPage() {
  const schoolCode = getSchoolCode();
  const cached = subjectsPageCache?.schoolCode === schoolCode ? subjectsPageCache : null;
  const [subjects, setSubjects] = useState<Subject[]>(cached?.subjects ?? []);
  const [form, setForm] = useState<{ id?: number } & Omit<Subject, "id">>(blank);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [loading, setLoading] = useState(!cached);
  const [saving, setSaving] = useState(false);
  const [presetLoading, setPresetLoading] = useState(false);
  const [classNames, setClassNames] = useState<string[]>(cached?.classNames ?? []);
  const [classAssignments, setClassAssignments] = useState<Record<string, number[]>>(
    cached?.classAssignments ?? {},
  );
  const [classSetupOpen, setClassSetupOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<number[]>([]);
  const [classSetupSaving, setClassSetupSaving] = useState(false);
  const load = useCallback(async () => {
    try {
      const [rows, setup] = await Promise.all([
        getSubjectsDb({ data: { schoolCode } }),
        getClassSubjectSetupDb({ data: { schoolCode } }),
      ]);
      setSubjects(rows as unknown as Subject[]);
      const typedSetup = setup as unknown as {
        classes: Array<{ class_name: string }>;
        assignments: Array<{ class_name: string; subject_id: number }>;
      };
      const nextClassNames = typedSetup.classes.map((item) => item.class_name);
      const nextAssignments = typedSetup.assignments.reduce<Record<string, number[]>>(
        (map, item) => {
          map[item.class_name] = [...(map[item.class_name] ?? []), Number(item.subject_id)];
          return map;
        },
        {},
      );
      setClassNames(nextClassNames);
      setClassAssignments(nextAssignments);
      subjectsPageCache = {
        schoolCode,
        subjects: rows as unknown as Subject[],
        classNames: nextClassNames,
        classAssignments: nextAssignments,
      };
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load subjects.");
    } finally {
      setLoading(false);
    }
  }, [schoolCode]);

  useEffect(() => {
    void load();
  }, [load]);

  const openClassSetup = (className?: string) => {
    const target = className || selectedClass || classNames[0] || "";
    setSelectedClass(target);
    setSelectedSubjectIds(classAssignments[target] ?? []);
    setClassSetupOpen(true);
  };

  const saveClassSetup = async () => {
    if (!selectedClass || selectedSubjectIds.length === 0) {
      toast.error("Choose a class and at least one subject.");
      return;
    }
    setClassSetupSaving(true);
    try {
      await saveClassSubjectSetupDb({
        data: { schoolCode, className: selectedClass, subjectIds: selectedSubjectIds },
      });
      toast.success(`${selectedClass} subject offering saved`, {
        description: "Result completeness will now check only these subjects.",
      });
      await load();
      setClassSetupOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save class subjects.");
    } finally {
      setClassSetupSaving(false);
    }
  };

  const handleNameChange = (val: string) => {
    const generated = autoGenerateSubjectCode(val);
    setForm((prev) => {
      const prevGenerated = autoGenerateSubjectCode(prev.name);
      const shouldAutoCode = !prev.code || prev.code === prevGenerated;
      return {
        ...prev,
        name: val,
        code: shouldAutoCode ? generated : prev.code,
      };
    });
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveSubjectDb({ data: { schoolCode, ...form } });
      toast.success(form.id ? "Subject updated" : "Subject added");
      setForm(blank);
      await load();
    } catch (error) {
      toast.error("Could not save subject", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  const loadPreset = async (
    presetKey: "nigerian_sec" | "nigerian_pri" | "british",
    label: string,
  ) => {
    setPresetLoading(true);
    try {
      const res = await addSubjectPresetBundleDb({ data: { schoolCode, preset: presetKey } });
      toast.success(`Loaded ${label}`, {
        description: `Subject catalogue updated. Existing subjects preserved.`,
      });
      await load();
    } catch (err) {
      toast.error("Could not load preset subjects", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setPresetLoading(false);
    }
  };

  const remove = async (subject: Subject) => {
    if (!window.confirm(`Remove ${subject.name}? Existing published results will not be changed.`))
      return;
    await deleteSubjectDb({ data: { schoolCode, id: subject.id } });
    toast.success("Subject removed");
    await load();
  };

  const filtered = subjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "All" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <>
      <AcademicWorkspaceNav />
      <div className="space-y-7 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Academic setup
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold">Subjects</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Define the subjects your school teaches. Subject codes auto-generate as you type and
              remain fully editable.
            </p>
          </div>

          {/* 1-Click Preset Setup */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={presetLoading}
              onClick={() => loadPreset("nigerian_sec", "Nigerian Secondary Subjects (WAEC/BECE)")}
              className="border-primary/30 text-xs gap-1.5 shadow-sm hover:bg-primary/5"
            >
              {presetLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              )}
              + Load Nigerian Secondary Preset
            </Button>
            <Button
              variant="outline"
              disabled={presetLoading}
              onClick={() => loadPreset("nigerian_pri", "Nigerian Primary Subjects")}
              className="border-border text-xs gap-1.5 shadow-sm hover:bg-muted/50"
            >
              + Load Primary Preset
            </Button>
          </div>
        </header>

        <Card className="border-primary/20 p-5 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold">Subjects offered by each class</h2>
                <p className="mt-1 max-w-2xl text-xs leading-relaxed text-muted-foreground">
                  This controls the Head Teacher score sheet and the School Admin completeness
                  check. A student is never expected to take every subject in the school catalogue.
                </p>
              </div>
            </div>
            <Button onClick={() => openClassSetup()} className="w-full gap-2 sm:w-auto">
              <Settings2 className="h-4 w-4" /> Configure class subjects
            </Button>
          </div>
          {classNames.length > 0 ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {classNames.map((className) => {
                const count = classAssignments[className]?.length ?? 0;
                return (
                  <button
                    key={className}
                    type="button"
                    onClick={() => openClassSetup(className)}
                    className="flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
                  >
                    <span className="text-sm font-semibold">{className}</span>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${count ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}
                    >
                      {count ? `${count} configured` : "Setup needed"}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">
              Create or enrol a class before assigning its subjects.
            </p>
          )}
        </Card>

        <div className="grid gap-6 xl:grid-cols-[22rem_1fr]">
          <Card className="h-fit border-border p-5 shadow-card">
            <h2 className="font-display text-lg font-semibold">
              {form.id ? "Edit subject" : "Add a subject"}
            </h2>
            <form onSubmit={save} className="mt-5 space-y-4">
              <div>
                <Label>Subject name</Label>
                <Input
                  className="mt-2"
                  value={form.name}
                  onChange={(event) => handleNameChange(event.target.value)}
                  placeholder="e.g. Mathematics, Basic Science"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Short code</Label>
                  <span className="text-[10px] text-muted-foreground italic">
                    Auto-generated & editable
                  </span>
                </div>
                <Input
                  className="mt-2 font-mono uppercase"
                  value={form.code}
                  onChange={(event) => setForm({ ...form, code: event.target.value.toUpperCase() })}
                  placeholder="MTH"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(category) => setForm({ ...form, category })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Core">Core</SelectItem>
                    <SelectItem value="Science">Science</SelectItem>
                    <SelectItem value="Language">Language</SelectItem>
                    <SelectItem value="Humanities">Humanities</SelectItem>
                    <SelectItem value="Vocational">Vocational</SelectItem>
                    <SelectItem value="Elective">Elective</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                {form.id ? "Save changes" : "Add subject"}
              </Button>
              {form.id ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setForm(blank)}
                >
                  Cancel editing
                </Button>
              ) : null}
            </form>
          </Card>

          <Card className="border-border p-5 shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border">
              <div>
                <h2 className="font-display text-lg font-semibold">Subject catalogue</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {subjects.length} active subject records
                </p>
              </div>
              <BookMarked className="h-5 w-5 text-primary" />
            </div>

            {/* Search & Category Filter Bar */}
            <div className="flex flex-wrap gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by name or code..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Core">Core</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="Language">Language</SelectItem>
                  <SelectItem value="Humanities">Humanities</SelectItem>
                  <SelectItem value="Vocational">Vocational</SelectItem>
                  <SelectItem value="Elective">Elective</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {loading ? (
              <div className="grid min-h-56 place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="grid min-h-56 place-items-center text-center text-sm text-muted-foreground">
                {subjects.length === 0
                  ? "Add your first subject or load a curriculum preset to start."
                  : "No subjects match your filter search."}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filtered.map((subject) => (
                  <div key={subject.id} className="flex items-center gap-4 py-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-mono text-xs font-bold text-primary">
                      {subject.code || subject.name.slice(0, 3).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{subject.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {subject.category}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Code: {subject.code}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Edit ${subject.name}`}
                      onClick={() => setForm(subject)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${subject.name}`}
                      onClick={() => void remove(subject)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <Dialog open={classSetupOpen} onOpenChange={setClassSetupOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure subjects offered by class</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Class</Label>
              <Select
                value={selectedClass}
                onValueChange={(value) => {
                  setSelectedClass(value);
                  setSelectedSubjectIds(classAssignments[value] ?? []);
                }}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  {classNames.map((className) => (
                    <SelectItem key={className} value={className}>
                      {className}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <Label>Subjects students in this class take</Label>
                <span className="text-xs text-muted-foreground">
                  {selectedSubjectIds.length} selected
                </span>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {subjects
                  .filter((item) => item.status === "Active")
                  .map((subject) => {
                    const selected = selectedSubjectIds.includes(subject.id);
                    return (
                      <button
                        key={subject.id}
                        type="button"
                        onClick={() =>
                          setSelectedSubjectIds((items) =>
                            selected
                              ? items.filter((id) => id !== subject.id)
                              : [...items, subject.id],
                          )
                        }
                        className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"}`}
                      >
                        <span
                          className={`grid h-5 w-5 shrink-0 place-items-center rounded border ${selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"}`}
                        >
                          {selected ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {subject.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {subject.code || subject.category}
                          </span>
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>
            <Button
              onClick={saveClassSetup}
              disabled={classSetupSaving}
              className="w-full sm:w-auto"
            >
              {classSetupSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save class subjects
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
