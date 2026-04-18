import { toast } from "sonner";
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
  const [imageName, setImageName] = useState("");

  const handleUpload = async () => {
    if (!folderId) {
      toast.error("Open a folder before uploading an image.");
      return;
    }

    if (!file) {
      toast.error("Choose an image file to upload.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (imageName.trim()) {
        formData.append("imageName", imageName.trim());
      }

      const uploadedImage = await dispatch(
        uploadImage({ formData, folderId }),
      ).unwrap();

      dispatch(adjustCurrentFolderSize(uploadedImage.size));
      setFile(null);
      setImageName("");
      setError(null);
      setOpen(false);
      toast.success("Image uploaded successfully.");
    } catch (uploadError) {
      const message =
        uploadError instanceof Error
          ? uploadError.message
          : String(uploadError);
      setError(message);
      toast.error(message);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setFile(null);
      setImageName("");
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
    imageName,
    setImageName,
    handleUpload,
    handleOpenChange,
    handleFileChange,
  };
}
