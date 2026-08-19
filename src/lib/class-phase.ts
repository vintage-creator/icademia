/**
 * class-phase.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for school class phase detection and phase-specific
 * grading across iCademia.
 *
 * Phases:
 *   primary        – Basic/Primary 1–4
 *   primary-exit   – Basic/Primary 5–6 (Common Entrance)
 *   junior         – JSS 1–2
 *   junior-exit    – JSS 3 (BECE / Junior WAEC / NECO JSCE)
 *   senior         – SS 1–2
 *   senior-exit    – SS 3 (WAEC / NECO WASSCE)
 */

export type ClassPhase =
  | "primary"
  | "primary-exit"
  | "junior"
  | "junior-exit"
  | "senior"
  | "senior-exit";

// ─── Phase detection ──────────────────────────────────────────────────────────

export function detectPhase(className: string): ClassPhase {
  const c = className.toLowerCase().trim();

  // Primary exit — Basic/Pry 5 or 6
  if (/\b(basic|primary|pry|b)\s*[56]\b/.test(c)) return "primary-exit";

  // Primary general — Basic/Pry 1–4
  if (/\b(basic|primary|pry|b)\s*[1-4]\b/.test(c)) return "primary";

  // JSS 3 / Junior exit
  if (/\bjss\s*3\b/.test(c)) return "junior-exit";

  // JSS 1–2
  if (/\bjss\s*[12]\b/.test(c)) return "junior";

  // SS 3 / Senior exit
  if (/\bss\s*3\b/.test(c)) return "senior-exit";

  // SS 1–2
  if (/\bss\s*[12]\b/.test(c)) return "senior";

  // Fallback — treat unknown as junior secondary
  return "junior";
}

// ─── Phase metadata ───────────────────────────────────────────────────────────

export const PHASE_META: Record<
  ClassPhase,
  {
    label: string;
    shortLabel: string;
    color: string;
    textColor: string;
    externalExam: string | null;
    externalExamShort: string | null;
    hasTranscript: boolean;
    hasMockColumn: boolean;
    hasPractical: boolean;
    hasExternalRegField: boolean;
    gradeScaleLabel: string;
    assessmentLabel: string;
    maxCA: number;
    maxExam: number;
    /** Default signing authority if the school hasn't configured a custom title. */
    defaultSignerTitle: string;
  }
> = {
  primary: {
    label: "Primary School",
    shortLabel: "Primary",
    color: "bg-violet-100",
    textColor: "text-violet-700",
    externalExam: null,
    externalExamShort: null,
    hasTranscript: false,
    hasMockColumn: false,
    hasPractical: false,
    hasExternalRegField: false,
    gradeScaleLabel: "5-point letter scale",
    assessmentLabel: "1st CA /20 · 2nd CA /20 · Exam /60",
    maxCA: 40,
    maxExam: 60,
    defaultSignerTitle: "Head Teacher",
  },
  "primary-exit": {
    label: "Primary Exit Year",
    shortLabel: "Common Entrance",
    color: "bg-fuchsia-100",
    textColor: "text-fuchsia-700",
    externalExam: "Common Entrance Examination",
    externalExamShort: "Common Entrance",
    hasTranscript: false,
    hasMockColumn: true,
    hasPractical: false,
    hasExternalRegField: true,
    gradeScaleLabel: "5-point letter scale",
    assessmentLabel: "1st CA /20 · 2nd CA /20 · Exam /60",
    maxCA: 40,
    maxExam: 60,
    defaultSignerTitle: "Head Teacher",
  },
  junior: {
    label: "Junior Secondary",
    shortLabel: "JSS",
    color: "bg-sky-100",
    textColor: "text-sky-700",
    externalExam: null,
    externalExamShort: null,
    hasTranscript: false,
    hasMockColumn: false,
    hasPractical: false,
    hasExternalRegField: false,
    gradeScaleLabel: "9-point standard scale (A1–F9)",
    assessmentLabel: "CA /40 · Exam /60",
    maxCA: 40,
    maxExam: 60,
    defaultSignerTitle: "Principal",
  },
  "junior-exit": {
    label: "JSS 3 — BECE Year",
    shortLabel: "BECE / Jr. WAEC",
    color: "bg-amber-100",
    textColor: "text-amber-700",
    externalExam: "BECE / Junior WAEC / NECO JSCE",
    externalExamShort: "BECE",
    hasTranscript: false,
    hasMockColumn: true,
    hasPractical: false,
    hasExternalRegField: true,
    gradeScaleLabel: "9-point BECE scale (A1–F9)",
    assessmentLabel: "CA /40 · Exam /60 · Mock",
    maxCA: 40,
    maxExam: 60,
    defaultSignerTitle: "Principal",
  },
  senior: {
    label: "Senior Secondary",
    shortLabel: "SS",
    color: "bg-blue-100",
    textColor: "text-blue-700",
    externalExam: null,
    externalExamShort: null,
    hasTranscript: false,
    hasMockColumn: false,
    hasPractical: true,
    hasExternalRegField: false,
    gradeScaleLabel: "9-point standard scale (A1–F9)",
    assessmentLabel: "CA /40 · Exam /60",
    maxCA: 40,
    maxExam: 60,
    defaultSignerTitle: "Principal",
  },
  "senior-exit": {
    label: "SS 3 — WAEC / NECO Year",
    shortLabel: "WAEC / NECO",
    color: "bg-emerald-100",
    textColor: "text-emerald-700",
    externalExam: "WAEC / NECO WASSCE",
    externalExamShort: "WAEC/NECO",
    hasTranscript: true,
    hasMockColumn: true,
    hasPractical: true,
    hasExternalRegField: true,
    gradeScaleLabel: "9-point WAEC scale (A1–F9)",
    assessmentLabel: "CA /40 · Exam /60 · Mock",
    maxCA: 40,
    maxExam: 60,
    defaultSignerTitle: "Principal",
  },
};


// ─── Grading ──────────────────────────────────────────────────────────────────

export type SecondaryGrade = "A1" | "B2" | "B3" | "C4" | "C5" | "C6" | "D7" | "E8" | "F9";
export type PrimaryGrade = "A" | "B" | "C" | "D" | "E";
export type AnyGrade = SecondaryGrade | PrimaryGrade;

export interface GradeResult {
  grade: AnyGrade;
  remark: string;
  isPrimary: boolean;
}

/** Phase-aware grade calculator — returns the appropriate grade and remark. */
export function gradeForPhase(score: number, phase: ClassPhase): GradeResult {
  const isPrimary = phase === "primary" || phase === "primary-exit";

  if (isPrimary) {
    if (score >= 75) return { grade: "A", remark: "Excellent", isPrimary: true };
    if (score >= 60) return { grade: "B", remark: "Very Good", isPrimary: true };
    if (score >= 50) return { grade: "C", remark: "Good", isPrimary: true };
    if (score >= 40) return { grade: "D", remark: "Pass", isPrimary: true };
    return { grade: "E", remark: "Needs Improvement", isPrimary: true };
  }

  // Secondary — 9-point WAEC scale
  if (score >= 75) return { grade: "A1", remark: "Excellent", isPrimary: false };
  if (score >= 70) return { grade: "B2", remark: "Very Good", isPrimary: false };
  if (score >= 65) return { grade: "B3", remark: "Good", isPrimary: false };
  if (score >= 60) return { grade: "C4", remark: "Credit", isPrimary: false };
  if (score >= 55) return { grade: "C5", remark: "Credit", isPrimary: false };
  if (score >= 50) return { grade: "C6", remark: "Credit", isPrimary: false };
  if (score >= 45) return { grade: "D7", remark: "Pass", isPrimary: false };
  if (score >= 40) return { grade: "E8", remark: "Pass", isPrimary: false };
  return { grade: "F9", remark: "Fail", isPrimary: false };
}

/** Colour classes for any grade badge. */
export function gradeBadgeClass(grade: AnyGrade): string {
  switch (grade) {
    case "A1":
    case "A":
      return "bg-emerald-100 text-emerald-700 border border-emerald-200";
    case "B2":
    case "B3":
    case "B":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "C4":
    case "C5":
    case "C6":
    case "C":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    case "D7":
    case "D":
      return "bg-orange-100 text-orange-700 border border-orange-200";
    case "E8":
    case "E":
      return "bg-red-50 text-red-600 border border-red-200";
    default:
      return "bg-red-100 text-red-700 border border-red-200";
  }
}

/** Bar colour based on score (phase-independent). */
export function scoreBarClass(score: number): string {
  if (score >= 75) return "bg-emerald-500";
  if (score >= 65) return "bg-blue-500";
  if (score >= 55) return "bg-amber-500";
  if (score >= 45) return "bg-orange-500";
  return "bg-red-500";
}

/** Grade key rows for the result sheet footer — phase-aware. */
export function gradeKeyRows(phase: ClassPhase) {
  const isPrimary = phase === "primary" || phase === "primary-exit";
  if (isPrimary) {
    return [
      { g: "A", r: "75–100", color: "text-emerald-600" },
      { g: "B", r: "60–74", color: "text-blue-600" },
      { g: "C", r: "50–59", color: "text-amber-600" },
      { g: "D", r: "40–49", color: "text-orange-600" },
      { g: "E", r: "0–39", color: "text-red-600" },
    ];
  }
  return [
    { g: "A1", r: "75–100", color: "text-emerald-600" },
    { g: "B2", r: "70–74", color: "text-blue-600" },
    { g: "B3", r: "65–69", color: "text-blue-600" },
    { g: "C4", r: "60–64", color: "text-amber-600" },
    { g: "C5", r: "55–59", color: "text-amber-600" },
    { g: "C6", r: "50–54", color: "text-amber-600" },
    { g: "D7", r: "45–49", color: "text-orange-600" },
    { g: "E8", r: "40–44", color: "text-orange-600" },
    { g: "F9", r: "0–39", color: "text-red-600" },
  ];
}
