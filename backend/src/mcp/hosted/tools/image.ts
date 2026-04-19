import * as z from "zod/v4";
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

const stripDataUrlPrefix = (value: string): string => {
  const trimmedValue = value.trim();
  const commaIndex = trimmedValue.indexOf(",");

  if (trimmedValue.startsWith("data:") && commaIndex >= 0) {
    return trimmedValue.slice(commaIndex + 1);
  }

  return trimmedValue;
};

const estimateDecodedSizeInBytes = (normalizedBase64: string): number => {
  const withoutWhitespace = normalizedBase64.replace(/\s+/g, "");
  const padding = withoutWhitespace.endsWith("==")
    ? 2
    : withoutWhitespace.endsWith("=")
      ? 1
      : 0;

  return Math.floor((withoutWhitespace.length * 3) / 4) - padding;
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

  server.registerTool(
    "uploadImage",
    {
      description:
        "Upload an image from base64 content into a target folder for the authenticated user",
      inputSchema: {
        base64Data: z.string().min(1),
        fileName: z.string().min(1),
        mimeType: z.string().optional(),
        imageName: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({
      base64Data,
      fileName,
      mimeType,
      imageName,
      folderId,
      folderName,
      parentId,
    }) =>
      handleTool(async () => {
        const normalizedBase64 = stripDataUrlPrefix(base64Data);
        const estimatedSize = estimateDecodedSizeInBytes(normalizedBase64);

        if (estimatedSize <= 0) {
          throw new Error("Invalid or empty base64Data payload");
        }

        if (estimatedSize > maxImageBytes) {
          throw new Error(
            `Image payload is too large. Max allowed is ${maxImageBytes} bytes.`,
          );
        }

        let fileBuffer: Buffer;

        try {
          fileBuffer = Buffer.from(normalizedBase64, "base64");
        } catch {
          throw new Error("Invalid base64Data payload");
        }

        if (!fileBuffer.length) {
          throw new Error("Decoded file buffer is empty");
        }

        if (fileBuffer.length > maxImageBytes) {
          throw new Error(
            `Decoded image is too large. Max allowed is ${maxImageBytes} bytes.`,
          );
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
          originalName: fileName.trim(),
          mimeType,
          imageName,
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
