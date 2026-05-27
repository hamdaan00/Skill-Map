import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { BADGES } from "@/lib/badges";
import { Button } from "@/components/ui/button";

interface BadgeUnlockModalProps {
  badgeIds: string[];
  onDismiss: () => void;
}

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {pieces.map((i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: Math.random() * 720 - 360,
            opacity: 0,
          }}
          transition={{
            duration: 2 + Math.random() * 1.5,
            delay: Math.random() * 0.5,
            ease: "easeIn",
          }}
          style={{
            position: "absolute",
            width: 10,
            height: 10,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            backgroundColor: ["#00D4FF", "#FFB830", "#9B59B6", "#2ECC71", "#E91E63"][
              Math.floor(Math.random() * 5)
            ],
          }}
        />
      ))}
    </div>
  );
}

export default function BadgeUnlockModal({ badgeIds, onDismiss }: BadgeUnlockModalProps) {
  const [current, setCurrent] = useState(0);
  const badge = BADGES.find((b) => b.id === badgeIds[current]);

  useEffect(() => {
    setCurrent(0);
  }, [badgeIds]);

  if (!badge || badgeIds.length === 0) return null;

  const handleNext = () => {
    if (current < badgeIds.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      onDismiss();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={handleNext}
      >
        <Confetti />
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="relative z-10 bg-card border-2 border-yellow-500/60 rounded-3xl p-10 text-center max-w-sm mx-4 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
          style={{ boxShadow: "0 0 60px rgba(255, 184, 48, 0.3)" }}
        >
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="text-7xl mb-5"
          >
            {badge.icon}
          </motion.div>
          <div className="text-yellow-400 text-sm font-semibold uppercase tracking-widest mb-2">
            Badge Unlocked!
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "'Sora', sans-serif" }}>
            {badge.name}
          </h2>
          <p className="text-muted-foreground mb-6">{badge.description}</p>
          {badgeIds.length > 1 && (
            <p className="text-xs text-muted-foreground mb-4">
              {current + 1} of {badgeIds.length} badges
            </p>
          )}
          <Button
            data-testid="button-badge-dismiss"
            onClick={handleNext}
            className="rounded-2xl px-8"
          >
            {current < badgeIds.length - 1 ? "Next" : "Awesome!"}
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
