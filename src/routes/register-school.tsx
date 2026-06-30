import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, CheckCircle2, Loader2, ShieldCheck, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/register-school")({
  head: () => ({
    meta: [
      { title: "Register your school — iCademia" },
      { name: "description", content: "Join iCademia as a partner school. Onboard your administrators, teachers and students into a secure academic platform." },
      { property: "og:title", content: "Become an iCademia Partner School" },
      { property: "og:description", content: "Onboarding for primary, secondary and tertiary institutions." },
    ],
  }),
  component: RegisterSchool,
});

function RegisterSchool() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ schoolCode: string } | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const code = "ICA-SCH-" + Math.random().toString(36).slice(2, 7).toUpperCase();
      setDone({ schoolCode: code });
      setLoading(false);
      toast.success("School registered", { description: `Your unique school code is ${code}.` });
    }, 900);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 py-14 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Partner programme
            </span>
            <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl">Bring your school onto iCademia.</h1>
            <p className="mt-4 text-muted-foreground">
              Train a child, build a nation. We partner with primary, secondary and tertiary institutions to deliver secure results, run competitions, and celebrate excellence.
            </p>
            <ul className="mt-8 space-y-4 text-sm">
              <Bullet icon={ShieldCheck}>Bank-grade security on every result and PIN.</Bullet>
              <Bullet icon={Users}>Onboard administrators, head teachers, form teachers and exam officers — each with their own dashboard.</Bullet>
              <Bullet icon={Building2}>Branded school portal at <span className="font-mono text-foreground">your-school.icademia.app</span>.</Bullet>
            </ul>
          </div>

          {done ? (
            <Card className="border-border p-8 shadow-elegant ring-1 ring-success/30">
              <div className="grid h-14 w-14 place-items-center rounded-xl bg-success/15 text-success">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">Welcome to iCademia.</h2>
              <p className="mt-2 text-muted-foreground">Your school is now a registered partner. Save your unique school code — your administrator will use it when adding teachers.</p>
              <div className="mt-6 rounded-xl bg-muted p-5 text-center">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Your school code</p>
                <p className="mt-2 font-mono text-2xl font-bold text-primary">{done.schoolCode}</p>
              </div>
              <div className="mt-6 flex gap-2">
                <Button asChild className="gradient-primary text-primary-foreground shadow-elegant">
                  <a href="/login">Sign in as administrator</a>
                </Button>
                <Button variant="outline" onClick={() => setDone(null)}>Register another</Button>
              </div>
            </Card>
          ) : (
            <Card className="border-border p-8 shadow-card">
              <h2 className="font-display text-xl font-bold">Tell us about your school</h2>
              <p className="mt-1 text-sm text-muted-foreground">Your administrator account is created on submit. Teachers are added from inside the dashboard.</p>
              <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="School name" placeholder="Brightfield Comprehensive School" required />
                <div>
                  <Label>School type</Label>
                  <Select defaultValue="secondary">
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="college">College / Tertiary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Field label="School motto" placeholder="Knowledge · Integrity · Service" />
                <Field label="City / State" placeholder="Lagos, Nigeria" required />
                <Field label="Admin full name" placeholder="Amaka Okafor" required className="sm:col-span-1" />
                <Field label="Admin email" type="email" placeholder="admin@yourschool.edu" required />
                <Field label="Admin phone" placeholder="+234 800 000 0000" />
                <div>
                  <Label>Approximate student count</Label>
                  <Select defaultValue="500-1000">
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<200">Under 200</SelectItem>
                      <SelectItem value="200-500">200 – 500</SelectItem>
                      <SelectItem value="500-1000">500 – 1,000</SelectItem>
                      <SelectItem value=">1000">Over 1,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="sm:col-span-2">
                  <Label>Anything else we should know?</Label>
                  <Textarea className="mt-2" placeholder="Tell us about your current result process, exam season, or any specific needs…" rows={3} />
                </div>
                <Button type="submit" disabled={loading} size="lg" className="sm:col-span-2 gradient-primary text-primary-foreground shadow-elegant">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Creating your school portal…" : "Register school"}
                </Button>
              </form>
            </Card>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, type = "text", placeholder, required, className }: { label: string; type?: string; placeholder?: string; required?: boolean; className?: string }) {
  return (
    <div className={className}>
      <Label>{label}</Label>
      <Input type={type} placeholder={placeholder} required={required} className="mt-2" />
    </div>
  );
}

function Bullet({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Icon className="h-4 w-4" /></span>
      <p className="text-foreground/80">{children}</p>
    </li>
  );
}
