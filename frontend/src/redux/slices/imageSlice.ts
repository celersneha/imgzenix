import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { imageService } from "@/services/image.service";
import { HttpError } from "@/services/api-client";
import { fetchFolderContent, fetchFolders } from "./folderSlice";
import type { Image } from "@/types/api";

interface ImageState {
  images: Image[];
  selectedImage: Image | null;
  isLoading: boolean;
  isUploading: boolean;
  deletingImageId: string | null;
  error: string | null;
}

const initialState: ImageState = {
  images: [],
  selectedImage: null,
  isLoading: false,
  isUploading: false,
  deletingImageId: null,
  error: null,
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof HttpError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong";
};

export const uploadImage = createAsyncThunk<
  Image,
  { formData: FormData; folderId: string },
  { rejectValue: string }
>("image/uploadImage", async ({ formData, folderId }, { rejectWithValue }) => {
  try {
    const response = await imageService.uploadImage(formData, folderId);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchImagesByFolder = createAsyncThunk<
  Image[],
  string,
  { rejectValue: string }
>("image/fetchImagesByFolder", async (folderId, { rejectWithValue }) => {
  try {
    const response = await imageService.getImagesByFolder(folderId);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const deleteImage = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("image/deleteImage", async (imageId, { rejectWithValue }) => {
  try {
    await imageService.deleteImage(imageId);
    return imageId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const imageSlice = createSlice({
  name: "image",
  initialState,
  reducers: {
    clearImageError: (state) => {
      state.error = null;
    },
    setSelectedImage: (state, action: PayloadAction<Image | null>) => {
      state.selectedImage = action.payload;
    },
    resetImages: (state) => {
      state.images = [];
      state.selectedImage = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(uploadImage.pending, (state) => {
        state.isUploading = true;
        state.error = null;
      })
      .addCase(uploadImage.fulfilled, (state, action) => {
        state.isUploading = false;
        state.images.unshift(action.payload);
      })
      .addCase(uploadImage.rejected, (state, action) => {
        state.isUploading = false;
        state.error = action.payload ?? "Failed to upload image";
      })
      .addCase(fetchImagesByFolder.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchImagesByFolder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.images = action.payload;
      })
      .addCase(fetchImagesByFolder.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch images";
      })
      .addCase(deleteImage.pending, (state, action) => {
        state.deletingImageId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteImage.fulfilled, (state, action) => {
        state.deletingImageId = null;
        state.images = state.images.filter((image) => image._id !== action.payload);
        if (state.selectedImage?._id === action.payload) {
          state.selectedImage = null;
        }
      })
      .addCase(deleteImage.rejected, (state, action) => {
        state.deletingImageId = null;
        state.error = action.payload ?? "Failed to delete image";
      })
      .addCase(fetchFolderContent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFolderContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.images = action.payload.images;
        state.selectedImage = null;
      })
      .addCase(fetchFolderContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch images";
      })
      .addCase(fetchFolders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state) => {
        state.isLoading = false;
        state.images = [];
        state.selectedImage = null;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch root folders";
      });
  },
});

export const { clearImageError, resetImages, setSelectedImage } =
  imageSlice.actions;
export default imageSlice.reducer;
