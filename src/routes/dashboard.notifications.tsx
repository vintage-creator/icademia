import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import {
  Bell,
  CheckCircle2,
  Trash2,
  Filter,
  Search,
  BookOpenCheck,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Volume2,
  VolumeX,
  ArrowRight,
  Loader2,
  ClipboardList,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getSchoolCode } from "@/lib/utils";
import { getNotificationsDb, markNotificationsReadDb } from "@/lib/api/db.functions";

export const Route = createFileRoute("/dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications & Activity Audit — iCademia" }] }),
  component: NotificationsPage,
});

type NotificationItem = {
  id: number;
  school_id: number;
  user_type: "admin" | "teacher";
  user_id: number;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  category?: "academic" | "staff" | "compliance" | "system";
};

function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "academic" | "staff" | "compliance">("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  const schoolCode = getSchoolCode();

  const loadNotifications = async () => {
    if (!schoolCode) return;
    try {
      const data = await getNotificationsDb({ data: { schoolCode, userId: 0, userType: "admin" } });
      setNotifications(data as NotificationItem[]);
    } catch (err) {
      toast.error("Could not load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadNotifications();
  }, [schoolCode]);

  const handleMarkAllRead = async () => {
    if (!schoolCode) return;
    try {
      await markNotificationsReadDb({ data: { schoolCode, userId: 0, userType: "admin" } });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark notifications read");
    }
  };

  const handleClearAll = () => {
    setNotifications([]);
    toast.success("Notification list cleared");
  };

  // Filtered & Searched List
  const filteredList = useMemo(() => {
    return notifications.filter((n) => {
      // Category filter
      if (filter === "unread" && n.is_read) return false;
      if (filter === "academic" && !n.title.toLowerCase().includes("result") && !n.title.toLowerCase().includes("attendance") && !n.title.toLowerCase().includes("topic")) return false;
      if (filter === "staff" && !n.title.toLowerCase().includes("teacher") && !n.title.toLowerCase().includes("admin") && !n.title.toLowerCase().includes("handover")) return false;
      if (filter === "compliance" && !n.title.toLowerCase().includes("compliance") && !n.title.toLowerCase().includes("audit") && !n.title.toLowerCase().includes("inspection")) return false;

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
      }
      return true;
    });
  }, [notifications, filter, search]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  return (
    <div className="space-y-6 p-3 sm:p-6 lg:p-8 w-full max-w-full">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-primary">
            System & Operations Hub
          </p>
          <h1 className="mt-1 font-display text-2xl sm:text-3xl font-semibold break-words">Notifications & Activity Audit</h1>
          <p className="mt-1.5 max-w-3xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Monitor real-time academic uploads, staff handovers, regulatory compliance deadlines and system alerts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <CheckCircle2 className="h-4 w-4" /> Mark All Read ({unreadCount})
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-xs gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" /> Clear List
          </Button>
        </div>
      </header>

      {/* Preferences & Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border p-4 shadow-card flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unread Alerts</p>
            <p className="text-2xl font-bold text-foreground">{unreadCount}</p>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </span>
        </Card>

        <Card className="border-border p-4 shadow-card flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Sound Alerts</p>
            <p className="text-sm font-medium text-foreground">{soundEnabled ? "Web Audio Chime Active" : "Muted"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="h-9 w-9 rounded-xl border border-border"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
          </Button>
        </Card>

        <Card className="border-border p-4 shadow-card flex items-center justify-between sm:col-span-2 lg:col-span-1">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Digest</p>
            <p className="text-sm font-medium text-foreground">Weekly Activity Brief</p>
          </div>
          <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
        </Card>
      </div>

      {/* Main Notifications Feed */}
      <Card className="border-border p-4 sm:p-6 shadow-card space-y-4">
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notification title or keywords..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(["all", "unread", "academic", "staff", "compliance"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition border capitalize shrink-0 ${
                  filter === f
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="grid min-h-[300px] place-items-center">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted mx-auto text-muted-foreground">
              <Bell className="h-6 w-6 opacity-60" />
            </div>
            <p className="font-semibold text-sm">No notifications found</p>
            <p className="text-xs text-muted-foreground">
              {search || filter !== "all" ? "Try adjusting your search query or category filters." : "You're all caught up with school operational alerts!"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredList.map((item) => {
              const formattedDate = new Date(item.created_at).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });

              const isAcademic = item.title.toLowerCase().includes("result") || item.title.toLowerCase().includes("attendance") || item.title.toLowerCase().includes("topic");
              const isCompliance = item.title.toLowerCase().includes("compliance") || item.title.toLowerCase().includes("audit") || item.title.toLowerCase().includes("inspection");
              const isStaff = item.title.toLowerCase().includes("teacher") || item.title.toLowerCase().includes("admin") || item.title.toLowerCase().includes("handover");

              const icon = isAcademic ? (
                <Upload className="h-4 w-4 text-emerald-500" />
              ) : isCompliance ? (
                <ShieldCheck className="h-4 w-4 text-amber-500" />
              ) : isStaff ? (
                <UserCheck className="h-4 w-4 text-blue-500" />
              ) : (
                <Bell className="h-4 w-4 text-primary" />
              );

              const categoryBadge = isAcademic
                ? "Academic & Results"
                : isCompliance
                ? "Compliance"
                : isStaff
                ? "Staff Operations"
                : "System Alert";

              const badgeColor = isAcademic
                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                : isCompliance
                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                : isStaff
                ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                : "bg-primary/10 text-primary border-primary/20";

              const linkTarget = isAcademic
                ? "/dashboard/records"
                : isCompliance
                ? "/dashboard/records"
                : isStaff
                ? "/dashboard/teachers"
                : "/dashboard";

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row items-start justify-between gap-3 p-4 rounded-xl border transition-all ${
                    !item.is_read
                      ? "bg-primary/5 border-primary/20 shadow-sm"
                      : "bg-card border-border hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-background border border-border shadow-xs shrink-0 mt-0.5">
                      {icon}
                    </span>
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}>
                          {categoryBadge}
                        </span>
                        {!item.is_read && (
                          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" title="Unread notification" />
                        )}
                        <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
                      </div>
                      <h3 className="font-semibold text-sm text-foreground break-words">{item.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed break-words">{item.body}</p>
                    </div>
                  </div>

                  <Link to={linkTarget} className="shrink-0 self-end sm:self-center">
                    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1 text-primary hover:bg-primary/10">
                      View details <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
