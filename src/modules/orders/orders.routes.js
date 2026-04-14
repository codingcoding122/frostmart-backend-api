import { Router } from "express";
import * as ordersController from "./orders.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";

const router = Router();

router.use(authMiddleware);

router.post("/checkout", ordersController.checkout);
router.get("/my", ordersController.getMyOrders);
router.get("/:id", ordersController.getOrderById);

router.get("/", authorizeRoles(["admin"]), ordersController.getAllOrders);
router.patch(
  "/:id/status",
  authorizeRoles(["admin"]),
  ordersController.updateOrderStatus,
);

export default router;
