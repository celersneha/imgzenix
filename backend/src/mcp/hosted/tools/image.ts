import fs from "node:fs";
import * as z from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  deleteImageByNameService,
  deleteImageService,
  getImagesByFolderService,
  resolveImageByNameService,
  uploadImageFromUrlService,
} from "../../../services/image.service.js";
import { handleTool } from "../tool-helpers.js";
import {
  resolveFolderIdForUser,
  uploadImageViaMultipartApi,
} from "./helpers.js";

export const registerImageTools = (
  server: McpServer,
  userId: string,
  rawApiKey: string,
) => {
  server.registerTool(
    "listImages",
    {
      description: "List images in a folder",
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

        return getImagesByFolderService({
          userId,
          folderId: resolvedFolderId,
        });
      }),
  );

  server.registerTool(
    "uploadImage",
    {
      description:
        "Upload an image from a local file path into a target folder for the authenticated user",
      inputSchema: {
        localFilePath: z.string().min(1),
        imageName: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ localFilePath, imageName, folderId, folderName, parentId }) =>
      handleTool(async () => {
        const normalizedLocalPath = localFilePath.trim();
        if (!fs.existsSync(normalizedLocalPath)) {
          throw new Error(
            "Local file path is not accessible to the MCP server process. Provide a path accessible to the MCP server, or use uploadImageFromUrl with a public URL.",
          );
        }

        const resolvedFolderId = await resolveFolderIdForUser({
          userId,
          folderId,
          folderName,
          parentId,
        });

        return uploadImageViaMultipartApi({
          localFilePath: normalizedLocalPath,
          folderId: resolvedFolderId,
          imageName,
          rawApiKey,
        });
      }),
  );

  server.registerTool(
    "uploadImageFromUrl",
    {
      description:
        "Upload an image from a public URL into a target folder for the authenticated user",
      inputSchema: {
        imageUrl: z.string().url(),
        imageName: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ imageUrl, imageName, folderId, folderName, parentId }) =>
      handleTool(async () => {
        const resolvedFolderId = await resolveFolderIdForUser({
          userId,
          folderId,
          folderName,
          parentId,
        });

        return uploadImageFromUrlService({
          userId,
          folderId: resolvedFolderId,
          imageUrl,
          imageName,
        });
      }),
  );

  server.registerTool(
    "deleteImage",
    {
      description: "Delete image by id or by name",
      inputSchema: {
        imageId: z.string().optional(),
        imageName: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ imageId, imageName, folderId, folderName, parentId }) =>
      handleTool(async () => {
        let result;

        if (imageId?.trim()) {
          result = await deleteImageService({ userId, imageId });
        } else {
          let scopedFolderId = folderId;
          if (!scopedFolderId && folderName?.trim()) {
            scopedFolderId = await resolveFolderIdForUser({
              userId,
              folderName,
              parentId,
            });
          }

          result = await deleteImageByNameService({
            userId,
            imageName: imageName ?? "",
            folderId: scopedFolderId,
          });
        }

        return result;
      }),
  );

  server.registerTool(
    "resolveImageByName",
    {
      description: "Resolve image metadata by name",
      inputSchema: {
        imageName: z.string().min(1),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ imageName, folderId, folderName, parentId }) =>
      handleTool(async () => {
        let scopedFolderId = folderId;
        if (!scopedFolderId && folderName?.trim()) {
          scopedFolderId = await resolveFolderIdForUser({
            userId,
            folderName,
            parentId,
          });
        }

        return resolveImageByNameService({
          userId,
          imageName,
          folderId: scopedFolderId,
        });
      }),
  );
};
