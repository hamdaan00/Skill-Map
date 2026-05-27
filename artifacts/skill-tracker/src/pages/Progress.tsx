import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { storage, Skill, Session } from "@/lib/storage";
import { CATEGORY_COLORS, calculateStreak } from "@/lib/badges";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CHART_COLORS = ["#00D4FF","#9B59B6","#2ECC71","#E67E22","#E91E63","#F1C40F"];
const tooltipStyle = {
  background: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  color: "hsl(var(--foreground))",
  fontSize: 12,
};

const TABS = [
  { id: "overview", label: "Overview", icon: "📊" },
  { id: "charts",   label: "Charts",   icon: "📈" },
  { id: "calendar", label: "Calendar", icon: "📅" },
];

/* ── Overview Tab ─────────────────────────────────────────── */
function OverviewTab({ skills, sessions }: { skills: Skill[]; sessions: Session[] }) {
  const streak = calculateStreak(sessions);
  const totalMins = sessions.reduce((s, x) => s + (x.duration || 0), 0);
  const totalHrs = (totalMins / 60).toFixed(1);

  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 6);
  const weekStart = weekAgo.toISOString().split("T")[0];
  const sessionsThisWeek = sessions.filter(s => s.date >= weekStart).length;

  const avgProgress = skills.length
    ? Math.round(skills.reduce((s, x) => s + x.progress, 0) / skills.length)
    : 0;

  const stats = [
    { emoji: "🔥", label: "Current Streak", value: `${streak} day${streak !== 1 ? "s" : ""}`, color: "#f97316" },
    { emoji: "⏰", label: "Total Hours",     value: `${totalHrs} hrs`,                        color: "#00d4ff" },
    { emoji: "✅", label: "Sessions / Week", value: String(sessionsThisWeek),                  color: "#10b981" },
    { emoji: "📊", label: "Avg Progress",    value: `${avgProgress}%`,                         color: "#a78bfa" },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-2"
          >
            <span className="text-2xl">{s.emoji}</span>
            <div className="text-xl font-bold text-foreground" style={{ fontFamily: "'Sora',sans-serif", color: s.color }}>
              {s.value}
            </div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* CSS Skill progress bars */}
      {skills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-5" style={{ fontFamily: "'Sora',sans-serif" }}>
            Skill Progress
          </h3>
          <div className="space-y-4">
            {skills.map((skill, i) => {
              const color = CATEGORY_COLORS[skill.category] || CHART_COLORS[i % CHART_COLORS.length];
              return (
                <div key={skill.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground font-medium">{skill.name}</span>
                    <span className="text-xs font-semibold" style={{ color }}>{skill.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${skill.progress}%` }}
                      transition={{ duration: 0.7, delay: 0.1 + i * 0.06, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{ background: `linear-gradient(90deg, ${color}, ${color}aa)` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ── Charts Tab ───────────────────────────────────────────── */
function ChartsTab({ skills, sessions }: { skills: Skill[]; sessions: Session[] }) {
  const today = new Date();
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;

  const weekDays = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const lineData = weekDays.map((day, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + mondayOffset + i);
    const date = d.toISOString().split("T")[0];
    return { day, sessions: sessions.filter(s => s.date === date).length };
  });

  const categoryMap: Record<string, number> = {};
  sessions.forEach(s => {
    const skill = skills.find(sk => sk.id === s.skillId);
    if (skill) categoryMap[skill.category] = (categoryMap[skill.category] || 0) + 1;
  });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      {/* Weekly Sessions Line Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "'Sora',sans-serif" }}>
          Weekly Sessions
        </h3>
        <p className="text-xs text-muted-foreground mb-5">Practice sessions logged each day this week</p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="sessions" stroke="#00d4ff" strokeWidth={2.5} dot={{ r: 4, fill: "#00d4ff" }} activeDot={{ r: 6 }} isAnimationActive />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Category Donut */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5"
      >
        <h3 className="text-sm font-semibold text-foreground mb-1" style={{ fontFamily: "'Sora',sans-serif" }}>
          Category Breakdown
        </h3>
        <p className="text-xs text-muted-foreground mb-5">Sessions distributed across skill categories</p>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" isAnimationActive>
                {pieData.map((e, i) => <Cell key={i} fill={CATEGORY_COLORS[e.name] || CHART_COLORS[i % CHART_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend formatter={v => <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Log some sessions to see category breakdown.
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ── Calendar Tab ─────────────────────────────────────────── */
function CalendarTab({ sessions }: { sessions: Session[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const todayStr = now.toISOString().split("T")[0];

  const practicedDates = new Set(sessions.map(s => s.date));

  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return d.toISOString().split("T")[0];
  });

  const practicedThisMonth = monthDates.filter(d => practicedDates.has(d)).length;

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground" style={{ fontFamily: "'Sora',sans-serif" }}>
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-1">
          <button
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-primary/10 text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:bg-primary/10 text-muted-foreground hover:text-primary"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1">
        {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
          <div key={d} className="text-xs text-muted-foreground text-center font-medium py-1">{d}</div>
        ))}
        {/* Empty cells */}
        {Array.from({ length: firstDow }).map((_, i) => <div key={`e-${i}`} />)}
        {/* Day cells */}
        {monthDates.map(date => {
          const day = parseInt(date.split("-")[2]);
          const practiced = practicedDates.has(date);
          const isToday = date === todayStr;
          return (
            <div
              key={date}
              title={practiced ? "Practiced!" : "No practice"}
              className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all"
              style={{
                background: isToday
                  ? "rgba(0,212,255,0.15)"
                  : practiced
                  ? "rgba(16,185,129,0.65)"
                  : "rgba(255,255,255,0.04)",
                color: isToday ? "#00d4ff" : practiced ? "#fff" : "rgba(255,255,255,0.35)",
                outline: isToday ? "2px solid #00d4ff" : "none",
                outlineOffset: 1,
              }}
            >
              {day}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "rgba(16,185,129,0.65)" }} /> Practiced
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: "rgba(255,255,255,0.04)", outline: "1px solid rgba(255,255,255,0.1)" }} /> No practice
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ outline: "2px solid #00d4ff", background: "rgba(0,212,255,0.15)" }} /> Today
        </div>
      </div>

      <p className="text-sm text-foreground">
        You practiced on{" "}
        <span className="font-semibold" style={{ color: "#00d4ff" }}>{practicedThisMonth} day{practicedThisMonth !== 1 ? "s" : ""}</span>{" "}
        this month{practicedThisMonth > 0 ? " 🎉" : " — start today!"}
      </p>
    </motion.div>
  );
}

/* ── Main Progress Page ───────────────────────────────────── */
export default function Progress() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    setSkills(storage.getSkills());
    setSessions(storage.getSessions());
    const handler = () => {
      setSkills(storage.getSkills());
      setSessions(storage.getSessions());
    };
    window.addEventListener("storage-update", handler);
    return () => window.removeEventListener("storage-update", handler);
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
          📈 Progress
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your growth at a glance</p>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-xl w-fit"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? "rgba(0,212,255,0.15)" : "transparent",
              color: activeTab === tab.id ? "#00d4ff" : "rgba(255,255,255,0.45)",
              borderBottom: activeTab === tab.id ? "2px solid #00d4ff" : "2px solid transparent",
              fontFamily: "'Sora',sans-serif",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {skills.length === 0 && activeTab !== "calendar" ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No data yet</h3>
          <p className="text-muted-foreground text-sm">Add skills and log practice sessions to see your progress.</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "overview"  && <OverviewTab  skills={skills} sessions={sessions} />}
            {activeTab === "charts"    && <ChartsTab    skills={skills} sessions={sessions} />}
            {activeTab === "calendar"  && <CalendarTab  sessions={sessions} />}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
