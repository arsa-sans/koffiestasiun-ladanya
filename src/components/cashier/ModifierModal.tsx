"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, Check } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { useState } from "react";

interface ModifierOption {
  id: string;
  name: string;
  price: string;
}

interface ModifierGroup {
  id: string;
  name: string;
  isRequired: boolean;
  isMultiple: boolean;
  minSelect: number;
  maxSelect: number;
  options: ModifierOption[];
}

interface Product {
  id: string;
  name: string;
  price: string;
  imageUrl?: string | null;
  isAvailable?: boolean;
  categoryId?: string;
  stationId?: string;
  maxStock?: number | null;
}

export interface SelectedModifier {
  modifierOptionId: string;
  name: string;
  price: number;
}

interface ModifierModalProps {
  product: Product;
  modifierGroups: ModifierGroup[];
  onClose: () => void;
  onConfirm: (
    product: Product,
    quantity: number,
    modifiers: SelectedModifier[],
    notes: string
  ) => void;
}

export default function ModifierModal({
  product,
  modifierGroups,
  onClose,
  onConfirm,
}: ModifierModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, SelectedModifier[]>
  >({});
  const [notes, setNotes] = useState("");

  const toggleModifier = (
    group: ModifierGroup,
    option: ModifierOption
  ) => {
    const groupId = group.id;
    const current = selectedModifiers[groupId] || [];
    const isSelected = current.some((m) => m.modifierOptionId === option.id);

    if (isSelected) {
      setSelectedModifiers({
        ...selectedModifiers,
        [groupId]: current.filter((m) => m.modifierOptionId !== option.id),
      });
    } else {
      if (!group.isMultiple) {
        // Single select: replace
        setSelectedModifiers({
          ...selectedModifiers,
          [groupId]: [
            {
              modifierOptionId: option.id,
              name: option.name,
              price: parseFloat(option.price),
            },
          ],
        });
      } else if (current.length < group.maxSelect) {
        setSelectedModifiers({
          ...selectedModifiers,
          [groupId]: [
            ...current,
            {
              modifierOptionId: option.id,
              name: option.name,
              price: parseFloat(option.price),
            },
          ],
        });
      }
    }
  };

  const allModifiers = Object.values(selectedModifiers).flat();
  const modifiersTotal = allModifiers.reduce((s, m) => s + m.price, 0);
  const itemTotal =
    (parseFloat(product.price) + modifiersTotal) * quantity;

  const handleConfirm = () => {
    onConfirm(product, quantity, allModifiers, notes);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
        />

        <motion.div
          initial={false}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="sticky top-0 flex items-center justify-between p-5 z-10"
            style={{
              background: "#FFFFFF",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <div>
              <h3
                className="text-lg font-bold"
                style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}
              >
                {product.name}
              </h3>
              <p className="text-sm" style={{ color: "#C08B5C" }}>
                {formatCurrency(parseFloat(product.price))}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.06)" }}
            >
              <X size={18} color="rgba(44,36,27,0.7)" />
            </button>
          </div>

          {/* Modifier Groups */}
          <div className="p-5 space-y-6">
            {modifierGroups.map((group) => (
              <div key={group.id}>
                <div className="flex items-center gap-2 mb-3">
                  <h4
                    className="text-sm font-semibold"
                    style={{ color: "#2C241B" }}
                  >
                    {group.name}
                  </h4>
                  {group.isRequired && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: "rgba(192,139,92,0.15)",
                        color: "#C08B5C",
                        border: "1px solid rgba(192,139,92,0.25)",
                      }}
                    >
                      Wajib
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const isSelected = (
                      selectedModifiers[group.id] || []
                    ).some((m) => m.modifierOptionId === option.id);

                    return (
                      <motion.button
                        key={option.id}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => toggleModifier(group, option)}
                        className="modifier-pill"
                        style={{
                          background: isSelected
                            ? "rgba(192,139,92,0.15)"
                            : "#F1EBE4",
                          borderColor: isSelected
                            ? "#C08B5C"
                            : "rgba(0,0,0,0.12)",
                          color: isSelected ? "#C08B5C" : "#5C4B3F",
                        }}
                      >
                        {isSelected && (
                          <Check size={13} className="mr-1" />
                        )}
                        {option.name}
                        {parseFloat(option.price) > 0 && (
                          <span
                            className="ml-1 text-xs"
                            style={{
                              color: isSelected
                                ? "rgba(192,139,92,0.8)"
                                : "rgba(44,36,27,0.5)",
                            }}
                          >
                            +{formatCurrency(parseFloat(option.price))}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Notes */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "rgba(44,36,27,0.6)" }}
              >
                Catatan Dapur
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: tanpa bawang, extra pedas..."
                rows={2}
                className="pos-input resize-none"
                style={{ fontFamily: "Inter, sans-serif" }}
              />
            </div>

            {/* Quantity */}
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: "rgba(44,36,27,0.6)" }}>
                Jumlah
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "#F1EBE4", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <Minus size={16} color="#2C241B" />
                </button>
                <span
                  className="text-xl font-bold w-8 text-center"
                  style={{ color: "#2C241B" }}
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.maxStock ?? Infinity, quantity + 1))}
                  disabled={product.maxStock !== null && product.maxStock !== undefined && quantity >= product.maxStock}
                  className="w-9 h-9 rounded-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "#F1EBE4", border: "1px solid rgba(0,0,0,0.08)" }}
                >
                  <Plus size={16} color="#2C241B" />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="sticky bottom-0 p-5"
            style={{
              background: "#FFFFFF",
              borderTop: "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <button onClick={handleConfirm} className="btn-primary w-full">
              <span>Tambah ke Cart</span>
              <span
                className="ml-auto px-3 py-1 rounded-lg text-sm font-bold"
                style={{ background: "rgba(0,0,0,0.2)" }}
              >
                {formatCurrency(itemTotal)}
              </span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
