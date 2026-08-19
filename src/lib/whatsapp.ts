export const WHATSAPP_SUPPORT_NUMBER = "2348123456789";

export function buildWhatsAppEscalationUrl(params: {
  schoolName: string;
  orderRef?: string;
  amountNgn?: number;
  kind?: string;
  reason?: string;
  contactEmail?: string;
}) {
  const text = [
    `*iCademia Order Escalation & Support Request* 🚀`,
    ``,
    `Hello iCademia Team, my payment failed or encountered an issue during checkout.`,
    ``,
    `*School Name:* ${params.schoolName || "Partner School"}`,
    `*Order Reference:* ${params.orderRef || "Pending Order"}`,
    `*Order Type:* ${params.kind || "Annual Scratch Cards"}`,
    params.amountNgn ? `*Amount:* ₦${params.amountNgn.toLocaleString()}` : "",
    params.contactEmail ? `*Billing Email:* ${params.contactEmail}` : "",
    params.reason ? `*Payment Error:* ${params.reason}` : "",
    ``,
    `Please help verify and escalate our order for manual processing. Thank you!`,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(text)}`;
}
