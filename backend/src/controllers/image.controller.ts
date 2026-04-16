import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import {
  deleteImageService,
  getImagesByFolderService,
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

  const uploadedImage = await uploadImageService({
    userId: String(userId),
    folderId,
    localFilePath: filePath,
    originalName: req.file?.originalname ?? "uploaded-image",
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

export { deleteImage, getImagesByFolder, uploadImage };
