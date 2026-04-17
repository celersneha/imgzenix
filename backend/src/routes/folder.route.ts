import { Router } from "express";
import { verifyUserAuth } from "../middleware/user-auth.middleware.js";
import {
  createFolder,
  deleteFolder,
  deleteFolderByName,
  getFolderContent,
  getFolderContentByName,
  getFolders,
  resolveFolderByName,
} from "../controllers/folder.controller.js";

const router = Router();

router.use(verifyUserAuth);

router.route("/").post(createFolder).get(getFolders);
router.route("/resolve/by-name").get(resolveFolderByName);
router.route("/content/by-name").get(getFolderContentByName);
router.route("/by-name").delete(deleteFolderByName);
router.route("/:id/content").get(getFolderContent);
router.route("/:id").delete(deleteFolder);

export default router;
