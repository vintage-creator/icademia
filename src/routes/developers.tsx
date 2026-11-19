import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCircle2,
  Clipboard,
  Code2,
  ExternalLink,
  Globe2,
  LockKeyhole,
  Palette,
  School,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "Developer Resources — iCademia" },
      {
        name: "description",
        content:
          "Embed the secure iCademia result checker on your school website using HTML, React, Next.js, Vue, WordPress or Laravel.",
      },
    ],
  }),
  component: DeveloperResources,
});

const widgetUrl =
  "https://www.icademia.app/widget/result-checker?school=ICA-SCH-SDM-OWE&colour=%233730A3";

const examples = [
  {
    name: "HTML",
    code: `<iframe
  src="${widgetUrl}"
  title="School result checker"
  width="100%"
  height="620"
  loading="lazy"
  allow="clipboard-write"
  style="border:0;border-radius:20px;max-width:560px"
></iframe>`,
  },
  {
    name: "React",
    code: `export function ResultChecker() {
  const schoolCode = "ICA-SCH-SDM-OWE";
  const src = new URL("https://www.icademia.app/widget/result-checker");
  src.searchParams.set("school", schoolCode);
  src.searchParams.set("colour", "#3730A3");

  return (
    <iframe
      src={src.toString()}
      title="School result checker"
      width="100%"
      height="620"
      loading="lazy"
      style={{ border: 0, borderRadius: 20, maxWidth: 560 }}
    />
  );
}`,
  },
  {
    name: "Next.js",
    code: `export default function ResultsPage() {
  return (
    <main>
      <h1>Check your result</h1>
      <iframe
        src="${widgetUrl}"
        title="School result checker"
        width="100%"
        height="620"
        loading="lazy"
        style={{ border: 0, borderRadius: 20, maxWidth: 560 }}
      />
    </main>
  );
}`,
  },
  {
    name: "Vue",
    code: `<template>
  <iframe
    :src="widgetUrl"
    title="School result checker"
    width="100%"
    height="620"
    loading="lazy"
    class="result-widget"
  />
</template>

<script setup>
const widgetUrl = "${widgetUrl}";
</script>

<style>
.result-widget { border: 0; border-radius: 20px; max-width: 560px; }
</style>`,
  },
  {
    name: "WordPress",
    code: `<!-- Paste into a Custom HTML block -->
<div class="icademia-result-checker">
  <iframe
    src="${widgetUrl}"
    title="School result checker"
    width="100%"
    height="620"
    loading="lazy"
    style="border:0;border-radius:20px;max-width:560px">
  </iframe>
</div>`,
  },
  {
    name: "Laravel / PHP",
    code: `{{-- resources/views/results.blade.php --}}
@php
  $schoolCode = config('services.icademia.school_code');
  $widget = 'https://www.icademia.app/widget/result-checker'
    . '?school=' . urlencode($schoolCode)
    . '&colour=' . urlencode('#3730A3');
@endphp

<iframe
  src="{{ $widget }}"
  title="School result checker"
  width="100%"
  height="620"
  loading="lazy"
  style="border:0;border-radius:20px;max-width:560px">
</iframe>`,
  },
];

const developerFaqs = [
  [
    "Does the school website receive or store the student's PIN?",
    "No. The checker runs inside an iCademia-hosted iframe. PIN submission, verification and result retrieval stay on iCademia's secured origin.",
  ],
  [
    "Can the widget match our school colours?",
    "Yes. Pass a six-digit hex colour through the colour query parameter. The school name and verified branding are resolved from the supplied School Registry ID.",
  ],
  [
    "Can another school use our Registry ID?",
    "A School Registry ID uniquely identifies one institution but is not a secret. Result access still requires the correct unique PIN and registration number. Production domain allowlisting adds another control for approved embeds.",
  ],
  [
    "Will the widget work on phones?",
    "Yes. The interface is responsive. Give the iframe 100% width and at least 620px height, or use compact=true where vertical space is limited.",
  ],
  [
    "Can we build our own result form against an API?",
    "Direct API access is not enabled by default. It requires a reviewed integration, server-to-server credentials, rate limits, audit logging and a signed data-processing agreement.",
  ],
  [
    "What happens when iCademia adds features?",
    "The hosted widget is versioned and maintained by iCademia, so schools receive compatible improvements without replacing embed code.",
  ],
];

function DeveloperResources() {
  const [selected, setSelected] = useState("HTML");
  const active = examples.find((example) => example.name === selected)!;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-clip bg-[#07111f] text-white">
          <div className="absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 h-[500px] w-[500px] rounded-full bg-accent/20 blur-[120px] pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px] pointer-events-none" />

          <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:items-center lg:py-24">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium shadow-inner">
                <Code2 className="h-3.5 w-3.5 text-[#d6a84b]" /> iCademia Embed v1
              </span>
              <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold tracking-tight sm:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                Put result checking directly on your school website.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-white/65">
                Students stay inside the school’s familiar website while iCademia securely handles
                PIN verification, result retrieval and ongoing widget updates.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-[#d6a84b] text-[#07111f] transition-transform hover:scale-105 hover:bg-[#e3bc66] sm:w-auto"
                >
                  <a href="#quick-start">Start embedding</a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full border-white/20 bg-white/5 text-white transition-transform hover:scale-105 hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  <Link to="/register-school">Request a School Registry ID</Link>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/30 to-accent/30 blur-2xl opacity-60" />
              <div className="relative rounded-3xl border border-white/10 bg-white/5 p-3 shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
                <div className="flex items-center gap-1.5 px-2 py-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  <span className="ml-3 font-mono text-[10px] text-white/35">
                    yourschool.edu.ng/results
                  </span>
                </div>
                <iframe
                  src="/widget/result-checker?school=ICA-SCH-PREVIEW&colour=%23D6A84B&compact=true"
                  title="iCademia widget preview"
                  className="h-[34rem] w-full rounded-2xl border-0 bg-white shadow-inner"
                />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/35">
          <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {[
              [ShieldCheck, "Secure isolation", "Credentials never enter the school website."],
              [Palette, "School branded", "Match colour and verified school identity."],
              [Globe2, "Framework neutral", "Works anywhere a secure iframe is allowed."],
              [TerminalSquare, "Maintained centrally", "Improvements arrive without code changes."],
            ].map(([Icon, title, body], i) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                key={title as string}
                className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 cursor-default"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="mt-4 font-display font-semibold transition-colors group-hover:text-primary">
                  {title as string}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{body as string}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          id="quick-start"
          className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6"
        >
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                Quick start
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                One secure embed, any website stack.
              </h2>
              <ol className="mt-7 space-y-5">
                {[
                  "Register and verify the school on iCademia.",
                  "Send us the production website domains for allowlisting.",
                  "Copy the School Registry ID from the administrator dashboard.",
                  "Choose the school colour and paste the relevant example.",
                  "Test with an issued card before publishing the page.",
                ].map((step, index) => (
                  <li
                    key={step}
                    className="flex gap-3 text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <Card className="overflow-hidden border-border shadow-2xl ring-1 ring-primary/5 hover:ring-primary/20 transition-shadow">
              <div className="flex flex-wrap gap-1 border-b border-border bg-muted/40 p-3">
                {examples.map((example) => (
                  <button
                    key={example.name}
                    onClick={() => setSelected(example.name)}
                    className={`relative rounded-lg px-3 py-2 text-xs font-semibold transition z-10 ${
                      selected === example.name
                        ? "text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    {selected === example.name && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary rounded-lg -z-10 shadow-md"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    {example.name}
                  </button>
                ))}
              </div>
              <CodeBlock code={active.code} />
            </Card>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="border-y border-border bg-muted/35"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-primary">
                What we need from the school
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold">
                A short activation checklist.
              </h2>
              <div className="mt-7 grid gap-3">
                {[
                  "Verified school administrator and official school email",
                  "Production and staging website domain names",
                  "School logo, display name and primary brand colour",
                  "Technical contact responsible for the website",
                  "Privacy-policy and student-data contact",
                  "Expected student volume and desired launch date",
                ].map((item) => (
                  <p
                    key={item}
                    className="flex gap-3 text-sm text-muted-foreground p-2 rounded-lg transition-colors hover:bg-primary/5 hover:text-foreground"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {item}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-[#07111f] p-7 text-white shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-10 bg-gradient-to-bl from-accent/20 to-transparent rounded-bl-full opacity-50 group-hover:opacity-100 transition-opacity" />
              <LockKeyhole className="h-7 w-7 text-[#d6a84b] relative z-10" />
              <h2 className="mt-5 font-display text-2xl font-semibold">Security boundaries</h2>
              <div className="mt-6 space-y-5 text-sm leading-6 text-white/65">
                <p>
                  The school website never receives PIN values, passwords or raw result data. The
                  embedded checker remains on the iCademia origin.
                </p>
                <p>
                  Production embeds can be restricted to approved domains. Result requests remain
                  rate-limited, audited and protected by the PIN plus registration number.
                </p>
                <p>
                  Never place database credentials or private API keys in browser code. Schools
                  needing server-to-server access must complete a separate integration review.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6"
        >
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Technical Reference
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold">Widget Parameters API</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-6">
              The iCademia result checker widget is controlled entirely via URL query parameters
              passed to the iframe src. No complex API keys or server-side tokens are required for
              standard integration.
            </p>
          </div>
          <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-muted-foreground">
                <thead className="border-b border-border bg-muted/40 text-foreground">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Parameter</th>
                    <th className="px-6 py-4 font-semibold">Type</th>
                    <th className="px-6 py-4 font-semibold">Required</th>
                    <th className="px-6 py-4 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="transition-colors hover:bg-muted/20">
                    <td className="px-6 py-4 font-mono text-primary font-medium">school</td>
                    <td className="px-6 py-4 font-mono text-xs">string</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-destructive">
                        Required
                      </span>
                    </td>
                    <td className="px-6 py-4 leading-relaxed">
                      Your unique School Registry ID (for example, <code>ICA-SCH-SDM-OWE</code>). It
                      determines the logo and school name displayed.
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-muted/20">
                    <td className="px-6 py-4 font-mono text-primary font-medium">colour</td>
                    <td className="px-6 py-4 font-mono text-xs">hex string</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Optional
                      </span>
                    </td>
                    <td className="px-6 py-4 leading-relaxed">
                      A six-digit hex color code (e.g., <code>%233730A3</code>). Overrides the
                      default brand color for the widget's primary buttons and accents.
                    </td>
                  </tr>
                  <tr className="transition-colors hover:bg-muted/20">
                    <td className="px-6 py-4 font-mono text-primary font-medium">compact</td>
                    <td className="px-6 py-4 font-mono text-xs">boolean</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        Optional
                      </span>
                    </td>
                    <td className="px-6 py-4 leading-relaxed">
                      Set to <code>true</code> to render a tighter vertical UI layout. Ideal for
                      mobile or highly constrained website containers.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6"
        >
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              Developer FAQ
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              Integration questions, answered.
            </h2>
          </div>
          <Accordion
            type="single"
            collapsible
            className="mt-10 rounded-2xl border border-border px-6 bg-card shadow-sm"
          >
            {developerFaqs.map(([question, answer], index) => (
              <AccordionItem key={question} value={`developer-${index}`}>
                <AccordionTrigger className="text-left font-medium hover:text-primary transition-colors">
                  {question}
                </AccordionTrigger>
                <AccordionContent className="leading-6 text-muted-foreground">
                  {answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <Card className="relative mt-10 flex flex-col items-start justify-between gap-5 border-primary/20 bg-primary/5 p-7 sm:flex-row sm:items-center overflow-hidden hover:bg-primary/10 transition-colors">
            <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary/10 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <p className="font-display text-xl font-semibold text-foreground">
                Need a reviewed integration?
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Send your domain, School Registry ID and technology stack to the iCademia
                integration team.
              </p>
            </div>
            <Button
              asChild
              className="relative z-10 w-full shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-primary/25 sm:w-auto"
            >
              <a href="mailto:support@icademia.app?subject=iCademia%20widget%20integration">
                Contact integrations <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </Card>
        </motion.section>
      </main>
      <SiteFooter />
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="relative bg-[#07111f] p-5 text-white">
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={copy}
        className="absolute right-4 top-4 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
      >
        {copied ? (
          <Check className="mr-2 h-3.5 w-3.5" />
        ) : (
          <Clipboard className="mr-2 h-3.5 w-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </Button>
      <pre className="max-h-[34rem] overflow-auto pt-12 text-xs leading-6 text-sky-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
