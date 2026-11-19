import { ShieldCheck } from "lucide-react";

const subjects = [
  { name: "Mathematics", ca: 32, exam: 41, total: 73, grade: "B2", remark: "Good" },
  { name: "English Language", ca: 29, exam: 39, total: 68, grade: "B3", remark: "Credit" },
  { name: "Basic Science", ca: 36, exam: 54, total: 90, grade: "A1", remark: "Excellent" },
  { name: "Social Studies", ca: 28, exam: 37, total: 65, grade: "B3", remark: "Good" },
  { name: "Civic Education", ca: 33, exam: 45, total: 78, grade: "B2", remark: "V. Good" },
];

export function StudentReportPreview() {
  return (
    <div className="relative w-full max-w-[33rem] select-none">
      {/* Ambient glows behind the paper */}
      <div className="absolute inset-x-10 top-10 h-64 rounded-full bg-[#d6a84b]/20 blur-3xl -z-10" />
      <div className="absolute -right-4 top-16 h-48 w-48 rounded-full bg-sky-300/15 blur-3xl -z-10" />

      {/* Surface shadow — simulates paper resting on a desk */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-6 w-[88%] rounded-full bg-black/30 blur-xl" />

      {/* Outer wrapper — slight tilt like it was placed down casually */}
      <div
        className="relative"
        style={{ transform: "perspective(900px) rotateX(2deg) rotateY(-1.5deg)" }}
      >
        {/* Stack of papers beneath — depth illusion */}
        <div
          className="absolute inset-0 rounded-[0.5rem] bg-white border border-slate-200"
          style={{ transform: "translate(5px, 7px)", zIndex: 0 }}
        />
        <div
          className="absolute inset-0 rounded-[0.5rem] bg-white border border-slate-200"
          style={{ transform: "translate(2px, 4px)", zIndex: 0 }}
        />

        {/* Main result sheet paper */}
        <div
          className="relative overflow-visible rounded-[0.4rem] border border-slate-300 bg-white shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5),0_8px_20px_rgba(0,0,0,0.12)]"
          style={{ zIndex: 1 }}
        >
          {/* ───── Ruffled / Curled bottom-right corner ───── */}
          <div
            className="pointer-events-none absolute -bottom-[1px] -right-[1px] h-14 w-14 overflow-hidden"
            style={{ zIndex: 10 }}
          >
            {/* shadow under the curl */}
            <div
              className="absolute bottom-0 right-0 h-14 w-14 rounded-tl-full"
              style={{
                background: "radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.18) 0%, transparent 70%)",
              }}
            />
            {/* the curl flap */}
            <div
              className="absolute bottom-0 right-0 h-14 w-14"
              style={{
                background:
                  "linear-gradient(135deg, #f0f2f5 0%, #ffffff 50%, #e8eaed 100%)",
                clipPath: "polygon(100% 0, 100% 100%, 0 100%)",
                boxShadow: "-3px -3px 8px rgba(0,0,0,0.12)",
                borderTopLeftRadius: "2px",
              }}
            />
            {/* subtle crease line */}
            <div
              className="absolute bottom-0 right-0 h-[1px] w-[80px]"
              style={{
                background: "rgba(0,0,0,0.08)",
                transformOrigin: "bottom right",
                transform: "rotate(-45deg) translateY(-28px)",
              }}
            />
          </div>

          {/* LETTERHEAD HEADER */}
          <div className="relative overflow-hidden border-b-2 border-primary px-4 py-3">
            {/* Diagonal striped accent top bar */}
            <div
              className="absolute inset-x-0 top-0 h-[5px]"
              style={{
                background: "repeating-linear-gradient(90deg, #07317a 0px, #07317a 18px, #d6a84b 18px, #d6a84b 28px)",
              }}
            />
            <div className="mt-1 flex items-center gap-3">
              {/* School crest */}
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-full border-2 border-primary bg-primary/5 shadow-sm">
                <div className="text-[8px] font-black uppercase tracking-tight leading-none text-primary text-center px-0.5">
                  RHS
                </div>
                <div className="mt-0.5 text-[5px] text-primary/60 text-center leading-none">EST.</div>
                <div className="text-[6px] font-bold text-primary/80 leading-none">2001</div>
              </div>

              {/* School name & address */}
              <div className="flex-1 min-w-0 text-center">
                <p className="font-display text-[11px] font-black uppercase tracking-[0.12em] text-primary sm:text-xs">
                  Riverglen High School
                </p>
                <p className="text-[8px] text-slate-500 leading-tight mt-0.5">
                  12 Academy Road, GRA Phase 3, Port Harcourt · Rivers State
                </p>
                <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-[#b8862f]">
                  Student Academic Report
                </p>
              </div>

              {/* Student passport photo silhouette */}
              <div className="shrink-0 relative" style={{ width: 44, height: 52 }}>
                <div
                  className="h-full w-full rounded-sm border-2 border-slate-300 bg-slate-100 overflow-hidden"
                  style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}
                >
                  <svg viewBox="0 0 44 52" className="h-full w-full" aria-hidden>
                    <rect width="44" height="52" fill="#dde3ec" />
                    <rect y="30" width="44" height="22" fill="#c8d4e8" />
                    <ellipse cx="22" cy="51" rx="15" ry="10" fill="#07317a" />
                    <ellipse cx="22" cy="39" rx="8" ry="5" fill="#07317a" />
                    <circle cx="22" cy="29" r="11" fill="#c8956a" />
                    <ellipse cx="22" cy="19" rx="11" ry="6" fill="#1a0a00" />
                    <rect x="17" y="36" width="10" height="6" fill="#c8956a" />
                  </svg>
                </div>
                <p className="mt-0.5 text-center text-[6px] uppercase tracking-wider text-slate-400">
                  Passport
                </p>
              </div>
            </div>
          </div>

          {/* STUDENT INFO STRIPE */}
          <div
            className="grid grid-cols-[1fr_auto] items-start gap-2 px-4 py-2 text-[8.5px] sm:text-[9px]"
            style={{ background: "linear-gradient(to right, #f0f4fa, #fafbfd)" }}
          >
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
              <InfoLine label="Name" value="Amara Okafor" />
              <InfoLine label="Reg. No." value="RG/2026/014" />
              <InfoLine label="Class" value="JSS 2 Gold" />
              <InfoLine label="Term" value="Second Term" />
            </div>
            <div className="text-right">
              <InfoLine label="Session" value="2025/2026" />
              <InfoLine label="Subjects" value="10 offered" />
            </div>
          </div>

          {/* PERFORMANCE SUMMARY BAND */}
          <div
            className="grid grid-cols-3 divide-x divide-white/20 border-y border-slate-100"
            style={{ background: "#07317a" }}
          >
            <SummaryCell label="Term Average" value="77.0%" />
            <SummaryCell label="Class Position" value="4th / 32" />
            <SummaryCell label="Attendance" value="86 / 90" />
          </div>

          {/* RESULTS TABLE */}
          <div className="px-3 pt-2 pb-1 sm:px-4">
            <div
              className="grid gap-1 rounded-t border-x border-t border-slate-200 px-2 py-1.5 text-[7.5px] font-bold uppercase tracking-wide text-white sm:text-[8px]"
              style={{
                gridTemplateColumns: "1.6fr 0.55fr 0.6fr 0.52fr 0.5fr 0.72fr",
                background: "#07317a",
              }}
            >
              <span>Subject</span>
              <span className="text-center">CA /40</span>
              <span className="text-center">Exam /60</span>
              <span className="text-center">Total</span>
              <span className="text-center">Grd</span>
              <span className="text-center">Remark</span>
            </div>

            {subjects.map((s, i) => (
              <div
                key={s.name}
                className="grid gap-1 border-x border-b border-slate-200 px-2 py-1.5 text-[8px] sm:text-[9px]"
                style={{
                  gridTemplateColumns: "1.6fr 0.55fr 0.6fr 0.52fr 0.5fr 0.72fr",
                  background:
                    i % 2 === 0
                      ? "#ffffff"
                      : "linear-gradient(to right, #eef2fb, #f6f8fd)",
                }}
              >
                <span className="font-semibold text-slate-700 truncate">{s.name}</span>
                <span className="text-center text-slate-500">{s.ca}</span>
                <span className="text-center text-slate-500">{s.exam}</span>
                <span className="text-center font-bold text-slate-800">{s.total}</span>
                <span
                  className="mx-auto flex items-center justify-center rounded text-[7px] font-bold px-1"
                  style={{
                    background: s.grade.startsWith("A")
                      ? "#d1fae5"
                      : s.grade.startsWith("B")
                        ? "#dbeafe"
                        : "#fef3c7",
                    color: s.grade.startsWith("A")
                      ? "#065f46"
                      : s.grade.startsWith("B")
                        ? "#1e40af"
                        : "#92400e",
                  }}
                >
                  {s.grade}
                </span>
                <span className="text-center text-[7.5px] text-slate-500">{s.remark}</span>
              </div>
            ))}
          </div>

          {/* REMARKS + SIGNATURES */}
          <div className="mx-3 mt-2 grid grid-cols-2 gap-2 sm:mx-4">
            <div className="rounded border border-slate-200 bg-amber-50/50 px-2 py-1.5">
              <p className="text-[7px] font-bold uppercase tracking-wide text-amber-800">
                Class Teacher's Remark
              </p>
              <p className="mt-1 text-[8.5px] italic leading-snug text-slate-700">
                "Shows steady progress. Keep practising challenging topics."
              </p>
              <div className="mt-2 flex items-end justify-between border-t border-slate-200 pt-1">
                <div>
                  <p className="text-[11px] italic text-slate-600" style={{ fontFamily: "Georgia, serif" }}>
                    A. Nwosu
                  </p>
                  <p className="text-[7px] text-slate-400">Class Teacher</p>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-primary/40 text-[5.5px] font-bold uppercase text-primary/50 leading-none text-center">
                  STAMP
                </div>
              </div>
            </div>

            <div className="rounded border border-slate-200 bg-slate-50/60 px-2 py-1.5">
              <p className="text-[7px] font-bold uppercase tracking-wide text-primary/80">
                Principal's Remark
              </p>
              <p className="mt-1 text-[8.5px] italic leading-snug text-slate-700">
                "Satisfactory performance. Continue the great work."
              </p>
              <div className="mt-2 flex items-end justify-between border-t border-slate-200 pt-1">
                <div>
                  <p className="text-[11px] italic text-slate-600" style={{ fontFamily: "Georgia, serif" }}>
                    Dr. E. Obi
                  </p>
                  <p className="text-[7px] text-slate-400">Principal</p>
                </div>
                <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#b8862f]/40 text-[5.5px] font-bold uppercase text-[#b8862f]/50 leading-none text-center">
                  OFFCL
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER VERIFICATION BAND */}
          <div
            className="mx-3 mb-3 mt-2 flex items-center justify-between gap-2 rounded border border-primary/15 px-3 py-1.5 sm:mx-4"
            style={{ background: "linear-gradient(to right, #f0f4fa, #fafbfd)" }}
          >
            <span className="inline-flex items-center gap-1 text-[7.5px] text-slate-500">
              <ShieldCheck className="h-3 w-3 text-primary shrink-0" />
              Secured by iCademia · icademia.app
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[7px] font-bold tracking-wide text-emerald-700">
              VERIFIED
            </span>
          </div>

          {/* Soft fade at bottom */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white/60 rounded-b" />
        </div>
      </div>

      {/* Floating sample label */}
      <div className="absolute -bottom-5 right-6 rounded-full border border-white/15 bg-[#071a2e]/85 px-3 py-1 text-[9px] font-semibold text-white shadow-lg backdrop-blur">
        Sample report preview
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="leading-tight">
      <span className="font-bold uppercase tracking-wide text-slate-400">{label}: </span>
      <span className="font-semibold text-slate-700">{value}</span>
    </p>
  );
}

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-2 text-center">
      <p className="text-[9px] font-bold uppercase tracking-wide text-white/60">{label}</p>
      <p className="mt-0.5 text-[13px] font-extrabold text-white sm:text-sm">{value}</p>
    </div>
  );
}
