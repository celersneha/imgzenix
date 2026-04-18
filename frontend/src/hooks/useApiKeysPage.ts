import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectApiKeyError,
  selectApiKeyLoading,
  selectApiKeys,
  selectApiKeySubmitting,
  selectHasActiveApiKeys,
  selectLatestApiKey,
} from "@/redux/selectors/apiKeySelectors";
import {
  clearApiKeyError,
  clearLatestApiKey,
  createApiKey,
  fetchApiKeys,
  revokeApiKey,
} from "@/redux/slices/apiKeySlice";

const toIsoInDays = (days: number): string => {
  const now = Date.now();
  return new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
};

export const formatDate = (value: string | null): string => {
  if (!value) {
    return "-";
  }

  return new Date(value).toLocaleString();
};

export function useApiKeysPage() {
  const dispatch = useAppDispatch();
  const keys = useAppSelector(selectApiKeys);
  const isLoading = useAppSelector(selectApiKeyLoading);
  const isSubmitting = useAppSelector(selectApiKeySubmitting);
  const error = useAppSelector(selectApiKeyError);
  const latestKey = useAppSelector(selectLatestApiKey);
  const hasActiveKeys = useAppSelector(selectHasActiveApiKeys);

  const [newKeyName, setNewKeyName] = useState("");
  const [expiryDays, setExpiryDays] = useState<number>(90);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchApiKeys());
  }, [dispatch]);

  const handleCreate = async () => {
    const trimmedName = newKeyName.trim();

    if (!trimmedName) {
      setValidationError("API key name is required");
      return;
    }

    try {
      setValidationError(null);
      await dispatch(
        createApiKey({
          name: trimmedName,
          expiresAt: expiryDays > 0 ? toIsoInDays(expiryDays) : undefined,
        }),
      ).unwrap();

      setCreateDialogOpen(false);
      setNewKeyName("");
      setExpiryDays(90);
    } catch {
      // Redux handles stateful errors for this flow.
    }
  };

  const handleRevoke = async (keyId: string) => {
    const confirmed = window.confirm(
      "Revoke this API key? Existing Claude/MCP sessions using it will stop working.",
    );

    if (!confirmed) {
      return;
    }

    await dispatch(revokeApiKey(keyId));
  };

  const handleCopyLatestKey = async () => {
    if (!latestKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestKey);
      window.alert("API key copied to clipboard");
    } catch {
      window.alert("Could not copy automatically. Please copy manually.");
    }
  };

  const hideLatestKey = () => {
    dispatch(clearLatestApiKey());
  };

  const handleCreateDialogChange = (nextOpen: boolean) => {
    setCreateDialogOpen(nextOpen);
    if (!nextOpen) {
      setNewKeyName("");
      setExpiryDays(90);
      setValidationError(null);
      dispatch(clearApiKeyError());
    }
  };

  return {
    keys,
    isLoading,
    isSubmitting,
    error: validationError ?? error,
    latestKey,
    hasActiveKeys,
    newKeyName,
    expiryDays,
    createDialogOpen,
    setNewKeyName,
    setExpiryDays,
    handleCreate,
    handleRevoke,
    handleCopyLatestKey,
    hideLatestKey,
    handleCreateDialogChange,
  };
}
