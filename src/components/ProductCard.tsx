// src/components/ProductCard.tsx
"use client";

import React from "react";
import { useCart } from "../context/CartContext";

type Product = {
  id: string | number;
  title: string;
  price: number | string;
  image?: string;
};

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const { addToCart } = useCart();

  const handleAdd = () => {
    try {
      if (product == null) return;

      const id = String(product.id ?? "");
      const title = product.title?.trim() || "بدون عنوان";
      const price = Number(product.price);

      if (!id) {
        console.error("Product id is missing");
        return;
      }
      if (Number.isNaN(price)) {
        console.error("Product price is invalid:", product.price);
        return;
      }

      addToCart({
        id,
        title,
        price,
        quantity: 1,
      });
    } catch (e) {
      console.error("Add to cart failed:", e);
    }
  };

  return (
    <div className="border p-4 rounded shadow-sm flex flex-col items-center">
      {product?.image && (
        <img
          src={product.image}
          alt={product.title}
          className="w-32 h-32 object-cover mb-2"
        />
      )}
      <h3 className="font-semibold">{product?.title}</h3>
      <p className="text-gray-600">{String(product?.price)} تومان</p>
      <button
        onClick={handleAdd}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        data-testid="add-to-cart"
      >
        افزودن به سبد
      </button>
    </div>
  );
};

export default ProductCard;
