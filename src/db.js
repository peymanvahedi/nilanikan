// src/db.js
import Dexie from "dexie";

export const db = new Dexie("shopDB");
db.version(1).stores({
  categories: "++id, name, slug, parentId",
  products:   "++id, name, categoryId, price"
});
