import { db } from "../../config/db.config.js";

export const findUserByEmail = async (email) => {
  const { rows } = await db.query("SELECT * FROM users WHERE email=$1", [email]);
  return rows[0];
};

export const findUserById = async (id) => {
  const { rows } = await db.query(
    "SELECT id,name,email,role FROM users WHERE id=$1",
    [id],
  );
  return rows[0];
};

export const createUser = async ({ name, email, password }) => {
  const { rows } = await db.query(
    `INSERT INTO users(name,email,password)
     VALUES($1,$2,$3) RETURNING *`,
    [name, email, password],
  );
  return rows[0];
};

// UPDATE USER
export const updateUser = async (id, data) => {
  const { name, email, password } = data;

  const { rows } = await db.query(
    `UPDATE users SET name = $1, email=COALESCE($2, email), password = COALESCE($3, password) WHERE id = $4 RETURNING id, name, email, role`,
    [name, email, password, id],
  );

  return rows[0];
};

export const updatePassword = async (id, password) => {
  await db.query("UPDATE users SET password=$1 WHERE id=$2", [password, id]);
};
