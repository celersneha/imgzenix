import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { ApiKeyDocument, ApiKeyScope } from "../models/api-key.model.js";
import { API_KEY_SCOPES } from "../models/api-key.model.js";
import { ApiError } from "./api-error.js";

const API_KEY_PREFIX = "dobby_";
const API_KEY_SECRET_BYTES = 32;
const DEFAULT_KEY_PREFIX_LENGTH = 12;

const getApiKeyPepper = (): string => {
  const pepper = process.env.API_KEY_PEPPER?.trim();
  if (!pepper) {
    throw new ApiError(500, "API_KEY_PEPPER is not configured");
  }

  return pepper;
};

export const hashApiKey = (rawApiKey: string): string => {
  return createHash("sha256")
    .update(`${rawApiKey}:${getApiKeyPepper()}`)
    .digest("hex");
};

export const verifyApiKeyHash = (
  rawApiKey: string,
  storedHash: string,
): boolean => {
  const incomingHash = hashApiKey(rawApiKey);
  const incomingBuffer = Buffer.from(incomingHash, "utf8");
  const storedBuffer = Buffer.from(storedHash, "utf8");

  if (incomingBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(incomingBuffer, storedBuffer);
};

export const createApiKeyMaterial = (): {
  rawApiKey: string;
  keyPrefix: string;
  keyHash: string;
} => {
  const secret = randomBytes(API_KEY_SECRET_BYTES).toString("hex");
  const rawApiKey = `${API_KEY_PREFIX}${secret}`;
  const keyPrefix = rawApiKey.slice(0, DEFAULT_KEY_PREFIX_LENGTH);

  return {
    rawApiKey,
    keyPrefix,
    keyHash: hashApiKey(rawApiKey),
  };
};

export const sanitizeApiKeyName = (name: string): string => {
  const trimmed = name?.trim();

  if (!trimmed) {
    throw new ApiError(400, "API key name is required");
  }

  if (trimmed.length > 80) {
    throw new ApiError(400, "API key name must be at most 80 characters");
  }

  return trimmed;
};

export const normalizeApiKeyScopes = (scopes?: string[]): ApiKeyScope[] => {
  if (!scopes || scopes.length === 0) {
    return [...API_KEY_SCOPES];
  }

  const uniqueScopes = Array.from(new Set(scopes.map((scope) => scope.trim())));

  if (
    uniqueScopes.some((scope) => !API_KEY_SCOPES.includes(scope as ApiKeyScope))
  ) {
    throw new ApiError(400, "One or more API key scopes are invalid");
  }

  return uniqueScopes as ApiKeyScope[];
};

export const parseApiKeyExpiry = (expiresAt?: string): Date | null => {
  if (!expiresAt) {
    return null;
  }

  const parsed = new Date(expiresAt);
  if (Number.isNaN(parsed.getTime())) {
    throw new ApiError(400, "expiresAt must be a valid ISO date");
  }

  if (parsed.getTime() <= Date.now()) {
    throw new ApiError(400, "expiresAt must be in the future");
  }

  return parsed;
};

export const toApiKeyResponse = (apiKey: ApiKeyDocument & { _id: unknown }) => {
  return {
    _id: String(apiKey._id),
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    scopes: apiKey.scopes,
    lastUsedAt: apiKey.lastUsedAt,
    expiresAt: apiKey.expiresAt,
    revokedAt: apiKey.revokedAt,
    createdAt: apiKey.createdAt,
    updatedAt: apiKey.updatedAt,
  };
};

export const extractApiKeyFromRequest = (req: {
  header: (name: string) => string | undefined;
}): string | null => {
  const xApiKey = req.header("x-api-key")?.trim();
  if (xApiKey) {
    return xApiKey;
  }

  const authHeader = req.header("authorization")?.trim();
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const bearerToken = authHeader.slice(7).trim();
  if (!bearerToken || bearerToken.includes(".")) {
    return null;
  }

  return bearerToken;
};
