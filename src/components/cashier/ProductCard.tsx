"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/format";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price: string;
  imageUrl?: string | null;
  isAvailable: boolean;
  categoryId?: string;
  stationId?: string;
}

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void | Promise<void>;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      className="product-card"
      onClick={() => product.isAvailable && onSelect(product)}
      style={{
        opacity: product.isAvailable ? 1 : 0.45,
        filter: product.isAvailable ? "none" : "grayscale(100%)",
        cursor: product.isAvailable ? "pointer" : "not-allowed",
      }}
    >
      {/* Image */}
      <div
        className="relative w-full"
        style={{ paddingTop: "60%", background: "#1a1a1a" }}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-4xl"
            style={{ background: "rgba(192,139,92,0.06)" }}
          >
            ☕
          </div>
        )}

        {!product.isAvailable && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <span
              className="text-xs font-bold tracking-widest px-3 py-1 rounded-full"
              style={{
                background: "rgba(239,68,68,0.2)",
                color: "#f87171",
                border: "1px solid rgba(239,68,68,0.3)",
              }}
            >
              HABIS
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p
          className="text-sm font-semibold leading-tight mb-1 line-clamp-2"
          style={{ color: "#EADBC8" }}
        >
          {product.name}
        </p>
        <p className="text-sm font-bold" style={{ color: "#C08B5C" }}>
          {formatCurrency(parseFloat(product.price))}
        </p>
      </div>
    </motion.div>
  );
}
