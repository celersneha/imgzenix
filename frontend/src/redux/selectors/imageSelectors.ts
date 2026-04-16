import type { RootState } from "../store";

export const selectImageState = (state: RootState) => state.image;
export const selectImages = (state: RootState) => state.image.images;
export const selectSelectedImage = (state: RootState) =>
  state.image.selectedImage;
export const selectImageLoading = (state: RootState) => state.image.isLoading;
export const selectImageUploading = (state: RootState) =>
  state.image.isUploading;
export const selectDeletingImageId = (state: RootState) =>
  state.image.deletingImageId;
export const selectImageError = (state: RootState) => state.image.error;
