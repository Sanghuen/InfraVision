import { HardDrive } from "lucide-react";
import type { StoragePartition } from "../../../types/storage";
import { StoragePartitionCard } from "./StoragePartitionCard";

interface StoragePartitionsSectionProps {
  partitions: StoragePartition[];
  loading: boolean;
}

export function StoragePartitionsSection({
  partitions,
  loading,
}: StoragePartitionsSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Disk Partitions</h2>
        <p className="mt-1 text-sm text-slate-400">
          Storage devices and their current capacity usage.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
          Loading storage information...
        </div>
      ) : partitions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
          <HardDrive className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-4 font-semibold text-slate-300">
            No storage partitions found
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            No disk partition data is available for this server.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {partitions.map((partition, index) => (
            <StoragePartitionCard
              key={`${partition.device}-${index}`}
              partition={partition}
            />
          ))}
        </div>
      )}
    </section>
  );
}
