import { useEffect, useState } from "react";
import { useParams } from "react-router";
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
import { folderService } from "@/services/folder.service";

export function useDashboardWorkspace() {
  const dispatch = useAppDispatch();
  const params = useParams<{ folderId?: string }>();
  const folderIdParam = params.folderId?.trim() || null;
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

  const fetchBreadcrumbChain = async (
    targetFolderId: string,
  ): Promise<BreadcrumbFolder[]> => {
    const chain: BreadcrumbFolder[] = [];
    let nextFolderId: string | null = targetFolderId;

    while (nextFolderId) {
      const response = await folderService.getFolderContent(nextFolderId);
      const folder = response.data.data.currentFolder;

      if (!folder) {
        break;
      }

      chain.unshift({
        _id: folder._id,
        name: folder.name,
      });

      nextFolderId = folder.parentId;
    }

    return chain;
  };

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!folderIdParam) {
        await dispatch(fetchFolders());
        return;
      }

      const breadcrumbChain = await fetchBreadcrumbChain(folderIdParam);
      await dispatch(
        fetchFolderContent({
          folderId: folderIdParam,
          breadcrumb: breadcrumbChain,
        }),
      );
    };

    void loadWorkspace();
  }, [dispatch, folderIdParam]);

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
