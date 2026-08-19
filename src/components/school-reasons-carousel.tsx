import { useEffect, useState } from "react";
import { Eye, FileClock, Fingerprint, ShieldCheck, Trophy } from "lucide-react";

const reasons = [
  {
    icon: ShieldCheck,
    number: "01",
    title: "Records that cannot be torn, misplaced or silently altered",
    body: "A verified digital result remains available after the paper copy fades or disappears. Publication history and controlled access protect the school’s official record.",
    image: "/reason-durable-records.jpg",
    label: "Durable records",
  },
  {
    icon: FileClock,
    number: "02",
    title: "Trace every academic decision",
    body: "Know when a result was uploaded, reviewed, published and accessed. That traceability gives administrators a dependable audit trail for questions from families or regulators.",
    image: "/reason-traceability.jpg",
    label: "Clear traceability",
  },
  {
    icon: Fingerprint,
    number: "03",
    title: "Build a continuous academic footprint",
    body: "Each term adds to a structured student history instead of becoming another isolated sheet. Schools can follow progress, interventions and outcomes across years.",
    image: "/reason-academic-footprint.jpg",
    label: "Long-term footprint",
  },
  {
    icon: Trophy,
    number: "04",
    title: "Foster healthy, visible achievement",
    body: "Professional reports, recognition and the Wall of Fame give students a reason to improve while helping schools celebrate excellence with fairness and context.",
    image: "/reason-achievement.jpg",
    label: "Healthy competitiveness",
  },
  {
    icon: Eye,
    number: "05",
    title: "Give good schools greater visibility",
    body: "Branded reports, public programmes, competitions and embeddable result checking let a school present a modern, trustworthy academic experience to its community.",
    image: "/reason-school-visibility.jpg",
    label: "School visibility",
  },
];

export function SchoolReasonsCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % reasons.length),
      5200,
    );
    return () => window.clearInterval(timer);
  }, [paused]);

  const reason = reasons[active];
  const Icon = reason.icon;

  return (
    <section
      className="overflow-hidden border-y border-border bg-[#07111f] text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="mx-auto grid min-h-[36rem] w-full max-w-7xl lg:grid-cols-[0.88fr_1.12fr]">
        <div className="relative flex flex-col justify-center px-4 py-16 sm:px-8 lg:px-12">
          <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:28px_28px]" />
          <div
            key={reason.number}
            className="relative animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#d6a84b]">
              Why schools move to iCademia
            </p>
            <span className="mt-8 grid h-12 w-12 place-items-center rounded-xl bg-white/8 text-[#d6a84b]">
              <Icon className="h-5 w-5" />
            </span>
            <p className="mt-7 font-mono text-sm text-white/35">{reason.number} / 05</p>
            <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold leading-tight sm:text-4xl">
              {reason.title}
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-white/65">{reason.body}</p>
          </div>
          <div className="relative mt-10 flex items-center gap-2" aria-label="Transition reasons">
            {reasons.map((item, index) => (
              <button
                key={item.number}
                type="button"
                aria-label={`Show reason ${index + 1}: ${item.label}`}
                onClick={() => setActive(index)}
                className={`h-2.5 rounded-full transition-all ${
                  active === index ? "w-9 bg-[#d6a84b]" : "w-2.5 bg-white/25 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
        <div className="relative min-h-80 overflow-hidden lg:min-h-full">
          {reasons.map((item, index) => (
            <img
              key={item.number}
              src={item.image}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition duration-1000 ${
                active === index ? "scale-100 opacity-100" : "scale-105 opacity-0"
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07111f]/55 via-transparent to-transparent" />
          <div className="absolute bottom-8 right-8 rounded-2xl border border-white/15 bg-black/45 px-4 py-3 backdrop-blur">
            <p className="text-xs uppercase tracking-wider text-white/55">Current reason</p>
            <p className="mt-1 font-display font-semibold">{reason.label}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
