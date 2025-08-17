const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  // دسته‌بندی‌ها
  const categoriesPath = path.join(__dirname, '../data/categories.json');
  if (fs.existsSync(categoriesPath)) {
    const categories = JSON.parse(fs.readFileSync(categoriesPath, 'utf-8'));
    if (categories.length) {
      await prisma.category.createMany({ data: categories, skipDuplicates: true });
    }
  }

  // برندها
  const brandsPath = path.join(__dirname, '../data/brands.json');
  if (fs.existsSync(brandsPath)) {
    const brands = JSON.parse(fs.readFileSync(brandsPath, 'utf-8'));
    if (brands.length) {
      await prisma.brand.createMany({ data: brands, skipDuplicates: true });
    }
  }

  // محصولات
  const productsPath = path.join(__dirname, '../data/products.json');
  if (fs.existsSync(productsPath)) {
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));
    if (products.length) {
      await prisma.product.createMany({ data: products, skipDuplicates: true });
    }
  }

  console.log('✅ Seed data inserted successfully.');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
