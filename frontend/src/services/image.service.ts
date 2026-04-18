import axiosInstance from "./axios-client";
import type { ApiResponse, Image } from "@/types/api";

export const imageService = {
  // Upload an image (expects FormData with file + folderId)
  uploadImage: (formData: FormData, folderId: string) => {
    formData.set("folderId", folderId);
    // imageName is already set in formData if provided
    return axiosInstance.post<ApiResponse<Image>>("/image/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  // Get images in a folder
  getImagesByFolder: (folderId: string) =>
    axiosInstance.get<ApiResponse<Image[]>>(`/image/${folderId}`),

  // Delete an image
  deleteImage: (imageId: string) =>
    axiosInstance.delete<ApiResponse<{ message: string }>>(`/image/${imageId}`),
};
