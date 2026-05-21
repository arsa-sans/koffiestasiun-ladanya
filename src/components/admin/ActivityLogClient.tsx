// src/components/admin/ActivityLogClient.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ActivitySquare, User, Clock, Filter, Search, FileSpreadsheet } from "lucide-react";
import { formatDateTime } from "@/lib/utils/format";

interface ActivityItem {
  id: string;
  activity: string;
  entityType: string | null;
  entityId: string | null;
  description: string | null;
  page: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
}

interface ActivityLogClientProps {
  logs: ActivityItem[];
}

const ACTIVITY_COLORS: Record<string, string> = {
  login: "#10B981",
  logout: "#6B7280",
  create: "#3B82F6",
  update: "#F59E0B",
  delete: "#EF4444",
  payment: "#8B5CF6",
  stock_change: "#C08B5C",
  status_change: "#06B6D4",
};

const ACTIVITY_LABELS: Record<string, string> = {
  login: "Login",
  logout: "Logout",
  create: "Dibuat",
  update: "Diperbarui",
  delete: "Dihapus",
  payment: "Pembayaran",
  stock_change: "Stok Berubah",
  status_change: "Status Berubah",
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  cashier: "Kasir",
  kitchen: "Dapur",
};

export default function ActivityLogClient({ logs }: ActivityLogClientProps) {
  const [filterActivity, setFilterActivity] = useState("all");
  const [search, setSearch] = useState("");

  const filteredLogs = logs.filter((log) => {
    if (filterActivity !== "all" && log.activity !== filterActivity) return false;
    if (search) {
      const s = search.toLowerCase();
      const match =
        log.description?.toLowerCase().includes(s) ||
        log.user?.name.toLowerCase().includes(s) ||
        log.entityType?.toLowerCase().includes(s);
      if (!match) return false;
    }
    return true;
  });

  const uniqueActivities = [...new Set(logs.map((l) => l.activity))];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "Playfair Display, serif", color: "#2C241B" }}
          >
            Log Aktivitas
          </h1>
          <p className="text-sm mt-1" style={{ color: "rgba(44,36,27,0.5)" }}>
            Monitoring semua aktivitas sistem
          </p>
        </div>
        <button
          onClick={() => window.open("/api/export/activity", "_blank")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium"
          style={{ background: "rgba(16,185,129,0.1)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)" }}
        >
          <FileSpreadsheet size={14} />
          Export
        </button>
      </div>

      {/* Filters */}
      <div
        className="flex items-center gap-3 mb-6 flex-wrap"
      >
        <div className="relative flex-1 max-w-xs">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            color="rgba(44,36,27,0.35)"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aktivitas..."
            className="pos-input pl-9"
            style={{ fontSize: "13px" }}
          />
        </div>
        <div className="flex items-center gap-1">
          <Filter size={14} color="rgba(44,36,27,0.4)" />
          <select
            value={filterActivity}
            onChange={(e) => setFilterActivity(e.target.value)}
            className="pos-input"
            style={{ fontSize: "13px", width: "auto", padding: "8px 12px" }}
          >
            <option value="all">Semua Aktivitas</option>
            {uniqueActivities.map((a) => (
              <option key={a} value={a}>
                {ACTIVITY_LABELS[a] || a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Log List */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-20">
          <ActivitySquare
            size={40}
            className="mx-auto mb-3"
            color="rgba(44,36,27,0.15)"
          />
          <p className="text-sm" style={{ color: "rgba(44,36,27,0.4)" }}>
            Tidak ada aktivitas ditemukan
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredLogs.map((log, i) => {
            const color = ACTIVITY_COLORS[log.activity] || "#6B7280";

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="rounded-xl px-5 py-4 flex items-start gap-4"
                style={{
                  background: "rgba(255,255,255,0.9)",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              >
                {/* Activity badge */}
                <div
                  className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                  style={{ background: color }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-md"
                      style={{
                        background: `${color}15`,
                        color: color,
                      }}
                    >
                      {ACTIVITY_LABELS[log.activity] || log.activity}
                    </span>
                    {log.entityType && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-md"
                        style={{
                          background: "rgba(0,0,0,0.04)",
                          color: "rgba(44,36,27,0.5)",
                        }}
                      >
                        {log.entityType}
                      </span>
                    )}
                  </div>

                  {log.description && (
                    <p
                      className="text-sm mt-1"
                      style={{ color: "rgba(44,36,27,0.7)" }}
                    >
                      {log.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-2">
                    {log.user && (
                      <span
                        className="text-xs flex items-center gap-1"
                        style={{ color: "rgba(44,36,27,0.45)" }}
                      >
                        <User size={12} />
                        {log.user.name}{" "}
                        <span className="opacity-60">
                          ({ROLE_LABELS[log.user.role] || log.user.role})
                        </span>
                      </span>
                    )}
                    <span
                      className="text-xs flex items-center gap-1"
                      style={{ color: "rgba(44,36,27,0.35)" }}
                    >
                      <Clock size={12} />
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
