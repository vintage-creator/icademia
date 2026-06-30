export type Grade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SubjectScore {
  subject: string;
  ca: number;
  exam: number;
  total: number;
  grade: Grade;
  remark: string;
}

export interface StudentResult {
  pin: string;
  regNumber: string;
  studentName: string;
  className: string;
  session: string;
  term: "First" | "Second" | "Third";
  school: string;
  subjects: SubjectScore[];
  position: string;
  attendance: { present: number; total: number };
  teacherRemark: string;
  principalRemark: string;
}

export const gradeFor = (total: number): { grade: Grade; remark: string } => {
  if (total >= 75) return { grade: "A", remark: "Excellent" };
  if (total >= 65) return { grade: "B", remark: "Very Good" };
  if (total >= 55) return { grade: "C", remark: "Good" };
  if (total >= 45) return { grade: "D", remark: "Pass" };
  if (total >= 40) return { grade: "E", remark: "Fair" };
  return { grade: "F", remark: "Fail" };
};

const subjects = [
  ["Mathematics", 32, 51],
  ["English Language", 30, 48],
  ["Basic Science", 35, 55],
  ["Social Studies", 28, 50],
  ["Civic Education", 33, 47],
  ["Computer Studies", 36, 54],
  ["Agricultural Sci.", 29, 46],
  ["Creative Arts", 34, 49],
] as const;

const buildSubjects = (): SubjectScore[] =>
  subjects.map(([s, ca, exam]) => {
    const total = ca + exam;
    const g = gradeFor(total);
    return { subject: s, ca, exam, total, grade: g.grade, remark: g.remark };
  });

export const DEMO_RESULT: StudentResult = {
  pin: "ICA-7F4A-29B1",
  regNumber: "BHS/2025/0142",
  studentName: "Adaeze Okonkwo",
  className: "JSS 2 - Diamond",
  session: "2024/2025",
  term: "Second",
  school: "Brightfield Comprehensive School",
  subjects: buildSubjects(),
  position: "3rd of 42",
  attendance: { present: 58, total: 60 },
  teacherRemark: "A diligent and focused student. Keep aiming higher.",
  principalRemark: "Impressive performance. Maintain the momentum next term.",
};

export const PIN_DB: Record<string, StudentResult> = {
  [`${DEMO_RESULT.pin}|${DEMO_RESULT.regNumber}`]: DEMO_RESULT,
};

export interface PinCard {
  id: string;
  pin: string;
  serial: string;
  status: "Unused" | "Used" | "Revoked";
  generatedAt: string;
  usedBy?: string;
}

export const MOCK_PINS: PinCard[] = [
  { id: "1", pin: "ICA-7F4A-29B1", serial: "SN-100001", status: "Used", generatedAt: "2025-05-10", usedBy: "BHS/2025/0142" },
  { id: "2", pin: "ICA-9K2D-44C8", serial: "SN-100002", status: "Unused", generatedAt: "2025-05-10" },
  { id: "3", pin: "ICA-3M8X-71E2", serial: "SN-100003", status: "Unused", generatedAt: "2025-05-10" },
  { id: "4", pin: "ICA-5B6Q-08F9", serial: "SN-100004", status: "Revoked", generatedAt: "2025-05-09" },
  { id: "5", pin: "ICA-1A0Z-92H4", serial: "SN-100005", status: "Unused", generatedAt: "2025-05-09" },
  { id: "6", pin: "ICA-8T2P-63J5", serial: "SN-100006", status: "Used", generatedAt: "2025-05-08", usedBy: "BHS/2025/0118" },
];

export const MOCK_STUDENTS = [
  { reg: "BHS/2025/0142", name: "Adaeze Okonkwo", class: "JSS 2 - Diamond", avg: 86.2 },
  { reg: "BHS/2025/0118", name: "Tunde Bakare", class: "JSS 2 - Diamond", avg: 78.4 },
  { reg: "BHS/2025/0207", name: "Fatima Yusuf", class: "JSS 3 - Pearl", avg: 81.0 },
  { reg: "BHS/2025/0089", name: "Ngozi Eze", class: "JSS 1 - Ruby", avg: 73.5 },
  { reg: "BHS/2025/0311", name: "Daniel Adewale", class: "SS 1 - Sapphire", avg: 69.1 },
  { reg: "BHS/2025/0276", name: "Maryam Ibrahim", class: "SS 2 - Emerald", avg: 88.7 },
];

export interface Teacher {
  id: string;
  staffId: string;
  name: string;
  email: string;
  role: "Form Teacher" | "Head Teacher" | "Subject Teacher" | "Exam Officer";
  subject: string;
  classes: string;
  status: "Active" | "Invited" | "Suspended";
}

export const MOCK_TEACHERS: Teacher[] = [
  { id: "t1", staffId: "ICA-TCH-1042", name: "Femi Adekoya", email: "femi@brightfield.edu", role: "Form Teacher", subject: "Mathematics", classes: "JSS 1 Ruby", status: "Active" },
  { id: "t2", staffId: "ICA-TCH-1043", name: "Adekunle Bisi", email: "adekunle@brightfield.edu", role: "Form Teacher", subject: "English", classes: "JSS 2 Diamond", status: "Active" },
  { id: "t3", staffId: "ICA-TCH-1044", name: "Chinedu Okafor", email: "chinedu@brightfield.edu", role: "Head Teacher", subject: "—", classes: "All", status: "Active" },
  { id: "t4", staffId: "ICA-TCH-1045", name: "Mary Bello", email: "mary@brightfield.edu", role: "Subject Teacher", subject: "Basic Science", classes: "JSS 1–3", status: "Active" },
  { id: "t5", staffId: "ICA-TCH-1046", name: "Lawal Tope", email: "lawal@brightfield.edu", role: "Exam Officer", subject: "—", classes: "SS 1–3", status: "Invited" },
];

export interface HallOfFameEntry {
  rank: number;
  name: string;
  school: string;
  className: string;
  session: string;
  award: string;
  avg: number;
  emoji: string;
}

export const HALL_OF_FAME: HallOfFameEntry[] = [
  { rank: 1, name: "Maryam Ibrahim", school: "Brightfield Comp.", className: "SS 2 Emerald", session: "2024/2025", award: "Overall Best Student", avg: 96.4, emoji: "👑" },
  { rank: 2, name: "Adaeze Okonkwo", school: "Brightfield Comp.", className: "JSS 2 Diamond", session: "2024/2025", award: "Best in Sciences", avg: 94.1, emoji: "🥇" },
  { rank: 3, name: "Ifeanyi Nwosu", school: "Aurora Academy", className: "SS 3 Sapphire", session: "2024/2025", award: "Math Olympiad Champion", avg: 93.7, emoji: "🥈" },
  { rank: 4, name: "Aisha Mohammed", school: "Crestwood College", className: "JSS 3 Pearl", session: "2024/2025", award: "Spelling Bee Winner", avg: 92.8, emoji: "🏆" },
  { rank: 5, name: "Daniel Adewale", school: "Brightfield Comp.", className: "SS 1 Sapphire", session: "2024/2025", award: "Coding Hackathon — 1st", avg: 91.5, emoji: "💻" },
  { rank: 6, name: "Joy Eze", school: "Aurora Academy", className: "JSS 2 Topaz", session: "2024/2025", award: "Debate Champion", avg: 90.2, emoji: "🎤" },
];

export interface Competition {
  id: string;
  title: string;
  category: string;
  schools: number;
  prize: string;
  status: "Open" | "Live" | "Closed";
  date: string;
  blurb: string;
}

export const COMPETITIONS: Competition[] = [
  { id: "c1", title: "iCademia Math Olympiad", category: "STEM", schools: 42, prize: "₦500,000 + Scholarship", status: "Open", date: "Registration closes Aug 12", blurb: "A nationwide hunt for the sharpest young problem-solvers across JSS 1 to SS 3." },
  { id: "c2", title: "Pan-African Spelling Bee", category: "Language", schools: 67, prize: "₦300,000 + Trophy", status: "Live", date: "Live now · Quarter-finals", blurb: "Inter-school spelling tournament streamed live across partner schools." },
  { id: "c3", title: "Future Founders Hackathon", category: "Tech", schools: 18, prize: "Laptops + Mentorship", status: "Open", date: "Sept 3 – Sept 5", blurb: "Build, ship and pitch — 48 hours of code, design and storytelling." },
  { id: "c4", title: "Creative Arts Showcase", category: "Arts", schools: 31, prize: "Art Grant + Exhibition", status: "Closed", date: "Concluded May 2025", blurb: "Painting, photography and sculpture from primary and secondary students." },
];

export const STATS = {
  schools: 1,
  students: 1284,
  teachers: 64,
  pinsIssued: 1480,
  pinsUsed: 1102,
};
