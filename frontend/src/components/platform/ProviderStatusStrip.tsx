import { Badge } from "@/components/ui/badge";
import type { ProviderStatus } from "@/db/api";

type ProviderStatusStripProps = {
  statuses: ProviderStatus[];
};

export function ProviderStatusStrip({ statuses }: ProviderStatusStripProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {statuses.map((status) => (
        <Badge
          key={`${status.provider}-${status.item_count}`}
          variant="outline"
          className={status.success ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"}
        >
          {status.provider} • {status.success ? `${status.item_count} items` : "degraded"}
        </Badge>
      ))}
    </div>
  );
}
