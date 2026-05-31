"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  AlertTriangle,
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  ArrowUpDown,
  Droplets,
  Scale,
  Boxes,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils/format";
import {
  adjustStock,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "@/server/services/inventory";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock: string;
  minStock: string;
  costPerUnit: string;
  supplier: string;
  isActive: boolean;
  isLow: boolean;
}

const UNIT_ICONS: Record<string, React.ReactNode> = {
  ml: <Droplets size={14} />,
  liter: <Droplets size={14} />,
  gr: <Scale size={14} />,
  kg: <Scale size={14} />,
  pcs: <Boxes size={14} />,
};

export default function KitchenInventoryClient({
  ingredients: initIng,
}: {
  ingredients: Ingredient[];
}) {
  const [items, setItems] = useState(initIng);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adjustingId, setAdjustingId] = useState<string | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustNote, setAdjustNote] = useState("");

  // Form fields
  const [fName, setFName] = useState("");
  const [fUnit, setFUnit] = useState("");
  const [fStock, setFStock] = useState("0");
  const [fMinStock, setFMinStock] = useState("0");
  const [fCost, setFCost] = useState("0");
  const [fSupplier, setFSupplier] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const lowStockItems = items.filter((i) => i.isLow);

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.unit.toLowerCase().includes(search.toLowerCase()) ||
      i.supplier.toLowerCase().includes(search.toLowerCase())
  );

  const reset = () => {
    setFName("");
    setFUnit("");
    setFStock("0");
    setFMinStock("0");
    setFCost("0");
    setFSupplier("");
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (i: Ingredient) => {
    setFName(i.name);
    setFUnit(i.unit);
    setFStock(i.stock);
    setFMinStock(i.minStock);
    setFCost(i.costPerUnit);
    setFSupplier(i.supplier);
    setEditId(i.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!fName.trim() || !fUnit.trim()) {
      toast.error("Nama dan satuan harus diisi");
      return;
    }
    setLoading(true);
    try {
      if (editId) {
        const r = await updateIngredient(editId, {
          name: fName,
          unit: fUnit,
          minStock: fMinStock,
          costPerUnit: fCost,
          supplier: fSupplier,
        });
        if (r.success) {
          setItems((p) =>
            p.map((i) =>
              i.id === editId
                ? {
                    ...i,
                    name: fName,
                    unit: fUnit,
                    minStock: fMinStock,
                    costPerUnit: fCost,
                    supplier: fSupplier,
                    isLow:
                      parseFloat(i.stock) <= parseFloat(fMinStock) * 1.2,
                  }
                : i
            )
          );
          toast.success("Bahan diperbarui");
        }
      } else {
        const r = await createIngredient({
          name: fName,
          unit: fUnit,
          stock: fStock,
          minStock: fMinStock,
          costPerUnit: fCost,
          supplier: fSupplier,
        });
        if (r.success && r.data) {
          const d = r.data;
          setItems((p) => [
            ...p,
            {
              id: d.id,
              name: d.name,
              unit: d.unit,
              stock: String(d.stock),
              minStock: String(d.minStock),
              costPerUnit: String(d.costPerUnit),
              supplier: d.supplier || "",
              isActive: d.isActive,
              isLow:
                parseFloat(String(d.stock)) <=
                parseFloat(String(d.minStock)) * 1.2,
            },
          ]);
          toast.success("Bahan ditambahkan");
        }
      }
      reset();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleteLoading(true);
    try {
      await deleteIngredient(confirmDeleteId);
      setItems((p) => p.filter((i) => i.id !== confirmDeleteId));
      toast.success("Bahan dihapus");
    } catch {
      toast.error("Gagal menghapus");
    } finally {
      setDeleteLoading(false);
      setConfirmDeleteId(null);
    }
  };

  const handleAdjust = async (
    ingredientId: string,
    type: "purchase" | "adjustment" | "waste"
  ) => {
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty === 0) {
      toast.error("Masukkan jumlah yang valid");
      return;
    }
    const finalQty = type === "waste" ? -Math.abs(qty) : Math.abs(qty);
    const result = await adjustStock(
      ingredientId,
      finalQty,
      type,
      adjustNote || "Penyesuaian manual"
    );
    if (result.success) {
      setItems((p) =>
        p.map((i) => {
          if (i.id === ingredientId) {
            const newStock = String(result.stockAfter);
            return {
              ...i,
              stock: newStock,
              isLow: result.stockAfter <= parseFloat(i.minStock) * 1.2,
            };
          }
          return i;
        })
      );
      toast.success("Stok berhasil diperbarui");
      setAdjustingId(null);
      setAdjustQty("");
      setAdjustNote("");
    }
  };

  return (
    <div
      className="p-4 md:p-6 space-y-5 overflow-y-auto"
      style={{ height: "100vh" }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1
            className="text-xl md:text-2xl font-bold"
            style={{
              color: "#2C241B",
              fontFamily: "Playfair Display, serif",
            }}
          >
            Bahan Baku
          </h1>
          <p
            className="text-xs md:text-sm mt-0.5"
            style={{ color: "rgba(44,36,27,0.5)" }}
          >
            Kelola bahan baku yang digunakan di menu dapur
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center gap-2 px-4 self-start"
          style={{ height: 40 }}
        >
          <Plus size={14} />
          Tambah Bahan
        </button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} color="#F59E0B" />
            <p
              className="text-sm font-semibold"
              style={{ color: "#F59E0B" }}
            >
              {lowStockItems.length} bahan di bawah stok minimum!
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {lowStockItems.map((i) => (
              <span
                key={i.id}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{
                  background: "rgba(245,158,11,0.12)",
                  color: "#F59E0B",
                  border: "1px solid rgba(245,158,11,0.25)",
                }}
              >
                {i.name}: {parseFloat(i.stock).toLocaleString("id-ID")}{" "}
                {i.unit}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "rgba(44,36,27,0.35)" }}
        />
        <input
          type="text"
          placeholder="Cari bahan baku..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pos-input pl-10"
          style={{ fontSize: "13px" }}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <div
          className="rounded-2xl p-4"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(192,139,92,0.12)" }}
            >
              <Package size={14} color="#C08B5C" />
            </div>
          </div>
          <p
            className="text-lg md:text-xl font-bold"
            style={{ color: "#2C241B" }}
          >
            {items.length}
          </p>
          <p
            className="text-[10px] md:text-xs"
            style={{ color: "rgba(44,36,27,0.45)" }}
          >
            Total Bahan
          </p>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(16,185,129,0.12)" }}
            >
              <Package size={14} color="#10B981" />
            </div>
          </div>
          <p
            className="text-lg md:text-xl font-bold"
            style={{ color: "#10B981" }}
          >
            {items.filter((i) => !i.isLow).length}
          </p>
          <p
            className="text-[10px] md:text-xs"
            style={{ color: "rgba(44,36,27,0.45)" }}
          >
            Stok Aman
          </p>
        </div>
        <div
          className="rounded-2xl p-4"
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(245,158,11,0.12)" }}
            >
              <AlertTriangle size={14} color="#F59E0B" />
            </div>
          </div>
          <p
            className="text-lg md:text-xl font-bold"
            style={{ color: "#F59E0B" }}
          >
            {lowStockItems.length}
          </p>
          <p
            className="text-[10px] md:text-xs"
            style={{ color: "rgba(44,36,27,0.45)" }}
          >
            Stok Kritis
          </p>
        </div>
      </div>

      {/* Ingredient Cards (mobile-friendly) */}
      <div className="space-y-3 pb-20">
        {filteredItems.length === 0 && (
          <div
            className="text-center py-12 rounded-2xl"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <Package
              size={40}
              className="mx-auto mb-3"
              style={{ color: "rgba(44,36,27,0.15)" }}
            />
            <p
              className="text-sm"
              style={{ color: "rgba(44,36,27,0.4)" }}
            >
              {search
                ? "Tidak ditemukan bahan baku yang cocok"
                : "Belum ada bahan baku"}
            </p>
          </div>
        )}

        {filteredItems.map((ing, idx) => (
          <motion.div
            key={ing.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.03 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#FFFFFF",
              border: ing.isLow
                ? "1px solid rgba(245,158,11,0.3)"
                : "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <div className="p-4">
              {/* Top row: name + status */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: ing.isLow
                        ? "rgba(245,158,11,0.1)"
                        : "rgba(192,139,92,0.1)",
                    }}
                  >
                    {UNIT_ICONS[ing.unit.toLowerCase()] || (
                      <Package size={14} color="#C08B5C" />
                    )}
                  </div>
                  <div>
                    <p
                      className="font-semibold text-sm"
                      style={{ color: "#2C241B" }}
                    >
                      {ing.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "rgba(44,36,27,0.45)" }}
                    >
                      {ing.supplier || "Tanpa supplier"}
                    </p>
                  </div>
                </div>
                {ing.isLow ? (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: "rgba(245,158,11,0.12)",
                      color: "#F59E0B",
                    }}
                  >
                    Kritis
                  </span>
                ) : (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{
                      background: "rgba(16,185,129,0.1)",
                      color: "#10B981",
                    }}
                  >
                    Aman
                  </span>
                )}
              </div>

              {/* Stock info row */}
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div
                  className="rounded-xl p-2.5"
                  style={{ background: "#F8F5F2" }}
                >
                  <p
                    className="text-[10px] mb-0.5"
                    style={{ color: "rgba(44,36,27,0.4)" }}
                  >
                    Stok
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{
                      color: ing.isLow ? "#F59E0B" : "#10B981",
                    }}
                  >
                    {parseFloat(ing.stock).toLocaleString("id-ID")}{" "}
                    <span className="text-[10px] font-normal">
                      {ing.unit}
                    </span>
                  </p>
                </div>
                <div
                  className="rounded-xl p-2.5"
                  style={{ background: "#F8F5F2" }}
                >
                  <p
                    className="text-[10px] mb-0.5"
                    style={{ color: "rgba(44,36,27,0.4)" }}
                  >
                    Min. Stok
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "rgba(44,36,27,0.7)" }}
                  >
                    {parseFloat(ing.minStock).toLocaleString("id-ID")}{" "}
                    <span className="text-[10px] font-normal">
                      {ing.unit}
                    </span>
                  </p>
                </div>
                <div
                  className="rounded-xl p-2.5"
                  style={{ background: "#F8F5F2" }}
                >
                  <p
                    className="text-[10px] mb-0.5"
                    style={{ color: "rgba(44,36,27,0.4)" }}
                  >
                    Harga/Unit
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{ color: "rgba(44,36,27,0.7)" }}
                  >
                    {formatCurrency(parseFloat(ing.costPerUnit))}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setAdjustingId(
                      adjustingId === ing.id ? null : ing.id
                    )
                  }
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: "rgba(192,139,92,0.1)",
                    color: "#C08B5C",
                    border: "1px solid rgba(192,139,92,0.2)",
                  }}
                >
                  <ArrowUpDown size={12} />
                  Sesuaikan Stok
                </button>
                <button
                  onClick={() => openEdit(ing)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(192,139,92,0.08)" }}
                >
                  <Edit2 size={14} color="#C08B5C" />
                </button>
                <button
                  onClick={() => setConfirmDeleteId(ing.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(239,68,68,0.06)" }}
                >
                  <Trash2 size={14} color="#f87171" />
                </button>
              </div>
            </div>

            {/* Adjust panel */}
            <AnimatePresence>
              {adjustingId === ing.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="p-4 space-y-3"
                    style={{
                      background: "#F1EBE4",
                      borderTop: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Jumlah"
                        value={adjustQty}
                        onChange={(e) => setAdjustQty(e.target.value)}
                        className="pos-input"
                        style={{ fontSize: "13px", padding: "8px 12px" }}
                      />
                      <input
                        type="text"
                        placeholder="Keterangan"
                        value={adjustNote}
                        onChange={(e) => setAdjustNote(e.target.value)}
                        className="pos-input"
                        style={{ fontSize: "13px", padding: "8px 12px" }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAdjust(ing.id, "purchase")}
                        className="px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: "rgba(16,185,129,0.15)",
                          color: "#10B981",
                        }}
                      >
                        + Masuk
                      </button>
                      <button
                        onClick={() => handleAdjust(ing.id, "waste")}
                        className="px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: "rgba(239,68,68,0.12)",
                          color: "#f87171",
                        }}
                      >
                        − Waste
                      </button>
                      <button
                        onClick={() =>
                          handleAdjust(ing.id, "adjustment")
                        }
                        className="px-3 py-2.5 rounded-xl text-xs font-semibold transition-all"
                        style={{
                          background: "rgba(59,130,246,0.12)",
                          color: "#60a5fa",
                        }}
                      >
                        ± Koreksi
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={reset}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2
                  className="text-lg font-bold"
                  style={{ color: "#2C241B" }}
                >
                  {editId ? "Edit Bahan Baku" : "Tambah Bahan Baku"}
                </h2>
                <button
                  onClick={reset}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.04)" }}
                >
                  <X size={16} color="rgba(44,36,27,0.5)" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "rgba(44,36,27,0.7)" }}
                  >
                    Nama Bahan
                  </label>
                  <input
                    type="text"
                    value={fName}
                    onChange={(e) => setFName(e.target.value)}
                    placeholder="Kopi Arabica"
                    className="pos-input"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "rgba(44,36,27,0.7)" }}
                    >
                      Satuan
                    </label>
                    <input
                      type="text"
                      value={fUnit}
                      onChange={(e) => setFUnit(e.target.value)}
                      placeholder="gr, ml, pcs"
                      className="pos-input"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                  {!editId && (
                    <div>
                      <label
                        className="block text-sm font-medium mb-1.5"
                        style={{ color: "rgba(44,36,27,0.7)" }}
                      >
                        Stok Awal
                      </label>
                      <input
                        type="text"
                        value={fStock}
                        onChange={(e) => setFStock(e.target.value)}
                        className="pos-input"
                        style={{ fontSize: "13px" }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "rgba(44,36,27,0.7)" }}
                    >
                      Stok Minimum
                    </label>
                    <input
                      type="text"
                      value={fMinStock}
                      onChange={(e) => setFMinStock(e.target.value)}
                      className="pos-input"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "rgba(44,36,27,0.7)" }}
                    >
                      Harga per Unit
                    </label>
                    <input
                      type="text"
                      value={fCost}
                      onChange={(e) => setFCost(e.target.value)}
                      className="pos-input"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "rgba(44,36,27,0.7)" }}
                  >
                    Supplier (Opsional)
                  </label>
                  <input
                    type="text"
                    value={fSupplier}
                    onChange={(e) => setFSupplier(e.target.value)}
                    placeholder="Nama Supplier"
                    className="pos-input"
                    style={{ fontSize: "13px" }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={reset}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{
                    background: "rgba(0,0,0,0.04)",
                    color: "rgba(44,36,27,0.7)",
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary flex-1"
                  style={{
                    background: loading ? "#8A6A55" : "#C08B5C",
                  }}
                >
                  {loading
                    ? "Menyimpan..."
                    : editId
                    ? "Simpan"
                    : "Tambah"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        title="Hapus Bahan Baku"
        message={`Apakah Anda yakin ingin menghapus bahan baku ${
          items.find((i) => i.id === confirmDeleteId)?.name || ""
        }? Bahan baku ini akan dihapus secara permanen dari database.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
