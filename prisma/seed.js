const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

function slugify(str) {
  return str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-') // فاصله‌ها به خط تیره
    .replace(/[^\u0600-\u06FFa-z0-9\-]/g, ''); // حذف کاراکترهای غیر مجاز
}

async function main() {
  const read = (p) =>
    fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : [];

  const categories = read(path.join(__dirname, '../data/categories.json')).map(c => ({
    ...c,
    slug: c.slug || slugify(c.name || '')
  }));
  if (categories.length)
    await prisma.category.createMany({ data: categories, skipDuplicates: true });

  const brands = read(path.join(__dirname, '../data/brands.json')).map(b => ({
    ...b,
    slug: b.slug || slugify(b.name || '')
  }));
  if (brands.length)
    await prisma.brand.createMany({ data: brands, skipDuplicates: true });

  const products = read(path.join(__dirname, '../data/products.json')).map(p => ({
    ...p,
    slug: p.slug || slugify(p.title || '')
  }));
  if (products.length)
    await prisma.product.createMany({ data: products, skipDuplicates: true });

  console.log('✅ Seed done');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
