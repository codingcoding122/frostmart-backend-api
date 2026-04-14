import { db } from "../../config/db.config.js";

export const getProductForUpdate = async (client, productId) => {
  const { rows } = await client.query(
    `SELECT id, name, stock FROM products WHERE id = $1 FOR UPDATE`,
    [productId],
  );
  return rows[0];
};

export const updateStock = async (client, productId, newStock) => {
  const { rows } = await client.query(
    `UPDATE products SET stock = $1 WHERE id = $2 RETURNING *`,
    [newStock, productId],
  );

  return rows[0];
};

export const insertInventoryLog = async (
  client,
  productId,
  changeType,
  quantity,
  description,
) => {
  const { rows } = await client.query(
    `INSERT INTO inventory_log(product_id, change_type, quantity, description)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [productId, changeType, quantity, description],
  );

  return rows[0];
};

export const getInventoryLogs = async (page, limit, productId) => {
  const offset = (page - 1) * limit;

  const { rows } = await db.query(
    `SELECT il.*, p.name AS product_name
     FROM inventory_log il
     JOIN products p ON p.id = il.product_id
     WHERE ($3::int IS NULL OR il.product_id = $3)
     ORDER BY il.id DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset, productId ?? null],
  );

  return rows;
};

export const getInventoryLogsPages = async (limit, productId) => {
  const { rows } = await db.query(
    `SELECT CEIL(COUNT(*)::decimal / $1) AS total_pages
     FROM inventory_log
     WHERE ($2::int IS NULL OR product_id = $2)`,
    [limit, productId ?? null],
  );

  return rows[0];
};
