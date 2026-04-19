import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFolderTools } from "./folder.js";
import { registerImageTools } from "./image.js";

export const buildUserScopedMcpServer = ({
  userId,
}: {
  userId: string;
}): McpServer => {
  const server = new McpServer({
    name: "imgzenix-hosted-mcp",
    version: "1.0.0",
  });

  // Register folder tools
  registerFolderTools(server, userId);

  // Register image tools
  registerImageTools(server, userId);

  return server;
};

export { registerFolderTools } from "./folder.js";
export { registerImageTools } from "./image.js";
export { resolveFolderIdForUser } from "./helpers.js";
