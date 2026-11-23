import { RefreshCw } from "lucide-react";
import { ServerSelector } from "./ServerSelector";
import type { ServerSummary } from "../../types/server";

interface ExplorerControlsProps {
  servers: ServerSummary[];
  selectedAgentId: string;
  onServerChange: (agentId: string) => void;
  serversLoading: boolean;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  refreshLabel?: string;
  refreshingLabel?: string;
}

export function ExplorerControls({
  servers,
  selectedAgentId,
  onServerChange,
  serversLoading,
  loading,
  refreshing,
  onRefresh,
  refreshLabel = "Refresh",
  refreshingLabel = "Updating...",
}: ExplorerControlsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <ServerSelector
        servers={servers}
        selectedAgentId={selectedAgentId}
        onChange={onServerChange}
        disabled={serversLoading}
      />
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading || refreshing || !selectedAgentId}
        className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 transition hover:border-slate-700 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
        {refreshing ? refreshingLabel : refreshLabel}
      </button>
    </div>
  );
}
