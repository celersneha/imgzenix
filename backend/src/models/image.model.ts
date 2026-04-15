import mongoose, { Schema } from "mongoose";

const imageSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    url: {
      type: String,
      required: true,
    },

    publicId: {
      type: String,
      required: true, // needed for Cloudinary delete
    },

    size: {
      type: Number,
      required: true,
    },

    format: {
      type: String,
      required: true,
    },

    folderId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      required: true,
      index: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true },
);

// Useful index for fast fetching
imageSchema.index({ folderId: 1, userId: 1 });

export const Image =
  mongoose.models.Image || mongoose.model("Image", imageSchema);
