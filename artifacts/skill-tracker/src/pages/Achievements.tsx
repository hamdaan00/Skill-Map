import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { storage } from "@/lib/storage";
import { BADGES, BadgeDefinition } from "@/lib/badges";

export default function Achievements() {
  const [unlockedBadges, setUnlockedBadges] = useState(storage.getBadges());

  useEffect(() => {
    setUnlockedBadges(storage.getBadges());
    const handler = () => setUnlockedBadges(storage.getBadges());
    window.addEventListener("storage-update", handler);
    return () => window.removeEventListener("storage-update", handler);
  }, []);

  const unlockedMap = new Map(unlockedBadges.map((b) => [b.badgeId, b.unlockedAt]));
  const unlockedCount = unlockedBadges.length;

  const stagger = {
    container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
    item: { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } },
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
            Achievements
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {unlockedCount} of {BADGES.length} badges earned
          </p>
        </div>
        <div className="bg-card border border-border rounded-2xl px-4 py-2 text-center">
          <div className="text-2xl font-bold text-yellow-400">{unlockedCount}</div>
          <div className="text-xs text-muted-foreground">earned</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall progress</span>
          <span>{Math.round((unlockedCount / BADGES.length) * 100)}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(unlockedCount / BADGES.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 60, delay: 0.2 }}
            className="h-full rounded-full bg-gradient-to-r from-primary to-yellow-400"
          />
        </div>
      </div>

      {/* Badge Grid */}
      <motion.div
        variants={stagger.container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
      >
        {BADGES.map((badge: BadgeDefinition) => {
          const unlockDate = unlockedMap.get(badge.id);
          const unlocked = !!unlockDate;
          return (
            <motion.div
              key={badge.id}
              variants={stagger.item}
              data-testid={`badge-${badge.id}`}
              className={`bg-card border rounded-2xl p-5 flex flex-col items-center text-center gap-2 transition-all ${
                unlocked
                  ? "border-yellow-500/50"
                  : "border-border opacity-60"
              }`}
              style={unlocked ? { boxShadow: "0 0 25px rgba(255, 184, 48, 0.2)" } : {}}
            >
              <div
                className={`text-4xl transition-all ${unlocked ? "" : "grayscale opacity-50 blur-[1px]"}`}
              >
                {badge.icon}
              </div>
              <div>
                <div
                  className={`text-sm font-semibold ${unlocked ? "text-foreground" : "text-muted-foreground"}`}
                  style={{ fontFamily: "'Sora', sans-serif" }}
                >
                  {badge.name}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 leading-tight">
                  {badge.unlockCondition}
                </div>
              </div>
              {unlocked && unlockDate && (
                <div className="text-xs text-yellow-400 mt-1">
                  {new Date(unlockDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              )}
              {!unlocked && (
                <div className="text-xs text-muted-foreground/60 mt-1">Locked</div>
              )}
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
