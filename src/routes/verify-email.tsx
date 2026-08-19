import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { verifySchoolEmailDb } from "@/lib/api/db.functions";
import { BrandLink } from "@/components/brand-link";

export const Route = createFileRoute("/verify-email")({
  validateSearch: (search: Record<string, unknown>) => ({
    token: typeof search.token === "string" ? search.token : "",
  }),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("The verification token is missing.");
      return;
    }
    verifySchoolEmailDb({ data: { token } })
      .then(() => setStatus("success"))
      .catch((error) => {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Verification failed.");
      });
  }, [token]);
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f7fb] p-4">
      <div className="absolute inset-x-0 top-0 h-48 bg-[#071a2e]" />
      <Card className="relative w-full max-w-md border-white/80 p-8 text-center shadow-[0_24px_70px_-28px_rgba(7,26,46,0.35)]">
        <BrandLink compact className="mb-8 justify-center" />
        <span
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${status === "success" ? "bg-success/10 text-success" : "bg-primary/10 text-primary"}`}
        >
          {status === "loading" ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : status === "success" ? (
            <CheckCircle2 className="h-7 w-7" />
          ) : (
            <MailWarning className="h-7 w-7" />
          )}
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">
          {status === "loading"
            ? "Verifying email…"
            : status === "success"
              ? "Administrator email verified"
              : "Verification unsuccessful"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {status === "success"
            ? "Your school can now continue onboarding staff and publishing academic records."
            : message}
        </p>
        <Button asChild className="mt-6 w-full">
          <Link to="/login">Continue to sign in</Link>
        </Button>
      </Card>
    </main>
  );
}
