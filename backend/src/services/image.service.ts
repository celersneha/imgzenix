import { Types } from "mongoose";
import { Folder } from "../models/folder.model.js";
import { Image } from "../models/image.model.js";
import { ApiError } from "../utils/api-error.js";
import {
  deleteFromCloudinary,
  uploadOnCloudinary,
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
}: {
  userId: string;
  folderId: string;
  localFilePath: string;
  originalName: string;
}) => {
  const parsedFolderId = await ensureFolderOwnership(userId, folderId);

  const uploadResult = await uploadOnCloudinary(localFilePath);
  if (!uploadResult) {
    throw new ApiError(500, "Failed to upload image");
  }

  const uploadedImage = await Image.create({
    name: originalName,
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

export { deleteImageService, getImagesByFolderService, uploadImageService };
