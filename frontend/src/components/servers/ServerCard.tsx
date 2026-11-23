import {
  Activity,
  Clock3,
  Container,
  Cpu,
  HardDrive,
  KeyRound,
  MemoryStick,
  Monitor,
  Server,
} from "lucide-react";
import type { ServerSummary } from "../../types/server";

function formatDate(date: string | null) {
  if (!date) return "No metrics received";
  const parsedDate = new Date(date);
  return Number.isNaN(parsedDate.getTime()) ? "Unknown" : parsedDate.toLocaleString();
}

function isServerOnline(status?: string | null) {
  return ["online", "connected"].includes((status || "").toLowerCase());
}

function ResourceBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  const safeValue = Number.isFinite(value) ? value : 0;
  const percentage = Math.min(100, Math.max(0, safeValue));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          {icon}
          <span>{label}</span>
        </div>
        <span className="font-semibold tabular-nums text-white">
          {safeValue.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status, online }: { status?: string | null; online: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
        online
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-slate-700 bg-slate-800 text-slate-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-emerald-400" : "bg-slate-500"}`} />
      {status || "Unknown"}
    </span>
  );
}

export function ServerCard({
  server,
  actionLoading,
  onRotateAgentKey,
}: {
  server: ServerSummary;
  actionLoading: boolean;
  onRotateAgentKey: (agentId: string) => void;
}) {
  const online = isServerOnline(server.status);

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="rounded-xl border border-cyan-500/10 bg-cyan-500/10 p-3">
            <Server className="h-6 w-6 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-white">
              {server.name || server.agentId}
            </h3>
            <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
              <Monitor className="h-3.5 w-3.5 shrink-0" />
              {server.hostname || "Unknown hostname"}
            </p>
          </div>
        </div>
        <StatusBadge status={server.status} online={online} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-md border border-slate-800 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-300">
          {server.platform || "Unknown OS"}
        </span>
        <span className="max-w-full truncate rounded-md border border-slate-800 bg-slate-800/70 px-3 py-1.5 text-xs text-slate-400">
          ID: {server.agentId}
        </span>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onRotateAgentKey(server.agentId)}
          disabled={actionLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-500/40 hover:bg-cyan-500/10 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <KeyRound className="h-3.5 w-3.5" />
          {actionLoading ? "Please wait..." : "Rotate Agent Key"}
        </button>
      </div>

      <div className="mt-6 space-y-5 border-t border-slate-800 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-300">Resource Usage</p>
          <Activity className="h-4 w-4 text-slate-500" />
        </div>
        <ResourceBar label="CPU Usage" value={server.cpu} icon={<Cpu className="h-4 w-4" />} />
        <ResourceBar label="Memory Usage" value={server.memory} icon={<MemoryStick className="h-4 w-4" />} />
        <ResourceBar label="Disk Usage" value={server.disk} icon={<HardDrive className="h-4 w-4" />} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-800 pt-5">
        <div className="flex items-center gap-3 rounded-lg bg-slate-800/40 p-3">
          <div className="rounded-lg bg-cyan-500/10 p-2">
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold tabular-nums text-white">
              {server.processCount ?? 0}
            </p>
            <p className="text-xs text-slate-500">Processes</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-slate-800/40 p-3">
          <div className="rounded-lg bg-cyan-500/10 p-2">
            <Container className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold tabular-nums text-white">
              {server.dockerContainerCount ?? 0}
            </p>
            <p className="text-xs text-slate-500">Containers</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Clock3 className="h-4 w-4" />
          <span>Last Updated</span>
        </div>
        <span className="text-right tabular-nums text-slate-400">
          {formatDate(server.collectedAt)}
        </span>
      </div>
    </div>
  );
}
