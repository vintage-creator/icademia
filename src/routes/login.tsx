import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BrandLink } from "@/components/brand-link";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — iCademia" }] }),
  component: LoginPage,
});

import { setSchoolCode } from "@/lib/utils";
import { authenticateSchoolAdminDb } from "@/lib/api/db.functions";
import { toast } from "sonner";

function getSignInErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  const trimmed = message.trim();

  if (!trimmed) return "Please check your details and try again.";
  if (
    trimmed.startsWith("<!doctype") ||
    trimmed.includes("This page didn't load") ||
    trimmed.includes("<html")
  ) {
    return "The sign-in service returned an application error. Restart the dev server and confirm DATABASE_URL is reachable.";
  }

  if (trimmed.includes("getaddrinfo") || trimmed.includes("ENOTFOUND")) {
    return "The app server cannot reach the database. Check your internet connection and DATABASE_URL.";
  }

  return trimmed;
}

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [schoolCode, setLocalSchoolCode] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authenticateSchoolAdminDb({
        data: { schoolCode: schoolCode.trim().toUpperCase(), email, password },
      });
      setSchoolCode(result.schoolCode);
      await navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error("Sign in failed", {
        description: getSignInErrorMessage(error),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#f4f7fb] lg:grid-cols-[1.05fr_0.95fr]">
      <div className="relative hidden overflow-hidden bg-[#071a2e] lg:block">
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
        <div className="absolute -bottom-28 left-14 h-80 w-80 rounded-full bg-[#d6a84b]/15 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12 text-primary-foreground">
          <BrandLink inverse />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#e0bd6a]">
              Your school operations workspace
            </p>
            <h2 className="mt-5 max-w-xl font-display text-5xl font-semibold leading-[1.08] text-white">
              One secure place for every academic record.
            </h2>
            <p className="mt-5 max-w-lg text-lg leading-8 text-white/65">
              Coordinate teachers, verify result readiness, publish professional reports and keep a
              continuous academic history for every learner.
            </p>
            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              {[
                "School-scoped access",
                "Review before publishing",
                "Branded result sheets",
                "Traceable records",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle2 className="h-4 w-4 text-[#e0bd6a]" /> {item}
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-white/50">© {new Date().getFullYear()} iCademia</p>
        </div>
      </div>

      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <Link
          to="/"
          className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>
        <Card className="w-full max-w-md border-white/80 bg-white p-7 shadow-[0_24px_70px_-28px_rgba(7,26,46,0.35)] sm:p-9">
          <BrandLink compact className="mb-8 lg:hidden" />
          <h1 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">
            Sign in with the code issued to your school and your administrator credentials.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="school-code">School Code</Label>
              <Input
                id="school-code"
                type="text"
                placeholder="ICA-SCH-XXXXX"
                className="mt-2 font-mono uppercase"
                value={schoolCode}
                onChange={(e) => setLocalSchoolCode(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="admin@school.edu.ng"
                className="mt-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  className="text-xs font-medium text-primary hover:underline"
                  to="/forgot-password"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="mt-2 pr-10"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground mt-1"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground shadow-elegant"
              size="lg"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Enter your school's unique code to view and manage its data.
          </p>
          <div className="mt-5 flex justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
