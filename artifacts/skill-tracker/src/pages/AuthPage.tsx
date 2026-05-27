import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { storage } from "@/lib/storage";

interface AuthPageProps {
  onAuth: () => void;
}

export default function AuthPage({ onAuth }: AuthPageProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!supabase) { setError("Supabase is not configured."); return; }

    try {
      if (tab === "signup") {
        if (password !== confirm) { setError("Passwords do not match."); return; }
        if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
        setLoading(true);
        const { error: err } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
        setLoading(false);
        if (err) { setError(err.message); return; }
        setMessage("Check your email to confirm your account, then log in.");
      } else {
        setLoading(true);
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (err) { setError(err.message); return; }
        if (data.user) {
          const n = data.user.user_metadata?.name || email.split("@")[0];
          if (!storage.getUser()) {
            storage.setUser({ name: n, avatar: "🧑‍💻", reminderTime: "08:00", reminderEnabled: false, theme: "dark" });
          }
          onAuth();
        }
      }
    } catch (thrown: unknown) {
      setLoading(false);
      const msg = thrown instanceof Error ? thrown.message : String(thrown);
      if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("failed")) {
        setError("Network error — could not reach the auth server. Check your internet connection or try again shortly.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    }
  };

  const handleForgot = async () => {
    if (!email) { setError("Enter your email first."); return; }
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    setMessage("Password reset email sent.");
  };

  const handleSkip = () => {
    if (!storage.getUser()) {
      storage.setUser({ name: "Learner", avatar: "🧑‍💻", reminderTime: "08:00", reminderEnabled: false, theme: "dark" });
    }
    onAuth();
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#0a0f1e" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 32,
          backdropFilter: "blur(10px)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "rgba(0,212,255,0.15)", border: "1px solid rgba(0,212,255,0.3)" }}>
            <Zap className="w-7 h-7" style={{ color: "#00d4ff" }} />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Sora', sans-serif" }}>SkillMap</h1>
            <p className="text-sm font-medium" style={{ color: "#00d4ff" }}>Track. Grow. Achieve.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mb-6 rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          {(["login", "signup"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setMessage(""); }}
              className="flex-1 py-2.5 text-sm font-semibold transition-all capitalize"
              style={{
                background: tab === t ? "rgba(0,212,255,0.2)" : "transparent",
                color: tab === t ? "#00d4ff" : "rgba(255,255,255,0.4)",
                borderBottom: tab === t ? "2px solid #00d4ff" : "2px solid transparent",
              }}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {tab === "signup" && (
              <motion.div key="name" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <input
                  type="text" placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input
            type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required
            className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          />

          <div className="relative">
            <input
              type={showPass ? "text" : "password"} placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full h-11 px-4 pr-12 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            />
            <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "rgba(255,255,255,0.3)" }}>
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <AnimatePresence mode="wait">
            {tab === "signup" && (
              <motion.div key="confirm" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <input
                  type="password" placeholder="Confirm password" value={confirm} onChange={e => setConfirm(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl text-sm text-white placeholder-white/30 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-xs text-red-400">{error}</p>}
          {message && <p className="text-xs" style={{ color: "#00d4ff" }}>{message}</p>}

          {tab === "login" && (
            <div className="text-right">
              <button type="button" onClick={handleForgot} className="text-xs" style={{ color: "rgba(0,212,255,0.7)" }}>
                Forgot Password?
              </button>
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all"
            style={{ background: "linear-gradient(135deg,#00d4ff,#0094b3)", color: "#0a0f1e", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (tab === "login" ? "Log In" : "Create Account")}
          </button>
        </form>

        <button
          onClick={handleSkip}
          className="w-full mt-3 text-xs text-center transition-all"
          style={{ color: "rgba(255,255,255,0.25)" }}
        >
          Skip for now (use locally)
        </button>
      </motion.div>
    </div>
  );
}
