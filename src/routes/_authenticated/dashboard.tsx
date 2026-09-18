import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Megaphone,
  Percent,
  ArrowRight,
  Link2,
} from "lucide-react";

import { CardSkeletonList, EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useProfile } from "@/lib/auth";
import {
  useAttendance,
  useExamResources,
  useExamTimetable,
  useImportantLinks,
  useMaterials,
  useNotices,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — AU Hub" },
      { name: "description", content: "Your personal AU Hub dashboard: latest notices, upcoming exams, attendance and study materials." },
      { property: "og:title", content: "Dashboard — AU Hub" },
      { property: "og:description", content: "Latest notices, upcoming exams, attendance and study materials at a glance." },
    ],
  }),
  component: Dashboard,
});

const QUICK = [
  { to: "/notices", label: "Notices", icon: Megaphone },
  { to: "/materials", label: "Materials", icon: BookOpen },
  { to: "/exams", label: "Exams", icon: GraduationCap },
  { to: "/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/results", label: "Results", icon: ClipboardList },
  { to: "/attendance", label: "Attendance", icon: Percent },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { data: profile } = useProfile();
  const notices = useNotices();
  const materials = useMaterials();
  const exams = useExamTimetable();
  const attendance = useAttendance();
  const examPrep = useExamResources();
  const links = useImportantLinks();

  const latestNotice = notices.data?.[0];
  const upcoming = (exams.data ?? []).filter((e) => new Date(e.exam_date) >= new Date(new Date().toDateString()));
  const nextExam = upcoming[0];
  const totalPresent = (attendance.data ?? []).reduce((s, a) => s + a.present, 0);
  const totalClasses = (attendance.data ?? []).reduce((s, a) => s + a.total, 0);
  const attendancePct = totalClasses ? Math.round((totalPresent / totalClasses) * 100) : null;

  return (
    <div className="space-y-6">
      <div className="fade-up hero-panel rounded-3xl p-6 sm:p-8">
        <p className="text-sm opacity-80">{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {greeting()}, {profile?.full_name?.split(" ")[0] || "Student"} 👋
        </h1>
        <p className="mt-2 text-sm opacity-85">
          {profile?.department ? `${profile.department} · Year ${profile.year} · Semester ${profile.semester}` : "Complete your profile to personalise AU Hub."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {QUICK.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="surface flex flex-col items-center gap-2 p-4 transition-transform hover:-translate-y-0.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-secondary-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <span className="text-center text-xs font-semibold">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Latest notice</h2>
            <Link to="/notices" className="text-sm font-medium text-primary">
              View all
            </Link>
          </div>
          {notices.isLoading ? (
            <CardSkeletonList count={1} className="mt-4" />
          ) : latestNotice ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{latestNotice.category}</Badge>
                {latestNotice.important ? <Badge variant="destructive">Important</Badge> : null}
                <span className="text-xs text-muted-foreground">
                  {new Date(latestNotice.published_at).toLocaleDateString()}
                </span>
              </div>
              <h3 className="mt-2 font-semibold">{latestNotice.title}</h3>
              <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{latestNotice.description}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">No notices published yet.</p>
          )}
        </div>

        <div className="surface p-5">
          <h2 className="text-base font-semibold">Attendance</h2>
          {attendancePct === null ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No attendance records yet. Records are published by your department.
            </p>
          ) : (
            <div className="mt-4">
              <p className="font-display text-3xl font-semibold">{attendancePct}%</p>
              <Progress value={attendancePct} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                {totalPresent} of {totalClasses} classes attended
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Upcoming exam</h2>
          {nextExam ? (
            <div className="mt-3">
              <h3 className="font-semibold">{nextExam.subject}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {new Date(nextExam.exam_date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} · {nextExam.exam_time} · {nextExam.venue ?? "Venue TBA"}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No upcoming exams.</p>
          )}
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Exam preparation updates</h2>
            <Link to="/exams" className="text-sm font-medium text-primary">
              Open hub
            </Link>
          </div>
          <ul className="mt-3 space-y-2">
            {(examPrep.data ?? []).slice(0, 3).map((r) => (
              <li key={r.id} className="text-sm">
                <span className="font-medium">{r.title}</span>
                <span className="text-muted-foreground"> · {r.subject}</span>
              </li>
            ))}
            {!examPrep.isLoading && (examPrep.data ?? []).length === 0 ? (
              <li className="text-sm text-muted-foreground">No preparation updates yet.</li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent study materials</h2>
          <Link to="/materials" className="text-sm font-medium text-primary">
            Browse library
          </Link>
        </div>
        {materials.isLoading ? (
          <CardSkeletonList count={2} className="mt-4 sm:grid-cols-2" />
        ) : (materials.data ?? []).length === 0 ? (
          <EmptyState title="No materials available" description="New uploads will appear here." />
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(materials.data ?? []).slice(0, 4).map((m) => (
              <div key={m.id} className="rounded-xl border border-border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{m.subject}</p>
                <p className="mt-1 text-sm font-semibold">{m.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {m.file_type.toUpperCase()} · {new Date(m.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <h2 className="text-base font-semibold">Important dates</h2>
          <ol className="mt-4 space-y-4 border-l border-border pl-4">
            {upcoming.slice(0, 5).map((e) => (
              <li key={e.id} className="relative">
                <span className="absolute -left-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                <p className="text-sm font-semibold">{e.subject}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(e.exam_date).toLocaleDateString(undefined, { day: "numeric", month: "short" })} · {e.exam_time} · {e.exam_type}
                </p>
              </li>
            ))}
            {upcoming.length === 0 ? (
              <li className="text-sm text-muted-foreground">No upcoming exams scheduled.</li>
            ) : null}
          </ol>
        </div>

        <div className="surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Quick links</h2>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-3 space-y-2">
            {(links.data ?? []).slice(0, 5).map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary"
              >
                {l.title}
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
