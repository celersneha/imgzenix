import { Types } from "mongoose";
import { Folder } from "../models/folder.model.js";
import { Image } from "../models/image.model.js";
import { ApiError } from "../utils/api-error.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
  uploadRemoteToCloudinary,
} from "../utils/cloudinary.js";
import { validateObjectId } from "../utils/folder.utils.js";
import { updateFolderSizes } from "./folder.service.js";

const ensureFolderOwnership = async (
  userId: string,
  folderId: string,
): Promise<Types.ObjectId> => {
  validateObjectId(folderId, "folderId");

  const folder = await Folder.findOne({
    _id: folderId,
    userId,
  })
    .select("_id")
    .lean();

  if (!folder?._id) {
    throw new ApiError(404, "Folder not found");
  }

  return folder._id as Types.ObjectId;
};

const uploadImageService = async ({
  userId,
  folderId,
  localFilePath,
  originalName,
  imageName,
}: {
  userId: string;
  folderId: string;
  localFilePath: string;
  originalName: string;
  imageName?: string;
}) => {
  const parsedFolderId = await ensureFolderOwnership(userId, folderId);

  // Use custom name if provided, else fallback to originalName
  let finalName =
    imageName && imageName.trim() ? imageName.trim() : originalName;
  // Prevent duplicate names in the same folder (case-insensitive)
  const existing = await Image.findOne({
    folderId: parsedFolderId,
    userId,
    name: {
      $regex: `^${finalName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
  });
  if (existing) {
    throw new ApiError(
      409,
      "An image with this name already exists in this folder.",
    );
  }

  const uploadResult = await uploadOnCloudinary(localFilePath);
  if (!uploadResult) {
    throw new ApiError(500, "Failed to upload image");
  }

  const uploadedImage = await Image.create({
    name: finalName,
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    size: uploadResult.bytes,
    format: uploadResult.format,
    folderId: parsedFolderId,
    userId,
  });

  await updateFolderSizes(userId, parsedFolderId, uploadedImage.size);

  return uploadedImage;
};

const uploadImageFromUrlService = async ({
  userId,
  folderId,
  imageUrl,
  imageName,
}: {
  userId: string;
  folderId: string;
  imageUrl: string;
  imageName?: string;
}) => {
  const parsedFolderId = await ensureFolderOwnership(userId, folderId);

  const uploadResult = await uploadRemoteToCloudinary(imageUrl);
  if (!uploadResult) {
    throw new ApiError(500, "Failed to upload image from URL");
  }

  const fallbackName = uploadResult.original_filename || "uploaded-image";

  const uploadedImage = await Image.create({
    name: imageName?.trim() || fallbackName,
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    size: uploadResult.bytes,
    format: uploadResult.format,
    folderId: parsedFolderId,
    userId,
  });

  await updateFolderSizes(userId, parsedFolderId, uploadedImage.size);

  return uploadedImage;
};

const getImagesByFolderService = async ({
  userId,
  folderId,
}: {
  userId: string;
  folderId: string;
}) => {
  const parsedFolderId = await ensureFolderOwnership(userId, folderId);

  return Image.find({
    userId,
    folderId: parsedFolderId,
  })
    .sort({ createdAt: -1 })
    .lean();
};

const deleteImageService = async ({
  userId,
  imageId,
}: {
  userId: string;
  imageId: string;
}) => {
  validateObjectId(imageId, "imageId");

  const image = await Image.findOne({
    _id: imageId,
    userId,
  })
    .select("_id publicId folderId size")
    .lean();

  if (!image) {
    throw new ApiError(404, "Image not found");
  }

  await Image.deleteOne({
    _id: image._id,
    userId,
  });

  if (image.publicId) {
    await deleteFromCloudinary(image.publicId);
  }

  const parentFolderId = image.folderId as Types.ObjectId;
  await updateFolderSizes(userId, parentFolderId, -(image.size ?? 0));

  return {
    deletedImageId: String(image._id),
  };
};

const resolveImageByNameService = async ({
  userId,
  imageName,
  folderId,
}: {
  userId: string;
  imageName: string;
  folderId?: string;
}) => {
  const trimmedName = imageName?.trim();
  if (!trimmedName) {
    throw new ApiError(400, "Image name is required");
  }

  const query: {
    userId: string;
    folderId?: Types.ObjectId;
    name: { $regex: RegExp };
  } = {
    userId,
    name: {
      $regex: new RegExp(
        `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
        "i",
      ),
    },
  };

  if (folderId) {
    query.folderId = await ensureFolderOwnership(userId, folderId);
  }

  const matches = await Image.find(query)
    .select("_id name folderId")
    .sort({ createdAt: -1 })
    .limit(2)
    .lean();

  if (matches.length === 0) {
    throw new ApiError(404, "Image not found by name");
  }

  if (matches.length > 1) {
    throw new ApiError(
      409,
      "Multiple images found with the same name. Provide folderId.",
    );
  }

  return matches[0];
};

const deleteImageByNameService = async ({
  userId,
  imageName,
  folderId,
}: {
  userId: string;
  imageName: string;
  folderId?: string;
}) => {
  const image = await resolveImageByNameService({
    userId,
    imageName,
    folderId,
  });

  return deleteImageService({
    userId,
    imageId: String(image?._id),
  });
};

export {
  deleteImageByNameService,
  deleteImageService,
  getImagesByFolderService,
  resolveImageByNameService,
  uploadImageFromUrlService,
  uploadImageService,
};
