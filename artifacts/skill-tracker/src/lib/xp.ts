export const XP_LEVELS = [
  { level: 1, title: 'Beginner', xpRequired: 0, color: '#9B9B9B' },
  { level: 2, title: 'Apprentice', xpRequired: 50, color: '#2ECC71' },
  { level: 3, title: 'Skilled', xpRequired: 150, color: '#00D4FF' },
  { level: 4, title: 'Advanced', xpRequired: 350, color: '#9B59B6' },
  { level: 5, title: 'Expert', xpRequired: 700, color: '#E67E22' },
  { level: 6, title: 'Master', xpRequired: 1200, color: '#FFB830' },
];

export function getLevelInfo(xp: number) {
  let current = XP_LEVELS[0];
  let next = XP_LEVELS[1];
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i].xpRequired) {
      current = XP_LEVELS[i];
      next = XP_LEVELS[i + 1] || XP_LEVELS[i];
    }
  }
  const xpIntoLevel = xp - current.xpRequired;
  const xpForNext = next.xpRequired - current.xpRequired;
  const progress = current.level === 6 ? 100 : Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100));
  return { current, next, xpIntoLevel, xpForNext, progress };
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  for (const l of XP_LEVELS) {
    if (xp >= l.xpRequired) level = l.level;
  }
  return level;
}

export function calcSessionXP(duration: number, mood: number, streak: number, completedTarget: boolean): number {
  let xp = 10;
  if (duration > 30) xp += 5;
  if (mood === 5) xp += 3;
  if (completedTarget) xp += 5;
  if (streak >= 3) xp += 2;
  return xp;
}
