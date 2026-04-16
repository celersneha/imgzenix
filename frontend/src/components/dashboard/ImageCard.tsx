import { Eye, Image as ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDate } from "@/lib/format";
import type { Image } from "@/types/api";

interface ImageCardProps {
  image: Image;
  isDeleting?: boolean;
  onDelete: (image: Image) => void;
  onPreview: (image: Image) => void;
}

export function ImageCard({
  image,
  isDeleting = false,
  onDelete,
  onPreview,
}: ImageCardProps) {
  return (
    <article className="panel-surface overflow-hidden p-0">
      <button
        className="group relative block aspect-[4/3] w-full overflow-hidden bg-muted"
        onClick={() => onPreview(image)}
        type="button"
      >
        <img
          alt={image.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          loading="lazy"
          src={image.url}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" />
      </button>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 font-semibold text-foreground">{image.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatBytes(image.size)} • {image.format.toUpperCase()}
            </p>
          </div>
          <div className="rounded-full bg-muted p-2 text-muted-foreground">
            <ImageIcon className="size-4" />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Uploaded {formatDate(image.createdAt)}
        </p>

        <div className="flex gap-2">
          <Button onClick={() => onPreview(image)} type="button" variant="outline">
            <Eye className="size-4" />
            Preview
          </Button>
          <Button
            disabled={isDeleting}
            onClick={() => onDelete(image)}
            type="button"
            variant="destructive"
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        </div>
      </div>
    </article>
  );
}
