// src/components/admin/ModifiersClient.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Search,
  ChevronDown,
  ChevronRight,
  Layers,
  ToggleLeft,
  ToggleRight,
  Loader2,
  GripVertical,
  Tag,
} from "lucide-react";
import {
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  createModifierOption,
  updateModifierOption,
  deleteModifierOption,
} from "@/server/services/modifiers";
import { formatCurrency } from "@/lib/utils/format";
import { toast } from "sonner";
import ConfirmDialog from "@/components/shared/ConfirmDialog";

// ====== Types ======

interface OptionItem {
  id: string;
  groupId: string;
  name: string;
  price: string;
  sortOrder: number;
  isActive: boolean;
}

interface GroupItem {
  id: string;
  name: string;
  description: string | null;
  isRequired: boolean;
  isMultiple: boolean;
  minSelect: number;
  maxSelect: number;
  sortOrder: number;
  isActive: boolean;
  options: OptionItem[];
}

interface ModifiersClientProps {
  groups: GroupItem[];
}

// ====== Component ======

export default function ModifiersClient({ groups: initialGroups }: ModifiersClientProps) {
  const [groups, setGroups] = useState<GroupItem[]>(initialGroups);
  const [search, setSearch] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(initialGroups.map((g) => g.id)));

  // Group form state
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);
  const [gName, setGName] = useState("");
  const [gDesc, setGDesc] = useState("");
  const [gRequired, setGRequired] = useState(false);
  const [gMultiple, setGMultiple] = useState(false);
  const [gMinSelect, setGMinSelect] = useState(0);
  const [gMaxSelect, setGMaxSelect] = useState(1);
  const [gSortOrder, setGSortOrder] = useState(0);

  // Option form state
  const [showOptionForm, setShowOptionForm] = useState<string | null>(null); // groupId
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [optionLoading, setOptionLoading] = useState(false);
  const [oName, setOName] = useState("");
  const [oPrice, setOPrice] = useState("");
  const [oSortOrder, setOSortOrder] = useState(0);

  // Deleting state
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [deletingOptionId, setDeletingOptionId] = useState<string | null>(null);
  
  const [confirmDeleteGroupId, setConfirmDeleteGroupId] = useState<string | null>(null);
  const [confirmDeleteOption, setConfirmDeleteOption] = useState<{ groupId: string; optionId: string } | null>(null);
  const [deleteConfirmLoading, setDeleteConfirmLoading] = useState(false);

  // Filter
  const filtered = groups.filter(
    (g) => !search || g.name.toLowerCase().includes(search.toLowerCase())
  );

  // Toggle expand group
  const toggleExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // ====== Group CRUD ======

  const resetGroupForm = () => {
    setGName("");
    setGDesc("");
    setGRequired(false);
    setGMultiple(false);
    setGMinSelect(0);
    setGMaxSelect(1);
    setGSortOrder(0);
    setEditingGroupId(null);
    setShowGroupForm(false);
  };

  const openEditGroup = (group: GroupItem) => {
    setGName(group.name);
    setGDesc(group.description || "");
    setGRequired(group.isRequired);
    setGMultiple(group.isMultiple);
    setGMinSelect(group.minSelect);
    setGMaxSelect(group.maxSelect);
    setGSortOrder(group.sortOrder);
    setEditingGroupId(group.id);
    setShowGroupForm(true);
  };

  const handleGroupSubmit = async () => {
    if (!gName.trim()) {
      toast.error("Nama grup harus diisi");
      return;
    }
    setGroupLoading(true);
    try {
      if (editingGroupId) {
        const res = await updateModifierGroup(editingGroupId, {
          name: gName.trim(),
          description: gDesc.trim() || undefined,
          isRequired: gRequired,
          isMultiple: gMultiple,
          minSelect: gMinSelect,
          maxSelect: gMaxSelect,
          sortOrder: gSortOrder,
        });
        if (res.success) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === editingGroupId
                ? {
                    ...g,
                    name: gName.trim(),
                    description: gDesc.trim() || null,
                    isRequired: gRequired,
                    isMultiple: gMultiple,
                    minSelect: gMinSelect,
                    maxSelect: gMaxSelect,
                    sortOrder: gSortOrder,
                  }
                : g
            )
          );
          toast.success("Grup modifier berhasil diperbarui");
        }
      } else {
        const res = await createModifierGroup({
          name: gName.trim(),
          description: gDesc.trim() || undefined,
          isRequired: gRequired,
          isMultiple: gMultiple,
          minSelect: gMinSelect,
          maxSelect: gMaxSelect,
          sortOrder: gSortOrder,
        });
        if (res.success && res.data) {
          const newGroup: GroupItem = {
            id: res.data.id,
            name: res.data.name,
            description: res.data.description,
            isRequired: res.data.isRequired,
            isMultiple: res.data.isMultiple,
            minSelect: res.data.minSelect,
            maxSelect: res.data.maxSelect,
            sortOrder: res.data.sortOrder,
            isActive: res.data.isActive,
            options: [],
          };
          setGroups((prev) => [...prev, newGroup]);
          setExpandedGroups((prev) => new Set([...prev, newGroup.id]));
          toast.success("Grup modifier berhasil ditambahkan");
        }
      }
      resetGroupForm();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setGroupLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirmDeleteGroupId) return;
    const group = groups.find((g) => g.id === confirmDeleteGroupId);
    if (group && group.options.length > 0) {
      toast.error("Hapus semua opsi terlebih dahulu sebelum menghapus grup");
      setConfirmDeleteGroupId(null);
      return;
    }
    setDeleteConfirmLoading(true);
    try {
      await deleteModifierGroup(confirmDeleteGroupId);
      setGroups((prev) => prev.filter((g) => g.id !== confirmDeleteGroupId));
      toast.success("Grup modifier berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus grup");
    } finally {
      setDeleteConfirmLoading(false);
      setConfirmDeleteGroupId(null);
    }
  };

  const handleToggleGroup = async (id: string, current: boolean) => {
    try {
      await updateModifierGroup(id, { isActive: !current });
      setGroups((prev) =>
        prev.map((g) => (g.id === id ? { ...g, isActive: !current } : g))
      );
      toast.success(`Grup ${!current ? "diaktifkan" : "dinonaktifkan"}`);
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  // ====== Option CRUD ======

  const resetOptionForm = () => {
    setOName("");
    setOPrice("");
    setOSortOrder(0);
    setEditingOptionId(null);
    setShowOptionForm(null);
  };

  const openEditOption = (option: OptionItem) => {
    setOName(option.name);
    setOPrice(option.price);
    setOSortOrder(option.sortOrder);
    setEditingOptionId(option.id);
    setShowOptionForm(option.groupId);
  };

  const handleOptionSubmit = async (groupId: string) => {
    if (!oName.trim()) {
      toast.error("Nama opsi harus diisi");
      return;
    }
    setOptionLoading(true);
    try {
      if (editingOptionId) {
        const res = await updateModifierOption(editingOptionId, {
          name: oName.trim(),
          price: oPrice || "0",
          sortOrder: oSortOrder,
        });
        if (res.success) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === groupId
                ? {
                    ...g,
                    options: g.options.map((o) =>
                      o.id === editingOptionId
                        ? { ...o, name: oName.trim(), price: oPrice || "0", sortOrder: oSortOrder }
                        : o
                    ),
                  }
                : g
            )
          );
          toast.success("Opsi modifier berhasil diperbarui");
        }
      } else {
        const res = await createModifierOption({
          groupId,
          name: oName.trim(),
          price: oPrice || "0",
          sortOrder: oSortOrder,
        });
        if (res.success && res.data) {
          setGroups((prev) =>
            prev.map((g) =>
              g.id === groupId
                ? {
                    ...g,
                    options: [
                      ...g.options,
                      {
                        id: res.data.id,
                        groupId: res.data.groupId,
                        name: res.data.name,
                        price: String(res.data.price),
                        sortOrder: res.data.sortOrder,
                        isActive: res.data.isActive,
                      },
                    ],
                  }
                : g
            )
          );
          toast.success("Opsi modifier berhasil ditambahkan");
        }
      }
      resetOptionForm();
    } catch {
      toast.error("Terjadi kesalahan");
    } finally {
      setOptionLoading(false);
    }
  };

  const handleDeleteOption = async () => {
    if (!confirmDeleteOption) return;
    const { groupId, optionId } = confirmDeleteOption;
    setDeleteConfirmLoading(true);
    try {
      await deleteModifierOption(optionId);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? { ...g, options: g.options.filter((o) => o.id !== optionId) }
            : g
        )
      );
      toast.success("Opsi modifier berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus opsi");
    } finally {
      setDeleteConfirmLoading(false);
      setConfirmDeleteOption(null);
    }
  };

  const handleToggleOption = async (groupId: string, optionId: string, current: boolean) => {
    try {
      await updateModifierOption(optionId, { isActive: !current });
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                options: g.options.map((o) =>
                  o.id === optionId ? { ...o, isActive: !current } : o
                ),
              }
            : g
        )
      );
      toast.success(`Opsi ${!current ? "diaktifkan" : "dinonaktifkan"}`);
    } catch {
      toast.error("Gagal mengubah status");
    }
  };

  // ====== Render ======

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}
          >
            Modifier
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(44,36,27,0.5)" }}>
            Kelola grup modifier dan opsi untuk produk (ukuran, level gula, topping, dll.)
          </p>
        </div>
        <button
          onClick={() => {
            resetGroupForm();
            setShowGroupForm(true);
          }}
          className="btn-primary px-5"
          style={{ height: 44 }}
        >
          <Plus size={16} /> Tambah Grup
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          color="rgba(44,36,27,0.35)"
        />
        <input
          type="text"
          placeholder="Cari grup modifier..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pos-input pl-9"
          style={{ fontSize: "13px" }}
        />
      </div>

      {/* Group Form Modal */}
      <AnimatePresence>
        {showGroupForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={resetGroupForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-3xl p-6 w-full max-w-lg"
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
                  {editingGroupId ? "Edit Grup Modifier" : "Tambah Grup Modifier"}
                </h2>
                <button
                  onClick={resetGroupForm}
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,0.04)" }}
                >
                  <X size={16} color="rgba(44,36,27,0.5)" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Nama */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "rgba(44,36,27,0.7)" }}
                  >
                    Nama Grup
                  </label>
                  <input
                    type="text"
                    value={gName}
                    onChange={(e) => setGName(e.target.value)}
                    placeholder="Contoh: Ukuran, Level Gula, Topping"
                    className="pos-input"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                {/* Deskripsi */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1.5"
                    style={{ color: "rgba(44,36,27,0.7)" }}
                  >
                    Deskripsi
                  </label>
                  <input
                    type="text"
                    value={gDesc}
                    onChange={(e) => setGDesc(e.target.value)}
                    placeholder="Opsional"
                    className="pos-input"
                    style={{ fontSize: "13px" }}
                  />
                </div>

                {/* Toggle Row */}
                <div className="grid grid-cols-2 gap-4">
                  <label
                    className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3"
                    style={{
                      background: gRequired ? "rgba(192,139,92,0.08)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${gRequired ? "rgba(192,139,92,0.2)" : "rgba(0,0,0,0.06)"}`,
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={gRequired}
                      onChange={(e) => setGRequired(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        background: gRequired ? "#C08B5C" : "rgba(0,0,0,0.06)",
                        transition: "all 0.2s",
                      }}
                    >
                      {gRequired && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#2C241B" }}>Wajib</p>
                      <p className="text-xs" style={{ color: "rgba(44,36,27,0.4)" }}>Harus dipilih</p>
                    </div>
                  </label>

                  <label
                    className="flex items-center gap-3 cursor-pointer rounded-xl px-4 py-3"
                    style={{
                      background: gMultiple ? "rgba(192,139,92,0.08)" : "rgba(0,0,0,0.02)",
                      border: `1px solid ${gMultiple ? "rgba(192,139,92,0.2)" : "rgba(0,0,0,0.06)"}`,
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={gMultiple}
                      onChange={(e) => setGMultiple(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                      style={{
                        background: gMultiple ? "#C08B5C" : "rgba(0,0,0,0.06)",
                        transition: "all 0.2s",
                      }}
                    >
                      {gMultiple && (
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "#2C241B" }}>Multi-pilih</p>
                      <p className="text-xs" style={{ color: "rgba(44,36,27,0.4)" }}>Pilih banyak</p>
                    </div>
                  </label>
                </div>

                {/* Min/Max Select + Sort */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "rgba(44,36,27,0.7)" }}
                    >
                      Min. Pilihan
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={gMinSelect}
                      onChange={(e) => setGMinSelect(parseInt(e.target.value) || 0)}
                      className="pos-input"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "rgba(44,36,27,0.7)" }}
                    >
                      Maks. Pilihan
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={gMaxSelect}
                      onChange={(e) => setGMaxSelect(parseInt(e.target.value) || 1)}
                      className="pos-input"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "rgba(44,36,27,0.7)" }}
                    >
                      Urutan
                    </label>
                    <input
                      type="number"
                      value={gSortOrder}
                      onChange={(e) => setGSortOrder(parseInt(e.target.value) || 0)}
                      className="pos-input"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetGroupForm}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(0,0,0,0.04)", color: "rgba(44,36,27,0.7)" }}
                >
                  Batal
                </button>
                <button
                  onClick={handleGroupSubmit}
                  disabled={groupLoading}
                  className="btn-primary flex-1"
                  style={{ background: groupLoading ? "#8A6A55" : "#C08B5C" }}
                >
                  {groupLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : editingGroupId ? (
                    "Simpan Perubahan"
                  ) : (
                    "Tambah Grup"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Option Form Modal */}
      <AnimatePresence>
        {showOptionForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.3)" }}
            onClick={resetOptionForm}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="rounded-3xl p-6 w-full max-w-md"
              style={{
                background: "#FFFFFF",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold" style={{ color: "#2C241B" }}>
                  {editingOptionId ? "Edit Opsi" : "Tambah Opsi"}
                </h2>
                <button
                  onClick={resetOptionForm}
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
                    Nama Opsi
                  </label>
                  <input
                    type="text"
                    value={oName}
                    onChange={(e) => setOName(e.target.value)}
                    placeholder="Contoh: Large, Extra Shot, Boba"
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
                      Harga Tambahan (Rp)
                    </label>
                    <input
                      type="text"
                      value={oPrice}
                      onChange={(e) => setOPrice(e.target.value)}
                      placeholder="0"
                      className="pos-input"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm font-medium mb-1.5"
                      style={{ color: "rgba(44,36,27,0.7)" }}
                    >
                      Urutan
                    </label>
                    <input
                      type="number"
                      value={oSortOrder}
                      onChange={(e) => setOSortOrder(parseInt(e.target.value) || 0)}
                      className="pos-input"
                      style={{ fontSize: "13px" }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetOptionForm}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "rgba(0,0,0,0.04)", color: "rgba(44,36,27,0.7)" }}
                >
                  Batal
                </button>
                <button
                  onClick={() => handleOptionSubmit(showOptionForm)}
                  disabled={optionLoading}
                  className="btn-primary flex-1"
                  style={{ background: optionLoading ? "#8A6A55" : "#C08B5C" }}
                >
                  {optionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : editingOptionId ? (
                    "Simpan Perubahan"
                  ) : (
                    "Tambah Opsi"
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Groups List */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Layers size={44} className="mx-auto mb-3" color="rgba(44,36,27,0.12)" />
          <p className="text-sm" style={{ color: "rgba(44,36,27,0.4)" }}>
            {search ? "Tidak ada grup modifier yang sesuai" : "Belum ada grup modifier"}
          </p>
          {!search && (
            <button
              onClick={() => {
                resetGroupForm();
                setShowGroupForm(true);
              }}
              className="mt-4 text-sm font-medium px-4 py-2 rounded-xl"
              style={{ color: "#C08B5C", background: "rgba(192,139,92,0.08)" }}
            >
              <Plus size={14} className="inline mr-1" />
              Buat grup pertama
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((group) => {
            const isExpanded = expandedGroups.has(group.id);
            const activeOptions = group.options.filter((o) => o.isActive).length;

            return (
              <motion.div
                key={group.id}
                layout
                className="rounded-2xl overflow-hidden"
                style={{
                  background: group.isActive ? "#FFFFFF" : "rgba(0,0,0,0.01)",
                  border: `1px solid ${group.isActive ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.04)"}`,
                  opacity: group.isActive ? 1 : 0.7,
                }}
              >
                {/* Group Header */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer select-none"
                  onClick={() => toggleExpand(group.id)}
                  style={{
                    background: isExpanded ? "rgba(192,139,92,0.03)" : "transparent",
                    borderBottom: isExpanded ? "1px solid rgba(0,0,0,0.04)" : "none",
                    transition: "background 0.2s",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      animate={{ rotate: isExpanded ? 0 : -90 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown size={16} color="rgba(44,36,27,0.35)" />
                    </motion.div>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(192,139,92,0.08)",
                      }}
                    >
                      <Layers size={18} color="#C08B5C" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className="text-sm font-bold"
                          style={{ color: "#2C241B" }}
                        >
                          {group.name}
                        </h3>
                        {group.isRequired && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(239,68,68,0.08)",
                              color: "#EF4444",
                              border: "1px solid rgba(239,68,68,0.15)",
                            }}
                          >
                            Wajib
                          </span>
                        )}
                        {group.isMultiple && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{
                              background: "rgba(59,130,246,0.08)",
                              color: "#3B82F6",
                              border: "1px solid rgba(59,130,246,0.15)",
                            }}
                          >
                            Multi
                          </span>
                        )}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: "rgba(44,36,27,0.45)" }}>
                        {activeOptions} opsi aktif
                        {group.description && ` · ${group.description}`}
                        {` · Pilih ${group.minSelect}–${group.maxSelect}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleToggleGroup(group.id, group.isActive)}
                      title={group.isActive ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {group.isActive ? (
                        <ToggleRight size={22} color="#10B981" />
                      ) : (
                        <ToggleLeft size={22} color="rgba(44,36,27,0.25)" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditGroup(group)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(192,139,92,0.1)" }}
                    >
                      <Edit2 size={13} color="#C08B5C" />
                    </button>
                    <button
                      onClick={() => {
                        if (group.options.length > 0) {
                          toast.error("Hapus semua opsi terlebih dahulu sebelum menghapus grup");
                          return;
                        }
                        setConfirmDeleteGroupId(group.id);
                      }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: "rgba(239,68,68,0.08)" }}
                    >
                      <Trash2 size={13} color="#f87171" />
                    </button>
                  </div>
                </div>

                {/* Options List */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-4 pt-2">
                        {/* Options */}
                        {group.options.length === 0 ? (
                          <div
                            className="text-center py-6 rounded-xl"
                            style={{ background: "rgba(0,0,0,0.015)" }}
                          >
                            <Tag
                              size={24}
                              className="mx-auto mb-2"
                              color="rgba(44,36,27,0.12)"
                            />
                            <p
                              className="text-xs"
                              style={{ color: "rgba(44,36,27,0.35)" }}
                            >
                              Belum ada opsi
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {group.options.map((option) => (
                              <motion.div
                                key={option.id}
                                layout
                                className="flex items-center justify-between px-4 py-3 rounded-xl"
                                style={{
                                  background: option.isActive
                                    ? "rgba(0,0,0,0.015)"
                                    : "rgba(0,0,0,0.01)",
                                  border: `1px solid ${option.isActive ? "rgba(0,0,0,0.04)" : "rgba(0,0,0,0.02)"}`,
                                  opacity: option.isActive ? 1 : 0.55,
                                }}
                              >
                                <div className="flex items-center gap-3">
                                  <GripVertical
                                    size={14}
                                    color="rgba(44,36,27,0.15)"
                                  />
                                  <div
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{
                                      background: "rgba(192,139,92,0.06)",
                                    }}
                                  >
                                    <Tag size={12} color="#C08B5C" />
                                  </div>
                                  <div>
                                    <p
                                      className="text-sm font-medium"
                                      style={{ color: "#2C241B" }}
                                    >
                                      {option.name}
                                    </p>
                                    <p
                                      className="text-xs"
                                      style={{ color: "rgba(44,36,27,0.45)" }}
                                    >
                                      {parseFloat(option.price) > 0
                                        ? `+${formatCurrency(parseFloat(option.price))}`
                                        : "Gratis"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() =>
                                      handleToggleOption(
                                        group.id,
                                        option.id,
                                        option.isActive
                                      )
                                    }
                                    title={
                                      option.isActive
                                        ? "Nonaktifkan"
                                        : "Aktifkan"
                                    }
                                  >
                                    {option.isActive ? (
                                      <ToggleRight
                                        size={18}
                                        color="#10B981"
                                      />
                                    ) : (
                                      <ToggleLeft
                                        size={18}
                                        color="rgba(44,36,27,0.25)"
                                      />
                                    )}
                                  </button>
                                  <button
                                    onClick={() => openEditOption(option)}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{
                                      background: "rgba(192,139,92,0.1)",
                                    }}
                                  >
                                    <Edit2 size={11} color="#C08B5C" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      setConfirmDeleteOption({ groupId: group.id, optionId: option.id })
                                    }
                                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                                    style={{
                                      background: "rgba(239,68,68,0.06)",
                                    }}
                                  >
                                    <Trash2 size={11} color="#f87171" />
                                  </button>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Add Option Button */}
                        <button
                          onClick={() => {
                            resetOptionForm();
                            setShowOptionForm(group.id);
                          }}
                          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
                          style={{
                            color: "#C08B5C",
                            background: "rgba(192,139,92,0.06)",
                            border: "1px dashed rgba(192,139,92,0.25)",
                            transition: "all 0.2s",
                          }}
                        >
                          <Plus size={14} />
                          Tambah Opsi
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
      <ConfirmDialog
        isOpen={!!confirmDeleteGroupId}
        onClose={() => setConfirmDeleteGroupId(null)}
        onConfirm={handleDeleteGroup}
        isLoading={deleteConfirmLoading}
        title="Hapus Grup Modifier"
        message={`Apakah Anda yakin ingin menghapus grup modifier ${groups.find((g) => g.id === confirmDeleteGroupId)?.name || ""}? Grup ini akan dihapus secara permanen dari database.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />

      <ConfirmDialog
        isOpen={!!confirmDeleteOption}
        onClose={() => setConfirmDeleteOption(null)}
        onConfirm={handleDeleteOption}
        isLoading={deleteConfirmLoading}
        title="Hapus Opsi Modifier"
        message={`Apakah Anda yakin ingin menghapus opsi modifier ${(() => {
          if (!confirmDeleteOption) return "";
          const group = groups.find((g) => g.id === confirmDeleteOption.groupId);
          return group?.options.find((o) => o.id === confirmDeleteOption.optionId)?.name || "";
        })()}? Opsi ini akan dihapus secara permanen.`}
        confirmText="Ya, Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
