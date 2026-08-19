import { BarChart3, BookOpenCheck, Check, FileCheck2, KeyRound, LockKeyhole } from "lucide-react";

const terms = [
  { label: "First term", status: "Published", value: "78%" },
  { label: "Second term", status: "Published", value: "82%" },
  { label: "Third term", status: "Ready when published", value: "—" },
];

export function AcademicYearVisual() {
  return (
    <div className="relative mt-10 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#081426] p-4 text-white shadow-[0_28px_70px_rgba(7,17,31,.22)] sm:p-5">
      <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:20px_20px]" />
      <div className="relative flex items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d6a84b]">
            One access card · 365 days of access
          </p>
          <p className="mt-1 text-sm font-semibold">Student record timeline</p>
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#d6a84b] text-[#07111f] shadow-lg">
          <KeyRound className="h-4 w-4" />
        </span>
      </div>

      <div className="relative mt-4 space-y-2.5">
        {terms.map((term, index) => (
          <div
            key={term.label}
            className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.045] p-3 transition hover:bg-white/[0.08]"
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                index < 2 ? "bg-emerald-400/15 text-emerald-300" : "bg-white/8 text-white/45"
              }`}
            >
              {index < 2 ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold">{term.label}</p>
              <p className="mt-0.5 truncate text-[10px] text-white/45">{term.status}</p>
            </div>
            <p className="font-mono text-xs font-semibold text-[#f5d996]">{term.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        {[
          [FileCheck2, "Reports"],
          [BookOpenCheck, "Scripts"],
          [BarChart3, "Growth"],
        ].map(([Icon, label]) => (
          <div
            key={label as string}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5 text-center"
          >
            <Icon className="mx-auto h-3.5 w-3.5 text-[#d6a84b]" />
            <p className="mt-1.5 text-[9px] font-medium text-white/60">{label as string}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-3 flex items-center gap-2 rounded-xl bg-[#d6a84b]/10 px-3 py-2.5 text-[10px] text-[#f5d996]">
        <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1">School-verified history follows the student all year.</span>
        <Check className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}
