import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
  UserCheck,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BrandLink } from "@/components/brand-link";
import { teacherLoginDb, teacherSetPasswordDb } from "@/lib/api/db.functions";
import { touchLocalSession } from "@/lib/utils";

export const Route = createFileRoute("/teacher-login")({
  head: () => ({ meta: [{ title: "Head Teacher Portal — iCademia" }] }),
  component: TeacherLoginPage,
});

type Tab = "signin" | "activate";

function TeacherLoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("signin");
  const [signIn, setSignIn] = useState({ staffId: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [setup, setSetup] = useState({ staffId: "", password: "", confirm: "" });
  const [showSetupPw, setShowSetupPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [settingUp, setSettingUp] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSigningIn(true);
    try {
      const res = await teacherLoginDb({
        data: { staffId: signIn.staffId.trim().toUpperCase(), password: signIn.password },
      });
      localStorage.setItem("teacher_token", res.token);
      localStorage.setItem("teacher_profile", JSON.stringify(res.teacher));
      localStorage.setItem("icademia_school_code", res.teacher.schoolCode);
      touchLocalSession("teacher");
      toast.success(`Welcome back, ${res.teacher.name.split(" ")[0]}!`);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("icademia:session-activity"));
        window.dispatchEvent(new Event("icademia:session-updated"));
      }
      navigate({ to: "/teacher" });
    } catch (err) {
      toast.error("Sign in failed", {
        description:
          err instanceof Error ? err.message : "Please check your Staff ID and password.",
      });
    } finally {
      setSigningIn(false);
    }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setup.password !== setup.confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (setup.password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    setSettingUp(true);
    try {
      const res = await teacherSetPasswordDb({
        data: { staffId: setup.staffId.trim().toUpperCase(), password: setup.password },
      });
      toast.success(`Account ready, ${res.name}! Please sign in now with your new password.`, {
        duration: 5000,
      });
      setTab("signin");
      setSignIn((p) => ({ ...p, staffId: setup.staffId.trim().toUpperCase() }));
      setSetup({ staffId: "", password: "", confirm: "" });
    } catch (err) {
      toast.error("Account activation failed", {
        description:
          err instanceof Error
            ? err.message
            : "Please verify your Staff ID with your School Admin.",
      });
    } finally {
      setSettingUp(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-[#f4f7fb] lg:grid-cols-[1.05fr_0.95fr]">
      {/* ── LEFT BRANDING HERO PANEL ── */}
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
            <h2 className="max-w-xl font-display text-5xl font-semibold leading-[1.08] text-white">
              Empowering educators,
              <br />
              <span className="text-[#e0bd6a]">simplifying academics.</span>
            </h2>

            <p className="mt-5 max-w-lg text-lg leading-8 text-white/65">
              Record term scores, manage assignments, monitor class attendance and collaborate
              directly with school leadership.
            </p>

            <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
              {[
                "Instant Score Submissions",
                "Assignment Publishing",
                "Direct Staff Messaging",
                "Continuous Class Rosters",
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

          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} iCademia Technologies
          </p>
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="relative flex flex-col justify-between min-h-screen p-6 sm:p-10">
        {/* Center Modal Card with Expanded Width */}
        <div className="flex flex-1 items-center justify-center my-auto w-full">
          <Card className="w-full max-w-xl border-white/80 bg-white p-8 shadow-[0_24px_70px_-28px_rgba(7,26,46,0.35)] sm:p-10">
            <BrandLink compact className="mb-6 lg:hidden" />

            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                Head Teacher Portal
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {tab === "signin"
                  ? "Sign in with the Staff ID approved by your School Administrator."
                  : "Only staff granted Head Teacher access can activate a workspace account."}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-muted/60 p-1.5 border border-border">
              <button
                type="button"
                onClick={() => setTab("signin")}
                className={`rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  tab === "signin"
                    ? "bg-white text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Head Teacher Sign In
              </button>
              <button
                type="button"
                onClick={() => setTab("activate")}
                className={`rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-all ${
                  tab === "activate"
                    ? "bg-white text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                First-Time Setup
              </button>
            </div>

            {tab === "signin" ? (
              /* ── TAB 1: SIGN IN ── */
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="staffId" className="text-xs sm:text-sm font-semibold">
                    Staff ID / Teacher Code
                  </Label>
                  <Input
                    id="staffId"
                    placeholder="e.g. ICA-SDM-OWE-TCH-005"
                    className="mt-1.5 font-mono uppercase tracking-wider text-xs sm:text-sm h-10"
                    value={signIn.staffId}
                    onChange={(e) => setSignIn((p) => ({ ...p, staffId: e.target.value }))}
                    required
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Provided by your School Administrator upon onboarding.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs sm:text-sm font-semibold">
                      Password
                    </Label>
                    <button
                      type="button"
                      onClick={() => setTab("activate")}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Account not active?
                    </button>
                  </div>
                  <div className="relative mt-1.5">
                    <Input
                      id="password"
                      type={showPw ? "text" : "password"}
                      className="pr-10 text-xs sm:text-sm h-10"
                      placeholder="Enter your password"
                      value={signIn.password}
                      onChange={(e) => setSignIn((p) => ({ ...p, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="Toggle password visibility"
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={signingIn}
                  className="w-full gradient-primary text-primary-foreground shadow-elegant text-xs sm:text-sm font-semibold py-5 mt-3"
                  size="lg"
                >
                  {signingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {signingIn ? "Signing in…" : "Sign In to Head Teacher Portal"}
                </Button>
              </form>
            ) : (
              /* ── TAB 2: FIRST-TIME ACTIVATION ── */
              <form onSubmit={handleSetup} className="mt-6 space-y-4">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground leading-relaxed">
                  <div className="flex items-center gap-1.5 font-semibold text-primary mb-1">
                    <KeyRound className="h-3.5 w-3.5" /> First-Time Account Setup
                  </div>
                  Enter the Staff ID from your Head Teacher invitation, then create your password.
                  For a forgotten password, contact your School Administrator.
                </div>

                <div>
                  <Label htmlFor="setupStaffId" className="text-xs sm:text-sm font-semibold">
                    Assigned Staff ID
                  </Label>
                  <Input
                    id="setupStaffId"
                    placeholder="e.g. ICA-SDM-OWE-TCH-005"
                    className="mt-1.5 font-mono uppercase tracking-wider text-xs sm:text-sm h-10"
                    value={setup.staffId}
                    onChange={(e) => setSetup((p) => ({ ...p, staffId: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="setupPassword" className="text-xs sm:text-sm font-semibold">
                    New Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="setupPassword"
                      type={showSetupPw ? "text" : "password"}
                      className="pr-10 text-xs sm:text-sm h-10"
                      placeholder="At least 8 characters"
                      value={setup.password}
                      onChange={(e) => setSetup((p) => ({ ...p, password: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showSetupPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-xs sm:text-sm font-semibold">
                    Confirm New Password
                  </Label>
                  <div className="relative mt-1.5">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPw ? "text" : "password"}
                      className="pr-10 text-xs sm:text-sm h-10"
                      placeholder="Repeat password"
                      value={setup.confirm}
                      onChange={(e) => setSetup((p) => ({ ...p, confirm: e.target.value }))}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={settingUp}
                  className="w-full gradient-primary text-primary-foreground shadow-elegant text-xs sm:text-sm font-semibold py-5 mt-3 gap-1.5"
                  size="lg"
                >
                  {settingUp ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4" />
                  )}
                  {settingUp ? "Saving Password…" : "Save Password & Activate"}
                </Button>
              </form>
            )}

            {/* ── FOOTER ROUTING ── */}
            <div className="mt-6 pt-5 border-t border-border/80 text-center space-y-2 text-xs text-muted-foreground">
              <p>
                School Administrator?{" "}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Admin Sign In →
                </Link>
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-border/40 flex justify-center gap-4 text-xs text-muted-foreground">
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
