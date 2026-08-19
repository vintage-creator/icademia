import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

export const sql = postgres(databaseUrl, {
  ssl: { rejectUnauthorized: false }, // Render DBs require SSL
  onnotice: () => {}, // Suppress "relation already exists" notices
});

const DB_SCHEMA_VERSION = "v10"; // bump this whenever you add new ALTER TABLE statements
const globalForDb = globalThis as unknown as { __db_version: string };

export async function initDb() {
  if (globalForDb.__db_version === DB_SCHEMA_VERSION) return;
  globalForDb.__db_version = DB_SCHEMA_VERSION;

  try {
    // 1. Create schools table
    await sql`
      CREATE TABLE IF NOT EXISTS schools (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        motto TEXT,
        city TEXT NOT NULL,
        admin_name TEXT NOT NULL,
        admin_email TEXT NOT NULL UNIQUE,
        admin_phone TEXT,
        address TEXT,
        website TEXT,
        admin_password_hash TEXT,
        student_count TEXT,
        school_code TEXT NOT NULL UNIQUE,
        logo_url TEXT,
        primary_color TEXT DEFAULT '#3730A3',
        secondary_color TEXT DEFAULT '#D6A84B',
        referral_code TEXT UNIQUE,
        referred_by_school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL,
        email_verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_url TEXT`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#3730A3'`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#D6A84B'`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS admin_password_hash TEXT`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS address TEXT`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS website TEXT`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS referred_by_school_id INTEGER REFERENCES schools(id) ON DELETE SET NULL`;
    // Signing authority, handwritten signature & school stamp
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS head_title TEXT`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS signature_url TEXT`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS stamp_url TEXT`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS letterhead_style TEXT DEFAULT 'classic'`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS contact_email TEXT`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS contact_phone TEXT`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS logo_placement TEXT DEFAULT 'left'`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS font_style TEXT DEFAULT 'inter'`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'M'`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'inter'`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS font_weight TEXT DEFAULT '600'`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS font_size_scale TEXT DEFAULT 'M'`;
    await sql`ALTER TABLE schools ADD COLUMN IF NOT EXISTS header_text_color TEXT DEFAULT 'auto'`;
    
    await sql`
      UPDATE schools
      SET referral_code = 'ICA-REF-' || UPPER(SUBSTRING(MD5(id::text || school_code), 1, 8))
      WHERE referral_code IS NULL
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS email_verification_tokens (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Permanent audit log — records every admin/principal handover.
    // Rows are NEVER deleted; school_id only references, no cascade.
    await sql`
      CREATE TABLE IF NOT EXISTS admin_transitions (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id),
        outgoing_name     TEXT NOT NULL,
        outgoing_title    TEXT NOT NULL,
        incoming_name     TEXT NOT NULL,
        incoming_title    TEXT NOT NULL,
        effective_date    DATE NOT NULL,
        transition_type   TEXT NOT NULL DEFAULT 'normal',
        reason            TEXT,
        witness_name      TEXT,
        signature_cleared BOOLEAN NOT NULL DEFAULT TRUE,
        created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    // Safe migrations for schools that already have the table without new columns
    await sql`ALTER TABLE admin_transitions ADD COLUMN IF NOT EXISTS transition_type TEXT NOT NULL DEFAULT 'normal'`;
    await sql`ALTER TABLE admin_transitions ADD COLUMN IF NOT EXISTS witness_name TEXT`;

    // 2. Create students table
    await sql`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        registration_number TEXT NOT NULL UNIQUE,
        class_name TEXT NOT NULL,
        photo_url TEXT,
        gender TEXT,
        responsibilities TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url TEXT`;
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT`;
    await sql`ALTER TABLE students ADD COLUMN IF NOT EXISTS responsibilities TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS teachers (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        staff_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        subject TEXT,
        assigned_classes TEXT,
        status TEXT NOT NULL DEFAULT 'Invited',
        password_hash TEXT,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (school_id, email)
      )
    `;
    // Teacher auth migrations for existing DBs
    await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS password_hash TEXT`;
    await sql`ALTER TABLE teachers ADD COLUMN IF NOT EXISTS last_login TIMESTAMP`;

    // Teacher sessions — secure token-based session management
    await sql`
      CREATE TABLE IF NOT EXISTS teacher_sessions (
        id SERIAL PRIMARY KEY,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 3. Create results table
    await sql`
      CREATE TABLE IF NOT EXISTS results (
        id SERIAL PRIMARY KEY,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        term TEXT NOT NULL,
        session TEXT NOT NULL,
        average_score NUMERIC(5,2),
        position_number INTEGER,
        total_students INTEGER,
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // 4. Create grades table
    await sql`
      CREATE TABLE IF NOT EXISTS grades (
        id SERIAL PRIMARY KEY,
        result_id INTEGER REFERENCES results(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        score INTEGER NOT NULL,
        grade TEXT NOT NULL
      )
    `;
    await sql`ALTER TABLE grades ADD COLUMN IF NOT EXISTS ca_score NUMERIC(5,2)`;
    await sql`ALTER TABLE grades ADD COLUMN IF NOT EXISTS exam_score NUMERIC(5,2)`;
    await sql`ALTER TABLE grades ADD COLUMN IF NOT EXISTS max_score NUMERIC(5,2) DEFAULT 100`;
    await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS attendance_present INTEGER`;
    await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS attendance_total INTEGER`;
    await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS times_absent INTEGER`;
    await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS resumption_date TEXT`;
    await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS promotion_status TEXT`;
    await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS promoted_to_class TEXT`;
    await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS affective_traits JSONB`;
    await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS psychomotor_skills JSONB`;
    await sql`ALTER TABLE results ADD COLUMN IF NOT EXISTS principal_remarks TEXT`;

    // 5. Create pins table
    await sql`
      CREATE TABLE IF NOT EXISTS pins (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        pin TEXT NOT NULL UNIQUE,
        serial TEXT NOT NULL UNIQUE,
        status TEXT NOT NULL DEFAULT 'Unused',
        used_by TEXT,
        payment_reference TEXT,
        activated_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Migration alter in case table exists
    try {
      await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS payment_reference TEXT`;
      await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP`;
      await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP`;
      await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS result_access_status TEXT DEFAULT 'Allowed'`;
      await sql`ALTER TABLE pins ADD COLUMN IF NOT EXISTS restriction_reason TEXT`;
    } catch (e) {
      console.log("Migration warning (alter table pins):", e);
    }

    // 6. Create answer_scripts table
    await sql`
      CREATE TABLE IF NOT EXISTS answer_scripts (
        id SERIAL PRIMARY KEY,
        result_id INTEGER REFERENCES results(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        student_score INTEGER NOT NULL,
        max_score INTEGER NOT NULL DEFAULT 100,
        grade TEXT NOT NULL,
        cloudinary_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS card_orders (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        order_reference TEXT NOT NULL UNIQUE,
        order_type TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price INTEGER NOT NULL,
        customer_email TEXT NOT NULL,
        delivery_address TEXT,
        status TEXT NOT NULL DEFAULT 'Pending',
        fulfillment_status TEXT NOT NULL DEFAULT 'Awaiting payment',
        estimated_delivery_start DATE,
        estimated_delivery_end DATE,
        paid_at TIMESTAMP,
        dispatched_at TIMESTAMP,
        delivered_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await sql`ALTER TABLE card_orders ADD COLUMN IF NOT EXISTS delivery_address TEXT`;
    await sql`ALTER TABLE card_orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT NOT NULL DEFAULT 'Awaiting payment'`;
    await sql`ALTER TABLE card_orders ADD COLUMN IF NOT EXISTS estimated_delivery_start DATE`;
    await sql`ALTER TABLE card_orders ADD COLUMN IF NOT EXISTS estimated_delivery_end DATE`;
    await sql`ALTER TABLE card_orders ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMP`;
    await sql`ALTER TABLE card_orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP`;

    await sql`
      CREATE TABLE IF NOT EXISTS referrals (
        id SERIAL PRIMARY KEY,
        referrer_school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        referred_school_id INTEGER NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
        referral_code TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Onboarding',
        reward_per_student INTEGER NOT NULL DEFAULT 200,
        paid_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        code TEXT,
        category TEXT NOT NULL DEFAULT 'General',
        status TEXT NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (school_id, name)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        category TEXT NOT NULL,
        priority TEXT NOT NULL DEFAULT 'Normal',
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open',
        response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS portal_content (
        id SERIAL PRIMARY KEY,
        content_type TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        status TEXT NOT NULL DEFAULT 'Draft',
        event_date DATE,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        status TEXT NOT NULL,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, attendance_date)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS curriculum_topics (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
        class_name TEXT NOT NULL,
        term TEXT NOT NULL,
        session TEXT NOT NULL,
        topic TEXT NOT NULL,
        sequence_number INTEGER,
        expected_by DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (school_id, class_name, term, session, topic)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS curriculum_coverage (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER NOT NULL REFERENCES curriculum_topics(id) ON DELETE CASCADE,
        teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'Not started',
        coverage_percent INTEGER NOT NULL DEFAULT 0,
        completed_at TIMESTAMP,
        evidence_url TEXT,
        note TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS timetable_entries (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
        subject_id INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
        class_name TEXT NOT NULL,
        day_of_week INTEGER NOT NULL,
        period_number INTEGER NOT NULL,
        starts_at TIME,
        ends_at TIME,
        room TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (school_id, class_name, day_of_week, period_number)
      )
    `;
    await sql`ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS entry_type TEXT NOT NULL DEFAULT 'Lesson'`;
    await sql`ALTER TABLE timetable_entries ADD COLUMN IF NOT EXISTS title TEXT`;

    await sql`
      CREATE TABLE IF NOT EXISTS teacher_availability (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        teacher_id INTEGER NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL,
        period_number INTEGER NOT NULL,
        is_available BOOLEAN NOT NULL DEFAULT TRUE,
        note TEXT,
        UNIQUE (teacher_id, day_of_week, period_number)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS interventions (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        class_name TEXT,
        subject TEXT,
        title TEXT NOT NULL,
        rationale TEXT,
        owner_role TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Proposed',
        baseline_value NUMERIC(8,2),
        target_value NUMERIC(8,2),
        starts_on DATE,
        review_on DATE,
        approved_by TEXT,
        approved_at TIMESTAMP,
        outcome_note TEXT,
        outcome_value NUMERIC(8,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_remark_drafts (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        result_id INTEGER NOT NULL REFERENCES results(id) ON DELETE CASCADE,
        remark_type TEXT NOT NULL,
        draft_text TEXT NOT NULL,
        evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'Draft',
        reviewed_by TEXT,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS retention_signals (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        signal_type TEXT NOT NULL,
        severity TEXT NOT NULL,
        evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
        status TEXT NOT NULL DEFAULT 'Open',
        reviewed_by TEXT,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS ai_runs (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        workflow TEXT NOT NULL,
        question TEXT,
        input_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
        output_text TEXT,
        status TEXT NOT NULL,
        model TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS compliance_exports (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        export_type TEXT NOT NULL,
        session TEXT,
        term TEXT,
        status TEXT NOT NULL DEFAULT 'Requested',
        file_url TEXT,
        requested_by TEXT,
        generated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS parent_guardians (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        relationship TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        preferred_channel TEXT NOT NULL DEFAULT 'Email',
        communication_consent BOOLEAN NOT NULL DEFAULT FALSE,
        emergency_contact BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS engagement_observations (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        observation_date DATE NOT NULL,
        category TEXT NOT NULL,
        rating INTEGER,
        note TEXT NOT NULL,
        recorded_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS student_lifecycle (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        event_type TEXT NOT NULL,
        event_date DATE NOT NULL,
        reason TEXT,
        destination TEXT,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS compliance_requirements (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        authority TEXT,
        requirement_type TEXT NOT NULL,
        due_date DATE,
        inspection_start DATE,
        inspection_end DATE,
        status TEXT NOT NULL DEFAULT 'Open',
        evidence_url TEXT,
        owner_role TEXT,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        sender_type TEXT NOT NULL,
        sender_id INTEGER NOT NULL,
        receiver_type TEXT NOT NULL,
        receiver_id INTEGER NOT NULL,
        message_body TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS school_notifications (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        user_type TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    // Safe column additions for school_notifications
    await sql`ALTER TABLE school_notifications ADD COLUMN IF NOT EXISTS school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE`;
    await sql`ALTER TABLE school_notifications ADD COLUMN IF NOT EXISTS user_type TEXT`;
    await sql`ALTER TABLE school_notifications ADD COLUMN IF NOT EXISTS user_id INTEGER`;
    await sql`ALTER TABLE school_notifications ADD COLUMN IF NOT EXISTS title TEXT`;
    await sql`ALTER TABLE school_notifications ADD COLUMN IF NOT EXISTS body TEXT`;
    await sql`ALTER TABLE school_notifications ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE`;

    await sql`
      CREATE TABLE IF NOT EXISTS wall_of_fame (
        id SERIAL PRIMARY KEY,
        school_id INTEGER REFERENCES schools(id) ON DELETE CASCADE,
        student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
        session TEXT NOT NULL,
        class_level TEXT NOT NULL,
        category TEXT NOT NULL,
        award_title TEXT NOT NULL,
        quote TEXT,
        average_score NUMERIC(5,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS competitions (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        deadline DATE,
        eligibility TEXT,
        registration_link TEXT,
        status TEXT NOT NULL DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS conferences (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        event_date DATE NOT NULL,
        location TEXT,
        speaker TEXT,
        registration_link TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // ── Staff exit log ──────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS staff_exits (
        id              SERIAL PRIMARY KEY,
        school_id       INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
        teacher_id      INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
        teacher_name    TEXT NOT NULL,
        teacher_subject TEXT,
        teacher_role    TEXT,
        exit_type       TEXT NOT NULL DEFAULT 'other',
        effective_date  DATE NOT NULL,
        reason          TEXT,
        witness_name    TEXT,
        recorded_by     TEXT,
        created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("Database initialized successfully!");
  } catch (error) {
    globalForDb.__db_version = ""; // reset so next request retries
    console.error("Database initialization failed:", error);
    throw error;
  }
}
