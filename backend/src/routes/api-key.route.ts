import { Router } from "express";
import {
  copyApiKey,
  createApiKey,
  listApiKeys,
  revokeApiKey,
} from "../controllers/api-key.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.route("/").get(listApiKeys).post(createApiKey);
router.route("/:id/copy").post(copyApiKey);
router.route("/:id/revoke").post(revokeApiKey);

export default router;
