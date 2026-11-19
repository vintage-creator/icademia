import { useState } from "react";
import { Building2, CheckCircle2, Copy, Loader2, MailPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPartnerSchoolDb } from "@/lib/api/team-operations.functions";

type CreatedSchool = {
  school: { name: string; city: string; school_code: string; registry_id: string };
  inviteSent: boolean;
  setupLink: string;
  expiresInHours: number;
};

type Props = { adminKey: string; onCreated: () => void | Promise<void> };

const initialForm = {
  name: "",
  type: "Secondary School",
  motto: "",
  state: "",
  city: "",
  address: "",
  website: "",
  contactEmail: "",
  contactPhone: "",
  adminName: "",
  adminEmail: "",
  adminPhone: "",
  studentCount: "",
};

export function SchoolInviteForm({ adminKey, onCreated }: Props) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<CreatedSchool | null>(null);

  const update = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setCreated(null);
    try {
      const result = await createPartnerSchoolDb({ data: { adminKey, ...form } });
      setCreated(result as unknown as CreatedSchool);
      setForm(initialForm);
      toast.success("School profile created");
      await onCreated();
    } catch (error) {
      toast.error("Could not create the school profile", {
        description: error instanceof Error ? error.message : "Check the school and administrator details.",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyInvite = async () => {
    if (!created?.setupLink) return;
    try {
      await navigator.clipboard.writeText(created.setupLink);
      toast.success("Secure setup link copied");
    } catch {
      toast.error("Could not copy the link", { description: "Select and copy the link manually." });
    }
  };

  return (
    <Card className="overflow-hidden border-indigo-200 shadow-sm">
      <div className="border-b bg-indigo-50/70 p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-700 text-white"><Building2 className="h-5 w-5" /></span>
          <div>
            <h2 className="font-display text-lg font-semibold">Set up a partner school</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground">
              Enter the details from the school intake form. iCademia creates the profile and sends the administrator a one-time link to set their own password.
            </p>
          </div>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-5 p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><Label htmlFor="partner-school-name">School name</Label><Input id="partner-school-name" className="mt-2" value={form.name} onChange={(event) => update("name", event.target.value)} required minLength={2} maxLength={180} /></div>
          <div>
            <Label htmlFor="partner-school-type">School level</Label>
            <select id="partner-school-type" className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.type} onChange={(event) => update("type", event.target.value)}>
              {["Primary School", "Secondary School", "Primary & Secondary School", "Other"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </div>
          <div><Label htmlFor="partner-school-state">State / region</Label><Input id="partner-school-state" className="mt-2" value={form.state} onChange={(event) => update("state", event.target.value)} /></div>
          <div><Label htmlFor="partner-school-city">Town or city</Label><Input id="partner-school-city" className="mt-2" value={form.city} onChange={(event) => update("city", event.target.value)} required minLength={2} /></div>
          <div><Label htmlFor="partner-admin-name">Administrator name</Label><Input id="partner-admin-name" className="mt-2" value={form.adminName} onChange={(event) => update("adminName", event.target.value)} required minLength={2} /></div>
          <div><Label htmlFor="partner-admin-email">Administrator email</Label><Input id="partner-admin-email" type="email" autoComplete="email" className="mt-2" value={form.adminEmail} onChange={(event) => update("adminEmail", event.target.value)} required /></div>
          <div><Label htmlFor="partner-admin-phone">Administrator phone</Label><Input id="partner-admin-phone" type="tel" className="mt-2" value={form.adminPhone} onChange={(event) => update("adminPhone", event.target.value)} /></div>
          <div><Label htmlFor="partner-student-count">Approximate student count</Label><Input id="partner-student-count" className="mt-2" value={form.studentCount} onChange={(event) => update("studentCount", event.target.value)} placeholder="e.g. 420" /></div>
          <div><Label htmlFor="partner-school-motto">School motto</Label><Input id="partner-school-motto" className="mt-2" value={form.motto} onChange={(event) => update("motto", event.target.value)} /></div>
          <div><Label htmlFor="partner-school-website">Website</Label><Input id="partner-school-website" type="url" className="mt-2" value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="https://" /></div>
          <div><Label htmlFor="partner-school-contact-email">Official school contact email</Label><Input id="partner-school-contact-email" type="email" className="mt-2" value={form.contactEmail} onChange={(event) => update("contactEmail", event.target.value)} /></div>
          <div><Label htmlFor="partner-school-contact-phone">Official school phone</Label><Input id="partner-school-contact-phone" type="tel" className="mt-2" value={form.contactPhone} onChange={(event) => update("contactPhone", event.target.value)} /></div>
        </div>
        <div><Label htmlFor="partner-school-address">School address</Label><Textarea id="partner-school-address" className="mt-2" rows={2} value={form.address} onChange={(event) => update("address", event.target.value)} /></div>
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs leading-5 text-amber-950 sm:flex-row sm:items-start">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>No password is entered here. The school admin receives a private one-time setup link and chooses their own password. If email delivery is not configured, this page provides a link for the iCademia team to share securely.</p>
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MailPlus className="mr-2 h-4 w-4" />}
            {saving ? "Creating profile…" : "Create profile & send setup link"}
          </Button>
        </div>
        {created ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <p className="font-semibold text-emerald-950">{created.school.name} is set up</p>
            <p className="mt-1 text-xs text-emerald-900">School code: <strong>{created.school.school_code}</strong> · Registry ID: <strong>{created.school.registry_id}</strong></p>
            {created.inviteSent ? (
              <p className="mt-2 text-xs text-emerald-900">The administrator setup email was sent. The link expires in 72 hours.</p>
            ) : (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-emerald-900">Email could not be sent. Share this one-time link with the named administrator within 72 hours:</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input aria-label="Administrator setup link" value={created.setupLink} readOnly className="bg-white text-xs" />
                  <Button type="button" variant="outline" onClick={() => void copyInvite()}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </form>
    </Card>
  );
}
