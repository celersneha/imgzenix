import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { folderService } from "@/services/folder.service";
import { HttpError } from "@/services/api-client";
import type {
  BreadcrumbFolder,
  CreateFolderRequest,
  Folder,
  FolderContent,
} from "@/types/api";

interface FolderState {
  folders: Folder[];
  currentFolder: Folder | null;
  breadcrumb: BreadcrumbFolder[];
  isLoading: boolean;
  isCreating: boolean;
  deletingFolderId: string | null;
  error: string | null;
}

interface FetchFolderContentArgs {
  folderId: string;
  breadcrumb?: BreadcrumbFolder[];
}

const initialState: FolderState = {
  folders: [],
  currentFolder: null,
  breadcrumb: [],
  isLoading: false,
  isCreating: false,
  deletingFolderId: null,
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

const sortFoldersByName = (folders: Folder[]) =>
  [...folders].sort((first, second) => first.name.localeCompare(second.name));

export const createFolder = createAsyncThunk<
  Folder,
  CreateFolderRequest,
  { rejectValue: string }
>("folder/createFolder", async (payload, { rejectWithValue }) => {
  try {
    const response = await folderService.createFolder(payload);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchFolders = createAsyncThunk<
  Folder[],
  { parentId?: string | null; page?: number; limit?: number } | undefined,
  { rejectValue: string }
>("folder/fetchFolders", async (params, { rejectWithValue }) => {
  try {
    const response = await folderService.getFolders(
      params?.parentId,
      params?.page,
      params?.limit,
    );
    return response.data.data.folders;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const fetchFolderContent = createAsyncThunk<
  FolderContent,
  FetchFolderContentArgs,
  { rejectValue: string }
>("folder/fetchFolderContent", async ({ folderId }, { rejectWithValue }) => {
  try {
    const response = await folderService.getFolderContent(folderId);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const deleteFolder = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("folder/deleteFolder", async (folderId, { rejectWithValue }) => {
  try {
    await folderService.deleteFolder(folderId);
    return folderId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const folderSlice = createSlice({
  name: "folder",
  initialState,
  reducers: {
    clearFolderError: (state) => {
      state.error = null;
    },
    setCurrentFolder: (state, action: PayloadAction<Folder | null>) => {
      state.currentFolder = action.payload;
    },
    setBreadcrumb: (state, action: PayloadAction<BreadcrumbFolder[]>) => {
      state.breadcrumb = action.payload;
    },
    goToRoot: (state) => {
      state.currentFolder = null;
      state.breadcrumb = [];
    },
    adjustCurrentFolderSize: (state, action: PayloadAction<number>) => {
      if (!state.currentFolder) {
        return;
      }

      state.currentFolder.totalSize = Math.max(
        0,
        state.currentFolder.totalSize + action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createFolder.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.isCreating = false;
        state.folders = sortFoldersByName([...state.folders, action.payload]);
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload ?? "Failed to create folder";
      })
      .addCase(fetchFolders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.folders = sortFoldersByName(action.payload);
        state.currentFolder = null;
        state.breadcrumb = [];
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch folders";
      })
      .addCase(fetchFolderContent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFolderContent.fulfilled, (state, action) => {
        state.isLoading = false;
        state.folders = sortFoldersByName(action.payload.folders);
        state.currentFolder = action.payload.currentFolder;
        state.breadcrumb =
          action.meta.arg.breadcrumb ??
          (action.payload.currentFolder
            ? [
                {
                  _id: action.payload.currentFolder._id,
                  name: action.payload.currentFolder.name,
                },
              ]
            : []);
      })
      .addCase(fetchFolderContent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to fetch folder content";
      })
      .addCase(deleteFolder.pending, (state, action) => {
        state.deletingFolderId = action.meta.arg;
        state.error = null;
      })
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.deletingFolderId = null;
        state.folders = state.folders.filter(
          (folder) => folder._id !== action.payload,
        );
      })
      .addCase(deleteFolder.rejected, (state, action) => {
        state.deletingFolderId = null;
        state.error = action.payload ?? "Failed to delete folder";
      });
  },
});

export const {
  adjustCurrentFolderSize,
  clearFolderError,
  goToRoot,
  setBreadcrumb,
  setCurrentFolder,
} = folderSlice.actions;
export default folderSlice.reducer;
