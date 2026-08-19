import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "@tanstack/react-router";
import { toast } from "sonner";
import { ShieldAlert, Clock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

// 15 Minutes Inactivity Limit (900,000 ms)
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
// 1 Minute Warning Threshold (60,000 ms)
const WARNING_THRESHOLD_MS = 60 * 1000;

export function SessionTimeoutProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const lastActivityRef = useRef<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);

  const isProtectedPath = location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/teacher") || location.pathname.startsWith("/super-admin");

  const resetActivity = () => {
    lastActivityRef.current = Date.now();
    if (showWarning) {
      setShowWarning(false);
    }
  };

  // Activity listeners
  useEffect(() => {
    if (!isProtectedPath) return;

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleEvent = () => resetActivity();

    events.forEach((evt) => window.addEventListener(evt, handleEvent, { passive: true }));

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const remaining = IDLE_TIMEOUT_MS - elapsed;

      if (remaining <= 0) {
        // Trigger Logout
        setShowWarning(false);
        if (location.pathname.startsWith("/teacher")) {
          localStorage.removeItem("teacher_token");
          localStorage.removeItem("teacher_profile");
          navigate({ to: "/teacher-login" });
        } else {
          localStorage.removeItem("icademia_school_code");
          navigate({ to: "/login" });
        }
        toast.error("Session Expired Due to Inactivity", {
          description: "For your security, you were automatically logged out after 15 minutes of inactivity.",
        });
      } else if (remaining <= WARNING_THRESHOLD_MS) {
        setShowWarning(true);
        setSecondsLeft(Math.ceil(remaining / 1000));
      } else {
        if (showWarning) setShowWarning(false);
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleEvent));
      clearInterval(interval);
    };
  }, [isProtectedPath, showWarning, location.pathname, navigate]);

  return (
    <>
      {children}

      {/* Inactivity Warning Modal */}
      {showWarning && isProtectedPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in-50">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 border-2 border-amber-500/40 shadow-2xl space-y-4 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-amber-500/10 text-amber-600">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>

            <div>
              <h3 className="font-bold text-lg text-foreground">Session Timeout Warning</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                You have been inactive for over 14 minutes. For your security, your session will automatically log out in:
              </p>
              <div className="mt-3 inline-block rounded-xl bg-amber-500/10 px-4 py-2 font-mono text-2xl font-bold text-amber-600">
                00:{secondsLeft < 10 ? `0${secondsLeft}` : secondsLeft}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  if (location.pathname.startsWith("/teacher")) {
                    localStorage.removeItem("teacher_token");
                    localStorage.removeItem("teacher_profile");
                    navigate({ to: "/teacher-login" });
                  } else {
                    navigate({ to: "/login" });
                  }
                }}
              >
                <LogOut className="h-3.5 w-3.5 mr-1" /> Log Out Now
              </Button>
              <Button
                size="sm"
                className="w-full text-xs gradient-primary text-primary-foreground shadow-sm font-semibold"
                onClick={resetActivity}
              >
                Stay Logged In
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
