import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, PieChart, Pie, Cell, Legend, ComposedChart, Area,
} from "recharts";
import { storage, Skill, Session } from "@/lib/storage";
import { CATEGORY_COLORS } from "@/lib/badges";

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getSkillHealth(lastPracticed: string | null): { label: string; color: string } {
  if (!lastPracticed) return { label: "Never", color: "#6B7280" };
  const days = Math.floor((Date.now() - new Date(lastPracticed).getTime()) / 86400000);
  if (days <= 2) return { label: `${days}d ago`, color: "#2ECC71" };
  if (days <= 5) return { label: `${days}d ago`, color: "#E67E22" };
  return { label: `${days}d ago`, color: "#E74C3C" };
}

export default function Progress() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setSkills(storage.getSkills());
    setSessions(storage.getSessions());
    const handler = () => { setSkills(storage.getSkills()); setSessions(storage.getSessions()); };
    window.addEventListener("storage-update", handler);
    return () => window.removeEventListener("storage-update", handler);
  }, []);

  const today = new Date();
  const weekDates: string[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    const dow = today.getDay();
    const mondayOffset = dow === 0 ? -6 : 1 - dow;
    d.setDate(today.getDate() + mondayOffset + i);
    return d.toISOString().split("T")[0];
  });

  // Progress bar chart
  const progressData = skills.map(s => ({
    name: s.name.length > 12 ? s.name.slice(0, 10) + "…" : s.name,
    progress: s.progress,
    color: CATEGORY_COLORS[s.category] || "#00D4FF",
  }));

  // Top 3 skills
  const skillSessionCounts = skills.map(s => ({
    skill: s,
    count: sessions.filter(sess => sess.skillId === s.id).length,
  })).sort((a, b) => b.count - a.count).slice(0, 3);

  // Weekly line chart
  const lineData = weekDates.map((date, i) => {
    const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
    const entry: Record<string, string | number> = { day: dayNames[i] };
    skillSessionCounts.forEach(({ skill }) => {
      entry[skill.name] = sessions.filter(s => s.skillId === skill.id && s.date === date).length;
    });
    return entry;
  });

  // Category pie
  const categoryMap: Record<string, number> = {};
  skills.forEach(s => { categoryMap[s.category] = (categoryMap[s.category] || 0) + 1; });
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Monthly calendar
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const monthDates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return d.toISOString().split("T")[0];
  });
  const practicedDates = new Set(sessions.map(s => s.date));

  // Peak hours heatmap
  const hourCounts = new Array(24).fill(0);
  sessions.forEach(s => {
    if (s.loggedAt) {
      const h = new Date(s.loggedAt).getHours();
      hourCounts[h]++;
    }
  });
  const maxHourCount = Math.max(...hourCounts, 1);
  const peakHour = hourCounts.indexOf(Math.max(...hourCounts));
  const peakLabel = peakHour < 12 ? `${peakHour || 12} AM` : `${peakHour === 12 ? 12 : peakHour - 12} PM`;

  // Mood vs performance (last 14 days)
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (13 - i));
    return d.toISOString().split("T")[0];
  });
  const moodChartData = last14.map(date => {
    const daySessions = sessions.filter(s => s.date === date);
    const avgMood = daySessions.length > 0
      ? daySessions.reduce((sum, s) => sum + (s.mood || 3), 0) / daySessions.length
      : null;
    return {
      date: date.slice(5),
      mood: avgMood ? Math.round(avgMood * 10) / 10 : null,
      sessions: daySessions.length,
    };
  });

  // Journal recent entries
  const journal = storage.getJournal().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);
  const journalSkillName = (skillId: string) => skills.find(s => s.id === skillId)?.name || "Unknown";

  const CHART_COLORS = ["#00D4FF","#9B59B6","#2ECC71","#E67E22","#E91E63"];
  const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, color: "hsl(var(--foreground))" };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Progress & Analytics</h1>

      {skills.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No data yet</h3>
          <p className="text-muted-foreground text-sm">Add skills and log practice sessions to see your progress charts.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Bar Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-5">Skill Progress</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={progressData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={v => [`${v}%`, "Progress"]} />
                <Bar dataKey="progress" radius={[6,6,0,0]} isAnimationActive>
                  {progressData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Weekly Line Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-5">Weekly Practice Sessions</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                {skillSessionCounts.map(({ skill }, i) => (
                  <Line key={skill.id} type="monotone" dataKey={skill.name} stroke={CHART_COLORS[i]} strokeWidth={2} dot={{ r: 4, fill: CHART_COLORS[i] }} activeDot={{ r: 6 }} isAnimationActive />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Category Pie */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-5">Skills by Category</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" isAnimationActive>
                    {pieData.map((e, i) => <Cell key={i} fill={CATEGORY_COLORS[e.name] || CHART_COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend formatter={v => <span style={{ color: "hsl(var(--foreground))", fontSize: 12 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-sm text-center py-12">No category data yet.</p>
            )}
          </motion.div>

          {/* Monthly Calendar */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-5">
              Monthly Consistency — {today.toLocaleString("default", { month: "long", year: "numeric" })}
            </h3>
            <div className="grid grid-cols-7 gap-1.5">
              {["M","T","W","T","F","S","S"].map((d, i) => (
                <div key={i} className="text-xs text-muted-foreground text-center font-medium">{d}</div>
              ))}
              {Array.from({ length: (new Date(year, month, 1).getDay() + 6) % 7 }).map((_, i) => <div key={`empty-${i}`} />)}
              {monthDates.map(date => {
                const dayNum = parseInt(date.split("-")[2]);
                const practiced = practicedDates.has(date);
                const isToday = date === today.toISOString().split("T")[0];
                return (
                  <div
                    key={date}
                    data-testid={`calendar-day-${dayNum}`}
                    title={date}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                      isToday ? "ring-2 ring-primary bg-primary/20 text-primary"
                      : practiced ? "bg-green-500/70 text-white"
                      : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Mood vs Performance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-foreground mb-1">Mood vs. Performance (Last 14 Days)</h3>
            <p className="text-xs text-muted-foreground mb-5">Correlation between your mood and practice frequency.</p>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={moodChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="mood" domain={[1, 5]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="sessions" orientation="right" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area yAxisId="sessions" type="monotone" dataKey="sessions" fill="#00D4FF15" stroke="#00D4FF" strokeWidth={2} name="Sessions" />
                <Line yAxisId="mood" type="monotone" dataKey="mood" stroke="#FFB830" strokeWidth={2} dot={{ r: 3, fill: "#FFB830" }} name="Avg Mood" connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Peak Practice Hours */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-1">Your Peak Practice Hours</h3>
            {sessions.filter(s => s.loggedAt).length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Log some sessions to see your peak hours.</p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mb-5">When you most often practice (24h view)</p>
                <div className="flex gap-0.5 items-end h-16 mb-3">
                  {hourCounts.map((count, h) => (
                    <div
                      key={h}
                      data-testid={`hour-bar-${h}`}
                      title={`${h}:00 — ${count} session${count !== 1 ? "s" : ""}`}
                      className="flex-1 rounded-t transition-all"
                      style={{
                        height: `${(count / maxHourCount) * 100}%`,
                        backgroundColor: h === peakHour ? "#00D4FF" : "#00D4FF40",
                        minHeight: count > 0 ? 4 : 0,
                      }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mb-4">
                  <span>12 AM</span><span>6 AM</span><span>12 PM</span><span>6 PM</span><span>11 PM</span>
                </div>
                {sessions.filter(s => s.loggedAt).length > 0 && (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                    <p className="text-sm text-foreground">
                      You practice most at <span className="text-primary font-semibold">{peakLabel}</span> — that's your peak focus time!
                    </p>
                  </div>
                )}
              </>
            )}
          </motion.div>

          {/* Skill Health */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Skill Health</h3>
            <div className="space-y-3">
              {skills.map(skill => {
                const health = getSkillHealth(skill.lastPracticed);
                const catColor = CATEGORY_COLORS[skill.category] || "#3498DB";
                return (
                  <div key={skill.id} data-testid={`health-${skill.id}`} className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: health.color }} />
                    <span className="text-sm text-foreground flex-1">{skill.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${catColor}20`, color: catColor }}>
                      {skill.category}
                    </span>
                    <span className="text-xs font-medium" style={{ color: health.color }}>{health.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t border-border">
              {[{ color: "#2ECC71", label: "Within 2 days" }, { color: "#E67E22", label: "3–5 days" }, { color: "#E74C3C", label: "5+ days" }].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Journal Entries */}
          {journal.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
              <h3 className="text-sm font-semibold text-foreground mb-4">Recent Journal Entries</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {journal.map(entry => {
                  const MOODS = ["","😴","😐","😊","💪","🔥"];
                  return (
                    <div key={entry.id} data-testid={`journal-preview-${entry.id}`} className="bg-muted/50 rounded-xl p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <span>{MOODS[entry.mood]}</span>
                        <span className="text-xs font-medium text-primary">{journalSkillName(entry.skillId)}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{entry.date}</span>
                      </div>
                      <p className="text-xs text-foreground line-clamp-3">{entry.text}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
