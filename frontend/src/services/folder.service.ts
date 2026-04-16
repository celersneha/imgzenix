import axiosInstance from "./axios-client";
import type {
  ApiResponse,
  Folder,
  CreateFolderRequest,
  FolderContent,
  DeleteFolderResult,
} from "@/types/api";

export const folderService = {
  // Create a new folder
  createFolder: (payload: CreateFolderRequest) =>
    axiosInstance.post<ApiResponse<Folder>>("/folder", payload),

  // Get folders (with optional parentId and pagination)
  getFolders: (parentId?: string | null, page?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (parentId) params.append("parentId", parentId);
    if (page) params.append("page", String(page));
    if (limit) params.append("limit", String(limit));

    return axiosInstance.get<
      ApiResponse<{
        folders: Folder[];
        page?: number;
        limit?: number;
        total?: number;
      }>
    >(`/folder?${params.toString()}`);
  },

  // Get folder content (folders + images inside this folder)
  getFolderContent: (folderId: string) =>
    axiosInstance.get<ApiResponse<FolderContent>>(
      `/folder/${folderId}/content`,
    ),

  // Delete a folder
  deleteFolder: (folderId: string) =>
    axiosInstance.delete<ApiResponse<DeleteFolderResult>>(`/folder/${folderId}`),
};
