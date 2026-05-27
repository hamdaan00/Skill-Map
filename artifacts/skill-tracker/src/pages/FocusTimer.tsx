import { useState } from "react";
import { motion } from "framer-motion";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTimer } from "@/contexts/TimerContext";
import { storage } from "@/lib/storage";

const TIPS = [
  "Close distracting tabs before starting your session.",
  "Put your phone face-down to stay in deep focus.",
  "Work on one thing at a time — single-tasking beats multitasking.",
  "Hydrate before you start. Your brain needs water to focus.",
  "Set a clear goal for what you want to accomplish this session.",
];

export default function FocusTimer() {
  const { timer, startTimer, pauseTimer, resumeTimer, resetTimer, setCustomMinutes } = useTimer();
  const skills = storage.getSkills();
  const pomos = storage.getPomodoroCount();

  const [selectedSkillId, setSelectedSkillId] = useState(timer.skillId || skills[0]?.id || "");
  const [mode, setMode] = useState<"pomodoro" | "custom">(timer.mode || "pomodoro");
  const [localCustom, setLocalCustom] = useState(timer.customMinutes || 25);
  const [tip] = useState(TIPS[Math.floor(Math.random() * TIPS.length)]);

  const selectedSkill = skills.find(s => s.id === selectedSkillId);
  const isActive = timer.isActive;

  const seconds = isActive ? timer.secondsLeft : (mode === "pomodoro" ? 25 * 60 : localCustom * 60);
  const total = isActive ? timer.totalSeconds : (mode === "pomodoro" ? 25 * 60 : localCustom * 60);
  const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");

  const radius = 120;
  const circ = 2 * Math.PI * radius;
  const progress = total > 0 ? seconds / total : 1;
  const dashOffset = circ * (1 - progress);

  const phase = isActive ? timer.phase : "focus";
  const phaseColor = phase === "focus" ? "#00D4FF" : "#2ECC71";

  const handleStart = () => {
    if (!selectedSkillId) return;
    const skill = skills.find(s => s.id === selectedSkillId);
    startTimer(selectedSkillId, skill?.name || "Skill", mode, localCustom);
    setCustomMinutes(localCustom);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
          Focus Timer
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Start a focused practice session. Sessions are auto-logged when complete.
        </p>
      </div>

      {/* Tip */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3 text-sm text-foreground">
        💡 {tip}
      </div>

      {/* Skill + Mode selection */}
      {!isActive && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
        >
          <div className="space-y-2">
            <Label>Which skill are you practicing?</Label>
            {skills.length === 0 ? (
              <p className="text-sm text-muted-foreground">Add a skill on the Dashboard first.</p>
            ) : (
              <Select value={selectedSkillId} onValueChange={setSelectedSkillId}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a skill..." />
                </SelectTrigger>
                <SelectContent>
                  {skills.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <Label>Timer mode</Label>
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
              {(["pomodoro", "custom"] as const).map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                    mode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {m === "pomodoro" ? "🍅 Pomodoro (25/5)" : "⏱️ Custom"}
                </button>
              ))}
            </div>
          </div>

          {mode === "custom" && (
            <div className="space-y-2">
              <Label>Duration: <span className="text-primary font-semibold">{localCustom} minutes</span></Label>
              <Slider
                min={5} max={120} step={5}
                value={[localCustom]}
                onValueChange={([v]) => setLocalCustom(v)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 min</span><span>120 min</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Circular Timer */}
      <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-6">
        <div className="relative">
          <svg width={300} height={300} className="-rotate-90">
            <circle cx={150} cy={150} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={14} />
            <motion.circle
              cx={150} cy={150} r={radius}
              fill="none"
              stroke={phaseColor}
              strokeWidth={14}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={dashOffset}
              style={{ filter: `drop-shadow(0 0 12px ${phaseColor}88)`, transition: "stroke-dashoffset 0.9s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <div className="text-6xl font-bold tabular-nums text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
              {mins}:{secs}
            </div>
            <div className="text-base font-medium capitalize" style={{ color: phaseColor }}>
              {phase === "focus" ? "Focus" : "☕ Break"}
            </div>
            {isActive && (
              <div className="text-sm text-muted-foreground">{timer.skillName}</div>
            )}
            {isActive && timer.mode === "pomodoro" && (
              <div className="text-xs text-muted-foreground">Cycle {timer.pomoCycle + 1}</div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-3 items-center">
          {!isActive ? (
            <Button
              onClick={handleStart}
              disabled={!selectedSkillId}
              size="lg"
              className="gap-2 rounded-2xl px-10 text-base"
              style={{ boxShadow: "0 0 25px rgba(0, 212, 255, 0.3)" }}
            >
              <Play className="w-5 h-5" /> Start Session
            </Button>
          ) : (
            <>
              {timer.isPaused ? (
                <Button onClick={resumeTimer} size="lg" className="gap-2 rounded-2xl px-8">
                  <Play className="w-5 h-5" /> Resume
                </Button>
              ) : (
                <Button onClick={pauseTimer} variant="outline" size="lg" className="gap-2 rounded-2xl px-8">
                  <Pause className="w-5 h-5" /> Pause
                </Button>
              )}
              <Button onClick={resetTimer} variant="outline" size="icon" className="rounded-2xl w-12 h-12">
                <RotateCcw className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {isActive && (
          <p className="text-xs text-muted-foreground text-center">
            Practice will be auto-logged when the focus session completes ✅
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-primary">{pomos}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Pomodoros</div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 text-center">
          <div className="text-3xl font-bold text-foreground">{Math.round(pomos * 25)}</div>
          <div className="text-xs text-muted-foreground mt-1">Total Focus Minutes</div>
        </div>
      </div>

      {/* Pomodoro method info */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Timer className="w-4 h-4 text-primary" /> How Pomodoro Works
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {[
            { emoji: "🍅", label: "25 min", desc: "Focused work" },
            { emoji: "☕", label: "5 min", desc: "Short break" },
            { emoji: "🔁", label: "Repeat", desc: "4 cycles" },
            { emoji: "🌟", label: "XP earned", desc: "Per session" },
          ].map(({ emoji, label, desc }) => (
            <div key={label} className="flex items-center gap-2 text-muted-foreground">
              <span className="text-xl">{emoji}</span>
              <div>
                <div className="font-medium text-foreground text-xs">{label}</div>
                <div className="text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
