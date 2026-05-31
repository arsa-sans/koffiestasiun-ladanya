"use client";

import { motion } from "framer-motion";
import { TrendingUp, ShoppingBag, AlertTriangle, Clock, ArrowRight } from "lucide-react";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import Link from "next/link";
import { STATUS_COLORS } from "@/constants";

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: string;
  createdAt: string;
  tableCode: string | null;
  itemCount: number;
}

interface AdminOverviewClientProps {
  todayRevenue: number;
  todayOrderCount: number;
  activeOrders: number;
  lowStockCount: number;
  recentOrders: RecentOrder[];
}

const STAT_CARDS = (props: AdminOverviewClientProps) => [
  { label: "Pendapatan Hari Ini", value: formatCurrency(props.todayRevenue), icon: <TrendingUp size={22} />, color: "#10B981", sub: `${props.todayOrderCount} transaksi` },
  { label: "Order Aktif", value: props.activeOrders, icon: <ShoppingBag size={22} />, color: "#C08B5C", sub: "sedang diproses" },
  { label: "Stok Kritis", value: props.lowStockCount, icon: <AlertTriangle size={22} />, color: "#F59E0B", sub: "bahan di bawah minimum" },
];

export default function AdminOverviewClient(props: AdminOverviewClientProps) {
  const stats = STAT_CARDS(props);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}>
          Dashboard Operasional
        </h1>
        <p className="text-sm" style={{ color: "rgba(44,36,27,0.5)" }}>
          {new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={false} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="rounded-2xl p-5" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}18`, color: stat.color }}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold mb-1" style={{ color: "#2C241B" }}>{stat.value}</p>
            <p className="text-xs font-semibold mb-0.5" style={{ color: "rgba(44,36,27,0.5)" }}>{stat.label}</p>
            <p className="text-xs" style={{ color: stat.color }}>{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/products", label: "Kelola Produk" },
          { href: "/admin/inventory", label: "Inventaris" },
          { href: "/admin/stock-opname", label: "Stock Opname" },
          { href: "/admin/reports", label: "Laporan" },
        ].map((link) => (
          <Link key={link.href} href={link.href}
            className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all"
            style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.06)", color: "#5C4B3F" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(192,139,92,0.3)"; e.currentTarget.style.color = "#C08B5C"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(0,0,0,0.06)"; e.currentTarget.style.color = "#5C4B3F"; }}>
            {link.label}
            <ArrowRight size={14} />
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)" }}>
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <h2 className="font-semibold" style={{ color: "#2C241B" }}>Order Terbaru</h2>
          <Link href="/admin/reports" className="text-xs" style={{ color: "#C08B5C" }}>Lihat semua →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="pos-table">
            <thead>
              <tr>
                <th>No. Order</th>
                <th>Meja</th>
                <th>Item</th>
                <th>Total</th>
                <th>Status</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {props.recentOrders.map((order) => {
                const statusColor = STATUS_COLORS[order.status] || "#C08B5C";
                return (
                  <tr key={order.id}>
                    <td><span className="font-mono text-xs" style={{ color: "#C08B5C" }}>{order.orderNumber}</span></td>
                    <td style={{ color: "rgba(44,36,27,0.7)" }}>{order.tableCode ? `Meja ${order.tableCode}` : "Takeaway"}</td>
                    <td style={{ color: "rgba(44,36,27,0.7)" }}>{order.itemCount} item</td>
                    <td className="font-semibold" style={{ color: "#2C241B" }}>{formatCurrency(parseFloat(order.totalAmount))}</td>
                    <td>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}33` }}>
                        {order.status}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: "rgba(44,36,27,0.5)" }}>{formatDateTime(order.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
