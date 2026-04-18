import { apiRequest } from "./api-client";
import type {
  ApiKeyRecord,
  ApiResponse,
  CopyApiKeyResponse,
  CreateApiKeyResponse,
} from "@/types/api";

export const apiKeysService = {
  list: () => apiRequest<ApiResponse<ApiKeyRecord[]>>("/api-keys"),

  create: (payload: { name: string; expiresAt?: string }) =>
    apiRequest<ApiResponse<CreateApiKeyResponse>>("/api-keys", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  copy: (id: string) =>
    apiRequest<ApiResponse<CopyApiKeyResponse>>(`/api-keys/${id}/copy`, {
      method: "POST",
    }),

  revoke: (id: string) =>
    apiRequest<ApiResponse<{ _id: string; revokedAt: string }>>(
      `/api-keys/${id}/revoke`,
      {
        method: "POST",
      },
    ),
};
