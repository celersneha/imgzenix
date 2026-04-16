import type { Types } from "mongoose";

export interface CreateFolderInput {
  userId: string;
  name: string;
  parentId?: string | null;
}

export interface GetFoldersInput {
  userId: string;
  parentId?: string | null;
  page?: number;
  limit?: number;
}

export interface GetFolderContentInput {
  userId: string;
  folderId: string;
}

export interface DeleteFolderInput {
  userId: string;
  folderId: string;
}

export interface FolderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface FolderTraversalResult {
  folderIds: Types.ObjectId[];
}

export interface DeleteFolderResult {
  deletedFolders: number;
  deletedImages: number;
  freedSize: number;
  failedCloudinaryDeletes: number;
}
