import { ImageUp, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useImageUploadDialog } from "@/hooks/useImageUploadDialog";
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
  const {
    open,
    file,
    error,
    isUploading,
    setOpen,
    handleUpload,
    handleOpenChange,
    handleFileChange,
  } = useImageUploadDialog(folderId);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
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
            Pick one file and it will be appended to the current folder without
            a refetch.
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
                handleFileChange(nextFile);
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
          <Button
            disabled={!folderId || isUploading}
            onClick={() => void handleUpload()}
            type="button"
          >
            {isUploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
