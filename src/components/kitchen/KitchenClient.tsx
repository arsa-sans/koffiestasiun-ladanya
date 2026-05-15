"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { advanceItemStatus } from "@/server/actions/kitchen";
import { elapsedLabel } from "@/lib/utils/format";
import { STATION_COLORS, STATION_LABELS, STATUS_COLORS } from "@/constants";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface KitchenItem {
  id: string;
  quantity: number;
  status: string;
  notes?: string | null;
  createdAt: string;
  product: { name: string; station: { type: string } };
  modifiers: { name: string }[];
}

interface KitchenOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  table?: { code: string } | null;
  items: KitchenItem[];
}

interface KitchenClientProps {
  initialOrders: KitchenOrder[];
}

const STATIONS = ["all", "bar", "kitchen", "sushi"] as const;

export default function KitchenClient({ initialOrders }: KitchenClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [station, setStation] = useState<string>("all");
  const [fullscreen, setFullscreen] = useState(false);
  const [now, setNow] = useState(new Date());

  // Live clock for elapsed timers
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // Supabase Realtime
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("kitchen-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        window.location.reload();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, (payload) => {
        // Optimistic update
        setOrders((prev) =>
          prev.map((order) => ({
            ...order,
            items: order.items.map((item) =>
              item.id === (payload.new as KitchenItem)?.id
                ? { ...item, status: (payload.new as KitchenItem).status }
                : item
            ),
          }))
        );
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleAdvance = async (itemId: string, currentStatus: string) => {
    const result = await advanceItemStatus(itemId, currentStatus);
    if (!result.success) toast.error("Gagal update status");
  };

  // Filter items by station
  const filteredOrders = orders
    .map((order) => ({
      ...order,
      items: order.items.filter((item) => {
        if (item.status === "delivered" || item.status === "canceled" || item.status === "void") return false;
        if (station !== "all") return item.product.station.type === station;
        return true;
      }),
    }))
    .filter((order) => order.items.length > 0);

  const getElapsed = (dateStr: string) => {
    const created = new Date(dateStr);
    const mins = Math.floor((now.getTime() - created.getTime()) / 60000);
    return mins;
  };

  const elapsedColor = (mins: number) => {
    if (mins < 5) return "#10B981";
    if (mins < 10) return "#F59E0B";
    return "#EF4444";
  };

  const getNextLabel = (status: string) => {
    const map: Record<string, string> = {
      pending: "Antri",
      queued: "Masak",
      cooking: "Siap",
      ready: "Selesai",
    };
    return map[status] || "→";
  };

  return (
    <div className="flex flex-col h-full" style={{ background: fullscreen ? "#0a0a0a" : undefined }}>
      {/* Station Filter Bar */}
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,15,15,0.95)" }}>
        <div className="flex items-center gap-2">
          {STATIONS.map((s) => {
            const isActive = station === s;
            const color = s === "all" ? "#C08B5C" : STATION_COLORS[s];
            return (
              <motion.button key={s} whileTap={{ scale: 0.95 }} onClick={() => setStation(s)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ background: isActive ? `${color}22` : "rgba(255,255,255,0.04)", color: isActive ? color : "rgba(216,198,181,0.5)", border: isActive ? `1px solid ${color}44` : "1px solid transparent" }}>
                {s === "all" ? "Semua" : STATION_LABELS[s]}
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(216,198,181,0.5)" }}>
            <Clock size={14} />
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button onClick={() => setFullscreen(!fullscreen)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.06)" }}>
            {fullscreen ? <Minimize2 size={16} color="#EADBC8" /> : <Maximize2 size={16} color="#EADBC8" />}
          </button>
        </div>
      </div>

      {/* Order Queue */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-5xl mb-4">🍳</div>
            <p className="text-xl font-semibold mb-2" style={{ color: "#EADBC8", fontFamily: "Playfair Display, serif" }}>Tidak ada pesanan</p>
            <p style={{ color: "rgba(216,198,181,0.4)" }}>Dapur sedang tenang...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filteredOrders.map((order) => {
                const elapsed = getElapsed(order.createdAt);
                const primaryStatus = order.items[0]?.status || "pending";
                return (
                  <motion.div key={order.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    layout
                    className={`kitchen-card status-${primaryStatus}`}>
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-xs font-bold tracking-wider" style={{ color: "#C08B5C" }}>{order.orderNumber}</p>
                        {order.table && <p className="text-xs mt-0.5" style={{ color: "rgba(216,198,181,0.5)" }}>Meja {order.table.code}</p>}
                      </div>
                      <div className="flex items-center gap-1 text-xs font-bold" style={{ color: elapsedColor(elapsed) }}>
                        <Clock size={12} />
                        {elapsed} min
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-2">
                      {order.items.map((item) => {
                        const statusColor = STATUS_COLORS[item.status] || "#C08B5C";
                        return (
                          <div key={item.id} className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1">
                                <p className="text-sm font-semibold" style={{ color: "#EADBC8" }}>
                                  <span style={{ color: "#C08B5C", fontWeight: "bold" }}>{item.quantity}×</span>{" "}
                                  {item.product.name}
                                </p>
                                {item.modifiers.length > 0 && (
                                  <p className="text-xs mt-0.5" style={{ color: "rgba(192,139,92,0.6)" }}>
                                    {item.modifiers.map((m) => m.name).join(", ")}
                                  </p>
                                )}
                                {item.notes && (
                                  <p className="text-xs italic mt-0.5" style={{ color: "rgba(216,198,181,0.4)" }}>{item.notes}</p>
                                )}
                              </div>
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                                style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44` }}>
                                {item.status}
                              </span>
                            </div>
                            {item.status !== "delivered" && item.status !== "ready" && (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAdvance(item.id, item.status)}
                                className="w-full py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 transition-all"
                                style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}33` }}>
                                {getNextLabel(item.status)}
                                <ChevronRight size={14} />
                              </motion.button>
                            )}
                            {item.status === "ready" && (
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleAdvance(item.id, item.status)}
                                className="w-full py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1"
                                style={{ background: "rgba(139,92,246,0.15)", color: "#a78bfa", border: "1px solid rgba(139,92,246,0.3)" }}>
                                ✓ Selesai Diantar
                              </motion.button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
