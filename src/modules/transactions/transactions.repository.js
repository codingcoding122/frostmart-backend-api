import { db } from "../../config/db.config.js";

export const getTransactions = async () => {
  const { rows } = await db.query(
    `SELECT t.*, o.user_id, o.total_price, o.status AS order_status
     FROM transactions t
     JOIN orders o ON o.id = t.order_id
     ORDER BY t.id DESC`,
  );

  return rows;
};

export const getTransactionsByUserId = async (userId) => {
  const { rows } = await db.query(
    `SELECT t.*, o.user_id, o.total_price, o.status AS order_status
     FROM transactions t
     JOIN orders o ON o.id = t.order_id
     WHERE o.user_id = $1
     ORDER BY t.id DESC`,
    [userId],
  );

  return rows;
};

export const getTransactionById = async (id) => {
  const { rows } = await db.query(
    `SELECT t.*, o.user_id, o.total_price, o.status AS order_status
     FROM transactions t
     JOIN orders o ON o.id = t.order_id
     WHERE t.id = $1`,
    [id],
  );

  return rows[0];
};

export const updateTransactionStatus = async (id, paymentStatus) => {
  const { rows } = await db.query(
    `UPDATE transactions
     SET payment_status = $1
     WHERE id = $2
     RETURNING *`,
    [paymentStatus, id],
  );

  return rows[0];
};
