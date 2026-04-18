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
import { toast } from "sonner";

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

const maskApiKey = (value: string): string => {
  if (value.length <= 8) {
    return `${value.slice(0, 3)}***${value.slice(-2)}`;
  }

  return `${value.slice(0, 4)}${"*".repeat(Math.max(4, value.length - 6))}${value.slice(-2)}`;
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
  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    void dispatch(fetchApiKeys());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleCreate = async () => {
    const trimmedName = newKeyName.trim();

    if (!trimmedName) {
      toast.error("API key name is required");
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
      toast.success("API key created successfully.");
    } catch {
      // Redux handles stateful errors for this flow.
    }
  };

  const handleRevokeRequest = (keyId: string) => {
    setKeyToRevoke(keyId);
    setRevokeDialogOpen(true);
  };

  const handleRevokeConfirm = async () => {
    if (!keyToRevoke) {
      return;
    }

    const result = await dispatch(revokeApiKey(keyToRevoke));
    if (revokeApiKey.fulfilled.match(result)) {
      toast.success("API key revoked.");
    }

    setKeyToRevoke(null);
    setRevokeDialogOpen(false);
  };

  const handleRevokeDialogChange = (nextOpen: boolean) => {
    setRevokeDialogOpen(nextOpen);
    if (!nextOpen) {
      setKeyToRevoke(null);
    }
  };

  const handleCopyLatestKey = async () => {
    if (!latestKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(latestKey);
      toast.success("API key copied to clipboard.");
    } catch {
      toast.error("Could not copy automatically. Please copy manually.");
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
    maskedLatestKey: latestKey ? maskApiKey(latestKey) : null,
    hasActiveKeys,
    newKeyName,
    expiryDays,
    createDialogOpen,
    setNewKeyName,
    setExpiryDays,
    handleCreate,
    handleRevokeRequest,
    handleRevokeConfirm,
    handleRevokeDialogChange,
    handleCopyLatestKey,
    hideLatestKey,
    handleCreateDialogChange,
    revokeDialogOpen,
  };
}
