import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Upload,
  Trophy,
  Users,
  GraduationCap,
  Presentation,
  CheckCircle2,
  School,
  UserRoundCheck,
  CalendarDays,
  FileText,
  BrainCircuit,
  RefreshCcw,
  Gift,
  Network,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ScratchCardShowcase } from "@/components/scratch-card-showcase";
import { SchoolReasonsCarousel } from "@/components/school-reasons-carousel";
import { AcademicYearVisual } from "@/components/academic-year-visual";
import { AdminIntelligenceVisual } from "@/components/admin-intelligence-visual";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "iCademia — Where Schools, Parents and Students Meet" },
      {
        name: "description",
        content:
          "iCademia is the academic community platform for African schools — result checking, teacher training conferences, inter-school competitions and a virtual Wall of Fame.",
      },
      { property: "og:title", content: "iCademia — Where Schools, Parents and Students Meet" },
      {
        property: "og:description",
        content:
          "More than result checking. Conferences, competitions and a Wall of Fame that celebrates the best of every session.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: KeyRound,
    title: "365 days of full access",
    body: "A ₦1,500 card unlocks one student's published results and supporting records for 365 days.",
  },
  {
    icon: Upload,
    title: "Result & document uploads",
    body: "Teachers upload scores, answer scripts, testimonials and transcripts — organised per class, term and session.",
  },
  {
    icon: Presentation,
    title: "Teacher training conferences",
    body: "We host conferences and masterclasses to train the teachers who train the children — because the foundation must be right.",
  },
  {
    icon: Trophy,
    title: "Wall of Fame",
    body: "Top performers of every academic session are crested on our virtual Wall of Fame — for life.",
  },
  {
    icon: ShieldCheck,
    title: "Encrypted end-to-end",
    body: "Every result, PIN and document is encrypted at rest and in transit. Role-based access keeps records scoped.",
  },
  {
    icon: Users,
    title: "One school community",
    body: "Administrators, form teachers, head teachers, parents and students — one platform, distinct dashboards, seamless flow.",
  },
];

const cardBenefits = [
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
    icon: ShieldCheck,
    title: "A student identity key",
    body: "The unique school-issued PIN becomes the student's private key for results, marked scripts, guidance and future iCademia perks.",
  },
  {
    icon: BrainCircuit,
    title: "Personalised study guidance",
    body: "Turn published performance into practical strengths, improvement areas and next-term study actions.",
  },
  {
    icon: RefreshCcw,
    title: "Simple replacement",
    body: "A lost or damaged card can be replaced for ₦2,500 without losing the student's records. The old card is revoked.",
  },
  {
    icon: School,
    title: "Issued through your school",
    body: "Schools pay securely for a branded batch matching enrolled students. Physical cards arrive in 5–12 working days.",
  },
];

const journeys = [
  {
    icon: GraduationCap,
    title: "For students & parents",
    body: "Enter the card PIN and registration number, view a clear term report, print it, and download marked answer sheets to compare responses with the correct answers.",
    link: "/check-result",
    cta: "See how result checking works",
  },
  {
    icon: UserRoundCheck,
    title: "For teachers",
    body: "Select a class, enter or bulk-upload scores, attach marked scripts, add remarks, and submit. Grades, totals, averages and positions are calculated automatically.",
    link: "/login",
    cta: "Open teacher workspace",
  },
  {
    icon: School,
    title: "For school administrators",
    body: "Invite teachers, assign subjects and classes, approve results, order annual scratch cards, monitor completion and publish professional reports without maintaining servers.",
    link: "/dashboard",
    cta: "Explore the admin dashboard",
  },
];

const usageSteps = [
  {
    number: "01",
    title: "Your school joins",
    body: "An administrator registers the school, verifies their email and adds the school logo and brand colours.",
  },
  {
    number: "02",
    title: "Staff are assigned",
    body: "Invite teachers, class heads and exam officers, then assign the classes or subjects they are responsible for.",
  },
  {
    number: "03",
    title: "Results are prepared",
    body: "Staff upload scores and marked scripts. iCademia calculates grades, averages and positions for administrator approval.",
  },
  {
    number: "04",
    title: "Families get secure access",
    body: "The school orders a branded card for every enrolled student. Unique PINs are created after secure payment and the physical batch arrives in 5–12 working days.",
  },
];

const faqs = [
  [
    "How long does a scratch card last?",
    "A card remains valid for 365 days from the date it is first activated and can be used for all published terms during that period.",
  ],
  [
    "What happens if a card is lost?",
    "The school can issue a replacement for ₦2,500. The replacement protects the same student's records and the lost card can be revoked.",
  ],
  [
    "Can each school use its own branding?",
    "Yes. Administrators can upload the school logo and select brand colours used across the school workspace and generated result sheets.",
  ],
  [
    "Who uploads student scores?",
    "School administrators invite teachers, class heads or exam officers and assign the classes and subjects each staff member is responsible for.",
  ],
  [
    "Does AI change student scores?",
    "No. AI can explain performance patterns and suggest interventions, but it cannot alter scores, grades, positions or publish a result.",
  ],
  [
    "Can students see marked answer sheets?",
    "Yes, when the school uploads them. Students can download attached scripts and compare their responses with teacher feedback.",
  ],
];

function Landing() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-academic" />
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:py-28">
            <div className="text-primary-foreground">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
                <GraduationCap className="h-3.5 w-3.5 text-accent" />
                School operations, thoughtfully managed
              </span>
              <h1 className="mt-6 font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
                Give every student a
                <br />
                <span className="bg-gradient-to-r from-accent to-[oklch(0.88_0.10_75)] bg-clip-text text-transparent">
                  secure academic identity.
                </span>
              </h1>
              <p className="mt-4 max-w-lg text-sm text-white/80 sm:text-base leading-relaxed">
                iCademia helps schools manage academic records, publish professional results, and
                give students secure access to their progress history.
              </p>
              <div className="mt-9 flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto justify-center"
                >
                  <Link to="/check-result">
                    Check a result <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground w-full sm:w-auto justify-center"
                >
                  <Link to="/register-school">Register your school</Link>
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/65">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> ₦1,500 for 365 days
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> All three terms
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> Secure payment
                </span>
              </div>
            </div>

            {/* Beautified Hero Image / Visuals */}
            <div className="relative mt-12 lg:mt-0 flex items-center justify-center">
              {/* Glow Effects */}
              <div className="absolute -inset-10 -z-10 animate-pulse rounded-full bg-primary/25 opacity-40 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-72 w-72 rounded-full bg-accent/20 opacity-30 blur-3xl animate-hero-glow" />

              {/* Main Card */}
              <div className="relative w-full max-w-md transform transition-all duration-500 hover:rotate-1 hover:scale-[1.03] animate-hero-float">
                {/* Decorative border gradient wrapper */}
                <div className="absolute -inset-px rounded-2xl bg-gradient-to-tr from-primary/30 via-accent/30 to-success/30 opacity-70 blur-[1px]" />

                <div className="relative rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-6 shadow-2xl text-white">
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/20">
                        <div className="grid h-full w-full place-items-center bg-primary/30 font-display text-sm font-bold">
                          SR
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-display text-base font-semibold">
                            Student report preview
                          </p>
                          <span className="inline-flex h-2 w-2 rounded-full bg-success animate-ping" />
                        </div>
                        <p className="text-xs text-white/60">JSS 2 · Second Term Report</p>
                      </div>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 border border-accent/30 text-accent shadow-inner">
                      <span className="font-display text-base font-bold">A+</span>
                    </div>
                  </div>

                  {/* Subject List */}
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        s: "Mathematics",
                        t: 92,
                        g: "A+",
                        w: "w-[92%]",
                        c: "from-blue-500 to-indigo-500",
                      },
                      {
                        s: "English Language",
                        t: 88,
                        g: "A",
                        w: "w-[88%]",
                        c: "from-purple-500 to-pink-500",
                      },
                      {
                        s: "Basic Science",
                        t: 95,
                        g: "A+",
                        w: "w-[95%]",
                        c: "from-emerald-500 to-teal-500",
                      },
                      {
                        s: "Computer Studies",
                        t: 90,
                        g: "A+",
                        w: "w-[90%]",
                        c: "from-amber-500 to-orange-500",
                      },
                    ].map((item) => (
                      <div key={item.s} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/80 font-medium">{item.s}</span>
                          <span className="flex items-center gap-2 font-mono">
                            <span className="text-white/90">{item.t}/100</span>
                            <span className="rounded bg-success/15 px-1 py-0.5 text-[10px] font-bold text-success border border-success/20">
                              {item.g}
                            </span>
                          </span>
                        </div>
                        {/* Progress Bar with Micro-animation */}
                        <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${item.c} transition-all duration-1000 ease-out`}
                            style={{ width: `${item.t}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Card Footer Summary */}
                  <div className="mt-5 flex items-center justify-between rounded-xl bg-white/5 border border-white/5 p-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-white/50">
                        Class Position
                      </p>
                      <p className="font-display text-sm font-semibold text-white/90">
                        3rd of 42 students
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wider text-white/50">
                        Average Score
                      </p>
                      <p className="font-display text-sm font-semibold text-accent">91.3%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge 1 (Top Left) */}
              <div className="absolute -top-6 -left-6 transform -rotate-6 transition-all duration-300 hover:rotate-0 hover:scale-105 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-3 shadow-xl flex items-center gap-2.5 text-white animate-bounce-slow">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent/20 text-accent">
                  <Trophy className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 font-medium leading-none">Award Winner</p>
                  <p className="font-display text-xs font-semibold mt-1">School recognition</p>
                </div>
              </div>

              {/* Floating Badge 2 (Bottom Right) */}
              <div className="absolute -bottom-6 -right-6 transform rotate-3 transition-all duration-300 hover:rotate-0 hover:scale-105 rounded-xl border border-white/10 bg-black/60 backdrop-blur-md p-3 shadow-xl flex items-center gap-2.5 text-white animate-float-slow">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-success/20 text-success">
                  <ShieldCheck className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[10px] text-white/50 font-medium leading-none">
                    Verified Report
                  </p>
                  <p className="font-display text-xs font-semibold mt-1">Secured by iCademia</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                The iCademia scratch card
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                One affordable key to a full year of academic records.
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                The card is more than a result-checking PIN. It gives families a secure, reusable
                way to follow performance, review teacher feedback and act on learning gaps
                throughout the year.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-7 gradient-primary text-primary-foreground shadow-elegant"
              >
                <Link to="/register-school">
                  Get yours through your school <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <AcademicYearVisual />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {cardBenefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-border bg-card p-5 shadow-card"
                >
                  <benefit.icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-4 font-display text-base font-semibold">{benefit.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{benefit.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/35">
          <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-16 sm:px-6 lg:grid-cols-3">
            {journeys.map((journey) => (
              <div
                key={journey.title}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <journey.icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 font-display text-xl font-semibold">{journey.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{journey.body}</p>
                <Link
                  to={journey.link}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary"
                >
                  {journey.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section className="relative overflow-hidden">
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
            <div className="relative min-h-[30rem]">
              <img
                src="/nigerian-classroom-port-harcourt.jpg"
                alt="Nigerian secondary school students learning together in Port Harcourt"
                className="absolute inset-x-0 top-0 h-[24rem] w-[88%] rounded-3xl object-cover shadow-elegant"
              />
              <img
                src="/nigerian-students-port-harcourt.jpg"
                alt="Nigerian student participating in a classroom activity"
                className="absolute bottom-0 right-0 h-56 w-[58%] rounded-3xl border-8 border-background object-cover shadow-2xl"
              />
              <div className="absolute bottom-8 left-5 max-w-52 rounded-2xl border border-white/20 bg-[#07111f]/90 p-4 text-white shadow-xl backdrop-blur">
                <p className="text-xs uppercase tracking-wider text-[#d6a84b]">
                  Built around the learner
                </p>
                <p className="mt-2 font-display text-lg font-semibold">
                  Every score should lead to a better next step.
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                From classroom effort to visible progress
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Technology should strengthen the work already happening in Nigerian schools.
              </h2>
              <p className="mt-5 leading-7 text-muted-foreground">
                iCademia connects the teacher’s assessment, the administrator’s oversight and the
                family’s support around one verified student record. Schools keep teaching; iCademia
                handles the operational weight around the learning.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  ["Teachers", "Upload scores, remarks and marked scripts once."],
                  ["Administrators", "Audit readiness and approve professional reports."],
                  ["Families", "Understand performance and act on learning gaps."],
                  ["Students", "Own a secure academic identity and unlock new opportunities."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-border bg-card p-5">
                    <p className="font-display font-semibold">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
              <p className="mt-5 text-[11px] text-muted-foreground">
                Photography: Emmanuel Ikwuegbu and Dike Darion / Unsplash.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">
              Why iCademia
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Beyond result checking — the academic community platform.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Because getting the foundation right takes more than a report card. We join the
              efforts of schools and parents to nurture the next generation.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-border bg-card p-6 shadow-card transition-all hover:-translate-y-1 hover:shadow-elegant sm:p-7"
              >
                <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <SchoolReasonsCarousel />

        <section className="relative overflow-hidden bg-[#eef2f8]">
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Intelligence for school leaders
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                An academic operations copilot—not another chatbot.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
                iCademia turns the records your school already has into a practical morning brief:
                what is incomplete, where performance is changing, who needs to act and what the
                principal should review next.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Audit results before publication",
                  "Surface class and subject learning gaps",
                  "Plan teacher upload responsibilities",
                  "Draft privacy-safe parent communication",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs leading-5 text-muted-foreground">
                Current capability: iCademia analyses de-identified school aggregates and prepares
                reviewable briefs, checklists, intervention plans and communication drafts. It
                cannot currently edit scores, publish results, send messages or assign staff.
              </p>
              <Button asChild className="mt-7">
                <Link to="/register-school">
                  Bring intelligence into your school <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <AdminIntelligenceVisual />
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              How to use iCademia
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              From school setup to a result in four clear steps.
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {usageSteps.map((step) => (
              <div
                key={step.number}
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
              >
                <span className="font-mono text-sm font-bold text-primary">{step.number}</span>
                <h3 className="mt-5 font-display text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="group relative overflow-hidden rounded-3xl bg-[#07111f] p-7 text-white sm:p-9">
              <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border-[28px] border-sky-400/10 transition-transform duration-700 group-hover:rotate-45" />
              <p className="text-sm font-semibold uppercase tracking-wider text-[#d6a84b]">
                iCademia Intelligence
              </p>
              <h2 className="mt-3 max-w-lg font-display text-3xl font-semibold">
                Practical support after a student unlocks their record.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-white/65">
                AI can explain strengths in plain language, identify learning gaps, build a
                term-specific study plan and help a student prepare questions for their teacher.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {["Explain my result", "Plan my next term", "Show where to improve"].map(
                  (label, index) => (
                    <div
                      key={label}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-white/75"
                      style={{ animationDelay: `${index * 180}ms` }}
                    >
                      <BrainCircuit className="mb-2 h-4 w-4 text-sky-300" /> {label}
                    </div>
                  ),
                )}
              </div>
              <p className="mt-6 text-xs text-white/45">
                It cannot change grades, replace a teacher, complete live assessments or publish a
                student’s information.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-7 border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <Link to="/check-result">See the student experience</Link>
              </Button>
            </div>

            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-7 shadow-card sm:p-9">
              <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(#3730a3_1px,transparent_1px),linear-gradient(90deg,#3730a3_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="relative">
                <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Result checker widget
                </p>
                <h2 className="mt-3 max-w-lg font-display text-3xl font-semibold">
                  Keep students on the school website they already know.
                </h2>
                <p className="mt-4 leading-7 text-muted-foreground">
                  Schools can embed the secure iCademia checker into WordPress, React, Next.js, Vue,
                  Laravel or a plain HTML website. Schools still issue the scratch cards, while
                  iCademia securely validates each PIN and displays the student&apos;s result
                  directly on the school&apos;s website.
                </p>
                <div className="mt-7 overflow-hidden rounded-2xl border border-border bg-[#07111f] p-4 font-mono text-xs leading-6 text-sky-100 shadow-xl">
                  <p className="text-white/35">&lt;!-- yourschool.edu.ng/results --&gt;</p>
                  <p>&lt;iframe</p>
                  <p className="pl-4 text-[#d6a84b]">src="icademia.app/widget/result-checker"</p>
                  <p className="pl-4">title="School result checker"</p>
                  <p>/&gt;</p>
                </div>
                <Button asChild className="mt-7">
                  <Link to="/developers">
                    Open developer resources <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-card lg:grid-cols-[1fr_0.9fr]">
            <div className="p-7 sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Schools referring schools
              </p>
              <h2 className="mt-3 max-w-xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Grow the community. Create new income for your school.
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-muted-foreground">
                School leaders already know which neighbouring schools need a better result
                workflow. Introduce them to iCademia and earn ₦200 for every student they onboard
                successfully.
              </p>
              <div className="mt-7 flex flex-wrap gap-4 text-sm">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Unique referral ID
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Enrolment-based tracking
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" /> Visible payout status
                </span>
              </div>
              <Button asChild className="mt-7">
                <Link to="/login">
                  Open your referral centre <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="relative bg-[#07111f] p-7 text-white sm:p-10">
              <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:22px_22px]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#d6a84b]">
                      Referral reward example
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold">
                      One trusted introduction
                    </p>
                  </div>
                  <Gift className="h-5 w-5 text-[#d6a84b]" />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-4">
                    <School className="h-4 w-4 text-sky-300" />
                    <p className="mt-3 text-xs font-semibold">Referred school</p>
                    <p className="mt-1 text-[10px] text-white/45">650 students onboarded</p>
                  </div>
                  <Network className="h-5 w-5 shrink-0 text-white/30" />
                  <div className="flex-1 rounded-xl border border-[#d6a84b]/20 bg-[#d6a84b]/10 p-4">
                    <p className="text-[10px] text-[#f5d996]">₦200 × 650</p>
                    <p className="mt-2 font-display text-2xl font-semibold">₦130,000</p>
                    <p className="mt-1 text-[10px] text-white/45">tracked reward</p>
                  </div>
                </div>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-3/4 animate-pulse rounded-full bg-gradient-to-r from-sky-400 to-[#d6a84b]" />
                </div>
                <p className="mt-3 text-[10px] text-white/40">
                  Qualification and payout remain visible in the referring school’s dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-muted/35">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Frequently asked questions
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight">
                Clear answers before your school gets started.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Need something more specific? Register your school and include it in the onboarding
                notes.
              </p>
            </div>
            <Accordion
              type="single"
              collapsible
              className="rounded-2xl border border-border bg-card px-6 shadow-card"
            >
              {faqs.map(([question, answer], index) => (
                <AccordionItem key={question} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left">{question}</AccordionTrigger>
                  <AccordionContent className="leading-6 text-muted-foreground">
                    {answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <ScratchCardShowcase />

        {/* CTA */}
        <section className="mx-auto mt-20 w-full max-w-7xl px-4 pb-20 sm:px-6 sm:pb-24">
          <div className="relative overflow-hidden rounded-3xl gradient-academic px-6 py-14 text-center sm:px-16 sm:py-16">
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                backgroundSize: "24px 24px",
              }}
            />
            <div className="relative mx-auto max-w-2xl text-primary-foreground">
              <GraduationCap className="mx-auto h-10 w-10 text-accent" />
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                Bring your school into the community.
              </h2>
              <p className="mt-4 text-white/75">
                Get set up in minutes — order scratch cards, publish results, and be part of our
                next teacher training conference.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3 w-full sm:w-auto">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto justify-center"
                >
                  <Link to="/register-school">Register your school</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground w-full sm:w-auto justify-center"
                >
                  <Link to="/conferences">See conferences</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function GradePill() {
  return <span className="font-display text-lg font-bold">A</span>;
}
