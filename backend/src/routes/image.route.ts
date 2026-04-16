import { Router } from "express";
import {
  deleteImage,
  getImagesByFolder,
  uploadImage,
} from "../controllers/image.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/upload").post(upload.single("file"), uploadImage);
router.route("/:folderId").get(getImagesByFolder);
router.route("/:imageId").delete(deleteImage);

export default router;
