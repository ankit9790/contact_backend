import dotenv from "dotenv";
import mysql from "mysql2";
// ✅ LOAD ENV HERE (CRITICAL FIX)
dotenv.config();

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.getConnection((err) => {
  if (err) console.log("DB Error:", err);
  else console.log("MySQL Connected ✅");
});
