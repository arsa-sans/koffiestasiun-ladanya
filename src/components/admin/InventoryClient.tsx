"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, AlertTriangle, TrendingDown, TrendingUp, History } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { adjustStock } from "@/server/services/inventory";
import { toast } from "sonner";

interface Ingredient {
  id: string; name: string; unit: string; stock: string; minStock: string;
  costPerUnit: string; isActive: boolean; isLow: boolean;
}
interface Transaction {
  id: string; ingredientName: string; unit: string; type: string;
  quantity: string; stockBefore: string; stockAfter: string;
  note: string | null; performedBy: string | null; createdAt: string;
}

interface InventoryClientProps { ingredients: Ingredient[]; transactions: Transaction[] }

const TX_TYPE_COLORS: Record<string, string> = {
  purchase: "#10B981", sale: "#EF4444", adjustment: "#3B82F6", waste: "#F59E0B", opname: "#8B5CF6",
};
const TX_TYPE_LABELS: Record<string, string> = {
  purchase: "Pembelian", sale: "Penjualan", adjustment: "Penyesuaian", waste: "Waste", opname: "Opname",
};

export default function InventoryClient({ ingredients, transactions }: InventoryClientProps) {
  const [tab, setTab] = useState<"stock" | "history">("stock");
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  const lowStockItems = ingredients.filter((i) => i.isLow);

  const handleAdjust = async (ingredientId: string, type: "purchase" | "adjustment" | "waste") => {
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty === 0) { toast.error("Masukkan jumlah valid"); return; }
    const result = await adjustStock(ingredientId, type === "waste" ? -Math.abs(qty) : Math.abs(qty), type, adjustNote || "Manual adjustment");
    if (result.success) {
      toast.success("Stok berhasil diperbarui");
      setAdjustingId(null);
      setAdjustQty("");
      setAdjustNote("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#EADBC8", fontFamily: "Playfair Display, serif" }}>Inventaris</h1>
        <div className="flex gap-2">
          {(["stock", "history"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: tab === t ? "rgba(192,139,92,0.15)" : "rgba(255,255,255,0.04)", color: tab === t ? "#C08B5C" : "rgba(216,198,181,0.5)", border: tab === t ? "1px solid rgba(192,139,92,0.3)" : "1px solid transparent" }}>
              {t === "stock" ? "Stok Saat Ini" : "Riwayat Transaksi"}
            </button>
          ))}
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} color="#F59E0B" />
            <p className="text-sm font-semibold" style={{ color: "#F59E0B" }}>{lowStockItems.length} bahan di bawah stok minimum</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((i) => (
              <span key={i.id} className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}>
                {i.name}: {i.stock} {i.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === "stock" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.05)" }}>
          <table className="pos-table">
            <thead>
              <tr><th>Bahan</th><th>Stok</th><th>Min Stok</th><th>Satuan</th><th>Harga/Unit</th><th>Status</th><th>Aksi</th></tr>
            </thead>
            <tbody>
              {ingredients.map((ing) => (
                <>
                  <tr key={ing.id} className={ing.isLow ? "low-stock-row" : ""}>
                    <td className="font-medium" style={{ color: "#EADBC8" }}>{ing.name}</td>
                    <td className="font-bold" style={{ color: ing.isLow ? "#F59E0B" : "#10B981" }}>{parseFloat(ing.stock).toLocaleString("id-ID")}</td>
                    <td style={{ color: "rgba(216,198,181,0.5)" }}>{parseFloat(ing.minStock).toLocaleString("id-ID")}</td>
                    <td style={{ color: "rgba(216,198,181,0.7)" }}>{ing.unit}</td>
                    <td style={{ color: "rgba(216,198,181,0.7)" }}>{formatCurrency(parseFloat(ing.costPerUnit))}</td>
                    <td>
                      {ing.isLow ? (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>Kritis</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Aman</span>
                      )}
                    </td>
                    <td>
                      <button onClick={() => setAdjustingId(adjustingId === ing.id ? null : ing.id)}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
                        style={{ background: "rgba(192,139,92,0.12)", color: "#C08B5C", border: "1px solid rgba(192,139,92,0.2)" }}>
                        Sesuaikan
                      </button>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {adjustingId === ing.id && (
                      <tr key={`${ing.id}-adj`}>
                        <td colSpan={7} style={{ padding: "12px 16px" }}>
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#252525" }}>
                            <input type="number" placeholder="Jumlah (+/-)" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)}
                              className="pos-input flex-1" style={{ fontSize: "13px", padding: "8px 12px" }} />
                            <input type="text" placeholder="Keterangan" value={adjustNote} onChange={(e) => setAdjustNote(e.target.value)}
                              className="pos-input flex-1" style={{ fontSize: "13px", padding: "8px 12px" }} />
                            <button onClick={() => handleAdjust(ing.id, "purchase")} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>Masuk</button>
                            <button onClick={() => handleAdjust(ing.id, "waste")} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>Waste</button>
                            <button onClick={() => handleAdjust(ing.id, "adjustment")} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}>Koreksi</button>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "history" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#181818", border: "1px solid rgba(255,255,255,0.05)" }}>
          <table className="pos-table">
            <thead><tr><th>Bahan</th><th>Tipe</th><th>Qty</th><th>Sebelum</th><th>Sesudah</th><th>Catatan</th><th>Waktu</th></tr></thead>
            <tbody>
              {transactions.map((tx) => {
                const tColor = TX_TYPE_COLORS[tx.type] || "#C08B5C";
                const qty = parseFloat(tx.quantity);
                return (
                  <tr key={tx.id}>
                    <td className="font-medium" style={{ color: "#EADBC8" }}>{tx.ingredientName}</td>
                    <td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${tColor}18`, color: tColor }}>{TX_TYPE_LABELS[tx.type]}</span></td>
                    <td className="font-bold" style={{ color: qty >= 0 ? "#10B981" : "#EF4444" }}>
                      {qty >= 0 ? "+" : ""}{qty.toLocaleString("id-ID")} {tx.unit}
                    </td>
                    <td style={{ color: "rgba(216,198,181,0.5)" }}>{parseFloat(tx.stockBefore).toLocaleString("id-ID")}</td>
                    <td style={{ color: "rgba(216,198,181,0.7)" }}>{parseFloat(tx.stockAfter).toLocaleString("id-ID")}</td>
                    <td className="text-xs" style={{ color: "rgba(216,198,181,0.5)" }}>{tx.note || "-"}</td>
                    <td className="text-xs" style={{ color: "rgba(216,198,181,0.4)" }}>{formatDateTime(tx.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
