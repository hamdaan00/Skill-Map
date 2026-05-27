import { useTimer } from "@/contexts/TimerContext";
import { Timer, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function TimerPill() {
  const { timer, pauseTimer, resumeTimer, resetTimer } = useTimer();
  if (!timer.isActive) return null;

  const mins = Math.floor(timer.secondsLeft / 60).toString().padStart(2, '0');
  const secs = (timer.secondsLeft % 60).toString().padStart(2, '0');
  const phaseColor = timer.phase === 'focus' ? '#00D4FF' : '#2ECC71';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
        style={{ backgroundColor: `${phaseColor}15`, borderColor: `${phaseColor}40`, color: phaseColor }}
      >
        <Timer className="w-3.5 h-3.5" />
        <span className="tabular-nums">{mins}:{secs}</span>
        <span className="text-muted-foreground capitalize">{timer.phase}</span>
        <button
          data-testid="button-timer-pill-toggle"
          onClick={timer.isPaused ? resumeTimer : pauseTimer}
          className="hover:opacity-70 transition-opacity"
        >
          {timer.isPaused ? '▶' : '⏸'}
        </button>
        <button
          data-testid="button-timer-pill-stop"
          onClick={resetTimer}
          className="hover:opacity-70 transition-opacity"
        >
          <X className="w-3 h-3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
