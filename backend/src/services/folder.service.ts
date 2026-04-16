import mongoose, { type ClientSession, Types } from "mongoose";
import { Folder } from "../models/folder.model.js";
import { Image } from "../models/image.model.js";
import { ApiError } from "../utils/api-error.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import {
  normalizeFolderName,
  parseParentId,
  sanitizePagination,
  validateObjectId,
} from "../utils/folder.utils.js";
import type {
  CreateFolderInput,
  DeleteFolderInput,
  DeleteFolderResult,
  FolderTraversalResult,
  GetFolderContentInput,
  GetFoldersInput,
} from "../types/folder.types.js";

const ensureParentFolderOwnership = async (
  userId: string,
  parentId: Types.ObjectId | null,
): Promise<void> => {
  if (!parentId) {
    return;
  }

  const parentFolder = await Folder.findOne({
    _id: parentId,
    userId,
  })
    .select("_id")
    .lean();

  if (!parentFolder) {
    throw new ApiError(404, "Parent folder not found");
  }
};

const ensureNoDuplicateFolder = async (
  userId: string,
  parentId: Types.ObjectId | null,
  folderName: string,
): Promise<void> => {
  const existingFolder = await Folder.findOne({
    userId,
    parentId,
    name: folderName,
  })
    .select("_id")
    .lean();

  if (existingFolder) {
    throw new ApiError(409, "Folder with this name already exists");
  }
};

const traverseFolderTree = async (
  userId: string,
  rootFolderId: Types.ObjectId,
): Promise<FolderTraversalResult> => {
  const folderIds: Types.ObjectId[] = [];
  const queue: Types.ObjectId[] = [rootFolderId];
  const batchSize = 200;

  while (queue.length > 0) {
    const currentBatch = queue.splice(0, batchSize);
    folderIds.push(...currentBatch);

    const childFolders = await Folder.find({
      userId,
      parentId: { $in: currentBatch },
    })
      .select("_id")
      .lean();

    for (const child of childFolders) {
      queue.push(child._id as Types.ObjectId);
    }
  }

  return { folderIds };
};

const updateFolderSizes = async (
  userId: string,
  startFolderId: Types.ObjectId,
  delta: number,
  session?: ClientSession,
): Promise<void> => {
  if (delta === 0) {
    return;
  }

  let currentFolderId: Types.ObjectId | null = startFolderId;

  while (currentFolderId) {
    const updatedFolder: { parentId: Types.ObjectId | null } | null =
      await Folder.findOneAndUpdate(
        { _id: currentFolderId, userId },
        { $inc: { totalSize: delta } },
        {
          new: true,
          session,
        },
      )
        .select("parentId")
        .lean<{ parentId: Types.ObjectId | null }>();

    if (!updatedFolder) {
      break;
    }

    currentFolderId = (updatedFolder.parentId as Types.ObjectId | null) ?? null;
  }
};

const createFolderService = async ({
  userId,
  name,
  parentId,
}: CreateFolderInput) => {
  const normalizedName = normalizeFolderName(name);
  const parsedParentId = parseParentId(parentId);

  await ensureParentFolderOwnership(userId, parsedParentId);
  await ensureNoDuplicateFolder(userId, parsedParentId, normalizedName);

  try {
    const folder = await Folder.create({
      name: normalizedName,
      userId,
      parentId: parsedParentId,
      totalSize: 0,
    });

    return folder;
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      throw new ApiError(409, "Folder with this name already exists");
    }

    throw error;
  }
};

const getFoldersService = async ({
  userId,
  parentId,
  page,
  limit,
}: GetFoldersInput) => {
  const parsedParentId = parseParentId(parentId);
  await ensureParentFolderOwnership(userId, parsedParentId);

  const {
    page: safePage,
    limit: safeLimit,
    skip,
  } = sanitizePagination(page, limit);

  const query = {
    userId,
    parentId: parsedParentId,
  };

  const [folders, total] = await Promise.all([
    Folder.find(query)
      .sort({ name: 1, createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Folder.countDocuments(query),
  ]);

  return {
    folders,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

const getFolderContentService = async ({
  userId,
  folderId,
}: GetFolderContentInput) => {
  validateObjectId(folderId, "folderId");

  const currentFolder = await Folder.findOne({
    _id: folderId,
    userId,
  }).lean();

  if (!currentFolder) {
    throw new ApiError(404, "Folder not found");
  }

  const [folders, images] = await Promise.all([
    Folder.find({ userId, parentId: currentFolder._id })
      .sort({ name: 1, createdAt: -1 })
      .lean(),
    Image.find({ userId, folderId: currentFolder._id })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    currentFolder,
    folders,
    images,
  };
};

const deleteFolderService = async ({
  userId,
  folderId,
}: DeleteFolderInput): Promise<DeleteFolderResult> => {
  validateObjectId(folderId, "folderId");

  const rootFolder = await Folder.findOne({
    _id: folderId,
    userId,
  })
    .select("_id parentId")
    .lean();

  if (!rootFolder) {
    throw new ApiError(404, "Folder not found");
  }

  const { folderIds } = await traverseFolderTree(
    userId,
    rootFolder._id as Types.ObjectId,
  );

  const images = await Image.find({
    userId,
    folderId: { $in: folderIds },
  })
    .select("_id publicId size")
    .lean();

  const imageIds = images.map((image) => image._id);
  const freedSize = images.reduce((sum, image) => sum + (image.size ?? 0), 0);

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      if (imageIds.length > 0) {
        await Image.deleteMany(
          {
            _id: { $in: imageIds },
            userId,
          },
          { session },
        );
      }

      await Folder.deleteMany(
        {
          _id: { $in: folderIds },
          userId,
        },
        { session },
      );

      if (rootFolder.parentId && freedSize > 0) {
        await updateFolderSizes(
          userId,
          rootFolder.parentId as Types.ObjectId,
          -freedSize,
          session,
        );
      }
    });
  } finally {
    await session.endSession();
  }

  const cloudinaryResults = await Promise.allSettled(
    images
      .filter((image) => Boolean(image.publicId))
      .map((image) => deleteFromCloudinary(image.publicId)),
  );

  const failedCloudinaryDeletes = cloudinaryResults.filter((result) => {
    if (result.status === "rejected") {
      return true;
    }

    const value = result.value as { result?: string } | null;
    return !value || (value.result !== "ok" && value.result !== "not found");
  }).length;

  return {
    deletedFolders: folderIds.length,
    deletedImages: imageIds.length,
    freedSize,
    failedCloudinaryDeletes,
  };
};

export {
  createFolderService,
  deleteFolderService,
  getFolderContentService,
  getFoldersService,
  traverseFolderTree,
  updateFolderSizes,
};
