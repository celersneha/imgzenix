import { useState } from "react";
import { ImageUp, UploadCloud } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { adjustCurrentFolderSize } from "@/redux/slices/folderSlice";
import { uploadImage } from "@/redux/slices/imageSlice";
import { selectImageUploading } from "@/redux/selectors/imageSelectors";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatBytes } from "@/lib/format";

interface ImageUploadDialogProps {
  folderId: string | null;
}

export function ImageUploadDialog({ folderId }: ImageUploadDialogProps) {
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
        uploadError instanceof Error ? uploadError.message : String(uploadError),
      );
    }
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setFile(null);
          setError(null);
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button disabled={!folderId} type="button">
          <ImageUp className="size-4" />
          Upload Image
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload an image</DialogTitle>
          <DialogDescription>
            Pick one file and it will be appended to the current folder without a refetch.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border bg-background/70 px-6 py-10 text-center">
            <div className="rounded-full bg-brand-soft p-4 text-brand">
              <UploadCloud className="size-6" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {file ? file.name : "Choose a JPG, PNG, WEBP, or GIF"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {file ? formatBytes(file.size) : "Click to browse your device"}
              </p>
            </div>
            <input
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null;
                setFile(nextFile);
                setError(null);
              }}
              type="file"
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button" variant="ghost">
            Cancel
          </Button>
          <Button disabled={!folderId || isUploading} onClick={() => void handleUpload()} type="button">
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
