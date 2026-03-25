import { Router } from "express";
import * as menuController from "./menu.controller.js";

const router = Router();

// CREATE NEW MENU
router.post("/", menuController.createMenu);

// UPDATE MENU BY ID
router.put("/:id", menuController.updateMenu);

// GET ALL MENU PAGINATED
router.get("/", menuController.getMenus);

// GET MENU BY ID
router.get("/:id", menuController.getMenuById);

router.delete("/:id", menuController.deleteMenu);

export default router;
