import { createFileRoute, Outlet, redirect, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  GraduationCap, 
  LayoutDashboard, 
  Users, 
  FileSpreadsheet, 
  Calendar, 
  User, 
  LogOut, 
  Menu,
  X
} from "lucide-react";
import { toast } from "sonner";
import { teacherLogoutDb, verifyTeacherSessionDb } from "@/lib/api/db.functions";
import { Button } from "@/components/ui/button";
import { MessagingPanel } from "@/components/messaging-panel";
import { NotificationBell } from "@/components/notification-bell";
import { createContext, useContext } from "react";

export const TeacherContext = createContext<{ profile: any } | null>(null);

export function useTeacherProfile() {
  const ctx = useContext(TeacherContext);
  if (!ctx) throw new Error("useTeacherProfile must be used within TeacherLayout");
  return ctx;
}

export const Route = createFileRoute("/teacher")({
  beforeLoad: async () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("teacher_token");
      if (!token) throw redirect({ to: "/teacher-login" });
    }
  },
  component: TeacherLayout,
});

function TeacherLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Instant Client Cache (SWR): Load cached teacher profile immediately!
  const [profile, setProfile] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("teacher_profile");
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  
  const [loading, setLoading] = useState(!profile);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("teacher_token");
      if (!token) {
        navigate({ to: "/teacher-login" });
        return;
      }
      try {
        const data = await verifyTeacherSessionDb({ data: { token } });
        if (!data) throw new Error("Session expired");
        setProfile(data);
        localStorage.setItem("teacher_profile", JSON.stringify(data));
      } catch (err) {
        localStorage.removeItem("teacher_token");
        localStorage.removeItem("teacher_profile");
        navigate({ to: "/teacher-login" });
        toast.error("Session expired. Please log in again.");
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem("teacher_token");
    if (token) {
      try {
        await teacherLogoutDb({ data: { token } });
      } catch (e) {
        // ignore
      }
    }
    localStorage.removeItem("teacher_token");
    localStorage.removeItem("teacher_profile");
    navigate({ to: "/teacher-login" });
  };

  if (loading && !profile) {
    return <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground animate-pulse">Loading Teacher Portal...</div>;
  }

  // Reordered by strict operational importance for teachers
  const NAV_LINKS = [
    { to: "/teacher", label: "Overview", icon: LayoutDashboard },
    { to: "/teacher/results", label: "Enter Results", icon: FileSpreadsheet },
    { to: "/teacher/classes", label: "My Classes", icon: Users },
    { to: "/teacher/timetable", label: "Timetable", icon: Calendar },
    { to: "/teacher/profile", label: "My Profile", icon: User },
  ];

  const NavItems = () => (
    <nav className="space-y-1 mt-6 px-3">
      {NAV_LINKS.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.to || (link.to !== "/teacher" && location.pathname.startsWith(link.to));
        return (
          <button
            key={link.to}
            onClick={() => {
              navigate({ to: link.to });
              setMobileOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive 
                ? "bg-primary text-primary-foreground shadow-sm font-semibold" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </button>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-muted/20 w-full relative">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-background border-r border-border z-20">
        <div className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight">Teacher Portal</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <NavItems />
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 px-3 py-2 mb-4">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase shrink-0">
              {profile?.name?.substring(0, 2) || "T"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold truncate text-foreground">{profile?.name || "Teacher"}</p>
              <p className="text-xs text-muted-foreground truncate">{profile?.role || "Subject Teacher"}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-30 flex items-center justify-between px-3 sm:px-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg border border-border">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10">
              <GraduationCap className="h-4 w-4 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-sm">Teacher Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <MessagingPanel />
        </div>
      </header>

      {/* Mobile Sidebar Overlay Drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-[80vw] max-w-xs bg-background border-r border-border flex flex-col shadow-2xl z-10">
            <div className="p-5 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                <span className="font-bold text-sm">Teacher Portal</span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1 text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pt-2">
              <NavItems />
            </div>
            <div className="p-4 border-t border-border mt-auto">
              <div className="flex items-center gap-3 px-3 py-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase shrink-0">
                  {profile?.name?.substring(0, 2) || "T"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate text-foreground">{profile?.name || "Teacher"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{profile?.role || "Subject Teacher"}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 pt-14 lg:pt-0 min-h-screen w-full max-w-full">
        <div className="h-full w-full max-w-full">
          <TeacherContext.Provider value={{ profile }}>
            <Outlet />
          </TeacherContext.Provider>
        </div>
      </main>

      {/* Floating Messaging Widget for Desktop */}
      <div className="hidden lg:block fixed bottom-6 right-6 z-50">
        <MessagingPanel />
      </div>
    </div>
  );
}
