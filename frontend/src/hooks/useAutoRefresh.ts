import { useEffect } from "react";

export function useAutoRefresh(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    const intervalId = window.setInterval(() => {
      void callback();
    }, intervalMs);

    return () => window.clearInterval(intervalId);
  }, [callback, enabled, intervalMs]);
}
