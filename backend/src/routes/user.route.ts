import { Router } from "express";
import { getCurrentUser } from "../controllers/user.controller";
import { verifyJWT } from "../middleware/auth.middleware";

const router = Router();

router.route("/get-current-user").get(verifyJWT, getCurrentUser);

export default router;
