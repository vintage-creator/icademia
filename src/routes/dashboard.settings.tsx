import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  Loader2,
  Palette,
  Save,
  UploadCloud,
  PenLine,
  Trash2,
  CheckCircle2,
  User,
  Stamp,
  RefreshCw,
  Droplets,
  ArrowRightLeft,
  History,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Type,
  Image as ImageIcon,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getSchoolProfileDb,
  updateSchoolBrandingDb,
  uploadToCloudinaryDb,
  initiateAdminTransitionDb,
  getAdminTransitionsDb,
  getTeachersForExitDb,
  recordStaffExitDb,
  getStaffExitsDb,
} from "@/lib/api/db.functions";
import { getSchoolCode } from "@/lib/utils";
import { renderStamp } from "@/lib/stampGenerator";

export const Route = createFileRoute("/dashboard/settings")({
  head: () => ({ meta: [{ title: "School Settings — iCademia" }] }),
  component: SettingsPage,
});

const HEAD_TITLES = [
  "Principal",
  "Head Teacher",
  "Head Mistress",
  "Head Master",
  "Proprietress",
  "Proprietor",
  "Director",
  "Rector",
  "Vice Chancellor",
];

const INK_PRESETS = [
  { label: "Official Blue",  color: "#1a3a8f" },
  { label: "Classic Red",    color: "#9b1c1c" },
  { label: "Forest Green",   color: "#14532d" },
  { label: "Royal Purple",   color: "#4c1d95" },
  { label: "Midnight Black", color: "#111827" },
];

// ────────────────────────────────────────────────────────────────────────────────

function SettingsPage() {
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState<"logo" | "signature" | "stamp" | null>(null);

  // Staff exit state
  const [staffExiting,      setStaffExiting]      = useState(false);
  const [showExitForm,      setShowExitForm]       = useState(false);
  const [showExitHistory,   setShowExitHistory]    = useState(false);
  const [staffExits,        setStaffExits]         = useState<any[]>([]);
  const [activeTeachers,    setActiveTeachers]     = useState<any[]>([]);
  const [exitForm, setExitForm] = useState({
    teacherId:     0,
    teacherName:   "",
    teacherSubject: "",
    teacherRole:   "",
    exitType:      "resignation",
    effectiveDate: new Date().toISOString().split("T")[0],
    reason:        "",
    witnessName:   "",
  });

  // Transition state
  const [transitioning,   setTransitioning]   = useState(false);
  const [showTransition,  setShowTransition]   = useState(false);
  const [showHistory,     setShowHistory]      = useState(false);
  const [transitions,     setTransitions]      = useState<any[]>([]);
  const [stampExpanded,   setStampExpanded]    = useState(false);
  const [txForm, setTxForm] = useState({
    outgoingName:   "",
    outgoingTitle:  "Principal",
    incomingName:   "",
    incomingTitle:  "Principal",
    effectiveDate:  new Date().toISOString().slice(0, 10),
    transitionType: "normal",
    reason:         "",
    witnessName:    "",
  });

  const [form, setForm] = useState({
    name:           "",
    type:           "secondary",
    motto:          "",
    city:           "",
    address:        "",
    website:        "",
    adminName:      "",
    adminPhone:     "",
    logoUrl:        "",
    primaryColor:   "#3730A3",
    secondaryColor: "#D6A84B",
    headTitle:      "Principal",
    signatureUrl:   "",
    stampUrl:       "",
    letterheadStyle:"classic-banner",
    contactEmail:   "",
    contactPhone:   "",
    logoPlacement:  "left",
    fontFamily:     "inter",
    fontWeight:     "600",
    fontSizeScale:  "M",
    headerTextColor:"auto",
  });

  // Signature canvas
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const [drawing,        setDrawing]        = useState(false);
  const [canvasStrokes,  setCanvasStrokes]  = useState(false);
  const [sigMode,        setSigMode]        = useState<"draw" | "upload">("draw");
  const lastPos          = useRef<{ x: number; y: number } | null>(null);

  // Stamp canvas
  const stampCanvasRef   = useRef<HTMLCanvasElement>(null);
  const [inkColor,       setInkColor]       = useState("#1a3680");
  const [stampShape,     setStampShape]     = useState<"circle" | "oval" | "rectangle" | "rosette">("circle");
  const [stampSubText,   setStampSubText]   = useState("OFFICIAL SEAL");
  const [stampRendered,  setStampRendered]  = useState(false);
  const [stampGenerating, setStampGenerating] = useState(false);
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);

  // ── Load school profile ──────────────────────────────────────────────────
  useEffect(() => {
    getSchoolProfileDb({ data: { schoolCode: getSchoolCode() } })
      .then((school) => {
        if (!school) return;
        const f = {
          name:           school.name           ?? "",
          type:           school.type           ?? "secondary",
          motto:          school.motto          ?? "",
          city:           school.city           ?? "",
          address:        school.address        ?? "",
          website:        school.website        ?? "",
          adminName:      school.admin_name     ?? "",
          adminPhone:     school.admin_phone    ?? "",
          logoUrl:        school.logo_url       ?? "",
          primaryColor:   school.primary_color  ?? "#3730A3",
          secondaryColor: school.secondary_color?? "#D6A84B",
          headTitle:      (school as any).head_title    ?? "Principal",
          signatureUrl:   (school as any).signature_url ?? "",
          stampUrl:       (school as any).stamp_url     ?? "",
          letterheadStyle:(school as any).letterhead_style ?? "classic-banner",
          contactEmail:   (school as any).contact_email ?? "",
          contactPhone:   (school as any).contact_phone ?? "",
          logoPlacement:  (school as any).logo_placement ?? "left",
          fontFamily:     (school as any).font_family ?? "inter",
          fontWeight:     (school as any).font_weight ?? "600",
          fontSizeScale:  (school as any).font_size_scale ?? "M",
          headerTextColor:(school as any).header_text_color ?? "auto",
        };
        setForm(f);
        setInkColor(f.primaryColor ?? "#1a3a8f");
        // Pre-fill outgoing fields with the current admin
        setTxForm(prev => ({
          ...prev,
          outgoingName:  f.adminName,
          outgoingTitle: f.headTitle,
        }));
      })
      .catch((err) =>
        toast.error(err instanceof Error ? err.message : "Could not load school profile."),
      )
      .finally(() => setLoading(false));

    // Load transition history
    getAdminTransitionsDb({ data: { schoolCode: getSchoolCode() } })
      .then(setTransitions)
      .catch(() => {}); // non-critical

    // Load staff exit log and active teacher list
    getStaffExitsDb({ data: { schoolCode: getSchoolCode() } })
      .then(setStaffExits)
      .catch(() => {});
    getTeachersForExitDb({ data: { schoolCode: getSchoolCode() } })
      .then(setActiveTeachers)
      .catch(() => {});
  }, []);

  // ── Generate stamp (canvas render) ──────────────────────────────────────
  const generateStamp = useCallback(async (overrideForm?: typeof form, overrideInk?: string) => {
    const f   = overrideForm ?? form;
    const ink = overrideInk  ?? inkColor;
    if (!f.name || !f.city) {
      toast.error("Please fill in the school name and city first.");
      return;
    }
    setStampGenerating(true);
    try {
      const canvas = stampCanvasRef.current;
      if (!canvas) return;
      await renderStamp(canvas, {
        schoolName: f.name,
        city:       f.city,
        logoUrl:    f.logoUrl || undefined,
        inkColor:   ink,
        shape:      stampShape,
        subText:    stampSubText,
      });
      setStampRendered(true);
    } catch (err) {
      toast.error("Stamp generation failed.");
      console.error(err);
    } finally {
      setStampGenerating(false);
    }
  }, [form, inkColor, stampShape, stampSubText]);

  const saveSchoolBranding = async (nextFields: typeof form) => {
    const updated = await updateSchoolBrandingDb({ data: { schoolCode: getSchoolCode(), ...nextFields } });
    if (updated) {
      localStorage.setItem(`icademia_profile_${getSchoolCode()}`, JSON.stringify(updated));
    }
    return updated;
  };

  // ── Save generated stamp to Cloudinary ──────────────────────────────────
  const saveStamp = async () => {
    const canvas = stampCanvasRef.current;
    if (!canvas || !stampRendered) {
      toast.error("Generate the stamp first.");
      return;
    }
    setUploading("stamp");
    try {
      const base64Image = canvas.toDataURL("image/png");
      const uploaded    = await uploadToCloudinaryDb({ data: { base64Image } });
      const next        = { ...form, stampUrl: uploaded.url };
      setForm(next);
      await saveSchoolBranding(next);
      toast.success("School stamp saved!", {
        description: "It will appear on every printed result sheet.",
      });
    } catch (err) {
      toast.error("Could not save stamp.", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setUploading(null);
    }
  };

  const removeStamp = async () => {
    const next = { ...form, stampUrl: "" };
    setForm(next);
    setStampRendered(false);
    const canvas = stampCanvasRef.current;
    if (canvas) canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
    try {
      await saveSchoolBranding(next);
      toast.success("Stamp removed.");
    } catch { toast.error("Could not remove stamp."); }
  };

  // ── Logo upload ──────────────────────────────────────────────────────────
  const uploadLogo = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      toast.error("Choose a PNG, JPG or WebP image under 2 MB.");
      return;
    }
    setUploading("logo");
    try {
      const base64Image = await toBase64(file);
      const uploaded    = await uploadToCloudinaryDb({ data: { base64Image } });
      const next        = { ...form, logoUrl: uploaded.url };
      setForm(next);
      await saveSchoolBranding(next);
      toast.success("Logo uploaded and saved.");
    } catch (err) {
      toast.error("Logo upload failed.", { description: err instanceof Error ? err.message : "" });
    } finally { setUploading(null); }
  };

  // ── Signature canvas helpers ─────────────────────────────────────────────
  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect   = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      const t = e.touches[0];
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPos(e);
    if (!pos) return;
    setDrawing(true);
    lastPos.current = pos;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 1, 0, Math.PI * 2);
    ctx.fillStyle = "#0f172a";
    ctx.fill();
    setCanvasStrokes(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!drawing || !lastPos.current) return;
    const pos = getPos(e);
    if (!pos) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle  = "#0f172a";
    ctx.lineWidth    = 2.2;
    ctx.lineCap      = "round";
    ctx.lineJoin     = "round";
    ctx.stroke();
    lastPos.current  = pos;
  };

  const stopDraw = () => { setDrawing(false); lastPos.current = null; };

  const clearSigCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    setCanvasStrokes(false);
  };

  const saveCanvasSig = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasStrokes) { toast.error("Please draw your signature first."); return; }
    setUploading("signature");
    try {
      const base64Image = canvas.toDataURL("image/png");
      const uploaded    = await uploadToCloudinaryDb({ data: { base64Image } });
      const next        = { ...form, signatureUrl: uploaded.url };
      setForm(next);
      await saveSchoolBranding(next);
      toast.success("Signature saved.");
    } catch (err) {
      toast.error("Could not save signature.", { description: err instanceof Error ? err.message : "" });
    } finally { setUploading(null); }
  };

  const uploadSigFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      toast.error("Choose a PNG or JPG under 2 MB."); return;
    }
    setUploading("signature");
    try {
      const base64Image = await toBase64(file);
      const uploaded    = await uploadToCloudinaryDb({ data: { base64Image } });
      const next        = { ...form, signatureUrl: uploaded.url };
      setForm(next);
      await saveSchoolBranding(next);
      toast.success("Signature uploaded and saved.");
    } catch (err) {
      toast.error("Signature upload failed.", { description: err instanceof Error ? err.message : "" });
    } finally { setUploading(null); }
  };

  const removeSig = async () => {
    const next = { ...form, signatureUrl: "" };
    setForm(next);
    clearSigCanvas();
    try {
      await saveSchoolBranding(next);
      toast.success("Signature removed.");
    } catch { toast.error("Could not remove signature."); }
  };

  // ── Main save ────────────────────────────────────────────────────────────
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSchoolBranding(form);
      toast.success("School settings saved.", {
        description: "Result sheets will reflect the updated branding and signer.",
      });
    } catch (err) {
      toast.error("Could not save.", { description: err instanceof Error ? err.message : "" });
    } finally { setSaving(false); }
  };

  // ── Admin transition ────────────────────────────────────────────────────
  const initiateTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.incomingName.trim()) { toast.error("Please enter the incoming administrator's name."); return; }
    setTransitioning(true);
    try {
      await initiateAdminTransitionDb({
        data: {
          schoolCode:      getSchoolCode(),
          outgoingName:    txForm.outgoingName,
          outgoingTitle:   txForm.outgoingTitle,
          incomingName:    txForm.incomingName,
          incomingTitle:   txForm.incomingTitle,
          effectiveDate:   txForm.effectiveDate,
          transitionType:  txForm.transitionType,
          reason:          txForm.reason || undefined,
          witnessName:     txForm.witnessName || undefined,
        },
      });
      // Refresh history & form state
      const updated = await getAdminTransitionsDb({ data: { schoolCode: getSchoolCode() } });
      setTransitions(updated);
      // Update local form to reflect new admin
      setForm(prev => ({
        ...prev,
        adminName: txForm.incomingName,
        headTitle: txForm.incomingTitle,
        signatureUrl: "", // cleared — new admin must draw theirs
      }));
      setTxForm(prev => ({
        ...prev,
        outgoingName:   txForm.incomingName,
        outgoingTitle:  txForm.incomingTitle,
        incomingName:   "",
        reason:         "",
        witnessName:    "",
        transitionType: "normal",
      }));
      setShowTransition(false);
      setShowHistory(true);
      toast.success("Administrator transition recorded.", {
        description: "Audit log saved. The outgoing signature has been cleared — the new administrator should draw or upload theirs.",
        duration: 6000,
      });
    } catch (err) {
      toast.error("Transition failed.", { description: err instanceof Error ? err.message : "" });
    } finally { setTransitioning(false); }
  };

  // ── Staff exit ───────────────────────────────────────────────────────────
  const recordStaffExit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exitForm.teacherId) { toast.error("Please select a teacher."); return; }
    const needsWitness = ["dismissal","demise","emergency"].includes(exitForm.exitType);
    if (needsWitness && !exitForm.witnessName.trim()) {
      toast.error("A witness / authorising officer name is required for this type of exit."); return;
    }
    setStaffExiting(true);
    try {
      await recordStaffExitDb({
        data: {
          schoolCode:     getSchoolCode(),
          teacherId:      exitForm.teacherId,
          teacherName:    exitForm.teacherName,
          teacherSubject: exitForm.teacherSubject || undefined,
          teacherRole:    exitForm.teacherRole    || undefined,
          exitType:       exitForm.exitType,
          effectiveDate:  exitForm.effectiveDate,
          reason:         exitForm.reason         || undefined,
          witnessName:    exitForm.witnessName     || undefined,
          recordedBy:     form.adminName           || undefined,
        },
      });
      // Refresh both lists
      const [exits, teachers] = await Promise.all([
        getStaffExitsDb({ data: { schoolCode: getSchoolCode() } }),
        getTeachersForExitDb({ data: { schoolCode: getSchoolCode() } }),
      ]);
      setStaffExits(exits);
      setActiveTeachers(teachers);
      // Reset form
      setExitForm(prev => ({
        ...prev, teacherId: 0, teacherName: "", teacherSubject: "",
        teacherRole: "", reason: "", witnessName: "", exitType: "resignation",
      }));
      setShowExitForm(false);
      setShowExitHistory(true);
      toast.success("Staff departure recorded.", {
        description: `${exitForm.teacherName} has been marked as Exited and the record is permanently logged.`,
        duration: 6000,
      });
    } catch (err) {
      toast.error("Could not record exit.", { description: err instanceof Error ? err.message : "" });
    } finally { setStaffExiting(false); }
  };

  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Poppins:wght@300;400;500;600;700;800;900&family=Montserrat:wght@300;400;500;600;700;800;900&family=Raleway:wght@300;400;500;600;700;800;900&family=Oswald:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700;800;900&family=Lora:wght@400;500;600;700&family=EB+Garamond:wght@400;500;600;700;800&family=Crimson+Text:wght@400;600;700&family=Libre+Baskerville:wght@400;700&display=swap" rel="stylesheet" />
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          Administration
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
          School Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the school profile, professional result-sheet identity and less frequent governance records.
        </p>
      </header>

      <Card className="border-primary/15 bg-primary/5 p-4 shadow-none">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">Jump to a section</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <a href="#school-profile" className="rounded-lg border bg-background px-3 py-2 text-sm font-semibold hover:border-primary/40">School profile</a>
          <a href="#report-design" className="rounded-lg border bg-background px-3 py-2 text-sm font-semibold hover:border-primary/40">Report design</a>
          <a href="#signing-authority" className="rounded-lg border bg-background px-3 py-2 text-sm font-semibold hover:border-primary/40">Signature &amp; stamp</a>
          <a href="#governance" className="rounded-lg border bg-background px-3 py-2 text-sm font-semibold hover:border-primary/40">Advanced governance</a>
        </div>
      </Card>

      {loading ? (
        <Card className="grid min-h-64 place-items-center">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </Card>
      ) : (
        <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">

          {/* ══ LEFT COLUMN ═══════════════════════════════════════════════ */}
          <div className="space-y-5">

            {/* School profile */}
            <Card id="school-profile" className="scroll-mt-20 overflow-hidden border-border shadow-card">
              <SectionHeader label="Organisation" title="School profile"
                description="These details appear on official reports and partner-school records." />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label>School name</Label>
                  <Input value={form.name} readOnly
                    className="mt-2 bg-muted/40 text-muted-foreground cursor-not-allowed" title="School name is set during onboarding." />
                </div>
                <div>
                  <Label>School type</Label>
                  <select value={form.type} disabled
                    className="mt-2 h-10 w-full rounded-md border border-input bg-muted/40 text-muted-foreground px-3 text-sm cursor-not-allowed"
                    title="School type is set during onboarding.">
                    <option value="primary">Primary school</option>
                    <option value="secondary">Secondary school</option>
                    <option value="both">Primary & secondary school</option>
                    <option value="college">College / tertiary institution</option>
                  </select>
                </div>
                <div>
                  <Label>Motto</Label>
                  <Input value={form.motto} onChange={(e) => setForm({ ...form, motto: e.target.value })}
                    className="mt-2" placeholder="e.g. Knowledge is Power" />
                </div>
                <div>
                  <Label>City / State</Label>
                  <Input value={form.city} readOnly
                    className="mt-2 bg-muted/40 text-muted-foreground cursor-not-allowed" title="Location is set during onboarding." />
                </div>
                <div>
                  <Label>School website</Label>
                  <Input type="url" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                    className="mt-2" placeholder="https://yourschool.edu.ng" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Full school address</Label>
                  <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="mt-2" placeholder="Street, city, state" />
                </div>
              </div>
            </Card>

            {/* Administrator & Contact */}
            <Card className="overflow-hidden border-border shadow-card">
              <SectionHeader label="Contacts" title="Administrator &amp; Contact details" />
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <div>
                  <Label>Administrator name</Label>
                  <Input value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                    className="mt-2" placeholder="e.g. John Doe" required />
                </div>
                <div>
                  <Label>Administrator phone</Label>
                  <Input value={form.adminPhone} onChange={(e) => setForm({ ...form, adminPhone: e.target.value })}
                    className="mt-2" placeholder="+234…" />
                </div>
                <div>
                  <Label>School official email</Label>
                  <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="mt-2" placeholder="contact@yourschool.edu" />
                </div>
                <div>
                  <Label>School official phone</Label>
                  <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="mt-2" placeholder="+234…" />
                </div>
              </div>
            </Card>

            {/* Branding */}
            <Card id="report-design" className="scroll-mt-20 overflow-hidden border-border shadow-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/30 px-5 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-primary">Result-sheet branding</p>
                  <h2 className="mt-0.5 font-display text-base font-semibold">Letterhead, colours &amp; typography</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Design the identity of every printed result sheet. Changes apply immediately on save.</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLivePreviewModal(true)}
                  className="gap-2 text-xs font-semibold text-primary border-primary/30 hover:bg-primary/5 shadow-xs"
                >
                  <Eye className="h-4 w-4 text-primary" /> View Live Preview
                </Button>
              </div>
              <div className="p-5">
                <Tabs defaultValue="layout" className="w-full space-y-5">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="layout" className="gap-2 text-xs font-semibold">
                      <LayoutGrid className="h-3.5 w-3.5" /> Layout &amp; Colors
                    </TabsTrigger>
                    <TabsTrigger value="typography" className="gap-2 text-xs font-semibold">
                      <Type className="h-3.5 w-3.5" /> Typography &amp; Fonts
                    </TabsTrigger>
                    <TabsTrigger value="logo" className="gap-2 text-xs font-semibold">
                      <ImageIcon className="h-3.5 w-3.5" /> School Crest / Logo
                    </TabsTrigger>
                  </TabsList>

                  {/* ── Tab 1: Layout & Colors ────────────────────────────────────── */}
                  <TabsContent value="layout" className="space-y-6 pt-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label className="text-xs font-semibold">Primary colour</Label>
                        <div className="mt-2 flex gap-2">
                          <Input type="color" value={form.primaryColor}
                            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                            className="h-10 w-14 p-1 cursor-pointer" />
                          <Input value={form.primaryColor}
                            onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                            className="font-mono uppercase" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs font-semibold">Accent colour</Label>
                        <div className="mt-2 flex gap-2">
                          <Input type="color" value={form.secondaryColor}
                            onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                            className="h-10 w-14 p-1 cursor-pointer" />
                          <Input value={form.secondaryColor}
                            onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })}
                            className="font-mono uppercase" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <Label className="text-xs font-semibold">Header Text Colour</Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5 mb-2.5">The colour of the school name and header text inside coloured banner backgrounds.</p>
                      <div className="flex flex-wrap gap-2">
                        <button type="button" onClick={() => setForm({ ...form, headerTextColor: "auto" })}
                          className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-all ${
                            form.headerTextColor === "auto"
                              ? "border-primary bg-primary/5 text-primary font-semibold"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}>
                          Auto (Smart Contrast)
                        </button>
                        <button type="button" onClick={() => setForm({ ...form, headerTextColor: "#ffffff" })}
                          className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-all ${
                            form.headerTextColor === "#ffffff"
                              ? "border-primary bg-primary/5 font-semibold"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}>
                          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-white border border-border" />White</span>
                        </button>
                        <button type="button" onClick={() => setForm({ ...form, headerTextColor: "#000000" })}
                          className={`rounded-lg border-2 px-3 py-1.5 text-xs font-medium transition-all ${
                            form.headerTextColor === "#000000"
                              ? "border-primary bg-primary/5 font-semibold"
                              : "border-border text-muted-foreground hover:border-primary/40"
                          }`}>
                          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded-full bg-black" />Black</span>
                        </button>
                        <div className="flex items-center gap-1.5">
                          <Input type="color"
                            value={form.headerTextColor === "auto" ? "#ffffff" : form.headerTextColor}
                            onChange={(e) => setForm({ ...form, headerTextColor: e.target.value })}
                            className="h-9 w-10 p-1 cursor-pointer" title="Custom colour" />
                          <span className="text-[10px] text-muted-foreground">Custom</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <Label className="text-xs font-semibold">Letterhead Layout</Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">Choose the layout design for your printed result sheets. Each is a distinct visual identity.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {([
                          { key: "classic-banner", label: "Classic Banner", desc: "Full-width colour bar, logo left" },
                          { key: "arch-crest", label: "Arch Crest", desc: "School name in curved arc above crest" },
                          { key: "royal-split", label: "Royal Split", desc: "Coloured sidebar with logo" },
                          { key: "minimalist-line", label: "Minimalist Line", desc: "White header, thin rule, ink-saving" },
                          { key: "centred-formal", label: "Centred Formal", desc: "Centred crest & name, government style" },
                          { key: "modern-gradient", label: "Modern Gradient", desc: "Gradient header with accent stripe" },
                        ] as const).map(({ key, label, desc }) => {
                          const pc = form.primaryColor;
                          const sc = form.secondaryColor;
                          const previewMap: Record<string, React.ReactNode> = {
                            "classic-banner": (
                              <div className="w-full h-16 rounded border border-border/30 bg-white overflow-hidden flex flex-col">
                                <div className="h-8 w-full flex items-center gap-1.5 px-2" style={{ backgroundColor: pc }}>
                                  <div className="h-4 w-4 rounded bg-white/30 shrink-0" />
                                  <div className="flex flex-col gap-0.5 flex-1">
                                    <div className="h-1.5 w-16 bg-white/50 rounded" />
                                    <div className="h-1 w-10 bg-white/30 rounded" />
                                  </div>
                                </div>
                                <div className="flex-1 p-1.5 flex flex-col gap-1">
                                  <div className="h-1 w-full bg-muted rounded" />
                                  <div className="h-1 w-3/4 bg-muted rounded" />
                                </div>
                              </div>
                            ),
                            "arch-crest": (
                              <div className="w-full h-16 rounded border border-border/30 bg-white overflow-hidden flex flex-col items-center pt-1.5 gap-0.5">
                                <div className="relative w-full flex justify-center items-end h-7">
                                  <svg viewBox="0 0 100 28" className="absolute w-full h-full">
                                    <path id={`arc-prev-${key}`} d="M8,26 A44,44 0 0,1 92,26" fill="none" stroke={pc} strokeWidth="1.5"/>
                                    <text fontSize="7" fill={pc} fontWeight="bold">
                                      <textPath href={`#arc-prev-${key}`} startOffset="50%" textAnchor="middle">SCHOOL NAME</textPath>
                                    </text>
                                  </svg>
                                </div>
                                <div className="h-3 w-3 rounded-full border-2" style={{ borderColor: pc }} />
                                <div className="w-full px-2 flex flex-col gap-0.5 mt-0.5">
                                  <div className="h-1 w-full bg-muted/60 rounded" />
                                  <div className="h-1 w-2/3 bg-muted/60 rounded" />
                                </div>
                              </div>
                            ),
                            "royal-split": (
                              <div className="w-full h-16 rounded border border-border/30 bg-white overflow-hidden flex flex-row">
                                <div className="w-10 flex flex-col items-center justify-center gap-1 shrink-0" style={{ backgroundColor: pc }}>
                                  <div className="h-4 w-4 rounded-sm bg-white/30" />
                                  <div className="h-1 w-6 bg-white/30 rounded" />
                                </div>
                                <div className="flex-1 p-2 flex flex-col justify-center gap-1">
                                  <div className="h-1.5 w-full bg-muted rounded" />
                                  <div className="h-1 w-3/4 bg-muted/60 rounded" />
                                  <div className="h-[1px] w-full bg-border/50 my-0.5" />
                                  <div className="h-1 w-full bg-muted/40 rounded" />
                                </div>
                              </div>
                            ),
                            "minimalist-line": (
                              <div className="w-full h-16 rounded border border-border/30 bg-white overflow-hidden flex flex-col p-2 gap-1">
                                <div className="flex items-center gap-1.5">
                                  <div className="h-4 w-4 rounded border-2" style={{ borderColor: pc }} />
                                  <div className="flex flex-col gap-0.5">
                                    <div className="h-1.5 w-14 rounded" style={{ backgroundColor: pc }} />
                                    <div className="h-1 w-9 bg-muted/50 rounded" />
                                  </div>
                                </div>
                                <div className="h-[2px] w-full rounded" style={{ backgroundColor: pc }} />
                                <div className="flex flex-col gap-0.5">
                                  <div className="h-1 w-full bg-muted/40 rounded" />
                                  <div className="h-1 w-3/4 bg-muted/40 rounded" />
                                </div>
                              </div>
                            ),
                            "centred-formal": (
                              <div className="w-full h-16 rounded border border-border/30 bg-white overflow-hidden flex flex-col items-center justify-center gap-0.5 py-1.5">
                                <div className="h-4 w-4 rounded-full border-2" style={{ borderColor: pc }} />
                                <div className="h-1.5 w-16 rounded" style={{ backgroundColor: pc }} />
                                <div className="h-1 w-10 bg-muted/50 rounded" />
                                <div className="h-[1px] w-16 bg-border/60" />
                                <div className="h-1 w-12 bg-muted/40 rounded" />
                              </div>
                            ),
                            "modern-gradient": (
                              <div className="w-full h-16 rounded border border-border/30 bg-white overflow-hidden flex flex-col">
                                <div className="h-9 w-full flex items-center gap-1.5 px-2" style={{ background: `linear-gradient(135deg, ${pc}, ${pc}99)` }}>
                                  <div className="h-4 w-4 rounded bg-white/30 shrink-0" />
                                  <div className="flex-1 flex flex-col gap-0.5">
                                    <div className="h-1.5 w-12 bg-white/50 rounded" />
                                    <div className="h-1 w-8 bg-white/30 rounded" />
                                  </div>
                                </div>
                                <div className="h-1.5 w-full" style={{ backgroundColor: sc }} />
                                <div className="flex-1 p-1 flex flex-col gap-0.5">
                                  <div className="h-1 w-full bg-muted/40 rounded" />
                                </div>
                              </div>
                            ),
                          };
                          return (
                            <button key={key} type="button" onClick={() => setForm({ ...form, letterheadStyle: key })}
                              className={`relative flex flex-col gap-2 rounded-xl border-2 p-2.5 text-left transition-all ${
                                form.letterheadStyle === key
                                  ? "border-primary bg-primary/5 shadow-sm"
                                  : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                              }`}>
                              {previewMap[key]}
                              <div>
                                <p className="text-xs font-bold text-foreground leading-tight">{label}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{desc}</p>
                              </div>
                              {form.letterheadStyle === key && (
                                <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary bg-background rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <Label className="text-xs font-semibold">Logo Placement</Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">Where the school crest/logo appears in the letterhead.</p>
                      <div className="grid grid-cols-3 gap-3">
                        {([
                          { key: "left",   label: "Left",   icon: "▐ ▬ ▬" },
                          { key: "center", label: "Centre", icon: "▬ ▐ ▬" },
                          { key: "right",  label: "Right",  icon: "▬ ▬ ▐" },
                        ] as const).map(({ key, label, icon }) => (
                          <button key={key} type="button" onClick={() => setForm({ ...form, logoPlacement: key })}
                            className={`relative flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 transition-all ${
                              form.logoPlacement === key
                                ? "border-primary bg-primary/5 font-semibold text-primary"
                                : "border-border hover:border-primary/40 text-muted-foreground"
                            }`}>
                            <span className="font-mono text-base tracking-wider text-muted-foreground">{icon}</span>
                            <span className="text-xs font-semibold">{label}</span>
                            {form.logoPlacement === key && (
                              <CheckCircle2 className="absolute top-1.5 right-1.5 h-3.5 w-3.5 text-primary bg-background rounded-full" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── Tab 2: Typography ────────────────────────────────────────── */}
                  <TabsContent value="typography" className="space-y-6 pt-2">
                    <div>
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Font Family</Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5 mb-2.5">Select the typeface used for titles, headers, and body text on printed sheets.</p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        {([
                          { key: "inter",      label: "Inter",      sample: "Aa", css: "Inter, sans-serif" },
                          { key: "poppins",    label: "Poppins",    sample: "Aa", css: "Poppins, sans-serif" },
                          { key: "montserrat", label: "Montserrat", sample: "Aa", css: "Montserrat, sans-serif" },
                          { key: "raleway",    label: "Raleway",    sample: "Aa", css: "Raleway, sans-serif" },
                          { key: "oswald",     label: "Oswald",     sample: "Aa", css: "Oswald, sans-serif" },
                          { key: "playfair",   label: "Playfair",   sample: "Aa", css: "'Playfair Display', serif" },
                          { key: "lora",       label: "Lora",       sample: "Aa", css: "Lora, serif" },
                          { key: "garamond",   label: "Garamond",   sample: "Aa", css: "'EB Garamond', serif" },
                          { key: "crimson",    label: "Crimson",    sample: "Aa", css: "'Crimson Text', serif" },
                          { key: "libre",      label: "Libre",      sample: "Aa", css: "'Libre Baskerville', serif" },
                        ] as const).map(({ key, label, sample, css }) => (
                          <button key={key} type="button" onClick={() => setForm({ ...form, fontFamily: key })}
                            className={`relative flex flex-col items-center gap-0.5 rounded-lg border-2 p-2 transition-all ${
                              form.fontFamily === key
                                ? "border-primary bg-primary/5 text-primary font-semibold"
                                : "border-border hover:border-primary/40"
                            }`}>
                            <span className="text-xl leading-none" style={{ fontFamily: css }}>{sample}</span>
                            <span className="text-[9px] text-muted-foreground mt-0.5 text-center leading-tight">{label}</span>
                            {form.fontFamily === key && (
                              <CheckCircle2 className="absolute top-1 right-1 h-3 w-3 text-primary bg-background rounded-full" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Font Weight</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {([
                          { key: "300", label: "Light" },
                          { key: "400", label: "Regular" },
                          { key: "500", label: "Medium" },
                          { key: "600", label: "Semibold" },
                          { key: "700", label: "Bold" },
                          { key: "800", label: "Extrabold" },
                          { key: "900", label: "Black" },
                        ] as const).map(({ key, label }) => (
                          <button key={key} type="button" onClick={() => setForm({ ...form, fontWeight: key })}
                            className={`rounded-lg border-2 px-3 py-1.5 text-sm transition-all ${
                              form.fontWeight === key
                                ? "border-primary bg-primary/5 text-primary font-bold"
                                : "border-border text-muted-foreground hover:border-primary/40"
                            }`}
                            style={{ fontWeight: key }}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-border">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Text Size Scale</Label>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {([
                          { key: "XS",  label: "XS",  pt: "9pt" },
                          { key: "S",   label: "S",   pt: "10pt" },
                          { key: "M",   label: "M",   pt: "11pt" },
                          { key: "L",   label: "L",   pt: "12pt" },
                          { key: "XL",  label: "XL",  pt: "13pt" },
                          { key: "2XL", label: "2XL", pt: "14pt" },
                          { key: "3XL", label: "3XL", pt: "15pt" },
                        ] as const).map(({ key, label, pt }) => (
                          <button key={key} type="button" onClick={() => setForm({ ...form, fontSizeScale: key })}
                            className={`flex flex-col items-center rounded-lg border-2 px-3 py-1.5 transition-all ${
                              form.fontSizeScale === key
                                ? "border-primary bg-primary/5 font-semibold text-primary"
                                : "border-border hover:border-primary/40"
                            }`}>
                            <span className="text-sm font-bold">{label}</span>
                            <span className="text-[9px] text-muted-foreground">{pt}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>

                  {/* ── Tab 3: Logo & Assets ────────────────────────────────────── */}
                  <TabsContent value="logo" className="space-y-4 pt-2">
                    <div>
                      <Label htmlFor="school-logo" className="text-xs font-semibold">School Crest / Logo</Label>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Upload a clean PNG or WebP transparent crest for high-res print quality on result sheets.</p>
                      <label htmlFor="school-logo"
                        className="mt-3 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-6 text-sm text-muted-foreground transition-colors hover:border-primary/50 bg-muted/20">
                        {uploading === "logo" ? <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          : form.logoUrl ? <img src={form.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-contain p-1 border border-border/60 bg-white shadow-xs" />
                            : <UploadCloud className="h-6 w-6 text-primary" />}
                        <div className="text-left">
                          <p className="text-xs font-semibold text-foreground">
                            {form.logoUrl ? "Click to replace school logo" : "Click to upload school crest"}
                          </p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            PNG, JPG or WebP · max 2 MB · transparent background recommended
                          </p>
                        </div>
                      </label>
                      <input id="school-logo" type="file" accept="image/png,image/jpeg,image/webp"
                        className="hidden" onChange={(e) => uploadLogo(e.target.files?.[0])} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </Card>

            {/* Signing authority & signature */}
            <Card id="signing-authority" className="scroll-mt-20 overflow-hidden border-border shadow-card">
              <SectionHeader label="Official signature" title="Signing authority & signature"
                description='Name and signature appear at the bottom of every printed result sheet. Primary schools default to “Head Teacher”; secondary schools to “Principal”.' />
              <div className="space-y-5 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Head of school title</Label>
                    <Select value={form.headTitle} onValueChange={(v) => setForm({ ...form, headTitle: v })}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {HEAD_TITLES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Name on result sheet</Label>
                    <Input value={form.adminName} readOnly className="mt-2 bg-muted/40 text-muted-foreground" />
                    <p className="mt-1 text-[11px] text-muted-foreground">Uses administrator name from profile above.</p>
                  </div>
                </div>

                {/* Draw / Upload toggle */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <Label>Official signature</Label>
                    <div className="flex overflow-hidden rounded-lg border border-border">
                      {(["draw", "upload"] as const).map((m) => (
                        <button key={m} type="button" onClick={() => setSigMode(m)}
                          className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${sigMode === m ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"}`}>
                          {m === "draw"
                            ? <span className="flex items-center gap-1.5"><PenLine className="h-3.5 w-3.5" /> Draw</span>
                            : <span className="flex items-center gap-1.5"><UploadCloud className="h-3.5 w-3.5" /> Upload</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {sigMode === "draw" ? (
                    <div className="space-y-3">
                      <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-border bg-white" style={{ touchAction: "none" }}>
                        <p className="pointer-events-none absolute left-3 top-2 select-none text-[10px] text-muted-foreground/50">
                          Sign here with your mouse or finger
                        </p>
                        <canvas ref={canvasRef} width={680} height={160}
                          className="w-full cursor-crosshair" style={{ height: "130px" }}
                          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw} />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={clearSigCanvas}
                          disabled={!canvasStrokes} className="gap-1.5 text-xs">
                          <Trash2 className="h-3.5 w-3.5" /> Clear
                        </Button>
                        <Button type="button" size="sm" onClick={saveCanvasSig}
                          disabled={!canvasStrokes || uploading === "signature"} className="gap-1.5 text-xs">
                          {uploading === "signature" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SaveIcon className="h-3.5 w-3.5" />}
                          {uploading === "signature" ? "Saving…" : "Save signature"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="sig-upload"
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-sm text-muted-foreground hover:border-primary/50">
                        {uploading === "signature" ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
                        {uploading === "signature" ? "Uploading…" : "Upload signature image (PNG with transparent background ideal) · max 2 MB"}
                      </label>
                      <input id="sig-upload" type="file" accept="image/png,image/jpeg,image/webp"
                        className="hidden" onChange={(e) => uploadSigFile(e.target.files?.[0])} />
                    </div>
                  )}

                  {form.signatureUrl && (
                    <div className="mt-3 flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-success">Signature on file</p>
                        <img src={form.signatureUrl} alt="Signature"
                          className="mt-2 h-12 max-w-[200px] rounded-lg border border-border bg-white object-contain p-1" />
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeSig}
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* ══ STAFF TRANSITION / HANDOVER ═══════════════════════════════════════ */}
            <Card id="governance" className="scroll-mt-20 overflow-hidden border-border shadow-card">
              <SectionHeader label="Staff transition" title="Administrator handover & audit trail"
                description="Safely transfer administrator access when the Principal or Head Teacher changes. The outgoing signature is cleared; the new administrator must sign afresh. Every handover is permanently logged." />
              <div className="p-5 space-y-4">

                {/* Current admin summary */}
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Current administrator</p>
                    <p className="font-semibold text-sm">{form.adminName || "—"}</p>
                    <p className="text-[11px] text-muted-foreground">{form.headTitle || "No title set"}</p>
                  </div>
                  {form.signatureUrl
                    ? <img src={form.signatureUrl} alt="Sig" className="h-8 max-w-[80px] object-contain opacity-70" />
                    : <span className="text-[10px] text-muted-foreground italic">No signature on file</span>}
                </div>

                {/* Initiate transition toggle */}
                <Button type="button" variant="outline" onClick={() => setShowTransition(v => !v)}
                  className="w-full gap-2 border-warning/40 text-warning hover:bg-warning/5 hover:border-warning">
                  <ArrowRightLeft className="h-4 w-4" />
                  Initiate administrator transition
                  {showTransition ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
                </Button>

                {showTransition && (() => {
                  const isDemise    = txForm.transitionType === "demise";
                  const isEmergency = txForm.transitionType === "emergency";
                  const isDisputed  = txForm.transitionType === "disputed";
                  const needsWitness = isDemise || isEmergency || isDisputed;

                  const TX_TYPES = [
                    { value: "normal",     label: "Normal handover",          hint: "Outgoing admin initiates the transfer" },
                    { value: "retirement", label: "Retirement",                hint: "Long-serving administrator retiring" },
                    { value: "resignation",label: "Resignation",               hint: "Administrator voluntarily leaving post" },
                    { value: "dismissal",  label: "Dismissal / termination",   hint: "Administrator removed from position" },
                    { value: "demise",     label: "Demise (deceased)",         hint: "Administrator has passed away" },
                    { value: "emergency",  label: "Emergency / incapacitation",hint: "Administrator suddenly unavailable" },
                    { value: "disputed",   label: "Disputed / forced takeover",hint: "Contested succession — flag for review" },
                    { value: "other",      label: "Other",                     hint: "Any other reason" },
                  ];

                  const confirmLabel = isDemise    ? "Record with condolences"
                                     : isEmergency ? "Record emergency transition"
                                     : isDisputed  ? "Record disputed transition"
                                     : "Confirm handover";

                  const bannerColor = isDemise    ? "border-slate-400/30 bg-slate-400/5 text-slate-600"
                                    : isEmergency ? "border-destructive/30 bg-destructive/5 text-destructive"
                                    : isDisputed  ? "border-destructive/30 bg-destructive/5 text-destructive"
                                    : "border-warning/30 bg-warning/5 text-warning";

                  return (
                    <form onSubmit={initiateTransition} className="space-y-4 rounded-xl border border-warning/30 bg-warning/5 p-4">

                      {/* Transition type selector */}
                      <div>
                        <Label className="text-xs">Nature of transition</Label>
                        <select
                          value={txForm.transitionType}
                          onChange={e => setTxForm(p => ({ ...p, transitionType: e.target.value }))}
                          className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          {TX_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label} — {t.hint}</option>
                          ))}
                        </select>
                      </div>

                      {/* Contextual banner */}
                      <div className={`flex items-start gap-2 rounded-lg border p-3 ${bannerColor}`}>
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed">
                          {isDemise && <><strong>We are sorry for your loss.</strong> This transition will permanently record the passing and clear the personal signature. The school records will continue uninterrupted under the new administrator.<br /></>}
                          {isEmergency && <><strong>Emergency transition.</strong> Use this when the current administrator is hospitalised, incapacitated, or suddenly unreachable. A witness name is required for verification.<br /></>}
                          {isDisputed && <><strong>Disputed transition.</strong> This transition will be flagged in the audit log. iCademia support may review this record. A witness or board authority name is required.<br /></>}
                          {!isDemise && !isEmergency && !isDisputed && <>This will update the administrator name and title on all result sheets and <strong>permanently clear the current signature</strong>. The action is logged and cannot be undone.</>}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Outgoing administrator name</Label>
                          <Input value={txForm.outgoingName}
                            onChange={e => setTxForm(p => ({ ...p, outgoingName: e.target.value }))}
                            className="mt-1.5 text-sm" required />
                        </div>
                        <div>
                          <Label className="text-xs">Outgoing title</Label>
                          <Select value={txForm.outgoingTitle} onValueChange={v => setTxForm(p => ({ ...p, outgoingTitle: v }))}>
                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                            <SelectContent>{HEAD_TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Incoming administrator name</Label>
                          <Input value={txForm.incomingName} placeholder="Full name of new administrator"
                            onChange={e => setTxForm(p => ({ ...p, incomingName: e.target.value }))}
                            className="mt-1.5 text-sm" required />
                        </div>
                        <div>
                          <Label className="text-xs">Incoming title</Label>
                          <Select value={txForm.incomingTitle} onValueChange={v => setTxForm(p => ({ ...p, incomingTitle: v }))}>
                            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                            <SelectContent>{HEAD_TITLES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Effective date</Label>
                          <Input type="date" value={txForm.effectiveDate}
                            onChange={e => setTxForm(p => ({ ...p, effectiveDate: e.target.value }))}
                            className="mt-1.5 text-sm" required />
                        </div>
                        <div>
                          <Label className="text-xs">Reason / notes {needsWitness ? "" : "(optional)"}</Label>
                          <Input value={txForm.reason}
                            placeholder={isDemise ? "e.g. Passed on 1st August 2026" : isEmergency ? "e.g. Hospitalised, family notified" : "e.g. Retirement after 15 years of service"}
                            onChange={e => setTxForm(p => ({ ...p, reason: e.target.value }))}
                            className="mt-1.5 text-sm" />
                        </div>

                        {/* Witness field — required for sensitive transitions */}
                        {needsWitness && (
                          <div className="sm:col-span-2">
                            <Label className="text-xs">
                              {isDemise    ? "Next of kin / board witness name *" :
                               isDisputed  ? "Authorising board member / witness *" :
                                             "Witness / verifier name *"}
                            </Label>
                            <Input value={txForm.witnessName}
                              placeholder={isDemise ? "Name of family member or board chair" : "Name of person authorising this change"}
                              onChange={e => setTxForm(p => ({ ...p, witnessName: e.target.value }))}
                              className="mt-1.5 text-sm border-warning" required />
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              This name is permanently recorded in the audit log.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="outline" size="sm"
                          onClick={() => setShowTransition(false)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={transitioning}
                          className={`gap-1.5 ${
                            isDemise    ? "bg-slate-700 text-white hover:bg-slate-800" :
                            isEmergency || isDisputed ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" :
                            "bg-warning text-warning-foreground hover:bg-warning/90"
                          }`}>
                          {transitioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
                          {transitioning ? "Recording…" : confirmLabel}
                        </Button>
                      </div>
                    </form>
                  );
                })()}

                {/* Transition history */}
                {transitions.length > 0 && (
                  <div>
                    <button type="button" onClick={() => setShowHistory(v => !v)}
                      className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      <History className="h-4 w-4" />
                      Transition history ({transitions.length})
                      {showHistory ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
                    </button>

                    {showHistory && (
                      <div className="mt-3 space-y-2">
                        {transitions.map((t, i) => {
                          const typeLabel: Record<string, { label: string; cls: string }> = {
                            normal:      { label: "Handover",    cls: "bg-primary/10 text-primary" },
                            retirement:  { label: "Retirement",  cls: "bg-success/10 text-success" },
                            resignation: { label: "Resignation", cls: "bg-muted text-muted-foreground" },
                            dismissal:   { label: "Dismissal",   cls: "bg-destructive/10 text-destructive" },
                            demise:      { label: "Demise",      cls: "bg-slate-200 text-slate-700" },
                            emergency:   { label: "Emergency",   cls: "bg-destructive/10 text-destructive" },
                            disputed:    { label: "Disputed",    cls: "bg-warning/10 text-warning" },
                            other:       { label: "Other",       cls: "bg-muted text-muted-foreground" },
                          };
                          const badge = typeLabel[t.transition_type] ?? typeLabel.other;
                          return (
                          <div key={t.id}
                            className={`relative pl-5 ${i < transitions.length - 1 ? "pb-3" : ""}`}>
                            {/* Timeline line */}
                            {i < transitions.length - 1 && (
                              <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
                            )}
                            {/* Dot */}
                            <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                            <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                    <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badge.cls}`}>
                                      {badge.label}
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold">
                                    {t.outgoing_title} {t.outgoing_name}
                                    <span className="mx-1.5 text-muted-foreground">→</span>
                                    {t.incoming_title} {t.incoming_name}
                                  </p>
                                  {t.reason && (
                                    <p className="mt-0.5 text-[11px] text-muted-foreground italic">"{t.reason}"</p>
                                  )}
                                  {t.witness_name && (
                                    <p className="mt-1 text-[10px] text-muted-foreground">
                                      Witness: <span className="font-semibold text-foreground">{t.witness_name}</span>
                                    </p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-[10px] font-medium text-primary">
                                    {new Date(t.effective_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                  {t.signature_cleared && (
                                    <span className="text-[9px] text-warning">Signature cleared</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ); })}
                      </div>
                    )}
                  </div>
                )}

                {transitions.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    No transitions recorded yet. This log is permanent and tamper-proof.
                  </p>
                )}
              </div>
            </Card>

            {/* ══ STAFF EXIT LOG ════════════════════════════════════════════════════ */}
            <Card className="overflow-hidden border-border shadow-card">
              <SectionHeader
                label="Staff transition"
                title="Staff exit & departure log"
                description="Record when a teacher or staff member leaves — whether by resignation, retirement, dismissal, transfer, or bereavement. Every departure is permanently logged." />
              <div className="p-5 space-y-4">

                {/* Active teacher count */}
                <div className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Active teaching staff</p>
                    <p className="font-semibold text-sm">
                      {activeTeachers.length} {activeTeachers.length === 1 ? "teacher" : "teachers"} currently on record
                    </p>
                  </div>
                  {staffExits.length > 0 && (
                    <span className="text-[10px] rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
                      {staffExits.length} departed
                    </span>
                  )}
                </div>

                {/* Toggle form */}
                <Button type="button" variant="outline"
                  onClick={() => { setShowExitForm(v => !v); }}
                  className="w-full gap-2 border-warning/40 text-warning hover:bg-warning/5 hover:border-warning"
                  disabled={activeTeachers.length === 0}>
                  <ArrowRightLeft className="h-4 w-4" />
                  {activeTeachers.length === 0 ? "No active staff to record" : "Record staff departure"}
                  {showExitForm ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
                </Button>

                {showExitForm && (() => {
                  const EXIT_TYPES = [
                    { value: "resignation", label: "Resignation",            hint: "Teacher voluntarily leaving post" },
                    { value: "retirement",  label: "Retirement",             hint: "Long-serving teacher retiring" },
                    { value: "dismissal",   label: "Dismissal / termination",hint: "Removed from position by administration" },
                    { value: "transfer",    label: "Transfer",               hint: "Moving to another school or institution" },
                    { value: "demise",      label: "Demise (deceased)",      hint: "Teacher has passed away" },
                    { value: "emergency",   label: "Emergency / incapacitation", hint: "Sudden unavailability" },
                    { value: "other",       label: "Other",                  hint: "Any other reason" },
                  ];
                  const isDismissal = exitForm.exitType === "dismissal";
                  const isDemise    = exitForm.exitType === "demise";
                  const isEmergency = exitForm.exitType === "emergency";
                  const needsWitness = isDismissal || isDemise || isEmergency;
                  const bannerColor = isDemise
                    ? "border-slate-400/30 bg-slate-400/5 text-slate-600"
                    : isDismissal || isEmergency
                    ? "border-destructive/30 bg-destructive/5 text-destructive"
                    : "border-warning/30 bg-warning/5 text-warning";
                  const confirmLabel = isDemise    ? "Record with condolences"
                                     : isDismissal ? "Record dismissal"
                                     : isEmergency ? "Record emergency exit"
                                     : "Record departure";

                  return (
                    <form onSubmit={recordStaffExit} className="space-y-4 rounded-xl border border-warning/30 bg-warning/5 p-4">

                      {/* Teacher selector */}
                      <div>
                        <Label className="text-xs">Select teacher / staff member</Label>
                        <select
                          value={exitForm.teacherId}
                          onChange={e => {
                            const id = Number(e.target.value);
                            const teacher = activeTeachers.find(t => t.id === id);
                            setExitForm(p => ({
                              ...p,
                              teacherId:      id,
                              teacherName:    teacher?.name    ?? "",
                              teacherSubject: teacher?.subject ?? "",
                              teacherRole:    teacher?.role    ?? "",
                            }));
                          }}
                          required
                          className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          <option value={0} disabled>— Select a teacher —</option>
                          {activeTeachers.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name}{t.subject ? ` · ${t.subject}` : ""}{t.role ? ` (${t.role})` : ""}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Exit type */}
                      <div>
                        <Label className="text-xs">Nature of departure</Label>
                        <select
                          value={exitForm.exitType}
                          onChange={e => setExitForm(p => ({ ...p, exitType: e.target.value }))}
                          className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          {EXIT_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label} — {t.hint}</option>
                          ))}
                        </select>
                      </div>

                      {/* Contextual banner */}
                      <div className={`flex items-start gap-2 rounded-lg border p-3 ${bannerColor}`}>
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed">
                          {isDemise    && <><strong>We are sorry for your loss.</strong> This record will permanently note the passing and remove the teacher from the active list. Historical results are unaffected.<br /></>}
                          {isDismissal && <><strong>Dismissal / termination.</strong> This is a serious record. An authorising officer or witness name is required for verification. The record is permanent and cannot be undone.<br /></>}
                          {isEmergency && <><strong>Emergency exit.</strong> Use when the teacher is hospitalised or suddenly unreachable. A witness or verifier name is required.<br /></>}
                          {!isDemise && !isDismissal && !isEmergency && <>This will remove the teacher from the active staff list and <strong>permanently log the departure</strong>. Historical results are unaffected.</>}
                        </p>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label className="text-xs">Effective date</Label>
                          <Input type="date" value={exitForm.effectiveDate}
                            onChange={e => setExitForm(p => ({ ...p, effectiveDate: e.target.value }))}
                            className="mt-1.5 text-sm" required />
                        </div>
                        <div>
                          <Label className="text-xs">Reason / notes {needsWitness ? "" : "(optional)"}</Label>
                          <Input
                            value={exitForm.reason}
                            placeholder={isDemise ? "e.g. Passed on 1st August 2026" : isDismissal ? "e.g. Gross misconduct" : "e.g. Taking up another appointment"}
                            onChange={e => setExitForm(p => ({ ...p, reason: e.target.value }))}
                            className="mt-1.5 text-sm" />
                        </div>

                        {needsWitness && (
                          <div className="sm:col-span-2">
                            <Label className="text-xs">
                              {isDismissal ? "Authorising officer / witness name *" :
                               isDemise    ? "Next of kin / board witness name *" :
                                             "Witness / verifier name *"}
                            </Label>
                            <Input
                              value={exitForm.witnessName}
                              placeholder={isDismissal ? "Name of person authorising dismissal" : "Name of family member or board chair"}
                              onChange={e => setExitForm(p => ({ ...p, witnessName: e.target.value }))}
                              className="mt-1.5 text-sm border-warning" required />
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              This name is permanently recorded in the audit log.
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button type="button" variant="outline" size="sm"
                          onClick={() => setShowExitForm(false)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={staffExiting}
                          className={`gap-1.5 ${
                            isDemise    ? "bg-slate-700 text-white hover:bg-slate-800" :
                            isDismissal || isEmergency ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" :
                            "bg-warning text-warning-foreground hover:bg-warning/90"
                          }`}>
                          {staffExiting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRightLeft className="h-3.5 w-3.5" />}
                          {staffExiting ? "Recording…" : confirmLabel}
                        </Button>
                      </div>
                    </form>
                  );
                })()}

                {/* Departure history */}
                {staffExits.length > 0 && (
                  <div>
                    <button type="button" onClick={() => setShowExitHistory(v => !v)}
                      className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                      <History className="h-4 w-4" />
                      Departure history ({staffExits.length})
                      {showExitHistory ? <ChevronUp className="h-3.5 w-3.5 ml-auto" /> : <ChevronDown className="h-3.5 w-3.5 ml-auto" />}
                    </button>

                    {showExitHistory && (
                      <div className="mt-3 space-y-2">
                        {staffExits.map((e, i) => {
                          const EXIT_BADGE: Record<string, { label: string; cls: string }> = {
                            resignation: { label: "Resignation", cls: "bg-muted text-muted-foreground" },
                            retirement:  { label: "Retirement",  cls: "bg-success/10 text-success" },
                            dismissal:   { label: "Dismissal",   cls: "bg-destructive/10 text-destructive" },
                            transfer:    { label: "Transfer",    cls: "bg-primary/10 text-primary" },
                            demise:      { label: "Demise",      cls: "bg-slate-200 text-slate-700" },
                            emergency:   { label: "Emergency",   cls: "bg-destructive/10 text-destructive" },
                            other:       { label: "Other",       cls: "bg-muted text-muted-foreground" },
                          };
                          const badge = EXIT_BADGE[e.exit_type] ?? EXIT_BADGE.other;
                          return (
                            <div key={e.id} className={`relative pl-5 ${i < staffExits.length - 1 ? "pb-3" : ""}`}>
                              {i < staffExits.length - 1 && (
                                <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
                              )}
                              <div className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-primary bg-background" />
                              <div className="rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                      <span className={`inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${badge.cls}`}>
                                        {badge.label}
                                      </span>
                                    </div>
                                    <p className="text-xs font-semibold">
                                      {e.teacher_name}
                                      {e.teacher_subject && <span className="font-normal text-muted-foreground ml-1">· {e.teacher_subject}</span>}
                                      {e.teacher_role    && <span className="font-normal text-muted-foreground ml-1">({e.teacher_role})</span>}
                                    </p>
                                    {e.reason     && <p className="mt-0.5 text-[11px] text-muted-foreground italic">"{e.reason}"</p>}
                                    {e.witness_name && <p className="mt-1 text-[10px] text-muted-foreground">Witness: <span className="font-semibold text-foreground">{e.witness_name}</span></p>}
                                    {e.recorded_by  && <p className="text-[10px] text-muted-foreground">Recorded by: {e.recorded_by}</p>}
                                  </div>
                                  <p className="text-[10px] font-medium text-primary shrink-0">
                                    {new Date(e.effective_date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                </div>
                              </div>
                            </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                )}

                {staffExits.length === 0 && (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    No departures recorded yet. This log is permanent and tamper-proof.
                  </p>
                )}
              </div>
            </Card>

            {/* ══ SCHOOL STAMP ══════════════════════════════════════════ */}
            <Card className="overflow-hidden border-border shadow-card">
              <SectionHeader label="Official school stamp" title="Create an official school stamp"
                description="Choose a stamp style, pick your ink colour, generate and save. The stamp appears on every printed result sheet." />
              <div className="p-5 space-y-5">

                {/* Stamp Shape / Type Picker — visual preview cards */}
                <div>
                  <Label className="text-xs font-semibold">Stamp format</Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
                    The oval seal is the most prestigious choice for schools. Round is the most familiar. Rectangular is best when your school already uses a box-style stamp.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {([
                      {
                        key: "circle",
                        label: "Royal Round Seal",
                        badge: "Standard",
                        desc: "Classic double-ring seal with beaded security border & heraldic crest",
                        preview: (
                          <svg viewBox="0 0 64 64" className="w-full h-16">
                            <circle cx="32" cy="32" r="30" fill="none" stroke={inkColor} strokeWidth="2.5" />
                            <circle cx="32" cy="32" r="26" fill="none" stroke={inkColor} strokeWidth="0.8" strokeDasharray="1 1.5" />
                            <circle cx="32" cy="32" r="24" fill="none" stroke={inkColor} strokeWidth="1" />
                            <circle cx="32" cy="32" r="16" fill="none" stroke={inkColor} strokeWidth="0.8" />
                            <text x="32" y="14" textAnchor="middle" fontSize="4.2" fontWeight="900" fill={inkColor} fontFamily="serif">SCHOOL NAME</text>
                            {/* Shield icon */}
                            <path d="M28 26 L36 26 L36 32 Q36 36 32 38 Q28 36 28 32 Z" fill="none" stroke={inkColor} strokeWidth="0.8" />
                            <rect x="23" y="40" width="18" height="4" fill="none" stroke={inkColor} strokeWidth="0.6" />
                            <text x="32" y="43" textAnchor="middle" fontSize="3" fontWeight="900" fill={inkColor} fontFamily="sans-serif">OFFICIAL</text>
                            <text x="32" y="53" textAnchor="middle" fontSize="3.5" fontWeight="700" fill={inkColor} fontFamily="serif">LOCATION · EST</text>
                          </svg>
                        ),
                      },
                      {
                        key: "oval",
                        label: "Executive Oval Seal",
                        badge: "Prestigious",
                        desc: "Elliptical institutional seal with dual beaded rings & heraldic arms",
                        preview: (
                          <svg viewBox="0 0 80 64" className="w-full h-16">
                            <ellipse cx="40" cy="32" rx="38" ry="28" fill="none" stroke={inkColor} strokeWidth="2.5" />
                            <ellipse cx="40" cy="32" rx="34" ry="24" fill="none" stroke={inkColor} strokeWidth="0.8" strokeDasharray="1 1.5" />
                            <ellipse cx="40" cy="32" rx="31" ry="22" fill="none" stroke={inkColor} strokeWidth="1" />
                            <ellipse cx="40" cy="32" rx="20" ry="14" fill="none" stroke={inkColor} strokeWidth="0.8" />
                            <text x="40" y="16" textAnchor="middle" fontSize="4.5" fontWeight="900" fill={inkColor} fontFamily="serif">SCHOOL NAME</text>
                            <path d="M36 27 L44 27 L44 32 Q44 35 40 37 Q36 35 36 32 Z" fill="none" stroke={inkColor} strokeWidth="0.8" />
                            <rect x="30" y="39" width="20" height="4" fill="none" stroke={inkColor} strokeWidth="0.6" />
                            <text x="40" y="42" textAnchor="middle" fontSize="3" fontWeight="900" fill={inkColor} fontFamily="sans-serif">OFFICIAL SEAL</text>
                            <text x="40" y="52" textAnchor="middle" fontSize="3.8" fontWeight="700" fill={inkColor} fontFamily="serif">EXAMS & RECORDS</text>
                          </svg>
                        ),
                      },
                      {
                        key: "rectangle",
                        label: "Examinations Box",
                        badge: "Verified",
                        desc: "Official rectangular certification stamp with date & signature lines",
                        preview: (
                          <svg viewBox="0 0 80 56" className="w-full h-16">
                            <rect x="2" y="3" width="76" height="50" fill="none" stroke={inkColor} strokeWidth="2.2" />
                            <rect x="5" y="6" width="70" height="44" fill="none" stroke={inkColor} strokeWidth="0.8" />
                            <line x1="5" y1="18" x2="75" y2="18" stroke={inkColor} strokeWidth="0.8" />
                            <line x1="5" y1="40" x2="75" y2="40" stroke={inkColor} strokeWidth="0.8" />
                            <text x="40" y="14" textAnchor="middle" fontSize="5.2" fontWeight="900" fill={inkColor} fontFamily="serif">SCHOOL NAME</text>
                            <path d="M12 24 L20 24 L20 30 Q20 33 16 35 Q12 33 12 30 Z" fill="none" stroke={inkColor} strokeWidth="0.7" />
                            <text x="24" y="27" textAnchor="start" fontSize="4.5" fontWeight="900" fill={inkColor} fontFamily="sans-serif">OFFICIAL STAMP</text>
                            <text x="24" y="34" textAnchor="start" fontSize="3.2" fontWeight="700" fill={inkColor} fontFamily="monospace">VERIFIED RECORD</text>
                            <text x="10" y="47" textAnchor="start" fontSize="3.5" fontWeight="700" fill={inkColor} fontFamily="monospace">DATE: 2026</text>
                            <text x="70" y="47" textAnchor="end" fontSize="3.5" fontWeight="700" fill={inkColor} fontFamily="monospace">SIGN: ____</text>
                          </svg>
                        ),
                      },
                      {
                        key: "rosette",
                        label: "Notary Starburst",
                        badge: "Embossed",
                        desc: "36-point scalloped notary seal for certified transcripts & certificates",
                        preview: (
                          <svg viewBox="0 0 64 64" className="w-full h-16">
                            <circle cx="32" cy="32" r="30" fill="none" stroke={inkColor} strokeWidth="1.8" strokeDasharray="2.5 1.5" />
                            <circle cx="32" cy="32" r="26" fill="none" stroke={inkColor} strokeWidth="0.8" strokeDasharray="1 1.2" />
                            <circle cx="32" cy="32" r="24" fill="none" stroke={inkColor} strokeWidth="1.2" />
                            <circle cx="32" cy="32" r="16" fill="none" stroke={inkColor} strokeWidth="0.8" />
                            <text x="32" y="14" textAnchor="middle" fontSize="4" fontWeight="900" fill={inkColor} fontFamily="serif">SCHOOL NAME</text>
                            <path d="M28 26 L36 26 L36 32 Q36 36 32 38 Q28 36 28 32 Z" fill="none" stroke={inkColor} strokeWidth="0.8" />
                            <rect x="23" y="40" width="18" height="4" fill="none" stroke={inkColor} strokeWidth="0.6" />
                            <text x="32" y="43" textAnchor="middle" fontSize="3" fontWeight="900" fill={inkColor} fontFamily="sans-serif">CERTIFIED</text>
                            <text x="32" y="53" textAnchor="middle" fontSize="3.5" fontWeight="700" fill={inkColor} fontFamily="serif">OFFICIAL SEAL</text>
                          </svg>
                        ),
                      },
                    ] as const).map(({ key, label, badge, desc, preview }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setStampShape(key)}
                        className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all ${
                          stampShape === key
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/40 hover:bg-muted/20"
                        }`}
                      >
                        {badge && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-primary-foreground">
                            {badge}
                          </span>
                        )}
                        {/* Live SVG preview of this stamp style */}
                        <div className={`w-full rounded-lg p-2 transition-colors ${
                          stampShape === key ? "bg-white" : "bg-muted/30"
                        }`}>
                          {preview}
                        </div>
                        <span className="text-xs font-bold text-foreground leading-tight">{label}</span>
                        <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
                        {stampShape === key && (
                          <CheckCircle2 className="absolute top-2 right-2 h-3.5 w-3.5 text-primary bg-background rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Stamp Wording / Designation */}
                <div>
                  <Label className="text-xs font-semibold">Official Designation / Center Wording</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {["OFFICIAL SEAL", "APPROVED & VERIFIED", "CERTIFIED TRUE COPY", "EXAMINATION OFFICE"].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setStampSubText(w)}
                        className={`rounded-lg border px-3 py-1 text-xs font-semibold transition-all ${
                          stampSubText === w
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                  <Input
                    value={stampSubText}
                    onChange={(e) => setStampSubText(e.target.value.toUpperCase())}
                    placeholder="e.g. OFFICIAL SEAL"
                    className="mt-2 font-mono text-xs uppercase"
                  />
                </div>

                {/* Ink colour */}
                <div>
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <Droplets className="h-3.5 w-3.5 text-primary" /> Ink colour
                  </Label>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {INK_PRESETS.map((p) => (
                      <button key={p.color} type="button"
                        onClick={() => setInkColor(p.color)}
                        title={p.label}
                        className={`h-8 w-8 rounded-full border-2 transition-all ${inkColor === p.color ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
                        style={{ backgroundColor: p.color }} />
                    ))}
                    {/* Custom ink picker */}
                    <div className="relative h-8 w-8">
                      <Input type="color" value={inkColor}
                        onChange={(e) => setInkColor(e.target.value)}
                        className="absolute inset-0 h-full w-full cursor-pointer rounded-full p-0.5 opacity-0" />
                      <div
                        className="h-8 w-8 rounded-full border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-[9px] text-muted-foreground"
                        style={{ backgroundColor: INK_PRESETS.some(p => p.color === inkColor) ? "transparent" : inkColor }}>
                        {INK_PRESETS.some(p => p.color === inkColor) ? "+" : ""}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Preset ink colours or pick a custom colour. Your school's primary colour is also a great choice.
                  </p>
                </div>

                {/* Canvas preview */}
                <div className="flex flex-col items-center gap-4">
                  <div className="relative rounded-2xl border-2 border-dashed border-border bg-[#f8f9fc] p-4 flex items-center justify-center"
                    style={{ minHeight: 280 }}>
                    {!stampRendered && !stampGenerating && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Stamp className="h-10 w-10 opacity-20" />
                        <p className="text-xs">Click "Generate stamp" to preview</p>
                      </div>
                    )}
                    {stampGenerating && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                    <canvas
                      ref={stampCanvasRef}
                      width={480}
                      height={480}
                      className={`transition-opacity duration-300 ${stampRendered ? "opacity-100" : "opacity-0"}`}
                      style={{ width: 260, height: 260 }}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline"
                      onClick={() => generateStamp()}
                      disabled={stampGenerating || !form.name || !form.city}
                      className="gap-1.5">
                      {stampGenerating
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <RefreshCw className="h-4 w-4" />}
                      {stampRendered ? "Regenerate" : "Generate stamp"}
                    </Button>
                    <Button type="button"
                      onClick={saveStamp}
                      disabled={!stampRendered || uploading === "stamp"}
                      className="gap-1.5 gradient-primary text-primary-foreground">
                      {uploading === "stamp"
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Save className="h-4 w-4" />}
                      {uploading === "stamp" ? "Saving…" : "Save stamp to profile"}
                    </Button>
                  </div>
                </div>

                {/* Saved stamp */}
                {form.stampUrl && (
                  <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/5 p-4">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-success">Stamp on file</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        This stamp is applied to all printed result sheets.
                      </p>
                      <img src={form.stampUrl} alt="School stamp"
                        onClick={() => setStampExpanded(true)}
                        title="Click to expand"
                        className="mt-3 h-20 w-20 object-contain hover:scale-105 transition-transform duration-200 cursor-pointer border border-border/40 rounded-lg p-1 bg-white shadow-sm" />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={removeStamp}
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ══ RIGHT COLUMN — live preview (Desktop view) ════════════════════ */}
          <div className="hidden lg:block xl:sticky xl:top-6 xl:self-start space-y-4">
            <ResultSheetPreviewCard form={form} setStampExpanded={setStampExpanded} />

            {/* Info */}
            <Card className="border-border bg-primary/5 p-4">
              <div className="flex items-start gap-2">
                <User className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-primary">Phase-aware signing authority</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Primary school result sheets default to <strong>Head Teacher</strong>.{" "}
                    Secondary school result sheets default to <strong>Principal</strong>.{" "}
                    Your custom title here overrides both.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Floating Mobile Live Preview Trigger Button */}
          <Button
            type="button"
            onClick={() => setShowLivePreviewModal(true)}
            className="lg:hidden fixed bottom-6 right-6 z-40 gap-2 rounded-full bg-primary text-primary-foreground shadow-2xl px-5 py-3 text-xs font-bold hover:bg-primary/90 transition-all hover:scale-105"
          >
            <Eye className="h-4.5 w-4.5" /> View Live Preview
          </Button>

          {/* Save button */}
          <div className="flex justify-end lg:col-span-2">
            <Button type="submit" disabled={saving || uploading !== null}
              className="gradient-primary text-primary-foreground shadow-elegant gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <SaveIcon className="h-4 w-4" />}
              {saving ? "Saving…" : "Save school settings"}
            </Button>
          </div>
        </form>
      )}
    </div>

    {/* Live Result Sheet Preview Modal Dialog */}
    <Dialog open={showLivePreviewModal} onOpenChange={setShowLivePreviewModal}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold">
            <Eye className="h-4 w-4 text-primary" />
            <span>Live Printed Result-Sheet Preview</span>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <ResultSheetPreviewCard form={form} setStampExpanded={setStampExpanded} />
        </div>
      </DialogContent>
    </Dialog>

    {/* Expanded Stamp Dialog */}
    <Dialog open={stampExpanded} onOpenChange={setStampExpanded}>
      <DialogContent className="max-w-xs sm:max-w-sm flex flex-col items-center p-6 text-center">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold flex items-center gap-2">
            <Stamp className="h-4 w-4 text-primary" />
            <span>Official School Stamp</span>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 p-6 rounded-2xl bg-white border border-border/80 shadow-elegant flex items-center justify-center">
          {form.stampUrl ? (
            <img
              src={form.stampUrl}
              alt="School Stamp Expanded"
              className="h-48 w-48 object-contain"
            />
          ) : (
            <p className="text-xs text-muted-foreground">No stamp uploaded</p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
          This stamp will be digitally rendered onto all printed student results sheets.
        </p>
        <Button size="sm" variant="outline" onClick={() => setStampExpanded(false)} className="mt-2 w-full text-xs font-semibold">
          Close Preview
        </Button>
      </DialogContent>
    </Dialog>
    </>
  );
}

// ── Sub-components & Helpers ──────────────────────────────────────────────────

function ResultSheetPreviewCard({
  form,
  setStampExpanded,
}: {
  form: any;
  setStampExpanded: (v: boolean) => void;
}) {
  const s = form.letterheadStyle;
  const isCenter = form.logoPlacement === "center";
  const isRight = form.logoPlacement === "right";
  const pc = form.primaryColor;
  const sc = form.secondaryColor;
  const hdr =
    !form.headerTextColor || form.headerTextColor === "auto"
      ? "#ffffff"
      : form.headerTextColor;
  const fontFamilyMap: Record<string, string> = {
    inter: "Inter, sans-serif",
    poppins: "Poppins, sans-serif",
    montserrat: "Montserrat, sans-serif",
    raleway: "Raleway, sans-serif",
    oswald: "Oswald, sans-serif",
    playfair: "'Playfair Display', serif",
    lora: "Lora, serif",
    garamond: "'EB Garamond', serif",
    crimson: "'Crimson Text', serif",
    libre: "'Libre Baskerville', serif",
  };
  const fontFamily = fontFamilyMap[form.fontFamily] || "Inter, sans-serif";
  const addr = form.address || "123 School Street, City";
  const phone = form.contactPhone || "+234 000 0000";
  const email = form.contactEmail || "info@school.edu";

  const LogoEl = form.logoUrl ? (
    <img src={form.logoUrl} alt="" className="h-10 w-10 shrink-0 object-contain z-10" />
  ) : null;

  const rowLayout = isCenter
    ? "flex-col items-center text-center"
    : "flex-row items-center justify-between";

  const NameEl = (color: string, muted: string) => (
    <div className={`z-10 flex-1 ${isCenter ? "text-center" : ""}`}>
      <p className="font-bold text-sm uppercase leading-tight" style={{ color }}>
        {form.name || "Your School Name"}
      </p>
      <p className="text-[10px] italic mt-0.5" style={{ color: muted }}>
        {form.motto || "School motto"}
      </p>
    </div>
  );
  const HeaderContent = (color: string, muted: string) =>
    isRight ? (
      <>
        {NameEl(color, muted)}
        {LogoEl}
      </>
    ) : (
      <>
        {LogoEl}
        {NameEl(color, muted)}
      </>
    );

  const PrevContact = (color: string) => (
    <div
      className={`flex flex-wrap gap-x-3 gap-y-0.5 mt-2 text-[8px] ${
        isCenter ? "justify-center" : ""
      }`}
      style={{ color }}
    >
      <span className="flex items-center gap-0.5">
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        {addr}
      </span>
      <span className="flex items-center gap-0.5">
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.06 6.06l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.93 16.92Z" />
        </svg>
        {phone}
      </span>
      <span className="flex items-center gap-0.5">
        <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
        {email}
      </span>
    </div>
  );

  return (
    <Card className="overflow-hidden border-border shadow-elegant p-0">
      {/* Live letterhead preview — reflects all 6 styles in real time */}
      {(() => {
        if (s === "classic-banner")
          return (
            <div
              className="relative overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${pc}, ${pc}dd)`,
                fontFamily,
                fontWeight: form.fontWeight,
              }}
            >
              <div className="px-4 pt-4 pb-2">
                <div className={`flex gap-3 ${rowLayout}`}>{HeaderContent(hdr, hdr + "cc")}</div>
                {PrevContact(hdr + "bb")}
                <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.2em]" style={{ color: sc }}>
                  Official Student Performance Report
                </p>
              </div>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${sc}, ${sc}44, ${sc})` }} />
            </div>
          );

        if (s === "arch-crest")
          return (
            <div className="bg-white" style={{ fontFamily, fontWeight: form.fontWeight }}>
              <div className="relative w-full" style={{ overflow: "visible" }}>
                <svg
                  viewBox="0 0 600 125"
                  preserveAspectRatio="xMidYMid meet"
                  className="w-full"
                  style={{ display: "block", overflow: "visible" }}
                >
                  <defs>
                    <path id="prev-arch-top" d="M 20 120 A 600 600 0 0 1 580 120" />
                  </defs>
                  <path d="M 20 120 A 600 600 0 0 1 580 120" fill="none" stroke={pc} strokeWidth="1" opacity="0.15" />
                  <text fontWeight="bold" fontSize="24" fill={pc} textAnchor="middle" letterSpacing="3">
                    <textPath href="#prev-arch-top" startOffset="50%">
                      {(form.name || "SCHOOL NAME").toUpperCase()}
                    </textPath>
                  </text>
                </svg>
                <div className="flex items-center justify-center gap-3 -mt-4">
                  {LogoEl}
                  <p className="text-[9px] italic" style={{ color: pc + "99" }}>
                    {form.motto || "School motto"}
                  </p>
                </div>
              </div>
              <div className="px-4 pb-2 pt-1 text-center">{PrevContact(pc + "88")}</div>
              <div className="border-b-2" style={{ borderBottomColor: pc }} />
              <div className="px-4 py-1.5 flex items-center justify-between">
                <span
                  className="text-[7px] font-bold uppercase tracking-widest rounded px-2 py-0.5"
                  style={{ backgroundColor: pc, color: "#fff" }}
                >
                  Official Academic Record
                </span>
                <span className="text-[7px]" style={{ color: pc + "cc" }}>
                  First Term · 2024/2025
                </span>
              </div>
            </div>
          );

        if (s === "royal-split")
          return (
            <div className={`flex min-h-[90px] ${isRight ? "flex-row-reverse" : ""}`} style={{ fontFamily, fontWeight: form.fontWeight }}>
              <div className="w-16 flex flex-col items-center justify-center gap-1.5 px-2 py-3 shrink-0" style={{ backgroundColor: pc }}>
                {LogoEl}
                <div className="w-full h-[1px]" style={{ backgroundColor: "rgba(255,255,255,0.2)" }} />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div className="px-3 pt-3">
                  <p className="font-bold text-sm uppercase" style={{ color: pc }}>
                    {form.name || "School Name"}
                  </p>
                  <p className="text-[9px] italic text-muted-foreground">{form.motto || "Motto"}</p>
                  {PrevContact(pc + "88")}
                </div>
                <div className="px-3 pb-2 border-t border-border/40">
                  <div className="mt-1.5 flex items-center justify-between">
                    <span
                      className="text-[7px] font-bold uppercase tracking-widest rounded px-2 py-0.5"
                      style={{ backgroundColor: pc, color: "#fff" }}
                    >
                      Official Academic Record
                    </span>
                    <span className="text-[7px]" style={{ color: pc + "cc" }}>
                      2024/2025
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );

        if (s === "minimalist-line")
          return (
            <div className="p-4 bg-white" style={{ fontFamily, fontWeight: form.fontWeight }}>
              <div className={`flex gap-3 ${isCenter ? "flex-col items-center text-center" : isRight ? "flex-row items-center justify-between" : "flex-row items-center"}`}>
                {isRight ? (
                  <>
                    {NameEl(pc, pc + "99")}
                    {LogoEl}
                  </>
                ) : (
                  <>
                    {LogoEl}
                    {NameEl(pc, pc + "99")}
                  </>
                )}
              </div>
              <div className="mt-2 h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${pc}, ${sc}, ${pc})` }} />
              <div className="mt-0.5 h-[1px] w-full" style={{ backgroundColor: pc + "33" }} />
              {PrevContact(pc + "88")}
              <p className="mt-1.5 text-[7px] font-bold uppercase tracking-wider" style={{ color: pc + "88" }}>
                First Term · 2024/2025 · Official Academic Record
              </p>
            </div>
          );

        if (s === "centred-formal")
          return (
            <div className="p-4 bg-white" style={{ fontFamily, fontWeight: form.fontWeight }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-[1.5px]" style={{ backgroundColor: pc }} />
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sc }} />
                <div className="flex-1 h-[1.5px]" style={{ backgroundColor: pc }} />
              </div>
              <div className="flex flex-col items-center text-center">
                {LogoEl}
                <p className="mt-1.5 font-bold text-sm uppercase" style={{ color: pc }}>
                  {form.name || "School Name"}
                </p>
                <p className="text-[9px] italic mt-0.5" style={{ color: pc + "99" }}>
                  {form.motto || "Motto"}
                </p>
                {PrevContact(pc + "88")}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-[2px]" style={{ backgroundColor: pc }} />
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: sc }} />
                <div className="flex-1 h-[2px]" style={{ backgroundColor: pc }} />
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span
                  className="text-[7px] font-bold uppercase tracking-widest rounded px-2 py-0.5"
                  style={{ backgroundColor: pc, color: "#fff" }}
                >
                  Official Academic Record
                </span>
                <span className="text-[7px]" style={{ color: pc + "cc" }}>
                  First Term · 2024/2025
                </span>
              </div>
            </div>
          );

        return (
          <div
            className="relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${pc} 0%, ${pc}99 70%, ${sc}55 100%)`,
              fontFamily,
              fontWeight: form.fontWeight,
            }}
          >
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #fff 0px, #fff 1px, transparent 0, transparent 50%)",
                backgroundSize: "10px 10px",
              }}
            />
            <div className="relative px-4 pt-4 pb-2">
              <div className={`flex gap-3 ${rowLayout}`}>{HeaderContent(hdr, hdr + "cc")}</div>
              {PrevContact(hdr + "bb")}
              <p className="mt-2 text-[8px] font-bold uppercase tracking-[0.2em]" style={{ color: sc }}>
                Official Student Performance Report
              </p>
            </div>
            <div className="h-[3px]" style={{ background: `linear-gradient(90deg, ${sc}00, ${sc}, ${sc}00)` }} />
          </div>
        );
      })()}

      {/* Result sheet snippet */}
      <div className="space-y-3 p-5 border-b border-border">
        {["Student identity & class info", "Subject scores & grade table", "Attendance & development", "Teacher remarks"].map(
          (item) => (
            <div key={item} className="rounded-lg bg-muted px-4 py-2.5 text-sm text-muted-foreground">
              {item}
            </div>
          ),
        )}
      </div>

      {/* Signature + stamp footer preview */}
      <div className="border-t border-border">
        <p className="px-5 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Result sheet footer preview
        </p>
        <div className="px-5 pb-5 flex items-end justify-between gap-6">
          <div className="flex-1 flex flex-col">
            <div className="flex items-end" style={{ minHeight: 72 }}>
              {form.signatureUrl ? (
                <img
                  src={form.signatureUrl}
                  alt="Signature"
                  className="object-contain"
                  style={{ maxHeight: 64, maxWidth: 220 }}
                />
              ) : (
                <div className="w-48 border-b-2 border-foreground/25" style={{ height: 56 }}>
                  <span className="block text-[9px] text-muted-foreground/40 italic mt-auto pt-8 pl-1">
                    Draw or upload signature
                  </span>
                </div>
              )}
            </div>
            <div className="w-48 h-[1.5px] bg-foreground/30 mt-0" />
            <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-foreground/70">
              {form.headTitle || "Principal"}
            </p>
            <p className="text-[10px] text-muted-foreground">{form.adminName || "Administrator name"}</p>
            <p className="mt-0.5 text-[9px] text-muted-foreground/60">Date: _______________</p>
          </div>

          <div className="flex flex-col items-center gap-1">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/50 mb-1">
              Official Stamp
            </p>
            {form.stampUrl ? (
              <img
                src={form.stampUrl}
                alt="School stamp"
                onClick={() => setStampExpanded(true)}
                title="Click to expand"
                className="object-contain hover:scale-105 transition-transform duration-200 cursor-pointer"
                style={{ height: 96, width: 96, transform: "rotate(-3deg)", opacity: 0.85 }}
              />
            ) : (
              <div
                className="rounded-full border-2 border-dashed border-muted-foreground/25 flex flex-col items-center justify-center gap-1"
                style={{ height: 96, width: 96 }}
              >
                <Stamp className="h-7 w-7 text-muted-foreground/25" />
                <span className="text-[7px] text-muted-foreground/30 text-center leading-tight">
                  No stamp
                  <br />
                  uploaded
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────────

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
      <path d="M7 3v4a1 1 0 0 0 1 1h7" />
    </svg>
  );
}

function SectionHeader({
  label, title, description,
}: { label: string; title: string; description?: string }) {
  return (
    <div className="border-b border-border bg-muted/30 px-5 py-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">{label}</p>
      <h2 className="mt-0.5 font-display text-base font-semibold">{title}</h2>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}
