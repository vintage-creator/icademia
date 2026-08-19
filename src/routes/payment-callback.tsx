import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, Loader2, AlertCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { verifyScratchCardCheckout } from "@/lib/api/nomba.functions";
import { BrandLink } from "@/components/brand-link";
import { buildWhatsAppEscalationUrl } from "@/lib/whatsapp";

export const Route = createFileRoute("/payment-callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    orderReference: typeof search.orderReference === "string" ? search.orderReference : "",
  }),
  component: PaymentCallback,
});

function PaymentCallback() {
  const { orderReference } = Route.useSearch();
  const [status, setStatus] = useState<
    "VERIFYING" | "SUCCESS" | "PENDING" | "CONFIGURATION_REQUIRED" | "VERIFICATION_FAILED"
  >(orderReference ? "VERIFYING" : "PENDING");

  useEffect(() => {
    if (!orderReference) return;
    verifyScratchCardCheckout({ data: { orderReference } })
      .then((result) => setStatus(result.status))
      .catch(() => setStatus("VERIFICATION_FAILED"));
  }, [orderReference]);

  const verified = status === "SUCCESS";
  const whatsappUrl = buildWhatsAppEscalationUrl({
    schoolName: "Partner School",
    orderRef: orderReference,
    reason: status === "VERIFICATION_FAILED" ? "Payment verification failed or cancelled" : "Payment pending server verification",
  });

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f4f7fb] p-4">
      <div className="absolute inset-x-0 top-0 h-48 bg-[#071a2e]" />
      <Card className="relative w-full max-w-lg border-white/80 p-8 text-center shadow-[0_24px_70px_-28px_rgba(7,26,46,0.35)]">
        <BrandLink compact className="mb-8 justify-center" />
        <span
          className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${verified ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}`}
        >
          {status === "VERIFYING" ? (
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          ) : verified ? (
            <CheckCircle2 className="h-7 w-7" />
          ) : (
            <AlertCircle className="h-7 w-7" />
          )}
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold">
          {verified
            ? "Payment Verified"
            : status === "VERIFYING"
              ? "Verifying Payment…"
              : "Payment Under Review"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {verified
            ? "Your payment is confirmed. Unique school-scoped PINs have been created and your branded physical batch is now being prepared for delivery in 5–12 working days."
            : "Your order has returned to iCademia for verification. If your payment failed or suffered an error, you can escalate directly to our team via WhatsApp."}
        </p>

        {orderReference ? (
          <p className="mt-5 rounded-lg bg-muted px-4 py-3 font-mono text-xs">{orderReference}</p>
        ) : null}

        {!verified && status !== "VERIFYING" && (
          <div className="mt-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-2">
            <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <MessageCircle className="h-4 w-4" /> Gateway Failure or Payment Error?
            </p>
            <p className="text-xs text-muted-foreground">
              If your bank card was debited or you suffered a payment gateway error, escalate your order reference to our support team on WhatsApp for immediate manual processing.
            </p>
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="block pt-1">
              <Button size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs gap-2 shadow-sm">
                <MessageCircle className="h-4 w-4" /> Escalate Order via WhatsApp
              </Button>
            </a>
          </div>
        )}

        <p className="mt-5 inline-flex items-center gap-2 text-xs text-muted-foreground">
          <Clock3 className="h-4 w-4" /> Verification normally completes within a few moments.
        </p>

        <Button asChild variant="outline" className="mt-6 w-full text-xs">
          <Link to="/dashboard/pins">Return to scratch-card orders</Link>
        </Button>
      </Card>
    </main>
  );
}
