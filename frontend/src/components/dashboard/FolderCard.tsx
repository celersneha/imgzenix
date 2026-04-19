import { FolderOpen, MoreHorizontal, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { formatBytes, formatDate } from "@/lib/format";
import type { Folder } from "@/types/api";

interface FolderCardProps {
  folder: Folder;
  isDeleting?: boolean;
  onDelete: (folder: Folder) => void;
}

export function FolderCard({
  folder,
  isDeleting = false,
  onDelete,
}: FolderCardProps) {
  return (
    <article className="panel-surface flex h-full flex-col justify-between p-5">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-brand-soft p-3 text-brand">
              <FolderOpen className="size-5" />
            </div>
            <div>
              <h3 className="line-clamp-1 text-base font-semibold text-foreground">
                {folder.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                Updated {formatDate(folder.updatedAt)}
              </p>
            </div>
          </div>
          <MoreHorizontal className="mt-1 size-4 text-muted-foreground" />
        </div>

        <div className="rounded-2xl border border-border bg-background/70 p-3 text-sm text-muted-foreground">
          <p>{formatBytes(folder.totalSize)} stored</p>
          <p className="mt-1">Created {formatDate(folder.createdAt)}</p>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button asChild className="flex-1" type="button">
          <Link to={`/dashboard/${folder._id}`}>Open</Link>
        </Button>
        <Button
          disabled={isDeleting}
          onClick={() => onDelete(folder)}
          size="icon"
          type="button"
          variant="destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </article>
  );
}
