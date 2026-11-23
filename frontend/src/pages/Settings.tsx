import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  KeyRound,
  ShieldCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { changePassword } from "../lib/api";
import { useAuth } from "../context/useAuth";

export default function Settings() {
  const { user, clearLocalSession } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 12) {
      setError("New password must contain at least 12 characters.");
      return;
    }

    if (new TextEncoder().encode(newPassword).length > 72) {
      setError("New password must not exceed 72 UTF-8 bytes.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from the current password.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(currentPassword, newPassword);
      clearLocalSession();
      navigate("/login", {
        replace: true,
        state: {
          message:
            "Password changed successfully. Please sign in with your new password.",
        },
      });
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to change password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-medium text-cyan-400">Account</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-white">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage your administrator account and security preferences.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
        <div className="flex items-start gap-4 border-b border-slate-800 p-5 sm:p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-300">
            <KeyRound className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-white">Change password</h2>
            <p className="mt-1 text-sm text-slate-400">
              Update the password used to access InfraVision.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Signed in as
            </p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {user?.email ?? "Administrator"}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="current-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Current password
            </label>
            <input
              id="current-password"
              type={showPasswords ? "text" : "password"}
              autoComplete="current-password"
              required
              maxLength={128}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className={inputClass}
              placeholder="Enter your current password"
            />
          </div>

          <div>
            <label
              htmlFor="new-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              New password
            </label>
            <input
              id="new-password"
              type={showPasswords ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className={inputClass}
              placeholder="At least 12 characters"
            />
          </div>

          <div>
            <label
              htmlFor="confirm-password"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Confirm new password
            </label>
            <input
              id="confirm-password"
              type={showPasswords ? "text" : "password"}
              autoComplete="new-password"
              required
              maxLength={128}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={inputClass}
              placeholder="Enter the new password again"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPasswords((visible) => !visible)}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition hover:text-cyan-300"
          >
            {showPasswords ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            {showPasswords ? "Hide passwords" : "Show passwords"}
          </button>

          <div className="rounded-xl border border-cyan-500/15 bg-cyan-500/5 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
              <div className="space-y-1 text-xs leading-5 text-slate-400">
                <p className="font-medium text-slate-200">
                  Password security requirements
                </p>
                <p>
                  Use at least 12 characters and no more than 72 UTF-8 bytes.
                </p>
                <p>
                  Choose a unique password that you do not use on other
                  services.
                </p>
                <p>
                  After a successful change, all existing sessions are revoked
                  and you must sign in again.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Your current password is required to confirm this change.
            </p>
            <button
              type="submit"
              disabled={
                submitting ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submitting ? "Updating password..." : "Update password"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
