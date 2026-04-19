import { FolderSearch } from "lucide-react";
import type { Folder } from "@/types/api";
import { FolderCard } from "./FolderCard";

interface FolderGridProps {
  folders: Folder[];
  deletingFolderId?: string | null;
  onDeleteFolder: (folder: Folder) => void;
}

export function FolderGrid({
  folders,
  deletingFolderId,
  onDeleteFolder,
}: FolderGridProps) {
  if (!folders.length) {
    return (
      <div className="panel-surface flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
        <div className="rounded-full bg-muted p-4 text-muted-foreground">
          <FolderSearch className="size-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            No folders yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Create a folder to start organizing campaign assets and uploads.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {folders.map((folder) => (
        <FolderCard
          folder={folder}
          isDeleting={deletingFolderId === folder._id}
          key={folder._id}
          onDelete={onDeleteFolder}
        />
      ))}
    </div>
  );
}
