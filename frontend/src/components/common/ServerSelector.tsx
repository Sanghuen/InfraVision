import { Server } from "lucide-react";
import type { ServerSummary } from "../../types/server";

interface ServerSelectorProps {
  servers: ServerSummary[];
  selectedAgentId: string;
  onChange: (agentId: string) => void;
  disabled?: boolean;
  label?: string;
}

export function ServerSelector({
  servers,
  selectedAgentId,
  onChange,
  disabled = false,
  label = "Select server",
}: ServerSelectorProps) {
  return (
    <label className="flex min-w-[220px] items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5">
      <Server className="h-4 w-4 shrink-0 text-slate-500" />
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={selectedAgentId}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled || servers.length === 0}
        className="w-full min-w-0 bg-transparent text-sm text-slate-200 outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {servers.length === 0 ? (
          <option value="">No servers available</option>
        ) : (
          servers.map((server) => (
            <option key={server.agentId} value={server.agentId}>
              {server.name} · {server.hostname}
            </option>
          ))
        )}
      </select>
    </label>
  );
}
