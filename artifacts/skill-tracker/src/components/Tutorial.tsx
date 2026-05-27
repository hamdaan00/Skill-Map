import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const STEPS = [
  {
    target: null,
    centered: true,
    emoji: "🌟",
    title: "Welcome to your Skill Tracker!",
    message: "Let's take a quick 60-second tour so you know exactly where everything is. You can skip anytime.",
    btnLabel: "Let's Go! →",
  },
  {
    target: '[data-tutorial="nav-dashboard"]',
    centered: false,
    title: "🏠 Your Dashboard",
    message: "This is your home base. See your streak, today's targets, and all your skills at a glance every time you open the app.",
  },
  {
    target: '[data-tutorial="add-skill-btn"]',
    centered: false,
    title: "➕ Add Your Skills",
    message: "Tap this to add any skill you want to track — Guitar, Python, Running, anything. You can add as many as you want.",
  },
  {
    target: '[data-tutorial="checklist-section"]',
    centered: false,
    title: "✅ Today's Targets",
    message: "Every day, your scheduled skills show up here as a checklist. Check them off as you practice. Complete all of them to earn a streak! 🔥",
  },
  {
    target: '[data-tutorial="nav-skills"]',
    centered: false,
    title: "🌱 Your Skill Garden",
    message: "Each skill grows as a plant here. Practice regularly and it blossoms into a tree. Neglect it and it wilts. Keep your garden alive!",
  },
  {
    target: '[data-tutorial="nav-focus-timer"]',
    centered: false,
    title: "⏱️ Focus Tools",
    message: "Use the Focus Timer for Pomodoro sessions, or enter Study Waves for a fully immersive practice environment with ambient sounds.",
  },
  {
    target: null,
    centered: true,
    emoji: "🎉",
    title: "You're ready to grow!",
    message: "That's everything you need to know. Start by adding your first skill or checking today's targets. Your journey begins now.",
    btnLabel: "Start Tracking! 🚀",
    isFinal: true,
  },
];

interface Rect { top: number; left: number; width: number; height: number; }

function Confetti() {
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ["#00d4ff","#7c3aed","#10b981","#f59e0b","#ef4444","#ec4899"][Math.floor(Math.random() * 6)],
    delay: Math.random() * 0.5,
    duration: 1 + Math.random() * 1.5,
    size: 6 + Math.random() * 8,
    rotate: Math.random() > 0.5 ? 360 : -360,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10002, overflow: "hidden", pointerEvents: "none" }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: [1, 1, 0], rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "fixed", top: 0, left: 0,
            width: p.size, height: p.size,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}

interface TutorialProps { onDone: () => void; }

export default function Tutorial({ onDone }: TutorialProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevElRef = useRef<Element | null>(null);
  const PAD = 10;

  const current = STEPS[step];
  if (!current) return null;

  // Determine if we show spotlight or centered card
  const isCentered = current.centered || !current.target || rect === null;

  useEffect(() => {
    // Clean up z-index on previous target
    if (prevElRef.current) {
      (prevElRef.current as HTMLElement).style.zIndex = "";
      (prevElRef.current as HTMLElement).style.position = "";
      prevElRef.current = null;
    }

    if (!current.target) {
      setRect(null);
      return;
    }

    // Small delay ensures DOM is ready after step change
    const timer = setTimeout(() => {
      const el = document.querySelector(current.target!);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        // Lift element above overlay
        (el as HTMLElement).style.position = "relative";
        (el as HTMLElement).style.zIndex = "10001";
        prevElRef.current = el;
      } else {
        // Element not found → fall back to centered card (never blank)
        setRect(null);
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      if (prevElRef.current) {
        (prevElRef.current as HTMLElement).style.zIndex = "";
        (prevElRef.current as HTMLElement).style.position = "";
        prevElRef.current = null;
      }
    };
  }, [step, current.target]);

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
    if (prevElRef.current) {
      (prevElRef.current as HTMLElement).style.zIndex = "";
      (prevElRef.current as HTMLElement).style.position = "";
    }
    localStorage.setItem("pst_tutorial_done", "true");
    onDone();
  };

  const getTooltipPos = (r: Rect): React.CSSProperties => {
    const W = 300, H = 220;
    const vw = window.innerWidth, vh = window.innerHeight;
    const below = r.top + r.height + PAD + H + 20 < vh;
    const top = below ? r.top + r.height + PAD + 12 : r.top - PAD - H - 12;
    let left = r.left + r.width / 2 - W / 2;
    left = Math.max(12, Math.min(left, vw - W - 12));
    return { position: "fixed", top, left, width: W, zIndex: 10001 };
  };

  const ProgressDots = () => (
    <div style={{ display: "flex", gap: 5, justifyContent: "center", marginBottom: 16 }}>
      {STEPS.map((_, i) => (
        <div key={i} style={{
          width: i === step ? 20 : 6, height: 6, borderRadius: 3,
          background: i === step ? "#00d4ff" : i < step ? "rgba(0,212,255,0.35)" : "rgba(255,255,255,0.15)",
          transition: "all 0.3s",
        }} />
      ))}
    </div>
  );

  const content = (
    <>
      {showConfetti && <Confetti />}

      {/* Dark overlay */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.75)" }}
        onClick={handleSkip}
      />

      {/* Spotlight hole (box-shadow trick) */}
      {!isCentered && rect && (
        <div style={{
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
        }} />
      )}

      {/* Centered card (steps 1, 7, or fallback) */}
      {isCentered && (
        <motion.div
          key={`centered-${step}`}
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10000,
            width: Math.min(360, window.innerWidth - 32),
            background: "rgba(10,15,30,0.97)",
            border: "1px solid rgba(0,212,255,0.4)",
            borderRadius: 20, padding: 32,
            boxShadow: "0 0 40px rgba(0,212,255,0.15), 0 25px 60px rgba(0,0,0,0.5)",
            textAlign: "center",
          }}
        >
          {current.emoji && <div style={{ fontSize: 52, marginBottom: 16 }}>{current.emoji}</div>}
          <div style={{ fontSize: 11, color: "#00d4ff", marginBottom: 12, letterSpacing: 1 }}>
            STEP {step + 1} OF {STEPS.length}
          </div>
          <ProgressDots />
          <h3 style={{ fontFamily: "'Sora',sans-serif", fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 10 }}>
            {current.title}
          </h3>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, marginBottom: 24 }}>
            {current.message}
          </p>
          <button
            onClick={handleNext}
            style={{
              width: "100%", height: 44, borderRadius: 12,
              background: "linear-gradient(135deg,#00d4ff,#0094b3)",
              color: "#0a0f1e", fontWeight: 700, fontSize: 14,
              border: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif",
            }}
          >
            {current.btnLabel ?? "Next →"}
          </button>
        </motion.div>
      )}

      {/* Spotlight tooltip */}
      {!isCentered && rect && (
        <motion.div
          key={`tooltip-${step}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            background: "rgba(10,15,30,0.97)",
            border: "1px solid rgba(0,212,255,0.4)",
            borderRadius: 16, padding: 20,
            boxShadow: "0 0 20px rgba(0,212,255,0.2), 0 15px 40px rgba(0,0,0,0.5)",
            ...getTooltipPos(rect),
          }}
        >
          <div style={{ fontSize: 11, color: "#00d4ff", marginBottom: 10, letterSpacing: 1 }}>
            STEP {step + 1} OF {STEPS.length}
          </div>
          <ProgressDots />
          <h4 style={{ fontFamily: "'Sora',sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
            {current.title}
          </h4>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.55, marginBottom: 16 }}>
            {current.message}
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleBack}
              disabled={step === 0}
              style={{
                flex: 1, height: 36, borderRadius: 10,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: step === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                fontSize: 13, cursor: step === 0 ? "not-allowed" : "pointer",
              }}
            >← Back</button>
            <button
              onClick={handleNext}
              style={{
                flex: 2, height: 36, borderRadius: 10,
                background: "linear-gradient(135deg,#00d4ff,#0094b3)",
                color: "#0a0f1e", fontWeight: 700, fontSize: 13,
                border: "none", cursor: "pointer", fontFamily: "'Sora',sans-serif",
              }}
            >Next →</button>
          </div>
        </motion.div>
      )}

      {/* Skip + counter */}
      <div style={{
        position: "fixed", top: 16, right: 16, zIndex: 10002,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          {step + 1} / {STEPS.length}
        </span>
        <button
          onClick={handleSkip}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            fontSize: 12, color: "rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 8, padding: "4px 10px", cursor: "pointer",
          }}
        >
          <X style={{ width: 11, height: 11 }} /> Skip
        </button>
      </div>

      <style>{`
        @keyframes tutorialPulse {
          0%,100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.75); outline-color: rgba(0,212,255,0.9); }
          50% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.75); outline-color: rgba(0,212,255,0.4); }
        }
      `}</style>
    </>
  );

  return createPortal(content, document.body);
}
