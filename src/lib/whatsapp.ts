export const WHATSAPP_SUPPORT_NUMBER = "2347065737817";
export const WHATSAPP_SUPPORT_DISPLAY_NUMBER = "07065737817";

type TransferRequest = {
  schoolName: string;
  orderRef: string;
  amountNgn: number;
  kind: string;
  quantity: number;
  contactEmail?: string;
};

export function buildTransferDetailsRequestUrl(params: TransferRequest) {
  const text = [
    "Hello iCademia, please send me the bank account details for this scratch-card order.",
    "",
    `School: ${params.schoolName}`,
    `Order reference: ${params.orderRef}`,
    `Order: ${params.quantity.toLocaleString()} ${params.kind}`,
    `Amount: ₦${params.amountNgn.toLocaleString()}`,
    params.contactEmail ? `School email: ${params.contactEmail}` : "",
    "",
    "I will make the transfer and send the receipt here. Please confirm as soon as it is received.",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function buildTransferProofUrl(params: TransferRequest) {
  const text = [
    "Hello iCademia, I have transferred payment for this scratch-card order. I am sending the transfer receipt here.",
    "",
    `School: ${params.schoolName}`,
    `Order reference: ${params.orderRef}`,
    `Order: ${params.quantity.toLocaleString()} ${params.kind}`,
    `Amount: ₦${params.amountNgn.toLocaleString()}`,
    params.contactEmail ? `School email: ${params.contactEmail}` : "",
    "",
    "Please confirm receipt and update the order when you can.",
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppEscalationUrl(params: {
  schoolName: string;
  orderRef?: string;
  amountNgn?: number;
  kind?: string;
  reason?: string;
  contactEmail?: string;
}) {
  const text = [
    `*iCademia Order Support Request*`,
    ``,
    `Hello iCademia Team, I need help with a school card order.`,
    ``,
    `*School Name:* ${params.schoolName || "Partner School"}`,
    `*Order Reference:* ${params.orderRef || "Pending Order"}`,
    `*Order Type:* ${params.kind || "Annual Scratch Cards"}`,
    params.amountNgn ? `*Amount:* ₦${params.amountNgn.toLocaleString()}` : "",
    params.contactEmail ? `*Billing Email:* ${params.contactEmail}` : "",
    params.reason ? `*Message:* ${params.reason}` : "",
    ``,
    `Please help me with this order. Thank you.`,
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${WHATSAPP_SUPPORT_NUMBER}?text=${encodeURIComponent(text)}`;
}
