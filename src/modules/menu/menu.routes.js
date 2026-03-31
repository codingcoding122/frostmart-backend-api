import { Router } from "express";
import * as menuController from "./menu.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import upload from "../../middleware/upload.middleware.js";
import { handleUploadError } from "../../middleware/handleUploadError.js";

const router = Router();

// FOTO (lebih spesifik dulu)
router.post(
  "/photo/:id",
  handleUploadError(upload.single("image")),
  menuController.uploadPhoto,
);
router.put(
  "/photo/:id",
  handleUploadError(upload.single("image")),
  menuController.replacePhoto,
);
router.delete("/photo/:id", menuController.deletePhoto);

// CREATE
router.post(
  "/",
  authMiddleware,
  authorizeRoles(["admin"]),
  menuController.createMenu,
);

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  menuController.updateMenu,
);

// GET ALL
router.get("/", menuController.getMenus);

router.get("/:id", menuController.getMenuById);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  menuController.deleteMenu,
);

export default router;
