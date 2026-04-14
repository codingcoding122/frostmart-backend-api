import * as inventoryService from "./inventory-logs.service.js";
import {
  adjustInventorySchema,
  inventoryLogQuerySchema,
} from "./inventory-logs.validation.js";

export const adjustInventory = async (req, res) => {
  try {
    const payload = adjustInventorySchema.parse(req.body);
    const result = await inventoryService.adjustInventory(payload, req.user.id);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getInventoryLogs = async (req, res) => {
  try {
    const { page, limit, product_id } = inventoryLogQuerySchema.parse(req.query);
    const result = await inventoryService.getInventoryLogs(page, limit, product_id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
