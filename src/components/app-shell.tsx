import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutGrid,
  Link2,
  LogOut,
  Megaphone,
  Moon,
  Percent,
  Search,
  Settings,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/components/theme-provider";
import { useAuth, useIsAdmin, useProfile, useSignOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/notices", label: "Notices", icon: Megaphone },
  { to: "/materials", label: "Study Materials", icon: BookOpen },
  { to: "/exams", label: "Exam Prep", icon: GraduationCap },
  { to: "/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/results", label: "Results", icon: ClipboardList },
  { to: "/attendance", label: "Attendance", icon: Percent },
  { to: "/links", label: "Important Links", icon: Link2 },
  { to: "/notifications", label: "Notifications", icon: Bell },
] as const;

const MOBILE_NAV = [
  { to: "/dashboard", label: "Home", icon: LayoutGrid },
  { to: "/materials", label: "Materials", icon: BookOpen },
  { to: "/exams", label: "Exams", icon: GraduationCap },
  { to: "/notices", label: "Notices", icon: Megaphone },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function useUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["unread-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [{ data: all }, { data: reads }] = await Promise.all([
        supabase.from("notifications").select("id"),
        supabase.from("notification_reads").select("notification_id").eq("user_id", user!.id),
      ]);
      const readIds = new Set((reads ?? []).map((r) => r.notification_id));
      return (all ?? []).filter((n) => !readIds.has(n.id)).length;
    },
  });
}

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { data: profile } = useProfile();
  const { data: isAdmin } = useIsAdmin();
  const signOut = useSignOut();
  const navigate = useNavigate();
  const { data: unread = 0 } = useUnreadCount();
  const [query, setQuery] = useState("");
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate({ to: "/search", search: { q: query.trim() } });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-sidebar px-4 py-6 text-sidebar-foreground lg:flex">
        <Link to="/dashboard" className="px-2">
          <Logo tone="invert" />
        </Link>
        <nav className="mt-8 flex-1 space-y-1 overflow-y-auto">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                pathname === to && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
              {to === "/notifications" && unread > 0 ? (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-sidebar-primary px-1.5 text-xs font-semibold text-sidebar-primary-foreground">
                  {unread}
                </span>
              ) : null}
            </Link>
          ))}
          {isAdmin ? (
            <Link
              to="/admin"
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent",
                pathname.startsWith("/admin") && "bg-sidebar-accent text-sidebar-accent-foreground",
              )}
            >
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          ) : null}
        </nav>
        <div className="space-y-1 border-t border-sidebar-border pt-3">
          <Link
            to="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <Link to="/dashboard" className="lg:hidden">
              <Logo showWord={false} />
            </Link>
            <form onSubmit={submitSearch} className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notices, materials, exam prep…"
                className="h-10 rounded-xl pl-9"
                aria-label="Global search"
              />
            </form>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Link to="/notifications" className="relative hidden sm:block">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="h-5 w-5" />
              </Button>
              {unread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unread}
                </span>
              ) : null}
            </Link>
            <Link to="/profile" className="hidden lg:block">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {(profile?.full_name || "S").charAt(0).toUpperCase()}
              </span>
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-14">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-stretch justify-between px-2">
          {MOBILE_NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium text-muted-foreground transition-colors",
                pathname === to && "text-primary",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
