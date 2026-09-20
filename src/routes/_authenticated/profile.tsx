import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BookOpen, ClipboardList, Percent, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { CardSkeletonList } from "@/components/states";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "My Profile — AU Hub" },
      { name: "description", content: "Manage your student profile, department, year and semester." },
      { property: "og:title", content: "My Profile — AU Hub" },
      { property: "og:description", content: "Manage your student profile, department, year and semester." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Information Technology",
];

const SHORTCUTS = [
  { to: "/results", label: "My Results", icon: ClipboardList },
  { to: "/attendance", label: "My Attendance", icon: Percent },
  { to: "/materials", label: "My Materials", icon: BookOpen },
  { to: "/notifications", label: "Notifications", icon: Bell },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    full_name: "",
    student_id: "",
    department: "",
    year: "",
    semester: "",
    avatar_url: "",
  });

  useEffect(() => {
    if (profile)
      setForm({
        full_name: profile.full_name ?? "",
        student_id: profile.student_id ?? "",
        department: profile.department ?? "",
        year: profile.year ? String(profile.year) : "",
        semester: profile.semester ? String(profile.semester) : "",
        avatar_url: profile.avatar_url ?? "",
      });
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      if (!form.full_name.trim()) throw new Error("Full name is required");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name.trim().slice(0, 100),
          student_id: form.student_id.trim().slice(0, 50) || null,
          department: form.department || null,
          year: form.year ? Number(form.year) : null,
          semester: form.semester ? Number(form.semester) : null,
          avatar_url: form.avatar_url.trim().slice(0, 500) || null,
        })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <CardSkeletonList count={2} />;

  const initial = (form.full_name || "S").charAt(0).toUpperCase();

  return (
    <div>
      <PageHeader title="My Profile" description="Your student details and quick access to your records." />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="surface fade-up p-6">
          <div className="flex items-center gap-4">
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt=""
                className="h-16 w-16 rounded-2xl object-cover"
              />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-xl font-semibold text-secondary-foreground">
                {initial}
              </span>
            )}
            <div>
              <p className="text-lg font-semibold">{form.full_name || "Student"}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>
          </div>

          <form
            className="mt-6 grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
          >
            <div className="sm:col-span-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={form.full_name}
                maxLength={100}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1.5 h-11 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email ?? ""} readOnly className="mt-1.5 h-11 rounded-xl bg-muted" />
            </div>
            <div>
              <Label htmlFor="student_id">Student ID / Roll number</Label>
              <Input
                id="student_id"
                value={form.student_id}
                maxLength={50}
                onChange={(e) => setForm({ ...form, student_id: e.target.value })}
                className="mt-1.5 h-11 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Department</Label>
              <Select
                value={form.department}
                onValueChange={(v) => setForm({ ...form, department: v })}
              >
                <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Year</Label>
              <Select value={form.year} onValueChange={(v) => setForm({ ...form, year: v })}>
                <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      Year {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Select
                value={form.semester}
                onValueChange={(v) => setForm({ ...form, semester: v })}
              >
                <SelectTrigger className="mt-1.5 h-11 rounded-xl">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={String(s)}>
                      Semester {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="avatar_url">Profile picture URL</Label>
              <Input
                id="avatar_url"
                value={form.avatar_url}
                maxLength={500}
                placeholder="https://…"
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                className="mt-1.5 h-11 rounded-xl"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="h-11 rounded-xl" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </section>

        <aside className="space-y-3">
          {SHORTCUTS.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="surface fade-up flex items-center gap-3 p-4 transition-transform hover:-translate-y-0.5"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
