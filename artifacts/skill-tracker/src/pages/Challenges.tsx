import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Flag, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storage, Challenge } from "@/lib/storage";
import { calculateStreak } from "@/lib/badges";

const CHALLENGE_TEMPLATES = [
  { type: "streak", description: "Practice any skill for 5 days this week", target: 5, reward: "Persistence" },
  { type: "pomodoro_day", description: "Log 3 Pomodoro sessions in one day", target: 3, reward: "Deep Work" },
  { type: "targets_days", description: "Complete all daily targets on 3 different days", target: 3, reward: "Discipline" },
  { type: "neglected", description: "Practice a skill you haven't touched in 5+ days", target: 1, reward: "Revival" },
  { type: "level3", description: "Reach Level 3 in any skill this week", target: 1, reward: "Growth" },
  { type: "on_fire", description: "Log a practice session with mood On Fire 3 times", target: 3, reward: "Fire Starter" },
  { type: "new_skill", description: "Add a new skill and practice it at least twice", target: 2, reward: "Explorer" },
  { type: "five_streak", description: "Achieve a 5-day streak", target: 5, reward: "Momentum" },
];

function getMondayOfWeek(): string {
  const today = new Date();
  const day = today.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + offset);
  return monday.toISOString().split("T")[0];
}

function getDaysLeft(): number {
  const today = new Date();
  const sunday = new Date(today);
  const daysUntilSunday = 7 - today.getDay();
  sunday.setDate(today.getDate() + (daysUntilSunday === 7 ? 0 : daysUntilSunday));
  return Math.max(0, Math.ceil((sunday.getTime() - today.getTime()) / 86400000));
}

function generateChallenges(weekStart: string): Challenge[] {
  const shuffled = [...CHALLENGE_TEMPLATES].sort(() => Math.random() - 0.5).slice(0, 3);
  return shuffled.map((t, i) => ({
    id: `${weekStart}-${i}`,
    description: t.description,
    type: t.type,
    target: t.target,
    current: 0,
    completed: false,
    reward: t.reward,
    weekStart,
  }));
}

function updateChallengeProgress(challenges: Challenge[]): Challenge[] {
  const sessions = storage.getSessions();
  const skills = storage.getSkills();
  const targets = storage.getTargets();
  const today = new Date().toISOString().split("T")[0];
  const weekStart = getMondayOfWeek();
  const pomos = storage.getPomodoroCount();

  return challenges.map(c => {
    if (c.completed) return c;
    let current = 0;
    switch (c.type) {
      case "streak": {
        const uniqueDates = new Set(sessions.map(s => s.date));
        let streak = 0;
        const d = new Date();
        for (let i = 0; i < 7; i++) {
          if (uniqueDates.has(d.toISOString().split("T")[0])) streak++;
          d.setDate(d.getDate() - 1);
        }
        current = streak;
        break;
      }
      case "pomodoro_day": current = Math.min(pomos, c.target); break;
      case "targets_days": {
        const t = storage.getTargets();
        current = t?.date === today && t.completedSkillIds.length >= skills.filter(s => s.dailyTarget).length ? 1 : 0;
        break;
      }
      case "neglected": {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const practiced = sessions.filter(s => s.date >= fiveDaysAgo.toISOString().split("T")[0]);
        const neglected = skills.find(s => s.lastPracticed && new Date(s.lastPracticed) < fiveDaysAgo);
        current = neglected && practiced.find(p => p.skillId === neglected.id) ? 1 : 0;
        break;
      }
      case "level3": current = skills.some(s => (s.level || 1) >= 3) ? 1 : 0; break;
      case "on_fire": current = sessions.filter(s => s.mood === 5 && s.date >= weekStart).length; break;
      case "new_skill": {
        const newSkill = skills.find(s => s.createdAt >= weekStart);
        if (newSkill) current = sessions.filter(s => s.skillId === newSkill.id).length;
        break;
      }
      case "five_streak": {
        current = Math.min(calculateStreak(sessions), 5);
        break;
      }
    }
    const completed = current >= c.target;
    return { ...c, current: Math.min(current, c.target), completed };
  });
}

export default function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [history, setHistory] = useState(storage.getChallengeHistory());

  const load = useCallback(() => {
    const weekStart = getMondayOfWeek();
    let stored = storage.getChallenges();
    if (!stored.length || stored[0]?.weekStart !== weekStart) {
      stored = generateChallenges(weekStart);
      storage.setChallenges(stored);
    }
    const updated = updateChallengeProgress(stored);
    storage.setChallenges(updated);

    // Check for newly completed
    const newlyCompleted = updated.filter(c => c.completed && !stored.find(s => s.id === c.id)?.completed);
    if (newlyCompleted.length > 0) {
      const updatedHistory = [...storage.getChallengeHistory(), ...newlyCompleted];
      storage.setChallengeHistory(updatedHistory);
      setHistory(updatedHistory);

      // Unlock badge
      const badges = storage.getBadges();
      if (!badges.find(b => b.badgeId === "week_champion")) {
        storage.setBadges([...badges, { badgeId: "week_champion", unlockedAt: new Date().toISOString().split("T")[0] }]);
      }
    }

    setChallenges(updated);
    setHistory(storage.getChallengeHistory());
  }, []);

  useEffect(() => {
    load();
    const handler = () => load();
    window.addEventListener("storage-update", handler);
    return () => window.removeEventListener("storage-update", handler);
  }, [load]);

  const handleRefresh = () => {
    const weekStart = getMondayOfWeek();
    const fresh = generateChallenges(weekStart);
    storage.setChallenges(fresh);
    load();
  };

  const daysLeft = getDaysLeft();
  const completed = challenges.filter(c => c.completed).length;
  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
    item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
            Weekly Challenges
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {completed}/{challenges.length} completed · {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
          </p>
        </div>
        <Button
          data-testid="button-refresh-challenges"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2 rounded-xl"
        >
          <RefreshCw className="w-4 h-4" /> New Challenges
        </Button>
      </div>

      {/* Progress */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">This week's progress</span>
          <span className="text-foreground font-medium">{Math.round((completed / Math.max(challenges.length, 1)) * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(completed / Math.max(challenges.length, 1)) * 100}%` }}
            className="h-full bg-gradient-to-r from-primary to-green-400 rounded-full"
          />
        </div>
      </div>

      {/* Challenge Cards */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {challenges.map((challenge) => {
          const pct = Math.round((challenge.current / challenge.target) * 100);
          return (
            <motion.div
              key={challenge.id}
              variants={stagger.item}
              data-testid={`challenge-${challenge.id}`}
              className={`bg-card border rounded-2xl p-5 transition-all ${
                challenge.completed ? "border-green-500/40" : "border-border"
              }`}
              style={challenge.completed ? { boxShadow: "0 0 20px rgba(46, 204, 113, 0.1)" } : {}}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Flag className="w-4 h-4 text-primary shrink-0" />
                    <p className="text-sm font-medium text-foreground">{challenge.description}</p>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-muted-foreground">{challenge.current} / {challenge.target}</span>
                    <span className="text-xs text-primary">Reward: {challenge.reward} Badge</span>
                    <span className="text-xs text-muted-foreground">{daysLeft}d left</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${challenge.completed ? "bg-green-400" : "bg-primary"}`}
                    />
                  </div>
                </div>
                {challenge.completed && (
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                    <span className="text-xs font-bold text-green-400">DONE</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* History */}
      {history.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Completed Challenges</h3>
          <div className="space-y-2">
            {history.slice(-5).reverse().map((c, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-muted-foreground flex-1 truncate">{c.description}</span>
                <span className="text-xs text-primary">{c.reward}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
