import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccesToken,
} from "../controllers/auth.controller";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccesToken);

export default router;
