import { createFileRoute } from "@tanstack/react-router";
import { BellRing, ExternalLink, FileQuestion, GraduationCap, NotebookPen } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/page-header";
import { CardSkeletonList, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useExamResources, type ExamResource } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/exams")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Exam Preparation — AU Hub" },
      { name: "description", content: "Previous question papers, important questions, revision notes and model papers." },
      { property: "og:title", content: "Exam Preparation — AU Hub" },
      { property: "og:description", content: "Previous question papers, important questions, revision notes and model papers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ExamsPage,
});

function ResourceCard({ r }: { r: ExamResource }) {
  return (
    <article className="surface fade-up flex flex-col p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary" className="rounded-full">
          {r.subject}
        </Badge>
        {r.mark_type ? <Badge className="rounded-full">{r.mark_type}</Badge> : null}
        {r.unit ? (
          <Badge variant="outline" className="rounded-full">
            {r.unit}
          </Badge>
        ) : null}
      </div>
      <h3 className="mt-3 text-base font-semibold">{r.title}</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {r.department} · Year {r.year} · Semester {r.semester}
      </p>
      {r.body ? (
        <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">{r.body}</p>
      ) : null}
      {r.url ? (
        <Button asChild size="sm" variant="outline" className="mt-4 w-fit rounded-xl">
          <a href={r.url} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open resource
          </a>
        </Button>
      ) : null}
    </article>
  );
}

function ResourceGrid({ items, emptyLabel }: { items: ExamResource[]; emptyLabel: string }) {
  if (items.length === 0)
    return <EmptyState icon={FileQuestion} title={emptyLabel} description="Check back soon — new resources are added regularly." />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((r) => (
        <ResourceCard key={r.id} r={r} />
      ))}
    </div>
  );
}

function ExamsPage() {
  const { data, isLoading, error } = useExamResources();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [sem, setSem] = useState("all");

  const all = data ?? [];
  const depts = useMemo(() => Array.from(new Set(all.map((r) => r.department))).sort(), [all]);

  const filtered = useMemo(
    () =>
      all.filter((r) => {
        const matchQ =
          !q.trim() || `${r.title} ${r.subject} ${r.body ?? ""}`.toLowerCase().includes(q.toLowerCase());
        return (
          matchQ &&
          (dept === "all" || r.department === dept) &&
          (sem === "all" || String(r.semester) === sem)
        );
      }),
    [all, q, dept, sem],
  );

  const by = (t: string) => filtered.filter((r) => r.resource_type === t);
  const important = by("important_questions");
  const markGroups = ["2 Mark", "5 Mark", "10 Mark"].map((m) => ({
    mark: m,
    items: important.filter((r) => (r.mark_type ?? "").toLowerCase().startsWith(m.split(" ")[0])),
  }));
  const units = Array.from(new Set(important.map((r) => r.unit).filter(Boolean))) as string[];

  return (
    <div>
      <PageHeader
        title="Exam Preparation Hub"
        description="Everything you need to revise smart — previous papers, important questions, revision notes and model papers."
      />

      <div className="hero-panel fade-up mb-6 flex flex-col gap-2 rounded-2xl p-6">
        <span className="flex items-center gap-2 text-sm font-medium opacity-90">
          <GraduationCap className="h-4 w-4" /> Exam ready
        </span>
        <h2 className="text-xl font-semibold sm:text-2xl">Study smarter, not longer.</h2>
        <p className="max-w-xl text-sm opacity-90">
          Browse curated question banks by subject, mark weightage and unit — all sourced from
          previous university exams.
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search papers, questions, notes…"
          className="h-11 rounded-xl"
          aria-label="Search exam resources"
        />
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="h-11 rounded-xl sm:w-44" aria-label="Department">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All departments</SelectItem>
            {depts.map((d) => (
              <SelectItem key={d} value={d}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sem} onValueChange={setSem}>
          <SelectTrigger className="h-11 rounded-xl sm:w-40" aria-label="Semester">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All semesters</SelectItem>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <SelectItem key={s} value={String(s)}>
                Sem {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CardSkeletonList count={6} className="sm:grid-cols-2" />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : (
        <Tabs defaultValue="papers">
          <TabsList className="mb-6 flex w-full flex-wrap justify-start rounded-xl">
            <TabsTrigger value="papers">Question papers</TabsTrigger>
            <TabsTrigger value="important">Important questions</TabsTrigger>
            <TabsTrigger value="revision">Revision</TabsTrigger>
            <TabsTrigger value="model">Model papers</TabsTrigger>
            <TabsTrigger value="updates">Updates</TabsTrigger>
          </TabsList>

          <TabsContent value="papers">
            <ResourceGrid items={by("question_paper")} emptyLabel="No question papers yet" />
          </TabsContent>

          <TabsContent value="important">
            {important.length === 0 ? (
              <EmptyState icon={FileQuestion} title="No important questions yet" />
            ) : (
              <div className="space-y-6">
                {markGroups
                  .filter((g) => g.items.length > 0)
                  .map((g) => (
                    <section key={g.mark}>
                      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">
                        {g.mark} questions
                      </h2>
                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {g.items.map((r) => (
                          <ResourceCard key={r.id} r={r} />
                        ))}
                      </div>
                    </section>
                  ))}
                {units.length > 0 ? (
                  <section>
                    <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Unit-wise</h2>
                    <Accordion type="single" collapsible className="surface px-4">
                      {units.map((u) => (
                        <AccordionItem key={u} value={u}>
                          <AccordionTrigger className="text-sm font-medium">{u}</AccordionTrigger>
                          <AccordionContent>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                              {important
                                .filter((r) => r.unit === u)
                                .map((r) => (
                                  <li key={r.id}>
                                    <span className="font-medium text-foreground">{r.title}</span>
                                    {r.body ? ` — ${r.body}` : ""}
                                  </li>
                                ))}
                            </ul>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </section>
                ) : null}
              </div>
            )}
          </TabsContent>

          <TabsContent value="revision">
            <ResourceGrid items={by("revision")} emptyLabel="No revision notes yet" />
          </TabsContent>

          <TabsContent value="model">
            <ResourceGrid items={by("model_paper")} emptyLabel="No model papers yet" />
          </TabsContent>

          <TabsContent value="updates">
            {filtered.length === 0 ? (
              <EmptyState icon={BellRing} title="No exam updates yet" />
            ) : (
              <ol className="space-y-4">
                {[...filtered]
                  .sort(
                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
                  )
                  .slice(0, 12)
                  .map((r) => (
                    <li key={r.id} className="surface fade-up flex items-start gap-3 p-4">
                      <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                        <NotebookPen className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.subject} · {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  ))}
              </ol>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
