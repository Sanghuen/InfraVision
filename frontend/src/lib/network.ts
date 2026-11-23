import type { MetricHistory } from "./api";
import type { NetworkInterface } from "../types/network";

export function getNetworkInterfaces(metric: MetricHistory): NetworkInterface[] {
  return Array.isArray(metric.network) ? metric.network : [];
}
