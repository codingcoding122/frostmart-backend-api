import { Router } from "express";
import * as menuController from "./menu.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";

const router = Router();

// CREATE NEW MENU
router.post(
  "/",
  authMiddleware,
  authorizeRoles(["admin"]),
  menuController.createMenu,
);

// UPDATE MENU BY ID
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  menuController.updateMenu,
);

// GET ALL MENU PAGINATED
router.get("/", menuController.getMenus);

// GET MENU BY ID
router.get("/:id", menuController.getMenuById);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles(["admin"]),
  menuController.deleteMenu,
);

export default router;
