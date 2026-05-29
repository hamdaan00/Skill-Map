import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Plus, RefreshCw, Timer, AlertTriangle, ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storage, Skill, Session } from "@/lib/storage";
import { CATEGORY_COLORS, BADGES, calculateStreak, checkBadges } from "@/lib/badges";
import { quotes, getRandomQuote } from "@/lib/quotes";
import { getLevelInfo, getLevelFromXP, calcSessionXP } from "@/lib/xp";
import { calcConsistencyScore, getConsistencyColor } from "@/lib/consistency";
import { sound } from "@/lib/sound";
import SkillModal from "@/components/SkillModal";
import LogPracticeModal from "@/components/LogPracticeModal";
import BadgeUnlockModal from "@/components/BadgeUnlockModal";
import FocusTimerModal from "@/components/FocusTimerModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return DAYS.map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    return d.toISOString().split("T")[0];
  });
}

function getDayOfWeek(): string {
  return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"][new Date().getDay()];
}

function getDaysInactive(lastPracticed: string | null): number {
  if (!lastPracticed) return 0; // never practiced → no decay
  const last = new Date(lastPracticed);
  const today = new Date();
  return Math.floor((today.getTime() - last.getTime()) / 86400000);
}

function ConsistencyGauge({ score }: { score: number }) {
  const color = getConsistencyColor(score);
  const r = 50, circ = 2 * Math.PI * r;
  const arc = circ * 0.75;
  const dash = arc * (score / 100);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-32 h-24">
        <svg width="128" height="96" viewBox="0 0 128 96">
          <path d="M 20 80 A 50 50 0 1 1 108 80" fill="none" stroke="hsl(var(--muted))" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M 20 80 A 50 50 0 1 1 108 80"
            fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${arc}`}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground">Consistency Score</span>
    </div>
  );
}

export default function Dashboard() {
  const [skills, setSkills] = useState<Skill[]>(() => storage.getSkills());
  const [sessions, setSessions] = useState<Session[]>(() => storage.getSessions());
  const [user, setUser] = useState(() => storage.getUser());
  const [unlockedBadges, setUnlockedBadges] = useState(() => storage.getBadges());
  const [targets, setTargets] = useState(() => storage.getTargets());
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [quoteIdx, setQuoteIdx] = useState(storage.getLastQuote());
  const [currentQuote, setCurrentQuote] = useState(() => {
    const lastIdx = storage.getLastQuote();
    return lastIdx >= 0 ? quotes[lastIdx] : getRandomQuote(-1).quote;
  });
  const [quoteFade, setQuoteFade] = useState(true);

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [editSkill, setEditSkill] = useState<Skill | null>(null);
  const [logSkill, setLogSkill] = useState<Skill | null>(null);
  const [deleteSkillId, setDeleteSkillId] = useState<string | null>(null);
  const [timerSkill, setTimerSkill] = useState<Skill | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [allTargetsDone, setAllTargetsDone] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todayDow = getDayOfWeek();
  const weekDates = getWeekDates();

  const reload = useCallback(() => {
    setSkills(storage.getSkills());
    setSessions(storage.getSessions());
    setUser(storage.getUser());
    setUnlockedBadges(storage.getBadges());
    setTargets(storage.getTargets());
  }, []);

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener("storage-update", handler);
    // Also sync across tabs
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("storage-update", handler);
      window.removeEventListener("storage", handler);
    };
  }, [reload]);

  useEffect(() => {
    if (quoteIdx < 0) {
      const { quote, index } = getRandomQuote(-1);
      setCurrentQuote(quote);
      setQuoteIdx(index);
      storage.setLastQuote(index);
    }
  }, []);

  const cycleQuote = () => {
    setQuoteFade(false);
    setTimeout(() => {
      const { quote, index } = getRandomQuote(quoteIdx);
      setCurrentQuote(quote);
      setQuoteIdx(index);
      storage.setLastQuote(index);
      setQuoteFade(true);
    }, 200);
  };

  const streak = calculateStreak(sessions);

  // Today's targets — only skills explicitly scheduled for today
  const todayTargets = skills.filter((s) =>
    s.scheduledDays && s.scheduledDays.includes(todayDow)
  );
  const todayDone = targets?.date === today ? targets.completedSkillIds : [];
  const weekPracticed = new Set(
    sessions.filter((s) => weekDates.includes(s.date)).map((s) => s.skillId)
  ).size;

  const consistencyScore = calcConsistencyScore(skills, sessions, targets);

  // Decaying skills
  const decayingSkills = skills.filter(s => getDaysInactive(s.lastPracticed) >= 5);

  const checkAndUnlockBadges = useCallback((currentSkills: Skill[], currentSessions: Session[], extraBadges?: string[]) => {
    const current = storage.getBadges();
    const journal = storage.getJournal();
    const consistencyHistory = storage.getConsistencyHistory();
    const moodLogs = storage.getMoodLog();
    const pomos = storage.getPomodoroCount();
    const newlyUnlocked = checkBadges(currentSkills, currentSessions, current, targets, pomos, journal.length, consistencyHistory, moodLogs);
    const allNew = [...newlyUnlocked, ...(extraBadges || [])];
    if (allNew.length > 0) {
      const updated = [
        ...current,
        ...allNew.filter(id => !current.find(b => b.badgeId === id)).map(id => ({ badgeId: id, unlockedAt: today })),
      ];
      storage.setBadges(updated);
      setNewBadges(allNew);
      sound.badgeUnlock();
    }
  }, [targets, today]);

  const handleSaveSkill = (data: { name: string; category: string; description: string; dailyTarget: string; progress: number; scheduledDays: string[] }) => {
    const allSkills = storage.getSkills();
    let updated: Skill[];
    if (editSkill) {
      updated = allSkills.map((s) =>
        s.id === editSkill.id ? { ...s, ...data } : s
      );
    } else {
      const newSkill: Skill = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: today,
        lastPracticed: null,
        xp: 0,
        level: 1,
      };
      updated = [...allSkills, newSkill];
    }
    storage.setSkills(updated);
    setSkills([...updated]); // BUG FIX: force immediate re-render
    checkAndUnlockBadges(updated, sessions);
    setShowSkillModal(false);
    setEditSkill(null);
  };

  const handleDeleteSkill = () => {
    if (!deleteSkillId) return;
    const updated = storage.getSkills().filter((s) => s.id !== deleteSkillId);
    storage.setSkills(updated);
    setSkills([...updated]); // BUG FIX: force immediate re-render
    setDeleteSkillId(null);
  };

  const handleLogPractice = (data: { date: string; duration: number; notes: string; progress: number; mood: number }) => {
    if (!logSkill) return;
    const allSessions = storage.getSessions();
    const streak2 = calculateStreak(allSessions);
    const completedTarget = todayDone.includes(logSkill.id);
    const xpEarned = calcSessionXP(data.duration, data.mood, streak2, completedTarget);

    const newSession = {
      id: crypto.randomUUID(),
      skillId: logSkill.id,
      ...data,
      loggedAt: new Date().toISOString(),
      xpEarned,
    };
    const updatedSessions = [...allSessions, newSession];
    storage.setSessions(updatedSessions);

    const newXP = (logSkill.xp || 0) + xpEarned;
    const newLevel = getLevelFromXP(newXP);
    const prevLevel = logSkill.level || 1;
    const allSkills = storage.getSkills().map((s) =>
      s.id === logSkill.id ? { ...s, progress: data.progress, lastPracticed: data.date, xp: newXP, level: newLevel } : s
    );
    storage.setSkills(allSkills);

    const currentCompleted = targets?.date === today ? targets.completedSkillIds : [];
    if (!currentCompleted.includes(logSkill.id)) {
      storage.setTargets({ date: today, completedSkillIds: [...currentCompleted, logSkill.id] });
    }

    // Update mood log
    const moodLogs = storage.getMoodLog();
    if (!moodLogs.find(m => m.date === data.date)) {
      storage.setMoodLog([...moodLogs, { date: data.date, mood: data.mood }]);
    }

    sound.logSession();
    if (newLevel > prevLevel) {
      sound.levelUp();
    }

    checkAndUnlockBadges(allSkills, updatedSessions);
    setLogSkill(null);
  };

  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.08 } } },
    item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
            {getGreeting()}, {user?.name || "Learner"}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Keep building, one session at a time.</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="text-xl font-bold text-foreground">{streak}</span>
          <span className="text-muted-foreground text-sm">day streak</span>
        </div>
      </div>

      {/* Decay Warning */}
      {decayingSkills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-semibold text-yellow-400">Skills Needing Attention</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {decayingSkills.map(s => {
              const days = getDaysInactive(s.lastPracticed);
              const isDecaying = days >= 10;
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium ${isDecaying ? "border-red-500/50 text-red-400 bg-red-500/10" : "border-yellow-500/50 text-yellow-400 bg-yellow-500/10"}`}
                  >
                    {isDecaying ? "🔴" : "⚠️"} {s.name} ({days}d)
                  </span>
                  <button
                    onClick={() => setLogSkill(s)}
                    className="text-xs text-primary hover:underline"
                  >
                    Practice now
                  </button>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Quote Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={quoteIdx}
          animate={{ opacity: quoteFade ? 1 : 0 }}
          className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden"
        >
          <div className="absolute top-3 left-5 text-6xl text-primary/10 font-serif leading-none select-none">"</div>
          <div className="pl-6 pr-10">
            <p className="text-foreground font-medium leading-relaxed">{currentQuote.text}</p>
            <p className="text-primary text-sm mt-2">— {currentQuote.author}</p>
          </div>
          <button
            data-testid="button-new-quote"
            onClick={cycleQuote}
            className="absolute top-4 right-4 text-muted-foreground hover:text-primary transition-colors p-1 rounded-lg hover:bg-muted"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </motion.div>
      </AnimatePresence>

      {/* Stats Row + Consistency Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="col-span-1 lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { label: "Total Skills", value: skills.length, color: "#00D4FF" },
            { label: "Practiced This Week", value: weekPracticed, color: "#2ECC71" },
            { label: "Day Streak", value: streak, color: "#E67E22" },
            { label: "Badges Earned", value: unlockedBadges.length, color: "#FFB830" },
          ].map(({ label, value, color }) => (
            <motion.div
              key={label}
              variants={stagger.item}
              data-testid={`stat-${label.toLowerCase().replace(/\s/g, "-")}`}
              className="bg-card border border-border rounded-2xl p-4 space-y-1"
              style={{ boxShadow: `0 0 20px ${color}10` }}
            >
              <div className="text-3xl font-bold" style={{ color }}>{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </motion.div>
          ))}
        </motion.div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center justify-center">
          <ConsistencyGauge score={consistencyScore} />
        </div>
      </div>

      {/* Weekly Schedule Widget */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <button
          data-testid="button-toggle-schedule"
          className="w-full flex items-center justify-between text-sm font-semibold text-foreground mb-0"
          onClick={() => setShowSchedule(s => !s)}
        >
          <span>This Week's Schedule</span>
          {showSchedule ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        <AnimatePresence>
          {showSchedule && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-4"
            >
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((day, i) => {
                  const date = weekDates[i];
                  const isToday = date === today;
                  const daySkills = skills.filter(s => !s.scheduledDays?.length || s.scheduledDays.includes(day));
                  return (
                    <div
                      key={day}
                      data-testid={`schedule-${day}`}
                      className={`p-2 rounded-xl text-center min-h-16 ${isToday ? "bg-primary/10 border border-primary/30" : "bg-muted/50"}`}
                    >
                      <div className={`text-xs font-semibold mb-1 ${isToday ? "text-primary" : "text-muted-foreground"}`}>{day}</div>
                      <div className="space-y-0.5">
                        {daySkills.slice(0, 3).map(s => (
                          <div
                            key={s.id}
                            className="text-xs truncate rounded px-1"
                            style={{ backgroundColor: `${CATEGORY_COLORS[s.category] || "#3498DB"}20`, color: CATEGORY_COLORS[s.category] || "#3498DB" }}
                          >
                            {s.name.slice(0, 6)}
                          </div>
                        ))}
                        {daySkills.length > 3 && <div className="text-xs text-muted-foreground">+{daySkills.length - 3}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Today's Checklist */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Today's Targets</h3>
            <span className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
            </span>
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(0,212,255,0.1)", color: "#00d4ff", border: "1px solid rgba(0,212,255,0.2)" }}
          >
            {todayDone.length} / {todayTargets.length} done
          </span>
        </div>

        {/* Progress bar */}
        {todayTargets.length > 0 && (
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg,#00d4ff,#0094b3)" }}
              animate={{ width: `${todayTargets.length > 0 ? (todayDone.length / todayTargets.length) * 100 : 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}

        {/* All done celebration */}
        <AnimatePresence>
          {todayTargets.length > 0 && todayDone.length >= todayTargets.length && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-4 text-center"
              style={{ background: "linear-gradient(135deg,rgba(0,212,255,0.15),rgba(0,148,179,0.1))", border: "1px solid rgba(0,212,255,0.3)" }}
            >
              <p className="text-sm font-bold" style={{ color: "#00d4ff" }}>
                🎉 All targets complete! Incredible work, {user?.name || "Learner"}!
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {todayTargets.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">🌿 No targets for today — a rest day is part of growth.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {[...todayTargets]
              .sort((a, b) => {
                const aDone = todayDone.includes(a.id) ? 1 : 0;
                const bDone = todayDone.includes(b.id) ? 1 : 0;
                return aDone - bDone;
              })
              .map((skill) => {
              const done = todayDone.includes(skill.id);
              const catColor = CATEGORY_COLORS[skill.category] || "#00d4ff";
              return (
                <motion.div
                  key={skill.id}
                  layout
                  className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{
                    background: done ? "rgba(0,212,255,0.05)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${done ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.06)"}`,
                    opacity: done ? 0.6 : 1,
                  }}
                >
                  <button
                    onClick={() => {
                      const currentDone = targets?.date === today ? targets.completedSkillIds : [];
                      let newDone: string[];
                      if (currentDone.includes(skill.id)) {
                        newDone = currentDone.filter(id => id !== skill.id);
                      } else {
                        newDone = [...currentDone, skill.id];
                        sound.logSession();
                      }
                      storage.setTargets({ date: today, completedSkillIds: newDone });
                    }}
                    className="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: done ? "#00d4ff" : catColor,
                      background: done ? "#00d4ff" : "transparent",
                    }}
                  >
                    {done && <span className="text-[10px] font-bold text-[#0a0f1e]">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium text-foreground truncate ${done ? "line-through opacity-60" : ""}`}>
                      {skill.name}
                    </div>
                    {skill.dailyTarget && (
                      <div className="text-xs text-muted-foreground truncate">{skill.dailyTarget}</div>
                    )}
                  </div>
                  <button
                    onClick={() => setTimerSkill(skill)}
                    className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:scale-105"
                    style={{ background: `${catColor}15`, color: catColor, border: `1px solid ${catColor}30` }}
                  >
                    <Timer className="w-3 h-3" /> Start
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* My Skills */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>My Skills</h2>
          <Button
            data-testid="button-add-skill-header"
            size="sm"
            onClick={() => { setEditSkill(null); setShowSkillModal(true); }}
            className="gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4" /> Add Skill
          </Button>
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No skills added yet — go to the Skills page to add your first one!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => {
              const color = CATEGORY_COLORS[skill.category] || "#00D4FF";
              return (
                <button
                  key={skill.id}
                  onClick={() => navigate("/skills")}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "6px 14px",
                    background: `${color}18`,
                    border: `1px solid ${color}44`,
                    borderRadius: 20,
                    fontSize: 13,
                    color,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "'Sora', sans-serif",
                  }}
                >
                  {skill.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button
        data-testid="button-fab-add"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setEditSkill(null); setShowSkillModal(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg z-30"
        style={{ boxShadow: "0 0 30px rgba(0, 212, 255, 0.4)" }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <SkillModal
        open={showSkillModal}
        onClose={() => { setShowSkillModal(false); setEditSkill(null); }}
        onSave={handleSaveSkill}
        skill={editSkill}
      />
      <LogPracticeModal
        open={!!logSkill}
        onClose={() => setLogSkill(null)}
        onSave={handleLogPractice}
        skill={logSkill}
      />
      {timerSkill && (
        <FocusTimerModal
          open={!!timerSkill}
          onClose={() => setTimerSkill(null)}
          skillId={timerSkill.id}
          skillName={timerSkill.name}
        />
      )}
      <ConfirmDialog
        open={!!deleteSkillId}
        title="Delete Skill?"
        message={`This will permanently delete ${skills.find(s => s.id === deleteSkillId)?.name || "this skill"} and all its sessions and progress. This cannot be undone.`}
        confirmLabel="🗑️ Delete Forever"
        onConfirm={() => { handleDeleteSkill(); toast({ description: "✓ Skill deleted" }); }}
        onCancel={() => setDeleteSkillId(null)}
        danger
      />
      {newBadges.length > 0 && (
        <BadgeUnlockModal badgeIds={newBadges} onDismiss={() => setNewBadges([])} />
      )}
    </div>
  );
}
