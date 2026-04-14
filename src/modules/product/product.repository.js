import { db } from "./../../config/db.config.js";

export const createProduct = async (data) => {
  const { name, description, price, stock } = data;
  const { rows } = await db.query(
    `INSERT INTO products(name, description, price, stock)
     VALUES($1, $2, $3, $4) RETURNING *`,
    [name, description, price, stock],
  );

  return rows[0];
};

export const updateProduct = async (id, data) => {
  const { name, description, price, stock } = data;
  const { rows } = await db.query(
    `UPDATE products
     SET name=$1, description=$2, price=$3, stock=$4
     WHERE id=$5
     RETURNING *`,
    [name, description, price, stock, id],
  );
  return rows[0];
};

export const getProductById = async (id) => {
  const { rows } = await db.query("SELECT * FROM products WHERE id=$1", [id]);
  return rows[0];
};

export const getPages = async (limit, search = "") => {
  const normalizedSearch = search.trim();
  const searchPattern = `%${normalizedSearch}%`;

  const { rows } = await db.query(
    `SELECT CEIL(COUNT(*)::decimal / $1) AS total_pages
     FROM products
     WHERE ($2 = '' OR name ILIKE $3)`,
    [limit, normalizedSearch, searchPattern],
  );
  return rows[0];
};

export const getProducts = async (page = 1, limit = 20, search = "") => {
  const offset = (page - 1) * limit;
  const normalizedSearch = search.trim();
  const searchPattern = `%${normalizedSearch}%`;

  const { rows } = await db.query(
    `SELECT * FROM products
     WHERE ($3 = '' OR name ILIKE $4)
     ORDER BY id
     LIMIT $1 OFFSET $2`,
    [limit, offset, normalizedSearch, searchPattern],
  );
  return rows;
};

export const deleteProduct = async (id) => {
  await db.query("DELETE FROM products WHERE id=$1", [id]);
};
