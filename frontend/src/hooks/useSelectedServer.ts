import { useMemo, useState } from "react";
import { getDefaultServer } from "./useServers";
import type { ServerSummary } from "../types/server";

export function useSelectedServer(servers: ServerSummary[]) {
  const [requestedAgentId, setRequestedAgentId] = useState("");

  const selectedServer = useMemo(
    () =>
      servers.find((server) => server.agentId === requestedAgentId) ??
      getDefaultServer(servers),
    [servers, requestedAgentId],
  );

  return {
    selectedServer,
    selectedAgentId: selectedServer?.agentId ?? "",
    setSelectedAgentId: setRequestedAgentId,
  };
}
