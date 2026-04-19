import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export type SessionEntry = {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  userId: string;
};
