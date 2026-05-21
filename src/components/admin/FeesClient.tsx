// src/components/admin/FeesClient.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Percent,
  DollarSign,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { createFee, updateFee, deleteFee } from "@/server/services/fees";
import { toast } from "sonner";

interface Fee {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: string;
  isActive: boolean;
  createdAt: Date | string;
}

interface FeesClientProps {
  fees: Fee[];
}

export default function FeesClient({ fees: initialFees }: FeesClientProps) {
  const [fees, setFees] = useState(initialFees);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<"percentage" | "fixed">("percentage");
  const [formValue, setFormValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setFormName("");
    setFormType("percentage");
    setFormValue("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formValue) {
      toast.error("Nama dan nilai wajib diisi");
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        const result = await updateFee(editingId, {
          name: formName.trim(),
          type: formType,
          value: parseFloat(formValue),
        });
        if (result.success) {
          setFees((prev) =>
            prev.map((f) => (f.id === editingId ? { ...f, ...result.data } : f))
          );
          toast.success("Biaya berhasil diperbarui");
        }
      } else {
        const result = await createFee({
          name: formName.trim(),
          type: formType,
          value: parseFloat(formValue),
        });
        if (result.success && result.data) {
          setFees((prev) => [...prev, result.data as Fee]);
          toast.success("Biaya berhasil ditambahkan");
        }
      }
      resetForm();
    } catch {
      toast.error("Gagal menyimpan biaya");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteFee(id);
      if (result.success) {
        setFees((prev) => prev.filter((f) => f.id !== id));
        toast.success("Biaya berhasil dihapus");
      }
    } catch {
      toast.error("Gagal menghapus biaya");
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      const result = await updateFee(id, { isActive: !isActive });
      if (result.success) {
        setFees((prev) =>
          prev.map((f) => (f.id === id ? { ...f, isActive: !isActive } : f))
        );
        toast.success(isActive ? "Biaya dinonaktifkan" : "Biaya diaktifkan");
      }
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const startEdit = (fee: Fee) => {
    setEditingId(fee.id);
    setFormName(fee.name);
    setFormType(fee.type);
    setFormValue(String(fee.value));
    setShowForm(true);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "Playfair Display, serif", color: "#2C241B" }}
          >
            Biaya Tambahan
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(44,36,27,0.5)" }}>
            Kelola pajak, service charge, dan biaya lainnya
          </p>
        </div>
        {!showForm && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn-primary text-sm flex items-center gap-2"
            style={{ background: "#C08B5C" }}
          >
            <Plus size={16} />
            Tambah Biaya
          </motion.button>
        )}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.9)",
                border: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 4px 20px -4px rgba(0,0,0,0.04)",
              }}
            >
              <h3
                className="font-semibold text-sm mb-4"
                style={{ color: "#2C241B" }}
              >
                {editingId ? "Edit Biaya" : "Tambah Biaya Baru"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    className="text-xs font-medium mb-1 block"
                    style={{ color: "rgba(44,36,27,0.6)" }}
                  >
                    Nama
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="PPN 12%"
                    className="pos-input"
                  />
                </div>
                <div>
                  <label
                    className="text-xs font-medium mb-1 block"
                    style={{ color: "rgba(44,36,27,0.6)" }}
                  >
                    Tipe
                  </label>
                  <select
                    value={formType}
                    onChange={(e) =>
                      setFormType(e.target.value as "percentage" | "fixed")
                    }
                    className="pos-input"
                  >
                    <option value="percentage">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>
                <div>
                  <label
                    className="text-xs font-medium mb-1 block"
                    style={{ color: "rgba(44,36,27,0.6)" }}
                  >
                    Nilai {formType === "percentage" ? "(%)" : "(Rp)"}
                  </label>
                  <input
                    type="number"
                    value={formValue}
                    onChange={(e) => setFormValue(e.target.value)}
                    placeholder={formType === "percentage" ? "12" : "5000"}
                    step={formType === "percentage" ? "0.01" : "100"}
                    className="pos-input"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary text-sm px-5"
                  style={{ background: "#C08B5C" }}
                >
                  {loading ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : editingId ? (
                    "Simpan"
                  ) : (
                    "Tambah"
                  )}
                </button>
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm rounded-lg"
                  style={{
                    color: "rgba(44,36,27,0.5)",
                    background: "rgba(0,0,0,0.04)",
                  }}
                >
                  Batal
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fees List */}
      {fees.length === 0 ? (
        <div className="text-center py-20">
          <Percent
            size={40}
            className="mx-auto mb-3"
            color="rgba(44,36,27,0.15)"
          />
          <p className="text-sm" style={{ color: "rgba(44,36,27,0.4)" }}>
            Belum ada biaya tambahan
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {fees.map((fee) => (
            <motion.div
              key={fee.id}
              layout
              className="rounded-xl px-5 py-4 flex items-center justify-between"
              style={{
                background: fee.isActive
                  ? "rgba(255,255,255,0.9)"
                  : "rgba(0,0,0,0.02)",
                border: `1px solid ${fee.isActive ? "rgba(0,0,0,0.07)" : "rgba(0,0,0,0.04)"}`,
                opacity: fee.isActive ? 1 : 0.6,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      fee.type === "percentage"
                        ? "rgba(59,130,246,0.1)"
                        : "rgba(16,185,129,0.1)",
                  }}
                >
                  {fee.type === "percentage" ? (
                    <Percent size={16} color="#3B82F6" />
                  ) : (
                    <DollarSign size={16} color="#10B981" />
                  )}
                </div>
                <div>
                  <p
                    className="font-medium text-sm"
                    style={{ color: "#2C241B" }}
                  >
                    {fee.name}
                  </p>
                  <p className="text-xs" style={{ color: "rgba(44,36,27,0.5)" }}>
                    {fee.type === "percentage"
                      ? `${parseFloat(String(fee.value))}%`
                      : `Rp ${parseFloat(String(fee.value)).toLocaleString("id-ID")}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggle(fee.id, fee.isActive)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  title={fee.isActive ? "Nonaktifkan" : "Aktifkan"}
                >
                  {fee.isActive ? (
                    <ToggleRight size={20} color="#10B981" />
                  ) : (
                    <ToggleLeft size={20} color="rgba(44,36,27,0.3)" />
                  )}
                </button>
                <button
                  onClick={() => startEdit(fee)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ color: "rgba(44,36,27,0.4)" }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(fee.id)}
                  disabled={deletingId === fee.id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{
                    color: deletingId === fee.id ? "rgba(44,36,27,0.2)" : "#EF4444",
                  }}
                >
                  {deletingId === fee.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
