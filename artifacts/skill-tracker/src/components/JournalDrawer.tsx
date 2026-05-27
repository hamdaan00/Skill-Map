import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storage, JournalEntry } from "@/lib/storage";

const MOODS = [
  { value: 1, emoji: "😴" },
  { value: 2, emoji: "😐" },
  { value: 3, emoji: "😊" },
  { value: 4, emoji: "💪" },
  { value: 5, emoji: "🔥" },
];

interface JournalDrawerProps {
  skillId: string;
  skillName: string;
  open: boolean;
  onClose: () => void;
}

export default function JournalDrawer({ skillId, skillName, open, onClose }: JournalDrawerProps) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formMood, setFormMood] = useState(3);
  const [formText, setFormText] = useState("");

  const reload = () => {
    const all = storage.getJournal();
    setEntries(all.filter(e => e.skillId === skillId).sort((a, b) => b.date.localeCompare(a.date)));
  };

  useEffect(() => {
    if (open) reload();
  }, [open, skillId]);

  const handleSave = () => {
    if (!formText.trim()) return;
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      skillId,
      date: formDate,
      mood: formMood,
      text: formText.trim(),
    };
    const all = [...storage.getJournal(), newEntry];
    storage.setJournal(all);
    setFormText("");
    setFormMood(3);
    setShowAdd(false);
    reload();
  };

  const handleDelete = (id: string) => {
    storage.setJournal(storage.getJournal().filter(e => e.id !== id));
    reload();
  };

  const moodEmoji = (v: number) => MOODS.find(m => m.value === v)?.emoji ?? "😊";

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-96 bg-card border-l border-border flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                  {skillName} Journal
                </span>
              </div>
              <button data-testid="button-close-journal" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Add Entry Button */}
            <div className="px-5 py-3 border-b border-border">
              <Button
                data-testid="button-add-journal-entry"
                size="sm"
                onClick={() => setShowAdd(s => !s)}
                className="gap-2 rounded-xl w-full"
                variant={showAdd ? "outline" : "default"}
              >
                <Plus className="w-4 h-4" />
                {showAdd ? "Cancel" : "Add Entry"}
              </Button>
            </div>

            {/* Add Form */}
            <AnimatePresence>
              {showAdd && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-5 py-4 border-b border-border space-y-3 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      data-testid="input-journal-date"
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Mood</Label>
                    <div className="flex gap-2">
                      {MOODS.map(m => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setFormMood(m.value)}
                          className={`flex-1 text-xl py-1.5 rounded-xl border transition-all ${
                            formMood === m.value ? "border-primary bg-primary/15 scale-105" : "border-border"
                          }`}
                        >
                          {m.emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Reflection</Label>
                    <Textarea
                      data-testid="input-journal-text"
                      placeholder="What did you learn today? How did it feel?"
                      value={formText}
                      onChange={e => setFormText(e.target.value)}
                      className="rounded-xl resize-none"
                      rows={4}
                    />
                  </div>
                  <Button
                    data-testid="button-save-journal-entry"
                    onClick={handleSave}
                    disabled={!formText.trim()}
                    className="w-full rounded-xl"
                  >
                    Save Entry
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Entries List */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📓</div>
                  <p className="text-muted-foreground text-sm">No journal entries yet. Start reflecting on your practice!</p>
                </div>
              ) : (
                entries.map(entry => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    data-testid={`journal-entry-${entry.id}`}
                    className="bg-background border border-border rounded-xl p-4 space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{moodEmoji(entry.mood)}</span>
                        <span className="text-xs text-muted-foreground">{entry.date}</span>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        Delete
                      </button>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{entry.text}</p>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
