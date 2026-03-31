import { db } from "./../../config/db.config.js";

export const createMenu = async (data) => {
  const { name, description, price } = data;
  const { rows } = await db.query(
    `INSERT INTO menus(name, description, price) VALUES($1, $2, $3) RETURNING *`,
    [name, description, price],
  );

  return rows[0];
};

export const updateMenu = async (id, data) => {
  const { name, description, price, is_available } = data;
  const { rows } = await db.query(
    `UPDATE menus SET name=$1, description=$2, price=$3, is_available=$4 WHERE id=$5 RETURNING *`,
    [name, description, price, is_available, id],
  );
  return rows[0];
};

export const getMenuById = async (id) => {
  const { rows } = await db.query(
    "SELECT * FROM menus WHERE id=$1 AND is_available=true",
    [id],
  );
  return rows[0];
};

export const getPages = async (limit) => {
  const { rows } = await db.query(
    `SELECT CEIL(COUNT(*)::decimal / $1) AS total_pages
     FROM menus
     WHERE is_deleted = false`,
    [limit],
  );
  return rows[0];
};

export const getMenus = async (page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  const { rows } = await db.query(
    "SELECT * FROM menus WHERE is_deleted=false ORDER BY id LIMIT $1 OFFSET $2",
    [limit, offset],
  );
  return rows;
};

export const deleteMenu = async (id) => {
  await db.query("UPDATE menus SET is_deleted=true WHERE id=$1", [id]);
};

export const updateMenuImage = async (id, image_url, image_path) => {
  await db.query(
    `UPDATE menus 
     SET image_url = $1, image_path = $2 
     WHERE id = $3`,
    [image_url, image_path, id],
  );
};

export const removeMenuImage = async (id) => {
  await db.query(
    `UPDATE menus 
     SET image_url = NULL, image_path = NULL 
     WHERE id = $1`,
    [id],
  );
};
