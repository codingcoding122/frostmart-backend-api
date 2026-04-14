import { db } from "../../config/db.config.js";

export const createOrder = async (client, userId, totalPrice, status = "pending") => {
  const { rows } = await client.query(
    `INSERT INTO orders(user_id, total_price, status)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, totalPrice, status],
  );

  return rows[0];
};

export const createOrderItem = async (
  client,
  orderId,
  productId,
  quantity,
  price,
) => {
  const { rows } = await client.query(
    `INSERT INTO order_items(order_id, product_id, quantity, price)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [orderId, productId, quantity, price],
  );

  return rows[0];
};

export const createTransaction = async (
  client,
  orderId,
  paymentMethod,
  paymentStatus = "pending",
) => {
  const { rows } = await client.query(
    `INSERT INTO transactions(order_id, payment_method, payment_status)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [orderId, paymentMethod, paymentStatus],
  );

  return rows[0];
};

export const getProductForUpdate = async (client, productId) => {
  const { rows } = await client.query(
    `SELECT id, name, price, stock
     FROM products
     WHERE id = $1
     FOR UPDATE`,
    [productId],
  );

  return rows[0];
};

export const reduceProductStock = async (client, productId, quantity) => {
  await client.query(`UPDATE products SET stock = stock - $1 WHERE id = $2`, [
    quantity,
    productId,
  ]);
};

export const insertInventoryLog = async (
  client,
  productId,
  changeType,
  quantity,
  description,
) => {
  await client.query(
    `INSERT INTO inventory_log(product_id, change_type, quantity, description)
     VALUES ($1, $2, $3, $4)`,
    [productId, changeType, quantity, description],
  );
};

export const getOrderById = async (id) => {
  const { rows } = await db.query(`SELECT * FROM orders WHERE id = $1`, [id]);
  return rows[0];
};

export const getTransactionByOrderId = async (orderId) => {
  const { rows } = await db.query(
    `SELECT id, order_id, payment_status
     FROM transactions
     WHERE order_id = $1`,
    [orderId],
  );

  return rows[0];
};

export const getOrderItems = async (orderId) => {
  const { rows } = await db.query(
    `SELECT oi.id, oi.product_id, p.name AS product_name, oi.quantity, oi.price
     FROM order_items oi
     JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = $1
     ORDER BY oi.id`,
    [orderId],
  );

  return rows;
};

export const getOrders = async () => {
  const { rows } = await db.query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.id DESC`,
  );

  return rows;
};

export const getOrdersByUserId = async (userId) => {
  const { rows } = await db.query(
    `SELECT *
     FROM orders
     WHERE user_id = $1
     ORDER BY id DESC`,
    [userId],
  );

  return rows;
};

export const updateOrderStatus = async (id, status) => {
  const { rows } = await db.query(
    `UPDATE orders
     SET status = $1
     WHERE id = $2
     RETURNING *`,
    [status, id],
  );

  return rows[0];
};
