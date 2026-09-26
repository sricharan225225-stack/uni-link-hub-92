import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, Download, FileText, Sparkles } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { openMaterialFile } from "@/components/upload-material";
import { useMaterials, type Material } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/materials")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Study Materials — AU Hub" },
      { name: "description", content: "Notes, slides and documents organised by department, year, semester and subject." },
      { property: "og:title", content: "Study Materials — AU Hub" },
      { property: "og:description", content: "Notes, slides and documents organised by department, year, semester and subject." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MaterialsPage,
});

function MaterialCard({ m }: { m: Material }) {
  return (
    <article className="surface fade-up flex flex-col p-5">
      <div className="flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-secondary-foreground">
          <FileText className="h-4 w-4" />
        </span>
        <Badge variant="secondary" className="rounded-full uppercase">
          {m.file_type}
        </Badge>
        <span className="ml-auto text-xs text-muted-foreground">{m.downloads} downloads</span>
      </div>
      <h3 className="mt-3 text-base font-semibold">{m.title}</h3>
      <p className="text-sm text-muted-foreground">{m.subject}</p>
      {m.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{m.description}</p>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">
        {m.department} · Year {m.year} · Semester {m.semester} ·{" "}
        {new Date(m.created_at).toLocaleDateString()}
      </p>
      <div className="mt-4">
        {m.file_path ? (
          <Button size="sm" className="rounded-xl" onClick={() => openMaterialFile(m.file_path!)}>
            <Download className="mr-2 h-4 w-4" />
            View / Download
          </Button>
        ) : m.url ? (
          <Button asChild size="sm" className="rounded-xl">
            <a href={m.url} target="_blank" rel="noreferrer">
              <Download className="mr-2 h-4 w-4" />
              View / Download
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="rounded-xl" disabled>
            No file linked
          </Button>
        )}
      </div>
    </article>
  );
}

function MaterialsPage() {
  const { data, isLoading, error } = useMaterials();
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("all");
  const [year, setYear] = useState("all");
  const [sem, setSem] = useState("all");
  const [tab, setTab] = useState("all");

  const all = data ?? [];
  const depts = useMemo(() => Array.from(new Set(all.map((m) => m.department))).sort(), [all]);

  const filtered = useMemo(() => {
    const list = all.filter((m) => {
      const matchQ =
        !q.trim() || `${m.title} ${m.subject} ${m.description ?? ""}`.toLowerCase().includes(q.toLowerCase());
      return (
        matchQ &&
        (dept === "all" || m.department === dept) &&
        (year === "all" || String(m.year) === year) &&
        (sem === "all" || String(m.semester) === sem)
      );
    });
    if (tab === "recent")
      return [...list].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    if (tab === "popular") return [...list].sort((a, b) => b.downloads - a.downloads);
    return list;
  }, [all, q, dept, year, sem, tab]);

  const grouped = useMemo(() => {
    const map = new Map<string, Material[]>();
    filtered.forEach((m) => {
      const key = `${m.department} · Year ${m.year} · Semester ${m.semester} · ${m.subject}`;
      map.set(key, [...(map.get(key) ?? []), m]);
    });
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div>
      <PageHeader
        title="Study Materials"
        description="A growing library of notes, slides and documents organised by department, year, semester and subject."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search materials…"
          className="h-11 rounded-xl lg:col-span-2"
          aria-label="Search materials"
        />
        <Select value={dept} onValueChange={setDept}>
          <SelectTrigger className="h-11 rounded-xl" aria-label="Department">
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
        <div className="grid grid-cols-2 gap-3">
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="h-11 rounded-xl" aria-label="Year">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {[1, 2, 3, 4].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  Year {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sem} onValueChange={setSem}>
            <SelectTrigger className="h-11 rounded-xl" aria-label="Semester">
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
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-6">
        <TabsList className="rounded-xl">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="recent">Recent uploads</TabsTrigger>
          <TabsTrigger value="popular">Most downloaded</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <CardSkeletonList count={6} className="sm:grid-cols-2" />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No materials available"
          description="Nothing matches these filters yet. Try widening your search."
        />
      ) : tab === "all" ? (
        <div className="space-y-8">
          {grouped.map(([group, list]) => (
            <section key={group}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                {group}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((m) => (
                  <MaterialCard key={m.id} m={m} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <MaterialCard key={m.id} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}
