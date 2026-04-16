import { useEffect, useState } from "react";
import { ChevronRight, FolderRoot, LoaderCircle } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { CreateFolderDialog } from "@/components/dashboard/CreateFolderDialog";
import { FolderGrid } from "@/components/dashboard/FolderGrid";
import { ImageGrid } from "@/components/dashboard/ImageGrid";
import { ImagePreviewModal } from "@/components/dashboard/ImagePreviewModal";
import { ImageUploadDialog } from "@/components/dashboard/ImageUploadDialog";
import { formatBytes } from "@/lib/format";
import type { BreadcrumbFolder, Folder, Image } from "@/types/api";

const makeBreadcrumbItem = (folder: Folder): BreadcrumbFolder => ({
  _id: folder._id,
  name: folder.name,
});

export default function DashboardPage() {
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

  return (
    <section className="space-y-6">
      <header className="panel-surface overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <div className="soft-badge">Workspace for {user?.email}</div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                Drive Dashboard
              </h1>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {helperText}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <button
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1.5 transition-colors hover:bg-muted"
                onClick={() => void handleGoToRoot()}
                type="button"
              >
                <FolderRoot className="size-4" />
                Root
              </button>
              {breadcrumb.map((item, index) => (
                <div className="flex items-center gap-2" key={item._id}>
                  <ChevronRight className="size-4" />
                  <button
                    className="rounded-full px-3 py-1.5 transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => void handleBreadcrumbClick(index)}
                    type="button"
                  >
                    {item.name}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-background/75 p-4">
              <p className="text-sm text-muted-foreground">Current view</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {surfaceTitle}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-background/75 p-4">
              <p className="text-sm text-muted-foreground">Subfolders</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {folders.length}
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-background/75 p-4">
              <p className="text-sm text-muted-foreground">Images</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {images.length}
                {currentFolder
                  ? ` • ${formatBytes(currentFolder.totalSize)}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
      </header>

      {folderError || imageError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {folderError ?? imageError}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Folders and files
          </h2>
          <p className="text-sm text-muted-foreground">
            Browse folders, preview images, and mutate state instantly after
            upload or delete.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <CreateFolderDialog parentId={currentFolder?._id ?? null} />
          <ImageUploadDialog folderId={currentFolder?._id ?? null} />
        </div>
      </div>

      {isLoading ? (
        <div className="panel-surface flex min-h-64 items-center justify-center gap-3 p-8 text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
          Loading workspace content...
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Folders</h3>
              {!currentFolder ? (
                <Button
                  onClick={() => void handleGoToRoot()}
                  type="button"
                  variant="ghost"
                >
                  Refresh Root
                </Button>
              ) : null}
            </div>
            <FolderGrid
              deletingFolderId={deletingFolderId}
              folders={folders}
              onDeleteFolder={handleDeleteFolder}
              onOpenFolder={handleOpenFolder}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Images
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentFolder
                    ? `Uploads are scoped to ${currentFolder.name}.`
                    : "Open a folder to upload and manage images."}
                </p>
              </div>
            </div>
            {currentFolder ? (
              <ImageGrid
                deletingImageId={deletingImageId}
                images={images}
                onDeleteImage={handleDeleteImage}
                onPreviewImage={handlePreviewImage}
              />
            ) : (
              <div className="panel-surface flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
                <div className="rounded-full bg-muted p-4 text-muted-foreground">
                  <FolderRoot className="size-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Select a folder to view images
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    The upload endpoint requires a `folderId`, so images are
                    managed inside folders.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <ImagePreviewModal
        image={selectedImage}
        onOpenChange={handlePreviewChange}
        open={previewOpen}
      />
    </section>
  );
}
