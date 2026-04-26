import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import mongoose from "mongoose";
import Item from "../models/Item.js";
import { runtimeStore } from "./runtimeStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "..", "data");
const dataFilePath = path.join(dataDir, "items.json");

const ensureLocalStoreFile = async () => {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, "[]", "utf8");
  }
};

const readLocalItems = async () => {
  await ensureLocalStoreFile();
  const fileContent = await fs.readFile(dataFilePath, "utf8");

  try {
    const parsed = JSON.parse(fileContent);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeLocalItems = async (items) => {
  await ensureLocalStoreFile();
  await fs.writeFile(dataFilePath, JSON.stringify(items, null, 2), "utf8");
};

const normalizeItem = (item) => ({
  ...item,
  imageUrl: item.imageUrl ?? "",
  manufacturerCountry: item.manufacturerCountry ?? "",
});

const validateItemInput = (payload, existingItem = null) => {
  const name = typeof payload.name === "string" ? payload.name.trim() : existingItem?.name ?? "";
  const category = typeof payload.category === "string" ? payload.category.trim() : existingItem?.category ?? "";
  const description = typeof payload.description === "string" ? payload.description.trim() : existingItem?.description ?? "";
  const imageUrl = typeof payload.imageUrl === "string" ? payload.imageUrl.trim() : existingItem?.imageUrl ?? "";
  const manufacturerCountry = typeof payload.manufacturerCountry === "string" ? payload.manufacturerCountry.trim() : existingItem?.manufacturerCountry ?? "";
  const priceValue = payload.price ?? existingItem?.price;
  const price = Number(priceValue);

  if (!name || !category || !description || !manufacturerCountry || Number.isNaN(price) || price < 0) {
    throw new Error("Invalid item data");
  }

  return { name, category, description, imageUrl, manufacturerCountry, price };
};

const isMongoConnected = () => !runtimeStore.useLocalStore && mongoose.connection.readyState === 1;

export const listItems = async () => {
  if (isMongoConnected()) {
    return Item.find().sort({ createdAt: -1 });
  }

  const items = await readLocalItems();
  return items.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

export const findItemById = async (id) => {
  if (isMongoConnected()) {
    return Item.findById(id);
  }

  const items = await readLocalItems();
  return items.find((item) => item.id === id) ?? null;
};

export const createItemRecord = async (payload) => {
  if (isMongoConnected()) {
    return Item.create(payload);
  }

  const items = await readLocalItems();
  const validated = validateItemInput(payload);
  const now = new Date().toISOString();
  const newItem = normalizeItem({
    id: crypto.randomUUID(),
    ...validated,
    createdAt: now,
    updatedAt: now,
  });

  items.unshift(newItem);
  await writeLocalItems(items);
  return newItem;
};

export const updateItemRecord = async (id, payload) => {
  if (isMongoConnected()) {
    return Item.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });
  }

  const items = await readLocalItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const updatedItem = normalizeItem({
    ...items[index],
    ...validateItemInput(payload, items[index]),
    updatedAt: new Date().toISOString(),
  });

  items[index] = updatedItem;
  await writeLocalItems(items);
  return updatedItem;
};

export const deleteItemRecord = async (id) => {
  if (isMongoConnected()) {
    return Item.findByIdAndDelete(id);
  }

  const items = await readLocalItems();
  const index = items.findIndex((item) => item.id === id);

  if (index === -1) {
    return null;
  }

  const [deletedItem] = items.splice(index, 1);
  await writeLocalItems(items);
  return deletedItem;
};
