import { createFileRoute } from "@tanstack/react-router";
import { Users, FileSpreadsheet, Calendar, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Link } from "@tanstack/react-router";
import { useTeacherProfile } from "./teacher";

export const Route = createFileRoute("/teacher/")({
  component: TeacherOverviewPage,
});

function TeacherOverviewPage() {
  const { profile } = useTeacherProfile();
  
  // Format assigned classes for display
  const classList = profile?.assignedClasses 
    ? profile.assignedClasses.split(",").map((c: string) => c.trim())
    : [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Good morning, {profile?.name.split(" ")[0]}</h1>
        <p className="text-muted-foreground mt-1">Here is what is happening in your classroom today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Assigned Classes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classList.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all levels</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
              Results Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">Classes need scores</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-amber-500" />
              Periods Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground mt-1">Next: JSS 2 Mathematics</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get straight to work.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link to="/teacher/results" className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Enter Results</p>
                  <p className="text-xs text-muted-foreground">Log scores for your classes</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
            
            <Link to="/teacher/classes" className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm">View Classes</p>
                  <p className="text-xs text-muted-foreground">See student rosters and details</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>Your assigned teaching load.</CardDescription>
          </CardHeader>
          <CardContent>
            {classList.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {classList.map((c: string) => (
                  <span key={c} className="inline-flex items-center px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium">
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No classes assigned to you yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
