"use client";

import React from "react";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, AlertTriangle, Plus, Edit2, Trash2, X, History, FileSpreadsheet } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { adjustStock, createIngredient, updateIngredient, deleteIngredient } from "@/server/services/inventory";
import { toast } from "sonner";

interface Ingredient {
  id: string; name: string; unit: string; stock: string; minStock: string;
  costPerUnit: string; isActive: boolean; isLow: boolean;
}
interface Transaction {
  id: string; ingredientName: string; unit: string; type: string;
  quantity: string; stockBefore: string; stockAfter: string;
  note: string|null; performedBy: string|null; createdAt: string;
}

const TX_TYPE_COLORS: Record<string, string> = { purchase: "#10B981", sale: "#EF4444", adjustment: "#3B82F6", waste: "#F59E0B", opname: "#8B5CF6" };
const TX_TYPE_LABELS: Record<string, string> = { purchase: "Pembelian", sale: "Penjualan", adjustment: "Penyesuaian", waste: "Waste", opname: "Opname" };

export default function InventoryClient({ ingredients: initIng, transactions: initTx }: { ingredients: Ingredient[]; transactions: Transaction[] }) {
  const [items, setItems] = useState(initIng);
  const [txs, setTxs] = useState(initTx);
  const [tab, setTab] = useState<"stock"|"history">("stock");
  const [adjustingId, setAdjustingId] = useState<string|null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  const [fName, setFName] = useState("");
  const [fUnit, setFUnit] = useState("");
  const [fStock, setFStock] = useState("0");
  const [fMinStock, setFMinStock] = useState("0");
  const [fCost, setFCost] = useState("0");

  const lowStockItems = items.filter(i => i.isLow);

  const reset = () => { setFName(""); setFUnit(""); setFStock("0"); setFMinStock("0"); setFCost("0"); setEditId(null); setShowForm(false); };

  const openEdit = (i: Ingredient) => { setFName(i.name); setFUnit(i.unit); setFStock(i.stock); setFMinStock(i.minStock); setFCost(i.costPerUnit); setEditId(i.id); setShowForm(true); };

  const handleSubmit = async () => {
    if (!fName.trim() || !fUnit.trim()) { toast.error("Nama dan satuan harus diisi"); return; }
    setLoading(true);
    try {
      if (editId) {
        const r = await updateIngredient(editId, { name: fName, unit: fUnit, minStock: fMinStock, costPerUnit: fCost });
        if (r.success) {
          setItems(p => p.map(i => i.id===editId ? { ...i, name: fName, unit: fUnit, minStock: fMinStock, costPerUnit: fCost, isLow: parseFloat(i.stock) <= parseFloat(fMinStock)*1.2 } : i));
          toast.success("Bahan diperbarui");
        }
      } else {
        const r = await createIngredient({ name: fName, unit: fUnit, stock: fStock, minStock: fMinStock, costPerUnit: fCost });
        if (r.success && r.data) {
          const d = r.data;
          setItems(p => [...p, { id: d.id, name: d.name, unit: d.unit, stock: String(d.stock), minStock: String(d.minStock), costPerUnit: String(d.costPerUnit), isActive: d.isActive, isLow: parseFloat(String(d.stock)) <= parseFloat(String(d.minStock))*1.2 }]);
          toast.success("Bahan ditambahkan");
        }
      }
      reset();
    } catch { toast.error("Terjadi kesalahan"); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin hapus bahan ini?")) return;
    try { await deleteIngredient(id); setItems(p => p.filter(i => i.id!==id)); toast.success("Bahan dihapus"); } catch { toast.error("Gagal menghapus"); }
  };

  const handleAdjust = async (ingredientId: string, type: "purchase"|"adjustment"|"waste") => {
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty===0) { toast.error("Masukkan jumlah valid"); return; }
    const finalQty = type==="waste" ? -Math.abs(qty) : Math.abs(qty);
    const result = await adjustStock(ingredientId, finalQty, type, adjustNote||"Manual adjustment");
    if (result.success) {
      setItems(p => p.map(i => {
        if (i.id===ingredientId) {
          const newStock = String(result.stockAfter);
          return { ...i, stock: newStock, isLow: result.stockAfter <= parseFloat(i.minStock)*1.2 };
        }
        return i;
      }));
      const ing = items.find(i => i.id===ingredientId);
      if (ing) {
        setTxs(p => [{ id: Date.now().toString(), ingredientName: ing.name, unit: ing.unit, type, quantity: String(finalQty), stockBefore: ing.stock, stockAfter: String(result.stockAfter), note: adjustNote||"Manual adjustment", performedBy: null, createdAt: new Date().toISOString() }, ...p]);
      }
      toast.success("Stok berhasil diperbarui");
      setAdjustingId(null); setAdjustQty(""); setAdjustNote("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>Inventaris</h1>
        <div className="flex gap-2">
          {(["stock", "history"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ background: tab===t ? "rgba(192,139,92,0.15)" : "rgba(0,0,0,0.04)", color: tab===t ? "#C08B5C" : "rgba(44,36,27,0.5)", border: tab===t ? "1px solid rgba(192,139,92,0.3)" : "1px solid transparent" }}>
              {t==="stock" ? "Stok Saat Ini" : "Riwayat Transaksi"}
            </button>
          ))}
          {tab==="stock" && <button onClick={() => setShowForm(true)} className="btn-primary px-4" style={{ height: 40 }}><Plus size={14} /> Tambah Bahan</button>}
          <button
            onClick={() => { window.open("/api/export/inventory", "_blank"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
            style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)", height: 40 }}
          >
            <FileSpreadsheet size={14} />
            Export
          </button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)" }}>
          <div className="flex items-center gap-2 mb-2"><AlertTriangle size={16} color="#F59E0B" /><p className="text-sm font-semibold" style={{ color: "#F59E0B" }}>{lowStockItems.length} bahan di bawah stok minimum</p></div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map(i => <span key={i.id} className="text-xs px-2.5 py-1 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.25)" }}>{i.name}: {i.stock} {i.unit}</span>)}
          </div>
        </div>
      )}

      {tab==="stock" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
          <table className="pos-table">
            <thead><tr><th>Bahan</th><th>Stok</th><th>Min Stok</th><th>Satuan</th><th>Harga/Unit</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {items.map(ing => (
                <React.Fragment key={ing.id}>
                  <tr className={ing.isLow ? "low-stock-row" : ""}>
                    <td className="font-medium" style={{ color: "#2C241B" }}>{ing.name}</td>
                    <td className="font-bold" style={{ color: ing.isLow ? "#F59E0B" : "#10B981" }}>{parseFloat(ing.stock).toLocaleString("id-ID")}</td>
                    <td style={{ color: "rgba(44,36,27,0.5)" }}>{parseFloat(ing.minStock).toLocaleString("id-ID")}</td>
                    <td style={{ color: "rgba(44,36,27,0.7)" }}>{ing.unit}</td>
                    <td style={{ color: "rgba(44,36,27,0.7)" }}>{formatCurrency(parseFloat(ing.costPerUnit))}</td>
                    <td>{ing.isLow ? <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.12)", color: "#F59E0B" }}>Kritis</span> : <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Aman</span>}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => setAdjustingId(adjustingId===ing.id ? null : ing.id)} className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "rgba(192,139,92,0.12)", color: "#C08B5C", border: "1px solid rgba(192,139,92,0.2)" }}>Sesuaikan</button>
                        <button onClick={() => openEdit(ing)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(192,139,92,0.1)" }}><Edit2 size={12} color="#C08B5C" /></button>
                        <button onClick={() => handleDelete(ing.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(239,68,68,0.08)" }}><Trash2 size={12} color="#f87171" /></button>
                      </div>
                    </td>
                  </tr>
                  <AnimatePresence>
                    {adjustingId===ing.id && (
                      <tr key={`${ing.id}-adj`}>
                        <td colSpan={7} style={{ padding: "12px 16px" }}>
                          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F1EBE4" }}>
                            <input type="number" placeholder="Jumlah (+/-)" value={adjustQty} onChange={e => setAdjustQty(e.target.value)} className="pos-input flex-1" style={{ fontSize: "13px", padding: "8px 12px" }} />
                            <input type="text" placeholder="Keterangan" value={adjustNote} onChange={e => setAdjustNote(e.target.value)} className="pos-input flex-1" style={{ fontSize: "13px", padding: "8px 12px" }} />
                            <button onClick={() => handleAdjust(ing.id, "purchase")} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}>Masuk</button>
                            <button onClick={() => handleAdjust(ing.id, "waste")} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(239,68,68,0.12)", color: "#f87171" }}>Waste</button>
                            <button onClick={() => handleAdjust(ing.id, "adjustment")} className="px-3 py-2 rounded-lg text-xs font-semibold" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa" }}>Koreksi</button>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab==="history" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
          <table className="pos-table">
            <thead><tr><th>Bahan</th><th>Tipe</th><th>Qty</th><th>Sebelum</th><th>Sesudah</th><th>Catatan</th><th>Waktu</th></tr></thead>
            <tbody>
              {txs.map(tx => {
                const tColor = TX_TYPE_COLORS[tx.type]||"#C08B5C";
                const qty = parseFloat(tx.quantity);
                return (
                  <tr key={tx.id}>
                    <td className="font-medium" style={{ color: "#2C241B" }}>{tx.ingredientName}</td>
                    <td><span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${tColor}18`, color: tColor }}>{TX_TYPE_LABELS[tx.type]}</span></td>
                    <td className="font-bold" style={{ color: qty>=0 ? "#10B981" : "#EF4444" }}>{qty>=0?"+":""}{qty.toLocaleString("id-ID")} {tx.unit}</td>
                    <td style={{ color: "rgba(44,36,27,0.5)" }}>{parseFloat(tx.stockBefore).toLocaleString("id-ID")}</td>
                    <td style={{ color: "rgba(44,36,27,0.7)" }}>{parseFloat(tx.stockAfter).toLocaleString("id-ID")}</td>
                    <td className="text-xs" style={{ color: "rgba(44,36,27,0.5)" }}>{tx.note||"-"}</td>
                    <td className="text-xs" style={{ color: "rgba(44,36,27,0.4)" }}>{formatDateTime(tx.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.3)" }} onClick={reset}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="rounded-3xl p-6 w-full max-w-md" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: "#2C241B" }}>{editId ? "Edit Bahan" : "Tambah Bahan Baku"}</h2>
                <button onClick={reset} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}><X size={16} color="rgba(44,36,27,0.5)" /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Nama Bahan</label><input type="text" value={fName} onChange={e => setFName(e.target.value)} placeholder="Kopi Arabica" className="pos-input" style={{ fontSize: "13px" }} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Satuan</label><input type="text" value={fUnit} onChange={e => setFUnit(e.target.value)} placeholder="gr, ml, pcs" className="pos-input" style={{ fontSize: "13px" }} /></div>
                  {!editId && <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Stok Awal</label><input type="text" value={fStock} onChange={e => setFStock(e.target.value)} className="pos-input" style={{ fontSize: "13px" }} /></div>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Stok Minimum</label><input type="text" value={fMinStock} onChange={e => setFMinStock(e.target.value)} className="pos-input" style={{ fontSize: "13px" }} /></div>
                  <div><label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Harga per Unit</label><input type="text" value={fCost} onChange={e => setFCost(e.target.value)} className="pos-input" style={{ fontSize: "13px" }} /></div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={reset} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(0,0,0,0.04)", color: "rgba(44,36,27,0.7)" }}>Batal</button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1" style={{ background: loading ? "#8A6A55" : "#C08B5C" }}>{loading ? "Menyimpan..." : editId ? "Simpan" : "Tambah"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
