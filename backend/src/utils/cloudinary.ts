import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DEFAULT_UPLOAD_TIMEOUT_MS = 45_000;
const resolvedTimeoutMs = Number(process.env.CLOUDINARY_UPLOAD_TIMEOUT_MS);
const cloudinaryUploadTimeoutMs = Number.isFinite(resolvedTimeoutMs)
  ? resolvedTimeoutMs
  : DEFAULT_UPLOAD_TIMEOUT_MS;

const uploadOnCloudinary = async (localFilePath: string) => {
  try {
    if (!localFilePath) return null;
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      folder: "imgzenix",
      resource_type: "auto",
      timeout: cloudinaryUploadTimeoutMs,
    });
    //file has been uploaded successfully
    // console.log("file is uploaded on cloudinary ", response.url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("Upload error:", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    return null;
  }
};

const uploadRemoteToCloudinary = async (remoteUrl: string) => {
  try {
    if (!remoteUrl?.trim()) return null;

    return await cloudinary.uploader.upload(remoteUrl.trim(), {
      folder: "imgzenix",
      resource_type: "auto",
      timeout: cloudinaryUploadTimeoutMs,
    });
  } catch (error) {
    console.log("Remote upload error:", error);
    return null;
  }
};

// Helper function to extract public_id from Cloudinary URL
const getPublicIdFromUrl = (url: string) => {
  // Assuming URL is like: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<file_extension>
  const parts = url.split("/");
  const fileName = parts[parts.length - 1]; // Get the last part, which is public_id with extension
  if (!fileName) {
    return null;
  }

  const publicId = fileName.split(".")[0]; // Remove the extension from file name
  return publicId || null;
};

const deleteFromCloudinary = async (publicIdOrUrl: string) => {
  try {
    if (!publicIdOrUrl) return null;
    const publicId = publicIdOrUrl.includes("/")
      ? getPublicIdFromUrl(publicIdOrUrl)
      : publicIdOrUrl;

    if (!publicId) {
      return null;
    }

    return await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });
  } catch (error) {
    console.log("Delete error:", error);
    return null;
  }
};

export { uploadOnCloudinary, uploadRemoteToCloudinary, deleteFromCloudinary };
