"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, X, Search, GripVertical } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/server/services/categories";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

interface CategoriesClientProps {
  categories: CategoryItem[];
}

export default function CategoriesClient({ categories: initialCategories }: CategoriesClientProps) {
  const [items, setItems] = useState<CategoryItem[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formSort, setFormSort] = useState(0);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string|null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const filtered = items.filter(
    (c) => !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setFormName("");
    setFormSlug("");
    setFormDesc("");
    setFormSort(0);
    setEditingId(null);
    setShowForm(false);
  };

  const openEdit = (cat: CategoryItem) => {
    setFormName(cat.name);
    setFormSlug(cat.slug);
    setFormDesc(cat.description || "");
    setFormSort(cat.sortOrder);
    setEditingId(cat.id);
    setShowForm(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim() || !formSlug.trim()) {
      toast.error("Nama dan slug harus diisi");
      return;
    }
    setLoading(true);
    try {
      if (editingId) {
        const res = await updateCategory(editingId, {
          name: formName,
          slug: formSlug,
          description: formDesc || undefined,
          sortOrder: formSort,
        });
        if (res.success) {
          setItems((prev) =>
            prev.map((c) =>
              c.id === editingId
                ? { ...c, name: formName, slug: formSlug, description: formDesc, sortOrder: formSort }
                : c
            )
          );
          toast.success("Kategori berhasil diperbarui");
        }
      } else {
        const res = await createCategory({
          name: formName,
          slug: formSlug,
          description: formDesc || undefined,
          sortOrder: formSort,
        });
        if (res.success && res.data) {
          setItems((prev) => [
            ...prev,
            {
              id: res.data.id,
              name: res.data.name,
              slug: res.data.slug,
              description: res.data.description,
              sortOrder: res.data.sortOrder,
              isActive: res.data.isActive,
              productCount: 0,
            },
          ]);
          toast.success("Kategori berhasil ditambahkan");
        }
      }
      resetForm();
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
      await deleteCategory(confirmDeleteId);
      setItems((prev) => prev.filter((c) => c.id !== confirmDeleteId));
      toast.success("Kategori berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus kategori");
    } finally {
      setDeleteLoading(false);
      setConfirmDeleteId(null);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await updateCategory(id, { isActive: !current });
      setItems((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c))
      );
      toast.success(`Kategori ${!current ? "diaktifkan" : "dinonaktifkan"}`);
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>
          Kategori Produk
        </h1>
        <button onClick={() => setShowForm(true)} className="btn-primary px-5" style={{ height: 44 }}>
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="rgba(44,36,27,0.35)" />
        <input
          type="text"
          placeholder="Cari kategori..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pos-input pl-9"
          style={{ fontSize: "13px" }}
        />
      </div>

      {/* Modal Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={resetForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-3xl p-6 w-full max-w-md"
              style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: "#2C241B" }}>
                  {editingId ? "Edit Kategori" : "Tambah Kategori"}
                </h2>
                <button onClick={resetForm} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,0,0,0.04)" }}>
                  <X size={16} color="rgba(44,36,27,0.5)" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Nama</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingId) setFormSlug(generateSlug(e.target.value));
                    }}
                    placeholder="Contoh: Coffee"
                    className="pos-input"
                    style={{ fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Slug</label>
                  <input
                    type="text"
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="coffee"
                    className="pos-input"
                    style={{ fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Deskripsi</label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Opsional"
                    className="pos-input"
                    style={{ fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "rgba(44,36,27,0.7)" }}>Urutan</label>
                  <input
                    type="number"
                    value={formSort}
                    onChange={(e) => setFormSort(parseInt(e.target.value) || 0)}
                    className="pos-input"
                    style={{ fontSize: "13px", width: 100 }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={resetForm} className="flex-1 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "rgba(0,0,0,0.04)", color: "rgba(44,36,27,0.7)" }}>
                  Batal
                </button>
                <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1" style={{ background: loading ? "#8A6A55" : "#C08B5C" }}>
                  {loading ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
        <table className="pos-table">
          <thead>
            <tr>
              <th>Urutan</th>
              <th>Nama</th>
              <th>Slug</th>
              <th>Deskripsi</th>
              <th>Jumlah Produk</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((cat) => (
              <tr key={cat.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <GripVertical size={14} color="rgba(44,36,27,0.2)" />
                    <span style={{ color: "rgba(44,36,27,0.5)" }}>{cat.sortOrder}</span>
                  </div>
                </td>
                <td className="font-semibold" style={{ color: "#2C241B" }}>{cat.name}</td>
                <td>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(192,139,92,0.08)", color: "#C08B5C" }}>
                    {cat.slug}
                  </span>
                </td>
                <td className="text-sm" style={{ color: "rgba(44,36,27,0.5)" }}>{cat.description || "—"}</td>
                <td>
                  <span className="text-sm font-semibold" style={{ color: "#2C241B" }}>{cat.productCount}</span>
                </td>
                <td>
                  <button onClick={() => handleToggleActive(cat.id, cat.isActive)}>
                    {cat.isActive ? (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>Aktif</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>Nonaktif</span>
                    )}
                  </button>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(cat)} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(192,139,92,0.1)" }}>
                      <Edit2 size={13} color="#C08B5C" />
                    </button>
                    <button
                      onClick={() => {
                        if (cat.productCount > 0) {
                          toast.error("Tidak bisa menghapus kategori yang masih memiliki produk");
                          return;
                        }
                        setConfirmDeleteId(cat.id);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(239,68,68,0.08)" }}
                    >
                      <Trash2 size={13} color="#f87171" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8" style={{ color: "rgba(44,36,27,0.3)" }}>
                  Tidak ada kategori ditemukan
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deleteLoading}
        title="Hapus Kategori"
        message={`Apakah Anda yakin ingin menghapus kategori ${items.find(c => c.id === confirmDeleteId)?.name || ""}? Kategori ini akan dihapus secara permanen dari database.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
