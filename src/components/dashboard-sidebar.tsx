import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Upload,
  KeyRound,
  Settings,
  LogOut,
  UserCog,
  X,
  CalendarDays,
  MessagesSquare,
  BookOpen,
  BookMarked,
  Sparkles,
} from "lucide-react";
import { clearAdminSession, cn, getSchoolCode } from "@/lib/utils";
import { toast } from "sonner";
import { getSchoolProfileDb, logoutSchoolAdminDb } from "@/lib/api/db.functions";
const logoDark = "/icademia-logo-white.png";

// Standard SaaS Navigation Groups
const navGroups = [
  {
    category: "Workspace",
    items: [{ to: "/dashboard", label: "Overview", icon: LayoutDashboard }],
  },
  {
    category: "People & School",
    items: [
      { to: "/dashboard/students", label: "Students", icon: Users },
      { to: "/dashboard/teachers", label: "Teachers & Access", icon: UserCog },
    ],
  },
  {
    category: "Communication",
    items: [{ to: "/dashboard/communication", label: "Communication", icon: MessagesSquare }],
  },
  {
    category: "Academics",
    items: [
      { to: "/dashboard/results", label: "Results & Reports", icon: Upload },
      { to: "/dashboard/classes", label: "Classes", icon: BookOpen },
      { to: "/dashboard/subjects", label: "Subjects", icon: BookMarked },
      { to: "/dashboard/timetable", label: "Timetable", icon: CalendarDays },
    ],
  },
  {
    category: "Operations",
    items: [
      { to: "/dashboard/pins", label: "Scratch Cards", icon: KeyRound },
      { to: "/dashboard/ai", label: "AI Guidance", icon: Sparkles },
    ],
  },
  {
    category: "School",
    items: [{ to: "/dashboard/settings", label: "School Settings", icon: Settings }],
  },
];

type SchoolProfile = {
  name?: string | null;
  admin_name?: string | null;
  admin_email?: string | null;
  email_verified_at?: string | Date | null;
  registry_id?: string | null;
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
          } catch {
            // The fresh profile remains available in memory when browser storage is unavailable.
          }
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
    return parts
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [adminName]);

  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <Link to="/" onClick={onNavigate} className="shrink-0 transition-opacity hover:opacity-85">
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
            search={{ code: profile?.registry_id || schoolCode }}
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
                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center gap-3 px-3 text-[11px] font-medium text-sidebar-foreground/60">
          <Link
            to="/dashboard/support"
            onClick={onNavigate}
            className="hover:text-sidebar-foreground"
          >
            Support
          </Link>
          <span aria-hidden="true">·</span>
          <Link
            to="/dashboard/referrals"
            onClick={onNavigate}
            className="hover:text-sidebar-foreground"
          >
            Referrals
          </Link>
        </div>
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
              <p className="truncate text-sm font-medium">
                {profile?.admin_name || "Administrator"}
              </p>
              <p className="truncate text-[11px] text-sidebar-foreground/60">
                {profile?.email_verified_at ? "Verified administrator" : "Administrator"}
              </p>
            </div>
            <button
              onClick={() => {
                onNavigate?.();
                const token = localStorage.getItem("icademia_admin_token");
                if (token) void logoutSchoolAdminDb({ data: { token } });
                clearAdminSession();
                window.dispatchEvent(new Event("icademia:session-updated"));
                navigate({ to: "/login" });
                toast.success("Signed out", {
                  description: "Your session has been securely ended.",
                });
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
