import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { apiKeysService } from "@/services/api-keys.service";
import { HttpError } from "@/services/api-client";
import type { ApiKeyRecord, CreateApiKeyResponse } from "@/types/api";

interface ApiKeyState {
  keys: ApiKeyRecord[];
  latestKey: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
}

const initialState: ApiKeyState = {
  keys: [],
  latestKey: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof HttpError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
};

export const fetchApiKeys = createAsyncThunk<
  ApiKeyRecord[],
  void,
  { rejectValue: string }
>("apiKey/fetchApiKeys", async (_, { rejectWithValue }) => {
  try {
    const response = await apiKeysService.list();
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const createApiKey = createAsyncThunk<
  CreateApiKeyResponse,
  { name: string; expiresAt?: string },
  { rejectValue: string }
>("apiKey/createApiKey", async (payload, { rejectWithValue }) => {
  try {
    const response = await apiKeysService.create(payload);
    return response.data.data;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const revokeApiKey = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("apiKey/revokeApiKey", async (keyId, { rejectWithValue }) => {
  try {
    await apiKeysService.revoke(keyId);
    return keyId;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const apiKeySlice = createSlice({
  name: "apiKey",
  initialState,
  reducers: {
    clearApiKeyError: (state) => {
      state.error = null;
    },
    clearLatestApiKey: (state) => {
      state.latestKey = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApiKeys.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApiKeys.fulfilled, (state, action) => {
        state.isLoading = false;
        state.keys = action.payload;
      })
      .addCase(fetchApiKeys.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? "Failed to load API keys";
      })
      .addCase(createApiKey.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createApiKey.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.latestKey = action.payload.apiKey;
        state.keys.unshift(action.payload.metadata);
      })
      .addCase(createApiKey.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload ?? "Failed to create API key";
      })
      .addCase(revokeApiKey.pending, (state) => {
        state.error = null;
      })
      .addCase(revokeApiKey.fulfilled, (state, action) => {
        state.keys = state.keys.map((item) => {
          if (item._id !== action.payload) {
            return item;
          }

          return {
            ...item,
            revokedAt: new Date().toISOString(),
          };
        });
      })
      .addCase(revokeApiKey.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to revoke API key";
      });
  },
});

export const { clearApiKeyError, clearLatestApiKey } = apiKeySlice.actions;
export default apiKeySlice.reducer;
