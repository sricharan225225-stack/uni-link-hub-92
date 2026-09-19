import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Clock, MapPin, User } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/page-header";
import { CardSkeletonList, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClassTimetable, useExamTimetable } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/timetable")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Timetable — AU Hub" },
      { name: "description", content: "Your weekly class schedule and upcoming examination timetable." },
      { property: "og:title", content: "Timetable — AU Hub" },
      { property: "og:description", content: "Your weekly class schedule and upcoming examination timetable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TimetablePage,
});

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function TimetablePage() {
  const classes = useClassTimetable();
  const exams = useExamTimetable();

  const byDay = useMemo(() => {
    const rows = (classes.data ?? []) as Array<Record<string, any>>;
    return DAYS.map((d) => ({
      day: d,
      items: rows
        .filter((r) => String(r.day_of_week).toLowerCase() === d.toLowerCase())
        .sort((a, b) => String(a.start_time).localeCompare(String(b.start_time))),
    })).filter((g) => g.items.length > 0);
  }, [classes.data]);

  const examRows = useMemo(() => {
    const rows = (exams.data ?? []) as Array<Record<string, any>>;
    return [...rows].sort((a, b) => String(a.exam_date).localeCompare(String(b.exam_date)));
  }, [exams.data]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <PageHeader title="Timetable" description="Your weekly classes and the examination schedule." />

      <Tabs defaultValue="classes">
        <TabsList className="mb-6 rounded-xl">
          <TabsTrigger value="classes">Class timetable</TabsTrigger>
          <TabsTrigger value="exams">Exam timetable</TabsTrigger>
        </TabsList>

        <TabsContent value="classes">
          {classes.isLoading ? (
            <CardSkeletonList />
          ) : classes.error ? (
            <ErrorState message={(classes.error as Error).message} />
          ) : byDay.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No classes scheduled" description="Your class timetable has not been published yet." />
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {byDay.map(({ day, items }) => (
                <section key={day} className="surface fade-up p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {day}
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {items.map((c) => (
                      <li key={c.id} className="rounded-xl bg-secondary/50 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold">{c.subject}</p>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {c.start_time} – {c.end_time}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          {c.faculty ? (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {c.faculty}
                            </span>
                          ) : null}
                          {c.room ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {c.room}
                            </span>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="exams">
          {exams.isLoading ? (
            <CardSkeletonList />
          ) : exams.error ? (
            <ErrorState message={(exams.error as Error).message} />
          ) : examRows.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No upcoming exams" description="The exam timetable has not been published yet." />
          ) : (
            <ol className="space-y-4">
              {examRows.map((e) => {
                const upcoming = String(e.exam_date) >= today;
                return (
                  <li
                    key={e.id}
                    className={`surface fade-up flex flex-col gap-3 p-5 sm:flex-row sm:items-center ${
                      upcoming ? "border-l-4 border-l-primary" : "opacity-70"
                    }`}
                  >
                    <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
                      <span className="text-lg font-bold leading-none">
                        {new Date(e.exam_date).getDate()}
                      </span>
                      <span className="text-[11px] uppercase">
                        {new Date(e.exam_date).toLocaleDateString(undefined, { month: "short" })}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold">{e.subject}</h3>
                        <Badge variant="secondary" className="rounded-full">
                          {e.exam_type}
                        </Badge>
                        {upcoming ? <Badge className="rounded-full">Upcoming</Badge> : null}
                      </div>
                      <p className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {e.exam_time}
                        </span>
                        {e.venue ? (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {e.venue}
                          </span>
                        ) : null}
                        <span>
                          {e.department} · Year {e.year} · Sem {e.semester}
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
