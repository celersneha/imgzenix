import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  createFolder,
  deleteFolder,
  getFolderContent,
  getFolders,
} from "../controllers/folder.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createFolder).get(getFolders);
router.route("/:id/content").get(getFolderContent);
router.route("/:id").delete(deleteFolder);

export default router;
