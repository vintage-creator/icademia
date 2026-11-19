import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sql, initDb } from "@/lib/db.server";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getGeminiModel, getResend, uploadSchoolAsset } from "@/lib/integrations.server";
import { getAppOrigin } from "@/lib/utils";
import mammoth from "mammoth";
import { detectPhase, gradeForPhase } from "@/lib/class-phase";

const GENERIC_SCHOOL_WORDS = new Set([
  "school",
  "schools",
  "primary",
  "secondary",
  "combined",
  "college",
  "academy",
  "nursery",
  "university",
]);

function schoolMnemonic(name: string) {
  const words = name
    .replace(/[’']s\b/gi, "")
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  const meaningful = words.filter((word) => !GENERIC_SCHOOL_WORDS.has(word.toLowerCase()));
  const source = meaningful.length >= 2 ? meaningful : words;
  const initials = source
    .slice(0, 4)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const compact = source
    .join("")
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase();
  return initials.length >= 2 ? initials : compact.slice(0, 3).padEnd(2, "X");
}

function locationMnemonic(city: string) {
  return city
    .replace(/[^A-Z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 3)
    .padEnd(3, "X");
}

async function ensureSchoolIdentity(school: any) {
  if (school.registry_id && school.staff_code_prefix) {
    return { registryId: school.registry_id, staffPrefix: school.staff_code_prefix };
  }
  const base = `${schoolMnemonic(school.name)}-${locationMnemonic(school.city)}`;
  let staffPrefix = base;
  let attempt = 1;
  while (true) {
    const conflict = await sql`
      SELECT id FROM schools
      WHERE staff_code_prefix = ${staffPrefix} AND id <> ${school.id}
      LIMIT 1
    `;
    if (!conflict.length) break;
    attempt += 1;
    staffPrefix = `${base}-${attempt}`;
  }
  const registryId = `ICA-SCH-${staffPrefix}`;
  const [updated] = await sql`
    UPDATE schools
    SET staff_code_prefix = COALESCE(staff_code_prefix, ${staffPrefix}),
        registry_id = COALESCE(registry_id, ${registryId})
    WHERE id = ${school.id}
    RETURNING registry_id, staff_code_prefix
  `;
  return { registryId: updated.registry_id, staffPrefix: updated.staff_code_prefix };
}

export const parseBulkDocxDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      base64: z.string().min(20).max(14_000_000),
      expectedColumns: z.number().int().min(2).max(12),
    }),
  )
  .handler(async ({ data }) => {
    const buffer = Buffer.from(data.base64.replace(/^data:.*;base64,/, ""), "base64");
    const converted = await mammoth.convertToHtml({ buffer });
    const decode = (value: string) =>
      value
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .trim();
    const rows = Array.from(converted.value.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi))
      .map((row) =>
        Array.from(row[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)).map((cell) =>
          decode(cell[1]),
        ),
      )
      .filter((row) => row.length >= data.expectedColumns && row.some(Boolean));
    if (rows.length === 0) {
      throw new Error(
        "No structured table was found. Use the displayed column order and save the Word file as .docx.",
      );
    }
    return { rows, warnings: converted.messages.map((message) => message.message) };
  });

async function requireSchoolAdminSession(token: string, expectedSchoolCode?: string) {
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const [session] = await sql`
    SELECT s.id AS school_id, s.school_code, s.admin_name, s.name AS school_name
    FROM school_admin_sessions a
    JOIN schools s ON s.id=a.school_id
    WHERE a.token_hash=${tokenHash} AND a.expires_at>NOW()
  `;
  if (!session || (expectedSchoolCode && session.school_code !== expectedSchoolCode)) {
    throw new Error("Your administrator session is invalid or has expired. Please sign in again.");
  }
  return session;
}

// ----------------------------------------------------
// 1. REGISTER SCHOOL
// ----------------------------------------------------
export const registerSchoolDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      name: z.string().min(2),
      type: z.string(),
      motto: z.string().optional(),
      city: z.string().min(2),
      address: z.string().trim().optional(),
      adminName: z.string().min(2),
      adminEmail: z.string().email(),
      adminPhone: z.string().optional(),
      studentCount: z.string(),
      adminPassword: z.string().min(8),
      referralCode: z.string().trim().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();

    // Generate unique school code
    const schoolCode = `ICA-SCH-${randomBytes(4).toString("hex").slice(0, 7).toUpperCase()}`;
    const referralCode = `ICA-REF-${randomBytes(4).toString("hex").toUpperCase()}`;
    let referrerSchoolId: number | null = null;
    if (data.referralCode) {
      const referrers = await sql`
        SELECT id FROM schools WHERE referral_code = ${data.referralCode.toUpperCase()}
      `;
      if (referrers.length === 0) {
        throw new Error("The referral code is not recognised. Check it or leave the field blank.");
      }
      referrerSchoolId = Number(referrers[0].id);
    }

    // Insert school
    const passwordSalt = randomBytes(16).toString("hex");
    const passwordHash = scryptSync(data.adminPassword, passwordSalt, 64).toString("hex");
    const [school] = await sql`
      INSERT INTO schools (
        name, type, motto, city, address, admin_name, admin_email, admin_phone, student_count, school_code,
        admin_password_hash, referral_code, referred_by_school_id
      ) VALUES (
        ${data.name}, ${data.type}, ${data.motto ?? ""}, ${data.city}, ${data.address ?? ""}, ${data.adminName},
        ${data.adminEmail.toLowerCase()}, ${data.adminPhone ?? ""}, ${data.studentCount}, ${schoolCode},
        ${`${passwordSalt}:${passwordHash}`}, ${referralCode}, ${referrerSchoolId}
      )
      RETURNING id, name, city, school_code, registry_id, staff_code_prefix
    `;
    const identity = await ensureSchoolIdentity(school);

    if (referrerSchoolId) {
      await sql`
        INSERT INTO referrals (referrer_school_id, referred_school_id, referral_code)
        VALUES (${referrerSchoolId}, ${school.id}, ${data.referralCode!.toUpperCase()})
      `;
    }

    const verificationToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(verificationToken).digest("hex");
    await sql`
      INSERT INTO email_verification_tokens (school_id, token_hash, expires_at)
      VALUES (${school.id}, ${tokenHash}, CURRENT_TIMESTAMP + INTERVAL '24 hours')
    `;

    let emailDelivery: "sent" | "not_configured" | "delayed" | "failed" = "not_configured";

    // Try sending confirmation email via Resend. Do not make the whole workspace
    // creation feel stuck if the mail provider is slow.
    const resend = await getResend();
    if (resend && process.env.EMAIL_FROM) {
      try {
        const sendVerificationEmail = resend.emails
          .send({
            from: process.env.EMAIL_FROM,
            to: data.adminEmail,
            subject: `Welcome to iCademia - School Registered!`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg;">
                <h2 style="color: #312e81;">Welcome to iCademia!</h2>
                <p>Hello ${data.adminName},</p>
                <p>Your school, <strong>${data.name}</strong>, has been successfully registered on iCademia.</p>
                <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; font-size: 12px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Your School Registry ID</p>
                  <p style="margin: 5px 0 0 0; font-size: 24px; font-weight: bold; color: #4338ca; font-family: monospace;">${identity.registryId}</p>
                </div>
                <p>Use Teachers &amp; Access to add teaching staff. Only Head Teachers explicitly granted workspace access receive a secure Staff ID invitation.</p>
                <p>Please verify this email before inviting staff or publishing results.</p>
                <p style="margin: 24px 0;"><a href="${getAppOrigin()}/verify-email?token=${verificationToken}" style="background:#3730a3;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;">Verify administrator email</a></p>
                <p>Best regards,<br/>The iCademia Team</p>
              </div>
            `,
          })
          .then(() => {
            emailDelivery = "sent";
          })
          .catch((err) => {
            emailDelivery = "failed";
            console.error("Resend email failed:", err);
          });

        await Promise.race([
          sendVerificationEmail,
          new Promise<void>((resolve) => {
            setTimeout(() => {
              emailDelivery = "delayed";
              resolve();
            }, 3500);
          }),
        ]);
      } catch (err) {
        emailDelivery = "failed";
        console.error("Resend email failed:", err);
      }
    }

    return {
      schoolCode,
      registryId: identity.registryId,
      schoolId: school.id,
      verificationRequired: true,
      emailDelivery,
    };
  });

export const authenticateSchoolAdminDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string().trim().optional(),
      email: z.string().email(),
      password: z.string().min(8),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const schools = await sql`
      SELECT id, school_code, name, admin_name, admin_email, admin_password_hash, email_verified_at
      FROM schools
      WHERE admin_email = ${data.email.toLowerCase()}
        AND (${data.schoolCode || null}::text IS NULL OR school_code = ${data.schoolCode?.toUpperCase() || null})
    `;
    if (schools.length === 0 || !schools[0].admin_password_hash) {
      throw new Error("Invalid email or password.");
    }
    if (!schools[0].email_verified_at) {
      throw new Error("Verify the administrator email before signing in.");
    }
    const [salt, storedHash] = String(schools[0].admin_password_hash).split(":");
    const storedPasswordHash = Buffer.from(storedHash ?? "", "hex");
    if (!salt || storedPasswordHash.length !== 64) {
      throw new Error("Invalid email or password.");
    }
    const suppliedHash = scryptSync(data.password, salt, 64);
    const valid = timingSafeEqual(suppliedHash, storedPasswordHash);
    if (!valid) throw new Error("Invalid email or password.");
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await sql`INSERT INTO school_admin_sessions (school_id, token_hash, expires_at) VALUES (${schools[0].id}, ${tokenHash}, ${expiresAt})`;
    return {
      token,
      schoolCode: schools[0].school_code,
      schoolName: schools[0].name,
      adminName: schools[0].admin_name,
    };
  });

export const verifySchoolAdminSessionDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(20) }))
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const [session] = await sql`
      SELECT s.school_code, s.name AS school_name, s.admin_name, s.admin_email
      FROM school_admin_sessions a JOIN schools s ON s.id=a.school_id
      WHERE a.token_hash=${tokenHash} AND a.expires_at>NOW()
    `;
    return session || null;
  });

export const logoutSchoolAdminDb = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const hash = createHash("sha256").update(data.token).digest("hex");
    await sql`DELETE FROM school_admin_sessions WHERE token_hash=${hash}`;
    return { success: true };
  });

export const requestSchoolPasswordResetDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      email: z.string().email(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const schools = await sql`
      SELECT id, name, admin_name, admin_email
      FROM schools
      WHERE admin_email = ${data.email.toLowerCase()}
    `;

    // Always return the same response so this endpoint does not reveal registered accounts.
    if (schools.length === 0) return { accepted: true };

    const school = schools[0];
    const resetToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(resetToken).digest("hex");
    await sql`
      UPDATE password_reset_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE school_id = ${school.id} AND used_at IS NULL
    `;
    await sql`
      INSERT INTO password_reset_tokens (school_id, token_hash, expires_at)
      VALUES (${school.id}, ${tokenHash}, CURRENT_TIMESTAMP + INTERVAL '1 hour')
    `;

    const resend = await getResend();
    if (resend && process.env.EMAIL_FROM) {
      const resetUrl = `${getAppOrigin()}/reset-password?token=${resetToken}`;
      try {
        await resend.emails.send({
          from: process.env.EMAIL_FROM,
          to: school.admin_email,
          subject: "Reset your iCademia administrator password",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;color:#162235">
              <h2 style="color:#071a2e">Reset your administrator password</h2>
              <p>Hello ${school.admin_name},</p>
              <p>We received a password reset request for <strong>${school.name}</strong>.</p>
              <p style="margin:28px 0"><a href="${resetUrl}" style="background:#123a72;color:white;padding:13px 18px;border-radius:8px;text-decoration:none">Choose a new password</a></p>
              <p>This link expires in one hour and can be used once. If you did not request it, your current password remains unchanged.</p>
            </div>
          `,
        });
      } catch (error) {
        console.error("Password reset email failed:", error);
      }
    }
    return { accepted: true };
  });

export const resetSchoolPasswordDb = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        token: z.string().min(32),
        password: z.string().min(8),
        confirmPassword: z.string().min(8),
      })
      .refine((value) => value.password === value.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const tokens = await sql`
      SELECT id, school_id
      FROM password_reset_tokens
      WHERE token_hash = ${tokenHash}
        AND used_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
    `;
    if (tokens.length === 0) {
      throw new Error("This password reset link is invalid or has expired.");
    }

    const passwordSalt = randomBytes(16).toString("hex");
    const passwordHash = scryptSync(data.password, passwordSalt, 64).toString("hex");
    await sql.begin(async (transaction) => {
      await transaction`
        UPDATE schools
        SET admin_password_hash = ${`${passwordSalt}:${passwordHash}`}
        WHERE id = ${tokens[0].school_id}
      `;
      await transaction`
        UPDATE password_reset_tokens
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = ${tokens[0].id}
      `;
    });
    return { reset: true };
  });

export const getSchoolAdminInviteDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().trim().min(32).max(128) }))
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const [invite] = await sql`
      SELECT s.name AS school_name, s.admin_name, s.admin_email, i.expires_at
      FROM school_admin_invites i
      JOIN schools s ON s.id = i.school_id
      WHERE i.token_hash = ${tokenHash}
        AND i.used_at IS NULL
        AND i.expires_at > CURRENT_TIMESTAMP
        AND s.admin_password_hash IS NULL
      LIMIT 1
    `;
    if (!invite) throw new Error("This setup link is invalid, expired, or has already been used.");
    return invite;
  });

export const acceptSchoolAdminInviteDb = createServerFn({ method: "POST" })
  .validator(
    z
      .object({
        token: z.string().trim().min(32).max(128),
        password: z.string().min(8).max(128),
        confirmPassword: z.string().min(8).max(128),
      })
      .refine((value) => value.password === value.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
      }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const passwordSalt = randomBytes(16).toString("hex");
    const passwordHash = scryptSync(data.password, passwordSalt, 64).toString("hex");

    const account = await sql.begin(async (transaction) => {
      const [invite] = await transaction`
        SELECT i.id, i.school_id, s.name AS school_name, s.admin_name, s.admin_password_hash
        FROM school_admin_invites i
        JOIN schools s ON s.id = i.school_id
        WHERE i.token_hash = ${tokenHash}
          AND i.used_at IS NULL
          AND i.expires_at > CURRENT_TIMESTAMP
        FOR UPDATE OF i, s
      `;
      if (!invite || invite.admin_password_hash) {
        throw new Error("This setup link is invalid, expired, or has already been used.");
      }

      await transaction`
        UPDATE schools
        SET admin_password_hash = ${`${passwordSalt}:${passwordHash}`},
            email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP)
        WHERE id = ${invite.school_id}
      `;
      await transaction`
        UPDATE school_admin_invites
        SET used_at = CURRENT_TIMESTAMP
        WHERE id = ${invite.id}
      `;
      await transaction`
        UPDATE school_admin_invites
        SET used_at = CURRENT_TIMESTAMP
        WHERE school_id = ${invite.school_id} AND used_at IS NULL
      `;
      return { schoolName: invite.school_name, adminName: invite.admin_name };
    });
    return { success: true, ...account };
  });

// ----------------------------------------------------
// 2. CHECK RESULT WITH PIN & REG NUMBER
// ----------------------------------------------------
export const checkResultDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().trim(),
      regNumber: z.string().trim(),
      resultId: z.number().int().positive().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();

    const formattedPin = data.pin.toUpperCase();
    const formattedReg = data.regNumber.toUpperCase();

    // 1. Find PIN
    const pinsResult = await sql`
      SELECT * FROM pins WHERE UPPER(pin) = ${formattedPin}
    `;

    if (pinsResult.length === 0) {
      throw new Error("Invalid scratch card PIN. Please double check and try again.");
    }

    const pinRow = pinsResult[0];

    // 2. Find Student
    const studentsResult = await sql`
      SELECT s.*, sch.name as school_name, sch.motto as school_motto, sch.city as school_city,
             sch.logo_url, sch.primary_color, sch.secondary_color,
             sch.head_title, sch.signature_url, sch.stamp_url,
             sch.letterhead_style, sch.contact_email, sch.contact_phone, sch.address as school_address,
             sch.logo_placement, sch.font_family, sch.font_weight, sch.font_size_scale, sch.header_text_color
      FROM students s
      JOIN schools sch ON s.school_id = sch.id
      WHERE UPPER(s.registration_number) = ${formattedReg}
    `;

    if (studentsResult.length === 0) {
      throw new Error("No student record found matching this registration number.");
    }

    const studentRow = studentsResult[0];

    // Check school alignment
    if (pinRow.school_id !== studentRow.school_id) {
      throw new Error("This scratch card PIN was issued for a different school.");
    }

    const restrictionActive =
      studentRow.result_access_status === "Restricted" &&
      (!studentRow.result_restriction_expires_at ||
        new Date(studentRow.result_restriction_expires_at) > new Date());
    if (restrictionActive) {
      throw new Error(
        `Result access restricted: ${studentRow.result_restriction_reason || "Please contact the school administrator for clearance."}`,
      );
    }

    // Check if result access is restricted for this scratch card/PIN
    if (pinRow.result_access_status === "Restricted") {
      throw new Error(
        `Result access restricted: ${pinRow.restriction_reason || "Please contact the school administrator for clearance."}`,
      );
    }

    // 3. Handle PIN activation
    if (pinRow.status === "Used" && pinRow.used_by !== formattedReg) {
      throw new Error(
        "This scratch card PIN has already been used to unlock a different student's results.",
      );
    }
    if (pinRow.expires_at && new Date(pinRow.expires_at) < new Date()) {
      throw new Error(
        "This scratch card expired after its one-year validity period. Please renew it.",
      );
    }

    if (pinRow.status === "Unused") {
      // Unused PIN - Activate it for this student
      await sql`
        UPDATE pins
        SET status = 'Used',
            used_by = ${formattedReg},
            activated_at = CURRENT_TIMESTAMP,
            expires_at = CURRENT_TIMESTAMP + INTERVAL '365 days'
        WHERE id = ${pinRow.id}
      `;
    }

    // 4. Retrieve Student's Results
    const allResults = await sql`
      SELECT id, term, session, average_score, position_number, total_students, created_at
      FROM results
      WHERE student_id = ${studentRow.id} AND workflow_status = 'Published'
      ORDER BY session DESC,
        CASE term WHEN 'Third' THEN 3 WHEN 'Second' THEN 2 WHEN 'First' THEN 1 ELSE 0 END DESC,
        created_at DESC
    `;
    const resultsRows = data.resultId
      ? await sql`SELECT * FROM results WHERE id = ${data.resultId} AND student_id = ${studentRow.id} AND workflow_status = 'Published'`
      : await sql`SELECT * FROM results WHERE id = ${allResults[0]?.id ?? -1}`;

    if (resultsRows.length === 0) {
      throw new Error("No academic results have been published yet for this student.");
    }

    const resultRow = resultsRows[0];
    const classMetrics = await sql`
      WITH latest_class_results AS (
        SELECT DISTINCT ON (r.student_id) r.id, r.student_id, r.average_score
        FROM results r
        JOIN students s ON s.id = r.student_id
        WHERE s.school_id = ${studentRow.school_id}
          AND s.class_name = ${studentRow.class_name}
          AND r.term = ${resultRow.term}
          AND r.session = ${resultRow.session}
          AND r.workflow_status = 'Published'
        ORDER BY r.student_id, (r.id = ${resultRow.id}) DESC, r.created_at DESC, r.id DESC
      )
      SELECT ROUND(AVG(average_score), 2) AS class_average,
             MAX(average_score) AS highest_average,
             MIN(average_score) AS lowest_average
      FROM latest_class_results
    `;

    // Retrieve Grades
    const gradesRows = await sql`
      SELECT * FROM grades WHERE result_id = ${resultRow.id}
      ORDER BY subject ASC
    `;

    const subjectMetrics = await sql`
      WITH latest_class_results AS (
        SELECT DISTINCT ON (r.student_id) r.id, r.student_id
        FROM results r
        JOIN students s ON s.id = r.student_id
        WHERE s.school_id = ${studentRow.school_id}
          AND s.class_name = ${studentRow.class_name}
          AND r.term = ${resultRow.term}
          AND r.session = ${resultRow.session}
          AND r.workflow_status = 'Published'
        ORDER BY r.student_id, (r.id = ${resultRow.id}) DESC, r.created_at DESC, r.id DESC
      ), scores_by_student AS (
        SELECT latest.id AS result_id, latest.student_id, g.subject,
               ROUND(AVG(g.score), 2) AS score
        FROM latest_class_results latest
        JOIN grades g ON g.result_id = latest.id
        GROUP BY latest.id, latest.student_id, g.subject
      ), ranked_subject_scores AS (
        SELECT subject, result_id,
               ROUND(AVG(score) OVER (PARTITION BY subject), 1) AS class_average,
               MAX(score) OVER (PARTITION BY subject) AS class_highest,
               MIN(score) OVER (PARTITION BY subject) AS class_lowest,
               RANK() OVER (PARTITION BY subject ORDER BY score DESC) AS class_position,
               COUNT(*) OVER (PARTITION BY subject) AS class_size
        FROM scores_by_student
      )
      SELECT subject, class_average, class_highest, class_lowest, class_position, class_size
      FROM ranked_subject_scores
      WHERE result_id = ${resultRow.id}
    `;
    const subjectMetricsByName = new Map(subjectMetrics.map((row) => [row.subject, row]));

    // Retrieve Answer Scripts
    const scriptRows = await sql`
      SELECT * FROM answer_scripts WHERE result_id = ${resultRow.id}
    `;
    const studentAssignments = await sql`
      SELECT id, title, subject, instructions, due_date
      FROM assignments
      WHERE school_id = ${studentRow.school_id}
        AND class_name = ${studentRow.class_name}
        AND status = 'Published'
      ORDER BY due_date ASC, created_at DESC
      LIMIT 30
    `;

    // Map output
    return {
      resultId: resultRow.id,
      studentIdentity: studentRow.public_identity,
      studentName: studentRow.name,
      regNumber: studentRow.registration_number,
      className: studentRow.class_name,
      schoolName: studentRow.school_name,
      assignments: studentAssignments.map((assignment) => ({
        id: Number(assignment.id),
        title: assignment.title,
        subject: assignment.subject,
        instructions: assignment.instructions,
        dueDate: assignment.due_date,
      })),
      schoolCity: studentRow.school_city,
      schoolMotto: studentRow.school_motto,
      schoolLogoUrl: studentRow.logo_url,
      schoolPrimaryColor: studentRow.primary_color,
      schoolSecondaryColor: studentRow.secondary_color,
      schoolHeadTitle: studentRow.head_title ?? null,
      schoolSignatureUrl: studentRow.signature_url ?? null,
      schoolStampUrl: studentRow.stamp_url ?? null,
      schoolLetterheadStyle: studentRow.letterhead_style ?? "classic",
      schoolContactEmail: studentRow.contact_email ?? null,
      schoolContactPhone: studentRow.contact_phone ?? null,
      schoolAddress: studentRow.school_address ?? null,
      schoolLogoPlacement: studentRow.logo_placement ?? "left",
      schoolFontFamily: studentRow.font_family ?? "inter",
      schoolFontWeight: studentRow.font_weight ?? "600",
      schoolFontSizeScale: studentRow.font_size_scale ?? "M",
      schoolHeaderTextColor: studentRow.header_text_color ?? "auto",
      term: resultRow.term,
      session: resultRow.session,
      averageScore: Number(resultRow.average_score),
      classAverage:
        classMetrics[0]?.class_average == null ? null : Number(classMetrics[0].class_average),
      highestAverage:
        classMetrics[0]?.highest_average == null ? null : Number(classMetrics[0].highest_average),
      lowestAverage:
        classMetrics[0]?.lowest_average == null ? null : Number(classMetrics[0].lowest_average),
      position:
        resultRow.position_number && resultRow.total_students
          ? `${resultRow.position_number} of ${resultRow.total_students}`
          : null,
      positionNumber: resultRow.position_number,
      totalStudents: resultRow.total_students,
      attendancePresent: resultRow.attendance_present ?? 0,
      attendanceTotal: resultRow.attendance_total ?? 0,
      timesAbsent: resultRow.times_absent ?? 0,
      resumptionDate: resultRow.resumption_date ?? null,
      promotionStatus: resultRow.promotion_status ?? null,
      promotedToClass: resultRow.promoted_to_class ?? null,
      gender: studentRow.gender ?? "Not supplied",
      photoUrl: studentRow.photo_url ?? null,
      responsibilities: studentRow.responsibilities ?? null,
      principalRemarks: resultRow.principal_remarks ?? "No principal remark.",
      nextTermBegins: resultRow.next_term_begins ?? "To be announced",
      affectiveTraits: resultRow.affective_traits ?? [],
      psychomotorSkills: resultRow.psychomotor_skills ?? [],
      waivedSubjects: resultRow.waived_subjects ?? [],
      remarks: resultRow.remarks ?? "No teacher remark supplied.",
      academicHistory: allResults.map((history) => ({
        resultId: Number(history.id),
        term: history.term,
        session: history.session,
        averageScore: Number(history.average_score ?? 0),
        positionNumber: history.position_number,
        totalStudents: history.total_students,
      })),
      grades: gradesRows.map((g) => {
        const metrics = subjectMetricsByName.get(g.subject);
        const hasClassComparison = Number(metrics?.class_size ?? 0) > 1;
        return {
          subject: g.subject,
          score: g.score,
          caScore: g.ca_score,
          examScore: g.exam_score,
          grade: g.grade,
          classAverage: hasClassComparison ? Number(metrics?.class_average) : undefined,
          classHighest: hasClassComparison ? Number(metrics?.class_highest) : undefined,
          classLowest: hasClassComparison ? Number(metrics?.class_lowest) : undefined,
          classPosition: hasClassComparison ? Number(metrics?.class_position) : undefined,
          classSize: hasClassComparison ? Number(metrics?.class_size) : undefined,
        };
      }),
      answerScripts: scriptRows.map((s) => ({
        subject: s.subject,
        score: s.student_score,
        maxScore: s.max_score,
        grade: s.grade,
        cloudinaryUrl: s.cloudinary_url,
      })),
    };
  });

export const verifySchoolEmailDb = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(20) }))
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const tokens = await sql`
      SELECT * FROM email_verification_tokens
      WHERE token_hash = ${tokenHash}
        AND used_at IS NULL
        AND expires_at > CURRENT_TIMESTAMP
    `;
    if (tokens.length === 0) throw new Error("This verification link is invalid or has expired.");
    await sql.begin(async (transaction) => {
      await transaction`UPDATE schools SET email_verified_at = CURRENT_TIMESTAMP WHERE id = ${tokens[0].school_id}`;
      await transaction`UPDATE email_verification_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ${tokens[0].id}`;
    });
    return { success: true };
  });

export const getSchoolProfileDb = createServerFn({ method: "GET" })
  .validator(z.object({ schoolCode: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const rows = await sql`
      SELECT name, type, motto, city, state, address, website, admin_name, admin_email, admin_phone,
             logo_url, primary_color, secondary_color, email_verified_at, referral_code,
             head_title, signature_url, stamp_url, letterhead_style, contact_email, contact_phone,
             logo_placement, font_family, font_weight, font_size_scale, header_text_color,
             registry_id, staff_code_prefix
      FROM schools
      WHERE school_code = ${data.schoolCode} OR registry_id = ${data.schoolCode}
    `;
    return rows[0] ?? null;
  });

export const updateSchoolBrandingDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string(),
      name: z.string().min(2),
      motto: z.string().optional(),
      city: z.string().min(2),
      type: z.string().min(2),
      address: z.string().optional(),
      website: z.string().url().or(z.literal("")),
      adminName: z.string().min(2),
      adminPhone: z.string().optional(),
      logoUrl: z.string().url().or(z.literal("")),
      primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      headTitle: z.string().optional(),
      signatureUrl: z.string().optional(),
      stampUrl: z.string().optional(),
      letterheadStyle: z.string().optional(),
      contactEmail: z.string().optional(),
      contactPhone: z.string().optional(),
      logoPlacement: z.string().optional(),
      fontFamily: z.string().optional(),
      fontWeight: z.string().optional(),
      fontSizeScale: z.string().optional(),
      headerTextColor: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const [school] = await sql`
      UPDATE schools
      SET name = ${data.name}, type = ${data.type}, motto = ${data.motto ?? ""},
          city = ${data.city}, address = ${data.address ?? ""}, website = ${data.website || null},
          admin_name = ${data.adminName}, admin_phone = ${data.adminPhone ?? ""},
          logo_url = ${data.logoUrl || null}, primary_color = ${data.primaryColor},
          secondary_color = ${data.secondaryColor},
          head_title = ${data.headTitle ?? null},
          signature_url = ${data.signatureUrl ?? null},
          stamp_url = ${data.stampUrl ?? null},
          letterhead_style = ${data.letterheadStyle ?? "classic"},
          contact_email = ${data.contactEmail ?? null},
          contact_phone = ${data.contactPhone ?? null},
          logo_placement = ${data.logoPlacement ?? "left"},
          font_family = ${data.fontFamily ?? "inter"},
          font_weight = ${data.fontWeight ?? "600"},
          font_size_scale = ${data.fontSizeScale ?? "M"},
          header_text_color = ${data.headerTextColor ?? "auto"}
      WHERE school_code = ${data.schoolCode}
      RETURNING name, type, motto, city, address, website, admin_name, admin_email, admin_phone,
                logo_url, primary_color, secondary_color, head_title, signature_url, stamp_url,
                letterhead_style, contact_email, contact_phone,
                logo_placement, font_family, font_weight, font_size_scale, header_text_color
    `;
    if (!school) throw new Error("School not found.");
    return school;
  });

// ----------------------------------------------------
// ADMIN TRANSITIONS — handover & audit trail
// ----------------------------------------------------

export const initiateAdminTransitionDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string(),
      outgoingName: z.string().min(2),
      outgoingTitle: z.string().min(2),
      incomingName: z.string().min(2),
      incomingTitle: z.string().min(2),
      effectiveDate: z.string(),
      transitionType: z.string().default("normal"),
      reason: z.string().optional(),
      witnessName: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();

    // 1. Fetch current school to resolve school_id
    const [school] = await sql`
      SELECT id, admin_name, head_title
      FROM schools WHERE school_code = ${data.schoolCode}
    `;
    if (!school) throw new Error("School not found.");

    // 2. Write permanent, uneditable audit record
    await sql`
      INSERT INTO admin_transitions
        (school_id, outgoing_name, outgoing_title, incoming_name, incoming_title,
         effective_date, transition_type, reason, witness_name, signature_cleared)
      VALUES
        (${school.id}, ${data.outgoingName}, ${data.outgoingTitle},
         ${data.incomingName}, ${data.incomingTitle},
         ${data.effectiveDate}::date, ${data.transitionType},
         ${data.reason ?? null}, ${data.witnessName ?? null}, true)
    `;

    // 3. Update school record — new admin name + title; clear personal signature
    const [updated] = await sql`
      UPDATE schools
      SET admin_name    = ${data.incomingName},
          head_title    = ${data.incomingTitle},
          signature_url = NULL
      WHERE school_code = ${data.schoolCode}
      RETURNING admin_name, head_title
    `;

    return updated;
  });

export const getAdminTransitionsDb = createServerFn({ method: "GET" })
  .validator(z.object({ schoolCode: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const rows = await sql`
      SELECT t.id, t.outgoing_name, t.outgoing_title,
             t.incoming_name, t.incoming_title, t.transition_type,
             t.effective_date, t.reason, t.witness_name, t.signature_cleared, t.created_at

      FROM admin_transitions t
      JOIN schools s ON s.id = t.school_id
      WHERE s.school_code = ${data.schoolCode}
      ORDER BY t.effective_date DESC, t.created_at DESC
    `;
    return rows;
  });

// ── Staff exit functions ─────────────────────────────────────────────────────

/** Returns active teachers for a school (used to populate the exit dropdown). */
export const getTeachersForExitDb = createServerFn({ method: "GET" })
  .validator(z.object({ schoolCode: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const [school] = await sql`SELECT id FROM schools WHERE school_code = ${data.schoolCode}`;
    if (!school) return [];
    return await sql`
      SELECT id, name, subject, role
      FROM teachers
      WHERE school_id = ${school.id}
        AND status NOT IN ('Exited')
      ORDER BY name ASC
    `;
  });

/** Records a staff departure and marks the teacher as Exited. */
export const recordStaffExitDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string(),
      teacherId: z.number(),
      teacherName: z.string().min(1),
      teacherSubject: z.string().optional(),
      teacherRole: z.string().optional(),
      exitType: z.string(),
      effectiveDate: z.string(),
      reason: z.string().optional(),
      witnessName: z.string().optional(),
      recordedBy: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const [school] = await sql`SELECT id FROM schools WHERE school_code = ${data.schoolCode}`;
    if (!school) throw new Error("School not found.");

    // Permanent, uneditable audit record
    await sql`
      INSERT INTO staff_exits
        (school_id, teacher_id, teacher_name, teacher_subject, teacher_role,
         exit_type, effective_date, reason, witness_name, recorded_by)
      VALUES
        (${school.id}, ${data.teacherId}, ${data.teacherName},
         ${data.teacherSubject ?? null}, ${data.teacherRole ?? null},
         ${data.exitType}, ${data.effectiveDate}::date,
         ${data.reason ?? null}, ${data.witnessName ?? null},
         ${data.recordedBy ?? null})
    `;

    // Mark teacher inactive
    await sql`
      UPDATE teachers
      SET status = 'Exited'
      WHERE id = ${data.teacherId} AND school_id = ${school.id}
    `;

    return { ok: true };
  });

/** Returns all staff exit records for a school, newest first. */
export const getStaffExitsDb = createServerFn({ method: "GET" })
  .validator(z.object({ schoolCode: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const rows = await sql`
      SELECT e.id, e.teacher_name, e.teacher_subject, e.teacher_role,
             e.exit_type, e.effective_date, e.reason,
             e.witness_name, e.recorded_by, e.created_at
      FROM staff_exits e
      JOIN schools s ON s.id = e.school_id
      WHERE s.school_code = ${data.schoolCode}
      ORDER BY e.effective_date DESC, e.created_at DESC
    `;
    return rows;
  });

// ----------------------------------------------------
// 3. GET DASHBOARD STATS
// ----------------------------------------------------

export const getDashboardStatsDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string() }))
  .handler(async ({ data }) => {
    await initDb();

    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schoolId = school.school_id;

    // Get Counts
    const studentsCount = await sql`SELECT count(*) FROM students WHERE school_id = ${schoolId}`;
    const pinsUsed =
      await sql`SELECT count(*) FROM pins WHERE school_id = ${schoolId} AND status = 'Used'`;
    const pinsUnused =
      await sql`SELECT count(*) FROM pins WHERE school_id = ${schoolId} AND status = 'Unused'`;
    const pinsTotal = await sql`SELECT count(*) FROM pins WHERE school_id = ${schoolId}`;
    const teachersCount = await sql`SELECT count(*) FROM teachers WHERE school_id = ${schoolId}`;

    // Get class average / stats
    const resultsCount = await sql`
      SELECT count(*) FROM results r
      JOIN students s ON r.student_id = s.id
      WHERE s.school_id = ${schoolId}
    `;
    const pendingReviews = await sql`
      SELECT count(*) FROM results r JOIN students s ON r.student_id = s.id
      WHERE s.school_id = ${schoolId} AND r.workflow_status = 'Submitted'
    `;

    return {
      studentsCount: parseInt(studentsCount[0].count),
      pinsUsed: parseInt(pinsUsed[0].count),
      pinsUnused: parseInt(pinsUnused[0].count),
      pinsTotal: parseInt(pinsTotal[0].count),
      resultsCount: parseInt(resultsCount[0].count),
      pendingReviews: parseInt(pendingReviews[0].count),
      teachersCount: parseInt(teachersCount[0].count),
    };
  });

// ----------------------------------------------------
// 4. GET & ADD STUDENTS
// ----------------------------------------------------
export const getStudentsDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schoolId = school.school_id;

    return await sql`
      SELECT s.*, count(r.id) as results_count,
             ROUND(AVG(r.average_score), 1) AS average_score
      FROM students s
      LEFT JOIN results r ON r.student_id = s.id
      WHERE s.school_id = ${schoolId}
      GROUP BY s.id
      ORDER BY s.name ASC
    `;
  });

export const addStudentDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string(),
      name: z.string().min(2),
      regNumber: z.string().min(2),
      className: z.string(),
      photoUrl: z.string().url().or(z.literal("")).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schoolId = school.school_id;

    // Check duplicate reg number
    const duplicate =
      await sql`SELECT id FROM students WHERE UPPER(registration_number) = ${data.regNumber.toUpperCase()}`;
    if (duplicate.length > 0) {
      throw new Error("A student is already registered with this registration number.");
    }

    const [student] = await sql`
      INSERT INTO students (school_id, name, registration_number, class_name, photo_url)
      VALUES (${schoolId}, ${data.name}, ${data.regNumber.toUpperCase()}, ${data.className}, ${data.photoUrl || null})
      RETURNING *
    `;
    return student;
  });

export const updateStudentDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4, "Sign in again to edit students."),
      id: z.number().int().positive(),
      name: z.string().trim().min(2),
      regNumber: z.string().trim().min(2),
      className: z.string().trim().min(1),
      photoUrl: z.string().url().or(z.literal("")).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const [student] = await sql`
      UPDATE students
      SET name = ${data.name}, registration_number = ${data.regNumber.toUpperCase()},
          class_name = ${data.className}, photo_url = ${data.photoUrl || null}
      WHERE id = ${data.id}
        AND school_id = ${school.school_id}
      RETURNING *
    `;
    if (!student) throw new Error("Student not found.");
    return student;
  });

export const deleteStudentDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4, "Sign in again to remove students."),
      id: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    await sql`
      DELETE FROM students
      WHERE id = ${data.id}
        AND school_id = ${school.school_id}
    `;
    return { success: true };
  });

export const updateStudentResultAccessDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      studentId: z.number().int().positive(),
      status: z.enum(["Allowed", "Restricted"]),
      reason: z.string().trim().optional(),
      expiresAt: z.string().trim().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    if (data.status === "Restricted" && !data.reason) {
      throw new Error("Provide a reason that can be shown to the student.");
    }
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const [student] = await sql`
      UPDATE students
      SET result_access_status = ${data.status},
          result_restriction_reason = ${data.status === "Restricted" ? (data.reason ?? null) : null},
          result_restricted_at = ${data.status === "Restricted" ? new Date() : null},
          result_restricted_by = ${data.status === "Restricted" ? school.admin_name : null},
          result_restriction_expires_at = ${data.status === "Restricted" && data.expiresAt ? data.expiresAt : null}
      WHERE id = ${data.studentId}
        AND school_id = ${school.school_id}
      RETURNING *
    `;
    if (!student) throw new Error("Student not found.");
    return student;
  });

export const getTeachersDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    return await sql`
      SELECT t.*,
        COALESCE((
          SELECT STRING_AGG(cht.class_name, ', ' ORDER BY cht.class_name)
          FROM class_head_teachers cht WHERE cht.teacher_id = t.id
        ), '') AS headed_classes
      FROM teachers t
      WHERE t.school_id = ${school.school_id}
      ORDER BY t.created_at DESC
    `;
  });

export const addTeacherDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string(),
      name: z.string().min(2),
      email: z.string().email(),
      role: z.enum(["Teacher", "Head Teacher"]),
      subject: z.string().optional(),
      classes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const adminSchool = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schools = await sql`
      SELECT id, name, city, registry_id, staff_code_prefix
      FROM schools WHERE id = ${adminSchool.school_id}
    `;
    if (schools.length === 0) throw new Error("School not found.");
    const identity = await ensureSchoolIdentity(schools[0]);
    const status = data.role === "Head Teacher" ? "Invited" : "Active";
    const teacher = await sql.begin(async (transaction) => {
      await transaction`SELECT pg_advisory_xact_lock(${schools[0].id})`;
      const [sequence] = await transaction`
        SELECT COALESCE(MAX(SUBSTRING(staff_id FROM '([0-9]+)$')::int), 0) + 1 AS next_number
        FROM teachers WHERE school_id = ${schools[0].id}
      `;
      const staffId = `ICA-${identity.staffPrefix}-TCH-${String(sequence.next_number).padStart(3, "0")}`;
      const [created] = await transaction`
        INSERT INTO teachers (school_id, staff_id, name, email, role, subject, assigned_classes, status)
        VALUES (${schools[0].id}, ${staffId}, ${data.name}, ${data.email.toLowerCase()}, ${data.role}, ${data.subject ?? ""}, ${data.classes ?? ""}, ${status})
        RETURNING *
      `;
      return created;
    });
    const resend = await getResend();
    if (data.role === "Head Teacher" && resend && process.env.EMAIL_FROM) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: data.email,
        subject: `You have been invited to ${schools[0].name} on iCademia`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#3730A3">Welcome to ${schools[0].name} 🎓</h2>
            <p>Hello <strong>${data.name}</strong>,</p>
            <p>You have been added as <strong>${data.role}</strong> at <strong>${schools[0].name}</strong> on iCademia.</p>
            <div style="background:#f5f5ff;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0 0 4px;color:#666;font-size:13px">Your Staff ID</p>
              <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:2px;color:#3730A3">${teacher.staff_id}</p>
            </div>
            <p>Assigned classes: ${data.classes || "To be assigned"}</p>
            <a href="${getAppOrigin()}/teacher-login" 
               style="display:inline-block;background:#3730A3;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:8px 0">
              Set Up My Account
            </a>
            <p style="color:#999;font-size:12px;margin-top:24px">Sign in at: ${getAppOrigin()}/teacher-login</p>
          </div>
        `,
      });
    }
    return teacher;
  });

export const updateTeacherDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4, "Sign in again to edit teachers."),
      id: z.number().int().positive(),
      name: z.string().trim().min(2),
      email: z.string().email(),
      role: z.enum(["Teacher", "Head Teacher"]),
      subject: z.string().optional(),
      classes: z.string().optional(),
      status: z.enum(["Invited", "Active", "Suspended"]),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const [existing] = await sql`
      SELECT t.*, s.name AS school_name
      FROM teachers t JOIN schools s ON s.id = t.school_id
      WHERE t.id = ${data.id} AND t.school_id = ${school.school_id}
    `;
    if (!existing) throw new Error("Teacher not found.");
    if (existing.role === "Head Teacher" && data.role === "Teacher") {
      const headed = await sql`
        SELECT class_name FROM class_head_teachers
        WHERE school_id = ${existing.school_id} AND teacher_id = ${data.id}
        ORDER BY class_name
      `;
      if (headed.length) {
        throw new Error(
          `Reassign ${headed.map((row) => row.class_name).join(", ")} before removing this Head Teacher's workspace access.`,
        );
      }
    }
    const promoted = existing.role !== "Head Teacher" && data.role === "Head Teacher";
    const nextStatus = promoted ? "Invited" : data.role === "Teacher" ? "Active" : data.status;
    const [teacher] = await sql`
      UPDATE teachers
      SET name = ${data.name}, email = ${data.email.toLowerCase()}, role = ${data.role},
          subject = ${data.subject ?? ""}, assigned_classes = ${data.classes ?? ""},
          status = ${nextStatus},
          password_hash = CASE WHEN ${data.role} = 'Teacher' THEN NULL ELSE password_hash END
      WHERE id = ${data.id}
        AND school_id = ${school.school_id}
      RETURNING *
    `;
    if (data.role === "Teacher") {
      await sql`DELETE FROM teacher_sessions WHERE teacher_id = ${data.id}`;
    }
    if (promoted) {
      const resend = await getResend();
      if (resend && process.env.EMAIL_FROM) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM,
          to: teacher.email,
          subject: `Head Teacher workspace access — ${existing.school_name}`,
          html: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto"><h2 style="color:#3730A3">Head Teacher access granted</h2><p>Hello <strong>${teacher.name}</strong>,</p><p>Your School Administrator has granted you Head Teacher workspace access at <strong>${existing.school_name}</strong>.</p><div style="background:#f5f5ff;border-radius:8px;padding:16px;margin:16px 0"><p style="margin:0 0 4px;color:#666;font-size:13px">Your Staff ID</p><p style="margin:0;font-size:22px;font-weight:700;letter-spacing:2px;color:#3730A3">${teacher.staff_id}</p></div><a href="${getAppOrigin()}/teacher-login" style="display:inline-block;background:#3730A3;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">Set Up My Account</a></div>`,
        });
      }
    }
    return teacher;
  });

export const deleteTeacherDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4, "Sign in again to remove teachers."),
      id: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    await sql`
      DELETE FROM teachers
      WHERE id = ${data.id}
        AND school_id = ${school.school_id}
    `;
    return { success: true };
  });

export const resendTeacherInviteDb = createServerFn({ method: "POST" })
  .validator(
    z.object({ token: z.string().min(20), schoolCode: z.string(), id: z.number().int().positive() }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const [teacher] = await sql`
      SELECT t.*, s.name AS school_name
      FROM teachers t JOIN schools s ON s.id = t.school_id
      WHERE t.id = ${data.id} AND t.school_id = ${school.school_id}
    `;
    if (!teacher) throw new Error("Teacher not found.");
    if (teacher.role !== "Head Teacher") {
      throw new Error("This staff member has not been granted Head Teacher workspace access.");
    }
    const resend = await getResend();
    if (resend && process.env.EMAIL_FROM) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: teacher.email,
        subject: `Reminder: Set up your iCademia account — ${teacher.school_name}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2 style="color:#3730A3">Account Setup Reminder 🔔</h2>
            <p>Hello <strong>${teacher.name}</strong>,</p>
            <p>This is a reminder to set up your teacher account at <strong>${teacher.school_name}</strong>.</p>
            <div style="background:#f5f5ff;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0 0 4px;color:#666;font-size:13px">Your Staff ID</p>
              <p style="margin:0;font-size:22px;font-weight:700;letter-spacing:2px;color:#3730A3">${teacher.staff_id}</p>
            </div>
            <a href="${getAppOrigin()}/teacher-login"
               style="display:inline-block;background:#3730A3;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">
              Set Up My Account
            </a>
          </div>
        `,
      });
    }
    return { success: true };
  });

// ── Teacher Auth ──────────────────────────────────────────────────────────────

export const teacherSetPasswordDb = createServerFn({ method: "POST" })
  .validator(z.object({ staffId: z.string(), password: z.string().min(8) }))
  .handler(async ({ data }) => {
    await initDb();
    const [teacher] = await sql`
      SELECT id, name, email, role, status, password_hash
      FROM teachers t
      WHERE t.staff_id = ${data.staffId}
         OR EXISTS (
           SELECT 1 FROM teacher_staff_id_aliases a
           WHERE a.teacher_id = t.id AND a.staff_id = ${data.staffId}
         )
      LIMIT 1
    `;
    if (!teacher) throw new Error("Staff ID not found. Check the ID in your invite email.");
    if (teacher.role !== "Head Teacher")
      throw new Error("This Staff ID does not have Head Teacher workspace access.");
    if (teacher.password_hash)
      throw new Error("Password already set. Use the Sign In tab instead.");
    // Use the same scrypt pattern as school admin passwords
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(data.password, salt, 64).toString("hex");
    await sql`UPDATE teachers SET password_hash = ${`${salt}:${hash}`}, status = 'Active' WHERE id = ${teacher.id}`;
    return { success: true, name: teacher.name };
  });

export const teacherLoginDb = createServerFn({ method: "POST" })
  .validator(z.object({ staffId: z.string(), password: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const [teacher] = await sql`
      SELECT t.*, s.school_code, s.name AS school_name, s.logo_url, s.primary_color
      FROM teachers t JOIN schools s ON s.id = t.school_id
      WHERE t.staff_id = ${data.staffId}
         OR EXISTS (
           SELECT 1 FROM teacher_staff_id_aliases a
           WHERE a.teacher_id = t.id AND a.staff_id = ${data.staffId}
         )
      LIMIT 1
    `;
    if (!teacher) throw new Error("Staff ID not found.");
    if (teacher.role !== "Head Teacher")
      throw new Error(
        "Your School Administrator has not granted this account Head Teacher access.",
      );
    if (!teacher.password_hash)
      throw new Error('Account not set up yet. Use the "First time?" tab to create your password.');
    if (teacher.status === "Suspended")
      throw new Error("Your account has been suspended. Contact your school administrator.");
    const [salt, storedHash] = String(teacher.password_hash).split(":");
    const suppliedHash = scryptSync(data.password, salt, 64);
    const valid = storedHash && timingSafeEqual(suppliedHash, Buffer.from(storedHash, "hex"));
    if (!valid) throw new Error("Incorrect password.");
    // Create session token (30-day expiry)
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await sql`INSERT INTO teacher_sessions (teacher_id, token_hash, expires_at) VALUES (${teacher.id}, ${tokenHash}, ${expiresAt})`;
    await sql`UPDATE teachers SET last_login = NOW() WHERE id = ${teacher.id}`;
    return {
      token,
      teacher: {
        id: teacher.id,
        staffId: teacher.staff_id,
        name: teacher.name,
        email: teacher.email,
        role: teacher.role,
        subject: teacher.subject,
        assignedClasses: teacher.assigned_classes,
        schoolCode: teacher.school_code,
        schoolName: teacher.school_name,
        logoUrl: teacher.logo_url,
        primaryColor: teacher.primary_color,
      },
    };
  });

export const verifyTeacherSessionDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const [row] = await sql`
      SELECT t.*, s.school_code, s.name AS school_name, s.logo_url, s.primary_color
      FROM teacher_sessions ts
      JOIN teachers t ON t.id = ts.teacher_id
      JOIN schools s ON s.id = t.school_id
      WHERE ts.token_hash = ${tokenHash} AND ts.expires_at > NOW()
        AND t.role = 'Head Teacher' AND t.status = 'Active'
    `;
    if (!row) return null;
    return {
      id: row.id,
      staffId: row.staff_id,
      name: row.name,
      email: row.email,
      role: row.role,
      subject: row.subject,
      assignedClasses: row.assigned_classes,
      schoolCode: row.school_code,
      schoolName: row.school_name,
      logoUrl: row.logo_url,
      primaryColor: row.primary_color,
    };
  });

export const teacherLogoutDb = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    await sql`DELETE FROM teacher_sessions WHERE token_hash = ${tokenHash}`;
    return { success: true };
  });

export const getTeacherMyStudentsDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string(), className: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const [session] =
      await sql`SELECT t.school_id, t.role, t.assigned_classes FROM teacher_sessions ts JOIN teachers t ON t.id = ts.teacher_id WHERE ts.token_hash = ${tokenHash} AND ts.expires_at > NOW() AND t.role = 'Head Teacher' AND t.status = 'Active'`;
    if (!session) throw new Error("Session expired.");
    const assigned = String(session.assigned_classes || "")
      .split(",")
      .map((value) => value.trim());
    if (session.role !== "Head Teacher" || !assigned.includes(data.className))
      throw new Error("You are not assigned to this class.");
    return await sql`
      SELECT s.id, s.name, s.registration_number, s.class_name
      FROM students s WHERE s.school_id = ${session.school_id} AND s.class_name = ${data.className}
      ORDER BY s.name ASC
    `;
  });

export const getTeacherMyResultsDb = createServerFn({ method: "GET" })
  .validator(
    z.object({
      token: z.string(),
      className: z.string(),
      term: z.string(),
      session: z.string(),
      subject: z.string().trim().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const [sess] =
      await sql`SELECT t.school_id, t.role, t.assigned_classes FROM teacher_sessions ts JOIN teachers t ON t.id = ts.teacher_id WHERE ts.token_hash = ${tokenHash} AND ts.expires_at > NOW() AND t.role = 'Head Teacher' AND t.status = 'Active'`;
    if (!sess) throw new Error("Session expired.");
    const assigned = String(sess.assigned_classes || "")
      .split(",")
      .map((value) => value.trim());
    if (sess.role !== "Head Teacher" || !assigned.includes(data.className))
      throw new Error("You are not assigned to this class.");
    const expectedSubjects = await getExpectedSubjectsForClass(sess.school_id, data.className);
    if (
      !expectedSubjects.some(
        (item) => String(item.name).trim().toLowerCase() === data.subject.toLowerCase(),
      )
    ) {
      throw new Error("This subject is not configured for the selected class.");
    }
    return await sql`
      SELECT s.id AS student_id, s.name, s.registration_number,
             g.ca_score, g.exam_score, g.score, g.grade, g.subject,
             r.workflow_status, r.review_note
      FROM students s
      LEFT JOIN results r ON r.student_id = s.id AND r.term = ${data.term} AND r.session = ${data.session}
      LEFT JOIN grades g ON g.result_id = r.id AND LOWER(TRIM(g.subject)) = ${data.subject.toLowerCase()}
      WHERE s.school_id = ${sess.school_id} AND s.class_name = ${data.className}
      ORDER BY s.name ASC
    `;
  });

export const getHeadTeacherClassSubjectsDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string(), className: z.string().trim().min(1) }))
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const [session] = await sql`
      SELECT t.school_id, t.assigned_classes
      FROM teacher_sessions ts
      JOIN teachers t ON t.id = ts.teacher_id
      WHERE ts.token_hash = ${tokenHash} AND ts.expires_at > NOW()
        AND t.role = 'Head Teacher' AND t.status = 'Active'
    `;
    if (!session) throw new Error("Session expired.");
    const assigned = String(session.assigned_classes || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!assigned.includes(data.className)) throw new Error("You are not assigned to this class.");
    const subjects = await getExpectedSubjectsForClass(session.school_id, data.className);
    return { subjects };
  });

export const saveTeacherBulkResultsDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      className: z.string(),
      term: z.string(),
      session: z.string(),
      subject: z.string().trim().min(1),
      scores: z.record(
        z.object({
          ca: z.string(),
          exam: z.string(),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const [sess] = await sql`
      SELECT t.id, t.school_id, t.role, t.assigned_classes
      FROM teacher_sessions ts 
      JOIN teachers t ON t.id = ts.teacher_id 
      JOIN schools s ON s.id = t.school_id
      WHERE ts.token_hash = ${tokenHash} AND ts.expires_at > NOW()
        AND t.role = 'Head Teacher' AND t.status = 'Active'
    `;
    if (!sess) throw new Error("Session expired.");
    const assigned = String(sess.assigned_classes || "")
      .split(",")
      .map((value) => value.trim());
    if (sess.role !== "Head Teacher" || !assigned.includes(data.className))
      throw new Error("You are not assigned to this class.");

    const expectedSubjects = await getExpectedSubjectsForClass(sess.school_id, data.className);
    const configuredSubject = expectedSubjects.find(
      (item) => String(item.name).trim().toLowerCase() === data.subject.toLowerCase(),
    );
    if (!configuredSubject) {
      throw new Error("This subject is not configured for the selected class.");
    }
    const subject = String(configuredSubject.name);
    const phase = detectPhase(data.className);

    for (const [studentIdStr, scoreRow] of Object.entries(data.scores)) {
      const studentId = parseInt(studentIdStr, 10);
      const caScore = scoreRow.ca === "" ? NaN : Number(scoreRow.ca);
      const examScore = scoreRow.exam === "" ? NaN : Number(scoreRow.exam);
      if (Number.isNaN(caScore) && Number.isNaN(examScore)) continue;
      const safeCa = Number.isNaN(caScore) ? 0 : caScore;
      const safeExam = Number.isNaN(examScore) ? 0 : examScore;
      if (safeCa < 0 || safeCa > 40) throw new Error("CA scores must be between 0 and 40.");
      if (safeExam < 0 || safeExam > 60)
        throw new Error("Examination scores must be between 0 and 60.");
      const scoreNum = safeCa + safeExam;
      const [student] =
        await sql`SELECT id FROM students WHERE id = ${studentId} AND school_id = ${sess.school_id} AND class_name = ${data.className}`;
      if (!student) throw new Error("A submitted student is not enrolled in this class.");

      const grade = gradeForPhase(scoreNum, phase).grade;

      const existingResults = await sql`
        SELECT id FROM results 
        WHERE student_id = ${studentId} AND term = ${data.term} AND session = ${data.session}
      `;
      let resultId;
      if (existingResults.length > 0) {
        resultId = existingResults[0].id;
      } else {
        const [insertedResult] = await sql`
          INSERT INTO results (student_id, term, session, workflow_status, submitted_by, submitted_at)
          VALUES (${studentId}, ${data.term}, ${data.session}, 'Submitted', ${sess.id}, NOW())
          RETURNING id
        `;
        resultId = insertedResult.id;
      }

      const existingGrades = await sql`
        SELECT id FROM grades 
        WHERE result_id = ${resultId} AND subject = ${subject}
      `;
      if (existingGrades.length > 0) {
        await sql`
          UPDATE grades
          SET ca_score = ${safeCa}, exam_score = ${safeExam}, score = ${scoreNum}, grade = ${grade}
          WHERE id = ${existingGrades[0].id}
        `;
      } else {
        await sql`
          INSERT INTO grades (result_id, subject, ca_score, exam_score, score, max_score, grade)
          VALUES (${resultId}, ${subject}, ${safeCa}, ${safeExam}, ${scoreNum}, 100, ${grade})
        `;
      }
    }

    // Recalculate average scores for the affected results
    await sql`
      WITH avg_scores AS (
        SELECT r.id, AVG(g.score) as new_avg
        FROM results r
        JOIN grades g ON g.result_id = r.id
        JOIN students st ON st.id = r.student_id
        WHERE st.school_id = ${sess.school_id}
          AND st.class_name = ${data.className}
          AND r.term = ${data.term} AND r.session = ${data.session}
        GROUP BY r.id
      )
      UPDATE results
      SET average_score = avg_scores.new_avg
      FROM avg_scores
      WHERE results.id = avg_scores.id
    `;
    await sql`
      UPDATE results SET workflow_status = 'Submitted', submitted_by = ${sess.id}, submitted_at = NOW(), review_note = NULL
      WHERE term = ${data.term} AND session = ${data.session}
        AND student_id IN (SELECT id FROM students WHERE school_id = ${sess.school_id} AND class_name = ${data.className})
    `;

    return { success: true };
  });

export const getHeadTeacherDashboardDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const [teacher] = await sql`
      SELECT t.id, t.school_id, t.name, t.assigned_classes
      FROM teacher_sessions ts
      JOIN teachers t ON t.id = ts.teacher_id
      WHERE ts.token_hash = ${tokenHash} AND ts.expires_at > NOW()
        AND t.role = 'Head Teacher' AND t.status = 'Active'
    `;
    if (!teacher) throw new Error("Session expired or access is not permitted.");
    const assignedClasses = String(teacher.assigned_classes || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const announcements = await sql`
      SELECT id, title, body, priority, created_at FROM school_announcements
      WHERE school_id = ${teacher.school_id} AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY CASE priority WHEN 'Urgent' THEN 1 WHEN 'Important' THEN 2 ELSE 3 END, created_at DESC
      LIMIT 5
    `;
    if (assignedClasses.length === 0) {
      return {
        summary: { students: 0, classes: 0, assignments: 0, result_records: 0 },
        classes: [],
        recentAssignments: [],
        announcements,
      };
    }
    const [summary] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM students WHERE school_id = ${teacher.school_id} AND class_name IN ${sql(assignedClasses)}) AS students,
        (SELECT COUNT(DISTINCT class_name)::int FROM students WHERE school_id = ${teacher.school_id} AND class_name IN ${sql(assignedClasses)}) AS classes,
        (SELECT COUNT(*)::int FROM assignments WHERE teacher_id = ${teacher.id} AND status = 'Published') AS assignments,
        (SELECT COUNT(*)::int FROM results r JOIN students s ON s.id = r.student_id
          WHERE s.school_id = ${teacher.school_id} AND s.class_name IN ${sql(assignedClasses)}) AS result_records
    `;
    const classes = await sql`
      SELECT class_name, COUNT(*)::int AS students
      FROM students WHERE school_id = ${teacher.school_id} AND class_name IN ${sql(assignedClasses)}
      GROUP BY class_name ORDER BY class_name
    `;
    const recentAssignments = await sql`
      SELECT id, class_name, subject, title, due_date, status, created_at
      FROM assignments WHERE teacher_id = ${teacher.id}
      ORDER BY created_at DESC LIMIT 5
    `;
    return { summary, classes, recentAssignments, announcements };
  });

export const getHeadTeacherAssignmentsDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const [teacher] = await sql`
      SELECT t.id, t.school_id FROM teacher_sessions ts
      JOIN teachers t ON t.id = ts.teacher_id
      WHERE ts.token_hash = ${tokenHash} AND ts.expires_at > NOW()
        AND t.role = 'Head Teacher' AND t.status = 'Active'
    `;
    if (!teacher) throw new Error("Session expired or access is not permitted.");
    return await sql`
      SELECT a.*, COUNT(s.id)::int AS student_count
      FROM assignments a
      LEFT JOIN students s ON s.school_id = a.school_id AND s.class_name = a.class_name
      WHERE a.teacher_id = ${teacher.id}
      GROUP BY a.id ORDER BY a.created_at DESC
    `;
  });

export const createHeadTeacherAssignmentDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string(),
      className: z.string().trim().min(1),
      subject: z.string().trim().min(1),
      title: z.string().trim().min(3),
      instructions: z.string().trim().min(5),
      dueDate: z.string().min(10),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.token).digest("hex");
    const [teacher] = await sql`
      SELECT t.id, t.school_id, t.assigned_classes FROM teacher_sessions ts
      JOIN teachers t ON t.id = ts.teacher_id
      WHERE ts.token_hash = ${tokenHash} AND ts.expires_at > NOW()
        AND t.role = 'Head Teacher' AND t.status = 'Active'
    `;
    if (!teacher) throw new Error("Session expired or access is not permitted.");
    const assignedClasses = String(teacher.assigned_classes || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    if (!assignedClasses.includes(data.className)) {
      throw new Error(
        "You can only publish assignments to classes assigned to you by the School Administrator.",
      );
    }
    const expectedSubjects = await getExpectedSubjectsForClass(teacher.school_id, data.className);
    if (
      !expectedSubjects.some(
        (item) => String(item.name).trim().toLowerCase() === data.subject.toLowerCase(),
      )
    ) {
      throw new Error("Choose a subject configured for this class.");
    }
    const [classRow] = await sql`
      SELECT COUNT(*)::int AS students FROM students
      WHERE school_id = ${teacher.school_id} AND class_name = ${data.className}
    `;
    if (!classRow?.students)
      throw new Error(
        "This class has no enrolled students. Ask the School Admin to add students first.",
      );
    const [assignment] = await sql`
      INSERT INTO assignments (school_id, teacher_id, class_name, subject, title, instructions, due_date)
      VALUES (${teacher.school_id}, ${teacher.id}, ${data.className}, ${data.subject}, ${data.title}, ${data.instructions}, ${data.dueDate})
      RETURNING *
    `;
    return { ...assignment, student_count: classRow.students };
  });

export const getClassSummaryDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    return await sql`
      WITH school_info AS (
        SELECT ${school.school_id}::integer AS id
      ),
      all_class_names AS (
        SELECT DISTINCT class_name 
        FROM students 
        WHERE school_id = (SELECT id FROM school_info) AND class_name IS NOT NULL AND class_name <> ''
        
        UNION
        
        SELECT DISTINCT TRIM(c) as class_name
        FROM teachers t, UNNEST(STRING_TO_ARRAY(t.assigned_classes, ',')) as c
        WHERE t.school_id = (SELECT id FROM school_info) AND t.assigned_classes IS NOT NULL AND TRIM(c) <> ''
      )
      SELECT acn.class_name,
             (SELECT COUNT(*)::int FROM students WHERE class_name = acn.class_name AND school_id = (SELECT id FROM school_info)) AS students,
             COALESCE(
               (
                 SELECT t.name
                 FROM class_head_teachers cht
                 JOIN teachers t ON t.id = cht.teacher_id
                 WHERE cht.school_id = (SELECT id FROM school_info)
                   AND cht.class_name = acn.class_name
                 LIMIT 1
               ),
               'Not assigned'
             ) AS class_heads,
             (
               SELECT cht.teacher_id
               FROM class_head_teachers cht
               WHERE cht.school_id = (SELECT id FROM school_info)
                 AND cht.class_name = acn.class_name
               LIMIT 1
             ) AS head_teacher_id
      FROM all_class_names acn
      ORDER BY acn.class_name
    `;
  });

export const renameClassDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4, "Sign in again to edit classes."),
      currentName: z.string().min(1),
      newName: z.string().trim().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    await sql.begin(async (transaction) => {
      await transaction`
        UPDATE students
        SET class_name = ${data.newName}
        WHERE class_name = ${data.currentName}
          AND school_id = ${school.school_id}
      `;
      await transaction`
        UPDATE teachers
        SET assigned_classes = REPLACE(assigned_classes, ${data.currentName}, ${data.newName})
        WHERE school_id = ${school.school_id}
          AND assigned_classes ILIKE ${`%${data.currentName}%`}
      `;
      await transaction`
        UPDATE class_head_teachers
        SET class_name = ${data.newName}
        WHERE class_name = ${data.currentName}
          AND school_id = ${school.school_id}
      `;
      await transaction`
        UPDATE class_subjects
        SET class_name = ${data.newName}
        WHERE class_name = ${data.currentName}
          AND school_id = ${school.school_id}
      `;
    });
    return { success: true };
  });

export const deleteClassDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4, "Sign in again to edit classes."),
      className: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    await sql.begin(async (transaction) => {
      // 1. Clear class_name on students
      await transaction`
        UPDATE students
        SET class_name = ''
        WHERE class_name = ${data.className}
          AND school_id = ${school.school_id}
      `;
      await transaction`
        DELETE FROM class_head_teachers
        WHERE class_name = ${data.className}
          AND school_id = ${school.school_id}
      `;
      await transaction`
        DELETE FROM class_subjects
        WHERE class_name = ${data.className}
          AND school_id = ${school.school_id}
      `;

      // 2. Remove class from all teachers' assigned_classes
      const teachers = await transaction`
        SELECT id, assigned_classes 
        FROM teachers 
        WHERE school_id = ${school.school_id}
          AND assigned_classes ILIKE ${`%${data.className}%`}
      `;

      for (const t of teachers) {
        if (!t.assigned_classes) continue;
        const classes = t.assigned_classes
          .split(",")
          .map((c: string) => c.trim())
          .filter((c: string) => c !== data.className);

        await transaction`
          UPDATE teachers
          SET assigned_classes = ${classes.length > 0 ? classes.join(", ") : null}
          WHERE id = ${t.id}
        `;
      }
    });
    return { success: true };
  });

// ----------------------------------------------------
// 5. GET & ADD RESULTS & GRADES
// ----------------------------------------------------
export const getResultsDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string() }))
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schoolId = school.school_id;

    return await sql`
      SELECT r.*, s.name as student_name, s.registration_number, s.class_name,
        (SELECT COUNT(DISTINCT LOWER(TRIM(g.subject))) FROM grades g WHERE g.result_id = r.id)::int AS scored_subjects,
        COALESCE(
          NULLIF((SELECT COUNT(*) FROM class_subjects cs WHERE cs.school_id = s.school_id AND cs.class_name = s.class_name), 0),
          NULLIF((
            SELECT COUNT(*) FROM (
              SELECT subject_id FROM timetable_entries te
              WHERE te.school_id = s.school_id AND te.class_name = s.class_name AND te.subject_id IS NOT NULL
              UNION
              SELECT subject_id FROM curriculum_topics ct
              WHERE ct.school_id = s.school_id AND ct.class_name = s.class_name AND ct.subject_id IS NOT NULL
            ) inferred_subjects
          ), 0),
          (SELECT COUNT(*) FROM subjects sub WHERE sub.school_id = s.school_id AND sub.status = 'Active')
        )::int AS expected_subjects,
        COALESCE(jsonb_array_length(COALESCE(r.waived_subjects, '[]'::jsonb)), 0)::int AS waived_subjects_count
      FROM results r
      JOIN students s ON r.student_id = s.id
      WHERE s.school_id = ${schoolId}
      ORDER BY r.created_at DESC
    `;
  });

export const reviewResultSubmissionDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      resultId: z.number().int().positive(),
      decision: z.enum(["Published", "Returned"]),
      note: z.string().trim().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    if (data.decision === "Returned" && !data.note)
      throw new Error("Add a correction note for the Head Teacher.");

    if (data.decision === "Published") {
      const [submission] = await sql`
        SELECT r.id, r.waived_subjects, r.average_score, r.term, r.session, st.school_id, st.class_name
        FROM results r
        JOIN students st ON st.id = r.student_id
        WHERE r.id = ${data.resultId} AND st.school_id = ${school.school_id}
      `;
      if (!submission) throw new Error("Result submission not found.");

      const [activeSubjects, submittedGrades] = await Promise.all([
        getExpectedSubjectsForClass(submission.school_id, submission.class_name),
        sql`SELECT DISTINCT subject FROM grades WHERE result_id = ${data.resultId}`,
      ]);
      const graded = new Set(
        submittedGrades.map((grade) => String(grade.subject).trim().toLowerCase()),
      );
      const waivedRows = Array.isArray(submission.waived_subjects)
        ? submission.waived_subjects
        : [];
      const waived = new Set(
        waivedRows.map((entry: { subject?: string }) =>
          String(entry.subject ?? "")
            .trim()
            .toLowerCase(),
        ),
      );
      const missing = activeSubjects
        .map((subject) => String(subject.name))
        .filter((subject) => {
          const normalized = subject.trim().toLowerCase();
          return !graded.has(normalized) && !waived.has(normalized);
        });

      if (missing.length > 0) {
        throw new Error(
          `Publication blocked: ${missing.join(", ")} ${missing.length === 1 ? "has" : "have"} no submitted score or School Admin waiver. Return the result for correction or add an authorised waiver.`,
        );
      }
    }

    const position = data.decision === "Published"
      ? await sql`
          WITH target_result AS (
            SELECT r.id, r.average_score, r.term, r.session, owner.school_id, owner.class_name
            FROM results r
            JOIN students owner ON owner.id = r.student_id
            WHERE r.id = ${data.resultId} AND owner.school_id = ${school.school_id}
          ), latest_class_results AS (
            SELECT DISTINCT ON (peer.student_id)
              peer.student_id, peer.average_score
            FROM results peer
            JOIN students classmate ON classmate.id = peer.student_id
            JOIN target_result target ON classmate.school_id = target.school_id
              AND classmate.class_name = target.class_name
              AND peer.term = target.term AND peer.session = target.session
            WHERE peer.workflow_status IN ('Submitted', 'Published')
              AND peer.average_score IS NOT NULL
            ORDER BY peer.student_id, (peer.id = (SELECT id FROM target_result)) DESC,
              peer.created_at DESC, peer.id DESC
          )
          SELECT
            (COUNT(*) FILTER (WHERE cohort.average_score > target.average_score))::int + 1 AS position_number,
            COUNT(cohort.student_id)::int AS total_students
          FROM target_result target
          LEFT JOIN latest_class_results cohort ON TRUE
          GROUP BY target.id, target.average_score
        `
      : null;

    const [result] = await sql`
      UPDATE results r SET
        workflow_status = ${data.decision}, reviewed_at = NOW(), review_note = ${data.note || null},
        position_number = CASE WHEN ${data.decision} = 'Published'
          THEN ${position?.[0]?.position_number ?? null} ELSE r.position_number END,
        total_students = CASE WHEN ${data.decision} = 'Published'
          THEN ${position?.[0]?.total_students ?? null} ELSE r.total_students END
      FROM students st
      WHERE r.id = ${data.resultId} AND st.id = r.student_id
        AND st.school_id = ${school.school_id}
      RETURNING r.*
    `;
    if (!result) throw new Error("Result submission not found.");
    return result;
  });

export const getResultReviewDetailDb = createServerFn({ method: "GET" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      resultId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const [result] = await sql`
      SELECT r.*, st.name AS student_name, st.registration_number, st.class_name
      FROM results r
      JOIN students st ON st.id = r.student_id
      WHERE r.id = ${data.resultId} AND st.school_id = ${school.school_id}
    `;
    if (!result) throw new Error("Result submission not found.");
    const grades = await sql`
      SELECT subject, ca_score, exam_score, score, grade
      FROM grades WHERE result_id = ${data.resultId} ORDER BY subject
    `;
    const expectedSubjects = await getExpectedSubjectsForClass(school.school_id, result.class_name);
    const graded = new Set(grades.map((item) => String(item.subject).trim().toLowerCase()));
    const waivers = Array.isArray(result.waived_subjects) ? result.waived_subjects : [];
    const waived = new Set(
      waivers.map((item: { subject?: string }) =>
        String(item.subject ?? "")
          .trim()
          .toLowerCase(),
      ),
    );
    const missingSubjects = expectedSubjects
      .map((item) => String(item.name))
      .filter(
        (name) => !graded.has(name.trim().toLowerCase()) && !waived.has(name.trim().toLowerCase()),
      );
    return { result, grades, expectedSubjects, missingSubjects };
  });

export const waiveResultSubjectDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      resultId: z.number().int().positive(),
      subject: z.string().trim().min(2),
      reason: z.string().trim().min(5),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const [result] = await sql`
      UPDATE results r
      SET waived_subjects = COALESCE(r.waived_subjects, '[]'::jsonb) ||
        jsonb_build_array(jsonb_build_object(
          'subject', ${data.subject},
          'reason', ${data.reason},
          'waivedAt', NOW(),
          'waivedBy', 'School Admin'
        ))
      FROM students st
      WHERE r.id = ${data.resultId} AND st.id = r.student_id
        AND st.school_id = ${school.school_id}
      RETURNING r.id
    `;
    if (!result) throw new Error("Result submission not found.");
    return { success: true };
  });

export const addResultDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      studentId: z.number(),
      term: z.string(),
      question: z.string().trim().max(500).optional(),
      session: z.string(),
      averageScore: z.number(),
      positionNumber: z.number(),
      totalStudents: z.number(),
      remarks: z.string().optional(),
      principalRemarks: z.string().optional(),
      attendancePresent: z.number().int().min(0).optional(),
      attendanceTotal: z.number().int().min(0).optional(),
      timesAbsent: z.number().int().min(0).optional(),
      resumptionDate: z.string().optional(),
      promotionStatus: z.string().optional(),
      promotedToClass: z.string().optional(),
      affectiveTraits: z
        .array(
          z.object({
            trait: z.string(),
            rating: z.number().min(1).max(5),
          }),
        )
        .optional(),
      psychomotorSkills: z
        .array(
          z.object({
            skill: z.string(),
            rating: z.number().min(1).max(5),
          }),
        )
        .optional(),
      waivedSubjects: z
        .array(
          z.object({
            subject: z.string(),
            reason: z.string(),
          }),
        )
        .optional(),
      grades: z.array(
        z.object({
          subject: z.string(),
          caScore: z.number().min(0).max(40),
          examScore: z.number().min(0).max(60),
          score: z.number(),
          grade: z.string(),
        }),
      ),
      answerScripts: z
        .array(
          z.object({
            subject: z.string(),
            score: z.number(),
            grade: z.string(),
            cloudinaryUrl: z.string().optional(),
          }),
        )
        .optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const adminSchool = await requireSchoolAdminSession(data.token, data.schoolCode);
    const studentRows = await sql`SELECT s.class_name, s.school_id, sch.email_verified_at
                 FROM students s 
                 JOIN schools sch ON sch.id = s.school_id 
                 WHERE s.id = ${data.studentId} AND s.school_id = ${adminSchool.school_id}`;
    if (studentRows.length === 0) throw new Error("Student not found.");

    if (!studentRows[0].email_verified_at && process.env.NODE_ENV === "production") {
      throw new Error(
        "Administrator email verification required before publishing term results. Please check your inbox to verify your email.",
      );
    }

    // ── Result Completeness Gatekeeper ──
    const activeSubjects = await getExpectedSubjectsForClass(
      studentRows[0].school_id,
      studentRows[0].class_name,
    );
    if (activeSubjects.length > 0) {
      const gradedSubjectNames = new Set(data.grades.map((g) => g.subject.trim().toLowerCase()));
      const waivedSubjectNames = new Set(
        (data.waivedSubjects ?? []).map((w) => w.subject.trim().toLowerCase()),
      );

      const missingSubjects: string[] = [];
      for (const sub of activeSubjects) {
        const subLower = sub.name.trim().toLowerCase();
        if (!gradedSubjectNames.has(subLower) && !waivedSubjectNames.has(subLower)) {
          missingSubjects.push(sub.name);
        }
      }

      if (missingSubjects.length > 0) {
        throw new Error(
          `Publication blocked by Result Completeness Rule: Missing scores for [${missingSubjects.join(", ")}]. Please enter student scores or explicitly waive these subjects with an administrative reason.`,
        );
      }
    }

    const ranking = await sql`
      SELECT COUNT(*) FILTER (WHERE r.average_score > ${data.averageScore}) + 1 AS position,
             COUNT(DISTINCT s.id) AS total_students
      FROM students s
      LEFT JOIN results r ON r.student_id = s.id
        AND r.term = ${data.term}
        AND r.session = ${data.session}
      WHERE s.school_id = ${studentRows[0].school_id}
        AND s.class_name = ${studentRows[0].class_name}
    `;
    const positionNumber = Number(ranking[0].position);
    const totalStudents = Number(ranking[0].total_students);

    // 1. Correct the existing term record when present; migration must not create duplicates.
    const [existing] = await sql`
      SELECT id FROM results
      WHERE student_id = ${data.studentId} AND term = ${data.term} AND session = ${data.session}
      ORDER BY created_at DESC LIMIT 1
    `;
    const [result] = existing
      ? await sql`
          UPDATE results SET
            average_score = ${data.averageScore}, position_number = ${positionNumber},
            total_students = ${totalStudents}, remarks = ${data.remarks ?? ""},
            principal_remarks = ${data.principalRemarks ?? ""},
            attendance_present = ${data.attendancePresent ?? 0},
            attendance_total = ${data.attendanceTotal ?? 0}, times_absent = ${data.timesAbsent ?? 0},
            resumption_date = ${data.resumptionDate ?? null},
            promotion_status = ${data.promotionStatus ?? null},
            promoted_to_class = ${data.promotedToClass ?? null},
            affective_traits = ${JSON.stringify(data.affectiveTraits ?? [])}::jsonb,
            psychomotor_skills = ${JSON.stringify(data.psychomotorSkills ?? [])}::jsonb,
            waived_subjects = ${JSON.stringify(data.waivedSubjects ?? [])}::jsonb,
            workflow_status = 'Published', reviewed_at = NOW()
          WHERE id = ${existing.id}
          RETURNING id
        `
      : await sql`
          INSERT INTO results (
            student_id, term, session, average_score, position_number, total_students, remarks,
            principal_remarks, attendance_present, attendance_total, times_absent, resumption_date,
            promotion_status, promoted_to_class, affective_traits, psychomotor_skills,
            waived_subjects, workflow_status, reviewed_at
          ) VALUES (
            ${data.studentId}, ${data.term}, ${data.session}, ${data.averageScore},
            ${positionNumber}, ${totalStudents}, ${data.remarks ?? ""},
            ${data.principalRemarks ?? ""}, ${data.attendancePresent ?? 0},
            ${data.attendanceTotal ?? 0}, ${data.timesAbsent ?? 0}, ${data.resumptionDate ?? null},
            ${data.promotionStatus ?? null}, ${data.promotedToClass ?? null},
            ${JSON.stringify(data.affectiveTraits ?? [])}::jsonb,
            ${JSON.stringify(data.psychomotorSkills ?? [])}::jsonb,
            ${JSON.stringify(data.waivedSubjects ?? [])}::jsonb, 'Published', NOW()
          ) RETURNING id
        `;

    if (existing) await sql`DELETE FROM grades WHERE result_id = ${result.id}`;

    // 2. Insert Grades
    for (const g of data.grades) {
      await sql`
        INSERT INTO grades (result_id, subject, ca_score, exam_score, score, max_score, grade)
        VALUES (
          ${result.id}, ${g.subject}, ${g.caScore}, ${g.examScore},
          ${g.score}, 100, ${g.grade}
        )
      `;
    }

    // 3. Insert Answer Scripts
    if (data.answerScripts) {
      for (const s of data.answerScripts) {
        await sql`
          INSERT INTO answer_scripts (result_id, subject, student_score, grade, cloudinary_url)
          VALUES (${result.id}, ${s.subject}, ${s.score}, ${s.grade}, ${s.cloudinaryUrl ?? ""})
        `;
      }
    }

    return { resultId: result.id };
  });

// ----------------------------------------------------
// 6. GET & GENERATE PINS
// ----------------------------------------------------
export const getPinsDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string().min(4) }))
  .handler(async ({ data }) => {
    await initDb();
    const session = await requireSchoolAdminSession(data.token, data.schoolCode);

    return await sql`
      SELECT * FROM pins WHERE school_id = ${session.school_id}
      ORDER BY id DESC
    `;
  });

export const updatePinAccessDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      pinId: z.number().int(),
      status: z.enum(["Allowed", "Restricted"]),
      reason: z.string().trim().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);

    await sql`
      UPDATE pins
      SET result_access_status = ${data.status},
          restriction_reason = ${data.status === "Restricted" ? data.reason || null : null}
      WHERE id = ${data.pinId} AND school_id = ${school.id}
    `;

    return { success: true };
  });

export const getCardOrderContextDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string().min(4) }))
  .handler(async ({ data }) => {
    await initDb();
    const session = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schools = await sql`
      SELECT id, name, admin_email, address FROM schools WHERE id = ${session.school_id}
    `;
    if (schools.length === 0) throw new Error("School not found.");
    const school = schools[0];
    const [enrolment] = await sql`
      SELECT COUNT(*)::int AS total FROM students WHERE school_id = ${session.school_id}
    `;
    const orders = await sql`
      SELECT order_reference, order_type, quantity, unit_price, status,
             fulfillment_status, delivery_address, estimated_delivery_start,
             estimated_delivery_end, paid_at, created_at
      FROM card_orders
      WHERE school_id = ${session.school_id}
      ORDER BY created_at DESC
      LIMIT 10
    `;
    return {
      schoolName: school.name,
      adminEmail: school.admin_email,
      deliveryAddress: school.address,
      enrolledStudents: Number(enrolment?.total ?? 0),
      orders,
    };
  });

export const createTransferCardOrderDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      kind: z.enum(["annual", "replacement"]),
      quantity: z.number().int().min(1).max(500),
      deliveryAddress: z.string().trim().min(10).max(500),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const session = await requireSchoolAdminSession(data.token, data.schoolCode);
    const [school] = await sql`
      SELECT id, name, admin_email FROM schools WHERE id = ${session.school_id}
    `;
    if (!school) throw new Error("School not found.");
    const [enrolment] = await sql`
      SELECT COUNT(*)::int AS total FROM students WHERE school_id = ${school.id}
    `;
    const enrolledStudents = Number(enrolment?.total ?? 0);
    const quantity = data.kind === "annual" ? enrolledStudents : data.quantity;
    if (quantity < 1) {
      throw new Error("Add enrolled students before ordering the annual card batch.");
    }
    if (quantity > 500) {
      throw new Error("Orders above 500 cards require assisted fulfilment. Contact support.");
    }

    const orderReference = `ICA-TRANSFER-${crypto.randomUUID()}`;
    const unitPrice = data.kind === "replacement" ? 2500 : 1500;
    await sql`
      INSERT INTO card_orders (
        school_id, order_reference, order_type, quantity, unit_price, customer_email,
        delivery_address, status, fulfillment_status
      ) VALUES (
        ${school.id}, ${orderReference}, ${data.kind}, ${quantity}, ${unitPrice},
        ${school.admin_email}, ${data.deliveryAddress}, 'Pending', 'Awaiting payment'
      )
    `;

    return {
      orderReference,
      schoolName: school.name,
      customerEmail: school.admin_email,
      quantity,
      unitPrice,
      amountNgn: quantity * unitPrice,
      kind: data.kind,
    };
  });

// ----------------------------------------------------
// 7. GEMINI AI: GENERATE STUDY INSIGHTS
// ----------------------------------------------------
export const generateAiInsightsDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().trim().min(4),
      regNumber: z.string().trim().min(2),
      resultId: z.number().int().positive(),
      studentName: z.string(),
      className: z.string(),
      term: z.string(),
      session: z.string().optional(),
      question: z.string().optional(),
      grades: z.array(
        z.object({
          subject: z.string(),
          score: z.number(),
          grade: z.string(),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();

    const [record] = await sql`
      SELECT s.id AS student_id, s.name, s.class_name, s.result_access_status,
             s.result_restriction_expires_at, p.used_by, p.status AS pin_status,
             p.expires_at, p.result_access_status AS pin_access,
             r.id AS result_id, r.term, r.session
      FROM students s
      JOIN results r ON r.student_id=s.id AND r.id=${data.resultId} AND r.workflow_status='Published'
      JOIN pins p ON p.school_id=s.school_id AND UPPER(p.pin)=${data.pin.toUpperCase()}
      WHERE UPPER(s.registration_number)=${data.regNumber.toUpperCase()}
    `;
    if (
      !record ||
      (record.pin_status === "Used" && record.used_by !== data.regNumber.toUpperCase())
    ) {
      throw new Error("Your result access could not be verified.");
    }
    const restrictionActive =
      record.result_access_status === "Restricted" &&
      (!record.result_restriction_expires_at ||
        new Date(record.result_restriction_expires_at) > new Date());
    if (record.pin_access === "Restricted" || restrictionActive) {
      throw new Error("AI study guidance is unavailable while result access is restricted.");
    }
    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      throw new Error("Your result access card has expired.");
    }

    const verifiedGrades = await sql`
      SELECT subject, score, grade FROM grades WHERE result_id=${data.resultId} ORDER BY subject ASC
    `;
    const grades = verifiedGrades.map((grade) => ({
      subject: String(grade.subject),
      score: Number(grade.score),
      grade: String(grade.grade),
    }));

    const ai = await getGeminiModel();
    if (!ai) {
      return {
        insights: "AI study helper is currently sleeping. (Add GEMINI_API_KEY to activate it!)",
      };
    }

    const gradesText = grades
      .map((g) => `- ${g.subject}: ${g.score}/100 (${g.grade})`)
      .join("\n");

    const prompt = `
      You are an elite academic counselor at iCademia.
      Explain the term report card below in plain English for a Nigerian primary or secondary school student.
      
      Student Name: ${record.name}
      Class: ${record.class_name}
      Term: ${record.term}
      Session: ${record.session || "Current session"}
      
      Academic Record:
      ${gradesText}

      Student question: ${data.question || "Explain my performance and build a study plan."}

      Answer only from the supplied academic record and general, age-appropriate study methods.
      Refuse requests to cheat, complete an assessment, change a score, reveal another student's
      information, diagnose a condition or bypass school rules. If the record cannot answer a
      factual question, say so and recommend asking the relevant teacher.

      Structure your response with clear, beautiful markdown formatting across these 5 distinct sections (use professional, warm, encouraging tones suitable for Nigerian pupils, secondary students, and their parents):
      
      ### 🌟 1. Plain-English Performance Breakdown
      Provide a crystal-clear, jargon-free summary of how the student performed this term. Explain what their average score and grades mean in practical terms, celebrating their achievements while giving honest, constructive feedback.

      ### 🔍 2. Subject Strengths & Specific Learning Gaps
      - **Demonstrated Strengths**: Detail the specific intellectual, mathematical, or linguistic competencies shown in their top-scoring subjects.
      - **Learning Gaps & Friction Points**: For subjects below 75%, pinpoint the exact curriculum topics, concepts, or exam techniques (e.g. algebraic equations, comprehension grammar, chemical reactions) that require focused remediation.

      ### 📚 3. Post-Term / Holiday Reading Roadmap (Week-by-Week Modules)
      Provide a structured, age-appropriate holiday revision schedule:
      - **Week 1 (Concept Foundation)**: Core review modules and textbook chapters to bridge identified gaps.
      - **Week 2 (Deep Dive & Practice)**: Targeted reading and worked examples in core subjects (Mathematics, English, Sciences/Arts).
      - **Week 3 (Next Term Preview)**: Introductory preview modules for next term's syllabus to give the student a head start.
      - **Week 4 (Consolidation & Mock Drills)**: Comprehensive review and timed problem-solving exercises.

      ### ✍️ 4. Derived Holiday Assignments & Practice Exercises
      Provide 4–6 concrete, curriculum-aligned holiday assignment questions/tasks directly derived from the recommended reading modules (e.g., specific math problems to solve, an essay prompt, and science/civic questions).

      ### 👨‍👩‍👦 5. Parent & Guardian Home Advisory
      Give practical, encouraging advice to parents/guardians on how to support their child's revision routine at home, manage study time vs leisure, and build lasting academic confidence.
    `;

    try {
      const response = await ai.generateContent(prompt);
      return { insights: response.response.text() };
    } catch (err) {
      console.error("Gemini API error:", err);
      return { insights: "Could not generate insights at this time. Please try again." };
    }
  });

const quizQuestionSchema = z.object({
  subject: z.string(),
  question: z.string(),
  options: z.array(z.string()).length(4),
  answerIndex: z.number().int().min(0).max(3),
  explanation: z.string(),
});

export const generateStudentQuizDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      pin: z.string().trim().min(4),
      regNumber: z.string().trim().min(2),
      resultId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const [record] = await sql`
      SELECT s.id AS student_id, s.name, s.class_name, s.result_access_status,
             s.result_restriction_expires_at, p.used_by, p.status AS pin_status,
             p.expires_at, p.result_access_status AS pin_access, r.id AS result_id
      FROM students s
      JOIN results r ON r.student_id=s.id AND r.id=${data.resultId} AND r.workflow_status='Published'
      JOIN pins p ON p.school_id=s.school_id AND UPPER(p.pin)=${data.pin.toUpperCase()}
      WHERE UPPER(s.registration_number)=${data.regNumber.toUpperCase()}
    `;
    if (
      !record ||
      (record.pin_status === "Used" && record.used_by !== data.regNumber.toUpperCase())
    ) {
      throw new Error("Your result access could not be verified.");
    }
    if (record.pin_access === "Restricted" || record.result_access_status === "Restricted") {
      throw new Error("Learning tools are unavailable while result access is restricted.");
    }
    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      throw new Error("Your result access card has expired.");
    }
    const grades =
      await sql`SELECT subject, score, grade FROM grades WHERE result_id=${data.resultId} ORDER BY score ASC`;
    const weakGrades = grades.filter((grade) => Number(grade.score) < 65);
    const focusGrades = (weakGrades.length ? weakGrades : grades.slice(0, 1)).slice(0, 5);
    const focus = focusGrades.map((grade) => `${grade.subject} (${grade.score}%)`).join(", ");
    const ai = await getGeminiModel();
    if (!ai) throw new Error("AI learning tools are not configured on this server.");
    const response = await ai.generateContent(`
      Create exactly 5 age-appropriate multiple-choice revision questions PER SUBJECT for ${record.name}, class ${record.class_name}.
      The subject categories are exactly: ${focusGrades.map((grade) => grade.subject).join(", ")}.
      Return ${focusGrades.length * 5} questions total. Do not reproduce an examination or claim to know topics not supplied.
      Test foundational knowledge appropriate to the class and explain each answer in plain English.
      Return JSON only as an array of objects with keys: subject, question, options (exactly 4 strings), answerIndex (0-3), explanation.
    `);
    const raw = response.response
      .text()
      .replace(/^```json\s*/i, "")
      .replace(/```\s*$/, "")
      .trim();
    const questions = z
      .array(quizQuestionSchema)
      .length(focusGrades.length * 5)
      .parse(JSON.parse(raw));
    const attemptToken = randomBytes(24).toString("hex");
    const attemptHash = createHash("sha256").update(attemptToken).digest("hex");
    const [attempt] = await sql`
      INSERT INTO student_quiz_attempts (student_id, result_id, attempt_token_hash, subject_focus, questions)
      VALUES (${record.student_id}, ${data.resultId}, ${attemptHash}, ${focus}, ${sql.json(questions)})
      RETURNING id
    `;
    return {
      attemptToken,
      attemptId: Number(attempt.id),
      focus,
      questions: questions.map(
        ({ answerIndex: _answerIndex, explanation: _explanation, ...question }) => question,
      ),
    };
  });

export const submitStudentQuizDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      attemptToken: z.string().min(20),
      answers: z.array(z.number().int().min(0).max(3)).min(5).max(25),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const tokenHash = createHash("sha256").update(data.attemptToken).digest("hex");
    const [attempt] = await sql`
      SELECT id, questions, completed_at FROM student_quiz_attempts WHERE attempt_token_hash=${tokenHash}
    `;
    if (!attempt) throw new Error("This quiz attempt is invalid.");
    if (attempt.completed_at) throw new Error("This quiz has already been completed.");
    const questions = z.array(quizQuestionSchema).min(5).max(25).parse(attempt.questions);
    if (data.answers.length !== questions.length)
      throw new Error("Answer every question before submitting.");
    const correct = questions.reduce(
      (total, question, index) => total + (question.answerIndex === data.answers[index] ? 1 : 0),
      0,
    );
    const score = Math.round((correct / questions.length) * 100);
    await sql`
      UPDATE student_quiz_attempts
      SET submitted_answers=${sql.json(data.answers)}, score=${score}, completed_at=CURRENT_TIMESTAMP
      WHERE id=${attempt.id}
    `;
    return {
      score,
      correct,
      review: questions.map((question, index) => ({
        ...question,
        selectedIndex: data.answers[index],
        correct: question.answerIndex === data.answers[index],
      })),
    };
  });

export const generateSchoolOperationsBriefDb = createServerFn({ method: "POST" })
  .validator(z.object({ schoolCode: z.string().min(4) }))
  .handler(async ({ data }) => {
    await initDb();
    const schools = await sql`
      SELECT id, name FROM schools WHERE school_code = ${data.schoolCode}
    `;
    if (schools.length === 0) throw new Error("School not found.");
    const school = schools[0];
    const subjectPerformance = await sql`
      SELECT g.subject,
             ROUND(AVG(g.score), 1) AS average,
             COUNT(*) AS submissions,
             COUNT(*) FILTER (WHERE g.score < 50) AS students_below_50
      FROM grades g
      JOIN results r ON r.id = g.result_id
      JOIN students s ON s.id = r.student_id
      WHERE s.school_id = ${school.id}
      GROUP BY g.subject
      ORDER BY average ASC
    `;
    const publication = await sql`
      SELECT COUNT(DISTINCT s.id) AS students,
             COUNT(DISTINCT r.student_id) AS students_with_results
      FROM students s
      LEFT JOIN results r ON r.student_id = s.id
      WHERE s.school_id = ${school.id}
    `;
    if (subjectPerformance.length === 0) {
      return {
        status: "NO_DATA" as const,
        brief: "Publish student results to unlock the school performance brief.",
      };
    }
    const ai = await getGeminiModel();
    if (!ai) {
      return {
        status: "CONFIGURATION_REQUIRED" as const,
        brief: "Add GEMINI_API_KEY on the server to enable AI operations intelligence.",
      };
    }
    const prompt = `You are iCademia's school performance analyst. Produce a concise leadership brief for ${school.name}.
Use only the supplied aggregate, de-identified data. Do not invent facts or identify students.

Publication coverage: ${JSON.stringify(publication[0])}
Subject performance: ${JSON.stringify(subjectPerformance)}

Return four short sections in plain text:
1. Executive summary
2. Subjects needing intervention
3. Recommended Head Teacher actions for the next 30 days. For every action include the owner, exact subject or class, deadline, measurable target, and which iCademia page to open.
4. Data-quality or result-publication gaps

Format the response cleanly with short titled sections, bullet points, evidence figures and next actions. Avoid long paragraphs.
Make recommendations practical for a Nigerian primary or secondary school. Distinguish ordinary Teachers from Head Teachers using the supplied role field. Ordinary Teachers are teaching records without workspace access; only Head Teachers have the academic workspace. Never expose internal numeric database IDs.`;
    const response = await ai.generateContent(prompt);
    return { status: "READY" as const, brief: response.response.text() };
  });

const adminIntelligenceWorkflow = z.enum([
  "result_readiness",
  "anomaly_detection",
  "remarks_assistant",
  "intervention_tracker",
  "curriculum_coverage",
  "workload_optimizer",
  "parent_insights",
  "retention_intelligence",
  "compliance_assistant",
  "principal_copilot",
  "leadership",
]);

export const generateSchoolAdminIntelligenceDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      workflow: adminIntelligenceWorkflow,
      question: z.string().trim().max(500).optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const session = await requireSchoolAdminSession(data.token, data.schoolCode);
    const school = { id: session.school_id, name: session.school_name };
    const [coverage] = await sql`
      SELECT COUNT(DISTINCT s.id)::int AS enrolled_students,
             COUNT(DISTINCT r.student_id)::int AS students_with_results,
             COUNT(DISTINCT s.class_name)::int AS classes,
             COUNT(DISTINCT r.id)::int AS result_records,
             COUNT(DISTINCT CASE WHEN r.remarks IS NULL OR TRIM(r.remarks) = '' THEN r.id END)::int
               AS results_without_remarks
      FROM students s
      LEFT JOIN results r ON r.student_id = s.id
      WHERE s.school_id = ${school.id}
    `;
    const classPerformance = await sql`
      SELECT s.class_name,
             COUNT(DISTINCT s.id)::int AS enrolled,
             COUNT(DISTINCT r.student_id)::int AS reported,
             ROUND(AVG(r.average_score), 1) AS average,
             COUNT(DISTINCT CASE WHEN r.average_score < 50 THEN r.student_id END)::int AS below_50
      FROM students s
      LEFT JOIN results r ON r.student_id = s.id
      WHERE s.school_id = ${school.id}
      GROUP BY s.class_name
      ORDER BY s.class_name
    `;
    const subjectPerformance = await sql`
      SELECT g.subject, ROUND(AVG(g.score), 1) AS average,
             COUNT(*)::int AS submissions,
             COUNT(*) FILTER (WHERE g.score < 50)::int AS below_50
      FROM grades g
      JOIN results r ON r.id = g.result_id
      JOIN students s ON s.id = r.student_id
      WHERE s.school_id = ${school.id}
      GROUP BY g.subject
      ORDER BY average ASC
      LIMIT 20
    `;
    const staffCoverage = await sql`
      SELECT role, status, COUNT(*)::int AS staff
      FROM teachers
      WHERE school_id = ${school.id}
      GROUP BY role, status
      ORDER BY role, status
    `;
    const scriptCoverage = await sql`
      SELECT COUNT(DISTINCT r.id)::int AS results,
             COUNT(DISTINCT a.result_id)::int AS results_with_marked_scripts
      FROM results r
      JOIN students s ON s.id = r.student_id
      LEFT JOIN answer_scripts a ON a.result_id = r.id
      WHERE s.school_id = ${school.id}
    `;
    const attendanceCoverage = await sql`
      SELECT COUNT(*)::int AS records,
             COUNT(DISTINCT student_id)::int AS students,
             COUNT(*) FILTER (WHERE status = 'Absent')::int AS absences
      FROM attendance_records
      WHERE school_id = ${school.id}
    `;
    const curriculumCoverage = await sql`
      SELECT ct.class_name, COALESCE(s.name, 'Unassigned') AS subject,
             COUNT(*)::int AS topics,
             ROUND(AVG(COALESCE(cc.coverage_percent, 0)), 1) AS coverage_percent,
             COUNT(*) FILTER (WHERE COALESCE(cc.status, 'Not started') <> 'Completed')::int
               AS incomplete_topics
      FROM curriculum_topics ct
      LEFT JOIN subjects s ON s.id = ct.subject_id
      LEFT JOIN curriculum_coverage cc ON cc.topic_id = ct.id
      WHERE ct.school_id = ${school.id}
      GROUP BY ct.class_name, s.name
      ORDER BY coverage_percent ASC
    `;
    const timetableCoverage = await sql`
      SELECT t.staff_id, t.name AS teacher_name, t.role AS access_role,
             NULLIF(TRIM(t.subject), '') AS subject_responsibility,
             NULLIF(TRIM(t.assigned_classes), '') AS class_responsibilities,
             COUNT(te.id)::int AS assigned_periods,
             COUNT(DISTINCT te.class_name)::int AS assigned_class_count
      FROM teachers t
      LEFT JOIN timetable_entries te ON te.teacher_id = t.id
      WHERE t.school_id = ${school.id} AND t.status <> 'Inactive'
      GROUP BY t.id, t.staff_id, t.name, t.role, t.subject, t.assigned_classes
      ORDER BY assigned_periods DESC
    `;
    const interventionCoverage = await sql`
      SELECT status, COUNT(*)::int AS interventions,
             COUNT(*) FILTER (WHERE review_on < CURRENT_DATE AND status NOT IN ('Completed', 'Closed'))::int
               AS overdue
      FROM interventions
      WHERE school_id = ${school.id}
      GROUP BY status
    `;
    const anomalies = await sql`
      WITH duplicate_grades AS (
        SELECT r.id AS result_id, g.subject, COUNT(*)::int AS occurrences
        FROM grades g
        JOIN results r ON r.id = g.result_id
        JOIN students s ON s.id = r.student_id
        WHERE s.school_id = ${school.id}
        GROUP BY r.id, g.subject
        HAVING COUNT(*) > 1
      ),
      average_mismatch AS (
        SELECT r.id AS result_id, r.average_score,
               ROUND(AVG(g.score), 2) AS calculated_average
        FROM results r
        JOIN students s ON s.id = r.student_id
        JOIN grades g ON g.result_id = r.id
        WHERE s.school_id = ${school.id}
        GROUP BY r.id, r.average_score
        HAVING ABS(COALESCE(r.average_score, 0) - ROUND(AVG(g.score), 2)) > 0.5
      )
      SELECT
        (SELECT COUNT(*)::int FROM duplicate_grades) AS duplicate_subject_rows,
        (SELECT COUNT(*)::int FROM average_mismatch) AS average_mismatches,
        (SELECT COUNT(*)::int
         FROM grades g
         JOIN results r ON r.id = g.result_id
         JOIN students s ON s.id = r.student_id
         WHERE s.school_id = ${school.id} AND (g.score < 0 OR g.score > COALESCE(g.max_score, 100)))
          AS out_of_range_scores,
        (SELECT COUNT(*)::int
         FROM grades g
         JOIN results r ON r.id = g.result_id
         JOIN students s ON s.id = r.student_id
         WHERE s.school_id = ${school.id}
           AND ((g.ca_score IS NULL AND g.exam_score IS NOT NULL)
             OR (g.ca_score IS NOT NULL AND g.exam_score IS NULL)
             OR (g.ca_score IS NOT NULL AND g.exam_score IS NOT NULL
               AND ABS(g.score - (g.ca_score + g.exam_score)) > 0.01)))
          AS component_inconsistencies
    `;

    const availableResults = Number(coverage?.result_records ?? 0);
    if (availableResults === 0) {
      return {
        status: "NO_DATA" as const,
        output:
          "No student results are available yet. This workflow is ready and will activate after the school uploads result data.",
      };
    }

    if (data.workflow === "anomaly_detection") {
      const finding = anomalies[0];
      const total =
        Number(finding.duplicate_subject_rows) +
        Number(finding.average_mismatches) +
        Number(finding.out_of_range_scores) +
        Number(finding.component_inconsistencies);
      const output = `RESULT ANOMALY CHECK

Verdict: ${total === 0 ? "No structural anomalies detected" : `${total} item(s) require review`}

- Duplicate subject rows: ${finding.duplicate_subject_rows}
- Stored averages inconsistent with subject scores: ${finding.average_mismatches}
- Scores outside the allowed maximum: ${finding.out_of_range_scores}
- CA/exam component inconsistencies: ${finding.component_inconsistencies}

This check is deterministic and does not alter any score. An authorised examination officer should review each flagged record before publication.`;
      await sql`
        INSERT INTO ai_runs (school_id, workflow, input_summary, output_text, status, model)
        VALUES (${school.id}, ${data.workflow}, ${JSON.stringify(finding)}::jsonb, ${output}, 'READY', 'deterministic-rules-v1')
      `;
      return { status: "READY" as const, output };
    }

    const ai = await getGeminiModel();
    if (!ai) {
      return {
        status: "CONFIGURATION_REQUIRED" as const,
        output: "Add GEMINI_API_KEY on the server to enable administrator intelligence.",
      };
    }
    const workflowInstructions = {
      result_readiness:
        "Act as a meticulous examination-quality auditor. Produce a red/amber/green readiness verdict, identify missing results, missing remarks and missing marked scripts, then give a prioritised pre-publication checklist. Never invent a missing student or score.",
      anomaly_detection:
        "This workflow is handled by deterministic rules and should not reach the language model.",
      remarks_assistant:
        "Draft evidence-based teacher and principal remark templates tied only to the supplied performance, attendance and improvement patterns. Avoid generic praise, diagnoses, labels and invented facts. Clearly state when attendance or historical data is unavailable.",
      intervention_tracker:
        "Act as a director of studies. Compare performance patterns with existing intervention status, identify the highest-impact gaps, and propose reviewable interventions with owner roles, baseline, target, start date and review date. Never claim an intervention has worked without outcome data.",
      curriculum_coverage:
        "Compare recorded curriculum coverage with subject and class performance. Identify topics that may require reteaching, but label relationships as hypotheses unless topic-level assessment evidence exists. Expose missing curriculum records.",
      workload_optimizer:
        "Assess timetable periods, class and subject responsibilities, and result-upload coverage. Name each staff member using teacher_name and staff_id, never a database ID, and state whether the role is Teacher or Head Teacher. Recommend a fairer review process, but do not prescribe a reassignment unless the supplied subject responsibility and availability data support it.",
      parent_insights:
        "Create plain-language, supportive parent communication templates explaining verified performance patterns and next steps. Do not identify individual students in aggregate messages or promise outcomes.",
      retention_intelligence:
        "Identify only evidence-supported attendance decline, repeated underperformance or disengagement signals. Treat every signal as a prompt for human review, never as a prediction that a student will leave or fail.",
      compliance_assistant:
        "Prepare a compliance evidence checklist covering result registers, publication coverage, marked scripts, audit gaps, attendance and unresolved interventions. Do not claim legal or regulatory compliance; state what evidence exists and what is missing.",
      principal_copilot:
        "Answer the principal's question using only the supplied verified school data. Cite the exact supporting figures in the answer, distinguish facts from inferences, and say when the data cannot answer the question.",
      leadership:
        "Act as a school chief-of-staff. Write a one-page executive decision memo: what requires attention now, what is working, three decisions for the principal, risks, and a 30-day operating rhythm with measurable indicators.",
    } satisfies Record<z.infer<typeof adminIntelligenceWorkflow>, string>;

    const prompt = `You are iCademia Intelligence, supporting ${school.name}.
Use only the aggregate, de-identified school data below. Do not identify students, invent facts, alter scores or imply that AI has made a final school decision.

TASK
${workflowInstructions[data.workflow]}
${data.workflow === "principal_copilot" ? `PRINCIPAL QUESTION\n${data.question || "Summarise the most important verified academic issue."}` : ""}

SCHOOL DATA
Coverage: ${JSON.stringify(coverage)}
Class performance: ${JSON.stringify(classPerformance)}
Subject performance: ${JSON.stringify(subjectPerformance)}
Staff coverage: ${JSON.stringify(staffCoverage)}
Marked-script coverage: ${JSON.stringify(scriptCoverage[0])}
Attendance coverage: ${JSON.stringify(attendanceCoverage[0])}
Curriculum coverage: ${JSON.stringify(curriculumCoverage)}
Timetable workload: ${JSON.stringify(timetableCoverage)}
Intervention tracking: ${JSON.stringify(interventionCoverage)}
Deterministic anomaly summary: ${JSON.stringify(anomalies[0])}

PRODUCT ROLE MODEL
- School Admin is the school-level administrator.
- "Teacher" is an ordinary teaching staff record used for timetable, subject and class allocation; it has no dashboard access.
- "Head Teacher" is an explicit academic-workspace access role granted by the School Admin. A class may have only one accountable Head Teacher.
- Subject teaching responsibilities and accountable class Head responsibility are separate. Do not infer either from workload alone.
- Never expose or mention an internal numeric database ID. Identify staff only as "Full name (Staff ID)". If a staff name is unavailable, say "Unnamed Head Teacher" rather than printing an ID.

RESPONSE FORMAT
Use this structure exactly:

SUMMARY
- One or two bullets with the most important conclusion.

EVIDENCE USED
- Cite the exact figures from the supplied data.

WHAT NEEDS ATTENTION
- List the highest-priority issues first.

RECOMMENDED ACTIONS
- Give no more than five practical actions. For each action include: Priority, owner, named staff/class/subject affected, exact next step, the iCademia page to open, deadline, and measurable completion target.

MISSING DATA OR LIMITS
- State what the data cannot prove, and label any inference clearly.

Make the output unusually practical for a Nigerian primary or secondary school. Use concise bullets, real staff names when supplied, deadlines, measurable next actions and these page names where relevant: Timetable, People > Staff, Classes & Responsibilities, Result Control, Academic Records, or Attendance. Do not invent organisational roles such as Vice Principal, Head of Department, Timetable Officer, Guidance Counsellor, Form Master or Subject Teacher unless those roles appear in the supplied data. Do not write long paragraphs.`;
    const response = await ai.generateContent(prompt);
    const output = response.response.text();
    await sql`
      INSERT INTO ai_runs (
        school_id, workflow, question, input_summary, output_text, status, model
      ) VALUES (
        ${school.id}, ${data.workflow}, ${data.question ?? null},
        ${JSON.stringify({
          coverage,
          scriptCoverage: scriptCoverage[0],
          attendanceCoverage: attendanceCoverage[0],
          anomalySummary: anomalies[0],
        })}::jsonb,
        ${output}, 'READY', 'gemini-3.6-flash'
      )
    `;
    return { status: "READY" as const, output };
  });

// ----------------------------------------------------
// 8. CLOUDINARY: SECURE SIGNED UPLOADS OR UPLOADER HELPER
// ----------------------------------------------------
export const uploadToCloudinaryDb = createServerFn({ method: "POST" })
  .validator(z.object({ base64Image: z.string() }))
  .handler(async ({ data }) => {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error("Cloudinary credentials are not configured.");
    }
    try {
      const res = await uploadSchoolAsset(data.base64Image);
      return { url: res.secure_url };
    } catch (err) {
      console.error("Cloudinary upload error:", err);
      throw new Error("Failed to upload file to Cloudinary.");
    }
  });

// ----------------------------------------------------
// 9. SCHOOL OPERATIONS: REFERRALS, SUBJECTS & SUPPORT
// ----------------------------------------------------
export const getReferralDashboardDb = createServerFn({ method: "GET" })
  .validator(z.object({ schoolCode: z.string().min(4, "Sign in again to view referrals.") }))
  .handler(async ({ data }) => {
    await initDb();
    const schools = await sql`
      SELECT id, referral_code FROM schools WHERE school_code = ${data.schoolCode}
    `;
    if (schools.length === 0) throw new Error("School not found.");
    const school = schools[0];
    const referrals = await sql`
      SELECT r.id, r.status, r.reward_per_student, r.paid_at, r.created_at,
             s.name AS school_name, s.school_code,
             COUNT(st.id)::int AS enrolled_students,
             COUNT(st.id)::int * r.reward_per_student AS estimated_reward
      FROM referrals r
      JOIN schools s ON s.id = r.referred_school_id
      LEFT JOIN students st ON st.school_id = s.id
      WHERE r.referrer_school_id = ${school.id}
      GROUP BY r.id, s.id
      ORDER BY r.created_at DESC
    `;
    return { referralCode: school.referral_code, referrals };
  });

export const getSubjectsDb = createServerFn({ method: "GET" })
  .validator(z.object({ schoolCode: z.string().min(4, "Sign in again to manage subjects.") }))
  .handler(async ({ data }) => {
    await initDb();
    return await sql`
      SELECT sub.*
      FROM subjects sub
      JOIN schools s ON s.id = sub.school_id
      WHERE s.school_code = ${data.schoolCode}
      ORDER BY sub.name
    `;
  });

async function getExpectedSubjectsForClass(schoolId: number, className: string) {
  const configured = await sql`
    SELECT sub.id, sub.name, sub.code, sub.category
    FROM class_subjects cs
    JOIN subjects sub ON sub.id = cs.subject_id
    WHERE cs.school_id = ${schoolId} AND cs.class_name = ${className} AND sub.status = 'Active'
    ORDER BY sub.name
  `;
  if (configured.length > 0) return configured;

  const inferred = await sql`
    SELECT DISTINCT sub.id, sub.name, sub.code, sub.category
    FROM subjects sub
    WHERE sub.school_id = ${schoolId} AND sub.status = 'Active'
      AND sub.id IN (
        SELECT subject_id FROM timetable_entries
        WHERE school_id = ${schoolId} AND class_name = ${className} AND subject_id IS NOT NULL
        UNION
        SELECT subject_id FROM curriculum_topics
        WHERE school_id = ${schoolId} AND class_name = ${className} AND subject_id IS NOT NULL
      )
    ORDER BY sub.name
  `;
  if (inferred.length > 0) return inferred;

  return await sql`
    SELECT id, name, code, category FROM subjects
    WHERE school_id = ${schoolId} AND status = 'Active'
    ORDER BY name
  `;
}

export const getClassSubjectSetupDb = createServerFn({ method: "GET" })
  .validator(z.object({ schoolCode: z.string().min(4) }))
  .handler(async ({ data }) => {
    await initDb();
    const [school] = await sql`SELECT id FROM schools WHERE school_code = ${data.schoolCode}`;
    if (!school) throw new Error("School not found.");
    const classes = await sql`
      SELECT DISTINCT class_name FROM (
        SELECT class_name FROM students WHERE school_id = ${school.id} AND TRIM(class_name) <> ''
        UNION SELECT class_name FROM timetable_entries WHERE school_id = ${school.id}
        UNION SELECT class_name FROM curriculum_topics WHERE school_id = ${school.id}
      ) class_list ORDER BY class_name
    `;
    const assignments = await sql`
      SELECT class_name, subject_id FROM class_subjects
      WHERE school_id = ${school.id} ORDER BY class_name
    `;
    return { classes, assignments };
  });

export const getExpectedSubjectsDb = createServerFn({ method: "GET" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      className: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);
    const configured = await sql`
      SELECT COUNT(*)::int AS count FROM class_subjects
      WHERE school_id = ${school.school_id} AND class_name = ${data.className}
    `;
    const subjects = await getExpectedSubjectsForClass(school.school_id, data.className);
    return {
      subjects,
      source: Number(configured[0]?.count ?? 0) > 0 ? "configured" : "inferred",
    };
  });

export const saveClassSubjectSetupDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string().min(4),
      className: z.string().trim().min(1),
      subjectIds: z.array(z.number().int().positive()).min(1, "Select at least one subject."),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const [school] = await sql`SELECT id FROM schools WHERE school_code = ${data.schoolCode}`;
    if (!school) throw new Error("School not found.");
    await sql.begin(async (transaction) => {
      await transaction`
        DELETE FROM class_subjects
        WHERE school_id = ${school.id} AND class_name = ${data.className}
      `;
      for (const subjectId of data.subjectIds) {
        await transaction`
          INSERT INTO class_subjects (school_id, class_name, subject_id)
          SELECT ${school.id}, ${data.className}, id FROM subjects
          WHERE id = ${subjectId} AND school_id = ${school.id} AND status = 'Active'
          ON CONFLICT (school_id, class_name, subject_id) DO NOTHING
        `;
      }
    });
    return { success: true };
  });

export const saveSubjectDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string().min(4, "Sign in again to manage subjects."),
      id: z.number().int().positive().optional(),
      name: z.string().trim().min(2),
      code: z.string().trim().max(12).optional(),
      category: z.string().trim().min(2),
      status: z.enum(["Active", "Archived"]),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const schools = await sql`SELECT id FROM schools WHERE school_code = ${data.schoolCode}`;
    if (!schools[0]) throw new Error("School not found.");
    if (data.id) {
      const [subject] = await sql`
        UPDATE subjects
        SET name = ${data.name}, code = ${data.code ?? ""}, category = ${data.category},
            status = ${data.status}
        WHERE id = ${data.id} AND school_id = ${schools[0].id}
        RETURNING *
      `;
      if (!subject) throw new Error("Subject not found.");
      return subject;
    }
    const [subject] = await sql`
      INSERT INTO subjects (school_id, name, code, category, status)
      VALUES (${schools[0].id}, ${data.name}, ${data.code ?? ""}, ${data.category}, ${data.status})
      RETURNING *
    `;
    return subject;
  });

export const deleteSubjectDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string().min(4, "Sign in again to manage subjects."),
      id: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    await sql`
      DELETE FROM subjects
      WHERE id = ${data.id}
        AND school_id = (SELECT id FROM schools WHERE school_code = ${data.schoolCode})
    `;
    return { success: true };
  });

export const getSupportTicketsDb = createServerFn({ method: "GET" })
  .validator(z.object({ schoolCode: z.string().min(4, "Sign in again to view support.") }))
  .handler(async ({ data }) => {
    await initDb();
    return await sql`
      SELECT t.*
      FROM support_tickets t
      JOIN schools s ON s.id = t.school_id
      WHERE s.school_code = ${data.schoolCode}
      ORDER BY t.created_at DESC
    `;
  });

export const createSupportTicketDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string().min(4, "Sign in again to contact support."),
      subject: z.string().trim().min(4),
      category: z.enum(["Access cards", "Results", "Account", "Billing", "Technical", "Other"]),
      priority: z.enum(["Normal", "High", "Urgent"]),
      message: z.string().trim().min(20),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const [ticket] = await sql`
      INSERT INTO support_tickets (school_id, subject, category, priority, message)
      SELECT id, ${data.subject}, ${data.category}, ${data.priority}, ${data.message}
      FROM schools WHERE school_code = ${data.schoolCode}
      RETURNING *
    `;
    if (!ticket) throw new Error("School not found.");
    return ticket;
  });

export const getAcademicOperationsDb = createServerFn({ method: "GET" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string().min(4) }))
  .handler(async ({ data }) => {
    await initDb();
    const session = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schoolId = session.school_id;
    const [teachers, subjects, students, timetable, availability, attendance, topics, coverage] =
      await Promise.all([
        sql`SELECT id, staff_id, name, role, subject, assigned_classes FROM teachers WHERE school_id = ${schoolId} ORDER BY name`,
        sql`SELECT id, name, code FROM subjects WHERE school_id = ${schoolId} AND status = 'Active' ORDER BY name`,
        sql`SELECT id, name, registration_number, class_name FROM students WHERE school_id = ${schoolId} ORDER BY class_name, name`,
        sql`SELECT te.*, t.name AS teacher_name, s.name AS subject_name
            FROM timetable_entries te
            LEFT JOIN teachers t ON t.id = te.teacher_id
            LEFT JOIN subjects s ON s.id = te.subject_id
            WHERE te.school_id = ${schoolId}
            ORDER BY te.day_of_week, te.period_number, te.class_name`,
        sql`SELECT * FROM teacher_availability WHERE school_id = ${schoolId}`,
        sql`SELECT ar.*, s.name AS student_name, s.class_name
            FROM attendance_records ar JOIN students s ON s.id = ar.student_id
            WHERE ar.school_id = ${schoolId} ORDER BY ar.attendance_date DESC LIMIT 500`,
        sql`SELECT ct.*, s.name AS subject_name FROM curriculum_topics ct
            LEFT JOIN subjects s ON s.id = ct.subject_id
            WHERE ct.school_id = ${schoolId} ORDER BY ct.class_name, ct.sequence_number, ct.topic`,
        sql`SELECT cc.* FROM curriculum_coverage cc
            JOIN curriculum_topics ct ON ct.id = cc.topic_id WHERE ct.school_id = ${schoolId}`,
      ]);
    const [interventions, guardians, observations, lifecycle, compliance] = await Promise.all([
      sql`SELECT i.*, s.name AS student_name FROM interventions i
          LEFT JOIN students s ON s.id = i.student_id
          WHERE i.school_id = ${schoolId} ORDER BY i.created_at DESC`,
      sql`SELECT pg.*, s.name AS student_name FROM parent_guardians pg
          JOIN students s ON s.id = pg.student_id
          WHERE pg.school_id = ${schoolId} ORDER BY s.name, pg.name`,
      sql`SELECT eo.*, s.name AS student_name FROM engagement_observations eo
          JOIN students s ON s.id = eo.student_id
          WHERE eo.school_id = ${schoolId} ORDER BY eo.observation_date DESC LIMIT 500`,
      sql`SELECT sl.*, s.name AS student_name FROM student_lifecycle sl
          JOIN students s ON s.id = sl.student_id
          WHERE sl.school_id = ${schoolId} ORDER BY sl.event_date DESC`,
      sql`SELECT * FROM compliance_requirements WHERE school_id = ${schoolId}
          ORDER BY due_date NULLS LAST, created_at DESC`,
    ]);
    return {
      teachers,
      subjects,
      students,
      timetable,
      availability,
      attendance,
      topics,
      coverage,
      interventions,
      guardians,
      observations,
      lifecycle,
      compliance,
    };
  });

const timetableRecord = z.object({
  id: z.number().int().positive().optional(),
  teacherId: z.number().int().positive().nullable(),
  subjectId: z.number().int().positive().nullable(),
  className: z.string().trim().min(1),
  dayOfWeek: z.number().int().min(1).max(5),
  periodNumber: z.number().int().min(1).max(12),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  room: z.string().trim().optional(),
  entryType: z.enum(["Lesson", "Break", "Assembly", "Activity"]),
  title: z.string().trim().optional(),
});

export const saveTimetableEntryDb = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string().min(4), entry: timetableRecord }))
  .handler(async ({ data }) => {
    await initDb();
    const session = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schoolId = session.school_id;
    const entry = data.entry;
    if (entry.teacherId) {
      const [teacher] = await sql`SELECT id FROM teachers WHERE id = ${entry.teacherId} AND school_id = ${schoolId}`;
      if (!teacher) throw new Error("Selected teacher was not found in this school.");
    }
    if (entry.subjectId) {
      const [subject] = await sql`SELECT id FROM subjects WHERE id = ${entry.subjectId} AND school_id = ${schoolId}`;
      if (!subject) throw new Error("Selected subject was not found in this school.");
    }
    const room = entry.room?.trim() || "";
    const shouldCheckRoom =
      room.length > 0 &&
      !/^(junior block|senior block|science block|arts block|commercial block|assembly ground|courtyard|hall)$/i.test(
        room,
      );
    const conflicts = await sql`
      SELECT te.id, te.class_name, te.room, t.name AS teacher_name,
             CASE
               WHEN te.class_name = ${entry.className} THEN 'class'
               WHEN ${entry.teacherId}::int IS NOT NULL AND te.teacher_id = ${entry.teacherId}
                 THEN 'teacher'
               WHEN ${shouldCheckRoom}::boolean AND te.room = ${room}
                 THEN 'room'
               ELSE 'unknown'
             END AS conflict_type
      FROM timetable_entries te
      LEFT JOIN teachers t ON t.id = te.teacher_id
      WHERE te.school_id = ${schoolId}
        AND te.day_of_week = ${entry.dayOfWeek}
        AND te.period_number = ${entry.periodNumber}
        AND (${entry.id ?? null}::int IS NULL OR te.id <> ${entry.id ?? null})
        AND (
          te.class_name = ${entry.className}
          OR (${entry.teacherId}::int IS NOT NULL AND te.teacher_id = ${entry.teacherId})
          OR (${shouldCheckRoom}::boolean AND te.room = ${room})
        )
      LIMIT 1
    `;
    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      if (conflict.conflict_type === "class") {
        throw new Error(`${entry.className} already has an entry in that period.`);
      }
      if (conflict.conflict_type === "teacher") {
        throw new Error(`${conflict.teacher_name ?? "This teacher"} is already assigned then.`);
      }
      if (conflict.conflict_type === "room") {
        throw new Error(`${room} is already booked in that period.`);
      }
      throw new Error("This period conflicts with an existing timetable assignment.");
    }
    if (entry.teacherId) {
      const unavailable = await sql`
        SELECT id FROM teacher_availability
        WHERE teacher_id = ${entry.teacherId}
          AND day_of_week = ${entry.dayOfWeek}
          AND period_number = ${entry.periodNumber}
          AND is_available = FALSE
      `;
      if (unavailable.length > 0) throw new Error("The selected teacher is unavailable then.");
    }
    const [saved] = entry.id
      ? await sql`
          UPDATE timetable_entries SET teacher_id = ${entry.teacherId},
            subject_id = ${entry.subjectId}, class_name = ${entry.className},
            day_of_week = ${entry.dayOfWeek}, period_number = ${entry.periodNumber},
            starts_at = ${entry.startsAt || null}, ends_at = ${entry.endsAt || null},
            room = ${entry.room || null}, entry_type = ${entry.entryType},
            title = ${entry.title || null}
            WHERE id = ${entry.id} AND school_id = ${schoolId} RETURNING *
        `
      : await sql`
          INSERT INTO timetable_entries (
            school_id, teacher_id, subject_id, class_name, day_of_week, period_number,
            starts_at, ends_at, room, entry_type, title
          ) VALUES (
            ${schoolId}, ${entry.teacherId}, ${entry.subjectId}, ${entry.className},
            ${entry.dayOfWeek}, ${entry.periodNumber}, ${entry.startsAt || null},
            ${entry.endsAt || null}, ${entry.room || null}, ${entry.entryType},
            ${entry.title || null}
          ) RETURNING *
        `;
    return saved;
  });

export const bulkImportTimetableDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      entries: z
        .array(timetableRecord.omit({ id: true }))
        .min(1)
        .max(500),
    }),
  )
  .handler(async ({ data }) => {
    await requireSchoolAdminSession(data.token, data.schoolCode);
    const saved = [];
    for (const entry of data.entries) {
      saved.push(await saveTimetableEntryDb({ data: { token: data.token, schoolCode: data.schoolCode, entry } }));
    }
    return { imported: saved.length };
  });

export const deleteTimetableEntryDb = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string().min(4), id: z.number().int().positive() }))
  .handler(async ({ data }) => {
    await initDb();
    const session = await requireSchoolAdminSession(data.token, data.schoolCode);
    await sql`
      DELETE FROM timetable_entries WHERE id = ${data.id}
        AND school_id = ${session.school_id}
    `;
    return { success: true };
  });

const operationInput = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("attendance"),
    studentId: z.number(),
    date: z.string(),
    status: z.enum(["Present", "Absent", "Late", "Excused"]),
    note: z.string().optional(),
  }),
  z.object({
    kind: z.literal("curriculum"),
    subjectId: z.number().nullable(),
    className: z.string().min(1),
    term: z.string().min(1),
    session: z.string().min(1),
    topic: z.string().min(2),
    sequenceNumber: z.number().int().optional(),
    expectedBy: z.string().optional(),
  }),
  z.object({
    kind: z.literal("coverage"),
    topicId: z.number(),
    teacherId: z.number().nullable(),
    status: z.enum(["Not started", "In progress", "Completed", "Reteach"]),
    percentage: z.number().int().min(0).max(100),
    evidenceUrl: z.string().optional(),
    note: z.string().optional(),
  }),
  z.object({
    kind: z.literal("intervention"),
    studentId: z.number().nullable(),
    className: z.string().optional(),
    subject: z.string().optional(),
    title: z.string().min(3),
    rationale: z.string().optional(),
    ownerRole: z.string().min(2),
    baseline: z.number().optional(),
    target: z.number().optional(),
    startsOn: z.string().optional(),
    reviewOn: z.string().optional(),
  }),
  z.object({
    kind: z.literal("guardian"),
    studentId: z.number(),
    name: z.string().min(2),
    relationship: z.string().min(2),
    email: z.string().email().or(z.literal("")),
    phone: z.string().optional(),
    preferredChannel: z.enum(["Email", "SMS", "WhatsApp", "Phone"]),
    consent: z.boolean(),
    emergency: z.boolean(),
  }),
  z.object({
    kind: z.literal("observation"),
    studentId: z.number(),
    date: z.string(),
    category: z.string().min(2),
    rating: z.number().int().min(1).max(5).optional(),
    note: z.string().min(3),
  }),
  z.object({
    kind: z.literal("lifecycle"),
    studentId: z.number(),
    eventType: z.enum(["Admission", "Transfer in", "Withdrawal", "Transfer out", "Graduation"]),
    date: z.string(),
    reason: z.string().optional(),
    destination: z.string().optional(),
    note: z.string().optional(),
  }),
  z.object({
    kind: z.literal("compliance"),
    title: z.string().min(3),
    authority: z.string().optional(),
    requirementType: z.string().min(2),
    dueDate: z.string().optional(),
    inspectionStart: z.string().optional(),
    inspectionEnd: z.string().optional(),
    ownerRole: z.string().optional(),
    note: z.string().optional(),
  }),
  z.object({
    kind: z.literal("availability"),
    teacherId: z.number(),
    dayOfWeek: z.number().int().min(1).max(5),
    periodNumber: z.number().int().min(1).max(12),
    isAvailable: z.boolean(),
    note: z.string().optional(),
  }),
]);

export const saveAcademicOperationDb = createServerFn({ method: "POST" })
  .validator(z.object({ token: z.string().min(20), schoolCode: z.string().min(4), record: operationInput }))
  .handler(async ({ data }) => {
    await initDb();
    const session = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schoolId = session.school_id;
    const record = data.record;
    if (record.kind === "attendance" || record.kind === "intervention" || record.kind === "guardian" || record.kind === "observation" || record.kind === "lifecycle") {
      if (record.studentId !== null) {
        const [student] = await sql`SELECT id FROM students WHERE id = ${record.studentId} AND school_id = ${schoolId}`;
        if (!student) throw new Error("Selected student was not found in this school.");
      }
    }
    if (record.kind === "curriculum" && record.subjectId !== null) {
      const [subject] = await sql`SELECT id FROM subjects WHERE id = ${record.subjectId} AND school_id = ${schoolId}`;
      if (!subject) throw new Error("Selected subject was not found in this school.");
    }
    if (record.kind === "coverage") {
      const [topic] = await sql`SELECT id FROM curriculum_topics WHERE id = ${record.topicId} AND school_id = ${schoolId}`;
      if (!topic) throw new Error("Selected curriculum topic was not found in this school.");
      if (record.teacherId !== null) {
        const [teacher] = await sql`SELECT id FROM teachers WHERE id = ${record.teacherId} AND school_id = ${schoolId}`;
        if (!teacher) throw new Error("Selected teacher was not found in this school.");
      }
    }
    if (record.kind === "availability") {
      const [teacher] = await sql`SELECT id FROM teachers WHERE id = ${record.teacherId} AND school_id = ${schoolId}`;
      if (!teacher) throw new Error("Selected teacher was not found in this school.");
    }
    if (record.kind === "attendance") {
      return (
        await sql`
          INSERT INTO attendance_records (school_id, student_id, attendance_date, status, note)
          VALUES (${schoolId}, ${record.studentId}, ${record.date}, ${record.status}, ${record.note ?? null})
          ON CONFLICT (student_id, attendance_date) DO UPDATE
          SET status = EXCLUDED.status, note = EXCLUDED.note RETURNING *
        `
      )[0];
    }
    if (record.kind === "curriculum") {
      return (
        await sql`
          INSERT INTO curriculum_topics (
            school_id, subject_id, class_name, term, session, topic, sequence_number, expected_by
          ) VALUES (
            ${schoolId}, ${record.subjectId}, ${record.className}, ${record.term}, ${record.session},
            ${record.topic}, ${record.sequenceNumber ?? null}, ${record.expectedBy || null}
          ) RETURNING *
        `
      )[0];
    }
    if (record.kind === "coverage") {
      return (
        await sql`
          INSERT INTO curriculum_coverage (
            topic_id, teacher_id, status, coverage_percent, completed_at, evidence_url, note
          ) VALUES (
            ${record.topicId}, ${record.teacherId}, ${record.status}, ${record.percentage},
            ${record.status === "Completed" ? new Date() : null}, ${record.evidenceUrl || null},
            ${record.note ?? null}
          ) RETURNING *
        `
      )[0];
    }
    if (record.kind === "intervention") {
      return (
        await sql`
          INSERT INTO interventions (
            school_id, student_id, class_name, subject, title, rationale, owner_role,
            baseline_value, target_value, starts_on, review_on
          ) VALUES (
            ${schoolId}, ${record.studentId}, ${record.className ?? null}, ${record.subject ?? null},
            ${record.title}, ${record.rationale ?? null}, ${record.ownerRole},
            ${record.baseline ?? null}, ${record.target ?? null}, ${record.startsOn || null},
            ${record.reviewOn || null}
          ) RETURNING *
        `
      )[0];
    }
    if (record.kind === "guardian") {
      return (
        await sql`
          INSERT INTO parent_guardians (
            school_id, student_id, name, relationship, email, phone, preferred_channel,
            communication_consent, emergency_contact
          ) VALUES (
            ${schoolId}, ${record.studentId}, ${record.name}, ${record.relationship},
            ${record.email || null}, ${record.phone || null}, ${record.preferredChannel},
            ${record.consent}, ${record.emergency}
          ) RETURNING *
        `
      )[0];
    }
    if (record.kind === "observation") {
      return (
        await sql`
          INSERT INTO engagement_observations (
            school_id, student_id, observation_date, category, rating, note
          ) VALUES (
            ${schoolId}, ${record.studentId}, ${record.date}, ${record.category},
            ${record.rating ?? null}, ${record.note}
          ) RETURNING *
        `
      )[0];
    }
    if (record.kind === "lifecycle") {
      return (
        await sql`
          INSERT INTO student_lifecycle (
            school_id, student_id, event_type, event_date, reason, destination, note
          ) VALUES (
            ${schoolId}, ${record.studentId}, ${record.eventType}, ${record.date},
            ${record.reason ?? null}, ${record.destination ?? null}, ${record.note ?? null}
          ) RETURNING *
        `
      )[0];
    }
    if (record.kind === "compliance") {
      return (
        await sql`
          INSERT INTO compliance_requirements (
            school_id, title, authority, requirement_type, due_date, inspection_start,
            inspection_end, owner_role, note
          ) VALUES (
            ${schoolId}, ${record.title}, ${record.authority ?? null}, ${record.requirementType},
            ${record.dueDate || null}, ${record.inspectionStart || null},
            ${record.inspectionEnd || null}, ${record.ownerRole ?? null}, ${record.note ?? null}
          ) RETURNING *
        `
      )[0];
    }
    return (
      await sql`
        INSERT INTO teacher_availability (
          school_id, teacher_id, day_of_week, period_number, is_available, note
        ) VALUES (
          ${schoolId}, ${record.teacherId}, ${record.dayOfWeek}, ${record.periodNumber},
          ${record.isAvailable}, ${record.note ?? null}
        ) ON CONFLICT (teacher_id, day_of_week, period_number) DO UPDATE
        SET is_available = EXCLUDED.is_available, note = EXCLUDED.note RETURNING *
      `
    )[0];
  });

export const bulkAddObservationsDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string(),
      observations: z.array(
        z.object({
          studentId: z.number(),
          date: z.string(),
          category: z.string(),
          rating: z.number().int().min(1).max(5),
          note: z.string(),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const session = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schoolId = session.school_id;
    const ids = Array.from(new Set(data.observations.map((obs) => obs.studentId)));
    const students = await sql`SELECT id FROM students WHERE school_id = ${schoolId} AND id = ANY(${ids})`;
    if (students.length !== ids.length) throw new Error("One or more students were not found in this school.");

    await sql.begin(async (transaction) => {
      for (const obs of data.observations) {
        await transaction`
          INSERT INTO engagement_observations (
            school_id, student_id, observation_date, category, rating, note
          ) VALUES (
            ${schoolId}, ${obs.studentId}, ${obs.date}, ${obs.category},
            ${obs.rating}, ${obs.note}
          )
        `;
      }
    });

    return { success: true };
  });

// ----------------------------------------------------
// 10. PLATFORM SUPER ADMIN
// ----------------------------------------------------
function requireSuperAdmin(key: string) {
  if (!process.env.SUPER_ADMIN_KEY) {
    throw new Error("SUPER_ADMIN_KEY is not configured on the server.");
  }
  if (key !== process.env.SUPER_ADMIN_KEY) throw new Error("Invalid platform administrator key.");
}

export const getSuperAdminOverviewDb = createServerFn({ method: "POST" })
  .validator(z.object({ adminKey: z.string().min(8) }))
  .handler(async ({ data }) => {
    requireSuperAdmin(data.adminKey);
    await initDb();
    const [metrics] = await sql`
      SELECT
        (SELECT COUNT(*)::int FROM schools) AS schools,
        (SELECT COUNT(*)::int FROM students) AS students,
        (SELECT COUNT(*)::int FROM teachers) AS teachers,
        (SELECT COUNT(*)::int FROM card_orders) AS card_orders,
        (SELECT COUNT(*)::int FROM card_orders WHERE status = 'Paid') AS paid_orders,
        (SELECT COALESCE(SUM(quantity * unit_price), 0)::int FROM card_orders WHERE status = 'Paid')
          AS card_revenue,
        (SELECT COUNT(*)::int FROM support_tickets WHERE status = 'Open') AS open_tickets
    `;
    const orders = await sql`
      SELECT co.id, co.order_reference, co.order_type, co.quantity, co.unit_price, co.status,
             co.fulfillment_status, co.delivery_address, co.created_at, s.name AS school_name,
             s.school_code
      FROM card_orders co
      JOIN schools s ON s.id = co.school_id
      ORDER BY co.created_at DESC
      LIMIT 50
    `;
    const schools = await sql`
      SELECT s.id, s.name, s.school_code, s.admin_email, s.city, s.state, s.created_at,
             (s.admin_password_hash IS NOT NULL) AS account_ready,
             COUNT(DISTINCT st.id)::int AS students,
             COUNT(DISTINCT t.id)::int AS teachers
      FROM schools s
      LEFT JOIN students st ON st.school_id = s.id
      LEFT JOIN teachers t ON t.school_id = s.id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 50
    `;
    const content = await sql`
      SELECT * FROM portal_content ORDER BY created_at DESC LIMIT 50
    `;
    const referrals = await sql`
      SELECT r.id, r.status, r.reward_per_student, r.paid_at,
             a.name AS referrer_school, b.name AS referred_school,
             COUNT(st.id)::int AS enrolled_students,
             COUNT(st.id)::int * r.reward_per_student AS tracked_reward
      FROM referrals r
      JOIN schools a ON a.id = r.referrer_school_id
      JOIN schools b ON b.id = r.referred_school_id
      LEFT JOIN students st ON st.school_id = b.id
      GROUP BY r.id, a.id, b.id
      ORDER BY r.created_at DESC
    `;
    return { metrics, orders, schools, content, referrals };
  });

export const updateCardOrderFulfillmentDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      adminKey: z.string().min(8),
      orderId: z.number().int().positive(),
      fulfillmentStatus: z.enum([
        "Awaiting payment",
        "Preparing branded card batch",
        "Printing",
        "Dispatched",
        "Delivered",
        "On hold",
      ]),
    }),
  )
  .handler(async ({ data }) => {
    requireSuperAdmin(data.adminKey);
    await initDb();
    const [existingOrder] = await sql`
      SELECT status FROM card_orders WHERE id = ${data.orderId}
    `;
    if (!existingOrder) throw new Error("Order not found.");
    if (existingOrder.status !== "Paid" && data.fulfillmentStatus !== "Awaiting payment") {
      throw new Error("Confirm the transfer before updating fulfilment.");
    }
    const [order] = await sql`
      UPDATE card_orders
      SET fulfillment_status = ${data.fulfillmentStatus},
          dispatched_at = CASE WHEN ${data.fulfillmentStatus} = 'Dispatched' THEN CURRENT_TIMESTAMP ELSE dispatched_at END,
          delivered_at = CASE WHEN ${data.fulfillmentStatus} = 'Delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END
      WHERE id = ${data.orderId} AND status = ${existingOrder.status}
      RETURNING *
    `;
    if (!order) throw new Error("Order not found.");
    return order;
  });

function addCardOrderWorkingDays(from: Date, workingDays: number) {
  const result = new Date(from);
  let added = 0;
  while (added < workingDays) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result.toISOString().slice(0, 10);
}

export const confirmCardOrderTransferDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      adminKey: z.string().min(8),
      orderId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    requireSuperAdmin(data.adminKey);
    await initDb();
    let confirmedOrderReference = "";
    await sql.begin(async (transaction) => {
      const [order] = await transaction`
        SELECT * FROM card_orders WHERE id = ${data.orderId} FOR UPDATE
      `;
      if (!order) throw new Error("Order not found.");
      if (order.status === "Paid") {
        confirmedOrderReference = order.order_reference;
        return;
      }
      if (order.status !== "Pending") {
        throw new Error("Only pending transfers can be confirmed.");
      }

      for (let i = 0; i < order.quantity; i++) {
        const rawPin = crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
        const pin = `${rawPin.slice(0, 4)}-${rawPin.slice(4, 8)}-${rawPin.slice(8, 12)}`;
        const serial = `ICA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
        await transaction`
          INSERT INTO pins (school_id, pin, serial, status, payment_reference)
          VALUES (${order.school_id}, ${pin}, ${serial}, 'Unused', ${order.order_reference})
        `;
      }

      await transaction`
        UPDATE card_orders
        SET status = 'Paid',
            fulfillment_status = 'Preparing branded card batch',
            paid_at = CURRENT_TIMESTAMP,
            estimated_delivery_start = ${addCardOrderWorkingDays(new Date(), 5)},
            estimated_delivery_end = ${addCardOrderWorkingDays(new Date(), 12)}
        WHERE id = ${order.id}
      `;
      confirmedOrderReference = order.order_reference;
    });
    return { success: true, orderReference: confirmedOrderReference };
  });

export const savePortalContentDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      adminKey: z.string().min(8),
      id: z.number().int().positive().optional(),
      contentType: z.enum(["Conference", "Competition", "Announcement", "Wall of Fame"]),
      title: z.string().trim().min(3),
      summary: z.string().trim().min(10),
      status: z.enum(["Draft", "Published", "Archived"]),
      eventDate: z.string().optional(),
      location: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    requireSuperAdmin(data.adminKey);
    await initDb();
    if (data.id) {
      const [content] = await sql`
        UPDATE portal_content
        SET content_type = ${data.contentType}, title = ${data.title}, summary = ${data.summary},
            status = ${data.status}, event_date = ${data.eventDate || null},
            location = ${data.location ?? ""}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${data.id}
        RETURNING *
      `;
      return content;
    }
    const [content] = await sql`
      INSERT INTO portal_content (content_type, title, summary, status, event_date, location)
      VALUES (${data.contentType}, ${data.title}, ${data.summary}, ${data.status},
              ${data.eventDate || null}, ${data.location ?? ""})
      RETURNING *
    `;
    return content;
  });

export const updateReferralStatusDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      adminKey: z.string().min(8),
      referralId: z.number().int().positive(),
      status: z.enum(["Onboarding", "Qualified", "Approved", "Paid", "Rejected"]),
    }),
  )
  .handler(async ({ data }) => {
    requireSuperAdmin(data.adminKey);
    await initDb();
    const [referral] = await sql`
      UPDATE referrals
      SET status = ${data.status},
          paid_at = CASE WHEN ${data.status} = 'Paid' THEN CURRENT_TIMESTAMP ELSE paid_at END
      WHERE id = ${data.referralId}
      RETURNING *
    `;
    if (!referral) throw new Error("Referral not found.");
    return referral;
  });

export const getPublishedPortalContentDb = createServerFn({ method: "GET" })
  .validator(
    z.object({
      contentType: z.enum(["Conference", "Competition", "Announcement", "Wall of Fame"]),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    return await sql`
      SELECT id, content_type, title, summary, event_date, location
      FROM portal_content
      WHERE content_type = ${data.contentType}
        AND status = 'Published'
      ORDER BY event_date ASC NULLS LAST, created_at DESC
    `;
  });

// ----------------------------------------------------
// 9. RESEND: EMAIL REPORT CARD
// ----------------------------------------------------
export const emailReportCardDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      toEmail: z.string().email(),
      studentName: z.string(),
      className: z.string(),
      term: z.string(),
      session: z.string(),
      averageScore: z.number(),
      position: z.string(),
      grades: z.array(
        z.object({
          subject: z.string(),
          score: z.number(),
          grade: z.string(),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    const resend = await getResend();
    if (!resend || !process.env.EMAIL_FROM) {
      throw new Error("Resend email credentials are not configured.");
    }

    const gradesHtml = data.grades
      .map(
        (g) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; text-align: left;">${g.subject}</td>
          <td style="padding: 10px; font-weight: bold; text-align: right;">${g.score}</td>
          <td style="padding: 10px; text-align: right;"><span style="background-color: #f0fdf4; color: #166534; padding: 2px 8px; border-radius: 4px; font-weight: bold;">${g.grade}</span></td>
        </tr>
      `,
      )
      .join("");

    try {
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: data.toEmail,
        subject: `Term Report Card - ${data.studentName} (${data.className})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px;">
              <h2 style="color: #312e81; margin: 0;">iCademia Report Portal</h2>
              <p style="color: #64748b; margin: 5px 0 0 0;">Official Academic Transcript</p>
            </div>
            
            <div style="margin-top: 20px;">
              <p style="margin: 5px 0;"><strong>Student Name:</strong> ${data.studentName}</p>
              <p style="margin: 5px 0;"><strong>Class:</strong> ${data.className}</p>
              <p style="margin: 5px 0;"><strong>Term/Session:</strong> ${data.term} (${data.session})</p>
              <p style="margin: 5px 0;"><strong>Average Score:</strong> ${data.averageScore}%</p>
              <p style="margin: 5px 0;"><strong>Position:</strong> ${data.position}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-top: 25px; font-size: 14px;">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 10px; text-align: left;">Subject</th>
                  <th style="padding: 10px; text-align: right;">Score</th>
                  <th style="padding: 10px; text-align: right;">Grade</th>
                </tr>
              </thead>
              <tbody>
                ${gradesHtml}
              </tbody>
            </table>

            <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px; text-align: center; font-size: 12px; color: #94a3b8;">
              <p>This report was generated and securely unlocked via iCademia. Keep up the good work!</p>
            </div>
          </div>
        `,
      });
      return { success: true };
    } catch (err) {
      console.error("Resend report card failed:", err);
      throw new Error("Failed to send report card email.");
    }
  });

// ----------------------------------------------------
// MESSAGES & NOTIFICATIONS
// ----------------------------------------------------
export const getMessagesDb = createServerFn({ method: "GET" })
  .validator(
    z.object({
      schoolCode: z.string(),
      userId: z.number(),
      userType: z.enum(["admin", "teacher"]),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const schools = await sql`SELECT id FROM schools WHERE school_code = ${data.schoolCode}`;
    if (schools.length === 0) return [];

    return await sql`
      SELECT m.*,
        CASE WHEN m.sender_type = 'teacher' THEN COALESCE(t.name, 'Head Teacher') ELSE 'School Admin' END AS sender_name
      FROM messages m
      LEFT JOIN teachers t ON m.sender_type = 'teacher' AND t.id = m.sender_id
      WHERE m.school_id = ${schools[0].id}
        AND (${data.userType} = 'admin' OR
          (m.sender_type = 'teacher' AND m.sender_id = ${data.userId}) OR
          (m.receiver_type = 'teacher' AND (m.receiver_id = ${data.userId} OR m.receiver_id = -1))
        )
      ORDER BY created_at ASC
    `;
  });

export const sendMessageDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string(),
      senderType: z.enum(["admin", "teacher"]),
      senderId: z.number(),
      receiverType: z.enum(["admin", "teacher"]),
      receiverId: z.number(),
      messageBody: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const schools = await sql`SELECT id FROM schools WHERE school_code = ${data.schoolCode}`;
    if (schools.length === 0) throw new Error("School not found");

    const [msg] = await sql`
      INSERT INTO messages (school_id, sender_type, sender_id, receiver_type, receiver_id, message_body)
      VALUES (${schools[0].id}, ${data.senderType}, ${data.senderId}, ${data.receiverType}, ${data.receiverId}, ${data.messageBody})
      RETURNING *
    `;

    // Also insert a notification for the receiver
    await sql`
      INSERT INTO school_notifications (school_id, user_type, user_id, title, body)
      VALUES (${schools[0].id}, ${data.receiverType}, ${data.receiverId}, 'New Message', 'You have a new message from ' || ${data.senderType})
    `;

    return msg;
  });

export const getSchoolAnnouncementsDb = createServerFn({ method: "GET" })
  .validator(z.object({ schoolCode: z.string().min(4) }))
  .handler(async ({ data }) => {
    await initDb();
    return await sql`
      SELECT a.* FROM school_announcements a
      JOIN schools s ON s.id = a.school_id
      WHERE s.school_code = ${data.schoolCode}
        AND (a.expires_at IS NULL OR a.expires_at > NOW())
      ORDER BY CASE a.priority WHEN 'Urgent' THEN 1 WHEN 'Important' THEN 2 ELSE 3 END, a.created_at DESC
    `;
  });

export const createSchoolAnnouncementDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string().min(4),
      title: z.string().trim().min(3),
      body: z.string().trim().min(5),
      priority: z.enum(["Normal", "Important", "Urgent"]),
      expiresAt: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const [school] =
      await sql`SELECT id, admin_name FROM schools WHERE school_code = ${data.schoolCode}`;
    if (!school) throw new Error("School not found.");
    const [announcement] = await sql`
      INSERT INTO school_announcements (school_id, title, body, priority, published_by, expires_at)
      VALUES (${school.id}, ${data.title}, ${data.body}, ${data.priority}, ${school.admin_name}, ${data.expiresAt || null})
      RETURNING *
    `;
    await sql`
      INSERT INTO school_notifications (school_id, user_type, user_id, title, body)
      SELECT ${school.id}, 'teacher', id, ${`Announcement: ${data.title}`}, ${data.body}
      FROM teachers WHERE school_id = ${school.id} AND status <> 'Suspended'
    `;
    return announcement;
  });

export const getNotificationsDb = createServerFn({ method: "GET" })
  .validator(
    z.object({
      schoolCode: z.string(),
      userId: z.number(),
      userType: z.enum(["admin", "teacher"]),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const schools = await sql`SELECT id FROM schools WHERE school_code = ${data.schoolCode}`;
    if (schools.length === 0) return [];

    return await sql`
      SELECT * FROM school_notifications
      WHERE school_id = ${schools[0].id} AND user_type = ${data.userType} AND user_id = ${data.userId}
      ORDER BY created_at DESC
      LIMIT 20
    `;
  });

export const markNotificationsReadDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string(),
      userId: z.number(),
      userType: z.enum(["admin", "teacher"]),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const schools = await sql`SELECT id FROM schools WHERE school_code = ${data.schoolCode}`;
    if (schools.length === 0) return { success: false };

    await sql`
      UPDATE school_notifications
      SET is_read = TRUE
      WHERE school_id = ${schools[0].id} AND user_type = ${data.userType} AND user_id = ${data.userId} AND is_read = FALSE
    `;
    return { success: true };
  });

// ----------------------------------------------------
// GLOBAL WALL OF FAME
// ----------------------------------------------------
export const getWallOfFameDb = createServerFn({ method: "GET" }).handler(async () => {
  await initDb();
  // Return all manually published wall of fame records, joined with school name and student details
  return await sql`
      SELECT w.*, s.name as student_name, sch.name as school_name, sch.city
      FROM wall_of_fame w
      JOIN students s ON w.student_id = s.id
      JOIN schools sch ON w.school_id = sch.id
      ORDER BY w.average_score DESC NULLS LAST, w.created_at DESC
    `;
});

export const computeGlobalWallOfFameDb = createServerFn({ method: "GET" })
  .validator(z.object({ session: z.string(), limit: z.number().optional().default(100) }))
  .handler(async ({ data }) => {
    await initDb();
    // Dynamically compute the top students globally for a session based on average_score across ALL schools.
    return await sql`
      SELECT
        s.id as student_id, s.name as student_name, s.class_name as class_level, s.photo_url,
        sch.name as school_name, sch.city,
        r.session,
        r.average_score
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN schools sch ON s.school_id = sch.id
      WHERE r.session = ${data.session} AND r.average_score IS NOT NULL
      ORDER BY r.average_score DESC
      LIMIT ${data.limit}
    `;
  });

export const computeGlobalClassWallOfFameDb = createServerFn({ method: "GET" })
  .validator(z.object({ session: z.string(), limit: z.number().optional().default(100) }))
  .handler(async ({ data }) => {
    await initDb();
    return await sql`
      SELECT
        s.school_id, sch.name as school_name, sch.city, s.class_name as class_level,
        r.session,
        ROUND(AVG(r.average_score), 2) as average_score
      FROM results r
      JOIN students s ON r.student_id = s.id
      JOIN schools sch ON s.school_id = sch.id
      WHERE r.session = ${data.session} AND r.average_score IS NOT NULL
      GROUP BY s.school_id, sch.name, sch.city, s.class_name, r.session
      ORDER BY average_score DESC
      LIMIT ${data.limit}
    `;
  });

// ----------------------------------------------------
// COMPETITIONS & CONFERENCES
// ----------------------------------------------------
export const getCompetitionsDb = createServerFn({ method: "GET" }).handler(async () => {
  await initDb();
  return await sql`SELECT * FROM competitions ORDER BY deadline ASC NULLS LAST`;
});

export const saveCompetitionDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(2),
      description: z.string().min(2),
      category: z.string().min(2),
      deadline: z.string().optional(),
      eligibility: z.string().optional(),
      registrationLink: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const [comp] = await sql`
      INSERT INTO competitions (title, description, category, deadline, eligibility, registration_link)
      VALUES (${data.title}, ${data.description}, ${data.category}, ${data.deadline ? data.deadline : null}, ${data.eligibility ?? ""}, ${data.registrationLink ?? ""})
      RETURNING *
    `;
    return comp;
  });

export const getConferencesDb = createServerFn({ method: "GET" }).handler(async () => {
  await initDb();
  return await sql`SELECT * FROM conferences ORDER BY event_date ASC`;
});

export const saveConferenceDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      title: z.string().min(2),
      description: z.string().min(2),
      eventDate: z.string().min(2),
      location: z.string().optional(),
      speaker: z.string().optional(),
      registrationLink: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const [conf] = await sql`
      INSERT INTO conferences (title, description, event_date, location, speaker, registration_link)
      VALUES (${data.title}, ${data.description}, ${data.eventDate}, ${data.location ?? ""}, ${data.speaker ?? ""}, ${data.registrationLink ?? ""})
      RETURNING *
    `;
    return conf;
  });

// ----------------------------------------------------
// BATCH & PRESET OPERATIONAL HELPERS
// ----------------------------------------------------

export const saveBatchAttendanceDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      date: z.string().min(4),
      records: z.array(
        z.object({
          studentId: z.number(),
          status: z.enum(["Present", "Absent", "Late", "Excused"]),
          note: z.string().optional(),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const session = await requireSchoolAdminSession(data.token, data.schoolCode);
    const schoolId = session.school_id;
    const ids = Array.from(new Set(data.records.map((record) => record.studentId)));
    const students = await sql`SELECT id FROM students WHERE school_id = ${schoolId} AND id = ANY(${ids})`;
    if (students.length !== ids.length) throw new Error("One or more students were not found in this school.");

    let count = 0;
    for (const rec of data.records) {
      await sql`
        INSERT INTO attendance_records (school_id, student_id, attendance_date, status, note)
        VALUES (${schoolId}, ${rec.studentId}, ${data.date}, ${rec.status}, ${rec.note ?? null})
        ON CONFLICT (student_id, attendance_date) DO UPDATE
        SET status = EXCLUDED.status, note = EXCLUDED.note
      `;
      count++;
    }
    return { success: true, count };
  });

export const batchAddStudentsDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      students: z.array(
        z.object({
          name: z.string().min(2),
          regNumber: z.string().min(2),
          className: z.string().min(1),
          photoUrl: z.string().optional(),
          guardianName: z.string().optional(),
          guardianPhone: z.string().optional(),
          guardianEmail: z.string().optional(),
          guardianRelationship: z.string().optional(),
        }),
      ),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);

    let inserted = 0;
    let skipped = 0;

    for (const s of data.students) {
      const regUpper = s.regNumber.trim().toUpperCase();
      const duplicate = await sql`
        SELECT id FROM students 
        WHERE school_id = ${school.school_id} AND UPPER(registration_number) = ${regUpper}
      `;
      if (duplicate.length > 0) {
        skipped++;
        continue;
      }

      const [newStudent] = await sql`
        INSERT INTO students (school_id, name, registration_number, class_name, photo_url)
        VALUES (${school.school_id}, ${s.name.trim()}, ${regUpper}, ${s.className.trim()}, ${s.photoUrl || null})
        RETURNING id
      `;

      if (newStudent && s.guardianName && s.guardianName.trim()) {
        await sql`
          INSERT INTO parent_guardians (
            school_id, student_id, name, relationship, email, phone, preferred_channel, communication_consent, emergency_contact
          ) VALUES (
            ${school.school_id}, ${newStudent.id}, ${s.guardianName.trim()}, ${s.guardianRelationship || "Parent"},
            ${s.guardianEmail || null}, ${s.guardianPhone || null}, 'Email', true, true
          )
        `;
      }
      inserted++;
    }

    return { inserted, skipped, total: data.students.length };
  });

export const addSubjectPresetBundleDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      schoolCode: z.string().min(4),
      preset: z.enum(["nigerian_sec", "nigerian_pri", "british"]),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const [school] = await sql`SELECT id FROM schools WHERE school_code = ${data.schoolCode}`;
    if (!school) throw new Error("School not found.");

    const bundles = {
      nigerian_sec: [
        { name: "Mathematics", code: "MTH", category: "Core" },
        { name: "English Language", code: "ENG", category: "Core" },
        { name: "Civic Education", code: "CIVIC", category: "Core" },
        { name: "Basic Science", code: "BSC", category: "Science" },
        { name: "Biology", code: "BIO", category: "Science" },
        { name: "Chemistry", code: "CHM", category: "Science" },
        { name: "Physics", code: "PHY", category: "Science" },
        { name: "Agricultural Science", code: "AGRIC", category: "Vocational" },
        { name: "Computer Studies / ICT", code: "ICT", category: "Vocational" },
        { name: "Economics", code: "ECO", category: "Humanities" },
        { name: "Government", code: "GOV", category: "Humanities" },
        { name: "Social Studies", code: "SOS", category: "Humanities" },
        { name: "Christian Religious Studies", code: "CRS", category: "Humanities" },
        { name: "Islamic Religious Studies", code: "IRS", category: "Humanities" },
        { name: "Literature-in-English", code: "LIT", category: "Language" },
        { name: "Commercial Studies", code: "CMS", category: "Elective" },
      ],
      nigerian_pri: [
        { name: "Mathematics", code: "MTH", category: "Core" },
        { name: "English Studies", code: "ENG", category: "Core" },
        { name: "Basic Science & Technology", code: "BST", category: "Science" },
        { name: "National Value Education", code: "NVE", category: "Humanities" },
        { name: "Cultural & Creative Arts", code: "CCA", category: "Vocational" },
        { name: "Pre-Vocational Studies", code: "PVS", category: "Vocational" },
        { name: "Agricultural Science", code: "AGRIC", category: "Vocational" },
        { name: "Computer Studies (ICT)", code: "ICT", category: "Vocational" },
        { name: "Verbal Reasoning", code: "VRB", category: "Core" },
        { name: "Quantitative Reasoning", code: "QNT", category: "Core" },
      ],
      british: [
        { name: "Mathematics", code: "MATH", category: "Core" },
        { name: "English Literature & Language", code: "ENG", category: "Core" },
        { name: "Combined Science", code: "SCI", category: "Science" },
        { name: "Geography", code: "GEO", category: "Humanities" },
        { name: "History", code: "HIS", category: "Humanities" },
        { name: "Computer Science", code: "CS", category: "Science" },
        { name: "Art & Design", code: "ART", category: "Vocational" },
        { name: "French / Modern Languages", code: "FRE", category: "Language" },
      ],
    };

    const subjectsToInsert = bundles[data.preset] || bundles.nigerian_sec;
    let addedCount = 0;

    for (const sub of subjectsToInsert) {
      await sql`
        INSERT INTO subjects (school_id, name, code, category, status)
        VALUES (${school.id}, ${sub.name}, ${sub.code}, ${sub.category}, 'Active')
        ON CONFLICT (school_id, name) DO NOTHING
      `;
      addedCount++;
    }

    return { success: true, count: addedCount };
  });

export const assignClassTeacherDb = createServerFn({ method: "POST" })
  .validator(
    z.object({
      token: z.string().min(20),
      schoolCode: z.string().min(4),
      className: z.string().min(1),
      teacherId: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    await initDb();
    const school = await requireSchoolAdminSession(data.token, data.schoolCode);

    return await sql.begin(async (transaction) => {
      const [teacher] = await transaction`
        SELECT id, name, role, assigned_classes
        FROM teachers
        WHERE id = ${data.teacherId} AND school_id = ${school.school_id}
      `;
      if (!teacher) throw new Error("Head Teacher not found.");
      if (teacher.role !== "Head Teacher") {
        throw new Error(
          "Grant this staff member Head Teacher workspace access before assigning a class.",
        );
      }

      await transaction`
        INSERT INTO class_head_teachers (school_id, class_name, teacher_id, assigned_at)
        VALUES (${school.school_id}, ${data.className}, ${teacher.id}, NOW())
        ON CONFLICT (school_id, class_name)
        DO UPDATE SET teacher_id = EXCLUDED.teacher_id, assigned_at = NOW()
      `;

      const assigned = String(teacher.assigned_classes || "")
        .split(",")
        .map((className: string) => className.trim())
        .filter(Boolean);
      if (!assigned.includes(data.className)) {
        assigned.push(data.className);
        await transaction`
          UPDATE teachers SET assigned_classes = ${assigned.join(", ")} WHERE id = ${teacher.id}
        `;
      }

      return { success: true, teacherName: teacher.name };
    });
  });

export const lookupPublicSchoolRegistryDb = createServerFn({ method: "GET" })
  .validator(z.object({ schoolCode: z.string().min(2) }))
  .handler(async ({ data }) => {
    await initDb();
    const query = data.schoolCode.trim();
    const cleanCode = query.toUpperCase();

    // 1. Try exact school_code match first
    const exactRows = await sql`
      SELECT id, name, type, motto, city, address, website, admin_name, admin_email, admin_phone,
             logo_url, primary_color, secondary_color, email_verified_at, school_code, registry_id,
             head_title, contact_email, contact_phone, created_at, letterhead_style
      FROM schools
      WHERE UPPER(registry_id) = ${cleanCode} OR UPPER(school_code) = ${cleanCode}
    `;

    if (exactRows.length === 1) {
      const school = exactRows[0];
      const studentCountRows =
        await sql`SELECT COUNT(*)::int as count FROM students WHERE school_id = ${school.id}`;
      const teacherCountRows =
        await sql`SELECT COUNT(*)::int as count FROM teachers WHERE school_id = ${school.id}`;
      const resultCountRows = await sql`
        SELECT COUNT(*)::int as count FROM results r JOIN students s ON r.student_id = s.id WHERE s.school_id = ${school.id}
      `;

      const enrolled = studentCountRows[0]?.count ?? 0;
      const teachers = teacherCountRows[0]?.count ?? 0;
      const resultsCount = resultCountRows[0]?.count ?? 0;
      const defaultCapacity = Math.max(500, Math.ceil(enrolled / 50) * 50 + 100);
      const utilPercent = Math.min(100, Math.round((enrolled / defaultCapacity) * 100));
      const ratio = teachers > 0 ? (enrolled / teachers).toFixed(1) : "—";

      return {
        multipleMatches: false,
        school: {
          id: school.id,
          name: school.name,
          schoolCode: school.registry_id || school.school_code,
          type: school.type || "Co-Educational Secondary & Sixth Form College",
          motto: school.motto,
          city: school.city,
          address: school.address,
          website: school.website,
          adminName: school.admin_name,
          adminEmail: school.admin_email,
          adminPhone: school.admin_phone,
          headTitle: school.head_title || "Principal / Head Teacher",
          contactEmail: school.contact_email || school.admin_email,
          contactPhone: school.contact_phone || school.admin_phone,
          logoUrl: school.logo_url,
          primaryColor: school.primary_color || "#3730A3",
          secondaryColor: school.secondary_color || "#D6A84B",
          emailVerifiedAt: school.email_verified_at,
          registeredAt: school.created_at,
        },
        stats: {
          enrolledStudents: enrolled,
          registeredTeachers: teachers,
          studentTeacherRatio: ratio,
          resultsIssued: resultsCount,
          campusCapacity: defaultCapacity,
          utilizationPercentage: utilPercent,
        },
      };
    }

    // 2. Search across name, city, school_code keywords
    const searchPattern = `%${query}%`;
    const searchRows = await sql`
      SELECT id, name, type, motto, city, address, website, admin_name, admin_email,
             logo_url, school_code, registry_id, head_title
      FROM schools 
      WHERE UPPER(school_code) LIKE UPPER(${searchPattern})
         OR UPPER(COALESCE(registry_id, '')) LIKE UPPER(${searchPattern})
         OR UPPER(name) LIKE UPPER(${searchPattern})
         OR UPPER(city) LIKE UPPER(${searchPattern})
      ORDER BY id ASC
    `;

    if (searchRows.length === 0) {
      return null;
    }

    if (searchRows.length === 1) {
      const school = searchRows[0];
      const studentCountRows =
        await sql`SELECT COUNT(*)::int as count FROM students WHERE school_id = ${school.id}`;
      const teacherCountRows =
        await sql`SELECT COUNT(*)::int as count FROM teachers WHERE school_id = ${school.id}`;
      const resultCountRows = await sql`
        SELECT COUNT(*)::int as count FROM results r JOIN students s ON r.student_id = s.id WHERE s.school_id = ${school.id}
      `;

      const enrolled = studentCountRows[0]?.count ?? 0;
      const teachers = teacherCountRows[0]?.count ?? 0;
      const resultsCount = resultCountRows[0]?.count ?? 0;
      const defaultCapacity = Math.max(500, Math.ceil(enrolled / 50) * 50 + 100);
      const utilPercent = Math.min(100, Math.round((enrolled / defaultCapacity) * 100));
      const ratio = teachers > 0 ? (enrolled / teachers).toFixed(1) : "—";

      return {
        multipleMatches: false,
        school: {
          id: school.id,
          name: school.name,
          schoolCode: school.registry_id || school.school_code,
          type: school.type || "Co-Educational Secondary & Sixth Form College",
          motto: school.motto,
          city: school.city,
          address: school.address,
          website: school.website,
          adminName: school.admin_name,
          adminEmail: school.admin_email,
          adminPhone: school.admin_phone,
          headTitle: school.head_title || "Principal / Head Teacher",
          contactEmail: school.contact_email || school.admin_email,
          contactPhone: school.contact_phone || school.admin_phone,
          logoUrl: school.logo_url,
          primaryColor: school.primary_color || "#3730A3",
          secondaryColor: school.secondary_color || "#D6A84B",
          emailVerifiedAt: school.email_verified_at,
          registeredAt: school.created_at,
        },
        stats: {
          enrolledStudents: enrolled,
          registeredTeachers: teachers,
          studentTeacherRatio: ratio,
          resultsIssued: resultsCount,
          campusCapacity: defaultCapacity,
          utilizationPercentage: utilPercent,
        },
      };
    }

    // Multiple matches returned!
    return {
      multipleMatches: true,
      matches: searchRows.map((s: any) => ({
        id: s.id,
        name: s.name,
        schoolCode: s.registry_id || s.school_code,
        type: s.type || "Secondary School",
        city: s.city,
        adminName: s.admin_name,
        logoUrl: s.logo_url,
      })),
    };
  });
