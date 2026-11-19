import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Megaphone, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MessagingPanel } from "@/components/messaging-panel";
import { createSchoolAnnouncementDb, getSchoolAnnouncementsDb } from "@/lib/api/db.functions";
import { getSchoolCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/communication")({ component: CommunicationPage });

type Announcement = {
  id: number;
  title: string;
  body: string;
  priority: string;
  published_by?: string;
  expires_at?: string;
  created_at: string;
};

function CommunicationPage() {
  const schoolCode = getSchoolCode();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    body: "",
    priority: "Normal" as "Normal" | "Important" | "Urgent",
    expiresAt: "",
  });
  const load = async () => {
    try {
      setItems(
        (await getSchoolAnnouncementsDb({ data: { schoolCode } })) as unknown as Announcement[],
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [schoolCode]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      await createSchoolAnnouncementDb({
        data: { schoolCode, ...form, expiresAt: form.expiresAt || undefined },
      });
      setForm({ title: "", body: "", priority: "Normal", expiresAt: "" });
      toast.success("Announcement published to all Head Teachers");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not publish announcement.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Communication
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            School communication centre
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Direct conversations, school-wide announcements and actionable alerts.
          </p>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Megaphone className="h-5 w-5 text-primary" />
              Publish announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  className="mt-2"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Mid-term break begins Friday"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea
                  className="mt-2 min-h-32"
                  required
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  placeholder="Write the information, action required, relevant date and who it applies to…"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={form.priority}
                    onValueChange={(priority) =>
                      setForm({ ...form, priority: priority as typeof form.priority })
                    }
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Normal">Normal</SelectItem>
                      <SelectItem value="Important">Important</SelectItem>
                      <SelectItem value="Urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>
                    Expires <span className="font-normal text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    type="date"
                    className="mt-2"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>
              </div>
              <Button className="w-full" disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Publish to Head Teachers
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active announcements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <Loader2 className="mx-auto my-10 h-6 w-6 animate-spin" />
            ) : items.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
                <MessageCircle className="mx-auto mb-3 h-8 w-8 opacity-40" />
                No active announcements.
              </div>
            ) : (
              items.map((item) => (
                <article key={item.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold">{item.title}</h2>
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${item.priority === "Urgent" ? "bg-destructive/10 text-destructive" : item.priority === "Important" ? "bg-amber-100 text-amber-800" : "bg-primary/10 text-primary"}`}
                    >
                      {item.priority}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {item.body}
                  </p>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    Published {new Date(item.created_at).toLocaleDateString()}
                    {item.published_by ? ` by ${item.published_by}` : ""}
                  </p>
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
