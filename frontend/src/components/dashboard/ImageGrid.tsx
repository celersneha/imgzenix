import { ImageOff } from "lucide-react";
import type { Image } from "@/types/api";
import { ImageCard } from "./ImageCard";

interface ImageGridProps {
  images: Image[];
  deletingImageId?: string | null;
  onDeleteImage: (image: Image) => void;
  onPreviewImage: (image: Image) => void;
}

export function ImageGrid({
  images,
  deletingImageId,
  onDeleteImage,
  onPreviewImage,
}: ImageGridProps) {
  if (!images.length) {
    return (
      <div className="panel-surface flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-full bg-muted p-4 text-muted-foreground">
          <ImageOff className="size-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">No images here yet</h3>
          <p className="text-sm text-muted-foreground">
            Upload JPG, PNG, WEBP, or GIF assets into this folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {images.map((image) => (
        <ImageCard
          image={image}
          isDeleting={deletingImageId === image._id}
          key={image._id}
          onDelete={onDeleteImage}
          onPreview={onPreviewImage}
        />
      ))}
    </div>
  );
}
