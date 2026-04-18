import { Types } from "mongoose";
import { ApiKey } from "../models/api-key.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";
import {
  createApiKeyMaterial,
  decryptApiKey,
  encryptApiKey,
  normalizeApiKeyScopes,
  parseApiKeyExpiry,
  sanitizeApiKeyName,
  verifyApiKeyHash,
} from "../utils/api-key.js";

const createApiKeyService = async ({
  userId,
  name,
  scopes,
  expiresAt,
}: {
  userId: string;
  name: string;
  scopes?: string[];
  expiresAt?: string;
}) => {
  const sanitizedName = sanitizeApiKeyName(name);
  const normalizedScopes = normalizeApiKeyScopes(scopes);
  const parsedExpiry = parseApiKeyExpiry(expiresAt);
  const { rawApiKey, keyPrefix, keyHash } = createApiKeyMaterial();

  const created = await ApiKey.create({
    userId,
    name: sanitizedName,
    scopes: normalizedScopes,
    keyPrefix,
    keyHash,
    encryptedKey: encryptApiKey(rawApiKey),
    expiresAt: parsedExpiry,
    lastUsedAt: null,
    revokedAt: null,
  });

  return {
    apiKey: rawApiKey,
    metadata: {
      _id: String(created._id),
      name: created.name,
      keyPrefix: created.keyPrefix,
      scopes: created.scopes,
      lastUsedAt: created.lastUsedAt,
      expiresAt: created.expiresAt,
      revokedAt: created.revokedAt,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    },
  };
};

const revealApiKeyService = async ({
  userId,
  apiKeyId,
}: {
  userId: string;
  apiKeyId: string;
}) => {
  if (!Types.ObjectId.isValid(apiKeyId)) {
    throw new ApiError(400, "Invalid API key id");
  }

  const key = await ApiKey.findOne({
    _id: apiKeyId,
    userId,
  })
    .select("_id encryptedKey revokedAt expiresAt")
    .lean();

  if (!key) {
    throw new ApiError(404, "API key not found");
  }

  if (key.revokedAt) {
    throw new ApiError(400, "Cannot copy a revoked API key");
  }

  if (key.expiresAt && key.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(400, "Cannot copy an expired API key");
  }

  if (!key.encryptedKey?.trim()) {
    throw new ApiError(
      409,
      "This API key cannot be retrieved. Create a new key.",
    );
  }

  return {
    apiKey: decryptApiKey(key.encryptedKey),
  };
};

const listApiKeysService = async ({ userId }: { userId: string }) => {
  const keys = await ApiKey.find({ userId })
    .sort({ createdAt: -1 })
    .select(
      "name keyPrefix scopes lastUsedAt expiresAt revokedAt createdAt updatedAt",
    )
    .lean();

  return keys.map((key) => ({
    _id: String(key._id),
    name: key.name,
    keyPrefix: key.keyPrefix,
    scopes: key.scopes,
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expiresAt,
    revokedAt: key.revokedAt,
    createdAt: key.createdAt,
    updatedAt: key.updatedAt,
  }));
};

const revokeApiKeyService = async ({
  userId,
  apiKeyId,
}: {
  userId: string;
  apiKeyId: string;
}) => {
  if (!Types.ObjectId.isValid(apiKeyId)) {
    throw new ApiError(400, "Invalid API key id");
  }

  const key = await ApiKey.findOne({
    _id: apiKeyId,
    userId,
  });

  if (!key) {
    throw new ApiError(404, "API key not found");
  }

  if (!key.revokedAt) {
    key.revokedAt = new Date();
    await key.save({ validateBeforeSave: false });
  }

  return {
    _id: String(key._id),
    revokedAt: key.revokedAt,
  };
};

const resolveUserByApiKeyService = async ({
  rawApiKey,
}: {
  rawApiKey: string;
}) => {
  const candidates = await ApiKey.find({
    keyPrefix: rawApiKey.slice(0, 12),
    revokedAt: null,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  })
    .sort({ createdAt: -1 })
    .limit(5);

  const matchingKey = candidates.find((candidate) => {
    return verifyApiKeyHash(rawApiKey, candidate.keyHash);
  });

  if (!matchingKey) {
    throw new ApiError(401, "Invalid API key");
  }

  const user = await User.findById(matchingKey.userId).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(401, "API key user not found");
  }

  matchingKey.lastUsedAt = new Date();
  await matchingKey.save({ validateBeforeSave: false });

  return {
    user,
    apiKey: matchingKey,
  };
};

export {
  createApiKeyService,
  listApiKeysService,
  revealApiKeyService,
  resolveUserByApiKeyService,
  revokeApiKeyService,
};
