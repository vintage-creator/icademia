import { useState, useEffect } from "react";
import { Bell, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getSchoolCode } from "@/lib/utils";
import { getNotificationsDb, markNotificationsReadDb } from "@/lib/api/db.functions";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

type Notification = {
  id: number;
  school_id: number;
  user_type: "admin" | "teacher";
  user_id: number;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userType, setUserType] = useState<"admin" | "teacher">("admin");
  const [userId, setUserId] = useState(0);

  const playChimeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch (e) {
      // Audio autoplay policy handled silently
    }
  };

  useEffect(() => {
    const teacherProfile = localStorage.getItem("teacher_profile");
    if (teacherProfile) {
      try {
        const p = JSON.parse(teacherProfile);
        setUserType("teacher");
        setUserId(p.id);
      } catch (e) {}
    } else {
      setUserType("admin");
      setUserId(0);
    }
  }, []);

  const fetchNotifications = async () => {
    const schoolCode = getSchoolCode();
    if (!schoolCode) return;
    try {
      const data = await getNotificationsDb({ data: { schoolCode, userId, userType } });
      const currentList = data as Notification[];
      
      const newUnreadCount = currentList.filter(n => !n.is_read).length;
      
      setNotifications(prev => {
        const prevUnreadCount = prev.filter(n => !n.is_read).length;
        if (newUnreadCount > prevUnreadCount) {
          playChimeSound();
        }
        return currentList;
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [userId, userType]);

  const handleOpenChange = async (open: boolean) => {
    if (open) {
      const unread = notifications.some(n => !n.is_read);
      if (unread) {
        const schoolCode = getSchoolCode();
        if (schoolCode) {
          await markNotificationsReadDb({ data: { schoolCode, userId, userType } });
          setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        }
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative h-8 px-2.5 gap-1.5 rounded-full border-border hover:bg-muted/80 shadow-sm">
          <Bell className={`h-4 w-4 ${unreadCount > 0 ? "text-primary animate-bounce" : "text-muted-foreground"}`} />
          <span className="text-xs font-semibold hidden sm:inline">Notifications</span>
          {unreadCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-2xl">
        <div className="flex items-center justify-between border-b px-4 py-3 font-semibold text-sm">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              {unreadCount} New
            </span>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">
              You're all caught up with school alerts!
            </div>
          ) : (
            notifications.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex flex-col gap-1 border-b p-3 text-xs transition-colors hover:bg-muted/50",
                  !n.is_read && "bg-primary/5"
                )}
              >
                <div className="font-semibold text-foreground">{n.title}</div>
                <div className="text-muted-foreground line-clamp-2 leading-relaxed">{n.body}</div>
                <div className="text-[10px] text-muted-foreground opacity-60">
                  {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-2.5 border-t bg-muted/20 text-center">
          <Link to="/dashboard/notifications" className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1.5 py-1">
            View All Notifications & Audit Trail <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
