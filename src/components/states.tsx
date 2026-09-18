import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="surface flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-secondary-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-base font-semibold">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="surface px-6 py-10 text-center">
      <h3 className="text-base font-semibold text-destructive">Something went wrong</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {message ?? "We couldn't load this content. Please try again."}
      </p>
    </div>
  );
}

export function CardSkeletonList({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="surface space-y-3 p-5">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}
