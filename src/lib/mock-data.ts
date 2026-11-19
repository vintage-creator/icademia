import { getCurrentAcademicSession } from "./utils";

export type Grade = "A" | "B" | "C" | "D" | "E" | "F";

export interface SubjectScore {
  subject: string;
  ca: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
  classAverage?: number;
  classHighest?: number;
  classLowest?: number;
  classPosition?: number;
  classSize?: number;
}

export interface StudentResult {
  pin: string;
  regNumber: string;
  studentName: string;
  className: string;
  session: string;
  term: "First" | "Second" | "Third";
  school: string;
  schoolMotto?: string;
  schoolAddress?: string;
  schoolContactEmail?: string;
  schoolContactPhone?: string;
  schoolLogoUrl?: string;
  schoolPrimaryColor?: string;
  schoolSecondaryColor?: string;
  schoolHeadTitle?: string;
  schoolSignatureUrl?: string;
  schoolStampUrl?: string;
  schoolLetterheadStyle?: string;
  schoolLogoPlacement?: string;
  schoolFontFamily?: string;
  schoolFontWeight?: string;
  schoolFontSizeScale?: string;
  schoolHeaderTextColor?: string;

  subjects: SubjectScore[];
  position: string;
  positionNumber?: number;
  totalStudents?: number;
  attendance: { present: number; total: number };
  timesAbsent?: number;
  resumptionDate?: string;
  admissionNumber: string;
  dateOfBirth: string;
  gender: string;
  photoUrl?: string;
  responsibilities?: string;
  promotionStatus?: string;
  promotedToClass?: string;
  classAverage: number | null;
  highestAverage: number | null;
  lowestAverage: number | null;
  nextTermBegins: string;
  affectiveTraits: Array<{ label: string; rating: number }>;
  psychomotorSkills: Array<{ label: string; rating: number }>;
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

/** One card covers a student for 365 full days from activation. */
export const PIN_PRICE_NGN = 1500;
export const PIN_REPLACEMENT_PRICE_NGN = 2500;
export const TERM_EQUIVALENT_NGN = 500;
export const PIN_VALIDITY_DAYS = 365;

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
  {
    rank: 1,
    name: "Maryam Ibrahim",
    school: "Britarch Sec.",
    className: "SS 2 Emerald",
    session: getCurrentAcademicSession(),
    award: "Overall Best Student",
    avg: 96.4,
    emoji: "👑",
    category: "Academics",
    quote: "Discipline compounds — one page, one day at a time.",
    avatarSeed: "maryam-i",
  },
  {
    rank: 2,
    name: "Adaeze Okonkwo",
    school: "Britarch Sec.",
    className: "JSS 2 Diamond",
    session: getCurrentAcademicSession(),
    award: "Best in Sciences",
    avg: 94.1,
    emoji: "🥇",
    category: "STEM",
    quote: "I love questions more than answers.",
    avatarSeed: "adaeze-o",
  },
  {
    rank: 3,
    name: "Ifeanyi Nwosu",
    school: "Aurora Academy",
    className: "SS 3 Sapphire",
    session: getCurrentAcademicSession(),
    award: "Math Olympiad Champion",
    avg: 93.7,
    emoji: "🥈",
    category: "STEM",
    quote: "Every problem hides an elegant pattern.",
    avatarSeed: "ifeanyi-n",
  },
  {
    rank: 4,
    name: "Aisha Mohammed",
    school: "Crestwood College",
    className: "JSS 3 Pearl",
    session: getCurrentAcademicSession(),
    award: "Spelling Bee Winner",
    avg: 92.8,
    emoji: "🏆",
    category: "Languages",
    quote: "Words are worlds. I wanted to hold as many as I could.",
    avatarSeed: "aisha-m",
  },
  {
    rank: 5,
    name: "Daniel Adewale",
    school: "Britarch Sec.",
    className: "SS 1 Sapphire",
    session: getCurrentAcademicSession(),
    award: "Coding Hackathon — 1st",
    avg: 91.5,
    emoji: "💻",
    category: "Innovation",
    quote: "I shipped my first app at 14. Now I want to teach 100 others.",
    avatarSeed: "daniel-a",
  },
  {
    rank: 6,
    name: "Joy Eze",
    school: "Aurora Academy",
    className: "JSS 2 Topaz",
    session: getCurrentAcademicSession(),
    award: "Debate Champion",
    avg: 90.2,
    emoji: "🎤",
    category: "Languages",
    quote: "A soft voice can still change a room.",
    avatarSeed: "joy-e",
  },
  {
    rank: 7,
    name: "Kunle Bassey",
    school: "Crestwood College",
    className: "SS 2 Ruby",
    session: getCurrentAcademicSession(),
    award: "Best in Creative Arts",
    avg: 89.6,
    emoji: "🎨",
    category: "Arts",
    quote: "Colour is how I write down my feelings.",
    avatarSeed: "kunle-b",
  },
  {
    rank: 8,
    name: "Zainab Okoye",
    school: "Britarch Sec.",
    className: "SS 3 Sapphire",
    session: getCurrentAcademicSession(),
    award: "Young Innovator",
    avg: 88.9,
    emoji: "🚀",
    category: "Innovation",
    quote: "I built a solar lamp for my grandma's shop.",
    avatarSeed: "zainab-o",
  },
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
  {
    id: "c1",
    title: "iCademia Math Olympiad",
    category: "STEM",
    schools: 42,
    prize: "₦500,000 + Scholarship",
    status: "Open",
    date: "Registration closes Aug 12",
    blurb: "A nationwide hunt for the sharpest young problem-solvers across JSS 1 to SS 3.",
  },
  {
    id: "c2",
    title: "Pan-African Spelling Bee",
    category: "Language",
    schools: 67,
    prize: "₦300,000 + Trophy",
    status: "Live",
    date: "Live now · Quarter-finals",
    blurb: "Inter-school spelling tournament streamed live across partner schools.",
  },
  {
    id: "c3",
    title: "Future Founders Hackathon",
    category: "Tech",
    schools: 18,
    prize: "Laptops + Mentorship",
    status: "Open",
    date: "Sept 3 – Sept 5",
    blurb: "Build, ship and pitch — 48 hours of code, design and storytelling.",
  },
  {
    id: "c4",
    title: "Creative Arts Showcase",
    category: "Arts",
    schools: 31,
    prize: "Art Grant + Exhibition",
    status: "Closed",
    date: "Concluded May 2025",
    blurb: "Painting, photography and sculpture from primary and secondary students.",
  },
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
  {
    id: "cf1",
    title: "Foundation Educators' Summit",
    focus: "Primary school teachers",
    date: "September 20, 2025",
    city: "Lagos",
    seats: 400,
    status: "Registration open",
    blurb:
      "Two days of workshops on early literacy, phonics, play-based learning and classroom mental health.",
  },
  {
    id: "cf2",
    title: "Secondary Teachers Masterclass",
    focus: "Secondary school teachers",
    date: "October 11, 2025",
    city: "Abuja",
    seats: 300,
    status: "Registration open",
    blurb:
      "Sharpen your subject pedagogy — Mathematics, Sciences, Literature and Civic Education, taught by veterans.",
  },
  {
    id: "cf3",
    title: "Head Teachers Leadership Retreat",
    focus: "Principals & Head Teachers",
    date: "November 8, 2025",
    city: "Enugu",
    seats: 120,
    status: "Waitlist",
    blurb:
      "A curated retreat on running a school like a modern institution — culture, curriculum, hiring, finance.",
  },
  {
    id: "cf4",
    title: "EdTech in the Classroom",
    focus: "All educators",
    date: "May 2025",
    city: "Port Harcourt",
    seats: 250,
    status: "Concluded",
    blurb:
      "Recap of a hands-on training on using AI tools, LMS, and iCademia responsibly in the classroom.",
  },
];
