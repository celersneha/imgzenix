import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerCreateFolderTool } from "./tools/create-folder.js";
import { registerDeleteFolderTool } from "./tools/delete-folder.js";
import { registerGetFolderContentTool } from "./tools/get-folder-content.js";
import { registerListFoldersTool } from "./tools/list-folders.js";
import { registerUploadImageTool } from "./tools/upload-image.js";
import { registerDeleteImageTool } from "./tools/delete-image.js";

export const registerAllTools = (server: McpServer) => {
  registerCreateFolderTool(server);
  registerListFoldersTool(server);
  registerGetFolderContentTool(server);
  registerDeleteFolderTool(server);
  registerUploadImageTool(server);
  registerDeleteImageTool(server);
};
