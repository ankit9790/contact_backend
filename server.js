import express from "express";
import cors from "cors";
import customerRoute from "./routes/customerRoute.js";

const app = express();

// ✅ CORS CONFIG (Railway + Vite)
app.use(
  cors({
    origin: [
      "http://localhost:5173", // local Vite
      "https://your-frontend-domain.app", // add when deployed (Netlify/Vercel)
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// routes
app.use("/customers", customerRoute);

// server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
