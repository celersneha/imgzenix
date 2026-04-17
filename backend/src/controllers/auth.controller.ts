import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import jwt from "jsonwebtoken";
import type {
  AuthTokens,
  JwtPayload,
  LoginBody,
  RefreshTokenBody,
  RegisterBody,
} from "../types/auth.types.js";
import handleRefreshToken from "../utils/refresh-token.js";

export const authCookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none" as const,
};

// for generating access and refresh token
export const generateAccessAndRefreshToken = async (
  userId: string,
): Promise<AuthTokens> => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      (error as Error)?.message ||
        "Something went wrong while generating tokens",
    );
  }
};

//Registration of user logic
const registerUser = asyncHandler(async (req, res) => {
  const { Name, email, password } = req.body as RegisterBody;

  if (!Name || !email || !password) {
    throw new ApiError(400, "All fields are required");
  }

  if ([Name, email, password].some((field) => field.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    email: email.toLowerCase(),
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  const user = await User.create({
    Name,
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }
  // console.log("res: ", res);
  return res
    .status(201)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

//Login of user logic

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body as LoginBody;

  if (!email) {
    throw new ApiError(400, "Email is required");
  }

  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "User credentials are invalid");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    String(user._id),
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );

  return res
    .status(200)
    .cookie("AccessToken", accessToken, authCookieOptions)
    .cookie("RefreshToken", refreshToken, authCookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully",
      ),
    );
});

//logout of user logic

const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user?._id) {
    throw new ApiError(401, "Unauthorized Request");
  }

  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    },
  );

  return res
    .status(200)
    .clearCookie("AccessToken", authCookieOptions)
    .clearCookie("RefreshToken", authCookieOptions)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// refresh access token logic
const refreshAccessToken = asyncHandler(async (req, res) => {
  const body = req.body as RefreshTokenBody;

  const incomingRefreshToken = req.cookies["RefreshToken"] || body.RefreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const { accessToken, refreshToken } =
    await handleRefreshToken(incomingRefreshToken);

  return res
    .status(200)
    .cookie("AccessToken", accessToken, authCookieOptions)
    .cookie("RefreshToken", refreshToken, authCookieOptions)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access Token refreshed successfully",
      ),
    );
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
