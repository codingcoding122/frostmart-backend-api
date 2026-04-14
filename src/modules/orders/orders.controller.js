import * as ordersService from "./orders.service.js";
import { createOrderSchema, updateOrderStatusSchema } from "./orders.validation.js";

export const checkout = async (req, res) => {
  try {
    const data = createOrderSchema.parse(req.body);
    const result = await ordersService.checkout(req.user.id, data);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const result = await ordersService.getMyOrders(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const result = await ordersService.getAllOrders();
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const result = await ordersService.getOrderById(id, req.user);
    res.json(result);
  } catch (error) {
    if (error.message === "Order not found") {
      return res.status(404).json({ message: error.message });
    }

    if (error.message === "Forbidden") {
      return res.status(403).json({ message: error.message });
    }

    res.status(400).json({ message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = updateOrderStatusSchema.parse(req.body);
    const result = await ordersService.updateOrderStatus(id, status);
    res.json(result);
  } catch (error) {
    if (error.message === "Order not found") {
      return res.status(404).json({ message: error.message });
    }

    res.status(400).json({ message: error.message });
  }
};
