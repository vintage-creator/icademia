import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Mail, MessageCircle, Phone, Twitter } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative mt-16 overflow-hidden bg-[#06101e] text-white">
      <div className="absolute inset-x-0 top-0 h-10 -translate-y-1/2 rounded-[50%] bg-background" />
      <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:26px_26px]" />
      <div className="absolute -right-32 top-8 h-80 w-80 rounded-full border-[48px] border-[#d6a84b]/5" />

      <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-12 pt-20 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.35fr_0.8fr_0.8fr_1fr]">
        <div>
          <Link to="/" className="inline-flex items-center gap-1">
            <img
              src="/icademia-logo-white.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
            />
            <span className="font-display text-xl font-bold">iCademia</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/55">
            The academic operations and student-record platform that lets schools focus on educating
            while iCademia handles the infrastructure around the work.
          </p>
          <div className="mt-5 flex items-center gap-2">
            {[
              [Instagram, "Instagram", "https://instagram.com/icademia"],
              [Facebook, "Facebook", "https://facebook.com/icademia"],
              [Twitter, "X", "https://x.com/icademia"],
              [Linkedin, "LinkedIn", "https://linkedin.com/company/icademia"],
            ].map(([Icon, label, href]) => (
              <a
                key={label as string}
                href={href as string}
                target="_blank"
                rel="noreferrer"
                aria-label={label as string}
                className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white/55 transition hover:border-[#d6a84b]/40 hover:text-[#f5d996]"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>

        <FootCol
          title="Explore"
          links={[
            ["Check Result", "/check-result"],
            ["Wall of Fame", "/wall-of-fame"],
            ["Competitions", "/competitions"],
            ["Conferences", "/conferences"],
            ["Developers", "/developers"],
          ]}
        />
        <FootCol
          title="For schools"
          links={[
            ["Register school", "/register-school"],
            ["School dashboard", "/dashboard"],
            ["Embed result checker", "/developers"],
            ["Privacy policy", "/privacy"],
            ["Terms of service", "/terms"],
          ]}
        />

        <div>
          <p className="font-display text-sm font-semibold text-white">Talk to iCademia</p>
          <p className="mt-3 text-xs leading-5 text-white/45">
            Questions about onboarding, access cards, integrations or support?
          </p>
          <a
            href="mailto:hello@icademia.app"
            className="mt-4 flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <Mail className="h-4 w-4 text-[#d6a84b]" /> hello@icademia.app
          </a>
          <a
            href="https://wa.me/2347065737817?text=Hello%20iCademia%2C%20please%20send%20me%20the%20bank%20account%20details%20for%20a%20school%20card%20transfer."
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <MessageCircle className="h-4 w-4 text-[#d6a84b]" /> WhatsApp transfer support: 0706 573 7817
          </a>
          <a
            href="tel:+2348138045718"
            className="mt-3 flex items-center gap-2 text-sm text-white/70 hover:text-white"
          >
            <Phone className="h-4 w-4 text-[#d6a84b]" /> Call support: 0813 804 5718
          </a>
        </div>
      </div>

      <div className="relative border-t border-white/8">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} iCademia. The home of school excellence.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="hover:text-white">
              Terms
            </Link>
            <span>Built for African schools</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FootCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-display text-sm font-semibold text-white">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link to={to} className="text-white/50 transition hover:text-white">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
