import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerAllTools } from "./registry.js";

const server = new McpServer({
  name: "imgzenix-drive-mcp",
  version: "1.0.0",
});

registerAllTools(server);

const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
};

main().catch((error: unknown) => {
  console.error("MCP server startup failed:", error);
  process.exit(1);
});
