import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, Users, Upload, KeyRound, Settings, LogOut, BookOpen, UserCog, Trophy, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DEMO_SCHOOL } from "@/lib/mock-data";
import logo from "/icademia-logo.png?url";

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/students", label: "Students", icon: Users },
  { to: "/dashboard/teachers", label: "Teachers", icon: UserCog },
  { to: "/dashboard/results", label: "Upload Results", icon: Upload },
  { to: "/dashboard/pins", label: "PIN Cards", icon: KeyRound },
  { to: "/dashboard/classes", label: "Classes & Terms", icon: BookOpen },
  { to: "/wall-of-fame", label: "Wall of Fame", icon: Trophy },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function SidebarInner({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <>
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
        <img src={logo} alt="iCademia" width={36} height={36} className="h-9 w-9 shrink-0" />
        <div className="min-w-0">
          <p className="font-display text-sm font-bold">iCademia</p>
          <p className="truncate text-[11px] text-sidebar-foreground/60">{DEMO_SCHOOL}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((it) => {
          const active = path === it.to;
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <it.icon className="h-4 w-4" />
              {it.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">AO</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Amaka O.</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">Administrator</p>
          </div>
          <Link
            to="/"
            onClick={() => {
              onNavigate?.();
              toast.success("Signed out", { description: "You have been logged out (demo)." });
            }}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
        <SidebarInner />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="" width={28} height={28} className="h-7 w-7" />
          <span className="font-display text-sm font-bold">iCademia</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 flex h-full w-[80vw] max-w-xs flex-col bg-sidebar text-sidebar-foreground shadow-elegant">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent/50"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarInner onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
