import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Download, KeyRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MOCK_PINS, type PinCard } from "@/lib/mock-data";
import { StatusPill } from "./dashboard.index";

export const Route = createFileRoute("/dashboard/pins")({
  head: () => ({ meta: [{ title: "PIN Cards — ScholarGrade" }] }),
  component: PinsPage,
});

const rand = () =>
  "SRC-" +
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  "-" +
  Math.random().toString(36).slice(2, 6).toUpperCase();

function PinsPage() {
  const [pins, setPins] = useState<PinCard[]>(MOCK_PINS);
  const [count, setCount] = useState(10);

  const generate = () => {
    const start = pins.length + 100001;
    const fresh: PinCard[] = Array.from({ length: count }, (_, i) => ({
      id: String(Date.now() + i),
      pin: rand(),
      serial: `SN-${start + i}`,
      status: "Unused",
      generatedAt: new Date().toISOString().slice(0, 10),
    }));
    setPins([...fresh, ...pins]);
  };

  const total = pins.length;
  const used = pins.filter((p) => p.status === "Used").length;
  const unused = pins.filter((p) => p.status === "Unused").length;

  return (
    <div className="space-y-6 p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Scratch-card PINs</h1>
          <p className="mt-1 text-sm text-muted-foreground">Generate, distribute, and monitor result-checker PINs.</p>
        </div>
        <Button variant="outline"><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Total PINs" value={total} />
        <Stat label="Unused" value={unused} tone="primary" />
        <Stat label="Used" value={used} tone="success" />
      </div>

      <Card className="border-border p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold">Generate new batch</h2>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="qty">Quantity</Label>
            <Input id="qty" type="number" min={1} max={500} value={count} onChange={(e) => setCount(Number(e.target.value))} className="mt-2 w-32 font-mono" />
          </div>
          <Button onClick={generate} className="gradient-primary text-primary-foreground shadow-elegant">
            <Plus className="mr-1 h-4 w-4" /> Generate {count} PINs
          </Button>
          <p className="text-xs text-muted-foreground">PINs are 12 alphanumeric characters with a checksum prefix.</p>
        </div>
      </Card>

      <Card className="border-border p-6 shadow-card">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> All PINs</h2>
        <div className="mt-5 max-h-[28rem] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="py-2.5">Serial</th>
                <th className="py-2.5">PIN</th>
                <th className="py-2.5">Status</th>
                <th className="py-2.5">Used by</th>
                <th className="py-2.5">Generated</th>
              </tr>
            </thead>
            <tbody>
              {pins.map((p) => (
                <tr key={p.id} className="border-b border-border/60 hover:bg-muted/40">
                  <td className="py-3 font-mono text-xs">{p.serial}</td>
                  <td className="py-3 font-mono">{p.pin}</td>
                  <td className="py-3"><StatusPill status={p.status} /></td>
                  <td className="py-3 text-muted-foreground">{p.usedBy ?? "—"}</td>
                  <td className="py-3 text-muted-foreground">{p.generatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const t = tone === "primary" ? "text-primary" : tone === "success" ? "text-success" : "text-foreground";
  return (
    <Card className="border-border p-5 shadow-card">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-3xl font-semibold ${t}`}>{value.toLocaleString()}</p>
    </Card>
  );
}
