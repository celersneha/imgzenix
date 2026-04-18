import { Router } from "express";
import {
  deleteCurrentUser,
  getCurrentUser,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verifyUserAuth } from "../middleware/user-auth.middleware.js";

const router = Router();

router.route("/get-current-user").get(verifyUserAuth, getCurrentUser);
router.route("/delete-account").delete(verifyJWT, deleteCurrentUser);

export default router;
