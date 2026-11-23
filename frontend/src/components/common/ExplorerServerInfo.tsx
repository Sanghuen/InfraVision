import { Clock3, Server } from "lucide-react";
import type { ServerSummary } from "../../types/server";

export function ExplorerServerInfo({
  server,
  lastUpdated,
}: {
  server: ServerSummary | undefined;
  lastUpdated: string | null;
}) {
  if (!server) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-cyan-500/10 p-2">
          <Server className="h-4 w-4 text-cyan-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {server.name || server.agentId}
          </p>
          <p className="text-xs text-slate-500">Agent ID: {server.agentId}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock3 className="h-3.5 w-3.5" />
        Last Updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "Never"}
      </div>
    </div>
  );
}

export function ExplorerLastUpdated({
  value,
}: {
  value: string | null;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500">
      <Clock3 className="h-4 w-4" />
      Last Updated: {value ? new Date(value).toLocaleString() : "Never"}
    </div>
  );
}
