import mongoose, { Schema } from "mongoose";

export interface FolderDocument {
  name: string;
  userId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
  totalSize: number;
  createdAt: Date;
  updatedAt: Date;
}

const folderSchema = new Schema<FolderDocument>(
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

// Prevent duplicate folder names inside same parent for each user
folderSchema.index({ userId: 1, parentId: 1, name: 1 }, { unique: true });

export const Folder =
  (mongoose.models.Folder as mongoose.Model<FolderDocument>) ||
  mongoose.model<FolderDocument>("Folder", folderSchema);
