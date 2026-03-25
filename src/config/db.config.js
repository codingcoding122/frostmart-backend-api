import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

// Membuat koneksi ke postgres dengan pooling
export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
});
