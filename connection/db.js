import dotenv from "dotenv";
dotenv.config(); // ✅ MUST be first

import pkg from "pg";
const { Pool } = pkg;

// ✅ Safety check
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

// ✅ Detect Neon (needs SSL)
const isNeon = process.env.DATABASE_URL.includes("neon.tech");

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isNeon ? { rejectUnauthorized: false } : false,
});

// ✅ Test connection
db.connect()
  .then(() => console.log("PostgreSQL Connected ✅"))
  .catch((err) =>
    console.error("PostgreSQL Connection Failed ❌", err.message)
  );
