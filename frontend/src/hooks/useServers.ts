import { useCallback, useEffect, useState } from "react";
import { getServerSummary } from "../lib/api";
import type { ServerSummary } from "../types/server";

export function getDefaultServer(servers: ServerSummary[]): ServerSummary | undefined {
  return (
    servers.find((server) =>
      (server.platform ?? "").toLowerCase().includes("windows"),
    ) ?? servers[0]
  );
}

export function useServers() {
  const [servers, setServers] = useState<ServerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadServers = useCallback(async () => {
    try {
      const data = await getServerSummary();
      setServers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      // Preserve the last successful server list when a refresh request fails.
      setError(err instanceof Error ? err.message : "Unable to load servers.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- starts an asynchronous request.
    void loadServers();
  }, [loadServers]);

  return { servers, loading, error, refreshServers: loadServers };
}
