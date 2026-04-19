import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { ApiError } from "./utils/api-error.js";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import folderRoutes from "./routes/folder.route.js";
import imageRoutes from "./routes/image.route.js";
import apiKeyRoutes from "./routes/api-key.route.js";
import { registerHostedMcpRoutes } from "./mcp/hosted/routes.js";

const app = express();
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:5173";
const defaultBodyLimit = process.env.REQUEST_BODY_LIMIT ?? "256kb";
const mcpBodyLimit = process.env.MCP_BODY_LIMIT ?? "15mb";
const allowedOrigins = corsOrigin
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
console.log("Allowed CORS origins:", allowedOrigins.join(", "));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-API-Key",
      "MCP-Session-Id",
      "Last-Event-ID",
    ],
    optionsSuccessStatus: 200,
  }),
);
app.use(cookieParser());
app.use("/mcp", express.json({ limit: mcpBodyLimit }));
app.use("/mcp", express.urlencoded({ extended: true, limit: mcpBodyLimit }));
app.use(express.json({ limit: defaultBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: defaultBodyLimit }));

app.use(express.static("public"));
//routes declaration
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/folder", folderRoutes);
app.use("/api/v1/image", imageRoutes);
app.use("/api/v1/api-keys", apiKeyRoutes);
registerHostedMcpRoutes(app);

app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const error =
      err instanceof ApiError
        ? err
        : new ApiError(500, (err as Error)?.message || "Internal Server Error");

    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.errors,
    });
  },
);

export { app };
