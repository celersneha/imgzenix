import { Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatBytes, formatDate } from "@/lib/format";
import type { Image } from "@/types/api";

interface ImagePreviewModalProps {
  image: Image | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImagePreviewModal({
  image,
  open,
  onOpenChange,
}: ImagePreviewModalProps) {
  if (!image) {
    return null;
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-4xl p-4 sm:p-6">
        <DialogHeader className="pr-10">
          <DialogTitle>{image.name}</DialogTitle>
          <DialogDescription>
            {formatBytes(image.size)} • {image.format.toUpperCase()} • Uploaded{" "}
            {formatDate(image.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-3xl border border-border bg-background/80">
          <img
            alt={image.name}
            className="max-h-[70vh] w-full object-contain"
            src={image.url}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button asChild type="button" variant="outline">
            <a href={image.url} rel="noreferrer" target="_blank">
              <ExternalLink className="size-4" />
              Open Original
            </a>
          </Button>
          <Button asChild type="button" variant="ghost">
            <a download href={image.url}>
              <Download className="size-4" />
              Download
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
