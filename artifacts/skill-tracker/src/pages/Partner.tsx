import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Link, Copy, UserPlus, Zap, Flame, Trophy, RefreshCw, UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { storage, AccountabilityPartner } from "@/lib/storage";
import { calculateStreak } from "@/lib/badges";
import { useToast } from "@/hooks/use-toast";

export default function Partner() {
  const [partner, setPartner] = useState<AccountabilityPartner | null>(storage.getPartner());
  const [inviteLink, setInviteLink] = useState("");
  const [partnerInput, setPartnerInput] = useState("");
  const { toast } = useToast();

  const user = storage.getUser();
  const sessions = storage.getSessions();
  const skills = storage.getSkills();
  const myStreak = calculateStreak(sessions);
  const myBadges = storage.getBadges().length;

  useEffect(() => {
    const handler = () => setPartner(storage.getPartner());
    window.addEventListener("storage-update", handler);
    return () => window.removeEventListener("storage-update", handler);
  }, []);

  const generateInviteLink = () => {
    const profileId = storage.getProfileId() || btoa(`${user?.name}-${Date.now()}`).slice(0, 16);
    const data = {
      name: user?.name || "Anonymous",
      avatar: user?.avatar || "🧑",
      streak: myStreak,
      skills: skills.map(s => s.name),
      profileId,
    };
    const link = `${window.location.origin}${window.location.pathname}?partner=${btoa(JSON.stringify(data))}`;
    setInviteLink(link);
  };

  const handleConnect = () => {
    try {
      const raw = partnerInput.includes("partner=")
        ? partnerInput.split("partner=")[1]
        : partnerInput;
      const data = JSON.parse(atob(raw.trim()));
      const newPartner: AccountabilityPartner = {
        name: data.name,
        avatar: data.avatar,
        streak: data.streak,
        skills: data.skills,
        profileId: data.profileId,
        syncedAt: new Date().toISOString().split("T")[0],
      };
      storage.setPartner(newPartner);
      setPartner(newPartner);
      setPartnerInput("");
      toast({ title: `Connected with ${data.name}! 🎉` });
    } catch {
      toast({ title: "Invalid partner data", description: "Make sure you pasted the full invite link.", variant: "destructive" });
    }
  };

  const handleDisconnect = () => {
    storage.setPartner(null);
    setPartner(null);
    setInviteLink("");
    toast({ title: "Partner disconnected" });
  };

  const handleCheer = () => {
    navigator.clipboard.writeText(
      `Hey ${partner?.name}! Just checking in — keep up your streak! 💪 Your accountability partner is rooting for you.`
    );
    toast({ title: "Cheer message copied to clipboard!" });
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>
          Accountability Partner
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Stay motivated together. Share progress, celebrate wins, and keep each other on track.
        </p>
      </div>

      {/* My Stats card */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-xl">{user?.avatar || "🧑"}</span> My Stats
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: <Flame className="w-4 h-4 text-orange-400" />, value: myStreak, label: "Day Streak" },
            { icon: <Zap className="w-4 h-4 text-primary" />, value: skills.length, label: "Skills" },
            { icon: <Trophy className="w-4 h-4 text-yellow-400" />, value: myBadges, label: "Badges" },
          ].map(({ icon, value, label }) => (
            <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
              <div className="flex justify-center mb-1">{icon}</div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {partner ? (
        /* ── Connected State ── */
        <>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-primary/30 rounded-2xl p-6 space-y-5"
            style={{ boxShadow: "0 0 30px rgba(0,212,255,0.06)" }}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Your Partner
              </h2>
              <span className="text-xs text-muted-foreground">Synced {partner.syncedAt}</span>
            </div>

            {/* Partner card */}
            <div className="flex items-center gap-4 bg-muted/40 rounded-2xl p-4">
              <div className="text-5xl">{partner.avatar}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground text-lg">{partner.name}</div>
                <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-orange-400" /> {partner.streak} day streak</span>
                  <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-primary" /> {partner.skills.length} skills</span>
                </div>
              </div>
            </div>

            {/* Partner's skills */}
            {partner.skills.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Their Skills</p>
                <div className="flex flex-wrap gap-2">
                  {partner.skills.map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Streak comparison */}
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Streak Comparison</p>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">You ({user?.name})</span>
                    <span className="text-primary font-semibold">{myStreak}d</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, (myStreak / Math.max(myStreak, partner.streak, 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-foreground">{partner.name}</span>
                    <span className="font-semibold" style={{ color: "#FFB830" }}>{partner.streak}d</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (partner.streak / Math.max(myStreak, partner.streak, 1)) * 100)}%`,
                        backgroundColor: "#FFB830",
                      }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                {myStreak > partner.streak
                  ? `You're ahead by ${myStreak - partner.streak} day${myStreak - partner.streak !== 1 ? "s" : ""}! 🔥`
                  : myStreak < partner.streak
                  ? `${partner.name} is ahead by ${partner.streak - myStreak} day${partner.streak - myStreak !== 1 ? "s" : ""}. Keep going! 💪`
                  : "You're tied! Keep it up! 🤝"}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button onClick={handleCheer} className="flex-1 gap-2 rounded-xl">
                🎉 Send a Cheer
              </Button>
              <Button onClick={handleDisconnect} variant="outline" className="gap-2 rounded-xl">
                <UserMinus className="w-4 h-4" /> Disconnect
              </Button>
            </div>
          </motion.div>

          {/* Re-sync */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-primary" /> Re-sync Partner Data
            </h3>
            <p className="text-xs text-muted-foreground">Ask your partner to share their latest invite link, then paste it here to update their stats.</p>
            <div className="flex gap-2">
              <Input
                placeholder="Paste their new invite link..."
                value={partnerInput}
                onChange={e => setPartnerInput(e.target.value)}
                className="rounded-xl flex-1"
              />
              <Button onClick={handleConnect} disabled={!partnerInput.trim()} className="rounded-xl shrink-0">
                Sync
              </Button>
            </div>
          </div>
        </>
      ) : (
        /* ── Not Connected State ── */
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* How it works */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground">How it works</h2>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              {[
                { emoji: "1️⃣", title: "Generate", desc: "Create your invite link below" },
                { emoji: "2️⃣", title: "Share", desc: "Send it to your partner" },
                { emoji: "3️⃣", title: "Connect", desc: "Paste their link to sync" },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="bg-muted/50 rounded-xl p-3">
                  <div className="text-2xl mb-1">{emoji}</div>
                  <div className="font-semibold text-foreground">{title}</div>
                  <div className="text-muted-foreground mt-0.5">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate invite */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Link className="w-4 h-4 text-primary" /> Step 1 — Generate Your Invite Link
            </h2>
            <p className="text-xs text-muted-foreground">
              This encodes your name, avatar, streak, and skills into a shareable link. No server required — everything is base64 encoded.
            </p>
            <Button onClick={generateInviteLink} variant="outline" className="gap-2 rounded-xl w-full">
              <Link className="w-4 h-4" /> Generate Invite Link
            </Button>
            {inviteLink && (
              <div className="space-y-2">
                <div className="text-xs font-mono bg-muted rounded-xl p-3 break-all text-muted-foreground border border-border">
                  {inviteLink}
                </div>
                <Button
                  onClick={() => { navigator.clipboard.writeText(inviteLink); toast({ title: "Invite link copied!" }); }}
                  size="sm"
                  className="gap-2 rounded-xl w-full"
                >
                  <Copy className="w-4 h-4" /> Copy Link
                </Button>
              </div>
            )}
          </div>

          {/* Connect partner */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-primary" /> Step 2 — Connect with Your Partner
            </h2>
            <div className="space-y-2">
              <Label>Paste their invite link</Label>
              <Input
                placeholder="Paste partner's invite link or base64 data..."
                value={partnerInput}
                onChange={e => setPartnerInput(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <Button
              onClick={handleConnect}
              disabled={!partnerInput.trim()}
              className="w-full gap-2 rounded-xl"
            >
              <UserPlus className="w-4 h-4" /> Connect Partner
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
