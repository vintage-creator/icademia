import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Download,
  KeyRound,
  ShieldCheck,
  Loader2,
  PackageCheck,
  Clock3,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PIN_PRICE_NGN, PIN_REPLACEMENT_PRICE_NGN } from "@/lib/mock-data";
import { StatusPill } from "./dashboard.index";
import {
  buildTransferDetailsRequestUrl,
  buildTransferProofUrl,
  buildWhatsAppEscalationUrl,
  WHATSAPP_SUPPORT_DISPLAY_NUMBER,
} from "@/lib/whatsapp";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createTransferCardOrderDb,
  getCardOrderContextDb,
  getPinsDb,
  updatePinAccessDb,
} from "@/lib/api/db.functions";
import { getAdminToken, getSchoolCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/pins")({
  head: () => ({ meta: [{ title: "PIN Cards — iCademia" }] }),
  component: PinsPage,
});

function PinsPage() {
  type Pin = {
    id: number;
    serial: string;
    pin: string;
    status: string;
    used_by?: string | null;
    result_access_status?: string | null;
    restriction_reason?: string | null;
    created_at?: string | Date | null;
    expires_at?: string | Date | null;
  };
  type CardOrder = {
    order_reference: string;
    order_type: string;
    quantity: number;
    unit_price: number;
    status: string;
    fulfillment_status: string;
    delivery_address?: string | null;
    estimated_delivery_start?: string | null;
    estimated_delivery_end?: string | null;
    created_at: string;
  };
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(10);
  const [kind, setKind] = useState<"annual" | "replacement">("annual");
  const [email, setEmail] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [enrolledStudents, setEnrolledStudents] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orders, setOrders] = useState<CardOrder[]>([]);
  const [paying, setPaying] = useState(false);

  // Result access restrictions states
  const [restrictingPin, setRestrictingPin] = useState<Pin | null>(null);
  const [restrictStatus, setRestrictStatus] = useState<"Allowed" | "Restricted">("Allowed");
  const [restrictReason, setRestrictReason] = useState("");
  const [savingAccess, setSavingAccess] = useState(false);

  const schoolCode = getSchoolCode();

  const fetchPins = async () => {
    setLoading(true);
    try {
      const list = await getPinsDb({ data: { token: getAdminToken(), schoolCode } });
      setPins(list as unknown as Pin[]);
    } catch (error) {
      console.error("Error fetching PINs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchPins();
    void getCardOrderContextDb({ data: { token: getAdminToken(), schoolCode } }).then((context) => {
      setSchoolName(context.schoolName ?? "");
      setEmail(context.adminEmail ?? "");
      setEnrolledStudents(context.enrolledStudents);
      setCount(context.enrolledStudents || 1);
      setDeliveryAddress(context.deliveryAddress ?? "");
      setOrders(context.orders as unknown as CardOrder[]);
    });
    // fetchPins is local to this page and intentionally refreshed when the active school changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolCode]);

  const openRestrictDialog = (p: Pin) => {
    setRestrictingPin(p);
    setRestrictStatus((p.result_access_status as "Allowed" | "Restricted") || "Allowed");
    setRestrictReason(p.restriction_reason || "");
  };

  const saveAccessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restrictingPin) return;
    setSavingAccess(true);
    try {
      await updatePinAccessDb({
        data: {
          token: getAdminToken(),
          schoolCode,
          pinId: restrictingPin.id,
          status: restrictStatus,
          reason: restrictStatus === "Restricted" ? restrictReason : undefined,
        },
      });
      toast.success("Access settings updated successfully");
      setRestrictingPin(null);
      void fetchPins();
    } catch (err) {
      toast.error("Failed to update access settings", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSavingAccess(false);
    }
  };

  const orderCards = async () => {
    setPaying(true);
    const chatWindow = window.open("about:blank", "_blank");
    try {
      const order = await createTransferCardOrderDb({
        data: {
          token: getAdminToken(),
          schoolCode,
          quantity: kind === "annual" ? enrolledStudents : count,
          kind,
          deliveryAddress,
        },
      });
      const whatsappUrl = buildTransferDetailsRequestUrl({
        schoolName: order.schoolName,
        orderRef: order.orderReference,
        amountNgn: order.amountNgn,
        kind: kind === "annual" ? "annual scratch cards" : "replacement scratch cards",
        quantity: order.quantity,
        contactEmail: order.customerEmail,
      });
      if (chatWindow) {
        chatWindow.opener = null;
        chatWindow.location.href = whatsappUrl;
      } else {
        window.location.assign(whatsappUrl);
      }
      try {
        const context = await getCardOrderContextDb({
          data: { token: getAdminToken(), schoolCode },
        });
        setOrders(context.orders as unknown as CardOrder[]);
      } catch {
        // Keep the saved order and WhatsApp request available if refreshing the order list fails.
      }
      toast.success("Order request prepared", {
        description:
          "WhatsApp is ready with the order details. The team will send transfer instructions.",
      });
    } catch (error) {
      chatWindow?.close();
      toast.error("Could not prepare the order", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setPaying(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ["Serial", "PIN", "Status", "Assigned student", "Issued", "Expires"],
      ...pins.map((pin) => [
        pin.serial,
        pin.pin,
        pin.status,
        pin.used_by ?? "",
        pin.created_at ? new Date(pin.created_at).toISOString().slice(0, 10) : "",
        pin.expires_at ? new Date(pin.expires_at).toISOString().slice(0, 10) : "",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `icademia-scratch-cards-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const total = pins.length;
  const used = pins.filter((p) => p.status === "Used").length;
  const unused = pins.filter((p) => p.status === "Unused").length;
  const orderQuantity = kind === "annual" ? enrolledStudents : count;
  const orderTotal =
    (kind === "annual" ? PIN_PRICE_NGN : PIN_REPLACEMENT_PRICE_NGN) * orderQuantity;
  let orderBlockedReason: string | null = null;
  if (orderQuantity > 500) {
    orderBlockedReason = "Orders above 500 cards need assisted fulfilment.";
  } else if (kind === "annual" && enrolledStudents < 1) {
    orderBlockedReason = "Add enrolled students before ordering the annual school batch.";
  } else if (orderQuantity < 1) {
    orderBlockedReason = "Enter at least one card.";
  } else if (deliveryAddress.trim().length < 10) {
    orderBlockedReason = "Enter the complete school delivery address.";
  }

  return (
    <div className="space-y-6 p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Scratch cards</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Order identity-linked annual cards and monitor secure physical fulfilment.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={pins.length === 0}>
          <Download className="mr-1 h-4 w-4" /> Export CSV
        </Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total PINs" value={total} />
        <Stat label="Unused" value={unused} tone="primary" />
        <Stat label="Used" value={used} tone="success" />
      </div>

      <Card className="border-border p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-semibold">Order scratch cards</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Request the verified transfer account details from iCademia on WhatsApp, then send
              your receipt there.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700">
            <MessageCircle className="h-3.5 w-3.5" /> WhatsApp · {WHATSAPP_SUPPORT_DISPLAY_NUMBER}
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-6">
          <div>
            <Label>Order type</Label>
            <Select
              value={kind}
              onValueChange={(value) => setKind(value as "annual" | "replacement")}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="annual">Annual card · ₦1,500</SelectItem>
                <SelectItem value="replacement">Replacement · ₦2,500</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              max={500}
              value={kind === "annual" ? enrolledStudents : count}
              onChange={(e) => setCount(Number(e.target.value))}
              disabled={kind === "annual"}
              className="mt-2 w-32 font-mono"
            />
            <p className="mt-1 text-[11px] text-muted-foreground">
              {kind === "annual" ? "Matches current enrolment" : "Number being replaced"}
            </p>
          </div>
          <div className="md:col-span-3">
            <Label htmlFor="delivery-address">School delivery address</Label>
            <Input
              id="delivery-address"
              value={deliveryAddress}
              onChange={(event) => setDeliveryAddress(event.target.value)}
              placeholder="Street, city and state"
              className="mt-2"
            />
          </div>
          <div className="md:col-span-6 flex flex-col gap-3 rounded-xl bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Amount to transfer</p>
              <p className="mt-0.5 font-display text-2xl font-semibold">
                ₦{orderTotal.toLocaleString()}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {orderQuantity.toLocaleString()} card{orderQuantity === 1 ? "" : "s"}
              </p>
            </div>
            <Button
              onClick={orderCards}
              disabled={
                paying || Boolean(orderBlockedReason) || (kind === "replacement" && count < 1)
              }
              className="gradient-primary text-primary-foreground shadow-elegant w-full sm:w-auto"
            >
              <MessageCircle className="mr-1 h-4 w-4" />{" "}
              {paying ? "Preparing WhatsApp request…" : "Request transfer details on WhatsApp"}
            </Button>
            {orderBlockedReason ? (
              <div className="text-xs">
                <p className="font-medium text-amber-700">{orderBlockedReason}</p>
                {orderQuantity > 500 ? (
                  <a
                    href={buildWhatsAppEscalationUrl({
                      schoolName,
                      amountNgn: orderTotal,
                      kind: kind === "annual" ? "Annual Scratch Cards" : "Replacement Cards",
                      contactEmail: email,
                      reason: "Please arrange assisted fulfilment for an order over 500 cards.",
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-block font-semibold text-emerald-700 hover:underline"
                  >
                    Arrange this order on WhatsApp
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {kind === "annual"
            ? `Annual orders include all ${enrolledStudents.toLocaleString()} students currently enrolled.`
            : "Replacement orders are counted by the quantity entered above."}{" "}
          Transfer account details are shared privately by the iCademia team. PINs are issued after
          the transfer is confirmed; branded cards are prepared for delivery in 5–12 working days.
        </p>
      </Card>

      <Card className="border-border p-6 shadow-card">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <PackageCheck className="h-4 w-4 text-primary" /> Bulk-order tracking
        </h2>
        {orders.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            No card orders yet. Your payment and delivery timeline will appear here.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {orders.map((order) => (
              <div
                key={order.order_reference}
                className="grid gap-3 rounded-xl border border-border p-4 md:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="font-mono text-xs text-muted-foreground">{order.order_reference}</p>
                  <p className="mt-1 font-semibold">
                    {order.quantity.toLocaleString()} {order.order_type} cards ·{" "}
                    {order.fulfillment_status}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.delivery_address || "Delivery address awaiting confirmation"}
                  </p>
                  {order.status !== "Paid" ? (
                    <a
                      href={buildTransferProofUrl({
                        schoolName,
                        orderRef: order.order_reference,
                        amountNgn: order.quantity * order.unit_price,
                        kind:
                          order.order_type === "annual"
                            ? "annual scratch cards"
                            : "replacement scratch cards",
                        quantity: order.quantity,
                        contactEmail: email,
                      })}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Send transfer proof on WhatsApp
                    </a>
                  ) : null}
                </div>
                <div className="text-sm md:text-right">
                  <StatusPill status={order.status} />
                  {order.estimated_delivery_start && order.estimated_delivery_end ? (
                    <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" />
                      Est. {new Date(order.estimated_delivery_start).toLocaleDateString()} –{" "}
                      {new Date(order.estimated_delivery_end).toLocaleDateString()}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="border-border p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-primary" /> All PINs
        </h2>
        <div className="mt-5 max-h-[28rem] overflow-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm">Retrieving PIN cards...</p>
            </div>
          ) : pins.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2 text-muted-foreground text-center">
              <KeyRound className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm">No PIN cards issued yet.</p>
              <p className="text-xs max-w-xs text-muted-foreground/70">
                Send a transfer request on WhatsApp. PINs are issued here after iCademia confirms
                payment.
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[600px] text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5">Serial</th>
                  <th className="py-2.5">PIN</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Used by</th>
                  <th className="py-2.5">Result Access</th>
                  <th className="py-2.5">Generated</th>
                </tr>
              </thead>
              <tbody>
                {pins.map((p) => (
                  <tr key={p.id} className="border-b border-border/60 hover:bg-muted/40">
                    <td className="py-3 font-mono text-xs">{p.serial}</td>
                    <td className="py-3 font-mono">{p.pin}</td>
                    <td className="py-3">
                      <StatusPill status={p.status} />
                    </td>
                    <td className="py-3 text-muted-foreground">{p.used_by ?? "—"}</td>
                    <td className="py-3">
                      {p.result_access_status === "Restricted" ? (
                        <button
                          onClick={() => openRestrictDialog(p)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
                          title={`Restricted: ${p.restriction_reason || "Contact admin"}`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                          <span>Restricted</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => openRestrictDialog(p)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success border border-success/20 hover:bg-success/20 transition-colors"
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          <span>Allowed</span>
                        </button>
                      )}
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Result Access Control Dialog */}
      <Dialog open={Boolean(restrictingPin)} onOpenChange={(open) => !open && setRestrictingPin(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span>Manage Result Access</span>
            </DialogTitle>
            <DialogDescription className="text-xs pt-1 leading-relaxed">
              Configure student result viewing access for scratch card PIN <strong className="font-mono text-foreground">{restrictingPin?.pin}</strong> (Serial: {restrictingPin?.serial}).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={saveAccessSettings} className="space-y-4 pt-2 text-xs">
            <div>
              <Label className="text-xs font-semibold">Access Status</Label>
              <Select value={restrictStatus} onValueChange={(val) => setRestrictStatus(val as "Allowed" | "Restricted")}>
                <SelectTrigger className="mt-1.5 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Allowed">Allowed (Full Access)</SelectItem>
                  <SelectItem value="Restricted">Restricted (Lock Access)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {restrictStatus === "Restricted" && (
              <div className="space-y-3">
                <div>
                  <Label className="text-xs font-semibold">Preset Reasons</Label>
                  <Select
                    onValueChange={(val) => {
                      if (val !== "custom") {
                        setRestrictReason(val);
                      } else {
                        setRestrictReason("");
                      }
                    }}
                  >
                    <SelectTrigger className="mt-1.5 w-full">
                      <SelectValue placeholder="Choose a preset message (optional)..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Outstanding school fees balance. Please contact the school Bursar.">Outstanding School Fees</SelectItem>
                      <SelectItem value="Pending clearance from the academic office.">Pending Academic Clearance</SelectItem>
                      <SelectItem value="Outstanding library books or school property.">Outstanding Library Books / Items</SelectItem>
                      <SelectItem value="custom">Custom Reason...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs font-semibold">Custom Warning Message *</Label>
                  <Input
                    value={restrictReason}
                    onChange={(e) => setRestrictReason(e.target.value)}
                    placeholder="e.g. Please contact the administrative office for clearance."
                    className="mt-1.5 text-xs"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground leading-relaxed mt-1.5">
                    This warning message will be shown to the student immediately if they attempt to check their results using this scratch card PIN.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1 text-xs font-semibold" onClick={() => setRestrictingPin(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingAccess} className="flex-1 text-xs font-semibold">
                {savingAccess ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Access"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const t =
    tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <Card className="border-border p-5 shadow-card">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${t}`}>{value.toLocaleString()}</p>
    </Card>
  );
}
