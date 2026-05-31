"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Trash2, Info, Loader2, X } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: "danger" | "warning" | "info";
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Ya, Hapus",
  cancelText = "Batal",
  isLoading = false,
  variant = "danger",
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 size={24} color="#EF4444" />;
      case "warning":
        return <AlertTriangle size={24} color="#F59E0B" />;
      case "info":
      default:
        return <Info size={24} color="#C08B5C" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case "danger":
        return "rgba(239, 68, 68, 0.1)";
      case "warning":
        return "rgba(245, 158, 11, 0.1)";
      case "info":
      default:
        return "rgba(192, 139, 92, 0.1)";
    }
  };

  const getConfirmBtnStyle = () => {
    switch (variant) {
      case "danger":
        return {
          background: "#EF4444",
          color: "#FFFFFF",
        };
      case "warning":
        return {
          background: "#F59E0B",
          color: "#FFFFFF",
        };
      case "info":
      default:
        return {
          background: "#C08B5C",
          color: "#FFFFFF",
        };
    }
  };

  const getConfirmBtnHoverBg = () => {
    switch (variant) {
      case "danger":
        return "rgba(239, 68, 68, 0.9)";
      case "warning":
        return "rgba(245, 158, 11, 0.9)";
      case "info":
      default:
        return "rgba(192, 139, 92, 0.9)";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={false}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.15 }}
            className="rounded-3xl p-6 w-full max-w-sm relative overflow-hidden"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(0,0,0,0.06)",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isLoading}
              className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: "rgba(0,0,0,0.04)" }}
            >
              <X size={15} color="rgba(44,36,27,0.5)" />
            </button>

            {/* Icon & Content */}
            <div className="flex flex-col items-center text-center mt-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all"
                style={{
                  background: getIconBg(),
                }}
              >
                {getIcon()}
              </div>

              <h3
                className="text-lg font-bold px-2"
                style={{ color: "#2C241B", fontFamily: "Playfair Display, serif" }}
              >
                {title}
              </h3>

              <p
                className="text-sm mt-2 px-1 leading-relaxed"
                style={{ color: "rgba(44, 36, 27, 0.6)" }}
              >
                {message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: "rgba(0,0,0,0.04)",
                  color: "rgba(44,36,27,0.7)",
                }}
              >
                {cancelText}
              </button>
              
              <button
                onClick={async () => {
                  try {
                    await onConfirm();
                  } catch (e) {
                    console.error("Error during confirm action:", e);
                  }
                }}
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5 shadow-sm"
                style={{
                  ...getConfirmBtnStyle(),
                  opacity: isLoading ? 0.7 : 1,
                  cursor: isLoading ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
