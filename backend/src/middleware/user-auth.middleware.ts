import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import jwt from "jsonwebtoken";
import type { Request, Response } from "express";
import { User } from "../models/user.model.js";
import type { JwtPayload } from "../types/auth.types.js";
import { authCookieOptions } from "../controllers/auth.controller.js";
import handleRefreshToken from "../utils/refresh-token.js";
import { extractApiKeyFromRequest } from "../utils/api-key.js";
import { resolveUserByApiKeyService } from "../services/api-key.service.js";

const verifyJwtIfPresent = async (req: Request, res: Response) => {
  const authHeader = req.header("Authorization")?.replace("Bearer ", "").trim();
  const cookieToken = req.cookies?.["AccessToken"] as string | undefined;
  const jwtToken =
    cookieToken || (authHeader?.includes(".") ? authHeader : undefined);

  if (!jwtToken) {
    return false;
  }

  const accessSecret = process.env.ACCESS_TOKEN_SECRET;
  if (!accessSecret) {
    throw new ApiError(500, "ACCESS_TOKEN_SECRET is not configured");
  }

  let decodedToken: JwtPayload;

  try {
    decodedToken = jwt.verify(jwtToken, accessSecret) as JwtPayload;
  } catch (error: unknown) {
    const typedError = error as { name?: string };

    if (typedError.name === "TokenExpiredError") {
      const refreshToken = req.cookies?.["RefreshToken"] as string | undefined;

      if (!refreshToken) {
        throw new ApiError(401, "Refresh token missing");
      }

      const {
        user,
        accessToken,
        refreshToken: newRefreshToken,
      } = await handleRefreshToken(refreshToken);

      res
        .cookie("AccessToken", accessToken, authCookieOptions)
        .cookie("RefreshToken", newRefreshToken, authCookieOptions);

      req.user = user;
      req.authType = "jwt";
      return true;
    }

    throw new ApiError(401, "Invalid access token");
  }

  const user = await User.findById(decodedToken?._id).select(
    "-password -refreshToken",
  );

  if (!user) {
    throw new ApiError(401, "Invalid access token");
  }

  req.user = user;
  req.authType = "jwt";
  return true;
};

export const verifyUserAuth = asyncHandler(async (req, res, next) => {
  const usedJwt = await verifyJwtIfPresent(req, res);
  if (usedJwt) {
    return next();
  }

  const rawApiKey = extractApiKeyFromRequest(req);
  if (rawApiKey) {
    const { user, apiKey } = await resolveUserByApiKeyService({ rawApiKey });
    req.user = user;
    req.apiKey = apiKey;
    req.authType = "apiKey";
    return next();
  }

  throw new ApiError(401, "Unauthorized Request");
});
