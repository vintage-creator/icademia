import { Link, useRouterState } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home" },
  { to: "/wall-of-fame", label: "Wall of Fame" },
  { to: "/competitions", label: "Competitions" },
  { to: "/about", label: "About" },
  { to: "/check-result", label: "Check Result" },
];

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-elegant">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            iCademia
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                path === n.to && "text-foreground"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm" className="gradient-primary text-primary-foreground shadow-elegant">
            <Link to="/register-school">Register your school</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
