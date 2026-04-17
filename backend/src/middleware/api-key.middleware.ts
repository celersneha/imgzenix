import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { extractApiKeyFromRequest } from "../utils/api-key.js";
import { resolveUserByApiKeyService } from "../services/api-key.service.js";

export const verifyApiKey = asyncHandler(async (req, _res, next) => {
  const rawApiKey = extractApiKeyFromRequest(req);

  if (!rawApiKey) {
    throw new ApiError(401, "API key is required");
  }

  const { user, apiKey } = await resolveUserByApiKeyService({ rawApiKey });
  req.user = user;
  req.apiKey = apiKey;
  req.authType = "apiKey";

  next();
});
