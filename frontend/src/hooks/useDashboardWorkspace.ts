import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectCurrentUser } from "@/redux/selectors/authSelectors";
import {
  selectCurrentFolder,
  selectFolderBreadcrumb,
  selectFolderDeleting,
  selectFolderError,
  selectFolderLoading,
  selectFolders,
} from "@/redux/selectors/folderSelectors";
import {
  selectDeletingImageId,
  selectImageError,
  selectImageLoading,
  selectImages,
  selectSelectedImage,
} from "@/redux/selectors/imageSelectors";
import {
  adjustCurrentFolderSize,
  deleteFolder,
  fetchFolderContent,
  fetchFolders,
} from "@/redux/slices/folderSlice";
import { deleteImage, setSelectedImage } from "@/redux/slices/imageSlice";
import type { BreadcrumbFolder, Folder, Image } from "@/types/api";

const makeBreadcrumbItem = (folder: Folder): BreadcrumbFolder => ({
  _id: folder._id,
  name: folder.name,
});

export function useDashboardWorkspace() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const folders = useAppSelector(selectFolders);
  const currentFolder = useAppSelector(selectCurrentFolder);
  const breadcrumb = useAppSelector(selectFolderBreadcrumb);
  const folderLoading = useAppSelector(selectFolderLoading);
  const folderError = useAppSelector(selectFolderError);
  const deletingFolderId = useAppSelector(selectFolderDeleting);
  const images = useAppSelector(selectImages);
  const imageLoading = useAppSelector(selectImageLoading);
  const imageError = useAppSelector(selectImageError);
  const deletingImageId = useAppSelector(selectDeletingImageId);
  const selectedImage = useAppSelector(selectSelectedImage);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    void dispatch(fetchFolders());
  }, [dispatch]);

  const handleOpenFolder = async (folder: Folder) => {
    const nextBreadcrumb = [...breadcrumb, makeBreadcrumbItem(folder)];
    await dispatch(
      fetchFolderContent({
        folderId: folder._id,
        breadcrumb: nextBreadcrumb,
      }),
    );
  };

  const handleGoToRoot = async () => {
    await dispatch(fetchFolders());
  };

  const handleBreadcrumbClick = async (index: number) => {
    const targetFolder = breadcrumb[index];

    if (!targetFolder) {
      return;
    }

    await dispatch(
      fetchFolderContent({
        folderId: targetFolder._id,
        breadcrumb: breadcrumb.slice(0, index + 1),
      }),
    );
  };

  const handleDeleteFolder = async (folder: Folder) => {
    const confirmed = window.confirm(
      `Delete "${folder.name}" and all nested content?`,
    );

    if (!confirmed) {
      return;
    }

    await dispatch(deleteFolder(folder._id));
  };

  const handleDeleteImage = async (image: Image) => {
    const confirmed = window.confirm(`Delete "${image.name}"?`);

    if (!confirmed) {
      return;
    }

    const resultAction = await dispatch(deleteImage(image._id));

    if (deleteImage.fulfilled.match(resultAction)) {
      dispatch(adjustCurrentFolderSize(-image.size));
    }
  };

  const handlePreviewImage = (image: Image) => {
    dispatch(setSelectedImage(image));
    setPreviewOpen(true);
  };

  const handlePreviewChange = (open: boolean) => {
    setPreviewOpen(open);

    if (!open) {
      dispatch(setSelectedImage(null));
    }
  };

  const isLoading = folderLoading || imageLoading;
  const surfaceTitle = currentFolder ? currentFolder.name : "Root workspace";
  const helperText = currentFolder
    ? "Manage subfolders and images together in one view."
    : "Create folders at the root, then open one to upload and manage images.";

  return {
    user,
    folders,
    currentFolder,
    breadcrumb,
    folderError,
    deletingFolderId,
    images,
    imageError,
    deletingImageId,
    selectedImage,
    previewOpen,
    isLoading,
    surfaceTitle,
    helperText,
    handleOpenFolder,
    handleGoToRoot,
    handleBreadcrumbClick,
    handleDeleteFolder,
    handleDeleteImage,
    handlePreviewImage,
    handlePreviewChange,
  };
}
