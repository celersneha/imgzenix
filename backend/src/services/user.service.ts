import mongoose from "mongoose";
import { ApiKey } from "../models/api-key.model.js";
import { Folder } from "../models/folder.model.js";
import { Image } from "../models/image.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import type { DeleteCurrentUserResult } from "../types/user.types.js";

const deleteCloudinaryAsset = async (publicId: string) => {
  const result = await deleteFromCloudinary(publicId);

  if (!result || (typeof result === "object" && "result" in result)) {
    const typedResult = result as { result?: string } | null;
    if (
      !typedResult ||
      (typedResult.result !== "ok" && typedResult.result !== "not found")
    ) {
      throw new Error(`Failed to delete Cloudinary asset ${publicId}`);
    }
  }

  return result;
};

const deleteCurrentUserService = async ({
  userId,
}: {
  userId: string;
}): Promise<DeleteCurrentUserResult> => {
  const existingUser = await User.findById(userId).select("_id").lean();

  if (!existingUser) {
    throw new ApiError(404, "User not found");
  }

  const [apiKeys, folders, images] = await Promise.all([
    ApiKey.find({ userId }).select("_id").lean(),
    Folder.find({ userId }).select("_id").lean(),
    Image.find({ userId }).select("_id publicId").lean(),
  ]);

  const imagePublicIds = images
    .map((image) => image.publicId)
    .filter((publicId): publicId is string => Boolean(publicId));

  const session = await mongoose.startSession();

  let deletedApiKeys = 0;
  let deletedFolders = 0;
  let deletedImages = 0;

  try {
    await session.withTransaction(async () => {
      const apiKeyDeleteResult = await ApiKey.deleteMany(
        { userId },
        { session },
      );
      deletedApiKeys = apiKeyDeleteResult.deletedCount ?? apiKeys.length;

      const imageDeleteResult = await Image.deleteMany({ userId }, { session });
      deletedImages = imageDeleteResult.deletedCount ?? images.length;

      const folderDeleteResult = await Folder.deleteMany(
        { userId },
        { session },
      );
      deletedFolders = folderDeleteResult.deletedCount ?? folders.length;

      await User.deleteOne({ _id: userId }, { session });
    });
  } finally {
    await session.endSession();
  }

  const cloudinaryResults = await Promise.allSettled(
    imagePublicIds.map((publicId) => deleteCloudinaryAsset(publicId)),
  );

  const failedCloudinaryDeletes = cloudinaryResults.filter(
    (result) => result.status === "rejected",
  ).length;

  return {
    deletedFolders,
    deletedImages,
    deletedApiKeys,
    failedCloudinaryDeletes,
  };
};

export { deleteCurrentUserService };
