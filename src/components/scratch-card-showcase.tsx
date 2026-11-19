import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  KeyRound,
  MapPin,
  RotateCcw,
  ScanLine,
  School,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function ScratchCardShowcase() {
  const [backVisible, setBackVisible] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setBackVisible((value) => !value), 4200);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section className="relative overflow-hidden bg-[#07111f] text-white">
      <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_15%_25%,#60a5fa_0,transparent_25%),radial-gradient(circle_at_85%_70%,#d6a84b_0,transparent_22%)]" />
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(30deg,#fff_1px,transparent_1px),linear-gradient(150deg,#fff_1px,transparent_1px)] [background-size:44px_76px]" />
      <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#d6a84b]">
            More than a result PIN
          </p>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            One card. 365 days of opportunity.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/68">
            The iCademia card is a student’s private identity key—opening verified results, marked
            answer sheets, personal study guidance, recognition and every new student perk added
            during the 365-day access period.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              [KeyRound, "Unique to one student"],
              [CalendarDays, "Valid for 365 days"],
              [ScanLine, "QR access to the checker"],
              [ShieldCheck, "School-issued and auditable"],
            ].map(([Icon, label]) => (
              <div key={label as string} className="flex items-center gap-3 text-sm text-white/80">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/8">
                  <Icon className="h-4 w-4 text-[#d6a84b]" />
                </span>
                {label as string}
              </div>
            ))}
          </div>
          <div className="mt-9 flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
            <Button
              asChild
              size="lg"
              className="bg-[#d6a84b] text-[#07111f] hover:bg-[#e3bc66] w-full sm:w-auto justify-center"
            >
              <Link to="/register-school">
                Order for your school <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setBackVisible((value) => !value)}
              className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white w-full sm:w-auto justify-center"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Show {backVisible ? "front" : "back"}
            </Button>
          </div>
        </div>

        <div
          className="mx-auto w-full max-w-2xl py-2 [perspective:1600px] sm:py-0"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <div className="relative aspect-[1.68/1] w-full [transform-style:preserve-3d] sm:[transform:rotateX(-5deg)_rotateZ(-1deg)]">
            <div
              className="absolute inset-0 transition-transform duration-1000 ease-in-out [transform-style:preserve-3d]"
              style={{ transform: `rotateY(${backVisible ? 180 : 0}deg)` }}
            >
              <CardEdges />
              <CardFront />
              <CardBack />
            </div>
          </div>
          <p className="mt-5 text-center text-xs text-white/45">
            Rotates automatically. Hover to pause or use the control to inspect either side.
          </p>
        </div>
      </div>
    </section>
  );
}

export function AccessCardVisual() {
  const [backVisible, setBackVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setBackVisible((value) => !value), 4800);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#0d1f3c_0%,#07111f_45%,#101832_100%)] p-6 shadow-[0_8px_40px_rgba(7,17,31,0.45)] sm:p-8">
      {/* Subtle gold + blue glows inside the card container */}
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-[#d6a84b]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl" />
      {/* One access card · 365 days label */}
      <p className="mb-4 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#d6a84b]/80">
        One access card · 365 days of access
      </p>
      <div className="mx-auto w-full max-w-2xl py-2 [perspective:1600px] sm:py-0">
        <div className="relative aspect-[1.68/1] w-full [transform-style:preserve-3d] sm:[transform:rotateX(-3deg)]">
          <div
            className="absolute inset-0 transition-transform duration-700 ease-in-out [transform-style:preserve-3d]"
            style={{ transform: `rotateY(${backVisible ? 180 : 0}deg)` }}
          >
            <CardEdges />
            <CardFront />
            <CardBack />
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-white/10 pt-4">
        <div>
          <p className="text-xs font-semibold text-white">
            School-branded annual access card
          </p>
          <p className="mt-0.5 text-[10px] text-white/45">
            Demo preview · rotates automatically
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setBackVisible((value) => !value)}
          className="w-full shrink-0 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto"
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Show {backVisible ? "front" : "back"}
        </Button>
      </div>
    </div>
  );
}

function CardShell({ children, back = false }: { children: React.ReactNode; back?: boolean }) {
  return (
    <div
      className="absolute inset-0 overflow-hidden rounded-2xl border border-white/20 bg-[linear-gradient(135deg,#193560_0%,#10264a_28%,#0a1932_62%,#07111f_100%)] p-[3.5%] text-white shadow-[0_24px_55px_rgba(0,0,0,.34),inset_0_1px_0_rgba(255,255,255,.16)] [backface-visibility:hidden] sm:rounded-[1.65rem] sm:p-[5%] sm:shadow-[0_35px_90px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.16)]"
      style={{ transform: back ? "rotateY(180deg) translateZ(5px)" : "translateZ(5px)" }}
    >
      <div className="absolute -right-[12%] -top-[30%] h-[85%] w-[58%] rounded-full border-[18px] border-[#d6a84b]/15" />
      <div className="absolute -bottom-[45%] -left-[10%] h-[85%] w-[55%] rounded-full border border-white/10" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(120deg,transparent_0,transparent_14px,#fff_15px,transparent_16px)]" />
      <div className="absolute inset-x-0 top-0 h-[44%] bg-gradient-to-b from-white/10 to-transparent" />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

function CardEdges() {
  return (
    <>
      <div
        className="absolute inset-x-6 top-0 h-[10px] origin-top rounded-full bg-gradient-to-b from-[#8ca0c3] to-[#263b60]"
        style={{ transform: "rotateX(90deg) translateZ(5px)" }}
      />
      <div
        className="absolute inset-x-6 bottom-0 h-[10px] origin-bottom rounded-full bg-gradient-to-t from-[#07101f] to-[#31496e]"
        style={{ transform: "rotateX(-90deg) translateZ(5px)" }}
      />
      <div
        className="absolute inset-y-6 left-0 w-[10px] origin-left rounded-full bg-gradient-to-r from-[#8496b7] to-[#203655]"
        style={{ transform: "rotateY(-90deg) translateZ(5px)" }}
      />
      <div
        className="absolute inset-y-6 right-0 w-[10px] origin-right rounded-full bg-gradient-to-l from-[#07101f] to-[#31496e]"
        style={{ transform: "rotateY(90deg) translateZ(5px)" }}
      />
    </>
  );
}

function CardFront() {
  return (
    <CardShell>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <img
            src="/icademia-logo-white.png"
            alt=""
            className="h-7 w-7 object-contain sm:h-10 sm:w-10"
          />
          <div>
            <p className="font-display text-base font-bold sm:text-2xl">iCademia</p>
            <p className="text-[6px] uppercase tracking-[0.22em] text-white/55 sm:text-[10px] sm:tracking-[0.28em]">
              Student access card
            </p>
          </div>
        </div>
        <span className="hidden rounded-full border border-[#d6a84b]/30 bg-[#d6a84b]/10 px-3 py-1 text-[8px] font-semibold uppercase tracking-wider text-[#f5d996] sm:inline-flex sm:text-[10px]">
          Annual identity
        </span>
      </div>
      <div className="mt-[4%] flex items-center gap-[4%] sm:mt-[7%] sm:gap-[5%]">
        <MetallicChip />
        <div>
          <div className="flex items-center gap-2">
            <span className="hidden h-7 w-7 place-items-center rounded-md bg-white/10 text-[#f5d996] sm:grid sm:h-9 sm:w-9">
              <School className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <div>
              <p className="text-[8px] uppercase tracking-[0.16em] text-white/40 sm:text-[9px] sm:tracking-[0.2em]">
                Issued by
              </p>
              <p className="font-display text-xs font-semibold sm:text-lg">Demo Heights Academy</p>
              <p className="mt-0.5 flex items-center gap-1 text-[7px] text-white/50 sm:text-[9px]">
                <MapPin className="h-2.5 w-2.5 text-[#f5d996]" />
                Port Harcourt, Rivers State
              </p>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-[6px] uppercase tracking-[0.08em] text-white/45 sm:mt-1.5 sm:gap-x-3 sm:text-[9px] sm:tracking-[0.16em]">
            <span>Ada Okafor</span>
            <span>Student ID · ICA-DEMO-0042</span>
          </div>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between">
        <div>
          <p className="text-[6px] uppercase tracking-[0.16em] text-white/40 sm:text-[10px] sm:tracking-[0.22em]">
            Unlock 365 days of access
          </p>
          <p className="mt-0.5 text-[8px] font-medium text-white/75 sm:mt-1 sm:text-sm">
            Results · Scripts · Guidance · Recognition
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] uppercase tracking-wider text-white/40 sm:text-[10px]">
            Validity
          </p>
          <p className="text-xs font-semibold text-[#f5d996] sm:text-base">365 DAYS</p>
        </div>
      </div>
    </CardShell>
  );
}

function CardBack() {
  return (
    <CardShell back>
      <div className="flex h-full gap-[5%] pt-[4%] sm:pt-0">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between">
            <p className="font-display text-[11px] font-semibold sm:text-lg">
              How to use your card
            </p>
            <p className="font-mono text-[7px] text-white/45 sm:text-[10px]">DEMO-26-0042</p>
          </div>
          <ol className="mt-[2%] space-y-0.5 text-[7px] leading-[1.35] text-white/72 sm:mt-[4%] sm:space-y-[2%] sm:text-[11px] sm:leading-relaxed">
            <li>1. Log in through your school portal or visit www.icademia.app.</li>
            <li>2. Open Result Checker and enter your registration number.</li>
            <li>3. Scratch gently, enter the unique PIN and keep this card safe.</li>
          </ol>
          <div className="relative mt-[10%] overflow-hidden rounded-lg border border-white/15 bg-black/20 px-2 py-1.5 shadow-inner sm:mt-[4%] sm:rounded-xl sm:px-4 sm:py-3">
            <p className="text-[6px] uppercase tracking-[0.16em] text-white/45 sm:text-[9px] sm:tracking-[0.22em]">
              Unique access PIN
            </p>
            <p className="mt-0.5 whitespace-nowrap font-mono text-[11px] font-bold tracking-[0.06em] text-white sm:mt-1 sm:text-xl sm:tracking-[0.1em]">
              4F2A<span className="text-[#f5d996]">-</span>7B19
              <span className="text-[#f5d996]">-</span>X05C
              <span className="text-[#f5d996]">-</span>8D3K
            </p>
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 h-full w-[54%] border-l border-white/70 bg-[linear-gradient(115deg,#616872_0%,#f9fafb_25%,#9299a2_48%,#ffffff_69%,#656d77_100%)] shadow-[-8px_0_16px_rgba(7,17,31,.24)] [clip-path:polygon(8%_0,100%_0,100%_100%,5%_100%,0_84%,7%_68%,1%_50%,8%_31%,2%_14%)]"
            />
            <p className="absolute right-3 top-1/2 -translate-y-1/2 rotate-[-3deg] text-[7px] font-bold uppercase tracking-wider text-slate-700 sm:text-[9px]">
              Scratch gently
            </p>
          </div>
          <div className="mt-auto flex items-end justify-between pt-1 text-[6px] text-white/48 sm:pt-0 sm:text-[9px]">
            <div>
              <p>Expires 365 days after first activation</p>
              <p className="mt-1 hidden sm:block">
                WhatsApp transfer support: 07065737817 · hello@icademia.app
              </p>
            </div>
            <p className="font-medium text-white/65">www.icademia.app</p>
          </div>
        </div>
        <div className="flex h-fit w-[18%] self-center flex-col items-center rounded-lg border border-white/15 bg-white/[0.04] p-1 text-white sm:w-[21%] sm:rounded-xl sm:p-2">
          <div className="w-[82%]">
            <QrMark />
          </div>
          <p className="mt-1 text-center text-[5px] font-bold uppercase leading-tight sm:text-[8px]">
            Scan to check result
          </p>
        </div>
      </div>
    </CardShell>
  );
}

function MetallicChip() {
  return (
    <div className="grid h-10 w-14 shrink-0 grid-cols-3 overflow-hidden rounded-md border border-amber-200/40 bg-[linear-gradient(135deg,#f5d87d,#a87824_55%,#efd98c)] p-1 shadow-inner sm:h-16 sm:w-20 sm:rounded-lg">
      {Array.from({ length: 9 }).map((_, index) => (
        <span key={index} className="border border-amber-900/35" />
      ))}
    </div>
  );
}

function QrMark() {
  return (
    <div className="grid aspect-square w-full grid-cols-[repeat(25,1fr)] overflow-hidden rounded-sm">
      {Array.from({ length: 625 }).map((_, index) => (
        <span key={index} className={qrCell(index) ? "bg-white" : "bg-transparent"} />
      ))}
    </div>
  );
}

function qrCell(index: number) {
  const x = index % 25;
  const y = Math.floor(index / 25);
  const finder = (originX: number, originY: number) => {
    const dx = x - originX;
    const dy = y - originY;
    if (dx < 0 || dx > 6 || dy < 0 || dy > 6) return false;
    return (
      dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)
    );
  };
  if (finder(1, 1) || finder(17, 1) || finder(1, 17)) return true;
  if ((x < 9 && y < 9) || (x > 15 && y < 9) || (x < 9 && y > 15)) return false;
  return (x * 17 + y * 31 + x * y * 3) % 7 < 3;
}
