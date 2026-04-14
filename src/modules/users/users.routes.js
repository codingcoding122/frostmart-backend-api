import { Router } from "express";
import * as usersController from "./users.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { authorizeRoles } from "../../middleware/authorizeRoles.js";

const router = Router();

router.use(authMiddleware, authorizeRoles(["admin"]));

router.get("/", usersController.getUsers);
router.get("/:id", usersController.getUserById);
router.patch("/:id/role", usersController.updateUserRole);
router.delete("/:id", usersController.deleteUser);

export default router;
