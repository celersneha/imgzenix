import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  deleteImageByNameService,
  deleteImageService,
  getImagesByFolderService,
  resolveImageByNameService,
  uploadImageFromUrlService,
  uploadImageService,
} from "../services/image.service.js";

const uploadImage = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const folderId = String(req.body.folderId ?? "").trim();
  if (!folderId) {
    throw new ApiError(400, "folderId is required");
  }

  const filePath = req.file?.path;
  if (!filePath) {
    throw new ApiError(400, "Image file is required");
  }

  // Accept custom image name from frontend
  const customName =
    typeof req.body.imageName === "string" ? req.body.imageName.trim() : "";

  const uploadedImage = await uploadImageService({
    userId: String(userId),
    folderId,
    localFilePath: filePath,
    originalName: req.file?.originalname ?? "uploaded-image",
    imageName: customName,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, uploadedImage, "Image uploaded successfully"));
});

const uploadImageFromUrl = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const folderId = String(req.body.folderId ?? "").trim();
  if (!folderId) {
    throw new ApiError(400, "folderId is required");
  }

  const imageUrl = String(req.body.imageUrl ?? "").trim();
  if (!imageUrl) {
    throw new ApiError(400, "imageUrl is required");
  }

  const customName =
    typeof req.body.imageName === "string" ? req.body.imageName.trim() : "";

  const uploadedImage = await uploadImageFromUrlService({
    userId: String(userId),
    folderId,
    imageUrl,
    imageName: customName,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, uploadedImage, "Image uploaded successfully"));
});

const getImagesByFolder = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const folderId = String(req.params.folderId ?? "").trim();
  if (!folderId) {
    throw new ApiError(400, "folderId is required");
  }

  const images = await getImagesByFolderService({
    userId: String(userId),
    folderId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, images, "Images fetched successfully"));
});

const deleteImage = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const imageId = String(req.params.imageId ?? "").trim();
  if (!imageId) {
    throw new ApiError(400, "imageId is required");
  }

  const result = await deleteImageService({
    userId: String(userId),
    imageId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Image deleted successfully"));
});

const resolveImageByName = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const { name, folderId } = req.query as {
    name?: string;
    folderId?: string;
  };

  if (!name?.trim()) {
    throw new ApiError(400, "Image name is required");
  }

  const image = await resolveImageByNameService({
    userId: String(userId),
    imageName: name,
    folderId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, image, "Image resolved successfully"));
});

const deleteImageByName = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const { name, folderId } = req.body as {
    name?: string;
    folderId?: string;
  };

  if (!name?.trim()) {
    throw new ApiError(400, "Image name is required");
  }

  const result = await deleteImageByNameService({
    userId: String(userId),
    imageName: name,
    folderId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Image deleted successfully"));
});

export {
  deleteImage,
  deleteImageByName,
  getImagesByFolder,
  resolveImageByName,
  uploadImage,
  uploadImageFromUrl,
};
