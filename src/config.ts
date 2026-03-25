export type LogLevel = "none" | "basic" | "debug";

export interface AppConfig {
  transport: "stdio" | "http";
  port: number;
  logLevel: LogLevel;
}

export function loadConfig(): AppConfig {
  const logLevelRaw = (process.env.LOG_LEVEL ?? "none").trim().toLowerCase();
  const validLogLevels: LogLevel[] = ["none", "basic", "debug"];
  const logLevel: LogLevel = validLogLevels.includes(logLevelRaw as LogLevel)
    ? (logLevelRaw as LogLevel)
    : "none";

  const transport = process.env.MCP_TRANSPORT === "http" ? "http" : "stdio";

  return {
    transport,
    port: parseInt(process.env.MCP_PORT ?? "8000", 10) || 8000,
    logLevel,
  };
}
