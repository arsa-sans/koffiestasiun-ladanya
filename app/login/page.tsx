"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { Coffee, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { APP_NAME } from "@/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("Login gagal: " + error.message);
      setLoading(false);
      return;
    }

    // Fetch user role and redirect to correct dashboard
    try {
      const res = await fetch("/api/auth/role");
      const data = await res.json();

      const roleRedirects: Record<string, string> = {
        admin: "/admin",
        cashier: "/cashier",
        kitchen: "/kitchen",
      };

      const target = roleRedirects[data.role] || "/cashier";
      router.push(target);
    } catch {
      router.push("/cashier");
    }
    router.refresh();
  };

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
            "radial-gradient(ellipse at 30% 50%, rgba(192,139,92,0.08) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(85,107,79,0.06) 0%, transparent 50%)",
        }}
      />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(192,139,92,1) 1px, transparent 1px), linear-gradient(90deg, rgba(192,139,92,1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-4"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
            style={{
              background: "rgba(192,139,92,0.12)",
              border: "1px solid rgba(192,139,92,0.25)",
            }}
          >
            <Coffee size={38} color="#C08B5C" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold mb-1"
            style={{
              fontFamily: "Playfair Display, serif",
              background:
                "linear-gradient(135deg, #C08B5C 0%, #2C241B 60%, #8A6A55 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Koffie Station
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-sm"
            style={{
              fontFamily: "Noto Serif JP, serif",
              color: "rgba(44,36,27,0.5)",
            }}
          >
            × Ladanya Japanese Food
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xs mt-2"
            style={{ color: "rgba(44,36,27,0.35)" }}
          >
            Restaurant Operating System
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="rounded-3xl p-8"
          style={{
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(0,0,0,0.07)",
            backdropFilter: "blur(16px)",
            boxShadow: "0 10px 40px -10px rgba(0,0,0,0.05)"
          }}
        >
          <h2
            className="text-xl font-semibold mb-6"
            style={{ color: "#2C241B" }}
          >
            Masuk ke Sistem
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "rgba(44,36,27,0.7)" }}
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@koffiestation.com"
                required
                className="pos-input"
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "rgba(44,36,27,0.7)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="pos-input pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "rgba(44,36,27,0.5)" }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full mt-6"
              style={{
                background: loading ? "#8A6A55" : "#C08B5C",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Masuk...</span>
                </>
              ) : (
                "Masuk"
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Footer */}
        <p
          className="text-center text-xs mt-6"
          style={{ color: "rgba(44,36,27,0.25)" }}
        >
          {APP_NAME} · POS v1.0
        </p>
      </motion.div>
    </div>
  );
}
