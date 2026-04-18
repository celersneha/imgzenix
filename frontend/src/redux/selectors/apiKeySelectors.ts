import type { RootState } from "../store";

export const selectApiKeyState = (state: RootState) => state.apiKey;
export const selectApiKeys = (state: RootState) => state.apiKey.keys;
export const selectLatestApiKey = (state: RootState) => state.apiKey.latestKey;
export const selectApiKeyLoading = (state: RootState) => state.apiKey.isLoading;
export const selectApiKeySubmitting = (state: RootState) =>
  state.apiKey.isSubmitting;
export const selectApiKeyError = (state: RootState) => state.apiKey.error;
export const selectHasActiveApiKeys = (state: RootState) =>
  state.apiKey.keys.some((item) => !item.revokedAt);
