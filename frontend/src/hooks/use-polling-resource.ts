import { useEffect, useState } from "react";

type UsePollingResourceOptions<T> = {
  fetcher: () => Promise<T>;
  intervalMs?: number;
  enabled?: boolean;
  initialData?: T | null;
};

export function usePollingResource<T>({
  fetcher,
  intervalMs,
  enabled = true,
  initialData = null,
}: UsePollingResourceOptions<T>) {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let active = true;

    const run = async () => {
      try {
        const result = await fetcher();
        if (active) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Something went wrong.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    if (!intervalMs) {
      return () => {
        active = false;
      };
    }

    const timer = window.setInterval(run, intervalMs);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [enabled, fetcher, intervalMs]);

  return { data, loading, error, setData };
}
