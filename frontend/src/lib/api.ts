import type { ServerSummary } from "../types/server";
import type { NetworkInterface } from "../types/network";
import type { DiskInfo } from "../types/storage";
import type { ServerLog } from "../types/log";

export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "").replace(
  /\/+$/,
  "",
);
export const AGENT_API_BASE_URL = (
  import.meta.env.VITE_AGENT_API_URL || API_BASE_URL
).replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_URL is required. Configure it in frontend/.env.local.",
  );
}

function buildQuery<T extends object>(params: T): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : "";
}

function readCookie(name: string): string | null {
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!entry) return null;
  return decodeURIComponent(entry.slice(name.length + 1));
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const headers = new Headers(init.headers);

  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrfToken = readCookie("infravision_csrf");
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  return fetch(input, {
    ...init,
    method,
    headers,
    credentials: "include",
  });
}

async function getErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (typeof body === "object" && body !== null && "message" in body) {
      const message = body.message;
      if (typeof message === "string") return message;
      if (Array.isArray(message)) return message.join(", ");
    }
  } catch {
    // Keep the HTTP status as the fallback message.
  }

  return `Request failed: ${response.status}`;
}

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
}

export async function login(
  email: string,
  password: string,
): Promise<AuthUser> {
  const response = await apiFetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result = (await response.json()) as {
    user: AuthUser;
  };
  return result.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiFetch(`${API_BASE_URL}/auth/profile`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result = (await response.json()) as {
    user: {
      id?: number;
      userId?: number;
      email: string;
      name?: string | null;
    };
  };

  return {
    id: result.user.id ?? result.user.userId ?? 0,
    email: result.user.email,
    name: result.user.name ?? null,
  };
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

export async function logout(): Promise<void> {
  const response = await apiFetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
}

// ==============================
// Server Management
// ==============================

export interface ManagedServer {
  id: number;
  name: string;
  hostname: string;
  agentId: string;
}

export interface AgentKeyResult {
  server: ManagedServer;
  agentKey: string;
}

export async function createServer(name: string): Promise<AgentKeyResult> {
  const response = await apiFetch(`${API_BASE_URL}/servers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function rotateAgentKey(agentId: string): Promise<AgentKeyResult> {
  const response = await apiFetch(
    `${API_BASE_URL}/servers/${encodeURIComponent(agentId)}/agent-key`,
    { method: "POST" },
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

// ==============================
// Server Summary
// ==============================

export async function getServerSummary(): Promise<ServerSummary[]> {
  const response = await apiFetch(`${API_BASE_URL}/servers/summary`);

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

// ==============================
// Docker Containers
// ==============================

export interface DockerContainer {
  id: string;
  name: string;
  status?: string;
  image: string | null;
  ports: Record<string, unknown>;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  username: string | null;
  status: string;
  cpu_percent: number;
  memory_mb: number;
}

export interface MetricSummary {
  network: {
    activeInterfaces: number;
    totalReceived: number;
    totalSent: number;
  };
  storage: {
    totalCapacity: number;
    totalUsed: number;
    totalFree: number;
  };
  processes: {
    total: number;
    running: number;
    totalCpu: number;
    totalMemory: number;
  };
  docker: {
    total: number;
    running: number;
    exited: number;
    other: number;
  };
}

export interface LatestMetric {
  disk: DiskInfo;
  docker: DockerContainer[];
  processes: ProcessInfo[];
  network: NetworkInterface[];
  collectedAt: string;
  summary?: MetricSummary;
}

export interface MetricHistory {
  id: number;
  cpu: Record<string, unknown>;
  memory: Record<string, unknown>;
  disk: DiskInfo;
  network: NetworkInterface[];
  processes: ProcessInfo[];
  docker: DockerContainer[];
  collectedAt: string;
}

export interface MetricQueryParams {
  from?: string;
  to?: string;
  limit?: number;
}

export interface LogsQueryParams extends MetricQueryParams {
  skip?: number;
  level?: string;
  channel?: string;
  search?: string;
}

export interface ServerLogsResponse {
  items: ServerLog[];
  total: number;
  stats: {
    total: number;
    information: number;
    warning: number;
    errors: number;
  };
  channels: string[];
}

export async function getLatestMetric(agentId: string): Promise<LatestMetric> {
  const response = await apiFetch(
    `${API_BASE_URL}/servers/${encodeURIComponent(agentId)}/metrics/latest`,
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

export async function getServerMetrics(
  agentId: string,
  query: MetricQueryParams = {},
): Promise<MetricHistory[]> {
  const response = await apiFetch(
    `${API_BASE_URL}/servers/${encodeURIComponent(agentId)}/metrics${buildQuery(query)}`,
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}

// ==============================
// Event Logs
// ==============================

export async function getServerLogs(
  agentId: string,
  query: LogsQueryParams = {},
): Promise<ServerLogsResponse> {
  const response = await apiFetch(
    `${API_BASE_URL}/servers/${encodeURIComponent(agentId)}/logs${buildQuery(query)}`,
  );

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json();
}
