import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use(express.static("public"));

//routes import
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
//routes declaration
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
export { app };
