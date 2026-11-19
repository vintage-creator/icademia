import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { BrandLink } from "@/components/brand-link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestSchoolPasswordResetDb } from "@/lib/api/db.functions";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — iCademia" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await requestSchoolPasswordResetDb({
        data: { email: email.trim() },
      });
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f7fb] p-4">
      <div className="absolute inset-x-0 top-0 h-48 bg-[#071a2e]" />
      <Link
        to="/login"
        className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 text-sm text-white/70 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sign in
      </Link>
      <Card className="relative w-full max-w-md border-white/80 p-8 shadow-[0_24px_70px_-28px_rgba(7,26,46,0.35)]">
        <BrandLink compact className="mb-8 justify-center" />
        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Check your email</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              If those details match a school administrator account, we sent a one-hour password
              reset link. Check spam or junk folders too.
            </p>
            <Button asChild className="mt-7 w-full">
              <Link to="/login">Return to sign in</Link>
            </Button>
          </div>
        ) : (
          <>
            <Mail className="h-7 w-7 text-primary" />
            <h1 className="mt-5 font-display text-2xl font-semibold">Reset your password</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Enter the administrator email used during onboarding.
            </p>
            <form onSubmit={submit} className="mt-7 space-y-4">
              <div>
                <Label htmlFor="reset-email">Administrator email</Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@yourschool.edu"
                  className="mt-2"
                  required
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full" size="lg">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "Sending link…" : "Send reset link"}
              </Button>
            </form>
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
