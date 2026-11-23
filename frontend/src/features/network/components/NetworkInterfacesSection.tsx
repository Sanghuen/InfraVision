import { Network as NetworkIcon } from "lucide-react";
import type { NetworkInterface } from "../../../types/network";
import { formatBytes } from "../../../lib/format";

interface NetworkInterfacesSectionProps {
  interfaces: NetworkInterface[];
  loading: boolean;
}

export function NetworkInterfacesSection({
  interfaces,
  loading,
}: NetworkInterfacesSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-white">Network Interfaces</h2>
        <p className="mt-1 text-sm text-slate-400">
          Network adapters detected by the operating system.
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-10 text-center text-slate-400">
          Loading network interfaces...
        </div>
      ) : interfaces.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
          <NetworkIcon className="mx-auto h-10 w-10 text-slate-600" />
          <h3 className="mt-4 font-semibold text-slate-300">
            No network interfaces found
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            No network data is available for this server.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900">
          <table className="w-full min-w-[950px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-4">Interface</th>
                <th className="px-5 py-4">IP Address</th>
                <th className="px-5 py-4">MAC Address</th>
                <th className="px-5 py-4 text-right">Received</th>
                <th className="px-5 py-4 text-right">Sent</th>
                <th className="px-5 py-4 text-right">Packets In</th>
                <th className="px-5 py-4 text-right">Packets Out</th>
                <th className="px-5 py-4">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {interfaces.map((item, index) => {
                const hasTraffic =
                  Number(item.bytes_recv) > 0 ||
                  Number(item.bytes_sent) > 0 ||
                  Number(item.packets_recv) > 0 ||
                  Number(item.packets_sent) > 0;

                return (
                  <tr
                    key={`${item.interface}-${index}`}
                    className="transition hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-4 font-medium text-white">
                      <div className="flex items-center gap-2">
                        <NetworkIcon className="h-4 w-4 text-cyan-400" />
                        {item.interface || "Unknown"}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-400">
                      {item.ip_address || "N/A"}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">
                      {item.mac_address || "N/A"}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-blue-400">
                      {formatBytes(Number(item.bytes_recv) || 0)}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-purple-400">
                      {formatBytes(Number(item.bytes_sent) || 0)}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-slate-300">
                      {(Number(item.packets_recv) || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right tabular-nums text-slate-300">
                      {(Number(item.packets_sent) || 0).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          hasTraffic
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-slate-700/50 text-slate-400"
                        }`}
                      >
                        {hasTraffic ? "Traffic detected" : "No traffic"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
