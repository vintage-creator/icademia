import { Link, useRouterState } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { cn, hasValidLocalSession } from "@/lib/utils";
const logo = "/icademia-logo.png";

const nav = [
  { to: "/", label: "Home" },
  { to: "/register-school", label: "For Schools" },
  { to: "/registry", label: "Registry" },
  { to: "/check-result", label: "Check Result" },
];

export function SiteHeader() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [hasSchoolSession, setHasSchoolSession] = useState(false);
  const [hasTeacherSession, setHasTeacherSession] = useState(false);

  useEffect(() => {
    const syncSessionState = () => {
      setHasSchoolSession(hasValidLocalSession("admin"));
      setHasTeacherSession(hasValidLocalSession("teacher"));
    };

    syncSessionState();
    window.addEventListener("icademia:session-updated", syncSessionState);
    window.addEventListener("storage", syncSessionState);

    return () => {
      window.removeEventListener("icademia:session-updated", syncSessionState);
      window.removeEventListener("storage", syncSessionState);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-1">
          <img src={logo} alt="iCademia" width={28} height={28} className="h-7 w-7 shrink-0" />
          <span className="font-display text-lg font-bold tracking-tight truncate">iCademia</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                path === n.to && "text-foreground font-semibold",
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {hasSchoolSession ? (
            <Button
              asChild
              size="sm"
              className="hidden sm:inline-flex gradient-primary text-primary-foreground shadow-elegant"
            >
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          ) : hasTeacherSession ? (
            <Button
              asChild
              size="sm"
              className="hidden sm:inline-flex gradient-primary text-primary-foreground shadow-elegant"
            >
              <Link to="/teacher">Head Teacher</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="hidden sm:inline-flex gradient-primary text-primary-foreground shadow-elegant"
              >
                <Link to="/register-school">Register school</Link>
              </Button>
            </>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[80vw] max-w-xs">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-left font-display font-bold">
                  <img src={logo} alt="" className="h-6 w-6" /> iCademia
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                {nav.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
                      path === n.to
                        ? "bg-muted font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {n.label}
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-2 pt-4 border-t border-border">
                  {hasSchoolSession ? (
                    <Link to="/dashboard" onClick={() => setOpen(false)}>
                      <Button className="w-full justify-start text-xs gradient-primary text-primary-foreground shadow-sm">
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : hasTeacherSession ? (
                    <Link to="/teacher" onClick={() => setOpen(false)}>
                      <Button className="w-full justify-start text-xs gradient-primary text-primary-foreground shadow-sm">
                        Go to Head Teacher Workspace
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setOpen(false)}>
                        <Button variant="outline" className="w-full justify-start text-xs">
                          Sign in to Portal
                        </Button>
                      </Link>
                      <Link to="/register-school" onClick={() => setOpen(false)}>
                        <Button className="w-full justify-start text-xs gradient-primary text-primary-foreground shadow-sm">
                          Register School
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
