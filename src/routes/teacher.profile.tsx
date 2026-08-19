import { createFileRoute } from "@tanstack/react-router";
import { User, ShieldCheck, Mail, BookOpen, GraduationCap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTeacherProfile } from "./teacher";

export const Route = createFileRoute("/teacher/profile")({
  component: TeacherProfilePage,
});

function TeacherProfilePage() {
  const { profile } = useTeacherProfile();

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-1">View your staff information and account details.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="md:col-span-1">
          <Card className="border-border shadow-sm text-center">
            <CardContent className="pt-8 pb-6">
              <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-4 border-background shadow-sm">
                {profile?.name?.substring(0, 2).toUpperCase() || "T"}
              </div>
              <h2 className="text-xl font-bold">{profile?.name}</h2>
              <p className="text-sm text-primary font-medium mt-1">{profile?.role}</p>
              
              <div className="mt-6 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-semibold text-success">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Account Active
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Details Card */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>Staff Information</CardTitle>
              <CardDescription>Your official details as registered by the school administrator.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" /> Staff ID
                  </p>
                  <p className="font-mono text-sm font-semibold uppercase">{profile?.staffId}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" /> Email Address
                  </p>
                  <p className="text-sm font-medium">{profile?.email}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" /> Primary Subject
                  </p>
                  <p className="text-sm font-medium">{profile?.subject || "Not assigned"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" /> Role
                  </p>
                  <p className="text-sm font-medium">{profile?.role}</p>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <p className="text-sm font-medium mb-3 text-muted-foreground">Assigned Classes</p>
                <div className="flex flex-wrap gap-2">
                  {profile?.assignedClasses ? (
                    profile.assignedClasses.split(",").map((c: string) => (
                      <span key={c} className="inline-flex items-center px-3 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium border border-border">
                        {c.trim()}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No classes assigned.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle>School Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {profile?.logoUrl ? (
                  <img src={profile.logoUrl} alt="Logo" className="h-12 w-12 rounded-lg object-contain bg-muted/20 p-1" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{profile?.schoolName}</h3>
                  <p className="text-xs text-muted-foreground font-mono mt-1">Code: {profile?.schoolCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
