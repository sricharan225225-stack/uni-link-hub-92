import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Link2 } from "lucide-react";
import { useMemo } from "react";

import { PageHeader } from "@/components/page-header";
import { CardSkeletonList, EmptyState, ErrorState } from "@/components/states";
import { useImportantLinks } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/links")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Important Links — AU Hub" },
      { name: "description", content: "Quick access to university portals, exam results and student services." },
      { property: "og:title", content: "Important Links — AU Hub" },
      { property: "og:description", content: "Quick access to university portals, exam results and student services." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LinksPage,
});

function LinksPage() {
  const { data, isLoading, error } = useImportantLinks();
  const rows = (data ?? []) as Array<Record<string, any>>;

  const groups = useMemo(() => {
    const map = new Map<string, Array<Record<string, any>>>();
    rows.forEach((r) => map.set(r.category, [...(map.get(r.category) ?? []), r]));
    return Array.from(map.entries());
  }, [rows]);

  return (
    <div>
      <PageHeader title="Important Links" description="Official university portals and student services." />

      {isLoading ? (
        <CardSkeletonList count={6} className="sm:grid-cols-2" />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Link2} title="No links added yet" />
      ) : (
        <div className="space-y-8">
          {groups.map(([category, list]) => (
            <section key={category}>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{category}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {list.map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="surface fade-up group flex items-start gap-3 p-5 transition-transform hover:-translate-y-0.5"
                  >
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                      <ExternalLink className="h-4 w-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold group-hover:text-primary">
                        {l.title}
                      </span>
                      {l.description ? (
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {l.description}
                        </span>
                      ) : null}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
