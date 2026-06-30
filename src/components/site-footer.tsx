import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg gradient-primary"><Sparkles className="h-4 w-4 text-primary-foreground" /></span>
            <span className="font-display text-base font-bold">iCademia</span>
          </Link>
          <p className="mt-3 text-sm text-muted-foreground">Train a child, build a nation. The platform that brings schools, parents and students into one academic community.</p>
        </div>
        <FootCol title="Platform" links={[["Check Result", "/check-result"], ["Wall of Fame", "/wall-of-fame"], ["Competitions", "/competitions"], ["Register School", "/register-school"]]} />
        <FootCol title="For Schools" links={[["Sign in", "/login"], ["Admin dashboard", "/dashboard"], ["Teachers", "/dashboard/teachers"], ["About", "/about"]]} />
        <div>
          <p className="font-display text-sm font-semibold">Stay in the loop</p>
          <p className="mt-2 text-xs text-muted-foreground">Get updates on competitions, the Wall of Fame and new partner schools.</p>
        </div>
      </div>
      <div className="border-t border-border/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} iCademia. The home of school excellence.</p>
          <p>End-to-end encrypted · Built for primary, secondary & tertiary institutions</p>
        </div>
      </div>
    </footer>
  );
}

function FootCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-display text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm">
        {links.map(([l, to]) => (
          <li key={to}><Link to={to} className="text-muted-foreground hover:text-foreground">{l}</Link></li>
        ))}
      </ul>
    </div>
  );
}
