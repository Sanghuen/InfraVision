import { useCallback, useEffect, useState } from "react";
import { getServerMetrics } from "../lib/api";
import type { MetricHistory } from "../lib/api";

export function useMetricsHistory(agentId: string) {
  const [history, setHistory] = useState<MetricHistory[]>([]);
  const [loadedForAgentId, setLoadedForAgentId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!agentId) {
      setHistory([]);
      setLoadedForAgentId("");
      return;
    }

    try {
      const data = await getServerMetrics(agentId, { limit: 500 });
      const sorted = [...data].sort(
        (a, b) =>
          new Date(a.collectedAt).getTime() -
          new Date(b.collectedAt).getTime(),
      );
      setHistory(sorted);
      setError(null);
    } catch (err) {
      setHistory([]);
      setError(err instanceof Error ? err.message : "Unable to load metric history.");
    } finally {
      setLoadedForAgentId(agentId);
    }
  }, [agentId]);

  useEffect(() => {
    if (!agentId) return;
    let active = true;

    getServerMetrics(agentId, { limit: 500 })
      .then((data) => {
        if (!active) return;
        const sorted = [...data].sort(
          (a, b) =>
            new Date(a.collectedAt).getTime() -
            new Date(b.collectedAt).getTime(),
        );
        setHistory(sorted);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setHistory([]);
        setError(err instanceof Error ? err.message : "Unable to load metric history.");
      })
      .finally(() => {
        if (active) setLoadedForAgentId(agentId);
      });

    return () => {
      active = false;
    };
  }, [agentId]);

  return {
    history: loadedForAgentId === agentId ? history : [],
    loading: Boolean(agentId) && loadedForAgentId !== agentId,
    error: loadedForAgentId === agentId ? error : null,
    refresh: loadHistory,
  };
}
