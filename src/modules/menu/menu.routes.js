import { Router } from "express";
import * as menuController from "./menu.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import upload from "../../middleware/upload.middleware.js";
import { handleUploadError } from "../../middleware/handleUploadError.js";
import { cacheMiddleware } from "../../middleware/cache.middleware.js";

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

// TANPA CACHE REDIS
// GET ALL
// router.get("/", menuController.getMenus);
// GET BY ID
// router.get("/:id", menuController.getMenuById);

// PAKAI CACHE REDIS
// GET ALL
router.get("/", cacheMiddleware(60), menuController.getMenus);

// GET BY ID
router.get("/:id", cacheMiddleware(60), menuController.getMenuById);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  menuController.deleteMenu,
);

export default router;
