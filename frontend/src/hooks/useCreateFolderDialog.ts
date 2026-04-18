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
