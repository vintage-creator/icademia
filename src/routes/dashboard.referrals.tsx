import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  Gift,
  Loader2,
  School,
  WalletCards,
  Link as LinkIcon,
  Share2,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getReferralDashboardDb } from "@/lib/api/db.functions";
import { getSchoolCode } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/referrals")({
  head: () => ({ meta: [{ title: "School Referrals — iCademia" }] }),
  component: ReferralsPage,
});

type Referral = {
  id: number;
  school_name: string;
  school_code: string;
  status: string;
  enrolled_students: number;
  estimated_reward: number;
  paid_at?: string | null;
};

function ReferralsPage() {
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    getReferralDashboardDb({ data: { schoolCode: getSchoolCode() } })
      .then((result) => {
        setReferralCode(result.referralCode ?? "");
        setReferrals(result.referrals as unknown as Referral[]);
      })
      .catch((error) =>
        toast.error(error instanceof Error ? error.message : "Could not load referrals."),
      )
      .finally(() => setLoading(false));
  }, []);

  const total = referrals.reduce((sum, referral) => sum + Number(referral.estimated_reward), 0);

  const getReferralLink = () => {
    if (typeof window === "undefined" || !referralCode) return "";
    return `${window.location.origin}/register-school?ref=${referralCode}`;
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success("Referral ID copied!");
    window.setTimeout(() => setCopiedCode(false), 1500);
  };

  const copyLink = async () => {
    const link = getReferralLink();
    await navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success("Referral signup link copied to clipboard!");
    window.setTimeout(() => setCopiedLink(false), 1500);
  };

  return (
    <div className="space-y-7 p-4 sm:p-6 lg:p-8">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Partner growth
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold">
          Help another school move forward.
        </h1>
        <p className="mt-2 leading-7 text-muted-foreground">
          Share what works. When a referred school successfully onboards, your school earns ₦200 for
          every student enrolled by that school.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric icon={School} label="Schools referred" value={String(referrals.length)} />
        <Metric icon={WalletCards} label="Tracked reward" value={`₦${total.toLocaleString()}`} />
        <Metric icon={Gift} label="Reward formula" value="₦200 × students" />
      </div>

      <Card className="overflow-hidden border-border shadow-card">
        <div className="grid gap-6 bg-[#07111f] p-6 text-white lg:grid-cols-[1fr_auto] lg:items-center sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d6a84b]">
              Your school referral ID & Link
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="font-mono text-2xl font-bold tracking-wider">
                {loading ? "Loading…" : referralCode}
              </span>
              {referralCode && (
                <button
                  type="button"
                  onClick={() => void copyCode()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-xs text-white/80 transition-colors hover:bg-white/20"
                >
                  {copiedCode ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedCode ? "Code Copied" : "Copy Code"}
                </button>
              )}
            </div>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
              Share your direct signup link with school administrators. When they register using
              your link, your referral ID is automatically applied and tracked.
            </p>
            {referralCode && (
              <p className="mt-2 font-mono text-xs text-[#d6a84b]/90 truncate max-w-xl bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                {getReferralLink()}
              </p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <Button
              onClick={() => void copyLink()}
              disabled={!referralCode}
              className="bg-[#d6a84b] text-[#07111f] hover:bg-[#e0bd6a] font-semibold gap-2 shadow-lg"
            >
              {copiedLink ? <Check className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
              {copiedLink ? "Link Copied!" : "Copy Shareable Link"}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="border-border p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">Referral activity</h2>
        {loading ? (
          <div className="grid min-h-48 place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="py-12 text-center">
            <School className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No referred school yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Share your referral ID with a school administrator you trust.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-3">School</th>
                    <th>Students</th>
                    <th>Status</th>
                    <th className="text-right">Tracked reward</th>
                  </tr>
                </thead>
                <tbody>
                  {referrals.map((referral) => (
                    <tr key={referral.id} className="border-b border-border/60">
                      <td className="py-3">
                        <p className="font-medium">{referral.school_name}</p>
                        <p className="font-mono text-xs text-muted-foreground">
                          {referral.school_code}
                        </p>
                      </td>
                      <td>{referral.enrolled_students}</td>
                      <td>{referral.paid_at ? "Paid" : referral.status}</td>
                      <td className="text-right font-semibold">
                        ₦{Number(referral.estimated_reward).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid gap-3 sm:hidden">
              {referrals.map((referral) => (
                <article key={referral.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{referral.school_name}</p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {referral.school_code}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                      {referral.paid_at ? "Paid" : referral.status}
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3 text-xs">
                    <div>
                      <p className="text-muted-foreground">Students</p>
                      <p className="mt-1 font-semibold">{referral.enrolled_students}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Tracked reward</p>
                      <p className="mt-1 font-semibold">
                        ₦{Number(referral.estimated_reward).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof School;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-border p-5 shadow-card">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
    </Card>
  );
}
