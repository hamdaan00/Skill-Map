import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { storage } from "@/lib/storage";
import { sound } from "@/lib/sound";
import { calcSessionXP, getLevelFromXP } from "@/lib/xp";
import { calculateStreak } from "@/lib/badges";

type TimerMode = 'pomodoro' | 'custom';
type TimerPhase = 'focus' | 'break';

interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  skillId: string | null;
  skillName: string;
  mode: TimerMode;
  phase: TimerPhase;
  secondsLeft: number;
  totalSeconds: number;
  customMinutes: number;
  pomoCycle: number;
}

interface TimerContextType {
  timer: TimerState;
  startTimer: (skillId: string, skillName: string, mode: TimerMode, customMinutes?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  resetTimer: () => void;
  setCustomMinutes: (m: number) => void;
}

const defaultTimer: TimerState = {
  isActive: false,
  isPaused: false,
  skillId: null,
  skillName: '',
  mode: 'pomodoro',
  phase: 'focus',
  secondsLeft: 25 * 60,
  totalSeconds: 25 * 60,
  customMinutes: 25,
  pomoCycle: 0,
};

const TimerContext = createContext<TimerContextType>({
  timer: defaultTimer,
  startTimer: () => {},
  pauseTimer: () => {},
  resumeTimer: () => {},
  resetTimer: () => {},
  setCustomMinutes: () => {},
});

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [timer, setTimer] = useState<TimerState>(defaultTimer);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef<(() => void) | null>(null);

  const logCompletedSession = useCallback((skillId: string, durationMinutes: number) => {
    const today = new Date().toISOString().split('T')[0];
    const sessions = storage.getSessions();
    const skills = storage.getSkills();
    const streak = calculateStreak(sessions);
    const skill = skills.find(s => s.id === skillId);
    const targets = storage.getTargets();
    const completedTarget = targets?.date === today && targets.completedSkillIds.includes(skillId);
    const xpEarned = calcSessionXP(durationMinutes, 3, streak, completedTarget);

    const newSession = {
      id: crypto.randomUUID(),
      skillId,
      date: today,
      duration: durationMinutes,
      notes: 'Focus session via timer',
      progress: skill?.progress ?? 0,
      loggedAt: new Date().toISOString(),
      mood: 3,
      xpEarned,
    };
    const updatedSessions = [...sessions, newSession];
    storage.setSessions(updatedSessions);

    const newXP = (skill?.xp ?? 0) + xpEarned;
    const newLevel = getLevelFromXP(newXP);
    const updatedSkills = skills.map(s =>
      s.id === skillId ? { ...s, lastPracticed: today, xp: newXP, level: newLevel } : s
    );
    storage.setSkills(updatedSkills);

    // Update targets
    const currentCompleted = targets?.date === today ? targets.completedSkillIds : [];
    if (!currentCompleted.includes(skillId)) {
      storage.setTargets({ date: today, completedSkillIds: [...currentCompleted, skillId] });
    }

    // Increment pomodoro count
    const count = storage.getPomodoroCount() + 1;
    storage.setPomodoroCount(count);
  }, []);

  const handleFocusComplete = useCallback((skillId: string | null, skillName: string, mode: TimerMode, cycle: number, customMinutes: number) => {
    sound.timerComplete();
    if (skillId) {
      const mins = mode === 'pomodoro' ? 25 : customMinutes;
      logCompletedSession(skillId, mins);
    }
    if (mode === 'pomodoro') {
      // Switch to break
      const breakSeconds = 5 * 60;
      setTimer(prev => ({
        ...prev,
        phase: 'break',
        secondsLeft: breakSeconds,
        totalSeconds: breakSeconds,
        pomoCycle: cycle + 1,
      }));
    } else {
      // Custom mode complete — stop
      setTimer(prev => ({ ...prev, isActive: false, isPaused: false, phase: 'focus', secondsLeft: prev.totalSeconds }));
    }
  }, [logCompletedSession]);

  const handleBreakComplete = useCallback(() => {
    sound.timerStart();
    const focusSeconds = 25 * 60;
    setTimer(prev => ({
      ...prev,
      phase: 'focus',
      secondsLeft: focusSeconds,
      totalSeconds: focusSeconds,
    }));
  }, []);

  useEffect(() => {
    if (timer.isActive && !timer.isPaused) {
      intervalRef.current = setInterval(() => {
        setTimer(prev => {
          if (prev.secondsLeft <= 1) {
            // Store current values before state update
            onCompleteRef.current = () => {
              if (prev.phase === 'focus') {
                handleFocusComplete(prev.skillId, prev.skillName, prev.mode, prev.pomoCycle, prev.customMinutes);
              } else {
                handleBreakComplete();
              }
            };
            return { ...prev, secondsLeft: 0 };
          }
          return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [timer.isActive, timer.isPaused, handleFocusComplete, handleBreakComplete]);

  // Fire complete callback after state settles
  useEffect(() => {
    if (timer.secondsLeft === 0 && timer.isActive && onCompleteRef.current) {
      const fn = onCompleteRef.current;
      onCompleteRef.current = null;
      fn();
    }
  }, [timer.secondsLeft, timer.isActive]);

  const startTimer = useCallback((skillId: string, skillName: string, mode: TimerMode, customMinutes = 25) => {
    const secs = mode === 'pomodoro' ? 25 * 60 : customMinutes * 60;
    sound.timerStart();
    setTimer({
      isActive: true,
      isPaused: false,
      skillId,
      skillName,
      mode,
      phase: 'focus',
      secondsLeft: secs,
      totalSeconds: secs,
      customMinutes,
      pomoCycle: 0,
    });
  }, []);

  const pauseTimer = useCallback(() => setTimer(p => ({ ...p, isPaused: true })), []);
  const resumeTimer = useCallback(() => setTimer(p => ({ ...p, isPaused: false })), []);
  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimer(defaultTimer);
  }, []);
  const setCustomMinutes = useCallback((m: number) => {
    setTimer(p => ({ ...p, customMinutes: m }));
  }, []);

  return (
    <TimerContext.Provider value={{ timer, startTimer, pauseTimer, resumeTimer, resetTimer, setCustomMinutes }}>
      {children}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
