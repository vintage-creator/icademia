import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — iCademia" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6 p-8">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">School profile, security, and result-checker preferences.</p>
      </header>

      <Card className="border-border p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">School profile</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div><Label>School name</Label><Input defaultValue="Britarch Secondary School" className="mt-2" /></div>
          <div><Label>Motto</Label><Input defaultValue="Knowledge · Integrity · Service" className="mt-2" /></div>
          <div><Label>Address</Label><Input defaultValue="14 Akin Adesola Street, Victoria Island" className="mt-2" /></div>
          <div><Label>Contact email</Label><Input defaultValue="admin@britarch.edu" className="mt-2" /></div>
        </div>
      </Card>

      <Card className="border-border p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">Security</h2>
        <div className="mt-5 space-y-4">
          <Toggle title="Require 2-factor authentication for staff" desc="Send a one-time code by SMS or authenticator app on sign in." defaultOn />
          <Toggle title="Single-use scratch-card PINs" desc="Each PIN unlocks a result once. Disable to allow up to 5 uses." defaultOn />
          <Toggle title="Email parents when results are published" desc="Sends a notification with PIN and instructions." />
        </div>
      </Card>

      <div className="flex justify-end">
        <Button className="gradient-primary text-primary-foreground shadow-elegant">Save changes</Button>
      </div>
    </div>
  );
}

function Toggle({ title, desc, defaultOn }: { title: string; desc: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <Switch defaultChecked={defaultOn} />
    </div>
  );
}
