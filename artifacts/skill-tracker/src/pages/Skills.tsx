import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, Search, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { storage, Skill } from "@/lib/storage";
import { CATEGORY_COLORS, checkBadges } from "@/lib/badges";
import { getLevelInfo, getLevelFromXP, calcSessionXP } from "@/lib/xp";
import { sound } from "@/lib/sound";
import SkillModal from "@/components/SkillModal";
import LogPracticeModal from "@/components/LogPracticeModal";
import BadgeUnlockModal from "@/components/BadgeUnlockModal";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { calculateStreak } from "@/lib/badges";

function getDaysInactive(lastPracticed: string | null): number {
  if (!lastPracticed) return 0; // never practiced → no decay
  return Math.floor((Date.now() - new Date(lastPracticed).getTime()) / 86400000);
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editSkill, setEditSkill] = useState<Skill | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [logSkill, setLogSkill] = useState<Skill | null>(null);
  const [newBadges, setNewBadges] = useState<string[]>([]);

  const today = new Date().toISOString().split("T")[0];

  const reload = useCallback(() => setSkills(storage.getSkills()), []);

  useEffect(() => {
    reload();
    window.addEventListener("storage-update", reload);
    return () => window.removeEventListener("storage-update", reload);
  }, [reload]);

  const checkAndUnlock = useCallback((updatedSkills: Skill[]) => {
    const sessions = storage.getSessions();
    const current = storage.getBadges();
    const journal = storage.getJournal();
    const pomos = storage.getPomodoroCount();
    const newlyUnlocked = checkBadges(updatedSkills, sessions, current, null, pomos, journal.length);
    if (newlyUnlocked.length > 0) {
      const updated = [...current, ...newlyUnlocked.map(id => ({ badgeId: id, unlockedAt: today }))];
      storage.setBadges(updated);
      setNewBadges(newlyUnlocked);
      sound.badgeUnlock();
    }
  }, [today]);

  const handleSave = (data: { name: string; category: string; description: string; dailyTarget: string; progress: number; scheduledDays: string[] }) => {
    const all = storage.getSkills();
    let updated: Skill[];
    if (editSkill) {
      updated = all.map(s => s.id === editSkill.id ? { ...s, ...data } : s);
    } else {
      updated = [...all, {
        id: crypto.randomUUID(),
        ...data,
        createdAt: today,
        lastPracticed: null,
        xp: 0,
        level: 1,
      }];
      sound.logSession();
    }
    storage.setSkills(updated);
    checkAndUnlock(updated);
    setShowModal(false);
    setEditSkill(null);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = storage.getSkills().filter(s => s.id !== deleteId);
    storage.setSkills(updated);
    setDeleteId(null);
  };

  const handleLog = (data: { date: string; duration: number; notes: string; progress: number; mood: number }) => {
    if (!logSkill) return;
    const allSessions = storage.getSessions();
    const streak = calculateStreak(allSessions);
    const targets = storage.getTargets();
    const completedTarget = targets?.date === today && targets.completedSkillIds.includes(logSkill.id);
    const xpEarned = calcSessionXP(data.duration, data.mood, streak, completedTarget);

    const newSession = {
      id: crypto.randomUUID(),
      skillId: logSkill.id,
      ...data,
      loggedAt: new Date().toISOString(),
      xpEarned,
    };
    storage.setSessions([...allSessions, newSession]);

    const newXP = (logSkill.xp || 0) + xpEarned;
    const newLevel = getLevelFromXP(newXP);
    const updatedSkills = storage.getSkills().map(s =>
      s.id === logSkill.id ? { ...s, progress: data.progress, lastPracticed: data.date, xp: newXP, level: newLevel } : s
    );
    storage.setSkills(updatedSkills);

    const currentCompleted = targets?.date === today ? targets.completedSkillIds : [];
    if (!currentCompleted.includes(logSkill.id)) {
      storage.setTargets({ date: today, completedSkillIds: [...currentCompleted, logSkill.id] });
    }

    const moodLogs = storage.getMoodLog();
    if (!moodLogs.find(m => m.date === data.date)) {
      storage.setMoodLog([...moodLogs, { date: data.date, mood: data.mood }]);
    }

    sound.logSession();
    if (newLevel > (logSkill.level || 1)) sound.levelUp();
    checkAndUnlock(updatedSkills);
    setLogSkill(null);
  };

  const filtered = skills.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  );

  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
    item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } },
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>My Skills</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{skills.length} skill{skills.length !== 1 ? "s" : ""} tracked</p>
        </div>
        <Button onClick={() => { setEditSkill(null); setShowModal(true); }} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" /> Add Skill
        </Button>
      </div>

      {/* Search */}
      {skills.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
      )}

      {/* Empty state */}
      {skills.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 bg-card border border-dashed border-border rounded-2xl"
        >
          <div className="text-6xl mb-4">🌱</div>
          <h3 className="text-xl font-semibold text-foreground mb-2">No skills yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs mx-auto">
            Add your first skill to start tracking your growth journey.
          </p>
          <Button onClick={() => setShowModal(true)} className="rounded-xl gap-2">
            <Plus className="w-4 h-4" /> Add Your First Skill
          </Button>
        </motion.div>
      )}

      {/* Skills Grid */}
      {filtered.length > 0 && (
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filtered.map(skill => {
            const catColor = CATEGORY_COLORS[skill.category] || "#3498DB";
            const xp = skill.xp || 0;
            const level = skill.level || 1;
            const { current: lvlInfo, next: nextLvl, xpIntoLevel, xpForNext } = getLevelInfo(xp);
            const daysInactive = getDaysInactive(skill.lastPracticed);
            const isRusty = daysInactive >= 5;
            const isDecaying = daysInactive >= 10;

            return (
              <motion.div
                key={skill.id}
                variants={stagger.item}
                whileHover={{ y: -3 }}
                className={`bg-card border rounded-2xl p-5 transition-all ${
                  isDecaying ? "border-red-500/30 opacity-75" : isRusty ? "border-yellow-500/30 opacity-85" : "border-border"
                }`}
                style={{ boxShadow: `0 0 20px ${catColor}08` }}
              >
                {/* Level badge */}
                <div
                  className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold relative ml-auto"
                  style={{ backgroundColor: `${lvlInfo.color}25`, color: lvlInfo.color }}
                >
                  {level}
                </div>

                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-foreground truncate" style={{ fontFamily: "'Sora', sans-serif" }}>
                        {skill.name}
                      </span>
                      {(isRusty || isDecaying) && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${isDecaying ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                          {isDecaying ? "🔴" : "⚠️"}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${catColor}20`, color: catColor }}>
                        {skill.category}
                      </span>
                      <span className="text-xs font-medium" style={{ color: lvlInfo.color }}>{lvlInfo.title}</span>
                    </div>
                  </div>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ml-2"
                    style={{ backgroundColor: `${lvlInfo.color}25`, color: lvlInfo.color }}>
                    {level}
                  </div>
                </div>

                {skill.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{skill.description}</p>
                )}

                {skill.dailyTarget && (
                  <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                    🎯 {skill.dailyTarget}
                  </p>
                )}

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
                    <span className="text-muted-foreground flex items-center gap-1"><Zap className="w-3 h-3" /> XP</span>
                    <span style={{ color: lvlInfo.color }}>
                      {xpIntoLevel} / {level === 6 ? "MAX" : `${xpForNext} → ${nextLvl.title}`}
                    </span>
                  </div>
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${getLevelInfo(xp).progress}%`, backgroundColor: lvlInfo.color }} />
                  </div>
                </div>

                {/* Scheduled days */}
                {skill.scheduledDays?.length > 0 && (
                  <div className="flex gap-1 mb-3 flex-wrap">
                    {skill.scheduledDays.map(d => (
                      <span key={d} className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{d}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {skill.lastPracticed
                      ? (skill.lastPracticed === today ? "Practiced today" : `${daysInactive}d ago`)
                      : "Never practiced"}
                  </span>
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setLogSkill(skill)}
                      className="h-7 px-2.5 text-xs rounded-lg"
                      style={{ borderColor: `${catColor}40`, color: catColor }}
                    >
                      Log
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setEditSkill(skill); setShowModal(true); }}
                      className="h-7 w-7 p-0 rounded-lg"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteId(skill.id)}
                      className="h-7 w-7 p-0 rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {filtered.length === 0 && skills.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No skills match "<span className="text-foreground">{search}</span>"
        </div>
      )}

      {/* FAB */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => { setEditSkill(null); setShowModal(true); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg z-30"
        style={{ boxShadow: "0 0 30px rgba(0, 212, 255, 0.4)" }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>

      <SkillModal open={showModal} onClose={() => { setShowModal(false); setEditSkill(null); }} onSave={handleSave} skill={editSkill} />
      <LogPracticeModal open={!!logSkill} onClose={() => setLogSkill(null)} onSave={handleLog} skill={logSkill} />
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Skill?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this skill and all its practice sessions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-xl bg-destructive hover:bg-destructive/90" onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {newBadges.length > 0 && <BadgeUnlockModal badgeIds={newBadges} onDismiss={() => setNewBadges([])} />}
    </div>
  );
}
