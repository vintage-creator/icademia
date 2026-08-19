import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Headphones, Loader2, Mail, Phone } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSupportTicketDb, getSupportTicketsDb } from "@/lib/api/db.functions";
import { getSchoolCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/support")({
  head: () => ({ meta: [{ title: "Support — iCademia" }] }),
  component: SupportPage,
});

type Ticket = {
  id: number;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
};
type SupportCategory = "Access cards" | "Results" | "Account" | "Billing" | "Technical" | "Other";
type SupportPriority = "Normal" | "High" | "Urgent";

function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    subject: string;
    category: SupportCategory;
    priority: SupportPriority;
    message: string;
  }>({ subject: "", category: "Technical", priority: "Normal", message: "" });
  const schoolCode = getSchoolCode();

  const load = () =>
    getSupportTicketsDb({ data: { schoolCode } }).then((rows) =>
      setTickets(rows as unknown as Ticket[]),
    );
  useEffect(() => {
    void load();
  }, [schoolCode]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createSupportTicketDb({ data: { schoolCode, ...form } });
      setForm({ subject: "", category: "Technical", priority: "Normal", message: "" });
      toast.success("Support request received");
      await load();
    } catch (error) {
      toast.error("Could not send request", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-7 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          School support
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">How can we help?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Access-card, result, account and technical support in one place.
        </p>
      </header>
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="border-border p-6 shadow-card">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Headphones className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">Open a support request</h2>
              <p className="text-xs text-muted-foreground">
                Include enough detail for us to reproduce the issue.
              </p>
            </div>
          </div>
          <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Subject</Label>
              <Input
                className="mt-2"
                placeholder="Brief summary of the issue (e.g. Cannot print Year 9 results)"
                value={form.subject}
                onChange={(event) => setForm({ ...form, subject: event.target.value })}
                required
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(category) =>
                  setForm({ ...form, category: category as SupportCategory })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Access cards", "Results", "Account", "Billing", "Technical", "Other"].map(
                    (item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(priority) =>
                  setForm({ ...form, priority: priority as SupportPriority })
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Normal", "High", "Urgent"].map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label>What happened?</Label>
              <Textarea
                rows={6}
                className="mt-2"
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                placeholder="What were you trying to do, what happened, and which student/class/order was affected?"
                required
              />
            </div>
            <Button type="submit" disabled={saving} className="sm:col-span-2">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send support request
            </Button>
          </form>
        </Card>
        <div className="space-y-6">
          <Card className="border-border p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Direct support</h2>
            <a
              href="mailto:hello@icademia.app"
              className="mt-4 flex items-center gap-3 rounded-xl bg-muted/50 p-4 text-sm"
            >
              <Mail className="h-4 w-4 text-primary" /> hello@icademia.app
            </a>
            <a
              href="tel:+2347065737817"
              className="mt-3 flex items-center gap-3 rounded-xl bg-muted/50 p-4 text-sm"
            >
              <Phone className="h-4 w-4 text-primary" /> 0706 573 7817, 0813 804 5718
            </a>
          </Card>
          <Card className="border-border p-6 shadow-card">
            <h2 className="font-display text-lg font-semibold">Your requests</h2>
            {tickets.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No support requests yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-xl border border-border p-4">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-semibold">{ticket.subject}</p>
                      <span className="text-xs text-primary">{ticket.status}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {ticket.category} · {ticket.priority} ·{" "}
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
