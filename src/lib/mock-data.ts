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

export const DEMO_SCHOOL = "Britarch Secondary School";

export const DEMO_RESULT: StudentResult = {
  pin: "ICA-7F4A-29B1",
  regNumber: "BSS/2025/0142",
  studentName: "Adaeze Okonkwo",
  className: "JSS 2 - Diamond",
  session: "2024/2025",
  term: "Second",
  school: DEMO_SCHOOL,
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
  { id: "1", pin: "ICA-7F4A-29B1", serial: "SN-100001", status: "Used", generatedAt: "2025-05-10", usedBy: "BSS/2025/0142" },
  { id: "2", pin: "ICA-9K2D-44C8", serial: "SN-100002", status: "Unused", generatedAt: "2025-05-10" },
  { id: "3", pin: "ICA-3M8X-71E2", serial: "SN-100003", status: "Unused", generatedAt: "2025-05-10" },
  { id: "4", pin: "ICA-5B6Q-08F9", serial: "SN-100004", status: "Revoked", generatedAt: "2025-05-09" },
  { id: "5", pin: "ICA-1A0Z-92H4", serial: "SN-100005", status: "Unused", generatedAt: "2025-05-09" },
  { id: "6", pin: "ICA-8T2P-63J5", serial: "SN-100006", status: "Used", generatedAt: "2025-05-08", usedBy: "BSS/2025/0118" },
];

/** Retail price of a single scratch card (in NGN). */
export const PIN_PRICE_NGN = 2500;
/** Platform fee kept by iCademia per card (in NGN). Schools receive PIN_PRICE_NGN - PLATFORM_FEE_NGN. */
export const PLATFORM_FEE_NGN = 1000;

export const MOCK_STUDENTS = [
  { reg: "BSS/2025/0142", name: "Adaeze Okonkwo", class: "JSS 2 - Diamond", avg: 86.2 },
  { reg: "BSS/2025/0118", name: "Tunde Bakare", class: "JSS 2 - Diamond", avg: 78.4 },
  { reg: "BSS/2025/0207", name: "Fatima Yusuf", class: "JSS 3 - Pearl", avg: 81.0 },
  { reg: "BSS/2025/0089", name: "Ngozi Eze", class: "JSS 1 - Ruby", avg: 73.5 },
  { reg: "BSS/2025/0311", name: "Daniel Adewale", class: "SS 1 - Sapphire", avg: 69.1 },
  { reg: "BSS/2025/0276", name: "Maryam Ibrahim", class: "SS 2 - Emerald", avg: 88.7 },
  { reg: "BSS/2025/0301", name: "Ifeanyi Nwosu", class: "SS 3 - Sapphire", avg: 92.4 },
  { reg: "BSS/2025/0304", name: "Chiamaka Obi", class: "SS 3 - Sapphire", avg: 90.1 },
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
  { id: "t1", staffId: "ICA-TCH-1042", name: "Femi Adekoya", email: "femi@britarch.edu", role: "Form Teacher", subject: "Mathematics", classes: "JSS 1 Ruby", status: "Active" },
  { id: "t2", staffId: "ICA-TCH-1043", name: "Adekunle Bisi", email: "adekunle@britarch.edu", role: "Form Teacher", subject: "English", classes: "JSS 2 Diamond", status: "Active" },
  { id: "t3", staffId: "ICA-TCH-1044", name: "Chinedu Okafor", email: "chinedu@britarch.edu", role: "Head Teacher", subject: "—", classes: "All", status: "Active" },
  { id: "t4", staffId: "ICA-TCH-1045", name: "Mary Bello", email: "mary@britarch.edu", role: "Subject Teacher", subject: "Basic Science", classes: "JSS 1–3", status: "Active" },
  { id: "t5", staffId: "ICA-TCH-1046", name: "Lawal Tope", email: "lawal@britarch.edu", role: "Exam Officer", subject: "—", classes: "SS 1–3", status: "Invited" },
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
  category: "Academics" | "STEM" | "Arts" | "Languages" | "Innovation";
  quote: string;
  /** Dicebear seed for the auto-generated avatar. */
  avatarSeed: string;
}

const dicebear = (seed: string) =>
  `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,ffdfbf,d1d4f9,ffd5dc,c0aede`;

export const HALL_OF_FAME: HallOfFameEntry[] = [
  { rank: 1, name: "Maryam Ibrahim", school: "Britarch Sec.", className: "SS 2 Emerald", session: "2024/2025", award: "Overall Best Student", avg: 96.4, emoji: "👑", category: "Academics", quote: "Discipline compounds — one page, one day at a time.", avatarSeed: "maryam-i" },
  { rank: 2, name: "Adaeze Okonkwo", school: "Britarch Sec.", className: "JSS 2 Diamond", session: "2024/2025", award: "Best in Sciences", avg: 94.1, emoji: "🥇", category: "STEM", quote: "I love questions more than answers.", avatarSeed: "adaeze-o" },
  { rank: 3, name: "Ifeanyi Nwosu", school: "Aurora Academy", className: "SS 3 Sapphire", session: "2024/2025", award: "Math Olympiad Champion", avg: 93.7, emoji: "🥈", category: "STEM", quote: "Every problem hides an elegant pattern.", avatarSeed: "ifeanyi-n" },
  { rank: 4, name: "Aisha Mohammed", school: "Crestwood College", className: "JSS 3 Pearl", session: "2024/2025", award: "Spelling Bee Winner", avg: 92.8, emoji: "🏆", category: "Languages", quote: "Words are worlds. I wanted to hold as many as I could.", avatarSeed: "aisha-m" },
  { rank: 5, name: "Daniel Adewale", school: "Britarch Sec.", className: "SS 1 Sapphire", session: "2024/2025", award: "Coding Hackathon — 1st", avg: 91.5, emoji: "💻", category: "Innovation", quote: "I shipped my first app at 14. Now I want to teach 100 others.", avatarSeed: "daniel-a" },
  { rank: 6, name: "Joy Eze", school: "Aurora Academy", className: "JSS 2 Topaz", session: "2024/2025", award: "Debate Champion", avg: 90.2, emoji: "🎤", category: "Languages", quote: "A soft voice can still change a room.", avatarSeed: "joy-e" },
  { rank: 7, name: "Kunle Bassey", school: "Crestwood College", className: "SS 2 Ruby", session: "2024/2025", award: "Best in Creative Arts", avg: 89.6, emoji: "🎨", category: "Arts", quote: "Colour is how I write down my feelings.", avatarSeed: "kunle-b" },
  { rank: 8, name: "Zainab Okoye", school: "Britarch Sec.", className: "SS 3 Sapphire", session: "2024/2025", award: "Young Innovator", avg: 88.9, emoji: "🚀", category: "Innovation", quote: "I built a solar lamp for my grandma's shop.", avatarSeed: "zainab-o" },
];

export const HALL_OF_FAME_AVATAR = dicebear;

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

export interface Conference {
  id: string;
  title: string;
  focus: string;
  date: string;
  city: string;
  seats: number;
  status: "Registration open" | "Waitlist" | "Concluded";
  blurb: string;
}

export const CONFERENCES: Conference[] = [
  { id: "cf1", title: "Foundation Educators' Summit", focus: "Primary school teachers", date: "September 20, 2025", city: "Lagos", seats: 400, status: "Registration open", blurb: "Two days of workshops on early literacy, phonics, play-based learning and classroom mental health." },
  { id: "cf2", title: "Secondary Teachers Masterclass", focus: "Secondary school teachers", date: "October 11, 2025", city: "Abuja", seats: 300, status: "Registration open", blurb: "Sharpen your subject pedagogy — Mathematics, Sciences, Literature and Civic Education, taught by veterans." },
  { id: "cf3", title: "Head Teachers Leadership Retreat", focus: "Principals & Head Teachers", date: "November 8, 2025", city: "Enugu", seats: 120, status: "Waitlist", blurb: "A curated retreat on running a school like a modern institution — culture, curriculum, hiring, finance." },
  { id: "cf4", title: "EdTech in the Classroom", focus: "All educators", date: "May 2025", city: "Port Harcourt", seats: 250, status: "Concluded", blurb: "Recap of a hands-on training on using AI tools, LMS, and iCademia responsibly in the classroom." },
];

/** Demo answer scripts pre-attached to the current result. */
export const DEMO_ANSWER_SCRIPTS = [
  { id: "as1", name: "Mathematics — Second Term Exam.pdf", size: "2.4 MB", uploadedAt: "2025-05-08" },
  { id: "as2", name: "English Language — Comprehension.pdf", size: "1.8 MB", uploadedAt: "2025-05-08" },
  { id: "as3", name: "Basic Science — Practical Sheet.jpg", size: "1.1 MB", uploadedAt: "2025-05-09" },
  { id: "as4", name: "Computer Studies — Theory.pdf", size: "1.6 MB", uploadedAt: "2025-05-09" },
];

export const STATS = {
  schools: 1,
  students: 1284,
  teachers: 64,
  pinsIssued: 1480,
  pinsUsed: 1102,
};
