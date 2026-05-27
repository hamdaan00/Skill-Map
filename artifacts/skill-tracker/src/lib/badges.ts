import { Skill, Session, BadgeUnlock, DailyTargets } from "./storage";

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockCondition: string;
}

export const BADGES: BadgeDefinition[] = [
  { id: "first_step", name: "First Step", icon: "👶", description: "Added your first skill", unlockCondition: "Add your first skill" },
  { id: "on_fire", name: "On Fire", icon: "🔥", description: "Reached a 3-day streak", unlockCondition: "3-day streak" },
  { id: "week_warrior", name: "Week Warrior", icon: "⚔️", description: "Completed a 7-day streak", unlockCondition: "7-day streak" },
  { id: "monthly_master", name: "Monthly Master", icon: "🏅", description: "Completed a 30-day streak", unlockCondition: "30-day streak" },
  { id: "skill_collector", name: "Skill Collector", icon: "📚", description: "Tracking 5 or more skills", unlockCondition: "Track 5+ skills" },
  { id: "variety_pack", name: "Variety Pack", icon: "🎨", description: "Skills in 3 different categories", unlockCondition: "3 different categories" },
  { id: "perfect_day", name: "Perfect Day", icon: "✅", description: "Completed all daily targets in one day", unlockCondition: "All targets in a day" },
  { id: "perfect_week", name: "Perfect Week", icon: "🌟", description: "All targets every day for 7 days", unlockCondition: "All targets for 7 days" },
  { id: "halfway_hero", name: "Halfway Hero", icon: "💪", description: "Reached 50% progress on any skill", unlockCondition: "50% on any skill" },
  { id: "level_up", name: "Level Up", icon: "🚀", description: "Reached 100% progress on a skill", unlockCondition: "100% on any skill" },
  { id: "dedicated", name: "Dedicated", icon: "🎯", description: "Logged practice 10 times total", unlockCondition: "10 total practice logs" },
  { id: "legend", name: "Legend", icon: "🏆", description: "Earned all other badges", unlockCondition: "Earn all badges" },
  // New badges
  { id: "deep_focus", name: "Deep Focus", icon: "🧘", description: "Completed 5 Pomodoro sessions", unlockCondition: "5 Pomodoro sessions" },
  { id: "flow_state", name: "Flow State", icon: "🌊", description: "Completed 20 Pomodoro sessions", unlockCondition: "20 Pomodoro sessions" },
  { id: "first_rank", name: "First Rank", icon: "🥉", description: "Any skill reached Level 2", unlockCondition: "Any skill Level 2" },
  { id: "rising_star", name: "Rising Star", icon: "🌠", description: "Any skill reached Level 4", unlockCondition: "Any skill Level 4" },
  { id: "grandmaster", name: "Grandmaster", icon: "👑", description: "Any skill reached Level 6", unlockCondition: "Any skill Level 6" },
  { id: "rock_solid", name: "Rock Solid", icon: "💎", description: "Consistency score above 80 for 7 days", unlockCondition: "Score 80+ for 7 days" },
  { id: "week_champion", name: "Week Champion", icon: "🏁", description: "Completed first weekly challenge", unlockCondition: "Complete a weekly challenge" },
  { id: "duel_victor", name: "Duel Victor", icon: "⚔️", description: "Won a Skill Duel", unlockCondition: "Win a duel" },
  { id: "good_fight", name: "Good Fight", icon: "🤝", description: "Completed a Skill Duel", unlockCondition: "Complete a duel" },
  { id: "reflective_learner", name: "Reflective Learner", icon: "🪞", description: "Wrote 10 journal entries", unlockCondition: "10 journal entries" },
  { id: "mood_master", name: "Mood Master", icon: "😊", description: "Logged mood for 14 consecutive days", unlockCondition: "14 consecutive mood logs" },
];

export function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const uniqueDates = new Set(sessions.map(s => s.date));
  let streak = 0;
  const currentDate = new Date(today);
  while (true) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (uniqueDates.has(dateStr)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function checkBadges(
  skills: Skill[],
  sessions: Session[],
  unlockedBadges: BadgeUnlock[],
  _targets?: DailyTargets | null,
  pomodoroCount?: number,
  journalCount?: number,
  consistencyHistory?: { date: string; score: number }[],
  moodLogs?: { date: string; mood: number }[],
): string[] {
  const unlockedIds = new Set(unlockedBadges.map(b => b.badgeId));
  const newlyUnlocked: string[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition && !unlockedIds.has(id)) {
      newlyUnlocked.push(id);
      unlockedIds.add(id);
    }
  };

  const streak = calculateStreak(sessions);
  const categories = new Set(skills.map(s => s.category));
  const pomos = pomodoroCount ?? 0;

  check("first_step", skills.length >= 1);
  check("on_fire", streak >= 3);
  check("week_warrior", streak >= 7);
  check("monthly_master", streak >= 30);
  check("skill_collector", skills.length >= 5);
  check("variety_pack", categories.size >= 3);
  check("halfway_hero", skills.some(s => s.progress >= 50));
  check("level_up", skills.some(s => s.progress >= 100));
  check("dedicated", sessions.length >= 10);
  check("deep_focus", pomos >= 5);
  check("flow_state", pomos >= 20);
  check("first_rank", skills.some(s => s.level >= 2));
  check("rising_star", skills.some(s => s.level >= 4));
  check("grandmaster", skills.some(s => s.level >= 6));
  check("reflective_learner", (journalCount ?? 0) >= 10);

  // Consistency rock solid: 7 days of 80+
  if (consistencyHistory && consistencyHistory.length >= 7) {
    const last7 = consistencyHistory.slice(-7);
    check("rock_solid", last7.every(e => e.score >= 80));
  }

  // Mood master: 14 consecutive days
  if (moodLogs && moodLogs.length >= 14) {
    const sorted = [...moodLogs].sort((a, b) => a.date.localeCompare(b.date));
    let consecutive = 1, max = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].date);
      const curr = new Date(sorted[i].date);
      const diff = (curr.getTime() - prev.getTime()) / 86400000;
      if (diff === 1) { consecutive++; max = Math.max(max, consecutive); }
      else consecutive = 1;
    }
    check("mood_master", max >= 14);
  }

  const allOthers = BADGES.filter(b => b.id !== "legend");
  const hasAll = allOthers.every(b => unlockedIds.has(b.id));
  check("legend", hasAll);

  return newlyUnlocked;
}

export const CATEGORY_COLORS: Record<string, string> = {
  Tech: "#00D4FF",
  Music: "#9B59B6",
  Fitness: "#2ECC71",
  Language: "#E67E22",
  Art: "#E91E63",
  Other: "#3498DB",
};

export const CATEGORIES = Object.keys(CATEGORY_COLORS);
