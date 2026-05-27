import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, PartyPopper } from "lucide-react";
import { storage, Skill } from "@/lib/storage";
import { CATEGORY_COLORS } from "@/lib/badges";

function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => i);
  return (
    <div className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {pieces.map((i) => (
        <motion.div
          key={i}
          initial={{ x: Math.random() * window.innerWidth, y: -20, rotate: 0, opacity: 1 }}
          animate={{ y: window.innerHeight + 20, rotate: Math.random() * 720, opacity: 0 }}
          transition={{ duration: 2.5 + Math.random() * 1, delay: Math.random() * 0.8, ease: "easeIn" }}
          style={{
            position: "absolute",
            width: 8 + Math.random() * 6,
            height: 8 + Math.random() * 6,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            backgroundColor: ["#00D4FF", "#FFB830", "#9B59B6", "#2ECC71", "#E91E63"][Math.floor(Math.random() * 5)],
          }}
        />
      ))}
    </div>
  );
}

export default function Targets() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [targets, setTargets] = useState(storage.getTargets());
  const [showCelebration, setShowCelebration] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const reload = useCallback(() => {
    setSkills(storage.getSkills());
    setTargets(storage.getTargets());
  }, []);

  useEffect(() => {
    reload();
    const handler = () => reload();
    window.addEventListener("storage-update", handler);
    return () => window.removeEventListener("storage-update", handler);
  }, [reload]);

  const skillsWithTargets = skills.filter((s) => s.dailyTarget);
  const completedToday = targets?.date === today ? targets.completedSkillIds : [];
  const allDone = skillsWithTargets.length > 0 && completedToday.length >= skillsWithTargets.length;
  const percent = skillsWithTargets.length > 0
    ? Math.round((completedToday.length / skillsWithTargets.length) * 100)
    : 0;

  const toggleTarget = (skillId: string) => {
    const current = targets?.date === today ? targets.completedSkillIds : [];
    let updated: string[];
    if (current.includes(skillId)) {
      updated = current.filter((id) => id !== skillId);
    } else {
      updated = [...current, skillId];
    }
    const newTargets = { date: today, completedSkillIds: updated };
    storage.setTargets(newTargets);
    setTargets(newTargets);

    if (updated.length >= skillsWithTargets.length && skillsWithTargets.length > 0) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  };

  const user = storage.getUser();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {showCelebration && <Confetti />}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
          Daily Targets
        </h1>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
        </div>
      </div>

      {/* Progress overview */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Today's Progress</span>
          <span className="text-2xl font-bold text-primary">{percent}%</span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: "spring", stiffness: 60 }}
            className="h-full bg-primary rounded-full"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {completedToday.length} of {skillsWithTargets.length} targets completed
        </div>
      </div>

      {/* Celebration banner */}
      <AnimatePresence>
        {(allDone || showCelebration) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-gradient-to-r from-primary/20 to-yellow-400/20 border border-primary/40 rounded-2xl p-5 flex items-center gap-4"
          >
            <PartyPopper className="w-8 h-8 text-primary shrink-0" />
            <div>
              <div className="font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
                All targets hit today!
              </div>
              <div className="text-sm text-muted-foreground">
                Amazing work, {user?.name || "champion"}! Keep that streak going!
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Targets list */}
      {skillsWithTargets.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No daily targets set</h3>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Add a daily target when creating or editing a skill to track your daily goals here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {skillsWithTargets.map((skill) => {
            const done = completedToday.includes(skill.id);
            const catColor = CATEGORY_COLORS[skill.category] || "#00D4FF";
            return (
              <motion.button
                key={skill.id}
                data-testid={`target-${skill.id}`}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleTarget(skill.id)}
                className={`w-full flex items-center gap-4 p-4 bg-card border rounded-2xl text-left transition-all ${
                  done ? "border-primary/50 bg-primary/5" : "border-border hover:border-muted-foreground"
                }`}
              >
                {/* Circular checkbox */}
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    done ? "border-primary bg-primary" : "border-border"
                  }`}
                  style={!done ? { borderColor: catColor } : {}}
                >
                  {done && (
                    <motion.svg
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-primary-foreground" />
                    </motion.svg>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className={`font-medium transition-all ${done ? "line-through text-muted-foreground" : "text-foreground"}`}
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {skill.name}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">{skill.dailyTarget}</div>
                </div>

                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                  style={{ backgroundColor: `${catColor}20`, color: catColor }}
                >
                  {skill.category}
                </span>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
