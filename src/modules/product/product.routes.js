import { Router } from "express";
import * as productController from "./product.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";
import upload from "../../middleware/upload.middleware.js";
import { handleUploadError } from "../../middleware/handleUploadError.js";
import { cacheMiddleware } from "../../middleware/cache.middleware.js";

const router = Router();

// FOTO (lebih spesifik dulu)
router.post(
  "/photo/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  handleUploadError(upload.single("image")),
  productController.uploadPhoto,
);
router.put(
  "/photo/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  handleUploadError(upload.single("image")),
  productController.replacePhoto,
);
router.delete(
  "/photo/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  productController.deletePhoto,
);

// CREATE
router.post(
  "/",
  authMiddleware,
  authorizeRoles(["admin"]),
  productController.createProduct,
);

// UPDATE
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  productController.updateProduct,
);

// TANPA CACHE REDIS
// GET ALL
// router.get("/", productController.getProducts);
// GET BY ID
// router.get("/:id", productController.getProductById);

// PAKAI CACHE REDIS
// GET ALL
router.get("/", cacheMiddleware(60), productController.getProducts);

// GET BY ID
router.get("/:id", cacheMiddleware(60), productController.getProductById);

// DELETE
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  productController.deleteProduct,
);

export default router;
