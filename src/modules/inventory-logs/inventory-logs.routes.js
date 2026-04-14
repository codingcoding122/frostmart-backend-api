import { Router } from "express";
import * as inventoryController from "./inventory-logs.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";

const router = Router();

router.use(authMiddleware, authorizeRoles(["admin"]));

router.get("/", inventoryController.getInventoryLogs);
router.post("/adjust", inventoryController.adjustInventory);

export default router;
