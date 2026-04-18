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
import { toast } from "sonner";

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
  const [folderToDelete, setFolderToDelete] = useState<Folder | null>(null);
  const [imageToDelete, setImageToDelete] = useState<Image | null>(null);

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

  const handleDeleteFolderRequest = (folder: Folder) => {
    setFolderToDelete(folder);
  };

  const handleDeleteFolderConfirm = async () => {
    if (!folderToDelete) {
      return;
    }

    const target = folderToDelete;
    setFolderToDelete(null);

    const resultAction = await dispatch(deleteFolder(target._id));
    if (deleteFolder.fulfilled.match(resultAction)) {
      toast.success(`Folder "${target.name}" deleted.`);
    }
  };

  const handleDeleteFolderDialogChange = (open: boolean) => {
    if (!open) {
      setFolderToDelete(null);
    }
  };

  const handleDeleteImageRequest = (image: Image) => {
    setImageToDelete(image);
  };

  const handleDeleteImageConfirm = async () => {
    if (!imageToDelete) {
      return;
    }

    const target = imageToDelete;
    setImageToDelete(null);

    const resultAction = await dispatch(deleteImage(target._id));

    if (deleteImage.fulfilled.match(resultAction)) {
      dispatch(adjustCurrentFolderSize(-target.size));
      toast.success(`Image "${target.name}" deleted.`);
    }
  };

  const handleDeleteImageDialogChange = (open: boolean) => {
    if (!open) {
      setImageToDelete(null);
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

  useEffect(() => {
    if (folderError) {
      toast.error(folderError);
    }
  }, [folderError]);

  useEffect(() => {
    if (imageError) {
      toast.error(imageError);
    }
  }, [imageError]);

  return {
    user,
    folders,
    currentFolder,
    breadcrumb,
    deletingFolderId,
    images,
    deletingImageId,
    selectedImage,
    previewOpen,
    folderToDelete,
    imageToDelete,
    isLoading,
    surfaceTitle,
    helperText,
    handleOpenFolder,
    handleGoToRoot,
    handleBreadcrumbClick,
    handleDeleteFolderRequest,
    handleDeleteFolderConfirm,
    handleDeleteFolderDialogChange,
    handleDeleteImageRequest,
    handleDeleteImageConfirm,
    handleDeleteImageDialogChange,
    handlePreviewImage,
    handlePreviewChange,
  };
}
