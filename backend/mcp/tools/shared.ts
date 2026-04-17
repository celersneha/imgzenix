import axios, { AxiosError } from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import type { RawAxiosRequestHeaders } from "axios";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const apiBaseUrl =
  process.env.MCP_API_BASE_URL?.trim() || "http://localhost:8000/api/v1";

const getAuthHeader = (): string => {
  const token =
    process.env.MCP_API_KEY?.trim() || process.env.MCP_JWT_TOKEN?.trim();

  if (!token) {
    throw new Error("MCP_API_KEY is required");
  }

  return `Bearer ${token}`;
};

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const withToolErrorHandling = (
  fn: () => Promise<CallToolResult>,
): Promise<CallToolResult> => {
  return fn().catch((error: unknown) => {
    const message =
      error instanceof AxiosError
        ? (error.response?.data as { message?: string } | undefined)?.message ||
          error.message
        : error instanceof Error
          ? error.message
          : "Unexpected error";

    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Tool failed: ${message}`,
        },
      ],
    };
  });
};

export const toolSuccess = (
  data: unknown,
  message: string,
): CallToolResult => ({
  content: [
    {
      type: "text",
      text: `${message}\n${JSON.stringify(data, null, 2)}`,
    },
  ],
});

export const withAuth = (
  headers: RawAxiosRequestHeaders = {},
): RawAxiosRequestHeaders => {
  return {
    ...headers,
    Authorization: getAuthHeader(),
  };
};

export const buildUploadForm = (folderId: string, localFilePath: string) => {
  const absolutePath = path.resolve(localFilePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const form = new FormData();
  form.append("folderId", folderId);
  form.append("file", fs.createReadStream(absolutePath));

  return form;
};

export const resolveFolderId = async ({
  folderId,
  folderName,
  parentId,
}: {
  folderId?: string;
  folderName?: string;
  parentId?: string;
}): Promise<string> => {
  if (folderId?.trim()) {
    return folderId.trim();
  }

  if (!folderName?.trim()) {
    throw new Error("Either folderId or folderName is required");
  }

  const response = await apiClient.get("/folder/resolve/by-name", {
    params: {
      name: folderName,
      ...(parentId ? { parentId } : {}),
    },
    headers: withAuth(),
  });

  const resolvedId = String(response.data?.data?._id ?? "").trim();
  if (!resolvedId) {
    throw new Error("Failed to resolve folder id by name");
  }

  return resolvedId;
};

export type RegisterTool = (server: McpServer) => void;
