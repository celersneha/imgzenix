import { Types } from "mongoose";
import { ApiError } from "./api-error.js";

const validateObjectId = (value: string, fieldName: string): void => {
  if (!Types.ObjectId.isValid(value)) {
    throw new ApiError(400, `Invalid ${fieldName}`);
  }
};

const normalizeFolderName = (name: string): string => {
  const trimmedName = name?.trim();

  if (!trimmedName) {
    throw new ApiError(400, "Folder name is required");
  }

  if (trimmedName.length > 120) {
    throw new ApiError(400, "Folder name must be 120 characters or less");
  }

  return trimmedName;
};

const parseParentId = (parentId?: string | null): Types.ObjectId | null => {
  if (!parentId || parentId === "null") {
    return null;
  }

  validateObjectId(parentId, "parentId");
  return new Types.ObjectId(parentId);
};

const sanitizePagination = (
  pageValue?: number,
  limitValue?: number,
): { page: number; limit: number; skip: number } => {
  const page =
    Number.isFinite(pageValue) && (pageValue as number) > 0
      ? Math.floor(pageValue as number)
      : 1;
  const limit =
    Number.isFinite(limitValue) && (limitValue as number) > 0
      ? Math.min(Math.floor(limitValue as number), 100)
      : 20;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export {
  validateObjectId,
  normalizeFolderName,
  parseParentId,
  sanitizePagination,
};
