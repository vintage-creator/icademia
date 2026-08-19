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

function RegisterSchool() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<{ schoolCode: string } | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("secondary");
  const [motto, setMotto] = useState("");
  const [city, setCity] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPhone, setAdminPhone] = useState("");
  const [studentCount, setStudentCount] = useState("500-1000");
  const [adminPassword, setAdminPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [refAutoFilled, setRefAutoFilled] = useState(false);
  const progress = Math.round((step / steps.length) * 100);

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
    if (step === 1) return name.trim().length >= 2 && city.trim().length >= 2;
    if (step === 2) {
      return (
        adminName.trim().length >= 2 && /\S+@\S+\.\S+/.test(adminEmail) && adminPassword.length >= 8
      );
    }
    return accepted;
  }, [accepted, adminEmail, adminName, adminPassword, city, name, step]);

  const submit = async () => {
    if (!accepted) return;
    setLoading(true);
    try {
      const result = await registerSchoolDb({
        data: {
          name,
          type,
          motto,
          city,
          adminName,
          adminEmail,
          adminPhone,
          studentCount,
          adminPassword,
          referralCode: referralCode.trim() || undefined,
        },
      });
      setDone({ schoolCode: result.schoolCode });
      toast.success("School workspace created");
    } catch (error) {
      toast.error("Registration failed", {
        description: error instanceof Error ? error.message : "Please review your details.",
      });
    } finally {
      setLoading(false);
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
              You can add teachers, subjects, classes, students and branding after verification.
            </p>
          </div>

          {done ? (
            <Card className="mx-auto mt-10 max-w-2xl border-success/20 p-8 text-center shadow-elegant">
              <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
              <h2 className="mt-5 font-display text-2xl font-bold">
                Check your administrator email
              </h2>
              <p className="mt-2 text-muted-foreground">
                Your workspace is ready. Use the 24-hour verification link before signing in.
              </p>
              <div className="mx-auto mt-6 max-w-sm rounded-xl bg-muted p-5">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  School code
                </p>
                <p className="mt-2 font-mono text-2xl font-bold text-primary">{done.schoolCode}</p>
              </div>
              <Button asChild className="mt-7">
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
                    description="These details identify the institution and prepare its workspace."
                  >
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
                        ["college", "College / Tertiary"],
                      ]}
                    />
                    <Field
                      label="School motto"
                      placeholder="Knowledge · Integrity · Service"
                      value={motto}
                      onChange={(event) => setMotto(event.target.value)}
                    />
                    <Field
                      label="City / State"
                      placeholder="Lagos, Nigeria"
                      required
                      value={city}
                      onChange={(event) => setCity(event.target.value)}
                    />
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
                  <div>
                    <h2 className="font-display text-2xl font-bold">Review your information</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Confirm the details before creating the workspace.
                    </p>
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Review label="School" value={name} />
                      <Review label="Type" value={type} />
                      <Review label="Location" value={city} />
                      <Review label="Students" value={studentCount} />
                      <Review label="Administrator" value={adminName} />
                      <Review label="Email" value={adminEmail} />
                    </div>
                    <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm leading-6">
                      <input
                        type="checkbox"
                        checked={accepted}
                        onChange={(event) => setAccepted(event.target.checked)}
                        className="mt-1 h-4 w-4 accent-primary"
                      />
                      <span>
                        I confirm that I am authorised to register this school and agree to the{" "}
                        <Link to="/terms" className="font-semibold text-primary hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="font-semibold text-primary hover:underline">
                          Privacy Policy
                        </Link>
                        .
                      </span>
                    </label>
                  </div>
                )}

                <div className="mt-8 flex items-center justify-between border-t border-border pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={step === 1 || loading}
                    onClick={() => setStep((current) => current - 1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  {step < 3 ? (
                    <Button
                      type="button"
                      disabled={!canContinue}
                      onClick={() => setStep((current) => current + 1)}
                    >
                      Continue <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" disabled={!canContinue || loading} onClick={submit}>
                      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {loading ? "Creating workspace…" : "Create school workspace"}
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
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="mt-2">
          <SelectValue />
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
