import { Link, useRouterState } from "@tanstack/react-router";
import { ClipboardList, ShieldCheck, UsersRound } from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
  {
    to: "/dashboard/classes",
    label: "Academic Setup",
    description: "Start here",
    icon: UsersRound,
  },
  {
    to: "/dashboard/records",
    label: "Class Journal",
    description: "Attendance & progress",
    icon: ClipboardList,
  },
  {
    to: "/dashboard/results",
    label: "Result Review",
    description: "Final review & publish",
    icon: ShieldCheck,
  },
] as const;

export function AcademicWorkspaceNav() {
  const path = useRouterState({ select: (state) => state.location.pathname });
  return (
    <div className="overflow-x-auto border-b bg-background px-4 sm:px-6 lg:px-8">
      <nav className="flex min-w-max gap-1" aria-label="Academic workspace">
        {sections.map((section) => {
          const active =
            path === section.to ||
            (section.to === "/dashboard/classes" && path === "/dashboard/subjects");
          return (
            <Link
              key={section.to}
              to={section.to}
              preload="intent"
              className={cn(
                "flex items-center gap-2 border-b-2 px-3 py-3 text-xs font-semibold transition-colors sm:text-sm",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <section.icon className="h-4 w-4" />
              <span>
                <span className="block">{section.label}</span>
                <span className="hidden text-[10px] font-normal text-muted-foreground lg:block">
                  {section.description}
                </span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
