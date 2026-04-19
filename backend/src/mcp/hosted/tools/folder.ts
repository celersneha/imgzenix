import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  createFolderService,
  deleteFolderByNameService,
  deleteFolderService,
  getFolderContentService,
  getFoldersService,
} from "../../../services/folder.service.js";
import { handleTool } from "../tool-helpers.js";
import { resolveFolderIdForUser } from "./helpers.js";

export const registerFolderTools = (server: McpServer, userId: string) => {
  server.registerTool(
    "createFolder",
    {
      description: "Create a folder for the authenticated user",
      inputSchema: {
        name: z.string().min(1).max(120),
        parentId: z.string().optional(),
      },
    },
    async ({ name, parentId }) =>
      handleTool(async () => {
        return createFolderService({
          userId,
          name,
          parentId,
        });
      }),
  );

  server.registerTool(
    "getFolderContent",
    {
      description: "Get folders and images inside a specific folder",
      inputSchema: {
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ folderId, folderName, parentId }) =>
      handleTool(async () => {
        const resolvedFolderId = await resolveFolderIdForUser({
          userId,
          folderId,
          folderName,
          parentId,
        });

        return getFolderContentService({
          userId,
          folderId: resolvedFolderId,
        });
      }),
  );

  server.registerTool(
    "listFolders",
    {
      description: "List folders under a parent folder",
      inputSchema: {
        parentId: z.string().optional(),
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().optional(),
      },
    },
    async ({ parentId, page, limit }) =>
      handleTool(async () => {
        return getFoldersService({
          userId,
          parentId,
          page,
          limit,
        });
      }),
  );

  server.registerTool(
    "deleteFolder",
    {
      description: "Delete folder by id or by name",
      inputSchema: {
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ folderId, folderName, parentId }) =>
      handleTool(async () => {
        return folderId?.trim()
          ? await deleteFolderService({ userId, folderId })
          : await deleteFolderByNameService({
              userId,
              name: folderName ?? "",
              parentId,
            });
      }),
  );
};
