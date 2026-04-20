import * as z from "zod/v4";
import { basename } from "node:path";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  deleteImageByNameService,
  deleteImageService,
  getImagesByFolderService,
  resolveImageByNameService,
  uploadImageBufferService,
  uploadImageFromUrlService,
} from "../../../services/image.service.js";
import { handleTool } from "../tool-helpers.js";
import { resolveFolderIdForUser } from "./helpers.js";

const DEFAULT_MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const parsedMaxImageBytes = Number(process.env.MCP_IMAGE_MAX_BYTES);
const maxImageBytes = Number.isFinite(parsedMaxImageBytes)
  ? parsedMaxImageBytes
  : DEFAULT_MAX_IMAGE_BYTES;

const normalizeInputFilePath = (input: string): string => {
  let normalizedPath = input.trim();

  const hasMatchingDoubleQuotes =
    normalizedPath.startsWith('"') && normalizedPath.endsWith('"');
  const hasMatchingSingleQuotes =
    normalizedPath.startsWith("'") && normalizedPath.endsWith("'");

  if (hasMatchingDoubleQuotes || hasMatchingSingleQuotes) {
    normalizedPath = normalizedPath.slice(1, -1).trim();
  }

  if (normalizedPath.toLowerCase().startsWith("file://")) {
    try {
      normalizedPath = fileURLToPath(normalizedPath);
    } catch {
      // Keep original path so stat can provide a more specific filesystem error.
    }
  }

  return normalizedPath;
};

export const registerImageTools = (server: McpServer, userId: string) => {
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

  const uploadImageFromPath = async ({
    filePath,
    imageName,
    folderId,
    folderName,
    parentId,
  }: {
    filePath: string;
    imageName?: string;
    folderId?: string;
    folderName?: string;
    parentId?: string;
  }) =>
    handleTool(async () => {
      const resolvedFilePath = normalizeInputFilePath(filePath);

      if (!resolvedFilePath) {
        throw new Error("filePath is required");
      }

      let fileStats;
      try {
        fileStats = await stat(resolvedFilePath);
      } catch (error) {
        const reason = error instanceof Error ? error.message : String(error);
        throw new Error(
          `Unable to access filePath \"${resolvedFilePath}\": ${reason}`,
        );
      }

      if (!fileStats.isFile()) {
        throw new Error("filePath must point to a file");
      }

      if (fileStats.size <= 0) {
        throw new Error("File is empty");
      }

      if (fileStats.size > maxImageBytes) {
        throw new Error(
          `Image file is too large. Max allowed is ${maxImageBytes} bytes.`,
        );
      }

      const fileBuffer = await readFile(resolvedFilePath);

      if (!fileBuffer.length) {
        throw new Error("File buffer is empty");
      }

      const resolvedFolderId = await resolveFolderIdForUser({
        userId,
        folderId,
        folderName,
        parentId,
      });

      return uploadImageBufferService({
        userId,
        folderId: resolvedFolderId,
        fileBuffer,
        originalName: basename(resolvedFilePath),
        imageName,
      });
    });

  server.registerTool(
    "uploadImage",
    {
      description:
        "Upload an image from a local file path into a target folder for the authenticated user",
      inputSchema: {
        filePath: z.string().min(1),
        imageName: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    uploadImageFromPath,
  );

  server.registerTool(
    "uploadImageFromPath",
    {
      description:
        "Upload an image from a local file path into a target folder for the authenticated user",
      inputSchema: {
        filePath: z.string().min(1),
        imageName: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    uploadImageFromPath,
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
