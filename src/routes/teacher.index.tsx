import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  FileSpreadsheet,
  Loader2,
  Users,
  ArrowUpRight,
  Megaphone,
  Calendar,
  GraduationCap,
  Plus,
  FileCheck2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getHeadTeacherDashboardDb } from "@/lib/api/db.functions";
import { useTeacherProfile } from "./teacher";

export const Route = createFileRoute("/teacher/")({ component: HeadTeacherOverview });

function HeadTeacherOverview() {
  type DashboardData = {
    summary: { students: number; classes: number; assignments: number; result_records: number };
    classes: Array<{ class_name: string; students: number }>;
    recentAssignments: Array<{
      id: number;
      title: string;
      class_name: string;
      subject: string;
      due_date: string;
    }>;
    announcements: Array<{
      id: number;
      title: string;
      body: string;
      priority: string;
      created_at: string;
    }>;
  };

  const { profile } = useTeacherProfile();
  
  // Instant SWR Cache: Load cached teacher dashboard metrics immediately
  const [data, setData] = useState<DashboardData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("teacher_dashboard_data");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    const token = localStorage.getItem("teacher_token");
    if (!token) return;
    getHeadTeacherDashboardDb({ data: { token } })
      .then((res) => {
        if (res) {
          setData(res as unknown as DashboardData);
          try {
            localStorage.setItem("teacher_dashboard_data", JSON.stringify(res));
          } catch {
            // fallback
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const summary = data?.summary || { students: 0, classes: 0, assignments: 0, result_records: 0 };

  const kpis = [
    {
      label: "Enrolled Learners",
      value: summary.students.toLocaleString(),
      delta: "In assigned classes",
      icon: Users,
      tone: "primary",
    },
    {
      label: "Assigned Classes",
      value: summary.classes,
      delta: profile?.assignedClasses || "Active cohorts",
      icon: BookOpen,
      tone: "accent",
    },
    {
      label: "Published Assignments",
      value: summary.assignments,
      delta: "Active term coursework",
      icon: ClipboardCheck,
      tone: "warning",
    },
    {
      label: "Submitted Results",
      value: summary.result_records,
      delta: "Terminal score sheets",
      icon: FileSpreadsheet,
      tone: "success",
    },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* ── HEADER BANNER ── */}
      <div className="relative overflow-hidden rounded-2xl bg-[#07111f] p-6 sm:p-8 text-white shadow-card border border-border">
        <div className="absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_1px_1px,#fff_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#e0bd6a] mb-3 backdrop-blur-sm border border-white/10">
              <GraduationCap className="h-3.5 w-3.5" />
              {profile?.role || "Head Teacher"} · {profile?.subject || "All Subjects"}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
              Welcome back, {profile?.name || "Teacher"}
            </h1>
            <p className="mt-2 max-w-2xl text-xs sm:text-sm text-white/65 leading-relaxed">
              Your academic workspace is live. Enter term results, coordinate classroom activities, and submit terminal evaluations directly to School Admin for review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button asChild size="sm" className="gradient-primary text-primary-foreground shadow-sm text-xs font-semibold gap-1.5">
              <Link to="/teacher/results">
                <FileSpreadsheet className="h-4 w-4" /> Enter Term Scores
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs gap-1.5">
              <Link to="/teacher/assignments">
                <Plus className="h-4 w-4" /> New Assignment
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ── KPI METRICS ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-border p-5 shadow-card bg-card">
            <div className="flex items-start justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                <k.icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">{k.label}</p>
            {loading && !data ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-muted/60" />
            ) : (
              <p className="mt-1 font-display text-3xl font-bold tracking-tight text-foreground">{k.value}</p>
            )}
            <p className="mt-1 text-xs text-muted-foreground truncate">{k.delta}</p>
          </Card>
        ))}
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Classes Card */}
        <Card className="border-border shadow-card overflow-hidden">
          <CardHeader className="border-b bg-muted/30 px-5 py-3.5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Assigned Classes & Cohorts
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/10">
              <Link to="/teacher/classes">View Rosters →</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 space-y-2.5">
            {data?.classes?.length ? (
              data.classes.map((row) => (
                <div
                  key={row.class_name}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/15 p-3.5 text-xs transition-all hover:bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                      {row.class_name.substring(0, 3)}
                    </span>
                    <div>
                      <span className="font-bold text-foreground text-sm">{row.class_name}</span>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Active Term Class</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {row.students} Students
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <Users className="h-8 w-8 mx-auto opacity-30 mb-2" />
                No classes assigned to your profile yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Assignments Card */}
        <Card className="border-border shadow-card overflow-hidden">
          <CardHeader className="border-b bg-muted/30 px-5 py-3.5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4 text-primary" />
              Recent Assignments
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/10">
              <Link to="/teacher/assignments">Manage All →</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-5 space-y-2.5">
            {data?.recentAssignments?.length ? (
              data.recentAssignments.map((row) => (
                <div key={row.id} className="rounded-xl border border-border/80 bg-muted/15 p-3.5 text-xs transition-all hover:bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-foreground text-sm">{row.title}</p>
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shrink-0">
                      {row.class_name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[11px] text-muted-foreground">
                    <span>Subject: <strong className="text-foreground">{row.subject}</strong></span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3 text-primary" />
                      Due: {new Date(row.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted-foreground">
                <FileCheck2 className="h-8 w-8 mx-auto opacity-30 mb-2" />
                No assignments published for this term yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── SCHOOL ANNOUNCEMENTS ── */}
      {data?.announcements?.length ? (
        <Card className="border-border shadow-card overflow-hidden">
          <CardHeader className="border-b bg-muted/30 px-5 py-3.5">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-primary" />
              School Leadership Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 grid gap-3 sm:grid-cols-2">
            {data.announcements.map((item) => (
              <article key={item.id} className="rounded-xl border border-border/80 bg-muted/15 p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-sm text-foreground">{item.title}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    item.priority === "Urgent"
                      ? "bg-destructive/15 text-destructive"
                      : item.priority === "Important"
                        ? "bg-warning/20 text-warning-foreground"
                        : "bg-primary/10 text-primary"
                  }`}>
                    {item.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.body}</p>
                <p className="text-[10px] text-muted-foreground/70 pt-1 font-mono">
                  {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </article>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
