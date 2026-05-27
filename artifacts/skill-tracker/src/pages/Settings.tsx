import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Bell, Moon, Sun, Trash2, User, Volume2, Users, Copy, ExternalLink, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useTheme } from "@/components/theme-provider";
import { storage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { sound } from "@/lib/sound";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

const AVATARS = ["🧑","👩","🧔","👨‍💻","👩‍🎨","🧑‍🚀","🦸","🧙","🐉","⚡","🔥","🌊","🌟","🎯","💎"];

const THEMES = [
  { id: "midnight", label: "🌙 Midnight", desc: "Dark navy" },
  { id: "daylight", label: "☀️ Daylight", desc: "Clean light" },
  { id: "sakura", label: "🌸 Sakura", desc: "Soft pink" },
  { id: "winter", label: "❄️ Winter Frost", desc: "Deep blue & silver" },
  { id: "ember", label: "🔥 Ember", desc: "Dark charcoal & orange" },
  { id: "ocean", label: "🌊 Ocean", desc: "Deep sea blue" },
];

const settingsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  reminderTime: z.string(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState(storage.getUser());
  const [avatar, setAvatar] = useState(user?.avatar || "🧑");
  const [reminderEnabled, setReminderEnabled] = useState(user?.reminderEnabled ?? false);
  const [showReset, setShowReset] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifPerm, setNotifPerm] = useState<NotificationPermission>("default");
  const [soundEnabled, setSoundEnabled] = useState(storage.getSoundEnabled());
  const [selectedTheme, setSelectedTheme] = useState(storage.getTheme());
  const [publicEnabled, setPublicEnabled] = useState(!!storage.getProfileId());
  const [partner] = useState(storage.getPartner());
  const { toast } = useToast();

  useEffect(() => { setNotifPerm(Notification.permission); }, []);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: { name: user?.name || "", reminderTime: user?.reminderTime || "18:00" },
  });

  const handleSave = (data: SettingsFormValues) => {
    const updated = { ...(user || { theme: "dark" as const }), name: data.name, avatar, reminderTime: data.reminderTime, reminderEnabled };
    storage.setUser(updated);
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast({ title: "Profile saved!" });
  };

  const handleReminderToggle = async (enabled: boolean) => {
    if (enabled && Notification.permission !== "granted") {
      const perm = await Notification.requestPermission();
      setNotifPerm(perm);
      if (perm !== "granted") return;
    }
    setReminderEnabled(enabled);
    if (user) storage.setUser({ ...user, reminderEnabled: enabled });
  };

  const handleSoundToggle = (enabled: boolean) => {
    setSoundEnabled(enabled);
    storage.setSoundEnabled(enabled);
    if (enabled) { setTimeout(() => sound.test(), 100); }
  };

  const handleThemeChange = (id: string) => {
    setSelectedTheme(id);
    storage.setTheme(id);
    // Apply theme CSS vars via data attribute
    document.documentElement.setAttribute("data-theme", id);
    if (id === "daylight") setTheme("light");
    else setTheme("dark");
  };

  const handlePublicToggle = (enabled: boolean) => {
    setPublicEnabled(enabled);
    if (enabled) {
      const id = btoa(`${user?.name || "user"}-${Date.now()}`).slice(0, 16);
      storage.setProfileId(id);
      toast({ title: "Public profile enabled", description: `Your profile ID: ${id}` });
    } else {
      storage.setProfileId("");
    }
  };

  const handleReset = () => {
    storage.clearAll();
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Settings</h1>

      {/* Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Profile</h2>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)} className="space-y-5">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl><Input data-testid="input-settings-name" {...field} className="rounded-xl" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-3">
              <Label>Avatar</Label>
              <div className="grid grid-cols-5 gap-2">
                {AVATARS.map(emoji => (
                  <button key={emoji} type="button" data-testid={`button-settings-avatar-${emoji}`}
                    onClick={() => setAvatar(emoji)}
                    className={`text-2xl w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      avatar === emoji ? "bg-primary/20 border-2 border-primary scale-110" : "bg-muted border border-border hover:border-primary/50"
                    }`}>{emoji}</button>
                ))}
              </div>
            </div>
            <Button data-testid="button-save-settings" type="submit" className="rounded-xl w-full sm:w-auto">
              {saved ? "Saved!" : "Save Profile"}
            </Button>
          </form>
        </Form>
      </motion.div>

      {/* Reminders */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Reminders</h2>
        </div>
        {notifPerm === "denied" && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-sm text-destructive">
            Notifications are blocked. Enable them in your browser settings.
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Daily Reminder</div>
            <div className="text-xs text-muted-foreground">Get notified to practice every day</div>
          </div>
          <Switch data-testid="switch-reminder" checked={reminderEnabled} onCheckedChange={handleReminderToggle} disabled={notifPerm === "denied"} />
        </div>
        <div className="space-y-1.5">
          <Label>Reminder Time</Label>
          <Input
            data-testid="input-settings-reminder-time"
            type="time"
            defaultValue={user?.reminderTime || "18:00"}
            disabled={!reminderEnabled}
            className="rounded-xl w-40"
            onChange={e => {
              if (user) storage.setUser({ ...user, reminderTime: e.target.value });
            }}
          />
        </div>
      </motion.div>

      {/* Sound */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Volume2 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Sound Effects</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Enable Sound Effects</div>
            <div className="text-xs text-muted-foreground">Chimes, fanfares, and satisfying feedback sounds</div>
          </div>
          <Switch data-testid="switch-sound" checked={soundEnabled} onCheckedChange={handleSoundToggle} />
        </div>
        <Button data-testid="button-test-sound" variant="outline" size="sm" onClick={() => sound.test()} className="rounded-xl gap-2">
          <Volume2 className="w-4 h-4" /> Test Sound
        </Button>
      </motion.div>

      {/* Appearance */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-3">
          {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
          <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Appearance</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Dark Mode</div>
            <div className="text-xs text-muted-foreground">Toggle dark/light base theme</div>
          </div>
          <Switch data-testid="switch-theme" checked={theme === "dark"} onCheckedChange={c => setTheme(c ? "dark" : "light")} />
        </div>
        <div className="space-y-2">
          <Label>Color Theme</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {THEMES.map(t => (
              <button
                key={t.id}
                data-testid={`button-theme-${t.id}`}
                onClick={() => handleThemeChange(t.id)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  selectedTheme === t.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-medium text-sm text-foreground">{t.label}</div>
                <div className="text-xs text-muted-foreground">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Public Profile */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Link className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Public Profile</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">Enable Public Profile</div>
            <div className="text-xs text-muted-foreground">Share a read-only view of your skills and badges</div>
          </div>
          <Switch data-testid="switch-public-profile" checked={publicEnabled} onCheckedChange={handlePublicToggle} />
        </div>
        {publicEnabled && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Your profile ID: <span className="text-primary font-mono">{storage.getProfileId()}</span></p>
            <Button
              data-testid="button-copy-profile-link"
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => {
                const id = storage.getProfileId();
                navigator.clipboard.writeText(`${window.location.origin}/profile/${id}`);
                toast({ title: "Profile link copied!" });
              }}
            >
              <Copy className="w-4 h-4" /> Copy Profile Link
            </Button>
          </div>
        )}
      </motion.div>

      {/* Accountability Partner — link to dedicated page */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Accountability Partner</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {partner ? `Connected with ${partner.name} · Synced ${partner.syncedAt}` : "Connect with a partner to stay motivated"}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-xl shrink-0">
            <a href="/partner">
              <ExternalLink className="w-3.5 h-3.5" />
              {partner ? "Manage" : "Set Up"}
            </a>
          </Button>
        </div>
        {partner && (
          <div className="mt-4 flex items-center gap-3 bg-muted/50 rounded-xl p-3">
            <span className="text-2xl">{partner.avatar}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground">{partner.name}</div>
              <div className="text-xs text-muted-foreground">{partner.streak} day streak · {partner.skills.length} skills</div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Sign Out */}
      {supabase && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">🚪</span>
            <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Account</h2>
          </div>
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
          >
            Sign Out
          </Button>
        </motion.div>
      )}

      {/* Danger Zone */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card border border-destructive/30 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <Trash2 className="w-5 h-5 text-destructive" />
          <h2 className="font-semibold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Danger Zone</h2>
        </div>
        <p className="text-sm text-muted-foreground">Permanently delete all data. Cannot be undone.</p>
        <Button data-testid="button-reset-data" variant="destructive" onClick={() => setShowReset(true)} className="rounded-xl gap-2">
          <Trash2 className="w-4 h-4" /> Reset All Data
        </Button>
      </motion.div>

      <ConfirmDialog
        open={showReset}
        title="Reset Everything?"
        message="This will permanently delete ALL your skills, sessions, badges, journal entries, and progress. This is irreversible."
        confirmLabel="⚠️ Yes, Delete Everything"
        onConfirm={handleReset}
        onCancel={() => setShowReset(false)}
        danger
      />
    </div>
  );
}
