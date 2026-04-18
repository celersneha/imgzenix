import * as z from "zod/v4";
import type { RegisterTool } from "./shared.js";
import {
  apiClient,
  buildUploadForm,
  resolveFolderId,
  toolSuccess,
  withAuth,
  withToolErrorHandling,
} from "./shared.js";

const inputSchema = {
  folderId: z.string().optional().describe("Target folder id"),
  folderName: z.string().optional().describe("Target folder name"),
  parentId: z
    .string()
    .optional()
    .describe("Parent folder id when folderName is ambiguous"),
  localFilePath: z
    .string()
    .min(1)
    .optional()
    .describe("Absolute or relative local file path"),
  imageUrl: z
    .string()
    .url()
    .optional()
    .describe("Public image URL to import and upload"),
  imageName: z
    .string()
    .optional()
    .describe("Custom name for the uploaded image (optional)"),
};

export const registerUploadImageTool: RegisterTool = (server) => {
  server.registerTool(
    "uploadImage",
    {
      description:
        "Upload an image to a folder using either a local file path or a public image URL",
      inputSchema,
    },
    async ({
      folderId,
      folderName,
      parentId,
      localFilePath,
      imageUrl,
      imageName,
    }) =>
      withToolErrorHandling(async () => {
        const resolvedFolderId = await resolveFolderId({
          folderId,
          folderName,
          parentId,
        });

        const hasLocalFilePath = Boolean(localFilePath?.trim());
        const hasImageUrl = Boolean(imageUrl?.trim());

        if (!hasLocalFilePath && !hasImageUrl) {
          throw new Error("Either localFilePath or imageUrl is required");
        }

        if (hasLocalFilePath && hasImageUrl) {
          throw new Error(
            "Provide only one source: localFilePath or imageUrl, not both",
          );
        }

        if (hasImageUrl) {
          const response = await apiClient.post(
            "/image/upload-url",
            {
              folderId: resolvedFolderId,
              imageUrl,
              ...(imageName?.trim() ? { imageName: imageName.trim() } : {}),
            },
            {
              headers: withAuth(),
              maxBodyLength: Infinity,
            },
          );

          return toolSuccess(
            response.data?.data,
            "Image uploaded successfully from URL.",
          );
        }

        const form = buildUploadForm(resolvedFolderId, String(localFilePath));
        if (imageName) {
          form.append("imageName", imageName);
        }

        const response = await apiClient.post("/image/upload", form, {
          headers: withAuth(form.getHeaders()),
          maxBodyLength: Infinity,
        });

        return toolSuccess(response.data?.data, "Image uploaded successfully.");
      }),
  );
};
