import { Link, useRouterState } from "@tanstack/react-router";
import { GraduationCap, LayoutDashboard, Users, Upload, KeyRound, Settings, LogOut, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/dashboard/students", label: "Students", icon: Users },
  { to: "/dashboard/results", label: "Upload Results", icon: Upload },
  { to: "/dashboard/pins", label: "PIN Cards", icon: KeyRound },
  { to: "/dashboard/classes", label: "Classes & Terms", icon: BookOpen },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-16 items-center gap-2.5 border-b border-sidebar-border px-6">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-sidebar-accent">
          <GraduationCap className="h-5 w-5 text-sidebar-primary" />
        </span>
        <div>
          <p className="font-display text-sm font-semibold">iCademia</p>
          <p className="text-[11px] text-sidebar-foreground/60">Brightfield Comp.</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {items.map((it) => {
          const active = path === it.to;
          return (
            <Link
              key={it.to}
              to={it.to}
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
          <span className="grid h-8 w-8 place-items-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-xs font-semibold">AO</span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium">Amaka O.</p>
            <p className="truncate text-[11px] text-sidebar-foreground/60">Administrator</p>
          </div>
          <Link to="/" className="text-sidebar-foreground/60 hover:text-sidebar-foreground">
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </aside>
  );
}
