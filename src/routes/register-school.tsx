import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Loader2,
  UserRound,
  Eye,
  EyeOff,
  Share2,
  ShieldCheck,
  FileCheck2,
  Scale,
  CreditCard,
  Lock,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { registerSchoolDb } from "@/lib/api/db.functions";

export const Route = createFileRoute("/register-school")({
  head: () => ({
    meta: [
      { title: "Register your school — iCademia" },
      {
        name: "description",
        content:
          "Create a secure iCademia workspace for your school, administrators, teachers and students.",
      },
    ],
  }),
  component: RegisterSchool,
});

const steps = [
  { title: "School", description: "Institution details", icon: Building2 },
  { title: "Administrator", description: "Account owner", icon: UserRound },
  { title: "Review", description: "Confirm and submit", icon: Check },
];

const CUSTOM_LOCATION_VALUE = "__custom";
const ONBOARDING_DRAFT_KEY = "icademia:onboarding-draft:v1";

type OnboardingDraft = {
  step?: number;
  accepted?: boolean;
  name?: string;
  type?: string;
  motto?: string;
  selectedState?: string;
  customState?: string;
  selectedCity?: string;
  customCity?: string;
  address?: string;
  adminName?: string;
  adminEmail?: string;
  adminPhone?: string;
  studentCount?: string;
  referralCode?: string;
};

const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "Federal Capital Territory",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const stateCities: Record<string, string[]> = {
  Abia: ["Aba", "Umuahia", "Ohafia", "Arochukwu"],
  Adamawa: ["Yola", "Mubi", "Numan", "Jimeta"],
  "Akwa Ibom": ["Uyo", "Eket", "Ikot Ekpene", "Oron"],
  Anambra: ["Awka", "Onitsha", "Nnewi", "Ekwulobia"],
  Bauchi: ["Bauchi", "Azare", "Misau", "Jama'are"],
  Bayelsa: ["Yenagoa", "Brass", "Ogbia", "Sagbama"],
  Benue: ["Makurdi", "Gboko", "Otukpo", "Katsina-Ala"],
  Borno: ["Maiduguri", "Biu", "Monguno", "Dikwa"],
  "Cross River": ["Calabar", "Ikom", "Ogoja", "Ugep"],
  Delta: ["Asaba", "Warri", "Sapele", "Ughelli"],
  Ebonyi: ["Abakaliki", "Afikpo", "Onueke", "Ishieke"],
  Edo: ["Benin City", "Auchi", "Ekpoma", "Uromi"],
  Ekiti: ["Ado-Ekiti", "Ikere-Ekiti", "Iworoko", "Efon-Alaaye"],
  Enugu: ["Enugu", "Nsukka", "Agbani", "Udi"],
  "Federal Capital Territory": ["Abuja", "Gwagwalada", "Kubwa", "Kuje"],
  Gombe: ["Gombe", "Kaltungo", "Billiri", "Dukku"],
  Imo: ["Owerri", "Orlu", "Okigwe", "Mbaise"],
  Jigawa: ["Dutse", "Hadejia", "Gumel", "Kazaure"],
  Kaduna: ["Kaduna", "Zaria", "Kafanchan", "Kagoro"],
  Kano: ["Kano", "Wudil", "Gwarzo", "Bichi"],
  Katsina: ["Katsina", "Daura", "Funtua", "Dutsin-Ma"],
  Kebbi: ["Birnin Kebbi", "Argungu", "Yauri", "Zuru"],
  Kogi: ["Lokoja", "Okene", "Kabba", "Idah"],
  Kwara: ["Ilorin", "Offa", "Omu-Aran", "Jebba"],
  Lagos: ["Ikeja", "Lagos Island", "Lekki", "Surulere", "Epe", "Ikorodu", "Badagry"],
  Nasarawa: ["Lafia", "Keffi", "Akwanga", "Karu"],
  Niger: ["Minna", "Bida", "Suleja", "Kontagora"],
  Ogun: ["Abeokuta", "Ijebu Ode", "Sagamu", "Ota"],
  Ondo: ["Akure", "Ondo", "Owo", "Ikare-Akoko"],
  Osun: ["Osogbo", "Ile-Ife", "Ilesa", "Ede"],
  Oyo: ["Ibadan", "Ogbomoso", "Oyo", "Iseyin"],
  Plateau: ["Jos", "Bukuru", "Pankshin", "Shendam"],
  Rivers: ["Port Harcourt", "Obio-Akpor", "Bonny", "Ahoada"],
  Sokoto: ["Sokoto", "Tambuwal", "Wurno", "Gwadabawa"],
  Taraba: ["Jalingo", "Wukari", "Bali", "Takum"],
  Yobe: ["Damaturu", "Potiskum", "Nguru", "Gashua"],
  Zamfara: ["Gusau", "Kaura Namoda", "Talata Mafara", "Anka"],
};

function RegisterSchool() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Creating workspace…");
  const [done, setDone] = useState<{
    registryId: string;
    emailDelivery?: "sent" | "not_configured" | "delayed" | "failed";
  } | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [openAgreementClause, setOpenAgreementClause] = useState<string | null>("clause-1");
  const [name, setName] = useState("");
  const [type, setType] = useState("secondary");
  const [motto, setMotto] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [customState, setCustomState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [address, setAddress] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [studentCount, setStudentCount] = useState("500-1000");
  const [adminPassword, setAdminPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [refAutoFilled, setRefAutoFilled] = useState(false);
  const progress = Math.round((step / steps.length) * 100);

  const stateName = selectedState === CUSTOM_LOCATION_VALUE ? customState.trim() : selectedState;
  const cityName = selectedCity === CUSTOM_LOCATION_VALUE ? customCity.trim() : selectedCity;
  const location = [cityName, stateName].filter(Boolean).join(", ");
  const cityOptions = selectedState ? stateCities[selectedState] || [] : [];

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(ONBOARDING_DRAFT_KEY);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as OnboardingDraft;
      if (draft.step && draft.step >= 1 && draft.step <= steps.length) setStep(draft.step);
      if (typeof draft.accepted === "boolean") setAccepted(draft.accepted);
      if (draft.name) setName(draft.name);
      if (draft.type) setType(draft.type);
      if (draft.motto) setMotto(draft.motto);
      if (draft.selectedState) setSelectedState(draft.selectedState);
      if (draft.customState) setCustomState(draft.customState);
      if (draft.selectedCity) setSelectedCity(draft.selectedCity);
      if (draft.customCity) setCustomCity(draft.customCity);
      if (draft.address) setAddress(draft.address);
      if (draft.adminName) setAdminName(draft.adminName);
      if (draft.adminEmail) setAdminEmail(draft.adminEmail);
      if (draft.adminPhone) setAdminPhone(draft.adminPhone);
      if (draft.studentCount) setStudentCount(draft.studentCount);
      if (draft.referralCode) setReferralCode(draft.referralCode);
    } catch {
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    if (done) return;
    const draft: OnboardingDraft = {
      step,
      accepted,
      name,
      type,
      motto,
      selectedState,
      customState,
      selectedCity,
      customCity,
      address,
      adminName,
      adminEmail,
      adminPhone,
      studentCount,
      referralCode,
    };
    window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  }, [
    accepted,
    address,
    adminEmail,
    adminName,
    adminPhone,
    customCity,
    customState,
    done,
    motto,
    name,
    referralCode,
    selectedCity,
    selectedState,
    step,
    studentCount,
    type,
  ]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get("ref") || params.get("referral");
      if (refParam) {
        const cleanRef = refParam.trim().toUpperCase();
        setReferralCode(cleanRef);
        setRefAutoFilled(true);
      }
    }
  }, []);

  const canContinue = useMemo(() => {
    if (step === 1) {
      return (
        name.trim().length >= 2 &&
        stateName.length >= 2 &&
        cityName.length >= 2 &&
        address.trim().length >= 5
      );
    }
    if (step === 2) {
      return (
        adminName.trim().length >= 2 && /\S+@\S+\.\S+/.test(adminEmail) && adminPassword.length >= 8
      );
    }
    return accepted;
  }, [accepted, address, adminEmail, adminName, adminPassword, cityName, name, stateName, step]);

  const submit = async () => {
    if (!accepted) return;
    setLoading(true);
    setLoadingMessage("Creating secure workspace…");
    const progressTimer = window.setTimeout(() => {
      setLoadingMessage("Still setting things up…");
    }, 1800);
    let timeoutTimer: number | undefined;
    try {
      const result = await Promise.race([
        registerSchoolDb({
          data: {
            name,
            type,
            motto,
            city: location,
            address,
            adminName,
            adminEmail,
            adminPhone,
            studentCount,
            adminPassword,
            referralCode: referralCode.trim() || undefined,
          },
        }),
        new Promise<never>((_, reject) => {
          timeoutTimer = window.setTimeout(() => {
            reject(
              new Error(
                "The signup service is taking too long to respond. Please check the database connection and try again.",
              ),
            );
          }, 20000);
        }),
      ]);
      setDone({ registryId: result.registryId, emailDelivery: result.emailDelivery });
      window.localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      toast.success("School workspace created");
    } catch (error) {
      toast.error("Registration failed", {
        description: error instanceof Error ? error.message : "Please review your details.",
      });
    } finally {
      window.clearTimeout(progressTimer);
      if (timeoutTimer) window.clearTimeout(timeoutTimer);
      setLoading(false);
      setLoadingMessage("Creating workspace…");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-[#f4f7fb]">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">
              School onboarding
            </p>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">
              Your school workspace, one clear step at a time.
            </h1>
            <p className="mt-4 text-muted-foreground">
              Enter only the essentials now. We generate a unique School Registry ID automatically;
              staff, students, subjects and branding can be added after verification.
            </p>
          </div>

          {done ? (
            <Card className="mx-auto mt-10 max-w-2xl border-success/20 p-8 text-center shadow-elegant">
              <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
              <h2 className="mt-5 font-display text-2xl font-bold">
                Check your administrator email
              </h2>
              <p className="mt-2 text-muted-foreground">
                {done.emailDelivery === "delayed" || done.emailDelivery === "failed"
                  ? "Your workspace is ready. The verification email may take a little longer to arrive; please check your inbox and spam folder shortly."
                  : "Your workspace is ready. Use the 24-hour verification link before signing in."}
              </p>
              <div className="mx-auto mt-6 max-w-sm rounded-xl bg-muted p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  School Registry ID
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-primary">{done.registryId}</p>
              </div>
              <Button asChild className="mt-7 w-full sm:w-auto">
                <Link to="/login">Continue to sign in</Link>
              </Button>
            </Card>
          ) : (
            <Card className="mx-auto mt-10 max-w-4xl overflow-hidden border-white/80 shadow-[0_24px_70px_-30px_rgba(7,26,46,0.3)]">
              <div className="border-b border-border bg-[#071a2e] px-5 py-6 text-white sm:px-8">
                <div className="flex items-center justify-between text-xs">
                  <span>
                    Step {step} of {steps.length}
                  </span>
                  <span>{progress}% complete</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/15">
                  <div
                    className="h-full rounded-full bg-[#e0bd6a] transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="mt-3 text-[11px] text-white/60">
                  Draft saved on this device. For security, your password is not saved.
                </p>
                <div className="mt-6 grid grid-cols-3 gap-2">
                  {steps.map((item, index) => {
                    const number = index + 1;
                    const active = number === step;
                    const complete = number < step;
                    return (
                      <div key={item.title} className="flex items-center gap-2">
                        <span
                          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                            active
                              ? "bg-[#e0bd6a] text-[#071a2e]"
                              : complete
                                ? "bg-success text-white"
                                : "bg-white/10 text-white/50"
                          }`}
                        >
                          {complete ? <Check className="h-4 w-4" /> : number}
                        </span>
                        <div className="hidden sm:block">
                          <p
                            className={
                              active || complete ? "text-sm font-semibold" : "text-sm text-white/45"
                            }
                          >
                            {item.title}
                          </p>
                          <p className="text-xs text-white/40">{item.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-5 sm:p-8">
                {step === 1 && (
                  <StepSection
                    title="Tell us about the school"
                    description="No identifier is required. iCademia creates a school-specific Registry ID after registration."
                  >
                    <FormGroup title="School identity">
                      <Field
                        label="School name"
                        placeholder="Britarch Secondary School"
                        required
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                      />
                      <SelectField
                        label="School type"
                        value={type}
                        onValueChange={setType}
                        options={[
                          ["primary", "Primary"],
                          ["secondary", "Secondary"],
                          ["both", "Primary & Secondary"],
                          ["college", "College / Tertiary"],
                        ]}
                      />
                      <Field
                        label="School motto"
                        placeholder="Knowledge · Integrity · Service"
                        value={motto}
                        onChange={(event) => setMotto(event.target.value)}
                      />
                    </FormGroup>
                    <FormGroup title="School location">
                      <SelectField
                        label="State"
                        value={selectedState}
                        onValueChange={(value) => {
                          setSelectedState(value);
                          setSelectedCity("");
                          setCustomCity("");
                        }}
                        placeholder="Select state"
                        options={[
                          ...nigerianStates.map((state) => [state, state] as [string, string]),
                          [CUSTOM_LOCATION_VALUE, "State not listed"],
                        ]}
                      />
                      {selectedState === CUSTOM_LOCATION_VALUE && (
                        <Field
                          label="Enter state / region"
                          placeholder="Enter your state, province or region"
                          required
                          value={customState}
                          onChange={(event) => setCustomState(event.target.value)}
                        />
                      )}
                      <SelectField
                        label="City"
                        value={selectedCity}
                        onValueChange={setSelectedCity}
                        placeholder={selectedState ? "Select city" : "Select state first"}
                        disabled={!selectedState}
                        options={[
                          ...cityOptions.map((city) => [city, city] as [string, string]),
                          [CUSTOM_LOCATION_VALUE, "City not listed"],
                        ]}
                      />
                      {selectedCity === CUSTOM_LOCATION_VALUE && (
                        <Field
                          label="Enter city / town"
                          placeholder="Enter city, town or LGA"
                          required
                          value={customCity}
                          onChange={(event) => setCustomCity(event.target.value)}
                        />
                      )}
                      <div className="sm:col-span-2">
                        <Field
                          label="Campus address"
                          placeholder="Plot 18 School Road, New Owerri"
                          required
                          value={address}
                          onChange={(event) => setAddress(event.target.value)}
                        />
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          Used for registry verification, delivery, school profile and official
                          result documents.
                        </p>
                      </div>
                    </FormGroup>
                    <FormGroup title="Operational details">
                      <SelectField
                        label="Approximate student count"
                        value={studentCount}
                        onValueChange={setStudentCount}
                        options={[
                          ["<200", "Under 200"],
                          ["200-500", "200 – 500"],
                          ["500-1000", "500 – 1,000"],
                          [">1000", "Over 1,000"],
                        ]}
                      />
                      <div>
                        <Field
                          label="Referral code (optional)"
                          placeholder="ICA-REF-XXXXXXXX"
                          value={referralCode}
                          onChange={(event) => {
                            setReferralCode(event.target.value.toUpperCase());
                            setRefAutoFilled(false);
                          }}
                        />
                        {refAutoFilled && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-success font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Referral code applied automatically from link!
                          </p>
                        )}
                      </div>
                    </FormGroup>
                  </StepSection>
                )}

                {step === 2 && (
                  <StepSection
                    title="Create the administrator account"
                    description="This person becomes the first authorised owner of the school workspace."
                  >
                    <Field
                      label="Administrator full name"
                      placeholder="Amaka Okafor"
                      required
                      value={adminName}
                      onChange={(event) => setAdminName(event.target.value)}
                    />
                    <Field
                      label="Administrator email"
                      type="email"
                      placeholder="admin@yourschool.edu"
                      required
                      value={adminEmail}
                      onChange={(event) => setAdminEmail(event.target.value)}
                    />
                    <Field
                      label="Administrator phone"
                      placeholder="+234 800 000 0000"
                      value={adminPhone}
                      onChange={(event) => setAdminPhone(event.target.value)}
                    />
                    <Field
                      label="Create password"
                      type="password"
                      placeholder="At least 8 characters"
                      required
                      value={adminPassword}
                      onChange={(event) => setAdminPassword(event.target.value)}
                    />
                  </StepSection>
                )}

                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold">
                        Review & Institutional Agreement
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Review your school workspace setup and confirm the institutional operating
                        agreement.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 rounded-2xl bg-muted/40 p-4 border border-border">
                      <Review label="School Name" value={name} />
                      <Review
                        label="School Tier"
                        value={
                          type === "secondary"
                            ? "Secondary School (JSS/SSS)"
                            : type === "primary"
                              ? "Primary School (Basic 1-6)"
                              : type === "both"
                                ? "Primary & Secondary Combined"
                                : type
                        }
                      />
                      <Review label="Location" value={location} />
                      <Review label="Address" value={address} />
                      <Review label="Student Body Size" value={studentCount} />
                      <Review label="Designated Administrator" value={adminName} />
                      <Review label="Official Admin Email" value={adminEmail} />
                    </div>

                    {/* ── Institutional Onboarding Agreement ── */}
                    <div className="rounded-2xl border border-primary/20 bg-primary/[0.02] p-5 sm:p-6 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                          <FileCheck2 className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm sm:text-base">
                            Institutional Workspace Agreement
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Review the operating clauses that govern your school workspace before
                            creating the portal.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border bg-background/80 p-4 text-xs leading-6 text-muted-foreground">
                        This summary forms part of the onboarding acceptance for the institution
                        named above. It should be read together with the iCademia Terms of Service
                        and Privacy Policy. Where a signed school agreement exists, that signed
                        agreement takes precedence for the matters it expressly covers.
                      </div>

                      <div className="space-y-2.5 pt-1">
                        <AgreementCategoryCard
                          icon={Building2}
                          id="clause-1"
                          open={openAgreementClause === "clause-1"}
                          onToggle={setOpenAgreementClause}
                          badge="Clause 1"
                          title="Authority to register the institution"
                          points={[
                            "The registering person confirms that they are at least 18 years old and authorised by the school, proprietor, board, principal or delegated leadership to create this workspace.",
                            "The school information supplied during onboarding must be accurate, current and capable of verification where required.",
                            "If school leadership changes, the school is responsible for notifying iCademia and completing the required administrator-transfer checks.",
                          ]}
                        />

                        <AgreementCategoryCard
                          icon={ShieldCheck}
                          id="clause-2"
                          open={openAgreementClause === "clause-2"}
                          onToggle={setOpenAgreementClause}
                          badge="Clause 2"
                          title="School responsibilities"
                          points={[
                            "The school remains responsible for student enrolment records, staff access decisions, academic calendars, grading rules, result approval and communication with parents or guardians.",
                            "The school must ensure that only authorised staff receive workspace access and that accounts are removed or changed when staff roles change.",
                            "The school is responsible for checking uploaded records before publication and for requesting corrections where an error is discovered.",
                          ]}
                        />

                        <AgreementCategoryCard
                          icon={Lock}
                          id="clause-3"
                          open={openAgreementClause === "clause-3"}
                          onToggle={setOpenAgreementClause}
                          badge="Clause 3"
                          title="Student data, privacy and child protection"
                          points={[
                            "Student biodata, assessment records, attendance data, photographs, uploaded scripts and related school records are processed only for authorised school-management purposes.",
                            "iCademia does not sell student records. Limited processing by hosting, storage, payment, email, AI or support providers may occur only where needed to deliver and protect the service.",
                            "The school must obtain any internal permissions or notices required for the lawful use of student, parent, guardian and staff information on the platform.",
                          ]}
                        />

                        <AgreementCategoryCard
                          icon={Scale}
                          id="clause-4"
                          open={openAgreementClause === "clause-4"}
                          onToggle={setOpenAgreementClause}
                          badge="Clause 4"
                          title="Academic records, results and publication control"
                          points={[
                            "The school warrants that scores, comments, positions, attendance, psychomotor details and uploaded documents supplied to iCademia are genuine and authorised.",
                            "iCademia may calculate, format, summarise or display academic information from school-supplied data, but final academic responsibility remains with the school.",
                            "Publication may be blocked until expected subjects are submitted or formally waived by the School Admin with a clear administrative reason.",
                            "Student or parent access to a result remains subject to the school’s publication settings, restrictions and identity checks, even where an access card exists.",
                          ]}
                        />

                        <AgreementCategoryCard
                          icon={UserRound}
                          id="clause-5"
                          open={openAgreementClause === "clause-5"}
                          onToggle={setOpenAgreementClause}
                          badge="Clause 5"
                          title="Users, staff access and administrator control"
                          points={[
                            "The School Admin controls school setup, staff invitations, Head Teacher access, result publication, restrictions, school settings and operational oversight.",
                            "Head Teachers may access only the academic workspace and classes assigned to them by the School Admin.",
                            "Ordinary teaching staff may be recorded for timetable, subjects and class responsibility without automatically receiving Head Teacher workspace access.",
                          ]}
                        />

                        <AgreementCategoryCard
                          icon={CreditCard}
                          id="clause-6"
                          open={openAgreementClause === "clause-6"}
                          onToggle={setOpenAgreementClause}
                          badge="Clause 6"
                          title="Access cards, billing and delivery"
                          points={[
                            "Access cards are school-scoped credentials used by students or guardians to view services that the school has approved for release.",
                            "A card may provide 365-day access from activation, subject to school restrictions, platform terms, valid identity checks and any written arrangement with the school.",
                            "Physical card delivery, replacement, refunds and reconciliation are handled according to the applicable order details, payment confirmation and iCademia Terms of Service.",
                          ]}
                        />

                        <AgreementCategoryCard
                          icon={Info}
                          id="clause-7"
                          open={openAgreementClause === "clause-7"}
                          onToggle={setOpenAgreementClause}
                          badge="Clause 7"
                          title="AI-assisted features"
                          points={[
                            "AI features may assist with summaries, result interpretation, study guidance, quiz drafting, workload observations and operational recommendations.",
                            "Student-facing AI explanations and quizzes are available only from result records that the school has approved and published, and may be withdrawn if result access is restricted.",
                            "AI outputs are advisory and may be incomplete or inaccurate. They must be reviewed by authorised school personnel before being used for decisions or communication.",
                            "AI should not be used as the sole basis for promotion, discipline, admission, employment, safeguarding or other high-impact school decisions.",
                          ]}
                        />

                        <AgreementCategoryCard
                          icon={ShieldCheck}
                          id="clause-8"
                          open={openAgreementClause === "clause-8"}
                          onToggle={setOpenAgreementClause}
                          badge="Clause 8"
                          title="Service operation, support and record keeping"
                          points={[
                            "iCademia will take reasonable steps to provide a secure and reliable school-management service, including administrative traceability and relevant operational logs.",
                            "Service availability may be affected by maintenance, internet connectivity, hosting providers, school configuration or events outside reasonable control.",
                            "Support may be provided through in-app, email, phone or messaging channels depending on the issue, plan and urgency.",
                          ]}
                        />

                        <AgreementCategoryCard
                          icon={Scale}
                          id="clause-9"
                          open={openAgreementClause === "clause-9"}
                          onToggle={setOpenAgreementClause}
                          badge="Clause 9"
                          title="Suspension, correction and termination"
                          points={[
                            "iCademia may restrict, suspend or review access where required to protect students, investigate misuse, address unpaid services, respond to legal obligations or prevent harm.",
                            "The school may request correction, export or termination of its workspace subject to identity verification, outstanding orders and lawful record-retention requirements.",
                            "Corrections to published academic records must be authorised by the school and may remain traceable for audit and accountability.",
                          ]}
                        />

                        <AgreementCategoryCard
                          icon={FileCheck2}
                          id="clause-10"
                          open={openAgreementClause === "clause-10"}
                          onToggle={setOpenAgreementClause}
                          badge="Clause 10"
                          title="Acceptance record"
                          points={[
                            "By creating the workspace, the accepting administrator confirms authority to bind or act for the named school for onboarding purposes.",
                            "The platform may record the accepting administrator’s name, email, school, date, time, IP-related metadata and agreement version for accountability.",
                            "Continued use of the workspace is subject to the Terms of Service, Privacy Policy and any later written agreement signed with the school.",
                          ]}
                        />
                      </div>

                      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border-2 border-primary/20 bg-background p-4 text-sm leading-6 transition-colors hover:border-primary/40">
                        <input
                          type="checkbox"
                          checked={accepted}
                          onChange={(event) => setAccepted(event.target.checked)}
                          className="mt-1 h-5 w-5 accent-primary cursor-pointer rounded"
                        />
                        <span className="font-medium text-foreground text-xs sm:text-sm">
                          I have reviewed and agree to the{" "}
                          <span className="text-primary font-semibold">
                            Institutional Onboarding Agreement
                          </span>
                          , including the{" "}
                          <Link
                            to="/terms"
                            target="_blank"
                            className="font-semibold text-primary hover:underline"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            to="/privacy"
                            target="_blank"
                            className="font-semibold text-primary hover:underline"
                          >
                            Privacy Policy
                          </Link>
                          . I confirm authorisation to register this school.
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={step === 1 || loading}
                    onClick={() => setStep((current) => current - 1)}
                    className="w-full sm:w-auto"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  {step < 3 ? (
                    <Button
                      type="button"
                      disabled={!canContinue}
                      onClick={() => setStep((current) => current + 1)}
                      className="w-full sm:w-auto"
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      disabled={!canContinue || loading}
                      onClick={submit}
                      className="w-full sm:w-auto"
                    >
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <span className="min-w-0 truncate">
                        {loading ? loadingMessage : "Create school workspace"}
                      </span>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function StepSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function FormGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/20 p-4 sm:col-span-2 sm:p-5">
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-4 grid gap-5 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  type = "text",
  placeholder,
  required,
  value,
  onChange,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={isPassword && show ? "text" : type}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
          className={`mt-2 ${isPassword ? "pr-10" : ""}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground mt-1"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Select option",
  disabled = false,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<[string, string]>;
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className="mt-2">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(([optionValue, labelText]) => (
            <SelectItem key={optionValue} value={optionValue}>
              {labelText}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Review({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium capitalize">{value || "Not provided"}</p>
    </div>
  );
}

function AgreementCategoryCard({
  icon: Icon,
  id,
  open,
  onToggle,
  badge,
  title,
  points,
}: {
  icon: React.ComponentType<{ className?: string }>;
  id: string;
  open: boolean;
  onToggle: (id: string | null) => void;
  badge: string;
  title: string;
  points: string[];
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-background/90 overflow-hidden transition-all shadow-xs">
      <button
        type="button"
        onClick={() => onToggle(open ? null : id)}
        className="w-full flex items-center justify-between p-3.5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary mr-2 bg-primary/10 px-1.5 py-0.5 rounded">
              {badge}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-foreground">{title}</span>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-3.5 pt-1 border-t border-border/40 bg-muted/10">
          <ul className="space-y-1.5 text-xs text-muted-foreground">
            {points.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
