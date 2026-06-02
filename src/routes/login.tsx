import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — ScholarGrade" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => navigate({ to: "/dashboard" }), 600);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden gradient-academic lg:block">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 backdrop-blur">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="font-display text-lg font-semibold">ScholarGrade</span>
          </Link>
          <div>
            <h2 className="font-display text-4xl font-semibold leading-tight">
              The trusted home for your school's results.
            </h2>
            <p className="mt-4 max-w-md text-white/70">
              Admins, teachers, and exam officers — sign in to manage students, post scores, and issue PIN batches.
            </p>
          </div>
          <p className="text-xs text-white/50">© {new Date().getFullYear()} ScholarGrade</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-border p-8 shadow-card">
          <div className="lg:hidden">
            <Link to="/" className="mb-6 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg gradient-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="font-display text-lg font-semibold">ScholarGrade</span>
            </Link>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your staff account.</p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@school.edu" className="mt-2" defaultValue="admin@brightfield.edu" required />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a className="text-xs text-muted-foreground hover:text-foreground" href="#">Forgot?</a>
              </div>
              <Input id="password" type="password" className="mt-2" defaultValue="••••••••" required />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground shadow-elegant" size="lg">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            This is a demo. Click sign in to enter the dashboard.
          </p>
        </Card>
      </div>
    </div>
  );
}
