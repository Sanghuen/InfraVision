export type LogLevel = "info" | "information" | "warning" | "error" | "critical";

export type LogChannel = string;

export interface ServerLog {
  id: number;
  agentId: string;
  recordId: number;
  timestamp: string;
  level: LogLevel;
  source: string;
  eventId: number;
  channel: LogChannel;
  message: string;
  createdAt: string;
}
