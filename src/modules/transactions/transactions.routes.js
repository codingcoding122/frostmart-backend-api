import { Router } from "express";
import * as transactionsController from "./transactions.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";

const router = Router();

router.use(authMiddleware);

router.get("/my", transactionsController.getMyTransactions);
router.get("/:id", transactionsController.getTransactionById);

router.get("/", authorizeRoles(["admin"]), transactionsController.getTransactions);
router.patch(
  "/:id/status",
  authorizeRoles(["admin"]),
  transactionsController.updateTransactionStatus,
);

export default router;
