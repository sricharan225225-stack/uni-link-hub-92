import { createFileRoute } from "@tanstack/react-router";
import { Percent } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/page-header";
import { CardSkeletonList, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAttendance } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/attendance")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Attendance — AU Hub" },
      { name: "description", content: "Your subject-wise attendance record as updated by the college." },
      { property: "og:title", content: "Attendance — AU Hub" },
      { property: "og:description", content: "Your subject-wise attendance record as updated by the college." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const { data, isLoading, error } = useAttendance();
  const rows = (data ?? []) as Array<Record<string, any>>;

  const totals = useMemo(() => {
    const present = rows.reduce((s, r) => s + (r.present ?? 0), 0);
    const total = rows.reduce((s, r) => s + (r.total ?? 0), 0);
    return { present, total, pct: total ? Math.round((present / total) * 100) : 0 };
  }, [rows]);

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Attendance is maintained by the college and updated only by authorised staff."
      />

      {isLoading ? (
        <CardSkeletonList />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Percent}
          title="No attendance records yet"
          description="Your attendance will appear here once the college updates it."
        />
      ) : (
        <div className="space-y-6">
          <div className="hero-panel fade-up rounded-2xl p-6">
            <p className="text-sm opacity-90">Overall attendance</p>
            <p className="mt-1 text-4xl font-semibold">{totals.pct}%</p>
            <p className="mt-1 text-sm opacity-90">
              {totals.present} of {totals.total} classes attended
            </p>
            <Progress value={totals.pct} className="mt-4 h-2 bg-white/20" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {rows.map((r) => {
              const pct = r.total ? Math.round((r.present / r.total) * 100) : 0;
              const absent = (r.total ?? 0) - (r.present ?? 0);
              return (
                <article key={r.id} className="surface fade-up p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{r.subject}</h3>
                    <Badge
                      variant={pct >= 75 ? "secondary" : "destructive"}
                      className="rounded-full"
                    >
                      {pct}%
                    </Badge>
                  </div>
                  <Progress value={pct} className="mt-3 h-2" />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Present {r.present} · Absent {absent} · Total {r.total} · Semester {r.semester}
                  </p>
                </article>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Shortfall below 75% may affect exam eligibility. Contact your department office for
            corrections.
          </p>
        </div>
      )}
    </div>
  );
}
