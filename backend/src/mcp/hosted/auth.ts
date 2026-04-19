import type { Request } from "express";
import { extractApiKeyFromRequest } from "../../utils/api-key.js";
import { resolveUserByApiKeyService } from "../../services/api-key.service.js";

export const getUserFromApiKey = async (req: Request) => {
  const rawApiKey = extractApiKeyFromRequest(req);
  if (!rawApiKey) {
    throw new Error("Unauthorized: API key is required");
  }

  const { user } = await resolveUserByApiKeyService({ rawApiKey });
  return { user, rawApiKey };
};
