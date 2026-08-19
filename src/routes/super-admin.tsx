import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  CreditCard,
  KeyRound,
  LifeBuoy,
  Loader2,
  LogOut,
  School,
  Users,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSuperAdminOverviewDb,
  updateCardOrderFulfillmentDb,
  savePortalContentDb,
  updateReferralStatusDb,
  saveCompetitionDb,
  saveConferenceDb,
} from "@/lib/api/db.functions";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/super-admin")({
  head: () => ({ meta: [{ title: "Platform Administration — iCademia" }] }),
  component: SuperAdminPage,
});

type PlatformMetrics = {
  schools: number;
  students: number;
  teachers: number;
  card_orders: number;
  paid_orders: number;
  card_revenue: number;
  open_tickets: number;
};

type PlatformOrder = {
  id: number;
  order_reference: string;
  order_type: string;
  quantity: number;
  status: string;
  fulfillment_status: string;
  school_name: string;
};

type PlatformSchool = {
  id: number;
  name: string;
  school_code: string;
  admin_email: string;
  city: string;
  students: number;
  teachers: number;
};

type Overview = {
  metrics: PlatformMetrics;
  orders: PlatformOrder[];
  schools: PlatformSchool[];
  content: Array<{
    id: number;
    content_type: string;
    title: string;
    summary: string;
    status: string;
    event_date?: string | null;
    location?: string | null;
  }>;
  referrals: Array<{
    id: number;
    referrer_school: string;
    referred_school: string;
    enrolled_students: number;
    tracked_reward: number;
    status: string;
  }>;
};

const fulfilmentOptions = [
  "Awaiting payment",
  "Preparing branded card batch",
  "Printing",
  "Dispatched",
  "Delivered",
  "On hold",
] as const;

function SuperAdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [contentForm, setContentForm] = useState({
    contentType: "Announcement" as "Conference" | "Competition" | "Announcement" | "Wall of Fame",
    title: "",
    summary: "",
    status: "Draft" as "Draft" | "Published" | "Archived",
    eventDate: "",
    location: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const result = await getSuperAdminOverviewDb({ data: { adminKey } });
      setOverview(result as unknown as Overview);
    } catch (error) {
      toast.error("Platform access denied", {
        description: error instanceof Error ? error.message : "Check your administrator key.",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrder = async (
    orderId: number,
    fulfillmentStatus: (typeof fulfilmentOptions)[number],
  ) => {
    try {
      await updateCardOrderFulfillmentDb({ data: { adminKey, orderId, fulfillmentStatus } });
      toast.success("Order fulfilment updated");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update order.");
    }
  };

  const saveContent = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      if (contentForm.contentType === "Competition") {
        await saveCompetitionDb({ data: { 
          title: contentForm.title, 
          description: contentForm.summary,
          category: "General", 
          deadline: contentForm.eventDate || undefined, 
        } });
      } else if (contentForm.contentType === "Conference") {
        await saveConferenceDb({ data: { 
          title: contentForm.title, 
          description: contentForm.summary, 
          eventDate: contentForm.eventDate || new Date().toISOString().split('T')[0], 
          location: contentForm.location || undefined
        } });
      } else {
        await savePortalContentDb({ data: { adminKey, ...contentForm } });
      }
      toast.success("Portal content saved");
      setContentForm({
        contentType: "Announcement",
        title: "",
        summary: "",
        status: "Draft",
        eventDate: "",
        location: "",
      });
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save content.");
    }
  };

  const updateReferral = async (
    referralId: number,
    status: "Onboarding" | "Qualified" | "Approved" | "Paid" | "Rejected",
  ) => {
    await updateReferralStatusDb({ data: { adminKey, referralId, status } });
    toast.success("Referral status updated");
    await load();
  };

  if (!overview) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#07111f] p-4 text-white">
        <Card className="w-full max-w-md border-white/10 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-3xl rounded-full mix-blend-screen pointer-events-none -z-10" />
          <Link to="/" className="inline-flex items-center gap-3 relative z-10">
            <img src="/icademia-logo.png" alt="" className="h-8 w-8 rounded-xl bg-white p-1.5 shadow-sm" />
            <span className="font-display font-bold text-xl tracking-tight">iCademia</span>
          </Link>
          <div className="relative z-10">
            <p className="mt-8 text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Restricted platform operations
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Super Administrator</h1>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Review partner schools, card orders, platform metrics and support operations.
            </p>
            <form
              className="mt-8"
              onSubmit={(event) => {
                event.preventDefault();
                void load();
              }}
            >
              <Label htmlFor="admin-key" className="text-white/80 font-medium text-xs uppercase tracking-wider">
                Platform Key
              </Label>
              <div className="relative">
                <Input
                  id="admin-key"
                  type={showKey ? "text" : "password"}
                  value={adminKey}
                  onChange={(event) => setAdminKey(event.target.value)}
                  className="mt-2 border-white/10 bg-black/40 text-white placeholder:text-white/20 h-12 px-4 focus-visible:ring-amber-500/50 pr-12"
                  placeholder="Enter 32-character admin key"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white mt-1"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="mt-6 w-full bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:from-amber-300 hover:to-amber-500 h-11 shadow-[0_0_20px_rgba(251,191,36,0.3)] border-none transition-all"
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <KeyRound className="mr-2 h-4 w-4" />
                )}
                <span className="font-semibold">Unlock Dashboard</span>
              </Button>
            </form>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/icademia-logo.png" alt="" className="h-7 w-7" />
            <div>
              <p className="font-display text-sm font-bold">iCademia Operations</p>
              <p className="text-[10px] text-muted-foreground">Platform administration</p>
            </div>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOverview(null);
              setAdminKey("");
            }}
          >
            <LogOut className="mr-2 h-4 w-4" /> Lock dashboard
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-[1500px] space-y-8 px-4 py-8 sm:px-6">
        <header>
          <p className="text-sm text-muted-foreground">Platform command centre</p>
          <h1 className="mt-1 font-display text-3xl font-semibold">Operating overview</h1>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <Metric icon={Building2} label="Partner schools" value={overview.metrics.schools} />
          <Metric icon={Users} label="Students" value={overview.metrics.students} />
          <Metric icon={School} label="Teachers" value={overview.metrics.teachers} />
          <Metric icon={CreditCard} label="Card orders" value={overview.metrics.card_orders} />
          <Metric
            icon={CreditCard}
            label="Card revenue"
            value={`₦${Number(overview.metrics.card_revenue).toLocaleString()}`}
          />
          <Metric icon={LifeBuoy} label="Open tickets" value={overview.metrics.open_tickets} />
        </div>
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <Card className="border-none p-6 shadow-sm ring-1 ring-border bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Scratch-card Orders</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  New orders appear here immediately after checkout creation.
                </p>
              </div>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3">School / order</th>
                    <th>Cards</th>
                    <th>Payment</th>
                    <th>Fulfilment</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.orders.map((order) => (
                    <tr key={order.id} className="border-b border-border/60">
                      <td className="py-3">
                        <p className="font-medium">{order.school_name}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">
                          {order.order_reference}
                        </p>
                      </td>
                      <td>
                        {Number(order.quantity).toLocaleString()}
                        <p className="text-xs text-muted-foreground">{order.order_type}</p>
                      </td>
                      <td>{order.status}</td>
                      <td className="min-w-52 py-2">
                        <Select
                          value={order.fulfillment_status}
                          onValueChange={(value) =>
                            void updateOrder(
                              Number(order.id),
                              value as (typeof fulfilmentOptions)[number],
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fulfilmentOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {overview.orders.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No orders yet.</p>
              ) : null}
            </div>
          </Card>
          <Card className="border-none p-6 shadow-sm ring-1 ring-border bg-white">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-500" />
              Recent Schools
            </h2>
            <div className="mt-4 divide-y divide-border">
              {overview.schools.map((school) => (
                <div key={school.id} className="py-3">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{school.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {school.city} · {school.admin_email}
                      </p>
                    </div>
                    <span className="font-mono text-[10px] text-primary">{school.school_code}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {school.students} students · {school.teachers} teachers
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
          <Card className="border-none p-6 shadow-sm ring-1 ring-border bg-white">
            <h2 className="text-lg font-bold tracking-tight">Publish Portal Content</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Prepare conferences, competitions, announcements and recognition content.
            </p>
            <form onSubmit={saveContent} className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Content type</Label>
                  <Select
                    value={contentForm.contentType}
                    onValueChange={(contentType) =>
                      setContentForm({
                        ...contentForm,
                        contentType: contentType as typeof contentForm.contentType,
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Conference", "Competition", "Announcement", "Wall of Fame"].map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={contentForm.status}
                    onValueChange={(status) =>
                      setContentForm({
                        ...contentForm,
                        status: status as typeof contentForm.status,
                      })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Draft", "Published", "Archived"].map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Title</Label>
                <Input
                  className="mt-2"
                  value={contentForm.title}
                  onChange={(event) =>
                    setContentForm({ ...contentForm, title: event.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label>Summary</Label>
                <Textarea
                  className="mt-2"
                  rows={4}
                  value={contentForm.summary}
                  onChange={(event) =>
                    setContentForm({ ...contentForm, summary: event.target.value })
                  }
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Event date</Label>
                  <Input
                    type="date"
                    className="mt-2"
                    value={contentForm.eventDate}
                    onChange={(event) =>
                      setContentForm({ ...contentForm, eventDate: event.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Location</Label>
                  <Input
                    className="mt-2"
                    value={contentForm.location}
                    onChange={(event) =>
                      setContentForm({ ...contentForm, location: event.target.value })
                    }
                  />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Save portal content
              </Button>
            </form>
          </Card>
          <Card className="border-none p-6 shadow-sm ring-1 ring-border bg-white">
            <h2 className="text-lg font-bold tracking-tight">Content Library</h2>
            <div className="mt-4 divide-y divide-border">
              {overview.content.map((item) => (
                <div key={item.id} className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {item.content_type}
                      </p>
                      <p className="mt-1 font-semibold">{item.title}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs">{item.status}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>
                  {item.event_date || item.location ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {item.event_date ? new Date(item.event_date).toLocaleDateString() : "No date"}{" "}
                      · {item.location || "Location to be confirmed"}
                    </p>
                  ) : null}
                </div>
              ))}
              {overview.content.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  No managed content yet.
                </p>
              ) : null}
            </div>
          </Card>
        </div>

        <Card className="border-none p-6 shadow-sm ring-1 ring-border bg-white">
          <h2 className="text-lg font-bold tracking-tight">Referral Qualification & Payout</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Rewards are calculated from the referred school’s current enrolled-student count.
          </p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-3">Referrer</th>
                  <th>Referred school</th>
                  <th>Students</th>
                  <th>Tracked reward</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overview.referrals.map((referral) => (
                  <tr key={referral.id} className="border-b border-border/60">
                    <td className="py-3">{referral.referrer_school}</td>
                    <td>{referral.referred_school}</td>
                    <td>{referral.enrolled_students}</td>
                    <td className="font-semibold">
                      ₦{Number(referral.tracked_reward).toLocaleString()}
                    </td>
                    <td className="min-w-44 py-2">
                      <Select
                        value={referral.status}
                        onValueChange={(status) =>
                          void updateReferral(
                            referral.id,
                            status as "Onboarding" | "Qualified" | "Approved" | "Paid" | "Rejected",
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {["Onboarding", "Qualified", "Approved", "Paid", "Rejected"].map(
                            (item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ),
                          )}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {overview.referrals.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No referral records yet.
              </p>
            ) : null}
          </div>
        </Card>
      </main>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="border-none p-5 shadow-sm ring-1 ring-border bg-white relative overflow-hidden group hover:ring-primary/20 transition-all">
      <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-primary/5 p-4 rounded-bl-3xl group-hover:bg-primary/10 transition-colors">
        <Icon className="h-5 w-5 text-primary opacity-80" />
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}
