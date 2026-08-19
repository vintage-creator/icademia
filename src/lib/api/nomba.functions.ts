import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { sql, initDb } from "@/lib/db.server";
import { getAppOrigin } from "@/lib/utils";

const orderInput = z.object({
  quantity: z.number().int().min(1).max(500),
  kind: z.enum(["annual", "replacement"]),
  customerEmail: z.string().email(),
  schoolName: z.string().min(2),
  schoolCode: z.string().min(4),
  deliveryAddress: z.string().min(10),
});

function addWorkingDays(from: Date, workingDays: number) {
  const result = new Date(from);
  let added = 0;
  while (added < workingDays) {
    result.setUTCDate(result.getUTCDate() + 1);
    const day = result.getUTCDay();
    if (day !== 0 && day !== 6) added++;
  }
  return result.toISOString().slice(0, 10);
}

export const createScratchCardCheckout = createServerFn({ method: "POST" })
  .validator(orderInput)
  .handler(async ({ data }) => {
    const accountId = process.env.NOMBA_ACCOUNT_ID || process.env.NOMBA_PARENT_ACCOUNT_ID;
    const clientId = process.env.NOMBA_CLIENT_ID;
    const clientSecret = process.env.NOMBA_CLIENT_SECRET || process.env.NOMBA_PRIVATE_KEY;
    const baseUrl = process.env.NOMBA_BASE_URL ?? "https://api.nomba.com";
    const isSandbox = baseUrl.includes("sandbox.nomba.com");
    const callbackUrl = process.env.NOMBA_CALLBACK_URL && (!process.env.NOMBA_CALLBACK_URL.includes("localhost") || process.env.NODE_ENV === "development")
      ? process.env.NOMBA_CALLBACK_URL
      : `${getAppOrigin()}/payment-callback`;

    if (!accountId || !clientId || !clientSecret || !callbackUrl) {
      console.error(
        "Payment provider error: Nomba checkout is awaiting server credentials. Add NOMBA_PARENT_ACCOUNT_ID (or NOMBA_ACCOUNT_ID), NOMBA_CLIENT_ID, NOMBA_PRIVATE_KEY (or NOMBA_CLIENT_SECRET) and NOMBA_CALLBACK_URL.",
      );
      throw new Error("PAYMENT_GATEWAY_MAINTENANCE");
    }

    const authResponse = await fetch(`${baseUrl}/v1/auth/token/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accountId },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const auth = (await authResponse.json()) as {
      data?: { access_token?: string };
      description?: string;
    };
    if (!authResponse.ok || !auth.data?.access_token) {
      console.error("Payment provider authentication failed:", auth.description);
      throw new Error("PAYMENT_GATEWAY_MAINTENANCE");
    }

    const unitPrice = data.kind === "replacement" ? 2500 : 1500;
    await initDb();
    const schools = await sql`
      SELECT id FROM schools WHERE school_code = ${data.schoolCode}
    `;
    if (schools.length === 0) {
      throw new Error("School not found. Sign in again before ordering cards.");
    }
    const enrolment = await sql`
      SELECT COUNT(*)::int AS total FROM students WHERE school_id = ${schools[0].id}
    `;
    const enrolledStudents = Number(enrolment[0]?.total ?? 0);
    const quantity = data.kind === "annual" ? enrolledStudents : data.quantity;
    if (quantity < 1) {
      throw new Error("Add enrolled students before ordering the school's annual card batch.");
    }
    if (quantity > 500) {
      throw new Error(
        "Orders above 500 cards require assisted fulfilment. Contact iCademia support.",
      );
    }
    const orderReference = `ICA-CARD-${crypto.randomUUID()}`;
    const checkoutOrderPath = isSandbox ? "/sandbox/checkout/order" : "/v1/checkout/order";
    const orderResponse = await fetch(`${baseUrl}${checkoutOrderPath}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.data.access_token}`,
        accountId,
      },
      body: JSON.stringify({
        order: {
          orderReference,
          amount: (unitPrice * quantity).toFixed(2),
          currency: "NGN",
          customerEmail: data.customerEmail,
          callbackUrl,
          allowedPaymentMethods: ["Card", "Transfer", "USSD", "Nomba QR"],
          orderMetaData: {
            productName:
              data.kind === "replacement"
                ? "iCademia replacement scratch cards"
                : "iCademia annual scratch cards",
            internalRef: `${data.schoolName} · ${quantity} cards · physical fulfilment`,
          },
        },
      }),
    });
    const order = (await orderResponse.json()) as {
      data?: { checkoutLink?: string; orderReference?: string };
      description?: string;
    };
    if (!orderResponse.ok || !order.data?.checkoutLink) {
      console.error("Payment checkout creation failed:", order.description);
      throw new Error("Secure checkout could not be created. Please try again or contact support.");
    }
    await sql`
      INSERT INTO card_orders (
        school_id, order_reference, order_type, quantity, unit_price, customer_email,
        delivery_address
      ) VALUES (
        ${schools[0].id}, ${orderReference}, ${data.kind}, ${quantity}, ${unitPrice},
        ${data.customerEmail}, ${data.deliveryAddress}
      )
    `;
    return { ...order.data, quantity };
  });

export const verifyScratchCardCheckout = createServerFn({ method: "POST" })
  .validator(z.object({ orderReference: z.string().min(5) }))
  .handler(async ({ data }) => {
    const accountId = process.env.NOMBA_ACCOUNT_ID || process.env.NOMBA_PARENT_ACCOUNT_ID;
    const clientId = process.env.NOMBA_CLIENT_ID;
    const clientSecret = process.env.NOMBA_CLIENT_SECRET || process.env.NOMBA_PRIVATE_KEY;
    const baseUrl = process.env.NOMBA_BASE_URL ?? "https://api.nomba.com";
    const isSandbox = baseUrl.includes("sandbox.nomba.com");
    if (!accountId || !clientId || !clientSecret) {
      return { status: "CONFIGURATION_REQUIRED" as const };
    }

    const authResponse = await fetch(`${baseUrl}/v1/auth/token/issue`, {
      method: "POST",
      headers: { "Content-Type": "application/json", accountId },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    const auth = (await authResponse.json()) as {
      data?: { access_token?: string };
    };
    if (!authResponse.ok || !auth.data?.access_token) {
      return { status: "VERIFICATION_FAILED" as const };
    }

    const verificationUrl = isSandbox
      ? `${baseUrl}/sandbox/checkout/transaction?idType=orderReference&id=${encodeURIComponent(data.orderReference)}`
      : `${baseUrl}/v1/transactions/accounts/single?orderReference=${encodeURIComponent(data.orderReference)}`;
    const verificationResponse = await fetch(verificationUrl, {
      headers: {
        Authorization: `Bearer ${auth.data.access_token}`,
        accountId,
      },
    });
    const verification = (await verificationResponse.json()) as {
      data?: {
        status?: string;
        success?: boolean;
        message?: string;
        transactionDetails?: { statusCode?: string };
      };
    };

    const isSuccess =
      verificationResponse.ok &&
      (verification.data?.status === "SUCCESS" ||
        verification.data?.success === true ||
        verification.data?.transactionDetails?.statusCode === "PAYMENT SUCCESSFUL");

    if (isSuccess) {
      await initDb();
      const orders = await sql`
        SELECT * FROM card_orders WHERE order_reference = ${data.orderReference}
      `;
      if (orders.length > 0 && orders[0].status !== "Paid") {
        await sql.begin(async (transaction) => {
          const lockedOrders = await transaction`
            SELECT * FROM card_orders
            WHERE order_reference = ${data.orderReference}
            FOR UPDATE
          `;
          const order = lockedOrders[0];
          if (!order || order.status === "Paid") return;
          for (let i = 0; i < order.quantity; i++) {
            const rawPin = crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase();
            const pin = `${rawPin.slice(0, 4)}-${rawPin.slice(4, 8)}-${rawPin.slice(8, 12)}`;
            const serial = `ICA-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
            await transaction`
              INSERT INTO pins (school_id, pin, serial, status, payment_reference)
              VALUES (${order.school_id}, ${pin}, ${serial}, 'Unused', ${data.orderReference})
            `;
          }
          await transaction`
            UPDATE card_orders
            SET status = 'Paid',
                fulfillment_status = 'Preparing secure card batch',
                paid_at = CURRENT_TIMESTAMP,
                estimated_delivery_start = ${addWorkingDays(new Date(), 5)},
                estimated_delivery_end = ${addWorkingDays(new Date(), 12)}
            WHERE id = ${order.id}
          `;
        });
      } else if (orders.length === 0) {
        return { status: "VERIFICATION_FAILED" as const };
      }
    }

    return {
      status: isSuccess ? ("SUCCESS" as const) : ("PENDING" as const),
    };
  });
