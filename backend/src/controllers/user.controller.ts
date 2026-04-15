import { ApiResponse } from "../utils/api-response";
import { asyncHandler } from "../utils/async-handler.js";

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

export { getCurrentUser };
