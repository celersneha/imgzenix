/**
 * @deprecated This file has been refactored into a tools folder structure.
 * Import from ./tools/index.js instead.
 *
 * Folder structure:
 * - tools/
 *   ├── index.ts (main export)
 *   ├── folder.ts (folder-related tools)
 *   ├── image.ts (image-related tools)
 *   └── helpers.ts (utility functions)
 */

export { buildUserScopedMcpServer } from "./tools/index.js";
export { registerFolderTools } from "./tools/index.js";
export { registerImageTools } from "./tools/index.js";
export {
  resolveFolderIdForUser,
  uploadImageViaMultipartApi,
} from "./tools/index.js";
