import fs from "node:fs";
import path from "node:path";
import { resolveFolderByNameService } from "../../../services/folder.service.js";

export const resolveBackendBaseUrl = () => {
  const fromEnv = process.env.INTERNAL_API_BASE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  const port = process.env.PORT?.trim() || "8000";
  return `http://127.0.0.1:${port}`;
};

export const uploadImageViaMultipartApi = async ({
  localFilePath,
  folderId,
  imageName,
  rawApiKey,
}: {
  localFilePath: string;
  folderId: string;
  imageName?: string;
  rawApiKey: string;
}) => {
  const fileName = path.basename(localFilePath);
  const fileBuffer = await fs.promises.readFile(localFilePath);
  const formData = new FormData();

  formData.set("folderId", folderId);
  if (imageName?.trim()) {
    formData.set("imageName", imageName.trim());
  }

  formData.set("file", new Blob([fileBuffer]), fileName);

  const response = await fetch(
    `${resolveBackendBaseUrl()}/api/v1/image/upload`,
    {
      method: "POST",
      headers: {
        "x-api-key": rawApiKey,
      },
      body: formData,
    },
  );

  const payload = (await response.json().catch(() => null)) as {
    message?: string;
    data?: unknown;
  } | null;

  if (!response.ok) {
    throw new Error(
      payload?.message || "Failed to upload image via multipart API",
    );
  }

  return payload?.data ?? payload;
};

export const resolveFolderIdForUser = async ({
  userId,
  folderId,
  folderName,
  parentId,
}: {
  userId: string;
  folderId?: string;
  folderName?: string;
  parentId?: string;
}): Promise<string> => {
  const trimmedFolderId = folderId?.trim();
  if (trimmedFolderId) {
    return trimmedFolderId;
  }

  const trimmedFolderName = folderName?.trim();
  if (!trimmedFolderName) {
    throw new Error("Either folderId or folderName is required");
  }

  const folder = await resolveFolderByNameService({
    userId,
    name: trimmedFolderName,
    parentId,
  });

  if (!folder?._id) {
    throw new Error("Failed to resolve folder by name");
  }

  return String(folder._id);
};
