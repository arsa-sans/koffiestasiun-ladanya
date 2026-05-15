"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Minus, Plus, ShoppingCart } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { TAX_RATE, SERVICE_RATE } from "@/constants";
import type { SelectedModifier } from "./ModifierModal";

export interface CartItemType {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  modifiers: SelectedModifier[];
  notes?: string;
}

interface CartPanelProps {
  items: CartItemType[];
  customerName: string;
  notes: string;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onCustomerNameChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onCheckout: () => void;
}

export default function CartPanel({
  items,
  customerName,
  notes,
  onUpdateQty,
  onRemove,
  onCustomerNameChange,
  onNotesChange,
  onCheckout,
}: CartPanelProps) {
  const subtotal = items.reduce((sum, item) => {
    const modTotal = item.modifiers.reduce((ms, m) => ms + m.price, 0);
    return sum + (item.unitPrice + modTotal) * item.quantity;
  }, 0);
  const taxAmount = subtotal * TAX_RATE;
  const serviceAmount = subtotal * SERVICE_RATE;
  const totalAmount = subtotal + taxAmount + serviceAmount;

  return (
    <div className="cart-panel flex flex-col h-full" style={{ width: 340, flexShrink: 0 }}>
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <ShoppingCart size={18} color="#C08B5C" />
        <p className="text-sm font-semibold flex-1" style={{ color: "#EADBC8" }}>Pesanan</p>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(192,139,92,0.12)", color: "#C08B5C" }}>
          {items.length} item
        </span>
      </div>

      <div className="px-4 py-3 space-y-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <input type="text" placeholder="Nama pelanggan" value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)} className="pos-input" style={{ fontSize: "13px", padding: "9px 12px" }} />
        <input type="text" placeholder="Catatan order..." value={notes}
          onChange={(e) => onNotesChange(e.target.value)} className="pos-input" style={{ fontSize: "13px", padding: "9px 12px" }} />
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <AnimatePresence>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40">
              <ShoppingCart size={32} color="rgba(216,198,181,0.2)" />
              <p className="text-sm mt-3" style={{ color: "rgba(216,198,181,0.3)" }}>Cart kosong</p>
            </div>
          ) : (
            items.map((item) => {
              const modTotal = item.modifiers.reduce((ms, m) => ms + m.price, 0);
              const lineTotal = (item.unitPrice + modTotal) * item.quantity;
              return (
                <motion.div key={item.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  className="rounded-2xl p-3" style={{ background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "#EADBC8" }}>{item.productName}</p>
                      {item.modifiers.length > 0 && (
                        <p className="text-xs mt-0.5" style={{ color: "rgba(192,139,92,0.7)" }}>
                          {item.modifiers.map((m) => m.name).join(", ")}
                        </p>
                      )}
                    </div>
                    <button onClick={() => onRemove(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}>
                      <Trash2 size={13} color="#f87171" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={() => onUpdateQty(item.id, Math.max(1, item.quantity - 1))} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#252525" }}>
                        <Minus size={12} color="#EADBC8" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center" style={{ color: "#EADBC8" }}>{item.quantity}</span>
                      <button onClick={() => onUpdateQty(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#252525" }}>
                        <Plus size={12} color="#EADBC8" />
                      </button>
                    </div>
                    <p className="text-sm font-bold" style={{ color: "#C08B5C" }}>{formatCurrency(lineTotal)}</p>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="space-y-1.5 mb-4">
          {[
            { label: "Subtotal", val: subtotal },
            { label: "PPN 12%", val: taxAmount },
            { label: "Service 5%", val: serviceAmount },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between text-sm">
              <span style={{ color: "rgba(216,198,181,0.5)" }}>{label}</span>
              <span style={{ color: "#EADBC8" }}>{formatCurrency(val)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span style={{ color: "#EADBC8" }}>Total</span>
            <span style={{ color: "#C08B5C", fontSize: "18px" }}>{formatCurrency(totalAmount)}</span>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onCheckout} disabled={items.length === 0}
          className="btn-primary w-full" style={{ background: items.length === 0 ? "#333" : "#C08B5C", cursor: items.length === 0 ? "not-allowed" : "pointer" }}>
          Bayar Sekarang
        </motion.button>
      </div>
    </div>
  );
}
