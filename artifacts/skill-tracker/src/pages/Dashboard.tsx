import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Plus, RefreshCw, Edit2, Trash2, Timer, BookOpen, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [user, setUser] = useState(storage.getUser());
  const [unlockedBadges, setUnlockedBadges] = useState(storage.getBadges());
  const [targets, setTargets] = useState(storage.getTargets());

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
    return () => window.removeEventListener("storage-update", handler);
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
  const weekActivity = weekDates.map((date) => ({
    date,
    count: sessions.filter((s) => s.date === date).length,
  }));

  // Today's targets (respect scheduled days)
  const todayTargets = skills.filter((s) => {
    if (!s.dailyTarget) return false;
    if (!s.scheduledDays || s.scheduledDays.length === 0) return true;
    return s.scheduledDays.includes(todayDow);
  });
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
    checkAndUnlockBadges(updated, sessions);
    setShowSkillModal(false);
    setEditSkill(null);
  };

  const handleDeleteSkill = () => {
    if (!deleteSkillId) return;
    const updated = storage.getSkills().filter((s) => s.id !== deleteSkillId);
    storage.setSkills(updated);
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

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-muted";
    if (count === 1) return "bg-primary/30";
    if (count === 2) return "bg-primary/60";
    return "bg-primary";
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

      {/* Weekly Heatmap */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">This Week's Activity</h3>
        <div className="grid grid-cols-7 gap-2">
          {weekActivity.map(({ date, count }, i) => {
            const isToday = date === today;
            return (
              <div key={date} className="flex flex-col items-center gap-1.5">
                <div className="text-xs text-muted-foreground">{DAYS[i]}</div>
                <div
                  data-testid={`heatmap-${DAYS[i].toLowerCase()}`}
                  className={`w-8 h-8 rounded-lg ${getHeatmapColor(count)} ${isToday ? "ring-2 ring-primary" : ""} transition-all`}
                  title={`${count} session${count !== 1 ? "s" : ""}`}
                />
                <div className="text-xs text-muted-foreground">{count > 0 ? count : ""}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Today's Targets */}
      {todayTargets.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Today's Targets</h3>
            <span className="text-xs text-muted-foreground">{todayDone.length}/{todayTargets.length} done</span>
          </div>
          <div className="space-y-3">
            {todayTargets.map((skill) => {
              const done = todayDone.includes(skill.id);
              return (
                <div key={skill.id} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? "border-primary bg-primary" : "border-border"}`}
                    style={done ? {} : { borderColor: CATEGORY_COLORS[skill.category] }}
                  >
                    {done && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground truncate">{skill.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{skill.dailyTarget}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills Grid */}
      <div>
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-card border border-dashed border-border rounded-2xl"
          >
            <div className="text-5xl mb-4">🌱</div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No skills yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">Start tracking your first skill and begin your growth journey.</p>
            <Button data-testid="button-add-first-skill" onClick={() => setShowSkillModal(true)} className="rounded-xl">
              <Plus className="w-4 h-4 mr-2" /> Add Your First Skill
            </Button>
          </motion.div>
        ) : (
          <motion.div
            variants={stagger.container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {skills.map((skill) => {
              const catColor = CATEGORY_COLORS[skill.category] || "#3498DB";
              const daysInactive = getDaysInactive(skill.lastPracticed);
              const isRusty = daysInactive >= 5;
              const isDecaying = daysInactive >= 10;
              const xp = skill.xp || 0;
              const level = skill.level || 1;
              const { current: lvlInfo, next: nextLvl, xpIntoLevel, xpForNext } = getLevelInfo(xp);

              return (
                <motion.div
                  key={skill.id}
                  variants={stagger.item}
                  whileHover={{ y: -4 }}
                  data-testid={`card-skill-${skill.id}`}
                  className={`bg-card border rounded-2xl p-5 cursor-pointer group relative transition-all ${
                    isDecaying ? "opacity-70 border-red-500/30" : isRusty ? "opacity-80 border-yellow-500/30" : "border-border"
                  }`}
                  style={{ boxShadow: `0 0 20px ${catColor}08` }}
                >
                  {/* Level badge */}
                  <div
                    className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: `${lvlInfo.color}25`, color: lvlInfo.color }}
                  >
                    {level}
                  </div>

                  {/* Decay badge */}
                  {(isRusty || isDecaying) && (
                    <div className={`absolute top-3 left-3 text-xs px-1.5 py-0.5 rounded-full font-medium ${isDecaying ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {isDecaying ? "🔴 Decaying" : "⚠️ Rusty"}
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3 mt-1">
                    <div className="flex-1 min-w-0 mr-8">
                      <h3 className="font-semibold text-foreground truncate" style={{ fontFamily: "'Sora', sans-serif" }}>{skill.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${catColor}20`, color: catColor }}>
                          {skill.category}
                        </span>
                        <span className="text-xs font-medium" style={{ color: lvlInfo.color }}>{lvlInfo.title}</span>
                      </div>
                      {skill.scheduledDays && skill.scheduledDays.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {skill.scheduledDays.map(d => (
                            <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{d}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        data-testid={`button-edit-${skill.id}`}
                        onClick={() => { setEditSkill(skill); setShowSkillModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      ><Edit2 className="w-3.5 h-3.5" /></button>
                      <button
                        data-testid={`button-delete-${skill.id}`}
                        onClick={() => setDeleteSkillId(skill.id)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                      ><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-1 mb-2">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span><span>{skill.progress}%</span>
                    </div>
                    <Progress value={skill.progress} className="h-1.5" />
                  </div>

                  {/* XP Bar */}
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">XP</span>
                      <span style={{ color: lvlInfo.color }}>{xpIntoLevel} / {level === 6 ? "MAX" : `${xpForNext} to ${nextLvl.title}`}</span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${getLevelInfo(xp).progress}%`, backgroundColor: lvlInfo.color }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {skill.lastPracticed ? (skill.lastPracticed === today ? "Today" : skill.lastPracticed) : "Not practiced"}
                    </span>
                    <div className="flex gap-1.5">
                      <Button
                        data-testid={`button-timer-${skill.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => setTimerSkill(skill)}
                        className="h-7 w-7 p-0 rounded-lg"
                      >
                        <Timer className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-testid={`button-journal-${skill.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Store skill id in sessionStorage for journal drawer
                          sessionStorage.setItem('journal_skill_id', skill.id);
                          sessionStorage.setItem('journal_skill_name', skill.name);
                          window.dispatchEvent(new CustomEvent('open-journal', { detail: { skillId: skill.id, skillName: skill.name } }));
                        }}
                        className="h-7 w-7 p-0 rounded-lg"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        data-testid={`button-log-${skill.id}`}
                        size="sm"
                        variant="outline"
                        onClick={() => setLogSkill(skill)}
                        className="h-7 px-3 text-xs rounded-xl"
                        style={{ borderColor: `${catColor}40`, color: catColor }}
                      >
                        Log
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
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
      <AlertDialog open={!!deleteSkillId} onOpenChange={() => setDeleteSkillId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Skill?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this skill and all its sessions.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl" data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={handleDeleteSkill} data-testid="button-confirm-delete">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {newBadges.length > 0 && (
        <BadgeUnlockModal badgeIds={newBadges} onDismiss={() => setNewBadges([])} />
      )}
    </div>
  );
}
