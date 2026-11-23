import { X } from "lucide-react";

interface ServerRegistrationFormProps {
  name: string;
  onNameChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: () => void;
  onClose: () => void;
}

export function ServerRegistrationForm({
  name,
  onNameChange,
  loading,
  error,
  onSubmit,
  onClose,
}: ServerRegistrationFormProps) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="rounded-xl border border-slate-800 bg-slate-900 p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-white">Register a Server</h2>
          <p className="mt-1 text-sm text-slate-400">
            Create a server record and generate its unique Agent Key.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close create server form"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          maxLength={100}
          required
          placeholder="e.g. Ubuntu Production Server"
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Server"}
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
