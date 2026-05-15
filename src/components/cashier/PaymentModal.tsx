"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CreditCard, QrCode, Wallet, Banknote, Building2, Plus, Trash2, CheckCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import { PAYMENT_METHOD_LABELS } from "@/constants";
import { processPayment, type PaymentEntry } from "@/server/actions/payments";
import { toast } from "sonner";

interface PaymentModalProps {
  orderId: string;
  totalAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

const METHODS = [
  { id: "cash", label: "Cash", icon: <Banknote size={20} /> },
  { id: "qris", label: "QRIS", icon: <QrCode size={20} /> },
  { id: "card", label: "Kartu", icon: <CreditCard size={20} /> },
  { id: "ewallet", label: "E-Wallet", icon: <Wallet size={20} /> },
  { id: "transfer", label: "Transfer", icon: <Building2 size={20} /> },
] as const;

export default function PaymentModal({ orderId, totalAmount, onClose, onSuccess }: PaymentModalProps) {
  const [entries, setEntries] = useState<PaymentEntry[]>([
    { method: "cash", amount: totalAmount },
  ]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalPaid = entries.reduce((s, e) => s + e.amount, 0);
  const remaining = totalAmount - totalPaid;

  const addEntry = () => {
    setEntries([...entries, { method: "cash", amount: 0 }]);
  };

  const removeEntry = (i: number) => {
    setEntries(entries.filter((_, idx) => idx !== i));
  };

  const updateEntry = (i: number, field: keyof PaymentEntry, value: string | number) => {
    const updated = [...entries];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (updated[i] as any)[field] = value;
    setEntries(updated);
  };

  const handlePay = async () => {
    if (remaining > 0.01) {
      toast.error(`Masih kurang ${formatCurrency(remaining)}`);
      return;
    }
    setLoading(true);
    const result = await processPayment(orderId, entries);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => { onSuccess(); }, 1800);
    } else {
      toast.error("Pembayaran gagal");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.8)" }}>
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center gap-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full flex items-center justify-center" style={{ background: "rgba(16,185,129,0.15)", border: "2px solid #10B981" }}>
            <CheckCircle size={48} color="#10B981" />
          </motion.div>
          <p className="text-2xl font-bold" style={{ color: "#EADBC8", fontFamily: "Playfair Display, serif" }}>Pembayaran Berhasil!</p>
          <p style={{ color: "#10B981" }}>{formatCurrency(totalAmount)}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-md rounded-3xl p-6" style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.08)" }}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold" style={{ color: "#EADBC8", fontFamily: "Playfair Display, serif" }}>Pembayaran</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
            <X size={16} color="rgba(216,198,181,0.7)" />
          </button>
        </div>

        <div className="rounded-2xl p-4 mb-5 text-center" style={{ background: "rgba(192,139,92,0.08)", border: "1px solid rgba(192,139,92,0.2)" }}>
          <p className="text-sm mb-1" style={{ color: "rgba(216,198,181,0.5)" }}>Total Tagihan</p>
          <p className="text-3xl font-bold" style={{ color: "#C08B5C", fontFamily: "Playfair Display, serif" }}>{formatCurrency(totalAmount)}</p>
        </div>

        <div className="space-y-3 mb-4">
          {entries.map((entry, i) => (
            <div key={i} className="rounded-2xl p-3" style={{ background: "#252525", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="flex gap-2 mb-2">
                {METHODS.map((m) => (
                  <button key={m.id} onClick={() => updateEntry(i, "method", m.id)}
                    className="flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-xs transition-all"
                    style={{ background: entry.method === m.id ? "rgba(192,139,92,0.15)" : "transparent", color: entry.method === m.id ? "#C08B5C" : "rgba(216,198,181,0.4)", border: entry.method === m.id ? "1px solid rgba(192,139,92,0.3)" : "1px solid transparent" }}>
                    {m.icon}
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="number" value={entry.amount || ""} onChange={(e) => updateEntry(i, "amount", parseFloat(e.target.value) || 0)}
                  placeholder="Jumlah" className="pos-input flex-1" style={{ fontSize: "13px", padding: "9px 12px" }} />
                {entries.length > 1 && (
                  <button onClick={() => removeEntry(i)} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}>
                    <Trash2 size={14} color="#f87171" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={addEntry} className="w-full py-2.5 rounded-xl text-sm mb-4 flex items-center justify-center gap-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px dashed rgba(255,255,255,0.1)", color: "rgba(216,198,181,0.5)" }}>
          <Plus size={14} /> Split Pembayaran
        </button>

        {remaining > 0.01 && (
          <p className="text-center text-sm mb-3" style={{ color: "#F59E0B" }}>Kurang: {formatCurrency(remaining)}</p>
        )}
        {remaining < -0.01 && (
          <p className="text-center text-sm mb-3" style={{ color: "#10B981" }}>Kembalian: {formatCurrency(Math.abs(remaining))}</p>
        )}

        <button onClick={handlePay} disabled={loading || remaining > 0.01}
          className="btn-primary w-full" style={{ background: remaining > 0.01 ? "#333" : "#C08B5C", cursor: remaining > 0.01 ? "not-allowed" : "pointer" }}>
          {loading ? "Memproses..." : "Konfirmasi Pembayaran"}
        </button>
      </motion.div>
    </div>
  );
}
