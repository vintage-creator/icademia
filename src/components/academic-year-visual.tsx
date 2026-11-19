import {
  BrainCircuit,
  CalendarDays,
  Check,
  FileText,
  KeyRound,
  LockKeyhole,
  School,
} from "lucide-react";

const terms = [
  { label: "First term", status: "Published", value: "78%" },
  { label: "Second term", status: "Published", value: "82%" },
  { label: "Third term", status: "Ready when published", value: "—" },
];

const accessBenefits = [
  {
    icon: CalendarDays,
    title: "365-day access",
    body: "Use one card for 365 full days from activation instead of buying a new PIN every term.",
  },
  {
    icon: FileText,
    title: "The complete report",
    body: "See scores, grades, attendance, remarks, class position and downloadable marked scripts in one place.",
  },
  {
    icon: BrainCircuit,
    title: "Personalised study guidance",
    body: "Turn published performance into practical strengths, improvement areas and next-term study actions.",
  },
  {
    icon: School,
    title: "Issued through your school",
    body: "Request transfer details on WhatsApp, then send your receipt for confirmation. Physical cards are prepared after payment is confirmed.",
  },
];

export function AcademicYearVisual() {
  return (
    <div className="relative mt-10 overflow-hidden rounded-[1.75rem] border border-primary/15 bg-[linear-gradient(135deg,#eef4ff_0%,#f8fafc_55%,#fff8e8_100%)] p-5 text-foreground shadow-card sm:p-6">
      <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_1px_1px,rgba(55,48,163,.16)_1px,transparent_0)] [background-size:22px_22px]" />
      <div className="relative flex items-center justify-between gap-3 border-b border-primary/10 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary sm:text-xs">
            One access card · 365 days of access
          </p>
          <p className="mt-1 text-sm font-semibold sm:text-base">
            The student&apos;s academic year at a glance
          </p>
        </div>
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-lg">
          <KeyRound className="h-4 w-4" />
        </span>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
        {terms.map((term, index) => (
          <div
            key={term.label}
            className="group grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl border border-border/80 bg-white/80 p-3 shadow-sm transition hover:border-primary/20 hover:bg-white"
          >
            <span
              className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                index < 2 ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
              }`}
            >
              {index < 2 ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold">{term.label}</p>
              <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{term.status}</p>
            </div>
            <p className="font-mono text-xs font-semibold text-primary">{term.value}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-5 border-t border-primary/10 pt-5">
        <div className="grid gap-x-0 gap-y-5 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-primary/10">
          {accessBenefits.map((benefit) => (
            <div key={benefit.title} className="lg:px-5 lg:first:pl-0 lg:last:pr-0">
              <div className="flex items-center gap-2.5">
                <benefit.icon className="h-4 w-4 shrink-0 text-primary" />
                <h3 className="font-display text-sm font-semibold">{benefit.title}</h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">{benefit.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mt-5 flex items-center gap-2 border-t border-primary/10 pt-4 text-[10px] font-medium text-primary">
        <LockKeyhole className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1">School-verified history follows the student all year.</span>
        <Check className="h-3.5 w-3.5" />
      </div>
    </div>
  );
}
