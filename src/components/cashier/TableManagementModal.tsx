// src/components/cashier/TableManagementModal.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Pencil, Trash2, Loader2, Users } from "lucide-react";
import { createTable, updateTable, deleteTable } from "@/server/services/tables";
import { toast } from "sonner";

interface TableItem {
  id: string;
  code: string;
  name: string;
}

interface TableManagementModalProps {
  tables: TableItem[];
  onClose: () => void;
  onTablesChange: (tables: TableItem[]) => void;
}

export default function TableManagementModal({
  tables,
  onClose,
  onTablesChange,
}: TableManagementModalProps) {
  const [localTables, setLocalTables] = useState(tables);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formCapacity, setFormCapacity] = useState(4);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setFormCode("");
    setFormName("");
    setFormCapacity(4);
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleAdd = async () => {
    if (!formCode.trim() || !formName.trim()) {
      toast.error("Kode dan nama meja wajib diisi");
      return;
    }
    setLoading(true);
    try {
      const result = await createTable({
        code: formCode.trim(),
        name: formName.trim(),
        capacity: formCapacity,
      });
      if (result.success && result.data) {
        const newTable = { id: result.data.id, code: result.data.code, name: result.data.name };
        const updated = [...localTables, newTable];
        setLocalTables(updated);
        onTablesChange(updated);
        toast.success("Meja berhasil ditambahkan");
        resetForm();
      }
    } catch {
      toast.error("Gagal menambahkan meja");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !formCode.trim() || !formName.trim()) return;
    setLoading(true);
    try {
      const result = await updateTable(editingId, {
        code: formCode.trim(),
        name: formName.trim(),
        capacity: formCapacity,
      });
      if (result.success && result.data) {
        const updated = localTables.map((t) =>
          t.id === editingId
            ? { ...t, code: result.data.code, name: result.data.name }
            : t
        );
        setLocalTables(updated);
        onTablesChange(updated);
        toast.success("Meja berhasil diperbarui");
        resetForm();
      }
    } catch {
      toast.error("Gagal memperbarui meja");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteTable(id);
      if (result.success) {
        const updated = localTables.filter((t) => t.id !== id);
        setLocalTables(updated);
        onTablesChange(updated);
        toast.success("Meja berhasil dihapus");
      }
    } catch {
      toast.error("Gagal menghapus meja");
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (table: TableItem) => {
    setEditingId(table.id);
    setFormCode(table.code);
    setFormName(table.name);
    setFormCapacity(4);
    setShowAddForm(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
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
              <Users size={18} color="#C08B5C" />
            </div>
            <h3 className="font-semibold text-sm" style={{ color: "#2C241B" }}>
              Kelola Meja
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {!showAddForm && (
              <button
                onClick={() => { resetForm(); setShowAddForm(true); }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{
                  background: "rgba(192,139,92,0.1)",
                  color: "#C08B5C",
                  border: "1px solid rgba(192,139,92,0.2)",
                }}
              >
                <Plus size={14} />
                Tambah
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ color: "rgba(44,36,27,0.4)" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Add/Edit Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div
                className="px-6 py-4 space-y-3"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", background: "rgba(192,139,92,0.03)" }}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(44,36,27,0.6)" }}>
                      Kode Meja
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={(e) => setFormCode(e.target.value)}
                      placeholder="A01"
                      className="pos-input"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(44,36,27,0.6)" }}>
                      Nama Meja
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Meja A01"
                      className="pos-input"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: "rgba(44,36,27,0.6)" }}>
                    Kapasitas
                  </label>
                  <input
                    type="number"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(parseInt(e.target.value) || 1)}
                    min={1}
                    className="pos-input"
                    style={{ fontSize: "13px", width: "100px" }}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={editingId ? handleUpdate : handleAdd}
                    disabled={loading}
                    className="btn-primary text-xs px-4 py-2"
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
                    className="px-4 py-2 text-xs rounded-lg"
                    style={{ color: "rgba(44,36,27,0.5)", background: "rgba(0,0,0,0.04)" }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table List */}
        <div className="px-6 py-4 max-h-[50vh] overflow-y-auto">
          {localTables.length === 0 ? (
            <div className="text-center py-8">
              <Users size={28} className="mx-auto mb-2" color="rgba(44,36,27,0.2)" />
              <p className="text-sm" style={{ color: "rgba(44,36,27,0.4)" }}>
                Belum ada meja
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {localTables.map((table) => (
                <motion.div
                  key={table.id}
                  layout
                  className="flex items-center justify-between px-4 py-3 rounded-xl"
                  style={{
                    background: "rgba(0,0,0,0.02)",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  <div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: "#2C241B" }}
                    >
                      {table.code}
                    </span>
                    <span
                      className="text-xs ml-2"
                      style={{ color: "rgba(44,36,27,0.5)" }}
                    >
                      {table.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(table)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: "rgba(44,36,27,0.4)" }}
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(table.id)}
                      disabled={deletingId === table.id}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{ color: deletingId === table.id ? "rgba(44,36,27,0.2)" : "#EF4444" }}
                      title="Hapus"
                    >
                      {deletingId === table.id ? (
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

        {/* Footer */}
        <div
          className="px-6 py-3 flex justify-end"
          style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}
        >
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg"
            style={{ color: "rgba(44,36,27,0.6)", background: "rgba(0,0,0,0.04)" }}
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
