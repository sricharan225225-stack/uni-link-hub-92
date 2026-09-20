import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Link2, Megaphone, Search as SearchIcon } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/page-header";
import { CardSkeletonList, EmptyState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { useExamResources, useImportantLinks, useMaterials, useNotices } from "@/lib/queries";

type SearchParams = { q?: string };

export const Route = createFileRoute("/_authenticated/search")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search.q === "string" ? search.q.slice(0, 120) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Search — AU Hub" },
      { name: "description", content: "Search notices, study materials, exam resources and links." },
      { property: "og:title", content: "Search — AU Hub" },
      { property: "og:description", content: "Search notices, study materials, exam resources and links." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q = "" } = Route.useSearch();
  const notices = useNotices();
  const materials = useMaterials();
  const exams = useExamResources();
  const links = useImportantLinks();

  const term = q.trim().toLowerCase();
  const loading = notices.isLoading || materials.isLoading || exams.isLoading || links.isLoading;

  const results = useMemo(() => {
    const has = (s: string) => s.toLowerCase().includes(term);
    return {
      notices: (notices.data ?? []).filter((n) => has(`${n.title} ${n.description} ${n.category}`)),
      materials: (materials.data ?? []).filter((m) =>
        has(`${m.title} ${m.subject} ${m.department} ${m.description ?? ""}`),
      ),
      exams: (exams.data ?? []).filter((r) =>
        has(`${r.title} ${r.subject} ${r.department} ${r.body ?? ""} ${r.mark_type ?? ""}`),
      ),
      links: ((links.data ?? []) as Array<Record<string, any>>).filter((l) =>
        has(`${l.title} ${l.description ?? ""} ${l.category}`),
      ),
    };
  }, [notices.data, materials.data, exams.data, links.data, term]);

  const total =
    results.notices.length + results.materials.length + results.exams.length + results.links.length;

  return (
    <div>
      <PageHeader
        title={term ? `Results for “${q}”` : "Search"}
        description="Across notices, study materials, exam resources and important links."
      />

      {!term ? (
        <EmptyState icon={SearchIcon} title="Start typing to search" description="Use the search bar at the top." />
      ) : loading ? (
        <CardSkeletonList />
      ) : total === 0 ? (
        <EmptyState icon={SearchIcon} title="No results found" description="Try a different keyword." />
      ) : (
        <div className="space-y-8">
          {results.notices.length > 0 ? (
            <Section icon={Megaphone} title="Notices" to="/notices">
              {results.notices.map((n) => (
                <Row key={n.id} title={n.title} sub={`${n.category} · ${new Date(n.published_at).toLocaleDateString()}`} />
              ))}
            </Section>
          ) : null}
          {results.materials.length > 0 ? (
            <Section icon={BookOpen} title="Study materials" to="/materials">
              {results.materials.map((m) => (
                <Row key={m.id} title={m.title} sub={`${m.subject} · ${m.department} · Sem ${m.semester}`} />
              ))}
            </Section>
          ) : null}
          {results.exams.length > 0 ? (
            <Section icon={GraduationCap} title="Exam preparation" to="/exams">
              {results.exams.map((r) => (
                <Row key={r.id} title={r.title} sub={`${r.subject} · ${r.resource_type.replace(/_/g, " ")}`} />
              ))}
            </Section>
          ) : null}
          {results.links.length > 0 ? (
            <Section icon={Link2} title="Important links" to="/links">
              {results.links.map((l) => (
                <Row key={l.id} title={l.title} sub={l.category} />
              ))}
            </Section>
          ) : null}
        </div>
      )}
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  to,
  children,
}: {
  icon: typeof Megaphone;
  title: string;
  to: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Icon className="h-4 w-4" />
          {title}
        </h2>
        <Link to={to} className="text-xs font-medium text-primary hover:underline">
          View all
        </Link>
      </div>
      <div className="surface divide-y divide-border">{children}</div>
    </section>
  );
}

function Row({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <p className="text-sm font-medium">{title}</p>
      <Badge variant="secondary" className="shrink-0 rounded-full text-[11px]">
        {sub}
      </Badge>
    </div>
  );
}
