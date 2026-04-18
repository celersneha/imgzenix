import { toast } from "sonner";
import { useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectFolderCreating } from "@/redux/selectors/folderSelectors";
import { createFolder } from "@/redux/slices/folderSlice";

export function useCreateFolderDialog(parentId: string | null) {
  const dispatch = useAppDispatch();
  const isCreating = useAppSelector(selectFolderCreating);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      toast.error("Folder name is required.");
      return;
    }

    try {
      await dispatch(createFolder({ name: trimmedName, parentId })).unwrap();
      setName("");
      setError(null);
      setOpen(false);
      toast.success("Folder created successfully.");
    } catch (submissionError) {
      const message =
        submissionError instanceof Error
          ? submissionError.message
          : String(submissionError);
      setError(message);
      toast.error(message);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setName("");
      setError(null);
    }
  };

  return {
    open,
    name,
    error,
    isCreating,
    setName,
    setOpen,
    handleSubmit,
    handleOpenChange,
  };
}
