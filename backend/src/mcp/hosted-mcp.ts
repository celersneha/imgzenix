import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Express, Request, Response } from "express";
import * as z from "zod/v4";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { extractApiKeyFromRequest } from "../utils/api-key.js";
import { resolveUserByApiKeyService } from "../services/api-key.service.js";
import {
  createFolderService,
  deleteFolderByNameService,
  deleteFolderService,
  getFolderContentService,
  getFoldersService,
  resolveFolderByNameService,
} from "../services/folder.service.js";
import {
  deleteImageByNameService,
  deleteImageService,
  getImagesByFolderService,
  resolveImageByNameService,
  uploadImageFromUrlService,
  uploadImageService,
} from "../services/image.service.js";

type SessionEntry = {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
  userId: string;
};

const sessions = new Map<string, SessionEntry>();

const getUserFromApiKey = async (req: Request) => {
  const rawApiKey = extractApiKeyFromRequest(req);
  if (!rawApiKey) {
    throw new Error("Unauthorized: API key is required");
  }

  const { user } = await resolveUserByApiKeyService({ rawApiKey });
  return user;
};

const resolveFolderIdForUser = async ({
  userId,
  folderId,
  folderName,
  parentId,
}: {
  userId: string;
  folderId?: string;
  folderName?: string;
  parentId?: string;
}): Promise<string> => {
  const trimmedFolderId = folderId?.trim();
  if (trimmedFolderId) {
    return trimmedFolderId;
  }

  const trimmedFolderName = folderName?.trim();
  if (!trimmedFolderName) {
    throw new Error("Either folderId or folderName is required");
  }

  const folder = await resolveFolderByNameService({
    userId,
    name: trimmedFolderName,
    parentId,
  });

  if (!folder?._id) {
    throw new Error("Failed to resolve folder by name");
  }

  return String(folder._id);
};

const buildUserScopedMcpServer = ({
  userId,
}: {
  userId: string;
}): McpServer => {
  const server = new McpServer({
    name: "imgzenix-hosted-mcp",
    version: "1.0.0",
  });

  server.registerTool(
    "createFolder",
    {
      description: "Create a folder for the authenticated user",
      inputSchema: {
        name: z.string().min(1).max(120),
        parentId: z.string().optional(),
      },
    },
    async ({ name, parentId }) => {
      try {
        const folder = await createFolderService({
          userId,
          name,
          parentId,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(folder, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Tool failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "getFolderContent",
    {
      description: "Get folders and images inside a specific folder",
      inputSchema: {
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ folderId, folderName, parentId }) => {
      try {
        const resolvedFolderId = await resolveFolderIdForUser({
          userId,
          folderId,
          folderName,
          parentId,
        });

        const content = await getFolderContentService({
          userId,
          folderId: resolvedFolderId,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(content, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Tool failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "listFolders",
    {
      description: "List folders under a parent folder",
      inputSchema: {
        parentId: z.string().optional(),
        page: z.number().int().positive().optional(),
        limit: z.number().int().positive().optional(),
      },
    },
    async ({ parentId, page, limit }) => {
      try {
        const result = await getFoldersService({
          userId,
          parentId,
          page,
          limit,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Tool failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "deleteFolder",
    {
      description: "Delete folder by id or by name",
      inputSchema: {
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ folderId, folderName, parentId }) => {
      try {
        const result = folderId?.trim()
          ? await deleteFolderService({ userId, folderId })
          : await deleteFolderByNameService({
              userId,
              name: folderName ?? "",
              parentId,
            });

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Tool failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "listImages",
    {
      description: "List images in a folder",
      inputSchema: {
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ folderId, folderName, parentId }) => {
      try {
        const resolvedFolderId = await resolveFolderIdForUser({
          userId,
          folderId,
          folderName,
          parentId,
        });

        const images = await getImagesByFolderService({
          userId,
          folderId: resolvedFolderId,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(images, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Tool failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "uploadImage",
    {
      description:
        "Upload an image from a local file path into a target folder for the authenticated user",
      inputSchema: {
        localFilePath: z.string().min(1),
        imageName: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ localFilePath, imageName, folderId, folderName, parentId }) => {
      try {
        const resolvedFolderId = await resolveFolderIdForUser({
          userId,
          folderId,
          folderName,
          parentId,
        });

        const image = await uploadImageService({
          userId,
          folderId: resolvedFolderId,
          localFilePath,
          originalName: path.basename(localFilePath),
          imageName,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(image, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Tool failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "uploadImageFromUrl",
    {
      description:
        "Upload an image from a public URL into a target folder for the authenticated user",
      inputSchema: {
        imageUrl: z.string().url(),
        imageName: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ imageUrl, imageName, folderId, folderName, parentId }) => {
      try {
        const resolvedFolderId = await resolveFolderIdForUser({
          userId,
          folderId,
          folderName,
          parentId,
        });

        const image = await uploadImageFromUrlService({
          userId,
          folderId: resolvedFolderId,
          imageUrl,
          imageName,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(image, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Tool failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "deleteImage",
    {
      description: "Delete image by id or by name",
      inputSchema: {
        imageId: z.string().optional(),
        imageName: z.string().optional(),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ imageId, imageName, folderId, folderName, parentId }) => {
      try {
        let result;

        if (imageId?.trim()) {
          result = await deleteImageService({ userId, imageId });
        } else {
          let scopedFolderId = folderId;
          if (!scopedFolderId && folderName?.trim()) {
            scopedFolderId = await resolveFolderIdForUser({
              userId,
              folderName,
              parentId,
            });
          }

          result = await deleteImageByNameService({
            userId,
            imageName: imageName ?? "",
            folderId: scopedFolderId,
          });
        }

        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Tool failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
            },
          ],
        };
      }
    },
  );

  server.registerTool(
    "resolveImageByName",
    {
      description: "Resolve image metadata by name",
      inputSchema: {
        imageName: z.string().min(1),
        folderId: z.string().optional(),
        folderName: z.string().optional(),
        parentId: z.string().optional(),
      },
    },
    async ({ imageName, folderId, folderName, parentId }) => {
      try {
        let scopedFolderId = folderId;
        if (!scopedFolderId && folderName?.trim()) {
          scopedFolderId = await resolveFolderIdForUser({
            userId,
            folderName,
            parentId,
          });
        }

        const image = await resolveImageByNameService({
          userId,
          imageName,
          folderId: scopedFolderId,
        });

        return {
          content: [{ type: "text", text: JSON.stringify(image, null, 2) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Tool failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
            },
          ],
        };
      }
    },
  );

  return server;
};

const writeJsonRpcError = (
  res: Response,
  statusCode: number,
  message: string,
) => {
  res.status(statusCode).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message,
    },
    id: null,
  });
};

export const registerHostedMcpRoutes = (app: Express) => {
  app.get("/mcp/health", (_req, res) => {
    res.status(200).json({ ok: true, sessions: sessions.size });
  });

  app.post("/mcp", async (req, res) => {
    try {
      const user = await getUserFromApiKey(req);
      const userId = String(user._id);

      const sessionIdHeader = req.headers["mcp-session-id"];
      const sessionId =
        typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;

      if (sessionId) {
        const existing = sessions.get(sessionId);
        if (!existing) {
          writeJsonRpcError(res, 400, "Invalid or expired MCP session ID");
          return;
        }

        if (existing.userId !== userId) {
          writeJsonRpcError(
            res,
            403,
            "Session does not belong to API key user",
          );
          return;
        }

        await existing.transport.handleRequest(req, res, req.body);
        return;
      }

      if (!isInitializeRequest(req.body)) {
        writeJsonRpcError(
          res,
          400,
          "No MCP session found. Send an initialize request first.",
        );
        return;
      }

      const server = buildUserScopedMcpServer({ userId });
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (generatedSessionId) => {
          sessions.set(generatedSessionId, {
            transport,
            server,
            userId,
          });
        },
      });

      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid) {
          sessions.delete(sid);
        }

        void server.close();
      };

      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal MCP server error";
      if (!res.headersSent) {
        writeJsonRpcError(
          res,
          message.toLowerCase().startsWith("unauthorized") ? 401 : 500,
          message,
        );
      }

      return;
    }
  });

  app.get("/mcp", async (req, res) => {
    try {
      const user = await getUserFromApiKey(req);
      const userId = String(user._id);

      const sessionIdHeader = req.headers["mcp-session-id"];
      const sessionId =
        typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;

      if (!sessionId) {
        res.status(400).send("Missing mcp-session-id header");
        return;
      }

      const existing = sessions.get(sessionId);
      if (!existing) {
        res.status(400).send("Invalid or expired MCP session ID");
        return;
      }

      if (existing.userId !== userId) {
        res.status(403).send("Session does not belong to API key user");
        return;
      }

      await existing.transport.handleRequest(req, res);
      return;
    } catch (error) {
      if (!res.headersSent) {
        res
          .status(
            error instanceof Error &&
              error.message.toLowerCase().startsWith("unauthorized")
              ? 401
              : 500,
          )
          .send(
            error instanceof Error
              ? error.message
              : "Internal MCP server error",
          );
      }

      return;
    }
  });

  app.delete("/mcp", async (req, res) => {
    try {
      const user = await getUserFromApiKey(req);
      const userId = String(user._id);

      const sessionIdHeader = req.headers["mcp-session-id"];
      const sessionId =
        typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;

      if (!sessionId) {
        res.status(400).send("Missing mcp-session-id header");
        return;
      }

      const existing = sessions.get(sessionId);
      if (!existing) {
        res.status(400).send("Invalid or expired MCP session ID");
        return;
      }

      if (existing.userId !== userId) {
        res.status(403).send("Session does not belong to API key user");
        return;
      }

      await existing.transport.handleRequest(req, res);
      return;
    } catch (error) {
      if (!res.headersSent) {
        res
          .status(
            error instanceof Error &&
              error.message.toLowerCase().startsWith("unauthorized")
              ? 401
              : 500,
          )
          .send(
            error instanceof Error
              ? error.message
              : "Internal MCP server error",
          );
      }

      return;
    }
  });
};
