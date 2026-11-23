import { HardDrive } from "lucide-react";
import type { StoragePartition } from "../../../types/storage";
import { formatBytes } from "../../../lib/format";

export function StoragePartitionCard({ partition }: { partition: StoragePartition }) {
  const usage = Math.min(Math.max(Number(partition.usage) || 0, 0), 100);

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-cyan-500/10 p-3">
            <HardDrive className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">
              {partition.device || "Unknown Drive"}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {partition.filesystem || "Unknown filesystem"}
            </p>
          </div>
        </div>
        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-400">
          {partition.mountpoint || "N/A"}
        </span>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Storage Usage</span>
          <span className="text-lg font-bold tabular-nums text-white">
            {usage.toFixed(1)}%
          </span>
        </div>
        <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all ${
              usage >= 90
                ? "bg-red-400"
                : usage >= 75
                  ? "bg-amber-400"
                  : "bg-cyan-400"
            }`}
            style={{ width: `${usage}%` }}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4">
        <div>
          <p className="text-xs text-slate-500">Used</p>
          <p className="mt-1 text-sm font-medium text-white">
            {formatBytes(partition.used)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Free</p>
          <p className="mt-1 text-sm font-medium text-emerald-400">
            {formatBytes(partition.free)}
          </p>
        </div>
        <div className="col-span-2">
          <p className="text-xs text-slate-500">Total Capacity</p>
          <p className="mt-1 text-sm font-medium text-slate-300">
            {formatBytes(partition.total)}
          </p>
        </div>
      </div>
    </article>
  );
}
