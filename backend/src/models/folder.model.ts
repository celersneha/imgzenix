import mongoose, { Schema } from "mongoose";

const folderSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Folder name is required"],
      trim: true,
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true,
    },

    // optional but useful (performance boost 🚀)
    totalSize: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

// Compound index (🔥 important for queries)
folderSchema.index({ userId: 1, parentId: 1 });

// Prevent duplicate folder names inside same parent
folderSchema.index({ name: 1, parentId: 1, userId: 1 }, { unique: true });

export const Folder =
  mongoose.models.Folder || mongoose.model("Folder", folderSchema);
