import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { createFolder } from "@/redux/slices/folderSlice";
import { selectFolderCreating } from "@/redux/selectors/folderSelectors";
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

interface CreateFolderDialogProps {
  parentId?: string | null;
}

export function CreateFolderDialog({ parentId = null }: CreateFolderDialogProps) {
  const dispatch = useAppDispatch();
  const isCreating = useAppSelector(selectFolderCreating);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Folder name is required.");
      return;
    }

    try {
      await dispatch(createFolder({ name: trimmedName, parentId })).unwrap();
      setName("");
      setError(null);
      setOpen(false);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : String(submissionError),
      );
    }
  };

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setName("");
          setError(null);
        }
      }}
      open={open}
    >
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
            Add a new folder {parentId ? "inside the current location." : "at the root level."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-foreground">Folder name</span>
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
          <Button disabled={isCreating} onClick={() => void handleSubmit()} type="button">
            {isCreating ? "Creating..." : "Create Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
