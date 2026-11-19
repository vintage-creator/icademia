import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BrandLink } from "@/components/brand-link";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — iCademia" }] }),
  component: LoginPage,
});

import { setSchoolCode, touchLocalSession } from "@/lib/utils";
import { authenticateSchoolAdminDb } from "@/lib/api/db.functions";
import { toast } from "sonner";

function getSignInErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  const trimmed = message.trim();

  if (!trimmed) return "Please check your details and try again.";
  if (trimmed === "Invalid email or password.") {
    return "Invalid email or password. If your school has not yet been registered on iCademia, please complete school onboarding.";
  }
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authenticateSchoolAdminDb({
        data: { email, password },
      });
      setSchoolCode(result.schoolCode);
      localStorage.setItem("icademia_admin_token", result.token);
      touchLocalSession("admin");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("icademia:session-activity"));
        window.dispatchEvent(new Event("icademia:session-updated"));
      }
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
            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4 text-xs text-white/60">
              <Link to="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          <p className="text-xs text-white/50">© {new Date().getFullYear()} iCademia Technologies</p>
        </div>
      </div>

      <div className="relative flex flex-col justify-between min-h-screen p-6 sm:p-10">
        <div className="flex flex-1 items-center justify-center my-auto w-full">
          <Card className="w-full max-w-xl border-white/80 bg-white p-8 shadow-[0_24px_70px_-28px_rgba(7,26,46,0.35)] sm:p-10">
            <BrandLink compact className="mb-6 lg:hidden" />
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-2 text-xs sm:text-sm leading-6 text-muted-foreground">
              Sign in with your administrator email and password.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="email" className="text-xs sm:text-sm font-semibold">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@school.edu.ng"
                  className="mt-1.5 text-xs sm:text-sm h-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">Password</Label>
                  <Link
                    className="text-xs font-medium text-primary hover:underline"
                    to="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative mt-1.5">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="pr-10 text-xs sm:text-sm h-10"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground shadow-elegant text-xs sm:text-sm font-semibold py-5 mt-3"
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Signing in…" : "Sign in"}
              </Button>
            </form>

            {/* ── ONBOARDING CALLOUT FOR UNREGISTERED USERS ── */}
            <div className="mt-6 pt-5 border-t border-border/80 text-center space-y-2">
              <p className="text-xs text-muted-foreground">
                Haven't onboarded your school yet?
              </p>
              <Button asChild variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 border-primary/30 hover:bg-primary/5 text-primary">
                <Link to="/register-school">
                  Register & Onboard School Workspace →
                </Link>
              </Button>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 flex flex-col gap-2 text-center text-xs text-muted-foreground">
              <p>
                Are you a teacher or staff member?{" "}
                <Link to="/teacher-login" className="font-semibold text-primary hover:underline">
                  Teacher Login
                </Link>
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-border/70 flex justify-center gap-4 text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <span>·</span>
              <Link to="/terms" className="hover:text-foreground">
                Terms of Service
              </Link>
            </div>
          </Card>
        </div>

        {/* Mobile bottom credits */}
        <div className="pt-6 pb-2 text-center text-xs text-muted-foreground lg:hidden">
          © {new Date().getFullYear()} iCademia Technologies
        </div>
      </div>
    </div>
  );
}
