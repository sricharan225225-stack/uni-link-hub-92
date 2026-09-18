import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWord = true,
  tone = "default",
}: {
  className?: string;
  showWord?: boolean;
  tone?: "default" | "invert";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold shadow-sm",
          tone === "invert"
            ? "bg-accent text-accent-foreground"
            : "bg-primary text-primary-foreground",
        )}
        aria-hidden
      >
        AU
      </span>
      {showWord ? (
        <span
          className={cn(
            "font-display text-lg font-semibold tracking-tight",
            tone === "invert" ? "text-primary-foreground" : "text-foreground",
          )}
        >
          AU Hub
        </span>
      ) : null}
    </span>
  );
}
