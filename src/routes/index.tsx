import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ShieldCheck,
  Trophy,
  GraduationCap,
  CheckCircle2,
  School,
  UserRoundCheck,
  BrainCircuit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AdminIntelligenceVisual } from "@/components/admin-intelligence-visual";
import { AcademicYearVisual } from "@/components/academic-year-visual";
import { AccessCardVisual } from "@/components/scratch-card-showcase";
import { StudentReportPreview } from "@/components/student-report-preview";
import { SchoolReasonsVisual } from "@/components/school-reasons-carousel";
import { PartnerSchoolsMarquee } from "@/components/partner-schools-marquee";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "iCademia — Publish Trusted School Results" },
      {
        name: "description",
        content:
          "iCademia helps schools prepare, review and publish professional results, then gives families secure access and practical learning guidance.",
      },
      { property: "og:title", content: "iCademia — Publish Trusted School Results" },
      {
        property: "og:description",
        content:
          "A clear workflow for school setup, result review, professional report cards and secure family access.",
      },
    ],
  }),
  component: Landing,
});

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
    title: "For Head Teachers",
    body: "Enter scores for assigned classes, add remarks and supporting records, then submit complete results to the School Admin for review.",
    link: "/teacher-login",
    cta: "Open Head Teacher workspace",
  },
  {
    icon: School,
    title: "For school administrators",
    body: "Manage student and staff records, set up classes and subjects, review and publish results, build timetables, send staff announcements and manage result-access cards.",
    link: "/dashboard",
    cta: "See the admin workspace",
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
    body: "Invite Head Teachers, then assign the classes and academic responsibilities they oversee.",
  },
  {
    number: "03",
    title: "Results are prepared",
    body: "For launch, iCademia sets up the profile and compiles results from your school records. Your administrator reviews and approves them before students can access reports.",
  },
  {
    number: "04",
    title: "Families get secure access",
    body: "Request transfer details for branded cards on WhatsApp. iCademia confirms the transfer, issues the student PINs and prepares the physical batch for delivery in 5–12 working days.",
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
    "For new partner schools, iCademia uploads and compiles the records your school provides. Your School Administrator checks and approves each result before publication. After onboarding, staff can enter results in the workspace themselves.",
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
              <h1 className="mt-6 font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
                Publish trusted school results.
                <br />
                <span className="bg-gradient-to-r from-accent to-[oklch(0.88_0.10_75)] bg-clip-text text-transparent">
                  Give every student a secure academic identity.
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
                  <Link to="/register-school">
                    Register your school <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/5 text-primary-foreground hover:bg-white/10 hover:text-primary-foreground w-full sm:w-auto justify-center"
                >
                  <Link to="/check-result">Check a result</Link>
                </Button>
              </div>
              <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/65">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> Guided school onboarding
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> All three terms
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-accent" /> AI learning support
                </span>
              </div>
            </div>

            {/* Beautified Hero Image / Visuals */}
            <div className="relative mt-12 lg:mt-0 flex items-center justify-center">
              {/* Glow Effects */}
              <div className="absolute -inset-10 -z-10 animate-pulse rounded-full bg-primary/25 opacity-40 blur-3xl" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-72 w-72 rounded-full bg-accent/20 opacity-30 blur-3xl animate-hero-glow" />

              <StudentReportPreview />

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
            </div>
          </div>
        </section>

        {/* Partner Schools Auto-sliding Marquee */}
        <PartnerSchoolsMarquee />

        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="flex h-full flex-col justify-center">
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
                className="mt-7 w-full gradient-primary text-primary-foreground shadow-elegant sm:w-auto"
              >
                <Link to="/register-school">
                  Get yours through your school <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                Lost cards can be revoked and replaced without losing the student&apos;s academic
                history.
              </p>
            </div>
            <div className="flex h-full items-center">
              <AccessCardVisual />
            </div>
          </div>
          <AcademicYearVisual />
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
            <SchoolReasonsVisual />
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
                  ["Head Teachers", "Enter scores, remarks and supporting records once."],
                  ["School Admins", "Audit completeness and publish professional reports."],
                  ["Families", "Understand performance and act on learning gaps."],
                  ["Students", "Own a secure academic identity and unlock new opportunities."],
                ].map(([title, body]) => (
                  <div key={title} className="rounded-2xl border border-border bg-card p-5">
                    <p className="font-display font-semibold">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

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
                School Admin should review next.
              </p>
              <div className="mt-7 grid gap-3 sm:grid-cols-2">
                {[
                  "Audit results before publication",
                  "Surface class and subject learning gaps",
                  "Plan Head Teacher submission responsibilities",
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
              <Button asChild className="mt-7 w-full sm:w-auto">
                <Link to="/register-school">
                  Bring intelligence into your school <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
            <AdminIntelligenceVisual />
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                How to use iCademia
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                From school setup to a result in four clear steps.
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Bring administrators, Head Teachers, students and families into one dependable
                academic process without disrupting how the school already works.
              </p>
            </div>
            <div className="relative min-h-[22rem] sm:min-h-[26rem]">
              <img
                src="/nigerian-classroom-port-harcourt.jpg"
                alt="Nigerian secondary school students learning together in Port Harcourt"
                className="absolute inset-x-0 top-0 h-[18rem] w-[90%] rounded-3xl object-cover shadow-elegant sm:h-[21rem]"
              />
              <img
                src="/nigerian-students-port-harcourt.jpg"
                alt="A Nigerian student participating in a classroom activity"
                className="absolute bottom-0 right-0 h-40 w-[56%] rounded-2xl border-[6px] border-background object-cover shadow-2xl sm:h-48 sm:rounded-3xl sm:border-8"
              />
              <div className="absolute bottom-5 left-4 max-w-[62%] rounded-2xl border border-white/15 bg-[#07111f]/92 p-4 text-white shadow-xl backdrop-blur sm:left-5 sm:max-w-64">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#d6a84b] sm:text-xs">
                  One connected workflow
                </p>
                <p className="mt-1.5 font-display text-sm font-semibold leading-snug sm:text-lg">
                  From the staff room to every family.
                </p>
              </div>
            </div>
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
                className="mt-7 w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white sm:w-auto"
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
                <Button asChild className="mt-7 w-full sm:w-auto">
                  <Link to="/developers">
                    Open developer resources <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
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
                Set up your school, prepare complete results and give every family secure access to
                a professional report card.
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
                  <Link to="/login">School administrator sign in</Link>
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
