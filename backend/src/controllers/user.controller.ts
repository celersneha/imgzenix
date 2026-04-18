import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { authCookieOptions } from "./auth.controller.js";
import { deleteCurrentUserService } from "../services/user.service.js";

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

const deleteCurrentUser = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized Request");
  }

  const result = await deleteCurrentUserService({
    userId: String(userId),
  });

  return res
    .status(200)
    .clearCookie("AccessToken", authCookieOptions)
    .clearCookie("RefreshToken", authCookieOptions)
    .json(new ApiResponse(200, result, "User deleted successfully"));
});

export { deleteCurrentUser, getCurrentUser };
