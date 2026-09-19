import { createFileRoute } from "@tanstack/react-router";
import { Award, ClipboardList } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/page-header";
import { CardSkeletonList, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useResults } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/results")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Results — AU Hub" },
      { name: "description", content: "Your semester-wise marks, grades, GPA and CGPA." },
      { property: "og:title", content: "Results — AU Hub" },
      { property: "og:description", content: "Your semester-wise marks, grades, GPA and CGPA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResultsPage,
});

function ResultsPage() {
  const { data, isLoading, error } = useResults();
  const rows = (data ?? []) as Array<Record<string, any>>;

  const semesters = useMemo(() => {
    const map = new Map<number, Array<Record<string, any>>>();
    rows.forEach((r) => map.set(r.semester, [...(map.get(r.semester) ?? []), r]));
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [rows]);

  const latestCgpa = rows.find((r) => r.cgpa != null)?.cgpa ?? null;

  return (
    <div>
      <PageHeader
        title="Results"
        description="Your official semester results, published by the examination cell."
      />

      {isLoading ? (
        <CardSkeletonList />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No results published yet"
          description="Your results will appear here once the examination cell publishes them."
        />
      ) : (
        <div className="space-y-6">
          {latestCgpa != null ? (
            <div className="hero-panel fade-up flex items-center gap-4 rounded-2xl p-6">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
                <Award className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm opacity-90">Cumulative CGPA</p>
                <p className="text-3xl font-semibold">{Number(latestCgpa).toFixed(2)}</p>
              </div>
            </div>
          ) : null}

          {semesters.map(([sem, list]) => {
            const gpa = list.find((r) => r.gpa != null)?.gpa;
            return (
              <section key={sem} className="surface fade-up overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-4">
                  <h2 className="text-base font-semibold">Semester {sem}</h2>
                  {gpa != null ? (
                    <Badge variant="secondary" className="rounded-full">
                      GPA {Number(gpa).toFixed(2)}
                    </Badge>
                  ) : null}
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead className="text-right">Marks</TableHead>
                        <TableHead className="text-right">Grade</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {list.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium">{r.subject}</TableCell>
                          <TableCell className="text-muted-foreground">{r.subject_code}</TableCell>
                          <TableCell className="text-right">{r.marks}</TableCell>
                          <TableCell className="text-right font-semibold">{r.grade}</TableCell>
                          <TableCell className="text-right">
                            <Badge
                              variant={r.status === "Pass" ? "secondary" : "destructive"}
                              className="rounded-full"
                            >
                              {r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
