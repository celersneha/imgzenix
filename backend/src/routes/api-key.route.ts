import { Router } from "express";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "../controllers/api-key.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.route("/").get(listApiKeys).post(createApiKey);
router.route("/:id/revoke").post(revokeApiKey);

export default router;
