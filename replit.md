# Skill Map — Personal Skill Tracker

A premium, gamified personal skill-tracking web app. All data stored in localStorage — no backend required.

## Run & Operate

- `pnpm --filter @workspace/skill-tracker run dev` — run the skill tracker (port 24477, preview path `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- React + Vite, wouter for routing
- shadcn/ui components, Tailwind CSS
- Framer Motion animations
- Recharts for data visualization
- react-hook-form + zod for forms
- Web Audio API for sound effects (no external audio files)
- localStorage only — no API calls

## Where things live

```
artifacts/skill-tracker/src/
├── App.tsx                   — Root app, routes, TimerProvider
├── contexts/TimerContext.tsx  — Global Pomodoro timer state
├── lib/
│   ├── storage.ts            — All localStorage helpers + types
│   ├── badges.ts             — Badge definitions (23 badges) + checkBadges + calculateStreak
│   ├── xp.ts                 — XP/level system (6 levels: Beginner → Master)
│   ├── sound.ts              — Web Audio API sound engine
│   ├── consistency.ts        — Consistency score (0–100) formula
│   └── quotes.ts             — 50 motivational quotes
├── components/
│   ├── Layout.tsx             — Sidebar nav (7 items) + mobile drawer + TimerPill
│   ├── TimerPill.tsx          — Persistent timer indicator in navbar
│   ├── FocusTimerModal.tsx    — Pomodoro/custom timer with SVG ring
│   ├── JournalDrawer.tsx      — Slide-in journal for each skill
│   ├── SkillModal.tsx         — Add/edit skill (with scheduled days)
│   ├── LogPracticeModal.tsx   — Log practice with mood picker
│   └── BadgeUnlockModal.tsx   — Badge celebration overlay
└── pages/
    ├── Onboarding.tsx   — 3-step setup flow
    ├── Dashboard.tsx    — Main hub: XP cards, decay warning, consistency gauge, schedule widget
    ├── Progress.tsx     — Charts: progress, weekly sessions, category, mood, peak hours, skill health
    ├── Targets.tsx      — Daily targets checklist with confetti
    ├── Challenges.tsx   — Weekly generated challenges (3 per week)
    ├── Achievements.tsx — 23-badge gallery
    ├── Duels.tsx        — Skill duels with shareable links
    └── Settings.tsx     — Profile, sound, themes, public profile, accountability partner
```

## localStorage keys

```
pst_user                 — user profile object
pst_skills               — array of Skill objects (with xp, level, scheduledDays)
pst_sessions             — array of Session objects (with loggedAt, mood, xpEarned)
pst_badges               — array of unlocked badge objects
pst_targets              — today's completed skill IDs
pst_weekly_intention     — string goal for the week
pst_weekly_reviews       — array of weekly review summaries
pst_challenges           — current week's 3 challenge objects
pst_challenge_history    — completed challenges
pst_duels                — active/completed duel objects
pst_consistency_history  — { date, score } entries
pst_partner              — accountability partner data
pst_journal              — skill journal entries
pst_mood_log             — daily mood check-ins
pst_theme                — current theme name
pst_sound_enabled        — boolean
pst_profile_id           — public profile hash
pst_pomodoro_count       — total completed pomodoro sessions
pst_review_dismissed     — date string (dismissal flag)
pst_last_quote           — last quote index shown
```

## Features

- **XP & Levels** — 6 levels (Beginner → Master), XP earned per session with mood/duration/streak bonuses
- **Focus Timer** — Pomodoro (25/5) + custom mode, SVG ring countdown, auto-logs session on complete, global state persists across pages
- **Skill Decay** — Visual fade + warning badges after 5/10 days inactive
- **Consistency Score** — 0–100 gauge using streak, scheduled days, targets, session frequency
- **Mood Tracking** — 5-point emoji picker, stored per session, shown in Progress mood chart
- **Peak Hours** — 24-bar heatmap showing when you most practice
- **Skill Health** — Color-coded recency (green/yellow/red)
- **Skill Journal** — Per-skill journal drawer with mood + date
- **Weekly Challenges** — 3 auto-generated challenges every Monday
- **Skill Duels** — URL-encoded shareable challenge links, honor system
- **Sound Design** — Web Audio API: chimes, fanfares, sweeps for key events
- **6 Themes** — Midnight, Daylight, Sakura, Winter Frost, Ember, Ocean
- **23 Badges** — Including Deep Focus, Flow State, First Rank, Rising Star, Grandmaster, etc.
- **Accountability Partner** — Base64-encoded invite links, offline sync
- **Public Profile** — Toggle in Settings, shareable profile ID

## Architecture decisions

- All social/sharing features (duels, partner, public profile) use URL encoding + base64 — no backend needed
- Sound engine uses Web Audio API oscillators/gains only — zero external files
- Timer runs in React context so it persists during navigation
- Badges checked on every write via `checkBadges()` utility
- Consistency score recalculated live from raw sessions (no caching)

## User preferences

- Dark mode default (navy #0A0F1E, cyan #00D4FF primary, gold #FFB830 accent)
- Google Fonts: Sora (headings) + DM Sans (body)
- Glassmorphism cards, Framer Motion page transitions
- All localStorage keys prefixed with `pst_`
- No API calls, no backend — pure localStorage

## Gotchas

- Do NOT import from @workspace/api-client-react — localStorage only
- Sound requires at least one user click before playing (browser autoplay policy)
- `scheduledDays` defaults to `[]` (all days) when empty
- Timer context auto-logs sessions on Pomodoro focus complete
