import { useId } from "react";

type OfficialSchoolSealProps = {
  stampUrl?: string;
  schoolName: string;
  city?: string;
  className?: string;
};

export function OfficialSchoolSeal({
  stampUrl,
  schoolName,
  city,
  className = "h-24 w-24",
}: OfficialSchoolSealProps) {
  const reactId = useId().replace(/:/g, "");

  if (stampUrl) {
    return (
      <img
        src={stampUrl}
        alt={`${schoolName} official seal`}
        className={`result-stamp object-contain mix-blend-multiply contrast-125 ${className}`}
      />
    );
  }

  const topArcId = `seal-top-${reactId}`;
  const bottomArcId = `seal-bottom-${reactId}`;
  const displayName = (schoolName || "Official School Seal").toUpperCase();
  const location = `${city ? `${city.toUpperCase()} · ` : ""}VERIFIED RECORD`;

  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={`${schoolName} official seal`}
      className={`result-stamp text-primary/85 mix-blend-multiply contrast-125 ${className}`}
    >
      <circle cx="60" cy="60" r="55" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="60" cy="60" r="49" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="1.8 2.2" />
      <circle cx="60" cy="60" r="45" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="60" cy="60" r="28" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M53 50h14v9c0 7-7 11-7 11s-7-4-7-11Z" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="m57 55 3 5 4-6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <rect x="40" y="76" width="40" height="9" rx="1" fill="none" stroke="currentColor" />
      <text x="60" y="82.5" textAnchor="middle" fontSize="5" fontWeight="900" fill="currentColor">
        OFFICIAL SEAL
      </text>
      <path id={topArcId} d="M 16,61 A 44,44 0 0,1 104,61" fill="none" />
      <text fontSize="6.2" fontWeight="900" fill="currentColor" fontFamily="serif">
        <textPath
          href={`#${topArcId}`}
          startOffset="50%"
          textAnchor="middle"
          textLength={displayName.length > 30 ? 76 : undefined}
          lengthAdjust="spacingAndGlyphs"
        >
          {displayName}
        </textPath>
      </text>
      <path id={bottomArcId} d="M 104,63 A 44,44 0 0,1 16,63" fill="none" />
      <text fontSize="5" fontWeight="800" fill="currentColor" fontFamily="serif">
        <textPath
          href={`#${bottomArcId}`}
          startOffset="50%"
          textAnchor="middle"
          textLength={location.length > 28 ? 72 : undefined}
          lengthAdjust="spacingAndGlyphs"
        >
          {location}
        </textPath>
      </text>
    </svg>
  );
}
