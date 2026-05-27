export interface User {
  name: string;
  avatar: string;
  reminderTime: string;
  reminderEnabled: boolean;
  theme: 'dark' | 'light';
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  description: string;
  dailyTarget: string;
  progress: number;
  createdAt: string;
  lastPracticed: string | null;
  scheduledDays: string[];
  xp: number;
  level: number;
}

export interface Session {
  id: string;
  skillId: string;
  date: string;
  duration: number;
  notes: string;
  progress: number;
  loggedAt: string;
  mood: number;
  xpEarned: number;
}

export interface BadgeUnlock {
  badgeId: string;
  unlockedAt: string;
}

export interface DailyTargets {
  date: string;
  completedSkillIds: string[];
}

export interface WeeklyReview {
  weekStart: string;
  sessions: number;
  skillsPracticed: string[];
  skillsSkipped: string[];
  streak: number;
  bestSkill: string;
  avgMood: number;
}

export interface Challenge {
  id: string;
  description: string;
  type: string;
  target: number;
  current: number;
  completed: boolean;
  reward: string;
  weekStart: string;
}

export interface Duel {
  id: string;
  skillName: string;
  skillId: string;
  duration: number;
  metric: 'sessions' | 'xp';
  startDate: string;
  endDate: string;
  myScore: number;
  opponentName: string;
  opponentScore: number;
  status: 'active' | 'won' | 'lost';
  isChallenger: boolean;
}

export interface ConsistencyEntry {
  date: string;
  score: number;
}

export interface JournalEntry {
  id: string;
  skillId: string;
  date: string;
  mood: number;
  text: string;
  sessionId?: string;
}

export interface MoodLog {
  date: string;
  mood: number;
}

export interface AccountabilityPartner {
  name: string;
  avatar: string;
  streak: number;
  skills: string[];
  profileId: string;
  syncedAt: string;
}

const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('storage-update'));
  } catch {
    // silent
  }
};

export const storage = {
  getUser: () => getItem<User | null>('pst_user', null),
  setUser: (user: User) => setItem('pst_user', user),

  getSkills: () => getItem<Skill[]>('pst_skills', []),
  setSkills: (skills: Skill[]) => setItem('pst_skills', skills),

  getSessions: () => getItem<Session[]>('pst_sessions', []),
  setSessions: (sessions: Session[]) => setItem('pst_sessions', sessions),

  getBadges: () => getItem<BadgeUnlock[]>('pst_badges', []),
  setBadges: (badges: BadgeUnlock[]) => setItem('pst_badges', badges),

  getTargets: () => getItem<DailyTargets | null>('pst_targets', null),
  setTargets: (targets: DailyTargets) => setItem('pst_targets', targets),

  getLastQuote: () => getItem<number>('pst_last_quote', -1),
  setLastQuote: (index: number) => setItem('pst_last_quote', index),

  getWeeklyIntention: () => getItem<string>('pst_weekly_intention', ''),
  setWeeklyIntention: (text: string) => setItem('pst_weekly_intention', text),

  getWeeklyReviews: () => getItem<WeeklyReview[]>('pst_weekly_reviews', []),
  setWeeklyReviews: (reviews: WeeklyReview[]) => setItem('pst_weekly_reviews', reviews),

  getChallenges: () => getItem<Challenge[]>('pst_challenges', []),
  setChallenges: (challenges: Challenge[]) => setItem('pst_challenges', challenges),

  getChallengeHistory: () => getItem<Challenge[]>('pst_challenge_history', []),
  setChallengeHistory: (history: Challenge[]) => setItem('pst_challenge_history', history),

  getDuels: () => getItem<Duel[]>('pst_duels', []),
  setDuels: (duels: Duel[]) => setItem('pst_duels', duels),

  getConsistencyHistory: () => getItem<ConsistencyEntry[]>('pst_consistency_history', []),
  setConsistencyHistory: (history: ConsistencyEntry[]) => setItem('pst_consistency_history', history),

  getPartner: () => getItem<AccountabilityPartner | null>('pst_partner', null),
  setPartner: (partner: AccountabilityPartner | null) => setItem('pst_partner', partner),

  getJournal: () => getItem<JournalEntry[]>('pst_journal', []),
  setJournal: (entries: JournalEntry[]) => setItem('pst_journal', entries),

  getMoodLog: () => getItem<MoodLog[]>('pst_mood_log', []),
  setMoodLog: (logs: MoodLog[]) => setItem('pst_mood_log', logs),

  getTheme: () => getItem<string>('pst_theme', 'midnight'),
  setTheme: (theme: string) => setItem('pst_theme', theme),

  getSoundEnabled: () => getItem<boolean>('pst_sound_enabled', true),
  setSoundEnabled: (enabled: boolean) => setItem('pst_sound_enabled', enabled),

  getProfileId: () => getItem<string>('pst_profile_id', ''),
  setProfileId: (id: string) => setItem('pst_profile_id', id),

  getPomodoroCount: () => getItem<number>('pst_pomodoro_count', 0),
  setPomodoroCount: (count: number) => setItem('pst_pomodoro_count', count),

  getWeeklyReviewDismissed: () => getItem<string>('pst_review_dismissed', ''),
  setWeeklyReviewDismissed: (date: string) => setItem('pst_review_dismissed', date),

  clearAll: () => {
    const keys = [
      'pst_user','pst_skills','pst_sessions','pst_badges','pst_targets','pst_last_quote',
      'pst_weekly_intention','pst_weekly_reviews','pst_challenges','pst_challenge_history',
      'pst_duels','pst_consistency_history','pst_partner','pst_journal','pst_mood_log',
      'pst_theme','pst_sound_enabled','pst_profile_id','pst_pomodoro_count','pst_review_dismissed',
    ];
    keys.forEach(k => localStorage.removeItem(k));
    window.dispatchEvent(new Event('storage-update'));
  },
};
