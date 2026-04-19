import type { Response } from "express";

export const toToolSuccess = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

export const toToolError = (error: unknown) => ({
  isError: true,
  content: [
    {
      type: "text" as const,
      text: `Tool failed: ${error instanceof Error ? error.message : "Unexpected error"}`,
    },
  ],
});

export const handleTool = async <T>(run: () => Promise<T>) => {
  try {
    const data = await run();
    return toToolSuccess(data);
  } catch (error) {
    return toToolError(error);
  }
};

export const writeJsonRpcError = (
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
