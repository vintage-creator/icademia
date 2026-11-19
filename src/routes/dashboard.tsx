import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { clearAdminSession, getSchoolCode, hasValidLocalSession, touchLocalSession } from "@/lib/utils";
import { NotificationBell } from "@/components/notification-bell";
import { MessagingPanel } from "@/components/messaging-panel";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { verifySchoolAdminSessionDb } from "@/lib/api/db.functions";

export const Route = createFileRoute("/dashboard")({
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const schoolCode = getSchoolCode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Instant SWR Auth: Optimistically render layout if local credentials are present, then verify in background
  const [authorised, setAuthorised] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(hasValidLocalSession("admin") && schoolCode && schoolCode.length >= 4);
  });

  useEffect(() => {
    const token = localStorage.getItem("icademia_admin_token");
    if (!token || !hasValidLocalSession("admin") || schoolCode.length < 4) {
      clearAdminSession();
      void navigate({ to: "/login", replace: true });
      return;
    }
    verifySchoolAdminSessionDb({ data: { token } })
      .then((session) => {
        if (!session || session.school_code !== schoolCode) {
          clearAdminSession();
          void navigate({ to: "/login", replace: true });
          return;
        }
        touchLocalSession("admin");
        window.dispatchEvent(new Event("icademia:session-updated"));
        setAuthorised(true);
      })
      .catch(() => {
        clearAdminSession();
        void navigate({ to: "/login", replace: true });
      });
  }, [navigate, schoolCode]);

  if (!authorised) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/40 text-sm text-muted-foreground">
        Checking school access…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/40 relative w-full">
      <DashboardSidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <div className="flex-1 min-w-0 flex flex-col pb-12 md:pb-0">
        {/* Unified Top Header Bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-3 sm:px-6 backdrop-blur">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-foreground"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate">
                Portal ·{" "}
                <strong className="font-mono text-foreground uppercase">{schoolCode}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 border-r border-border pr-2 sm:pr-3">
              <NotificationBell />
            </div>
            <MessagingPanel />
          </div>
        </header>

        <main className="flex-1 w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
