import { Terminal } from "lucide-react";
import type { ProcessInfo } from "../../../lib/api";

export function ProcessTableRow({ process }: { process: ProcessInfo }) {
  const isRunning = process.status?.toLowerCase() === "running";
  const cpu = Number(process.cpu_percent) || 0;
  const memory = Number(process.memory_mb) || 0;

  return (
    <tr className="transition-colors hover:bg-slate-800/40">
      <td className="whitespace-nowrap px-5 py-4 font-mono text-xs text-slate-500">
        {process.pid}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-slate-800 p-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="font-medium text-slate-200">
            {process.name || "Unknown"}
          </span>
        </div>
      </td>
      <td className="px-5 py-4 text-slate-400">{process.username || "System"}</td>
      <td className="px-5 py-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
            isRunning
              ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
              : "border border-slate-700 bg-slate-800 text-slate-400"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isRunning ? "bg-emerald-400" : "bg-slate-500"
            }`}
          />
          {process.status || "Unknown"}
        </span>
      </td>
      <td className="px-5 py-4 text-right">
        <div className="flex items-center justify-end gap-3">
          <span className="w-14 text-right tabular-nums text-slate-300">
            {cpu.toFixed(2)}%
          </span>
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400"
              style={{ width: `${Math.min(Math.max(cpu, 0), 100)}%` }}
            />
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-5 py-4 text-right tabular-nums text-slate-300">
        {memory.toFixed(2)} MB
      </td>
    </tr>
  );
}
