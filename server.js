import express from "express";

import cors from "cors";
import customerRoute from "./routes/customerRoute.js";



const app = express();
app.use(cors());
app.use(express.json());

app.use("/customers", customerRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} 🚀`);
});
