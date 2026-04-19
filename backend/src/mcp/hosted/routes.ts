import type { Express } from "express";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { getUserFromApiKey } from "./auth.js";
import {
  createSessionTransport,
  getSessionById,
  getSessionCount,
} from "./sessions.js";
import { buildUserScopedMcpServer } from "./tools/index.js";
import { writeJsonRpcError } from "./tool-helpers.js";

const requireSessionForUser = ({
  sessionId,
  userId,
}: {
  sessionId?: string;
  userId: string;
}) => {
  if (!sessionId) {
    return {
      error: { statusCode: 400, message: "Missing mcp-session-id header" },
    };
  }

  const existing = getSessionById(sessionId);
  if (!existing) {
    return {
      error: { statusCode: 400, message: "Invalid or expired MCP session ID" },
    };
  }

  if (existing.userId !== userId) {
    return {
      error: {
        statusCode: 403,
        message: "Session does not belong to API key user",
      },
    };
  }

  return { existing };
};

export const registerHostedMcpRoutes = (app: Express) => {
  app.get("/mcp/health", (_req, res) => {
    res.status(200).json({ ok: true, sessions: getSessionCount() });
  });

  app.post("/mcp", async (req, res) => {
    try {
      const { user, rawApiKey } = await getUserFromApiKey(req);
      const userId = String(user._id);

      const sessionIdHeader = req.headers["mcp-session-id"];
      const sessionId =
        typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;

      if (sessionId) {
        const { existing, error } = requireSessionForUser({
          sessionId,
          userId,
        });
        if (error) {
          writeJsonRpcError(res, error.statusCode, error.message);
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

      const server = buildUserScopedMcpServer({ userId, rawApiKey });
      const transport = createSessionTransport({ userId, server });

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
      const { user } = await getUserFromApiKey(req);
      const userId = String(user._id);

      const sessionIdHeader = req.headers["mcp-session-id"];
      const sessionId =
        typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;

      const { existing, error } = requireSessionForUser({ sessionId, userId });
      if (error) {
        res.status(error.statusCode).send(error.message);
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
      const { user } = await getUserFromApiKey(req);
      const userId = String(user._id);

      const sessionIdHeader = req.headers["mcp-session-id"];
      const sessionId =
        typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;

      const { existing, error } = requireSessionForUser({ sessionId, userId });
      if (error) {
        res.status(error.statusCode).send(error.message);
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
