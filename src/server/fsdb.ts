// src/server/fsdb.ts
import { promises as fs } from "fs";
import path from "path";

const dataDir = path.join(process.cwd(), "data");
const productsPath = path.join(dataDir, "products.json");
const categoriesPath = path.join(dataDir, "categories.json");

async function readJSON<T>(file: string, fallback: T): Promise<T> {
  try {
    let txt = await fs.readFile(file, "utf8");
    txt = (txt ?? "").replace(/^\uFEFF/, "").trim(); // حذف BOM
    if (!txt) return fallback;
    return JSON.parse(txt) as T;
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      await fs.mkdir(dataDir, { recursive: true });
      await fs.writeFile(file, JSON.stringify(fallback, null, 2), "utf8");
      return fallback;
    }
    throw e;
  }
}

async function writeJSON<T>(file: string, data: T): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  const tmp = file + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, file);
}

/* Types */
export type Attr = { key: string; value: string };
export type Product = {
  id: string; title: string; price: number; image: string;
  oldPrice?: number; gallery?: string[]; rating?: number;
  brand?: string; categoryIds?: string[]; attributes?: Attr[];
};
export type Category = { id: string; name: string };

/* API */
export function getProducts(): Promise<Product[]> {
  return readJSON<Product[]>(productsPath, []);
}
export function saveProducts(list: Product[]): Promise<void> {
  return writeJSON(productsPath, list);
}
export function getCategories(): Promise<Category[]> {
  return readJSON<Category[]>(categoriesPath, []);
}
export function saveCategories(list: Category[]): Promise<void> {
  return writeJSON(categoriesPath, list);
}

// --- template paths ---
const productTplPath = path.join(dataDir, "productTemplate.html");

export async function getProductTemplate(): Promise<string> {
  try { return await fs.readFile(productTplPath, "utf8"); }
  catch { return ""; }
}
export async function saveProductTemplate(tpl: string): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(productTplPath, tpl, "utf8");
}
