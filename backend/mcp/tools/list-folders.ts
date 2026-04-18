import * as z from "zod/v4";
import type { RegisterTool } from "./shared.js";
import {
  apiClient,
  toolSuccess,
  withAuth,
  withToolErrorHandling,
} from "./shared.js";

const inputSchema = {
  parentId: z.string().optional().describe("Parent folder id"),
  page: z.number().int().positive().optional().describe("Page number"),
  limit: z.number().int().positive().optional().describe("Page size"),
};

export const registerListFoldersTool: RegisterTool = (server) => {
  server.registerTool(
    "listFolders",
    {
      description: "List folders under a parent folder",
      inputSchema,
    },
    async ({ parentId, page, limit }) =>
      withToolErrorHandling(async () => {
        const response = await apiClient.get("/folder", {
          params: {
            ...(parentId?.trim() ? { parentId: parentId.trim() } : {}),
            ...(page ? { page } : {}),
            ...(limit ? { limit } : {}),
          },
          headers: withAuth(),
        });

        return toolSuccess(
          response.data?.data,
          "Folders fetched successfully.",
        );
      }),
  );
};
