import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectImageUploading } from "@/redux/selectors/imageSelectors";
import { adjustCurrentFolderSize } from "@/redux/slices/folderSlice";
import { uploadImage } from "@/redux/slices/imageSlice";

export function useImageUploadDialog(folderId: string | null) {
  const dispatch = useAppDispatch();
  const isUploading = useAppSelector(selectImageUploading);

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    if (!folderId) {
      setError("Open a folder before uploading an image.");
      return;
    }

    if (!file) {
      setError("Choose an image file to upload.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadedImage = await dispatch(
        uploadImage({ formData, folderId }),
      ).unwrap();

      dispatch(adjustCurrentFolderSize(uploadedImage.size));
      setFile(null);
      setError(null);
      setOpen(false);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : String(uploadError),
      );
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFile(null);
      setError(null);
    }
  };

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    setError(null);
  };

  return {
    open,
    file,
    error,
    isUploading,
    setOpen,
    handleUpload,
    handleOpenChange,
    handleFileChange,
  };
}
