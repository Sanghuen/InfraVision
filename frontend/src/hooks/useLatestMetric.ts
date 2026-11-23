import { useCallback, useEffect, useState } from "react";
import { getLatestMetric } from "../lib/api";
import type { LatestMetric } from "../lib/api";

export function useLatestMetric(agentId: string) {
  const [metric, setMetric] = useState<LatestMetric | null>(null);
  const [loadedForAgentId, setLoadedForAgentId] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetric = useCallback(async () => {
    if (!agentId) {
      setMetric(null);
      setLoadedForAgentId("");
      return;
    }

    try {
      const data = await getLatestMetric(agentId);
      setMetric(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load metrics.");
      setMetric(null);
    } finally {
      setLoadedForAgentId(agentId);
      setRefreshing(false);
    }
  }, [agentId]);

  useEffect(() => {
    if (!agentId) return;
    let active = true;

    getLatestMetric(agentId)
      .then((data) => {
        if (!active) return;
        setMetric(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Unable to load metrics.");
        setMetric(null);
      })
      .finally(() => {
        if (active) setLoadedForAgentId(agentId);
      });

    return () => {
      active = false;
    };
  }, [agentId]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    return loadMetric();
  }, [loadMetric]);

  return {
    metric: loadedForAgentId === agentId ? metric : null,
    loading: Boolean(agentId) && loadedForAgentId !== agentId,
    refreshing,
    error: loadedForAgentId === agentId ? error : null,
    refresh,
    loadMetric,
  };
}
