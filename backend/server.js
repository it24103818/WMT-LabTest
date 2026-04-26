import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import itemRoutes from "./routes/itemRoutes.js";
import { runtimeStore } from "./utils/runtimeStore.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Item Manager API is running..." });
});

app.use("/api/items", itemRoutes);

const PORT = process.env.PORT || 5000;

const startServer = () => {
  app.listen(PORT, () => {
    const mode = runtimeStore.useLocalStore ? "local JSON store" : "MongoDB";
    console.log(`Server running on port ${PORT} (${mode})`);
  });
};

if (!process.env.MONGO_URI) {
  runtimeStore.useLocalStore = true;
  console.warn("MONGO_URI is not set. Starting in local JSON store mode.");
  startServer();
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      runtimeStore.useLocalStore = false;
      console.log("MongoDB connected");
      startServer();
    })
    .catch((error) => {
      runtimeStore.useLocalStore = true;
      console.warn("MongoDB connection failed. Starting in local JSON store mode.");
      console.warn(error.message);
      startServer();
    });
}