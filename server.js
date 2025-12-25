import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import customerRoute from "./routes/customerRoute.js";

const app = express();

/* =========================
   ✅ CORS CONFIG (SAFE)
   ========================= */
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local Vite
      process.env.FRONTEND_URL, // production frontend (Netlify/Vercel)
    ].filter(Boolean), // remove undefined
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

/* =========================
   MIDDLEWARES
   ========================= */
app.use(express.json());

/* =========================
   ROUTES
   ========================= */
app.use("/customers", customerRoute);

/* =========================
   HEALTH CHECK (IMPORTANT)
   ========================= */
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Contact Backend API is running 🚀",
  });
});

/* =========================
   SERVER
   ========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
