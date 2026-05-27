import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm rounded-2xl p-6 space-y-4"
            style={{
              background: "rgba(15,23,42,0.95)",
              border: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            }}
          >
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>
                {title}
              </h3>
              <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
                {message}
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={onCancel}
                className="flex-1 h-10 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.7)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onConfirm(); }}
                className="flex-1 h-10 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: danger
                    ? "linear-gradient(135deg,#ef4444,#dc2626)"
                    : "linear-gradient(135deg,#00d4ff,#0094b3)",
                  color: danger ? "white" : "#0a0f1e",
                  boxShadow: danger
                    ? "0 0 20px rgba(239,68,68,0.3)"
                    : "0 0 20px rgba(0,212,255,0.3)",
                }}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
