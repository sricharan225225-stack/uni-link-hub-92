import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { CardSkeletonList, EmptyState, ErrorState } from "@/components/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/notifications")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notifications — AU Hub" },
      { name: "description", content: "Announcements about notices, materials, results and exam updates." },
      { property: "og:title", content: "Notifications — AU Hub" },
      { property: "og:description", content: "Announcements about notices, materials, results and exam updates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const { data, isLoading, error } = useNotifications();
  const queryClient = useQueryClient();
  const items = data ?? [];
  const unread = items.filter((n) => !n.read);

  const markRead = useMutation({
    mutationFn: async (ids: string[]) => {
      if (!user || ids.length === 0) return;
      const { error: err } = await supabase
        .from("notification_reads")
        .insert(ids.map((id) => ({ notification_id: id, user_id: user.id })));
      if (err) throw err;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Everything new across notices, materials, exams and results."
        action={
          unread.length > 0 ? (
            <Button
              className="rounded-xl"
              onClick={() =>
                markRead.mutate(
                  unread.map((n) => n.id),
                  { onSuccess: () => toast.success("All notifications marked as read") },
                )
              }
              disabled={markRead.isPending}
            >
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <CardSkeletonList />
      ) : error ? (
        <ErrorState message={(error as Error).message} />
      ) : items.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications yet" description="You're all caught up." />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`surface fade-up flex items-start gap-3 p-5 ${
                n.read ? "opacity-70" : "border-l-4 border-l-primary"
              }`}
            >
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                <Bell className="h-4 w-4" />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold">{n.title}</h3>
                  <Badge variant="secondary" className="rounded-full">
                    {n.category}
                  </Badge>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                {!n.read ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 rounded-lg px-2"
                    onClick={() => markRead.mutate([n.id])}
                  >
                    Mark as read
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
