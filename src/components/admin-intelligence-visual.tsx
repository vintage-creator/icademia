import { AlertTriangle, BrainCircuit, CheckCircle2, Clock3, TrendingUp } from "lucide-react";

const feed = [
  {
    icon: AlertTriangle,
    tone: "text-amber-300 bg-amber-300/10",
    title: "12 results need remarks",
    body: "Before publication",
  },
  {
    icon: TrendingUp,
    tone: "text-cyan-300 bg-cyan-300/10",
    title: "Mathematics improving",
    body: "+6.4% across JSS classes",
  },
  {
    icon: CheckCircle2,
    tone: "text-emerald-300 bg-emerald-300/10",
    title: "SS 2 upload complete",
    body: "All subjects verified",
  },
];

export function AdminIntelligenceVisual() {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#07111f] p-5 text-white shadow-2xl sm:p-6">
      <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border-[35px] border-[#d6a84b]/8" />
      <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6a84b]">
            Example academic brief
          </p>
          <p className="mt-1 font-display text-lg font-semibold">Principal’s morning brief</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" /> Illustrative preview
        </span>
      </div>

      <div className="relative mt-4 grid grid-cols-3 gap-2">
        {[
          ["94%", "Result readiness"],
          ["8", "Classes reported"],
          ["3", "Actions today"],
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
            <p className="font-display text-xl font-semibold text-[#f5d996]">{value}</p>
            <p className="mt-1 text-[9px] leading-4 text-white/45">{label}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 space-y-2">
        {feed.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3"
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${item.tone}`}>
              <item.icon className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{item.title}</p>
              <p className="mt-0.5 text-[10px] text-white/45">{item.body}</p>
            </div>
            <Clock3 className="h-3.5 w-3.5 text-white/25" />
          </div>
        ))}
      </div>

      <div className="relative mt-4 rounded-xl border border-[#d6a84b]/20 bg-[#d6a84b]/8 p-3">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[#f5d996]">
          <BrainCircuit className="h-3.5 w-3.5" /> Recommended next action
        </div>
        <p className="mt-2 text-xs leading-5 text-white/65">
          Ask class heads to complete missing remarks, then run the publication readiness check
          again.
        </p>
      </div>
    </div>
  );
}
