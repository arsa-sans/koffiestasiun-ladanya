// src/components/cashier/RecipeDetailModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Beaker, AlertTriangle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { formatNumber } from "@/lib/utils/format";

interface RecipeIngredient {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  requiredQty: string;
  currentStock: string;
  minStock: string;
  stockStatus: "safe" | "low" | "critical";
  servingsAvailable: number;
}

interface RecipeData {
  id: string;
  name: string;
  description: string | null;
  price: string;
  recipes: RecipeIngredient[];
}

interface RecipeDetailModalProps {
  productId: string | null;
  onClose: () => void;
}

const STATUS_CONFIG = {
  safe: {
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.2)",
    label: "Aman",
    icon: CheckCircle2,
  },
  low: {
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.2)",
    label: "Menipis",
    icon: AlertTriangle,
  },
  critical: {
    color: "#EF4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.2)",
    label: "Hampir Habis",
    icon: XCircle,
  },
};

export default function RecipeDetailModal({
  productId,
  onClose,
}: RecipeDetailModalProps) {
  const [data, setData] = useState<RecipeData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!productId) return;

    let active = true;
    Promise.resolve().then(() => {
      if (active) setLoading(true);
    });

    fetch(`/api/products/${productId}/recipe`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setData(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [productId]);

  if (!productId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      >
        <motion.div
          initial={false}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative w-full max-w-lg rounded-2xl overflow-hidden"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
            boxShadow: "0 20px 60px -10px rgba(0,0,0,0.15)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{
                  background: "rgba(192,139,92,0.12)",
                  border: "1px solid rgba(192,139,92,0.2)",
                }}
              >
                <Beaker size={18} color="#C08B5C" />
              </div>
              <div>
                <h3
                  className="font-semibold text-sm"
                  style={{ color: "#2C241B" }}
                >
                  Komposisi Resep
                </h3>
                {data && (
                  <p
                    className="text-xs"
                    style={{ color: "rgba(44,36,27,0.5)" }}
                  >
                    {data.name}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              style={{ color: "rgba(44,36,27,0.4)" }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin" color="#C08B5C" />
              </div>
            )}

            {!loading && data && data.recipes.length === 0 && (
              <div className="text-center py-12">
                <Beaker
                  size={32}
                  className="mx-auto mb-3"
                  color="rgba(44,36,27,0.2)"
                />
                <p
                  className="text-sm"
                  style={{ color: "rgba(44,36,27,0.4)" }}
                >
                  Belum ada resep untuk produk ini
                </p>
              </div>
            )}

            {!loading && data && data.recipes.length > 0 && (
              <div className="space-y-3">
                {data.recipes.map((recipe) => {
                  const config = STATUS_CONFIG[recipe.stockStatus];
                  const StatusIcon = config.icon;

                  return (
                    <motion.div
                      key={recipe.ingredientId}
                      initial={false}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl p-4"
                      style={{
                        background: config.bg,
                        border: `1px solid ${config.border}`,
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <StatusIcon size={14} color={config.color} />
                            <span
                              className="font-medium text-sm"
                              style={{ color: "#2C241B" }}
                            >
                              {recipe.ingredientName}
                            </span>
                          </div>
                          <div
                            className="text-xs space-y-0.5"
                            style={{ color: "rgba(44,36,27,0.6)" }}
                          >
                            <p>
                              Kebutuhan:{" "}
                              <span className="font-medium">
                                {formatNumber(recipe.requiredQty, 1)}{" "}
                                {recipe.unit}
                              </span>{" "}
                              / porsi
                            </p>
                            <p>
                              Stok saat ini:{" "}
                              <span className="font-medium">
                                {formatNumber(recipe.currentStock, 1)}{" "}
                                {recipe.unit}
                              </span>
                            </p>
                            <p>
                              Minimum stok:{" "}
                              <span className="font-medium">
                                {formatNumber(recipe.minStock, 1)} {recipe.unit}
                              </span>
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div
                            className="text-xs font-medium px-2 py-1 rounded-md"
                            style={{
                              background: config.color,
                              color: "#FFFFFF",
                            }}
                          >
                            {config.label}
                          </div>
                          {recipe.servingsAvailable !== Infinity && (
                            <p
                              className="text-xs mt-1"
                              style={{ color: "rgba(44,36,27,0.5)" }}
                            >
                              ≈ {recipe.servingsAvailable} porsi
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-3 flex justify-end"
            style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
          >
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              style={{
                color: "rgba(44,36,27,0.6)",
                background: "rgba(0,0,0,0.04)",
              }}
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
