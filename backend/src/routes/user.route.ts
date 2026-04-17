import { Router } from "express";
import { getCurrentUser } from "../controllers/user.controller.js";
import { verifyUserAuth } from "../middleware/user-auth.middleware.js";

const router = Router();

router.route("/get-current-user").get(verifyUserAuth, getCurrentUser);

export default router;
