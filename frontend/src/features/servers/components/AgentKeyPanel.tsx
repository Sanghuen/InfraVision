import { Copy, KeyRound, X } from "lucide-react";
import type { AgentKeyResult } from "../../../lib/api";

interface AgentKeyPanelProps {
  credentials: AgentKeyResult;
  copied: boolean;
  error: string | null;
  onCopy: () => void;
  onClose: () => void;
}

export function AgentKeyPanel({
  credentials,
  copied,
  error,
  onCopy,
  onClose,
}: AgentKeyPanelProps) {
  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-key-title"
      className="rounded-xl border border-cyan-500/30 bg-slate-900 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-cyan-400">
            <KeyRound className="h-5 w-5" />
            <h2 id="agent-key-title" className="font-semibold text-white">
              Agent Key Generated
            </h2>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {credentials.server.name} · Save this key now. It will not be shown again.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Agent Key details"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">
          Server ID
        </p>
        <p className="break-all font-mono text-sm text-slate-200">
          {credentials.server.agentId}
        </p>
        <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wider text-slate-500">
          Agent Key
        </p>
        <p className="break-all font-mono text-sm text-cyan-300">
          {credentials.agentKey}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Copied setup values" : "Copy Agent Setup"}
        </button>
        <p className="text-xs text-slate-500">
          Rotating the key immediately invalidates the previous key.
        </p>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
