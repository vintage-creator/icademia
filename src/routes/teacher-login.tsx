import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { GraduationCap, Eye, EyeOff, Loader2, KeyRound, UserCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { teacherLoginDb, teacherSetPasswordDb } from "@/lib/api/db.functions";

export const Route = createFileRoute("/teacher-login")({
  head: () => ({ meta: [{ title: "Teacher Portal Login — iCademia" }] }),
  component: TeacherLoginPage,
});

type Tab = "signin" | "setup";

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
      const res = await teacherLoginDb({ data: { staffId: signIn.staffId.trim().toUpperCase(), password: signIn.password } });
      localStorage.setItem("teacher_token", res.token);
      localStorage.setItem("teacher_profile", JSON.stringify(res.teacher));
      toast.success(`Welcome back, ${res.teacher.name.split(" ")[0]}!`);
      navigate({ to: "/teacher" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed.");
    } finally { setSigningIn(false); }
  };

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setup.password !== setup.confirm) { toast.error("Passwords do not match."); return; }
    if (setup.password.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    setSettingUp(true);
    try {
      const res = await teacherSetPasswordDb({ data: { staffId: setup.staffId.trim().toUpperCase(), password: setup.password } });
      toast.success(`Account ready, ${res.name}! Please sign in.`, { duration: 4000 });
      setTab("signin");
      setSignIn(p => ({ ...p, staffId: setup.staffId.trim().toUpperCase() }));
      setSetup({ staffId: "", password: "", confirm: "" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Setup failed.");
    } finally { setSettingUp(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left decorative panel */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 45%, #4338ca 75%, #6366f1 100%)" }}
      >
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #a5b4fc, transparent)" }} />
        <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />

        <div className="relative z-10 flex flex-col h-full p-12 justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">iCademia</span>
          </div>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Teacher Portal
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
              Your classroom,<br />
              <span className="text-indigo-300">beautifully organised.</span>
            </h1>
            <p className="mt-4 text-white/60 text-lg leading-relaxed">
              Access your classes, timetable, and student results — all in one beautiful place.
            </p>
            <div className="mt-8 flex flex-wrap gap-2">
              {["My Classes", "Student Results", "My Timetable", "Profile"].map((f) => (
                <span key={f} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/70">{f}</span>
              ))}
            </div>
          </div>

          <p className="text-white/30 text-xs">© {new Date().getFullYear()} iCademia · School Management Platform</p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">iCademia</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight">Teacher Portal</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "signin" ? "Sign in with your staff ID and password." : "First time? Create your account password below."}
          </p>

          {/* Tab switcher */}
          <div className="mt-6 flex rounded-xl border border-border overflow-hidden">
            {(["signin", "setup"] as Tab[]).map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${tab === t ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
                {t === "signin" ? <><UserCheck className="h-4 w-4" /> Sign In</> : <><KeyRound className="h-4 w-4" /> First Time?</>}
              </button>
            ))}
          </div>

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="tid">Staff ID</Label>
                <Input id="tid" className="mt-2 font-mono tracking-widest uppercase" placeholder="ICA-TCH-XXXXXXXX"
                  value={signIn.staffId} onChange={(e) => setSignIn((p) => ({ ...p, staffId: e.target.value }))} required />
                <p className="mt-1 text-[11px] text-muted-foreground">Your staff ID was sent in your invite email.</p>
              </div>
              <div>
                <Label htmlFor="tpw">Password</Label>
                <div className="relative mt-2">
                  <Input id="tpw" type={showPw ? "text" : "password"} className="pr-10"
                    value={signIn.password} onChange={(e) => setSignIn((p) => ({ ...p, password: e.target.value }))} required />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={signingIn} className="w-full gradient-primary text-primary-foreground shadow-elegant gap-2 mt-2">
                {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                {signingIn ? "Signing in…" : "Sign in to Teacher Portal"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSetup} className="mt-6 space-y-4">
              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 text-xs text-muted-foreground leading-relaxed">
                Enter your <strong className="text-foreground">Staff ID</strong> from your invite email, then create a password to activate your account.
              </div>
              <div>
                <Label htmlFor="sid">Staff ID</Label>
                <Input id="sid" className="mt-2 font-mono tracking-widest uppercase" placeholder="ICA-TCH-XXXXXXXX"
                  value={setup.staffId} onChange={(e) => setSetup((p) => ({ ...p, staffId: e.target.value }))} required />
              </div>
              <div>
                <Label htmlFor="spw">Create password <span className="text-muted-foreground font-normal">(min. 8 characters)</span></Label>
                <div className="relative mt-2">
                  <Input id="spw" type={showSetupPw ? "text" : "password"} className="pr-10" minLength={8}
                    value={setup.password} onChange={(e) => setSetup((p) => ({ ...p, password: e.target.value }))} required />
                  <button type="button" onClick={() => setShowSetupPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showSetupPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="scf">Confirm password</Label>
                <div className="relative mt-2">
                  <Input id="scf" type={showConfirmPw ? "text" : "password"} className="pr-10"
                    value={setup.confirm} onChange={(e) => setSetup((p) => ({ ...p, confirm: e.target.value }))} required />
                  <button type="button" onClick={() => setShowConfirmPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={settingUp} className="w-full gradient-primary text-primary-foreground shadow-elegant gap-2 mt-2">
                {settingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                {settingUp ? "Setting up…" : "Create My Account"}
              </Button>
            </form>
          )}

          <p className="mt-8 text-center text-xs text-muted-foreground">
            School administrator?{" "}
            <a href="/login" className="text-primary hover:underline font-medium">Admin login →</a>
          </p>
        </div>
      </div>
    </div>
  );
}
