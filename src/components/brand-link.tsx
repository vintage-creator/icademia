import { Link } from "@tanstack/react-router";

type BrandLinkProps = {
  inverse?: boolean;
  compact?: boolean;
  className?: string;
};

export function BrandLink({ inverse = false, compact = false, className = "" }: BrandLinkProps) {
  return (
    <Link
      to="/"
      aria-label="iCademia home"
      className={`inline-flex items-center gap-1 ${className}`}
    >
      <img
        src={inverse ? "/icademia-logo-white.png" : "/icademia-logo.png"}
        alt=""
        className={`shrink-0 object-contain ${compact ? "h-7 w-7" : "h-9 w-9"}`}
      />
      <span
        className={`font-display font-bold ${compact ? "text-lg" : "text-xl"} ${inverse ? "text-white" : "text-foreground"}`}
      >
        iCademia
      </span>
    </Link>
  );
}
