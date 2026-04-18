import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCreateFolderDialog } from "@/hooks/useCreateFolderDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CreateFolderDialogProps {
  parentId?: string | null;
}

export function CreateFolderDialog({
  parentId = null,
}: CreateFolderDialogProps) {
  const {
    open,
    name,
    error,
    isCreating,
    setName,
    setOpen,
    handleSubmit,
    handleOpenChange,
  } = useCreateFolderDialog(parentId);

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <FolderPlus className="size-4" />
          New Folder
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a folder</DialogTitle>
          <DialogDescription>
            Add a new folder{" "}
            {parentId ? "inside the current location." : "at the root level."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">
              Folder name
            </span>
            <input
              className="form-field"
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void handleSubmit();
                }
              }}
              placeholder="Campaign assets"
              type="text"
              value={name}
            />
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button onClick={() => setOpen(false)} type="button" variant="ghost">
            Cancel
          </Button>
          <Button
            disabled={isCreating}
            onClick={() => void handleSubmit()}
            type="button"
          >
            {isCreating ? "Creating..." : "Create Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
