import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, Megaphone, Paperclip } from "lucide-react";
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
import { useNotices } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/notices")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notices — AU Hub" },
      { name: "description", content: "All college notices, circulars and announcements in one place." },
      { property: "og:title", content: "Notices — AU Hub" },
      { property: "og:description", content: "All college notices, circulars and announcements in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NoticesPage,
});

function NoticesPage() {
  const { data, isLoading, error } = useNotices();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("latest");

  const categories = useMemo(
    () => Array.from(new Set((data ?? []).map((n) => n.category))).sort(),
    [data],
  );

  const items = useMemo(() => {
    let list = (data ?? []).filter((n) => {
      const matchQ =
        !q.trim() ||
        `${n.title} ${n.description} ${n.category}`.toLowerCase().includes(q.toLowerCase());
      const matchC = category === "all" || n.category === category;
      return matchQ && matchC;
    });
    list = [...list].sort((a, b) => {
      if (sort === "important") return Number(b.important) - Number(a.important);
      const d = new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      return sort === "oldest" ? -d : d;
    });
    return list;
  }, [data, q, category, sort]);

  return (
    <div>
      <PageHeader title="Notices" description="Official announcements, circulars and updates from the college." />

      <div className="mb-6 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search notices…"
          className="h-11 rounded-xl"
          aria-label="Search notices"
        />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="h-11 rounded-xl sm:w-44" aria-label="Filter by category">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="h-11 rounded-xl sm:w-40" aria-label="Sort notices">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Latest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="important">Important first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <CardSkeletonList />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices found" description="Try a different search or category." />
      ) : (
        <div className="grid gap-4">
          {items.map((n) => (
            <article
              key={n.id}
              className={`surface fade-up p-5 ${n.important ? "border-l-4 border-l-primary" : ""}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  {n.category}
                </Badge>
                {n.important ? <Badge className="rounded-full">Important</Badge> : null}
                <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {new Date(n.published_at).toLocaleDateString(undefined, {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold sm:text-lg">{n.title}</h2>
              <p className="mt-1.5 whitespace-pre-line text-sm text-muted-foreground">{n.description}</p>
              {n.attachment_url ? (
                <Button asChild variant="outline" size="sm" className="mt-4 rounded-xl">
                  <a href={n.attachment_url} target="_blank" rel="noreferrer">
                    <Paperclip className="mr-2 h-4 w-4" />
                    View attachment
                  </a>
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
