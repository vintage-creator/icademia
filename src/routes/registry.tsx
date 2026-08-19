import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Search,
  ShieldCheck,
  Building2,
  Users,
  UserCheck,
  Award,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileSpreadsheet,
  CheckCircle2,
  ArrowRight,
  Printer,
  Loader2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lookupPublicSchoolRegistryDb } from "@/lib/api/db.functions";
import { toast } from "sonner";
import { getSchoolCode } from "@/lib/utils";

export const Route = createFileRoute("/registry")({
  head: () => ({
    meta: [
      { title: "Public School Code & Registry Lookup — iCademia WHOIS" },
      { name: "description", content: "Verify official school credentials, leadership, campus capacity, contact details and result registers by school code." },
    ],
  }),
  component: SchoolRegistryPage,
});

type RegistrySchool = {
  id: number;
  name: string;
  schoolCode: string;
  type: string;
  motto?: string | null;
  city?: string | null;
  address?: string | null;
  website?: string | null;
  adminName?: string | null;
  adminEmail?: string | null;
  adminPhone?: string | null;
  headTitle?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  emailVerifiedAt?: string | null;
  registeredAt?: string | null;
};

type RegistryData =
  | {
      multipleMatches: false;
      school: RegistrySchool;
      stats: {
        enrolledStudents: number;
        registeredTeachers: number;
        studentTeacherRatio: string;
        resultsIssued: number;
        campusCapacity: number;
        utilizationPercentage: number;
      };
    }
  | {
      multipleMatches: true;
      matches: Array<{
        id: number;
        name: string;
        schoolCode: string;
        type: string;
        city?: string | null;
        adminName?: string | null;
        logoUrl?: string | null;
      }>;
    };

const SAMPLE_CODES = ["ICA-SCH-IMO-OWE", "ICA-SCH-LAG-IKJ", "ICA-SCH-ENG-ENU"];

function SchoolRegistryPage() {
  const navigate = useNavigate();
  const searchParams: { code?: string } = useSearch({ from: "/registry" });

  const activeSchoolCode = getSchoolCode();
  const initialQuery = searchParams.code || activeSchoolCode || "ICA-SCH-IMO-OWE";

  const [inputCode, setInputCode] = useState(initialQuery);
  const [searching, setSearching] = useState(false);
  const [data, setData] = useState<RegistryData | null>(null);
  const [searchedCode, setSearchedCode] = useState("");

  const performLookup = async (codeToLookup: string) => {
    if (!codeToLookup.trim()) return;
    setSearching(true);
    try {
      const res = await lookupPublicSchoolRegistryDb({ data: { schoolCode: codeToLookup.trim() } });
      setData(res as RegistryData | null);
      setSearchedCode(codeToLookup.trim().toUpperCase());
      if (!res) {
        toast.error("No verified school found for: " + codeToLookup);
      }
    } catch (err) {
      toast.error("Registry lookup failed", {
        description: err instanceof Error ? err.message : "Please check the school code.",
      });
      setData(null);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      void performLookup(initialQuery);
    }
  }, [searchParams.code]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    const clean = inputCode.trim().toUpperCase();
    navigate({ to: "/registry", search: { code: clean } });
    void performLookup(clean);
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      toast.success("Registry link copied to clipboard!");
    } else {
      toast.info("Share URL: " + url);
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 text-foreground flex flex-col w-full max-w-full overflow-x-hidden">
      {/* Explicit Print CSS stylesheet block to guarantee window.print() is never blank */}
      <style>{`
        @media print {
          body, html { background: #ffffff !important; color: #000000 !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:border-2 { border: 2px solid #000000 !important; }
          .print\\:border-4 { border: 4px solid #000000 !important; }
          .print\\:bg-white { background-color: #ffffff !important; }
          .print\\:text-black { color: #000000 !important; }
          .print\\:p-8 { padding: 2rem !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:w-full { width: 100% !important; }
        }
      `}</style>

      {/* Top Header — Hidden on Print */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur px-4 sm:px-8 py-3 flex items-center justify-between print:hidden">
        <Link to="/" className="flex items-center gap-2">
          <img src="/icademia-logo.png" alt="iCademia" className="h-7 w-7 object-contain" />
          <span className="font-display font-bold text-lg tracking-tight">iCademia Registry</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link to="/check-result">
            <Button variant="outline" size="sm" className="text-xs gap-1.5 hidden sm:inline-flex">
              <FileSpreadsheet className="h-3.5 w-3.5 text-primary" /> Check Result Sheet
            </Button>
          </Link>
          <Link to="/login">
            <Button size="sm" className="gradient-primary text-primary-foreground text-xs shadow-elegant">
              Portal Sign In
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Hero & Search Container */}
      <div className="flex-1 space-y-8 p-4 sm:p-8 lg:p-12 max-w-6xl mx-auto w-full print:p-0 print:m-0 print:max-w-none">
        <header className="text-center space-y-3 print:hidden">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" /> Official School Code & WHOIS Registry
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            School Registry & Ownership Lookup
          </h1>
          <p className="max-w-2xl mx-auto text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Verify official educational credentials, leadership, campus student capacity, location, contact details, and result register authenticity using school code or school name.
          </p>
        </header>

        {/* WHOIS Search Bar — Hidden on Print */}
        <Card className="border-border p-4 sm:p-6 shadow-card bg-card max-w-3xl mx-auto print:hidden">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Search by School Code, Name, or City (e.g. ICA-SCH-IMO-OWE)"
                className="pl-10 uppercase text-sm h-11 bg-background"
                required
              />
            </div>
            <Button type="submit" disabled={searching} className="gradient-primary text-primary-foreground h-11 px-6 text-sm font-semibold shadow-elegant gap-2">
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Lookup Registry
            </Button>
          </form>

          {/* Quick Demo Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pt-3 border-t border-border/60">
            <span className="text-[11px] text-muted-foreground font-semibold">Try sample searches:</span>
            {SAMPLE_CODES.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setInputCode(code);
                  navigate({ to: "/registry", search: { code } });
                  void performLookup(code);
                }}
                className="px-2.5 py-1 rounded-md bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary text-[11px] font-mono transition border border-border"
              >
                {code}
              </button>
            ))}
          </div>
        </Card>

        {/* REGISTRY REPORT RESULT */}
        {searching ? (
          <div className="grid min-h-[300px] place-items-center print:hidden">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Searching official school registry for <strong className="font-mono text-foreground">{inputCode}</strong>…</p>
            </div>
          </div>
        ) : !data ? (
          <Card className="border-border p-8 text-center space-y-3 max-w-xl mx-auto print:hidden">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-muted mx-auto text-muted-foreground">
              <Building2 className="h-6 w-6 opacity-60" />
            </div>
            <p className="font-semibold text-base">No Registry Entry Found</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No verified educational institution was found matching <strong className="font-mono text-foreground">{searchedCode || inputCode}</strong>. Please verify the school code or name.
            </p>
          </Card>
        ) : data.multipleMatches ? (
          /* MULTI-SCHOOL DISAMBIGUATION GRID */
          <div className="space-y-4 print:hidden">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-foreground">Matching Schools Found ({data.matches.length})</h2>
                <p className="text-xs text-muted-foreground">Multiple schools matched your search. Select the specific school to view its full registry certificate.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.matches.map((item) => (
                <Card key={item.id} className="border-border p-5 shadow-card hover:border-primary/50 transition-all flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      {item.logoUrl ? (
                        <img src={item.logoUrl} alt={item.name} className="h-12 w-12 object-contain rounded-lg p-0.5 bg-white border shrink-0" />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary grid place-items-center font-bold text-sm shrink-0">
                          {item.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {item.schoolCode}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-base text-foreground leading-tight">{item.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{item.type} {item.city ? `· ${item.city}` : ""}</p>
                    </div>

                    {item.adminName && (
                      <p className="text-xs text-muted-foreground">
                        Principal: <strong className="text-foreground">{item.adminName}</strong>
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={() => {
                      setInputCode(item.schoolCode);
                      navigate({ to: "/registry", search: { code: item.schoolCode } });
                      void performLookup(item.schoolCode);
                    }}
                    className="w-full gradient-primary text-primary-foreground text-xs gap-1.5 shadow-sm"
                  >
                    Select & Inspect Registry <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          /* SINGLE SCHOOL OFFICIAL ACCREDITATION CERTIFICATE */
          <div className="space-y-6 animate-in fade-in-50 duration-300 print:space-y-4">
            {/* Screen Action Bar — Hidden on Print */}
            <Card className="border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-6 shadow-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
              <div className="flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500 text-white shadow-md shrink-0">
                  <ShieldCheck className="h-6 w-6" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">iCademia Verified Educational Institution</span>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </div>
                  <h2 className="font-display font-bold text-xl text-foreground mt-0.5">{data.school.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    Official Registry Code: <strong className="font-mono text-foreground">{data.school.schoolCode}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button variant="outline" size="sm" onClick={handleShare} className="text-xs gap-1.5">
                  <Share2 className="h-3.5 w-3.5" /> Share Registry
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()} className="text-xs gap-1.5 border-primary/40 text-primary hover:bg-primary/10">
                  <Printer className="h-3.5 w-3.5" /> Print Accreditation Certificate
                </Button>
                <Link to={`/check-result`}>
                  <Button size="sm" className="gradient-primary text-primary-foreground text-xs gap-1.5 shadow-elegant">
                    <FileSpreadsheet className="h-3.5 w-3.5" /> Verify Result Sheet
                  </Button>
                </Link>
              </div>
            </Card>

            {/* Official Printable Accreditation Certificate & Registry Entry */}
            <div className="bg-card border-2 border-border rounded-2xl p-6 sm:p-8 shadow-card print:border-4 print:border-black print:bg-white print:text-black print:p-8 print:shadow-none print:rounded-none">
              {/* Certificate Letterhead Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b-2 border-border print:border-black">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  {data.school.logoUrl ? (
                    <img src={data.school.logoUrl} alt={data.school.name} className="h-20 w-20 object-contain rounded-xl p-1 bg-white border border-border shadow-sm print:border-black" />
                  ) : (
                    <div className="h-20 w-20 rounded-xl bg-primary/10 text-primary grid place-items-center text-2xl font-bold font-display border print:border-black">
                      {data.school.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 print:text-black">Official Educational Accreditation Certificate</span>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground print:text-black mt-0.5">{data.school.name}</h1>
                    {data.school.motto && <p className="text-xs italic text-muted-foreground print:text-black/80 mt-0.5">"{data.school.motto}"</p>}
                    <p className="text-xs font-mono font-semibold text-primary print:text-black mt-1">
                      REGISTRY CODE: {data.school.schoolCode} · {data.school.type}
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 print:border print:border-black print:bg-none text-xs font-bold uppercase tracking-wider">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified Active
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground print:text-black mt-1">
                    CERTIFICATE NO: ICA-REG-{data.school.id}-2026
                  </p>
                </div>
              </div>

              {/* Certificate Details Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-6">
                {/* 1. Leadership & Ownership */}
                <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border print:border-black print:bg-white">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground print:text-black font-bold">Principal / Head Administrator</Label>
                  <p className="font-bold text-base text-foreground print:text-black">{data.school.adminName || "Registered Head Administrator"}</p>
                  <p className="text-xs text-muted-foreground print:text-black">{data.school.headTitle || "Principal / Head Teacher"}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold print:text-black mt-1">✓ Identity & Credentials Verified</p>
                </div>

                {/* 2. Campus & Contact */}
                <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border print:border-black print:bg-white">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground print:text-black font-bold">Campus Address & Contact</Label>
                  <p className="text-xs font-medium text-foreground print:text-black">
                    {data.school.address ? `${data.school.address}, ${data.school.city}` : data.school.city || "Nigeria"}
                  </p>
                  <p className="text-xs text-muted-foreground print:text-black">{data.school.contactEmail || data.school.adminEmail}</p>
                  <p className="text-xs text-muted-foreground print:text-black">{data.school.contactPhone || data.school.adminPhone}</p>
                </div>

                {/* 3. Academic Metrics */}
                <div className="space-y-2 p-4 rounded-xl bg-muted/20 border border-border print:border-black print:bg-white">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground print:text-black font-bold">Roster & Capacity Overview</Label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <p className="text-muted-foreground print:text-black">Enrolled Students</p>
                      <p className="font-bold text-sm text-foreground print:text-black">{data.stats.enrolledStudents}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground print:text-black">Teaching Faculty</p>
                      <p className="font-bold text-sm text-foreground print:text-black">{data.stats.registeredTeachers}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground print:text-black">Student-Teacher Ratio</p>
                      <p className="font-bold text-sm text-primary print:text-black">{data.stats.studentTeacherRatio} : 1</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground print:text-black">Campus Utilization</p>
                      <p className="font-bold text-sm text-emerald-600 print:text-black">{data.stats.utilizationPercentage}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Utilization Bar */}
              <div className="mt-6 p-4 rounded-xl bg-muted/20 border border-border print:border-black print:bg-white space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground print:text-black">Campus Student Capacity Utilization Rate</span>
                  <span className="text-primary print:text-black">{data.stats.enrolledStudents} Enrolled / {data.stats.campusCapacity} Total Capacity ({data.stats.utilizationPercentage}%)</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-primary/10 p-0.5 print:border print:border-black">
                  <div
                    className="h-full rounded-full bg-primary print:bg-black transition-all"
                    style={{ width: `${data.stats.utilizationPercentage}%` }}
                  />
                </div>
              </div>

              {/* Official Seal Footer */}
              <div className="mt-8 pt-6 border-t-2 border-border print:border-black flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500 text-white font-bold font-display shadow-sm print:border print:border-black">
                    iC
                  </div>
                  <div>
                    <p className="font-bold text-foreground print:text-black">iCademia Official Educational Registry</p>
                    <p className="text-[10px] text-muted-foreground print:text-black">Authentic digital grade registers and school code WHOIS service.</p>
                  </div>
                </div>

                <div className="text-center sm:text-right text-[11px] text-muted-foreground print:text-black">
                  <p>Verified Timestamp: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
                  <p className="font-mono text-[10px]">VERIFICATION CODE: {data.school.schoolCode}-REG-OK</p>
                </div>
              </div>
            </div>

            {/* Bottom Result Checker Callout — Hidden on Print */}
            <Card className="border-primary/30 bg-primary/5 p-6 shadow-card space-y-4 print:hidden">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-md shrink-0">
                  <Award className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-base text-foreground">Verified Result Verification Services</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    Students, parents, and secondary education boards can verify official term result sheets issued by {data.school.name} using scratch card PINs.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-primary/15">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Tamper-proof digital grade registers enabled</span>
                </div>

                <Link to={`/check-result`}>
                  <Button className="gradient-primary text-primary-foreground shadow-elegant gap-2 w-full sm:w-auto text-xs">
                    Check Student Result Sheet <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Footer — Hidden on Print */}
      <footer className="border-t border-border bg-background py-6 text-center text-xs text-muted-foreground mt-12 print:hidden">
        <p>© 2026 iCademia Educational Registry · Public School Credentials & WHOIS Service</p>
      </footer>
    </div>
  );
}
