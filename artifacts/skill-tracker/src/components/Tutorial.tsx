import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const STEPS = [
  {
    id: "welcome",
    target: null,
    emoji: "🌟",
    title: "Welcome to your Skill Tracker!",
    message: "Let's take a quick 60-second tour so you know exactly where everything is. You can skip anytime.",
    btnLabel: "Let's Go! →",
  },
  {
    id: "dashboard",
    target: '[data-tutorial="nav-dashboard"]',
    title: "🏠 Your Dashboard",
    message: "This is your home base. See your streak, today's targets, and all your skills at a glance every time you open the app.",
  },
  {
    id: "add-skill",
    target: '[data-tutorial="add-skill-btn"]',
    title: "➕ Add Your Skills",
    message: "Tap this to add any skill you want to track — Guitar, Python, Running, anything. You can add as many as you want.",
  },
  {
    id: "checklist",
    target: '[data-tutorial="checklist-section"]',
    title: "✅ Today's Targets",
    message: "Every day, your scheduled skills show up here as a checklist. Check them off as you practice. Complete all of them to earn a streak! 🔥",
  },
  {
    id: "skills",
    target: '[data-tutorial="nav-skills"]',
    title: "🌱 Your Skill Garden",
    message: "Each skill grows as a plant here. Practice regularly and it blossoms into a tree. Neglect it and it wilts. Keep your garden alive!",
  },
  {
    id: "focus",
    target: '[data-tutorial="nav-focus-timer"]',
    title: "⏱️ Focus Tools",
    message: "Use the Focus Timer for Pomodoro sessions, or enter Study Waves for a fully immersive practice environment with ambient sounds.",
  },
  {
    id: "done",
    target: null,
    emoji: "🎉",
    title: "You're ready to grow!",
    message: "That's everything you need to know. Start by adding your first skill or checking today's targets. Your journey begins now.",
    btnLabel: "Start Tracking! 🚀",
    isFinal: true,
  },
];

interface Rect { top: number; left: number; width: number; height: number; }

function getRect(selector: string | null): Rect | null {
  if (!selector) return null;
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function Confetti() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ["#00d4ff","#7c3aed","#10b981","#f59e0b","#ef4444","#ec4899"][Math.floor(Math.random() * 6)],
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1.5,
    size: 6 + Math.random() * 8,
  }));
  return (
    <div className="pointer-events-none fixed inset-0 z-[10001] overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: 360 * (Math.random() > 0.5 ? 1 : -1) }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: p.size,
            height: p.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

interface TutorialProps {
  onDone: () => void;
}

export default function Tutorial({ onDone }: TutorialProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const PAD = 10;

  const current = STEPS[step];

  const updateRect = useCallback(() => {
    const r = getRect(current.target ?? null);
    setRect(r);
  }, [current.target]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [updateRect]);

  const handleNext = () => {
    if (current.isFinal) {
      setShowConfetti(true);
      setTimeout(() => {
        localStorage.setItem("pst_tutorial_done", "true");
        onDone();
      }, 1800);
      return;
    }
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const handleSkip = () => {
    localStorage.setItem("pst_tutorial_done", "true");
    onDone();
  };

  const isCenteredCard = !current.target;
  const hasSpotlight = !isCenteredCard && rect !== null;

  const getTooltipPosition = (r: Rect): React.CSSProperties => {
    const tooltipH = 200;
    const tooltipW = 300;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spotBottom = r.top + r.height + PAD;
    const spotTop = r.top - PAD;
    const showBelow = spotBottom + tooltipH + 16 < vh;
    const top = showBelow ? spotBottom + 12 : spotTop - tooltipH - 12;
    let left = r.left + r.width / 2 - tooltipW / 2;
    left = Math.max(12, Math.min(left, vw - tooltipW - 12));
    return { position: "fixed", top, left, width: tooltipW };
  };

  const content = (
    <>
      {showConfetti && <Confetti />}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[9998]"
            style={{ background: "rgba(0,0,0,0.75)" }}
            onClick={handleSkip}
          />

          {/* Spotlight hole using box-shadow */}
          {hasSpotlight && rect && (
            <div
              style={{
                position: "fixed",
                top: rect.top - PAD,
                left: rect.left - PAD,
                width: rect.width + PAD * 2,
                height: rect.height + PAD * 2,
                borderRadius: 12,
                zIndex: 9999,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.75)",
                outline: "2px solid #00d4ff",
                animation: "tutorialPulse 2s ease-in-out infinite",
                pointerEvents: "none",
              }}
            />
          )}

          {/* Centered card (steps 1 & 7) */}
          {isCenteredCard && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              style={{
                position: "fixed",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10000,
                width: Math.min(360, window.innerWidth - 32),
                background: "rgba(10,15,30,0.97)",
                border: "1px solid rgba(0,212,255,0.4)",
                borderRadius: 20,
                padding: 32,
                boxShadow: "0 0 40px rgba(0,212,255,0.15), 0 25px 60px rgba(0,0,0,0.5)",
                textAlign: "center",
              }}
            >
              {current.emoji && <div style={{ fontSize: 52, marginBottom: 16 }}>{current.emoji}</div>}
              <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 12 }}>
                {current.title}
              </h3>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, marginBottom: 24 }}>
                {current.message}
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === step ? 20 : 6,
                      height: 6,
                      borderRadius: 3,
                      background: i === step ? "#00d4ff" : "rgba(255,255,255,0.2)",
                      transition: "all 0.3s",
                    }}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                style={{
                  width: "100%",
                  height: 44,
                  borderRadius: 12,
                  background: "linear-gradient(135deg,#00d4ff,#0094b3)",
                  color: "#0a0f1e",
                  fontWeight: 700,
                  fontSize: 14,
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {current.btnLabel}
              </button>
            </motion.div>
          )}

          {/* Spotlight tooltip */}
          {hasSpotlight && rect && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                zIndex: 10000,
                background: "rgba(10,15,30,0.97)",
                border: "1px solid rgba(0,212,255,0.4)",
                borderRadius: 16,
                padding: 20,
                boxShadow: "0 0 20px rgba(0,212,255,0.2), 0 15px 40px rgba(0,0,0,0.5)",
                ...getTooltipPosition(rect),
              }}
            >
              <h4 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
                {current.title}
              </h4>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, marginBottom: 16 }}>
                {current.message}
              </p>
              <div style={{ display: "flex", gap: 6, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: i === step ? 16 : 5,
                      height: 5,
                      borderRadius: 3,
                      background: i === step ? "#00d4ff" : "rgba(255,255,255,0.2)",
                      transition: "all 0.3s",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={handleBack}
                  disabled={step === 0}
                  style={{
                    flex: 1,
                    height: 36,
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: step === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                    fontSize: 13,
                    cursor: step === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleNext}
                  style={{
                    flex: 2,
                    height: 36,
                    borderRadius: 10,
                    background: "linear-gradient(135deg,#00d4ff,#0094b3)",
                    color: "#0a0f1e",
                    fontWeight: 700,
                    fontSize: 13,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step counter + Skip button */}
          <div
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              zIndex: 10001,
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
              Step {step + 1} of {STEPS.length}
            </span>
            <button
              onClick={handleSkip}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8,
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              <X className="w-3 h-3" /> Skip Tutorial
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        @keyframes tutorialPulse {
          0%, 100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.75), 0 0 0 4px rgba(0,212,255,0.2), 0 0 30px rgba(0,212,255,0.3); }
          50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.75), 0 0 0 8px rgba(0,212,255,0.1), 0 0 50px rgba(0,212,255,0.4); }
        }
      `}</style>
    </>
  );

  return createPortal(content, document.body);
}
