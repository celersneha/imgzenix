export interface ApiResponse<T> {
  statusCode: number;
  data: T;
  message: string;
  success: boolean;
}

export interface User {
  _id: string;
  Name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  Name: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginData extends AuthTokens {
  user: User;
}

// Folder types
export interface Folder {
  _id: string;
  name: string;
  userId: string;
  parentId: string | null;
  totalSize: number;
  createdAt: string;
  updatedAt: string;
}

export interface BreadcrumbFolder {
  _id: string;
  name: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string | null;
}

// Image types
export interface Image {
  _id: string;
  name: string;
  url: string;
  publicId: string;
  size: number;
  format: string;
  folderId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Folder content response (GET /api/folder/:id/content)
export interface FolderContent {
  folders: Folder[];
  images: Image[];
  currentFolder: Folder | null;
}

// Pagination support
export interface PaginatedFolders {
  folders: Folder[];
  page: number;
  limit: number;
  total: number;
}

export interface DeleteFolderResult {
  deletedFolders: number;
  deletedImages: number;
  freedSize: number;
  failedCloudinaryDeletes: number;
}

export interface ApiKeyRecord {
  _id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApiKeyResponse {
  apiKey: string;
  metadata: ApiKeyRecord;
}
