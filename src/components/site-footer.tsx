export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} ScholarGrade. Secure results, delivered.</p>
        <p className="text-xs">End-to-end encrypted · WAEC/NECO-style formats supported</p>
      </div>
    </footer>
  );
}
