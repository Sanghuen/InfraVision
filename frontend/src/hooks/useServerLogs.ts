import { useCallback, useEffect, useState } from "react";
import { getServerLogs } from "../lib/api";
import type { ServerLogsResponse } from "../lib/api";

const EMPTY_RESPONSE: ServerLogsResponse = {
  items: [],
  total: 0,
  stats: { total: 0, information: 0, warning: 0, errors: 0 },
  channels: [],
};

export function useServerLogs(
  agentId: string,
  filters: {
    search: string;
    level: string;
    channel: string;
    from: string;
    to: string;
    skip: number;
  },
) {
  const [response, setResponse] = useState<ServerLogsResponse>(EMPTY_RESPONSE);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const requestKey = [
    agentId,
    filters.search,
    filters.level,
    filters.channel,
    filters.from,
    filters.to,
    filters.skip,
  ].join("|");

  useEffect(() => {
    if (!agentId) return;

    let active = true;
    const timeout = window.setTimeout(() => {
      setError(null);
      getServerLogs(agentId, {
        search: filters.search,
        level: filters.level === "all" ? undefined : filters.level,
        channel: filters.channel === "all" ? undefined : filters.channel,
        from: filters.from,
        to: filters.to,
        skip: filters.skip,
        limit: 100,
      })
        .then((data) => {
          if (!active) return;
          setResponse(data);
          setLoadedKey(requestKey);
        })
        .catch((err: unknown) => {
          if (!active) return;
          setResponse(EMPTY_RESPONSE);
          setError(err instanceof Error ? err.message : "Unable to load logs.");
          setLoadedKey(requestKey);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [
    agentId,
    filters.search,
    filters.level,
    filters.channel,
    filters.from,
    filters.to,
    filters.skip,
    requestKey,
    refreshVersion,
  ]);

  const refresh = useCallback(() => {
    setLoadedKey("");
    setRefreshVersion((version) => version + 1);
  }, []);

  const isCurrentRequestLoaded = loadedKey === requestKey;

  return {
    logs: isCurrentRequestLoaded ? response.items : [],
    total: isCurrentRequestLoaded ? response.total : 0,
    stats: isCurrentRequestLoaded ? response.stats : EMPTY_RESPONSE.stats,
    channels: isCurrentRequestLoaded ? response.channels : [],
    loading: Boolean(agentId) && !isCurrentRequestLoaded,
    error: isCurrentRequestLoaded ? error : null,
    refresh,
  };
}
