// app/unauthorized/page.tsx
"use client";

import { motion } from "framer-motion";
import { ShieldOff, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/constants";

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "#F8F5F2" }}
    >
      {/* Background ambient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, rgba(239,68,68,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(192,139,92,0.05) 0%, transparent 50%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 text-center max-w-md px-6"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <ShieldOff size={38} color="#EF4444" />
        </motion.div>

        <h1
          className="text-2xl font-bold mb-3"
          style={{
            fontFamily: "Playfair Display, serif",
            color: "#2C241B",
          }}
        >
          Akses Ditolak
        </h1>

        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: "rgba(44,36,27,0.6)" }}
        >
          Anda tidak memiliki izin untuk mengakses halaman ini.
          Silakan hubungi administrator jika Anda merasa ini adalah kesalahan.
        </p>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => router.back()}
          className="btn-primary inline-flex items-center gap-2"
          style={{ background: "#C08B5C" }}
        >
          <ArrowLeft size={16} />
          Kembali
        </motion.button>

        <p
          className="text-xs mt-8"
          style={{ color: "rgba(44,36,27,0.25)" }}
        >
          {APP_NAME} · POS v1.0
        </p>
      </motion.div>
    </div>
  );
}
