import type { RootState } from "../store";

export const selectFolderState = (state: RootState) => state.folder;
export const selectFolders = (state: RootState) => state.folder.folders;
export const selectCurrentFolder = (state: RootState) =>
  state.folder.currentFolder;
export const selectFolderBreadcrumb = (state: RootState) =>
  state.folder.breadcrumb;
export const selectFolderLoading = (state: RootState) =>
  state.folder.isLoading;
export const selectFolderCreating = (state: RootState) =>
  state.folder.isCreating;
export const selectFolderDeleting = (state: RootState) =>
  state.folder.deletingFolderId;
export const selectFolderError = (state: RootState) => state.folder.error;
