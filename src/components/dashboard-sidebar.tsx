import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Upload,
  KeyRound,
  Settings,
  LogOut,
  BookOpen,
  UserCog,
  X,
  BrainCircuit,
  BookMarked,
  Gift,
  LifeBuoy,
  CalendarDays,
  ClipboardList,
  Bell,
} from "lucide-react";
import { cn, getSchoolCode } from "@/lib/utils";
import { toast } from "sonner";
import { getSchoolProfileDb } from "@/lib/api/db.functions";
const logoDark = "/icademia-logo-white.png";

// Standard SaaS Navigation Groups
const navGroups = [
  {
    category: "Main Workspace",
    items: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
      { to: "/dashboard/results", label: "Upload Results", icon: Upload },
      { to: "/dashboard/records", label: "Academic Records", icon: ClipboardList },
      { to: "/dashboard/notifications", label: "Notifications & Audit", icon: Bell },
    ],
  },
  {
    category: "People & School",
    items: [
      { to: "/dashboard/students", label: "Students", icon: Users },
      { to: "/dashboard/teachers", label: "Teachers", icon: UserCog },
    ],
  },
  {
    category: "Academic Structure",
    items: [
      { to: "/dashboard/classes", label: "Classes & Terms", icon: BookOpen },
      { to: "/dashboard/subjects", label: "Subjects", icon: BookMarked },
      { to: "/dashboard/timetable", label: "Timetable", icon: CalendarDays },
    ],
  },
  {
    category: "Operations & Intelligence",
    items: [
      { to: "/dashboard/ai", label: "AI Operations Brief", icon: BrainCircuit },
      { to: "/dashboard/pins", label: "Order Scratch Cards", icon: KeyRound },
    ],
  },
  {
    category: "System Preferences",
    items: [
      { to: "/dashboard/referrals", label: "Referrals", icon: Gift },
      { to: "/dashboard/support", label: "Support", icon: LifeBuoy },
      { to: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

type SchoolProfile = {
  name?: string | null;
  admin_name?: string | null;
  admin_email?: string | null;
  email_verified_at?: string | Date | null;
};

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const schoolCode = getSchoolCode();
  const navigate = useNavigate();

  // Instant Client Cache (SWR Pattern): Load from localStorage immediately!
  const [profile, setProfile] = useState<SchoolProfile | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem(`icademia_profile_${schoolCode}`);
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });

  const [loading, setLoading] = useState(!profile);

  useEffect(() => {
    if (!schoolCode) return;
    let cancelled = false;
    getSchoolProfileDb({ data: { schoolCode } })
      .then((school) => {
        if (!cancelled && school) {
          const fresh = school as SchoolProfile;
          setProfile(fresh);
          setLoading(false);
          try {
            localStorage.setItem(`icademia_profile_${schoolCode}`, JSON.stringify(fresh));
          } catch (e) {}
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schoolCode]);

  const adminName = profile?.admin_name || "";
  const initials = useMemo(() => {
    if (!adminName) return "";
    const parts = adminName.split(/\s+/).filter(Boolean).slice(0, 2);
    return (
      parts
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    );
  }, [adminName]);

  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <Link
          to="/"
          onClick={onNavigate}
          className="shrink-0 transition-opacity hover:opacity-85"
        >
          <img src={logoDark} alt="iCademia" width={28} height={28} className="h-7 w-7" />
        </Link>
        <div className="min-w-0">
          <Link
            to="/"
            onClick={onNavigate}
            className="font-display text-sm font-bold block transition-colors hover:text-sidebar-primary"
          >
            iCademia
          </Link>
          <Link
            to="/registry"
            search={{ code: schoolCode }}
            target="_blank"
            rel="noreferrer"
            className="truncate text-[11px] text-sidebar-primary hover:underline font-semibold block max-w-[140px]"
            title={`View Public School Registry Entry for ${profile?.name || schoolCode}`}
          >
            {profile?.name || schoolCode} ↗
          </Link>
        </div>
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto p-3">
        {navGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50">
              {group.category}
            </p>
            {group.items.map((it) => {
              const active = path === it.to;
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  )}
                >
                  <it.icon className="h-4 w-4 shrink-0" />
                  <span>{it.label}</span>
                  {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        {loading ? (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sidebar-accent/70 animate-pulse" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="h-3.5 w-28 bg-sidebar-accent/70 animate-pulse rounded" />
              <div className="h-2.5 w-20 bg-sidebar-accent/40 animate-pulse rounded" />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">
              {initials || "A"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{profile?.admin_name || "Administrator"}</p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">
                {profile?.email_verified_at ? "Verified administrator" : "Administrator"}
              </p>
            </div>
            <button
              onClick={() => {
                onNavigate?.();
                localStorage.removeItem("icademia_school_code");
                navigate({ to: "/login" });
                toast.success("Signed out", { description: "Your session has been securely ended." });
              }}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export function DashboardSidebar({
  mobileOpen = false,
  setMobileOpen,
}: {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <SidebarInner />
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen?.(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[80vw] max-w-xs flex-col bg-sidebar text-sidebar-foreground shadow-2xl z-10">
            <button
              type="button"
              onClick={() => setMobileOpen?.(false)}
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-sidebar-accent/50 text-sidebar-foreground hover:bg-sidebar-accent"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarInner onNavigate={() => setMobileOpen?.(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
