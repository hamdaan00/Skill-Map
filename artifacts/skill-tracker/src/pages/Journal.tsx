import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage, JournalEntry } from "@/lib/storage";

const MOODS = [
  { value: 1, emoji: "😴", label: "Exhausted" },
  { value: 2, emoji: "😐", label: "Okay" },
  { value: 3, emoji: "😊", label: "Good" },
  { value: 4, emoji: "💪", label: "Motivated" },
  { value: 5, emoji: "🔥", label: "On Fire" },
];

const moodEmoji = (v: number) => MOODS.find(m => m.value === v)?.emoji ?? "😊";
const moodLabel = (v: number) => MOODS.find(m => m.value === v)?.label ?? "Good";

export default function Journal() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [skills, setSkills] = useState(storage.getSkills());
  const [search, setSearch] = useState("");
  const [filterSkill, setFilterSkill] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [formSkillId, setFormSkillId] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formMood, setFormMood] = useState(3);
  const [formText, setFormText] = useState("");

  const reload = () => {
    const all = storage.getJournal().sort((a, b) => b.date.localeCompare(a.date));
    setEntries(all);
    setSkills(storage.getSkills());
  };

  useEffect(() => {
    reload();
    window.addEventListener("storage-update", reload);
    return () => window.removeEventListener("storage-update", reload);
  }, []);

  const handleSave = () => {
    if (!formText.trim() || !formSkillId) return;
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      skillId: formSkillId,
      date: formDate,
      mood: formMood,
      text: formText.trim(),
    };
    storage.setJournal([...storage.getJournal(), newEntry]);
    setFormText("");
    setFormSkillId("");
    setFormMood(3);
    setShowForm(false);
    reload();

    // Badge check: 10 journal entries
    const total = storage.getJournal().length;
    if (total >= 10) {
      const badges = storage.getBadges();
      if (!badges.find(b => b.badgeId === "reflective_learner")) {
        storage.setBadges([...badges, { badgeId: "reflective_learner", unlockedAt: formDate }]);
      }
    }
  };

  const handleDelete = (id: string) => {
    storage.setJournal(storage.getJournal().filter(e => e.id !== id));
    reload();
  };

  const skillName = (id: string) => skills.find(s => s.id === id)?.name || "Unknown Skill";

  const filtered = entries.filter(e => {
    const matchSkill = filterSkill === "all" || e.skillId === filterSkill;
    const matchSearch = !search || e.text.toLowerCase().includes(search.toLowerCase()) || skillName(e.skillId).toLowerCase().includes(search.toLowerCase());
    return matchSkill && matchSearch;
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
            Skill Journal
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} across all skills
          </p>
        </div>
        <Button
          onClick={() => setShowForm(s => !s)}
          className="gap-2 rounded-xl"
          variant={showForm ? "outline" : "default"}
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "New Entry"}
        </Button>
      </div>

      {/* New Entry Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-primary/30 rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Add Journal Entry</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Skill</Label>
                  {skills.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Add a skill on the Dashboard first.</p>
                  ) : (
                    <Select value={formSkillId} onValueChange={setFormSkillId}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select skill..." />
                      </SelectTrigger>
                      <SelectContent>
                        {skills.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>How are you feeling?</Label>
                <div className="flex gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setFormMood(m.value)}
                      title={m.label}
                      className={`flex-1 py-2 text-xl rounded-xl border transition-all ${
                        formMood === m.value ? "border-primary bg-primary/15 scale-105" : "border-border hover:border-primary/40"
                      }`}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reflection</Label>
                <Textarea
                  placeholder="What did you practice? What did you learn? How did it feel?"
                  value={formText}
                  onChange={e => setFormText(e.target.value)}
                  className="rounded-xl resize-none"
                  rows={4}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button
                  onClick={handleSave}
                  disabled={!formText.trim() || !formSkillId}
                  className="flex-1 rounded-xl"
                >
                  Save Entry
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={filterSkill} onValueChange={setFilterSkill}>
          <SelectTrigger className="w-44 rounded-xl">
            <SelectValue placeholder="All skills" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Skills</SelectItem>
            {skills.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-card border border-dashed border-border rounded-2xl">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {entries.length === 0 ? "No journal entries yet" : "No entries match your search"}
          </h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            {entries.length === 0
              ? "Reflect on your practice sessions to track your growth and insights."
              : "Try a different search term or skill filter."}
          </p>
          {entries.length === 0 && (
            <Button onClick={() => setShowForm(true)} className="mt-6 rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Write First Entry
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
          className="space-y-4"
        >
          {filtered.map(entry => (
            <motion.div
              key={entry.id}
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="bg-card border border-border rounded-2xl p-5 group"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{moodEmoji(entry.mood)}</span>
                  <div>
                    <div className="font-medium text-foreground">{skillName(entry.skillId)}</div>
                    <div className="text-xs text-muted-foreground">{entry.date} · {moodLabel(entry.mood)}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-foreground leading-relaxed">{entry.text}</p>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
