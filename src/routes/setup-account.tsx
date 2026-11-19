import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { BrandLink } from "@/components/brand-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { acceptSchoolAdminInviteDb, getSchoolAdminInviteDb } from "@/lib/api/db.functions";

export const Route = createFileRoute("/setup-account")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({ meta: [{ title: "Set up your school administrator account — iCademia" }] }),
  component: SetupAccountPage,
});

type InviteDetails = { school_name: string; admin_name: string; admin_email: string };

function SetupAccountPage() {
  const { token } = Route.useSearch();
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [checking, setChecking] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setInvalid(true);
      setChecking(false);
      return;
    }
    getSchoolAdminInviteDb({ data: { token } })
      .then((details) => setInvite(details as InviteDetails))
      .catch(() => setInvalid(true))
      .finally(() => setChecking(false));
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    try {
      const result = await acceptSchoolAdminInviteDb({
        data: { token, password, confirmPassword: confirmation },
      });
      setInvite((current) =>
        current ? { ...current, admin_name: result.adminName } : current,
      );
      setDone(true);
    } catch (error) {
      toast.error("Account setup could not be completed", {
        description: error instanceof Error ? error.message : "Ask iCademia to send a fresh link.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f7fb] p-4">
      <div className="absolute inset-x-0 top-0 h-48 bg-[#071a2e]" />
      <Card className="relative w-full max-w-md border-white/80 p-7 shadow-[0_24px_70px_-28px_rgba(7,26,46,0.35)] sm:p-8">
        <BrandLink compact className="mb-8 justify-center" />
        {checking ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Checking your secure setup link…</p>
          </div>
        ) : done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Your account is ready</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {invite?.school_name} is ready to use. Sign in with your email and the password you just created.
            </p>
            <Button asChild className="mt-7 w-full">
              <Link to="/login">Sign in to iCademia</Link>
            </Button>
          </div>
        ) : invalid || !invite ? (
          <div className="text-center">
            <KeyRound className="mx-auto h-8 w-8 text-amber-600" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Setup link unavailable</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This link may have expired or already been used. Contact the iCademia team to request a new one.
            </p>
            <Button asChild variant="outline" className="mt-7 w-full">
              <Link to="/">Return to iCademia</Link>
            </Button>
          </div>
        ) : (
          <>
            <KeyRound className="h-7 w-7 text-primary" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Set up your account</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              iCademia has prepared an administrator account for {invite.school_name}. Create a password to take control of the workspace.
            </p>
            <div className="mt-5 rounded-xl bg-muted/50 p-4 text-sm">
              <p className="font-semibold">{invite.admin_name}</p>
              <p className="mt-1 text-muted-foreground">{invite.admin_email}</p>
            </div>
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label htmlFor="setup-password">Create password</Label>
                <div className="relative">
                  <Input
                    id="setup-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="setup-confirm-password">Confirm password</Label>
                <div className="relative">
                  <Input
                    id="setup-confirm-password"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    minLength={8}
                    placeholder="Type it again"
                    value={confirmation}
                    onChange={(event) => setConfirmation(event.target.value)}
                    className="mt-2 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((visible) => !visible)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirm ? "Hide confirmation" : "Show confirmation"}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" disabled={saving} className="w-full" size="lg">
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {saving ? "Creating your account…" : "Create my password"}
              </Button>
            </form>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              This secure setup link can only be used once and expires after 72 hours.
            </p>
          </>
        )}
      </Card>
    </main>
  );
}
