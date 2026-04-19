import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerFolderTools } from "./folder.js";
import { registerImageTools } from "./image.js";

export const buildUserScopedMcpServer = ({
  userId,
  rawApiKey,
}: {
  userId: string;
  rawApiKey: string;
}): McpServer => {
  const server = new McpServer({
    name: "imgzenix-hosted-mcp",
    version: "1.0.0",
  });

  // Register folder tools
  registerFolderTools(server, userId);

  // Register image tools
  registerImageTools(server, userId, rawApiKey);

  return server;
};

export { registerFolderTools } from "./folder.js";
export { registerImageTools } from "./image.js";
export {
  resolveFolderIdForUser,
  uploadImageViaMultipartApi,
} from "./helpers.js";
