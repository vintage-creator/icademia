import fs from "node:fs";
import path from "node:path";
import { createHash, randomBytes, scryptSync, randomUUID } from "node:crypto";
import postgres from "postgres";

const projectRoot = path.resolve(import.meta.dirname, "..");
const envPaths = [path.join(projectRoot, ".env.local"), path.join(projectRoot, ".env")];

for (const envPath of envPaths) {
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const rawValue = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env before running the seed.");
}

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
  connect_timeout: 10,
  idle_timeout: 10,
});
const demoPassword = "IcadDemo@2026";
const session = "2025/2026";
const currentTerm = "Second Term";
const priorTerm = "First Term";

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function tokenHash(token) {
  return createHash("sha256").update(token).digest("hex");
}

function gradeFrom(score) {
  if (score >= 70) return "A";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  if (score >= 45) return "D";
  if (score >= 40) return "E";
  return "F";
}

function caExam(score, wobble = 0) {
  const ca = Math.max(0, Math.min(40, Math.round(score * 0.38 + wobble)));
  return { ca, exam: Math.max(0, Math.min(60, score - ca)) };
}

const schools = [
  {
    code: "ICA-SCH-IMO-OWE",
    registryId: "ICA-SCH-SDM-OWE",
    staffPrefix: "SDM-OWE",
    referral: "ICA-REF-OWERRI26",
    name: "St. Dominic's Model Secondary School",
    type: "Secondary School",
    motto: "Discipline, Knowledge and Service",
    city: "Owerri, Imo State",
    address: "Plot 18 School Road, New Owerri, Imo State",
    website: "https://stdominicsowerri.edu.ng",
    adminName: "Mr. Israel Chinedu Abazie",
    adminEmail: "israel.c.abazie@gmail.com",
    adminPhone: "0803 441 2098",
    studentCount: "1200",
    logoUrl:
      "https://ui-avatars.com/api/?name=St+Dominics&background=0B3B75&color=F4C542&bold=true&format=png",
    primaryColor: "#0B3B75",
    secondaryColor: "#F4C542",
    classes: ["JSS 2 Gold", "JSS 3 Emerald"],
    classHeads: {
      "JSS 2 Gold": "Civic Education",
      "JSS 3 Emerald": "English Language",
    },
    subjects: [
      ["English Language", "ENG", "Core"],
      ["Mathematics", "MTH", "Core"],
      ["Basic Science", "BSC", "Science"],
      ["Civic Education", "CIV", "Humanities"],
      ["Computer Studies", "ICT", "Technology"],
      ["Business Studies", "BUS", "Commercial"],
    ],
    teachers: [
      [
        "Mrs. Adaeze Nwosu",
        "adaeze.nwosu@stdominicsowerri.edu.ng",
        "Head Teacher",
        "English Language",
        "JSS 2 Gold, JSS 3 Emerald",
      ],
      [
        "Mr. Kelechi Iwu",
        "kelechi.iwu@stdominicsowerri.edu.ng",
        "Teacher",
        "Mathematics",
        "JSS 2 Gold, JSS 3 Emerald",
      ],
      [
        "Mrs. Ngozi Iheanacho",
        "ngozi.iheanacho@stdominicsowerri.edu.ng",
        "Teacher",
        "Basic Science",
        "JSS 2 Gold",
      ],
      [
        "Mr. Chima Ude",
        "chima.ude@stdominicsowerri.edu.ng",
        "Teacher",
        "Computer Studies",
        "JSS 2 Gold, JSS 3 Emerald",
      ],
      [
        "Miss Chioma Eke",
        "chioma.eke@stdominicsowerri.edu.ng",
        "Head Teacher",
        "Civic Education",
        "JSS 2 Gold",
      ],
    ],
    students: [
      [
        "Amarachi Okoro",
        "SDM/J2G/025",
        "JSS 2 Gold",
        [88, 74, 81, 90, 86, 78],
        [82, 69, 76, 88, 79, 73],
        101,
        105,
        "Excellent confidence in language and civic reasoning; keep deepening mathematical accuracy.",
      ],
      [
        "Chidubem Eze",
        "SDM/J2G/026",
        "JSS 2 Gold",
        [62, 48, 55, 70, 64, 59],
        [68, 56, 58, 73, 61, 60],
        92,
        105,
        "A steady learner who needs targeted support in Mathematics and Basic Science problem solving.",
      ],
      [
        "Kamsiyochukwu Nwachukwu",
        "SDM/J2G/027",
        "JSS 2 Gold",
        [77, 83, 69, 75, 91, 72],
        [74, 78, 66, 71, 88, 70],
        103,
        105,
        "Strong digital learning habits and improving numeracy; should lead peer revision responsibly.",
      ],
      [
        "Somtochukwu Ugochukwu",
        "SDM/J2G/028",
        "JSS 2 Gold",
        [45, 39, 42, 57, 51, 47],
        [50, 44, 46, 59, 54, 48],
        82,
        105,
        "Requires a structured recovery plan, closer attendance follow-up and weekly Mathematics practice.",
      ],
      [
        "Chizaram Dike",
        "SDM/J2G/029",
        "JSS 2 Gold",
        [73, 65, 68, 80, 76, 71],
        [70, 62, 64, 77, 74, 68],
        99,
        105,
        "A responsible learner with steady progress; should improve speed in mathematical reasoning.",
      ],
      [
        "Ifechukwu Emeto",
        "SDM/J2G/030",
        "JSS 2 Gold",
        [58, 52, 49, 63, 60, 55],
        [61, 50, 52, 65, 58, 57],
        90,
        105,
        "Shows effort but needs targeted support in Basic Science and independent corrections.",
      ],
      [
        "Nmesoma Ibe",
        "SDM/J3E/012",
        "JSS 3 Emerald",
        [91, 86, 84, 88, 93, 80],
        [89, 82, 80, 85, 91, 77],
        104,
        105,
        "Outstanding across core subjects with excellent consistency and leadership potential.",
      ],
      [
        "Obinna Madu",
        "SDM/J3E/013",
        "JSS 3 Emerald",
        [70, 66, 61, 76, 73, 68],
        [73, 62, 58, 72, 70, 65],
        98,
        105,
        "Good overall performance; science vocabulary and exam timing should improve next term.",
      ],
      [
        "Lotanna Ejiogu",
        "SDM/J3E/014",
        "JSS 3 Emerald",
        [82, 79, 77, 81, 85, 74],
        [78, 75, 72, 79, 82, 71],
        102,
        105,
        "Consistent and well-organised, with strong potential for junior certificate excellence.",
      ],
      [
        "Ugochi Nzeribe",
        "SDM/J3E/015",
        "JSS 3 Emerald",
        [64, 57, 60, 69, 67, 62],
        [60, 54, 58, 65, 63, 59],
        95,
        105,
        "A teachable learner who will benefit from structured revision and confidence-building tasks.",
      ],
    ],
  },
  {
    code: "ICA-SCH-IMO-ORL",
    registryId: "ICA-SCH-HRI-ORL",
    staffPrefix: "HRI-ORL",
    referral: "ICA-REF-ORLU26",
    name: "Holy Rosary International College",
    type: "Secondary School",
    motto: "Truth, Excellence and Character",
    city: "Orlu, Imo State",
    address: "12 Bishop Shanahan Avenue, Orlu, Imo State",
    website: "https://holyrosaryorlu.sch.ng",
    adminName: "Mr. Chukwudi Abazie",
    adminEmail: "chuksyabazie@gmail.com",
    adminPhone: "0814 790 3321",
    studentCount: "950",
    logoUrl:
      "https://ui-avatars.com/api/?name=Holy+Rosary&background=5B174D&color=F7E7A6&bold=true&format=png",
    primaryColor: "#5B174D",
    secondaryColor: "#F7C948",
    classes: ["SS 1 Pearl", "SS 2 Sapphire"],
    classHeads: {
      "SS 1 Pearl": "English Language",
      "SS 2 Sapphire": "English Language",
    },
    subjects: [
      ["English Language", "ENG", "Core"],
      ["Mathematics", "MTH", "Core"],
      ["Biology", "BIO", "Science"],
      ["Chemistry", "CHM", "Science"],
      ["Economics", "ECO", "Commercial"],
      ["Literature in English", "LIT", "Arts"],
    ],
    teachers: [
      [
        "Rev. Sr. Philomena Okafor",
        "philomena.okafor@holyrosaryorlu.sch.ng",
        "Head Teacher",
        "English Language",
        "SS 1 Pearl, SS 2 Sapphire",
      ],
      [
        "Mr. Tochukwu Duru",
        "tochukwu.duru@holyrosaryorlu.sch.ng",
        "Teacher",
        "Mathematics",
        "SS 1 Pearl, SS 2 Sapphire",
      ],
      [
        "Dr. Ifeoma Anozie",
        "ifeoma.anozie@holyrosaryorlu.sch.ng",
        "Teacher",
        "Biology",
        "SS 2 Sapphire",
      ],
      [
        "Mrs. Ujunwa Onuoha",
        "ujunwa.onuoha@holyrosaryorlu.sch.ng",
        "Teacher",
        "Chemistry",
        "SS 1 Pearl, SS 2 Sapphire",
      ],
      [
        "Mr. Emeka Nzeribe",
        "emeka.nzeribe@holyrosaryorlu.sch.ng",
        "Teacher",
        "Economics",
        "SS 1 Pearl, SS 2 Sapphire",
      ],
      [
        "Miss Chisom Opara",
        "chisom.opara@holyrosaryorlu.sch.ng",
        "Teacher",
        "Literature in English",
        "SS 1 Pearl",
      ],
    ],
    students: [
      [
        "Kosisochukwu Njoku",
        "HRI/S1P/041",
        "SS 1 Pearl",
        [84, 68, 79, 61, 73, 87],
        [78, 64, 75, 58, 70, 82],
        100,
        104,
        "Very strong reading and analysis; Chemistry calculations need more guided practice.",
      ],
      [
        "Muna Anyanwu",
        "HRI/S1P/042",
        "SS 1 Pearl",
        [69, 72, 76, 70, 81, 66],
        [63, 69, 72, 65, 76, 62],
        96,
        104,
        "Balanced performance with clear improvement in Economics and Biology.",
      ],
      [
        "Jideofor Uba",
        "HRI/S1P/043",
        "SS 1 Pearl",
        [51, 43, 49, 38, 57, 46],
        [55, 48, 52, 44, 61, 50],
        78,
        104,
        "Needs urgent science intervention, attendance support and weekly supervised revision.",
      ],
      [
        "Chinonso Ihejirika",
        "HRI/S1P/044",
        "SS 1 Pearl",
        [76, 62, 71, 59, 68, 80],
        [72, 58, 67, 56, 64, 77],
        97,
        104,
        "Good promise in literature and Biology; Chemistry should receive closer practical support.",
      ],
      [
        "Ozioma Ekwueme",
        "HRI/S1P/045",
        "SS 1 Pearl",
        [60, 55, 63, 50, 66, 58],
        [57, 52, 60, 48, 62, 55],
        88,
        104,
        "Improving steadily but requires stronger attendance and correction routines.",
      ],
      [
        "Adaobi Nkem",
        "HRI/S2S/018",
        "SS 2 Sapphire",
        [90, 81, 88, 84, 79, 92],
        [87, 78, 85, 80, 76, 89],
        103,
        104,
        "Excellent academic maturity, especially in English, Biology and Literature.",
      ],
      [
        "Ebubechukwu Emenike",
        "HRI/S2S/019",
        "SS 2 Sapphire",
        [74, 58, 63, 55, 69, 71],
        [71, 61, 60, 52, 66, 67],
        94,
        104,
        "Good engagement, but Mathematics and Chemistry need structured correction of weak topics.",
      ],
      [
        "Chiamaka Udeh",
        "HRI/S2S/020",
        "SS 2 Sapphire",
        [80, 77, 72, 68, 83, 78],
        [76, 72, 70, 64, 79, 75],
        101,
        104,
        "Consistent and teachable; should improve practical science reporting and exam speed.",
      ],
      [
        "Nnamdi Okwara",
        "HRI/S2S/021",
        "SS 2 Sapphire",
        [67, 60, 58, 54, 72, 69],
        [64, 57, 55, 51, 68, 65],
        92,
        104,
        "Good humanities potential; Biology and Chemistry need reteaching-linked revision.",
      ],
      [
        "Somadina Iwuoha",
        "HRI/S2S/022",
        "SS 2 Sapphire",
        [86, 74, 82, 76, 88, 84],
        [83, 70, 78, 72, 84, 81],
        102,
        104,
        "Strong across the subject mix with a mature approach to assignments and revision.",
      ],
    ],
  },
];

async function deleteExistingDemoData(tx) {
  await tx`
    DELETE FROM schools
    WHERE school_code IN ${tx(schools.map((school) => school.code))}
       OR admin_email IN ${tx(schools.map((school) => school.adminEmail))}
       OR registry_id IN ${tx(schools.map((school) => school.registryId))}
       OR staff_code_prefix IN ${tx(schools.map((school) => school.staffPrefix))}
       OR referral_code IN ${tx(schools.map((school) => school.referral))}
  `;
}

async function insertSchool(tx, school, referredBySchoolId = null) {
  const [row] = await tx`
    INSERT INTO schools (
      name, type, motto, city, admin_name, admin_email, admin_phone, address, website,
      admin_password_hash, student_count, school_code, logo_url, primary_color, secondary_color,
      referral_code, referred_by_school_id, email_verified_at, registry_id, staff_code_prefix,
      signature_url, stamp_url, letterhead_style, contact_email, contact_phone, head_title
    ) VALUES (
      ${school.name}, ${school.type}, ${school.motto}, ${school.city}, ${school.adminName},
      ${school.adminEmail}, ${school.adminPhone}, ${school.address}, ${school.website},
      ${hashPassword(demoPassword)}, ${school.studentCount}, ${school.code}, ${school.logoUrl},
      ${school.primaryColor}, ${school.secondaryColor}, ${school.referral}, ${referredBySchoolId},
      CURRENT_TIMESTAMP, ${school.registryId}, ${school.staffPrefix},
      ${school.signatureUrl ?? null}, ${school.stampUrl ?? null}, ${school.letterheadStyle ?? "classic"},
      ${school.contactEmail ?? null}, ${school.contactPhone ?? null}, ${school.headTitle ?? null}
    )
    RETURNING id, school_code, referral_code
  `;

  const verificationToken = `demo-${school.code.toLowerCase()}-verified`;
  await tx`
    INSERT INTO email_verification_tokens (school_id, token_hash, expires_at, used_at)
    VALUES (${row.id}, ${tokenHash(verificationToken)}, CURRENT_TIMESTAMP + INTERVAL '24 hours', CURRENT_TIMESTAMP)
  `;
  return row;
}

async function seedSchool(tx, school, schoolRow) {
  const subjectMap = new Map();
  console.log(`  - subjects for ${school.code}`);
  for (const [name, code, category] of school.subjects) {
    const [subject] = await tx`
      INSERT INTO subjects (school_id, name, code, category, status)
      VALUES (${schoolRow.id}, ${name}, ${code}, ${category}, 'Active')
      RETURNING id, name
    `;
    subjectMap.set(name, subject.id);
  }

  const teacherMap = new Map();
  let teacherIndex = 1;
  console.log(`  - teachers for ${school.code}`);
  for (const [name, email, role, subject, classes] of school.teachers) {
    const [teacher] = await tx`
      INSERT INTO teachers (
        school_id, staff_id, name, email, role, subject, assigned_classes, status
      ) VALUES (
        ${schoolRow.id}, ${`ICA-${school.staffPrefix}-TCH-${String(teacherIndex).padStart(3, "0")}`},
        ${name}, ${email}, ${role}, ${subject}, ${classes}, ${role === "Head Teacher" ? "Invited" : "Active"}
      )
      RETURNING id, name, subject
    `;
    teacherMap.set(subject, teacher.id);
    teacherIndex += 1;
  }

  for (const [className, subject] of Object.entries(school.classHeads ?? {})) {
    const teacherId = teacherMap.get(subject);
    if (!teacherId) continue;
    await tx`
      INSERT INTO class_head_teachers (school_id, class_name, teacher_id)
      VALUES (${schoolRow.id}, ${className}, ${teacherId})
      ON CONFLICT (school_id, class_name) DO UPDATE SET teacher_id = EXCLUDED.teacher_id
    `;
  }

  const studentRows = [];
  console.log(`  - students for ${school.code}`);
  for (const student of school.students) {
    const [name, regNumber, className, scores, priorScores, present, total, remarks] = student;
    const [row] = await tx`
      INSERT INTO students (school_id, name, registration_number, class_name)
      VALUES (${schoolRow.id}, ${name}, ${regNumber}, ${className})
      RETURNING id, name, registration_number, class_name
    `;
    studentRows.push({ ...row, scores, priorScores, present, total, remarks });
  }

  console.log(`  - fixed timetable periods for ${school.code}`);
  for (const periodDay of [1, 2, 3, 4, 5]) {
    for (const className of school.classes) {
      await tx`
        INSERT INTO timetable_entries (
          school_id, teacher_id, subject_id, class_name, day_of_week, period_number,
          starts_at, ends_at, room, entry_type, title
        ) VALUES (
          ${schoolRow.id}, NULL, NULL, ${className}, ${periodDay}, 1,
          '07:45', '08:10', 'Assembly Ground', 'Assembly', 'Morning assembly'
        )
      `;
      await tx`
        INSERT INTO timetable_entries (
          school_id, teacher_id, subject_id, class_name, day_of_week, period_number,
          starts_at, ends_at, room, entry_type, title
        ) VALUES (
          ${schoolRow.id}, NULL, NULL, ${className}, ${periodDay}, 5,
          '10:40', '11:05', 'Courtyard', 'Break', 'Short break'
        )
      `;
    }
  }

  let timetableSubjectIndex = 0;
  console.log(`  - lesson timetable for ${school.code}`);
  for (const className of school.classes) {
    for (let day = 1; day <= 5; day += 1) {
      for (const period of [2, 3, 4, 6, 7]) {
        const [subjectName] = school.subjects[timetableSubjectIndex % school.subjects.length];
        const teacherId = teacherMap.get(subjectName) ?? [...teacherMap.values()][0];
        await tx`
          INSERT INTO timetable_entries (
            school_id, teacher_id, subject_id, class_name, day_of_week, period_number,
            starts_at, ends_at, room, entry_type, title
          ) VALUES (
            ${schoolRow.id}, ${teacherId}, ${subjectMap.get(subjectName)}, ${className}, ${day}, ${period},
            ${period === 2 ? "08:10" : period === 3 ? "09:00" : period === 4 ? "09:50" : period === 6 ? "11:05" : "11:55"},
            ${period === 2 ? "09:00" : period === 3 ? "09:50" : period === 4 ? "10:40" : period === 6 ? "11:55" : "12:45"},
            ${className.includes("SS") ? "Science Block" : "Junior Block"}, 'Lesson', ${subjectName}
          )
        `;
        timetableSubjectIndex += 1;
      }
    }
  }

  console.log(`  - teacher availability for ${school.code}`);
  for (const [, , , subject] of school.teachers) {
    const teacherId = teacherMap.get(subject);
    if (!teacherId) continue;
    await tx`
      INSERT INTO teacher_availability (
        school_id, teacher_id, day_of_week, period_number, is_available, note
      ) VALUES (${schoolRow.id}, ${teacherId}, 3, 7, FALSE, 'Departmental meeting and marking clinic')
    `;
  }

  console.log(`  - results and learner records for ${school.code}`);
  for (const row of studentRows) {
    await insertResults(
      tx,
      school,
      schoolRow,
      row,
      subjectMap,
      currentTerm,
      row.scores,
      row.present,
      row.total,
      row.remarks,
    );
    await insertResults(
      tx,
      school,
      schoolRow,
      row,
      subjectMap,
      priorTerm,
      row.priorScores,
      Math.max(70, row.present - 4),
      row.total,
      "Previous term record retained for progress comparison.",
    );
    await seedStudentOperations(tx, schoolRow, row);
  }

  console.log(`  - curriculum for ${school.code}`);
  await seedCurriculum(tx, school, schoolRow, subjectMap, teacherMap);
  console.log(`  - operations for ${school.code}`);
  await seedSchoolOperations(tx, school, schoolRow, studentRows);
  console.log(`  - card orders and pins for ${school.code}`);
  await seedPinsAndOrders(tx, school, schoolRow, studentRows);
}

async function insertResults(
  tx,
  school,
  schoolRow,
  student,
  subjectMap,
  term,
  scores,
  present,
  total,
  remarks,
) {
  const average = Number(
    (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(2),
  );
  const classmates = school.students.filter((item) => item[2] === student.class_name);
  const averages = classmates
    .map((item) => item[term === currentTerm ? 3 : 4])
    .map((values) => values.reduce((sum, score) => sum + score, 0) / values.length)
    .sort((a, b) => b - a);
  const position = averages.findIndex((value) => value <= average + 0.001) + 1;
  const [result] = await tx`
    INSERT INTO results (
      student_id, term, session, average_score, position_number, total_students, remarks,
      principal_remarks, attendance_present, attendance_total
    ) VALUES (
      ${student.id}, ${term}, ${session}, ${average}, ${position}, ${classmates.length}, ${remarks},
      ${average >= 80 ? "An excellent record. Keep extending the learner with higher-order tasks." : average >= 60 ? "A good record with clear areas for guided improvement next term." : "The learner requires coordinated school and home support before the next assessment cycle."},
      ${present}, ${total}
    )
    RETURNING id
  `;

  for (let index = 0; index < school.subjects.length; index += 1) {
    const [subjectName] = school.subjects[index];
    const score = scores[index];
    const { ca, exam } = caExam(score, index % 2);
    await tx`
      INSERT INTO grades (result_id, subject, ca_score, exam_score, score, max_score, grade)
      VALUES (${result.id}, ${subjectName}, ${ca}, ${exam}, ${score}, 100, ${gradeFrom(score)})
    `;
    if (term === currentTerm && index < 3) {
      await tx`
        INSERT INTO answer_scripts (result_id, subject, student_score, max_score, grade, cloudinary_url)
        VALUES (
          ${result.id}, ${subjectName}, ${score}, 100, ${gradeFrom(score)},
          ${`https://icademia.app/demo/answer-sheets/${student.registration_number.replaceAll("/", "-")}-${subjectName.toLowerCase().replaceAll(" ", "-")}.pdf`}
        )
      `;
    }
  }
}

async function seedStudentOperations(tx, schoolRow, student) {
  const guardianLastName = student.name.split(" ").at(-1);
  await tx`
    INSERT INTO parent_guardians (
      school_id, student_id, name, relationship, email, phone, preferred_channel,
      communication_consent, emergency_contact
    ) VALUES (
      ${schoolRow.id}, ${student.id}, ${`Mr./Mrs. ${guardianLastName}`}, 'Parent',
      ${`${guardianLastName.toLowerCase()}family@example.com`}, ${`080${Math.floor(10000000 + Math.random() * 89999999)}`},
      'WhatsApp', TRUE, TRUE
    )
  `;

  await tx`
    INSERT INTO student_lifecycle (school_id, student_id, event_type, event_date, reason, destination, note)
    VALUES (${schoolRow.id}, ${student.id}, 'Admission', '2024-09-09', 'Regular admission', NULL, 'Admitted after entrance assessment and interview.')
  `;

  const statuses =
    student.present < 90
      ? ["Present", "Absent", "Late", "Present", "Absent"]
      : ["Present", "Present", "Late", "Present", "Present"];
  for (let index = 0; index < statuses.length; index += 1) {
    await tx`
      INSERT INTO attendance_records (school_id, student_id, attendance_date, status, note)
      VALUES (
        ${schoolRow.id}, ${student.id}, ${`2026-02-${String(3 + index).padStart(2, "0")}`},
        ${statuses[index]}, ${statuses[index] === "Present" ? "Recorded during morning register." : "Requires class teacher follow-up."}
      )
    `;
  }

  await tx`
    INSERT INTO engagement_observations (
      school_id, student_id, observation_date, category, rating, note, recorded_by
    ) VALUES (
      ${schoolRow.id}, ${student.id}, '2026-02-10',
      ${student.scores.some((score) => score < 50) ? "Academic concern" : "Class participation"},
      ${student.scores.some((score) => score < 50) ? 2 : 4},
      ${student.scores.some((score) => score < 50) ? "Needs closer monitoring during independent classwork and corrections." : "Participates well and completes assigned exercises with minimal prompting."},
      'Form Teacher'
    )
  `;
}

async function seedCurriculum(tx, school, schoolRow, subjectMap, teacherMap) {
  const topicBank = {
    "English Language": ["Summary writing", "Comprehension skills", "Figures of speech"],
    Mathematics: ["Linear equations", "Mensuration", "Probability"],
    "Basic Science": ["Digestive system", "Energy transfer", "Simple machines"],
    "Civic Education": ["Rights and duties", "National values", "Community leadership"],
    "Computer Studies": ["Spreadsheet formulas", "Internet safety", "Data representation"],
    "Business Studies": ["Book keeping", "Office practice", "Entrepreneurship"],
    Biology: ["Cell structure", "Nutrition in animals", "Transport system"],
    Chemistry: ["Chemical bonding", "Mole concept", "Acids and bases"],
    Economics: ["Demand and supply", "Market structures", "National income"],
    "Literature in English": ["Drama analysis", "Poetry devices", "Prose characterisation"],
  };

  for (const className of school.classes) {
    for (const [subjectName] of school.subjects) {
      const topics = topicBank[subjectName] ?? [
        "Term topic one",
        "Term topic two",
        "Term topic three",
      ];
      for (let index = 0; index < topics.length; index += 1) {
        const [topic] = await tx`
          INSERT INTO curriculum_topics (
            school_id, subject_id, class_name, term, session, topic, sequence_number, expected_by
          ) VALUES (
            ${schoolRow.id}, ${subjectMap.get(subjectName)}, ${className}, ${currentTerm}, ${session},
            ${topics[index]}, ${index + 1}, ${`2026-02-${String(14 + index * 7).padStart(2, "0")}`}
          )
          RETURNING id
        `;
        const lowCoverage =
          ["Mathematics", "Chemistry", "Basic Science"].includes(subjectName) && index === 1;
        await tx`
          INSERT INTO curriculum_coverage (
            topic_id, teacher_id, status, coverage_percent, completed_at, evidence_url, note
          ) VALUES (
            ${topic.id}, ${teacherMap.get(subjectName) ?? null},
            ${lowCoverage ? "Reteach" : index === 2 ? "In progress" : "Completed"},
            ${lowCoverage ? 55 : index === 2 ? 70 : 100},
            ${lowCoverage || index === 2 ? null : "2026-02-21"},
            ${`https://icademia.app/demo/curriculum/${school.code}-${className.replaceAll(" ", "-")}-${subjectName.replaceAll(" ", "-")}.pdf`},
            ${lowCoverage ? "Assessment evidence shows weak retention; reteaching recommended." : "Coverage evidence uploaded by subject teacher."}
          )
        `;
      }
    }
  }
}

async function seedSchoolOperations(tx, school, schoolRow, students) {
  const weakStudent =
    students.find((student) => student.scores.some((score) => score < 45)) ?? students.at(0);
  await tx`
    INSERT INTO interventions (
      school_id, student_id, class_name, subject, title, rationale, owner_role, status,
      baseline_value, target_value, starts_on, review_on, approved_by, approved_at, outcome_note, outcome_value
    ) VALUES (
      ${schoolRow.id}, ${weakStudent.id}, ${weakStudent.class_name}, 'Mathematics',
      'Four-week numeracy recovery clinic',
      'Current Mathematics score and attendance pattern require structured follow-up.',
      'Director of Studies', 'Approved', 43, 58, '2026-02-17', '2026-03-17',
      ${school.adminName}, CURRENT_TIMESTAMP, 'Mid-cycle review pending after next class test.', NULL
    )
  `;

  await tx`
    INSERT INTO retention_signals (school_id, student_id, signal_type, severity, evidence, status)
    VALUES (
      ${schoolRow.id}, ${weakStudent.id}, 'Attendance and underperformance', 'Medium',
      ${JSON.stringify({ attendancePresent: weakStudent.present, lowScores: weakStudent.scores.filter((score) => score < 50).length })}::jsonb,
      'Open'
    )
  `;

  await tx`
    INSERT INTO compliance_requirements (
      school_id, title, authority, requirement_type, due_date, inspection_start, inspection_end,
      status, evidence_url, owner_role, note
    ) VALUES (
      ${schoolRow.id}, 'Second term result register evidence pack', 'Imo State Ministry of Education',
      'Inspection evidence', '2026-03-28', '2026-03-24', '2026-03-26',
      'Open', ${`https://icademia.app/demo/compliance/${school.code}-result-register.pdf`},
      'Exam Officer', 'Prepare signed result register, attendance summary and marked-script sample.'
    )
  `;

  await tx`
    INSERT INTO support_tickets (school_id, subject, category, priority, message, status, response)
    VALUES (
      ${schoolRow.id}, 'Confirm branded card delivery timeline', 'Access cards', 'Normal',
      'Please confirm if our branded card batch can be delivered before the PTA open day.',
      'Open', NULL
    )
  `;
}

async function seedPinsAndOrders(tx, school, schoolRow, students) {
  const [order] = await tx`
    INSERT INTO card_orders (
      school_id, order_reference, order_type, quantity, unit_price, customer_email,
      delivery_address, status, fulfillment_status, estimated_delivery_start,
      estimated_delivery_end, paid_at
    ) VALUES (
      ${schoolRow.id}, ${`ICAD-DEMO-${school.code.split("-").at(-1)}-2026`}, 'Annual access cards',
      ${students.length}, 1500, ${school.adminEmail}, ${school.address}, 'Paid',
      'Preparing branded card batch', CURRENT_DATE + INTERVAL '5 days',
      CURRENT_DATE + INTERVAL '12 days', CURRENT_TIMESTAMP
    )
    RETURNING order_reference
  `;

  let index = 1;
  for (const student of students) {
    const raw = randomBytes(6).toString("hex").toUpperCase();
    let pin = `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;

    // Explicitly set deterministic PINs for the requested students so they can be easily tested
    if (student.registration_number === "SDM/J2G/025") pin = "A2B4-9X8C-Q7F1";
    if (student.registration_number === "SDM/J2G/026") pin = "C5P9-3M2K-L8N4";
    if (student.registration_number === "HRI/S1P/041") pin = "H7W2-D9R5-V1T6";
    if (student.registration_number === "HRI/S1P/042") pin = "Y4B6-N3X8-M5C9";

    await tx`
      INSERT INTO pins (
        school_id, pin, serial, status, used_by, payment_reference, activated_at, expires_at
      ) VALUES (
        ${schoolRow.id}, ${pin},
        ${`ICAD-${school.code.split("-").at(-1)}-${String(index).padStart(6, "0")}`},
        ${index <= 2 ? "Used" : "Unused"}, ${index <= 2 ? student.registration_number : null},
        ${order.order_reference}, ${index <= 2 ? "2026-01-15" : null},
        ${index <= 2 ? "2027-01-15" : null}
      )
    `;
    index += 1;
  }
}

async function main() {
  const summary = [];
  console.log("Refreshing iCademia demo schools...");
  const existingProfiles = await sql`
    SELECT school_code, logo_url, primary_color, secondary_color,
           signature_url, stamp_url, letterhead_style, contact_email, contact_phone, head_title
    FROM schools
    WHERE school_code IN ${sql(schools.map((school) => school.code))}
  `;
  for (const existing of existingProfiles) {
    const school = schools.find((item) => item.code === existing.school_code);
    if (!school) continue;
    school.logoUrl = existing.logo_url || school.logoUrl;
    school.primaryColor = existing.primary_color || school.primaryColor;
    school.secondaryColor = existing.secondary_color || school.secondaryColor;
    school.signatureUrl = existing.signature_url || school.signatureUrl;
    school.stampUrl = existing.stamp_url || school.stampUrl;
    school.letterheadStyle = existing.letterhead_style || school.letterheadStyle;
    school.contactEmail = existing.contact_email || school.contactEmail;
    school.contactPhone = existing.contact_phone || school.contactPhone;
    school.headTitle = existing.head_title || school.headTitle;
  }
  console.log("Removing previous demo rows for the two requested schools...");
  await deleteExistingDemoData(sql);
  console.log("Creating verified school workspaces...");
  const first = await insertSchool(sql, schools[0]);
  const second = await insertSchool(sql, schools[1], first.id);
  await sql`
      INSERT INTO referrals (referrer_school_id, referred_school_id, referral_code, status, reward_per_student)
      VALUES (${first.id}, ${second.id}, ${schools[0].referral}, 'Qualified', 200)
    `;
  console.log(`Seeding ${schools[0].name}...`);
  await seedSchool(sql, schools[0], first);
  console.log(`Seeding ${schools[1].name}...`);
  await seedSchool(sql, schools[1], second);
  summary.push(first, second);
  console.log("Verifying seeded record counts...");

  const rows = await sql`
    SELECT s.name, s.school_code, s.admin_email, s.referral_code,
      (SELECT COUNT(*) FROM students st WHERE st.school_id = s.id)::int AS students,
      (SELECT COUNT(*) FROM teachers t WHERE t.school_id = s.id)::int AS teachers,
      (SELECT COUNT(*) FROM results r JOIN students st ON st.id = r.student_id WHERE st.school_id = s.id)::int AS results,
      (SELECT COUNT(*) FROM pins p WHERE p.school_id = s.id)::int AS pins
    FROM schools s
    WHERE s.school_code IN ${sql(schools.map((school) => school.code))}
    ORDER BY s.name
  `;

  console.table(rows);
  console.log(`Demo admin password for both schools: ${demoPassword}`);
}

try {
  await main();
} finally {
  await sql.end();
}
