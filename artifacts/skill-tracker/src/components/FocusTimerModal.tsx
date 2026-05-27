import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useTimer } from "@/contexts/TimerContext";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { motion } from "framer-motion";

interface FocusTimerModalProps {
  open: boolean;
  onClose: () => void;
  skillId: string;
  skillName: string;
}

export default function FocusTimerModal({ open, onClose, skillId, skillName }: FocusTimerModalProps) {
  const { timer, startTimer, pauseTimer, resumeTimer, resetTimer, setCustomMinutes } = useTimer();
  const [mode, setMode] = useState<'pomodoro' | 'custom'>('pomodoro');
  const [localCustom, setLocalCustom] = useState(25);

  const isThisSkill = timer.skillId === skillId;
  const activeTimer = isThisSkill ? timer : null;

  const seconds = activeTimer ? activeTimer.secondsLeft : (mode === 'pomodoro' ? 25 * 60 : localCustom * 60);
  const total = activeTimer ? activeTimer.totalSeconds : (mode === 'pomodoro' ? 25 * 60 : localCustom * 60);
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');

  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = total > 0 ? (seconds / total) : 1;
  const dashOffset = circumference * (1 - progress);

  const phase = activeTimer?.phase ?? 'focus';
  const phaseColor = phase === 'focus' ? '#00D4FF' : '#2ECC71';

  const handleStart = () => {
    startTimer(skillId, skillName, mode, localCustom);
    setCustomMinutes(localCustom);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ fontFamily: "'Sora', sans-serif" }}>
            <Timer className="w-5 h-5 text-primary" />
            Focus Timer — {skillName}
          </DialogTitle>
        </DialogHeader>

        {/* Mode Toggle */}
        {!activeTimer && (
          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            {(['pomodoro', 'custom'] as const).map(m => (
              <button
                key={m}
                data-testid={`button-timer-mode-${m}`}
                onClick={() => setMode(m)}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${
                  mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
                }`}
              >
                {m === 'pomodoro' ? 'Pomodoro (25/5)' : 'Custom'}
              </button>
            ))}
          </div>
        )}

        {/* Custom slider */}
        {!activeTimer && mode === 'custom' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="text-foreground font-medium">{localCustom} min</span>
            </div>
            <Slider
              data-testid="slider-timer-duration"
              min={5}
              max={120}
              step={5}
              value={[localCustom]}
              onValueChange={([v]) => setLocalCustom(v)}
            />
          </div>
        )}

        {/* Circular countdown */}
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            <svg width={220} height={220} className="-rotate-90">
              <circle cx={110} cy={110} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={10} />
              <motion.circle
                cx={110}
                cy={110}
                r={radius}
                fill="none"
                stroke={phaseColor}
                strokeWidth={10}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ filter: `drop-shadow(0 0 8px ${phaseColor})` }}
                transition={{ duration: 0.5 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-bold text-foreground tabular-nums" style={{ fontFamily: "'Sora', sans-serif" }}>
                {mins}:{secs}
              </div>
              <div className="text-sm capitalize font-medium mt-1" style={{ color: phaseColor }}>
                {activeTimer ? (phase === 'focus' ? 'Focus' : 'Break') : (mode === 'pomodoro' ? 'Pomodoro' : 'Custom')}
              </div>
              {activeTimer?.mode === 'pomodoro' && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Cycle {activeTimer.pomoCycle + 1}
                </div>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-3">
            {!activeTimer ? (
              <Button data-testid="button-timer-start" onClick={handleStart} className="gap-2 rounded-xl px-6">
                <Play className="w-4 h-4" /> Start
              </Button>
            ) : (
              <>
                {activeTimer.isPaused ? (
                  <Button data-testid="button-timer-resume" onClick={resumeTimer} className="gap-2 rounded-xl">
                    <Play className="w-4 h-4" /> Resume
                  </Button>
                ) : (
                  <Button data-testid="button-timer-pause" variant="outline" onClick={pauseTimer} className="gap-2 rounded-xl">
                    <Pause className="w-4 h-4" /> Pause
                  </Button>
                )}
                <Button data-testid="button-timer-reset" variant="outline" size="icon" onClick={resetTimer} className="rounded-xl">
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          {activeTimer && (
            <p className="text-xs text-muted-foreground text-center">
              Practice will be auto-logged when focus session completes.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
