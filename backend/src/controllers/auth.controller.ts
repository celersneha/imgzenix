import { asyncHandler } from "../utils/async-handler.js";
import { ApiError } from "../utils/api-error.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { deleteFromCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/api-response.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// for generating access and refresh token
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    // console.log(user);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();
    // console.log(accessToken, refreshToken);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

//Registration of user logic
const registerUser = asyncHandler(async (req, res) => {
  const { Name, email, password } = req.body;
  console.log("email: ", email);

  if ([Name, email, password].some((field) => field?.trim() === "")) {
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
    .json(new ApiResponse(200, createdUser, "User registered successfully"));
});

//Login of user logic

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  if (!email) {
    throw new ApiError(401, "email is required");
  }

  const user = await User.findOne({
    email: email.toLowerCase(),
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }
  const isPasswordValid = user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "User credentials are invalid");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id,
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken",
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("AccessToken", accessToken, options)
    .cookie("RefreshToken", refreshToken, options)
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

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

// refresh access token logic
const refreshAccesToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies["RefreshToken"] || req.body["RefreshToken"];

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request");
    }
    console.log("incoming token: ", incomingRefreshToken);
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
    );
    // console.log(decodedToken);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    if (user?.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh Token is either expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };
    console.log("user", user);
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id,
    );
    console.log({ accessToken, refreshToken });
    return res
      .status(200)
      .cookie("AccessToken", accessToken, options)
      .cookie("RefreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: refreshToken },
          "Access Token refreshed successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "Invalid refresh token");
  }
});

export { registerUser, loginUser, logoutUser, refreshAccesToken };
