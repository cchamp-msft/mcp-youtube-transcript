#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "node:http";
import { loadConfig, AppConfig } from "./config.js";
import { registerTools } from "./tools.js";

const config = loadConfig();

function createConfiguredServer(): McpServer {
  const server = new McpServer({
    name: "mcp-youtube-transcript",
    version: "1.0.0",
  });
  registerTools(server);
  return server;
}

function logStartupBanner(config: AppConfig, transport: string) {
  console.error(`[mcp-youtube-transcript] YouTube transcript server running on ${transport}`);
  console.error(`[mcp-youtube-transcript] Logging: level=${config.logLevel}`);
}

async function main() {
  if (config.transport === "http") {
    const httpServer = createServer(async (req, res) => {
      if (req.method === "GET" && req.url === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }

      if (req.url === "/mcp") {
        const mcpTransport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        const mcpServer = createConfiguredServer();
        await mcpServer.connect(mcpTransport);
        await mcpTransport.handleRequest(req, res);
        await mcpTransport.close();
        await mcpServer.close();
        return;
      }

      res.writeHead(404).end();
    });

    httpServer.listen(config.port, () => {
      logStartupBanner(config, `http (port ${config.port}, stateless)`);
      console.error(`[mcp-youtube-transcript] MCP endpoint: http://localhost:${config.port}/mcp`);
    });
  } else {
    const server = createConfiguredServer();
    const stdioTransport = new StdioServerTransport();
    await server.connect(stdioTransport);
    logStartupBanner(config, "stdio");
  }
}

main().catch((error) => {
  console.error("[mcp-youtube-transcript] Fatal error:", error);
  process.exit(1);
});
