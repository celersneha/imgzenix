import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import {
  createApiKeyService,
  listApiKeysService,
  revokeApiKeyService,
} from "../services/api-key.service.js";

const listApiKeys = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const keys = await listApiKeysService({ userId: String(userId) });

  return res
    .status(200)
    .json(new ApiResponse(200, keys, "API keys fetched successfully"));
});

const createApiKey = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const { name, scopes, expiresAt } = req.body as {
    name?: string;
    scopes?: string[];
    expiresAt?: string;
  };

  const result = await createApiKeyService({
    userId: String(userId),
    name: name ?? "",
    scopes,
    expiresAt,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, result, "API key created successfully"));
});

const revokeApiKey = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized request");
  }

  const apiKeyId = String(req.params.id ?? "").trim();
  if (!apiKeyId) {
    throw new ApiError(400, "API key id is required");
  }

  const result = await revokeApiKeyService({
    userId: String(userId),
    apiKeyId,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, result, "API key revoked successfully"));
});

export { createApiKey, listApiKeys, revokeApiKey };
