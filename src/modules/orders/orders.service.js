import * as ordersRepository from "./orders.repository.js";
import { db } from "../../config/db.config.js";
import { deleteCache } from "../../utils/cache.js";

const invalidateProductsCache = async () => {
  await deleteCache("cache:/api/products*");
};

const withItems = async (order) => {
  const items = await ordersRepository.getOrderItems(order.id);
  return { ...order, items };
};

export const checkout = async (userId, payload) => {
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    let totalPrice = 0;
    const preparedItems = [];

    for (const item of payload.items) {
      const product = await ordersRepository.getProductForUpdate(
        client,
        item.product_id,
      );

      if (!product) {
        throw new Error(`Product id ${item.product_id} not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product id ${item.product_id}`);
      }

      const linePrice = Number(product.price) * item.quantity;
      totalPrice += linePrice;

      preparedItems.push({
        product,
        quantity: item.quantity,
      });
    }

    const order = await ordersRepository.createOrder(client, userId, totalPrice);

    for (const item of preparedItems) {
      await ordersRepository.createOrderItem(
        client,
        order.id,
        item.product.id,
        item.quantity,
        item.product.price,
      );

      await ordersRepository.reduceProductStock(client, item.product.id, item.quantity);

      await ordersRepository.insertInventoryLog(
        client,
        item.product.id,
        "OUT",
        item.quantity,
        `Checkout order #${order.id} by user #${userId}`,
      );
    }

    const transaction = await ordersRepository.createTransaction(
      client,
      order.id,
      payload.payment_method,
      "pending",
    );

    await client.query("COMMIT");

    await invalidateProductsCache();

    return {
      order: await withItems(order),
      transaction,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getOrderById = async (id, requester) => {
  const order = await ordersRepository.getOrderById(id);
  if (!order) throw new Error("Order not found");

  const isAdmin = requester.role === "admin";
  const isOwner = order.user_id === requester.id;

  if (!isAdmin && !isOwner) {
    throw new Error("Forbidden");
  }

  return await withItems(order);
};

export const getMyOrders = async (userId) => {
  const orders = await ordersRepository.getOrdersByUserId(userId);
  return await Promise.all(orders.map(withItems));
};

export const getAllOrders = async () => {
  const orders = await ordersRepository.getOrders();
  return await Promise.all(orders.map(withItems));
};

export const updateOrderStatus = async (id, status) => {
  const existing = await ordersRepository.getOrderById(id);
  if (!existing) throw new Error("Order not found");

  if (["paid", "completed"].includes(status)) {
    const transaction = await ordersRepository.getTransactionByOrderId(id);

    if (!transaction) {
      throw new Error("Transaction not found for this order");
    }

    if (transaction.payment_status !== "paid") {
      throw new Error(
        "Order cannot be marked paid/completed while payment status is not paid",
      );
    }
  }

  return await ordersRepository.updateOrderStatus(id, status);
};
