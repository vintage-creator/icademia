import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BrandLink } from "@/components/brand-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetSchoolPasswordDb } from "@/lib/api/db.functions";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  head: () => ({ meta: [{ title: "Choose a new password — iCademia" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirmation) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await resetSchoolPasswordDb({
        data: { token, password, confirmPassword: confirmation },
      });
      setDone(true);
    } catch (error) {
      toast.error("Password could not be reset", {
        description: error instanceof Error ? error.message : "Request a new reset link.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f7fb] p-4">
      <div className="absolute inset-x-0 top-0 h-48 bg-[#071a2e]" />
      <Card className="relative w-full max-w-md border-white/80 p-8 shadow-[0_24px_70px_-28px_rgba(7,26,46,0.35)]">
        <BrandLink compact className="mb-8 justify-center" />
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Password updated</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Your previous password no longer works. You can now sign in with the new one.
            </p>
            <Button asChild className="mt-7 w-full">
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <KeyRound className="h-7 w-7 text-primary" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Choose a new password</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Use at least eight characters and avoid passwords used on other services.
            </p>
            {!token ? (
              <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm">
                This reset link is incomplete.{" "}
                <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
                  Request a new link
                </Link>
                .
              </div>
            ) : (
              <form onSubmit={submit} className="mt-7 space-y-4">
                <div>
                  <Label htmlFor="new-password">New password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
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
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground mt-1"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      minLength={8}
                      placeholder="Confirm your password"
                      value={confirmation}
                      onChange={(event) => setConfirmation(event.target.value)}
                      className="mt-2 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground mt-1"
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full" size="lg">
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? "Updating password…" : "Update password"}
                </Button>
              </form>
            )}
          </>
        )}
        <div className="mt-7 flex justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-foreground">
            Terms
          </Link>
        </div>
      </Card>
    </main>
  );
}
