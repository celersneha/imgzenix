import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SessionEntry } from "./types.js";

const sessions = new Map<string, SessionEntry>();

export const getSessionCount = () => sessions.size;

export const getSessionById = (sessionId: string) => sessions.get(sessionId);

export const createSessionTransport = ({
  userId,
  server,
}: {
  userId: string;
  server: McpServer;
}) => {
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

  return transport;
};
