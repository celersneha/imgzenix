import mongoose, { Schema } from "mongoose";

export const API_KEY_SCOPES = [
  "folders:read",
  "folders:write",
  "images:read",
  "images:write",
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

export interface ApiKeyDocument {
  userId: mongoose.Types.ObjectId;
  name: string;
  keyPrefix: string;
  keyHash: string;
  encryptedKey: string;
  scopes: ApiKeyScope[];
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const apiKeySchema = new Schema<ApiKeyDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    keyPrefix: {
      type: String,
      required: true,
      trim: true,
      maxlength: 16,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    encryptedKey: {
      type: String,
      required: true,
      trim: true,
    },
    scopes: {
      type: [String],
      enum: API_KEY_SCOPES,
      default: ["folders:read", "folders:write", "images:read", "images:write"],
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true },
);

apiKeySchema.index({ userId: 1, createdAt: -1 });

export const ApiKey =
  (mongoose.models.ApiKey as mongoose.Model<ApiKeyDocument>) ||
  mongoose.model<ApiKeyDocument>("ApiKey", apiKeySchema);
