import { Skill, Session, DailyTargets } from './storage';
import { calculateStreak } from './badges';

export function calcConsistencyScore(
  skills: Skill[],
  sessions: Session[],
  targets: DailyTargets | null
): number {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // 1. Streak component (30%)
  const streak = calculateStreak(sessions);
  const streakScore = Math.min(100, (streak / 30) * 100) * 0.30;

  // 2. Scheduled days practiced this month (30%)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  let scheduledTotal = 0, scheduledPracticed = 0;
  for (let d = new Date(monthStart); d <= today; d.setDate(d.getDate() + 1)) {
    const dStr = d.toISOString().split('T')[0];
    const dow = dayOfWeek[d.getDay()];
    skills.forEach(skill => {
      if (skill.scheduledDays && skill.scheduledDays.includes(dow)) {
        scheduledTotal++;
        if (sessions.some(s => s.skillId === skill.id && s.date === dStr)) {
          scheduledPracticed++;
        }
      }
    });
  }
  const scheduleScore = scheduledTotal > 0
    ? (scheduledPracticed / scheduledTotal) * 100 * 0.30
    : 50 * 0.30;

  // 3. Daily targets completed this week (20%)
  const targetCount = skills.filter(s => s.dailyTarget).length;
  const targetsDone = targets?.date === todayStr ? targets.completedSkillIds.length : 0;
  const targetScore = targetCount > 0 ? (targetsDone / targetCount) * 100 * 0.20 : 50 * 0.20;

  // 4. Avg sessions per week over last 4 weeks (20%)
  const fourWeeksAgo = new Date(today);
  fourWeeksAgo.setDate(today.getDate() - 28);
  const recentSessions = sessions.filter(s => s.date >= fourWeeksAgo.toISOString().split('T')[0]);
  const avgPerWeek = recentSessions.length / 4;
  const sessionScore = Math.min(100, (avgPerWeek / 7) * 100) * 0.20;

  return Math.round(streakScore + scheduleScore + targetScore + sessionScore);
}

export function getConsistencyColor(score: number): string {
  if (score >= 71) return '#2ECC71';
  if (score >= 41) return '#E67E22';
  return '#E74C3C';
}
