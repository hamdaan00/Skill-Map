import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronRight, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storage, User } from "@/lib/storage";

const AVATARS = ["🧑", "👩", "🧔", "👨‍💻", "👩‍🎨", "🧑‍🚀", "🦸", "🧙", "🐉", "⚡", "🔥", "🌊", "🌟", "🎯", "💎"];

interface OnboardingProps {
  onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("🧑");
  const [reminderTime, setReminderTime] = useState("18:00");

  const handleComplete = () => {
    const user: User = {
      name: name.trim() || "Learner",
      avatar,
      reminderTime,
      reminderEnabled: false,
      theme: "dark",
    };
    storage.setUser(user);
    if (Notification.permission === "default") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") {
          storage.setUser({ ...user, reminderEnabled: true });
        }
        onComplete();
      });
    } else {
      onComplete();
    }
  };

  const steps = [
    // Step 0: Welcome
    <motion.div
      key="welcome"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="flex flex-col items-center text-center space-y-8"
    >
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="w-24 h-24 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center"
      >
        <Zap className="w-12 h-12 text-primary" />
      </motion.div>
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-3" style={{ fontFamily: "'Sora', sans-serif" }}>
          Welcome to Skill Map
        </h1>
        <p className="text-xl text-primary font-medium mb-2">Track. Grow. Achieve.</p>
        <p className="text-muted-foreground max-w-sm">
          Your personal command center for mastering the skills that matter most to you.
        </p>
      </div>
      <Button
        data-testid="button-onboarding-start"
        size="lg"
        onClick={() => setStep(1)}
        className="gap-2 px-8 py-6 text-lg rounded-2xl"
      >
        Get Started <ChevronRight className="w-5 h-5" />
      </Button>
    </motion.div>,

    // Step 1: Name + Avatar
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="flex flex-col space-y-6 w-full max-w-sm"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>Who are you?</h2>
        <p className="text-muted-foreground">Tell us your name and pick an avatar.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Your name</Label>
        <Input
          id="name"
          data-testid="input-name"
          placeholder="Enter your name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-12 rounded-xl text-base"
        />
      </div>
      <div className="space-y-3">
        <Label>Choose your avatar</Label>
        <div className="grid grid-cols-5 gap-2">
          {AVATARS.map((emoji) => (
            <button
              key={emoji}
              data-testid={`button-avatar-${emoji}`}
              onClick={() => setAvatar(emoji)}
              className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                avatar === emoji
                  ? "bg-primary/20 border-2 border-primary scale-110"
                  : "bg-card border border-border hover:border-primary/50"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
      <Button
        data-testid="button-onboarding-next"
        size="lg"
        onClick={() => setStep(2)}
        disabled={!name.trim()}
        className="gap-2 rounded-2xl h-12"
      >
        Continue <ChevronRight className="w-5 h-5" />
      </Button>
    </motion.div>,

    // Step 2: Reminder
    <motion.div
      key="reminder"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      className="flex flex-col space-y-6 w-full max-w-sm"
    >
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1" style={{ fontFamily: "'Sora', sans-serif" }}>Set your reminder</h2>
        <p className="text-muted-foreground">When should we remind you to practice?</p>
      </div>
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
          <Bell className="w-6 h-6 text-primary" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reminder-time">Daily reminder time</Label>
          <Input
            id="reminder-time"
            data-testid="input-reminder-time"
            type="time"
            value={reminderTime}
            onChange={(e) => setReminderTime(e.target.value)}
            className="h-12 rounded-xl text-base"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          We will send you a browser notification at this time every day to keep your streak alive.
        </p>
      </div>
      <Button
        data-testid="button-onboarding-complete"
        size="lg"
        onClick={handleComplete}
        className="gap-2 rounded-2xl h-12"
      >
        <Check className="w-5 h-5" /> Start Your Journey
      </Button>
    </motion.div>,
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Progress dots */}
        <div className="flex gap-2 justify-center mb-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i <= step ? "bg-primary w-8" : "bg-muted w-4"
              }`}
            />
          ))}
        </div>
        <AnimatePresence mode="wait">
          <div className="flex flex-col items-center">
            {steps[step]}
          </div>
        </AnimatePresence>
      </div>
    </div>
  );
}
