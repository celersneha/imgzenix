import { resolveFolderByNameService } from "../../../services/folder.service.js";

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
