import { createFileRoute } from "@tanstack/react-router";
import { LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useSignOut } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — AU Hub" },
      { name: "description", content: "Appearance, notification preferences, password and account settings." },
      { property: "og:title", content: "Settings — AU Hub" },
      { property: "og:description", content: "Appearance, notification preferences, password and account settings." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

const PREF_KEY = "au-hub-notification-prefs";
const PREFS = [
  { key: "notices", label: "New notices" },
  { key: "materials", label: "New study materials" },
  { key: "exams", label: "Exam updates and timetables" },
  { key: "results", label: "Results and attendance updates" },
] as const;

function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const signOut = useSignOut();

  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    notices: true,
    materials: true,
    exams: true,
    results: true,
  });
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(PREF_KEY);
    if (raw) {
      try {
        setPrefs((p) => ({ ...p, ...JSON.parse(raw) }));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const updatePref = (key: string, value: boolean) => {
    const nextPrefs = { ...prefs, [key]: value };
    setPrefs(nextPrefs);
    localStorage.setItem(PREF_KEY, JSON.stringify(nextPrefs));
    toast.success("Notification preferences saved");
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
      toast.error("New password must be at least 8 characters and include a letter and a number");
      return;
    }
    if (next !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      password: next,
      current_password: current,
    } as never);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setCurrent("");
    setNext("");
    setConfirm("");
    toast.success("Password updated");
  };

  return (
    <div>
      <PageHeader title="Settings" description="Appearance, notifications, account and privacy." />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface fade-up p-6">
          <h2 className="text-base font-semibold">Appearance</h2>
          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Dark mode</p>
              <p className="text-xs text-muted-foreground">Switch between light and dark themes.</p>
            </div>
            <Button variant="outline" className="rounded-xl" onClick={toggleTheme}>
              {theme === "dark" ? (
                <>
                  <Sun className="mr-2 h-4 w-4" /> Light
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </>
              )}
            </Button>
          </div>
        </section>

        <section className="surface fade-up p-6">
          <h2 className="text-base font-semibold">Notification preferences</h2>
          <ul className="mt-4 space-y-4">
            {PREFS.map((p) => (
              <li key={p.key} className="flex items-center justify-between gap-4">
                <Label htmlFor={p.key} className="text-sm font-normal">
                  {p.label}
                </Label>
                <Switch
                  id={p.key}
                  checked={!!prefs[p.key]}
                  onCheckedChange={(v) => updatePref(p.key, v)}
                />
              </li>
            ))}
          </ul>
        </section>

        <section className="surface fade-up p-6">
          <h2 className="text-base font-semibold">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {user?.email}</p>
          <form className="mt-4 space-y-4" onSubmit={changePassword}>
            <div>
              <Label htmlFor="current">Current password</Label>
              <Input
                id="current"
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="mt-1.5 h-11 rounded-xl"
                required
              />
            </div>
            <div>
              <Label htmlFor="next">New password</Label>
              <Input
                id="next"
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="mt-1.5 h-11 rounded-xl"
                required
              />
            </div>
            <div>
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1.5 h-11 rounded-xl"
                required
              />
            </div>
            <Button type="submit" className="h-11 rounded-xl" disabled={saving}>
              {saving ? "Updating…" : "Change password"}
            </Button>
          </form>
        </section>

        <section className="surface fade-up p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <ShieldCheck className="h-4 w-4" /> Privacy
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Your results, attendance and profile details are visible only to you and authorised
            college staff. Academic records can be edited only by the administration — students can
            view them but never change them.
          </p>
          <Button variant="destructive" className="mt-6 rounded-xl" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </section>
      </div>
    </div>
  );
}
