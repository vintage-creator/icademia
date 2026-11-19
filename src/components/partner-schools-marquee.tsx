interface SchoolItem {
  name: string;
  initials: string;
  location: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
}

const schools: SchoolItem[] = [
  {
    name: "Riverglen High School",
    initials: "RHS",
    location: "Port Harcourt",
    badgeBg: "bg-[#07317a]",
    badgeText: "text-[#f5d996]",
    badgeBorder: "border-[#07317a]/30",
  },
  {
    name: "Gracefield College",
    initials: "GCL",
    location: "Lekki, Lagos",
    badgeBg: "bg-[#065f46]",
    badgeText: "text-[#a7f3d0]",
    badgeBorder: "border-[#065f46]/30",
  },
  {
    name: "Kingsway Academy",
    initials: "KWA",
    location: "Abuja FCT",
    badgeBg: "bg-[#581c87]",
    badgeText: "text-[#fde047]",
    badgeBorder: "border-[#581c87]/30",
  },
  {
    name: "Crown Hill Model School",
    initials: "CHM",
    location: "Calabar",
    badgeBg: "bg-[#9f1239]",
    badgeText: "text-[#ffe4e6]",
    badgeBorder: "border-[#9f1239]/30",
  },
  {
    name: "St. Jude’s International",
    initials: "SJI",
    location: "Enugu",
    badgeBg: "bg-[#0369a1]",
    badgeText: "text-[#bae6fd]",
    badgeBorder: "border-[#0369a1]/30",
  },
  {
    name: "Heritage Grammar School",
    initials: "HGS",
    location: "Ibadan",
    badgeBg: "bg-[#c2410c]",
    badgeText: "text-[#ffedd5]",
    badgeBorder: "border-[#c2410c]/30",
  },
  {
    name: "De-Merit Comprehensive",
    initials: "DMC",
    location: "Warri, Delta",
    badgeBg: "bg-[#115e59]",
    badgeText: "text-[#99f6e4]",
    badgeBorder: "border-[#115e59]/30",
  },
  {
    name: "Greenland Hall Academy",
    initials: "GHA",
    location: "Ikeja, Lagos",
    badgeBg: "bg-[#14532d]",
    badgeText: "text-[#bbf7d0]",
    badgeBorder: "border-[#14532d]/30",
  },
  {
    name: "Federal Hill Academy",
    initials: "FHA",
    location: "Asaba",
    badgeBg: "bg-[#3730a3]",
    badgeText: "text-[#e0e7ff]",
    badgeBorder: "border-[#3730a3]/30",
  },
  {
    name: "St. Gregory’s Memorial",
    initials: "SGM",
    location: "Benin City",
    badgeBg: "bg-[#831843]",
    badgeText: "text-[#fbcfe8]",
    badgeBorder: "border-[#831843]/30",
  },
];

export function PartnerSchoolsMarquee() {
  // Exactly two identical halves so translate3d(-50%) loops seamlessly forever
  const marqueeItems = [...schools, ...schools];

  return (
    <div
      aria-label="Partner schools"
      className="relative w-full overflow-hidden border-y border-slate-200/90 bg-gradient-to-r from-slate-50 via-white to-slate-50 py-4.5 select-none shadow-[0_2px_12px_rgba(0,0,0,0.03)]"
    >
      <style>{`
        @keyframes icMarqueeSlide {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .ic-marquee-track-active {
          display: flex !important;
          width: max-content !important;
          flex-wrap: nowrap !important;
          will-change: transform;
          animation: icMarqueeSlide 30s linear infinite !important;
        }
        .ic-marquee-track-active:hover {
          animation-play-state: paused !important;
        }
        @media (prefers-reduced-motion: reduce) {
          .ic-marquee-track-active {
            animation: none !important;
          }
        }
      `}</style>

      {/* Eyebrow heading */}
      <div className="relative mx-auto mb-3 max-w-7xl px-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary/80 sm:text-[11px]">
          Trusted by forward-thinking schools across Nigeria
        </p>
      </div>

      {/* Marquee viewport with gradient fade edges */}
      <div className="relative w-full overflow-hidden">
        {/* Left fade overlay */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-50 via-slate-50/80 to-transparent sm:w-28" />

        {/* Right fade overlay */}
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-50 via-slate-50/80 to-transparent sm:w-28" />

        {/* Moving marquee track */}
        <div className="ic-marquee-track-active">
          {marqueeItems.map((school, index) => (
            <div
              key={`${school.initials}-${index}`}
              className="flex shrink-0 items-center gap-3 px-5 sm:px-7 group cursor-default"
            >
              {/* Colorful school initials monogram badge */}
              <div
                className={`flex h-8 w-11 shrink-0 items-center justify-center rounded-lg border ${school.badgeBorder} ${school.badgeBg} ${school.badgeText} font-display text-[11px] font-black tracking-wider shadow-xs transition-transform duration-200 group-hover:scale-105 group-hover:shadow-md`}
              >
                {school.initials}
              </div>

              {/* School name & location */}
              <div className="flex items-baseline gap-1.5 whitespace-nowrap">
                <span className="font-display text-xs sm:text-sm font-bold text-slate-800 transition-colors group-hover:text-primary">
                  {school.name}
                </span>
                <span className="text-[10px] font-medium text-slate-400">
                  · {school.location}
                </span>
              </div>

              {/* Colorful diamond separator */}
              <span className="ml-5 text-[#d6a84b] text-[10px] select-none opacity-60" aria-hidden="true">
                ✦
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
