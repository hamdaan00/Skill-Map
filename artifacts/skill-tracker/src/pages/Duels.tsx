import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Swords, Plus, Copy, Trophy, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { storage, Duel } from "@/lib/storage";
import { useToast } from "@/hooks/use-toast";

function getDaysLeft(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
}

function encodeDuel(duel: Partial<Duel>, myName: string): string {
  const data = { ...duel, challengerName: myName };
  return btoa(JSON.stringify(data));
}

export default function Duels() {
  const [duels, setDuels] = useState<Duel[]>([]);
  const [skills] = useState(storage.getSkills());
  const [showCreate, setShowCreate] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");
  const [form, setForm] = useState<{ skillId: string; duration: string; metric: "sessions" | "xp" }>({ skillId: "", duration: "5", metric: "sessions" });
  const { toast } = useToast();

  useEffect(() => {
    setDuels(storage.getDuels());
    const handler = () => setDuels(storage.getDuels());
    window.addEventListener("storage-update", handler);
    return () => window.removeEventListener("storage-update", handler);
  }, []);

  // Check URL for incoming duel
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const duelData = params.get("duel");
    if (duelData) {
      try {
        const decoded = JSON.parse(atob(duelData));
        const existing = storage.getDuels().find(d => d.id === decoded.id);
        if (!existing) {
          window.dispatchEvent(new CustomEvent("incoming-duel", { detail: decoded }));
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleCreate = () => {
    if (!form.skillId) return;
    const skill = skills.find(s => s.id === form.skillId);
    if (!skill) return;
    const user = storage.getUser();
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + parseInt(form.duration) * 86400000).toISOString().split("T")[0];
    const duelId = crypto.randomUUID().slice(0, 8);

    const newDuel: Duel = {
      id: duelId,
      skillName: skill.name,
      skillId: skill.id,
      duration: parseInt(form.duration),
      metric: form.metric as 'sessions' | 'xp',
      startDate,
      endDate,
      myScore: 0,
      opponentName: "Challenger",
      opponentScore: 0,
      status: "active",
      isChallenger: true,
    };

    const updatedDuels = [...storage.getDuels(), newDuel];
    storage.setDuels(updatedDuels);

    const link = `${window.location.origin}${window.location.pathname}?duel=${encodeDuel(newDuel, user?.name || "Anonymous")}`;
    setGeneratedLink(link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    toast({ title: "Link copied!", description: "Share it with your challenger." });
  };

  const handleMarkResult = (duelId: string, won: boolean) => {
    const updated = storage.getDuels().map(d =>
      d.id === duelId ? { ...d, status: won ? "won" as const : "lost" as const } : d
    );
    storage.setDuels(updated);

    const badges = storage.getBadges();
    const today = new Date().toISOString().split("T")[0];
    const newBadges: { badgeId: string; unlockedAt: string }[] = [];
    if (won && !badges.find(b => b.badgeId === "duel_victor")) {
      newBadges.push({ badgeId: "duel_victor", unlockedAt: today });
    }
    if (!badges.find(b => b.badgeId === "good_fight")) {
      newBadges.push({ badgeId: "good_fight", unlockedAt: today });
    }
    if (newBadges.length > 0) {
      storage.setBadges([...badges, ...newBadges]);
    }
  };

  const activeDuels = duels.filter(d => d.status === "active");
  const completedDuels = duels.filter(d => d.status !== "active");

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "'Sora', sans-serif" }}>Skill Duels</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Challenge friends to skill competitions.</p>
        </div>
        <Button
          data-testid="button-create-duel"
          onClick={() => setShowCreate(true)}
          className="gap-2 rounded-xl"
        >
          <Plus className="w-4 h-4" /> New Duel
        </Button>
      </div>

      {duels.length === 0 && (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No duels yet</h3>
          <p className="text-muted-foreground text-sm mb-4">Challenge a friend to see who practices more.</p>
          <Button onClick={() => setShowCreate(true)} className="rounded-xl">Create a Duel</Button>
        </div>
      )}

      {activeDuels.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Active Duels</h2>
          {activeDuels.map(duel => (
            <motion.div
              key={duel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              data-testid={`duel-${duel.id}`}
              className="bg-card border border-border rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{duel.skillName}</h3>
                  <p className="text-xs text-muted-foreground">{duel.metric === "sessions" ? "Most sessions" : "Most XP"} · {getDaysLeft(duel.endDate)} days left</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{getDaysLeft(duel.endDate)}d</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                  <div className="text-2xl font-bold text-primary">{duel.myScore}</div>
                  <div className="text-xs text-muted-foreground">You</div>
                </div>
                <div className="bg-muted rounded-xl p-3">
                  <div className="text-2xl font-bold text-foreground">{duel.opponentScore}</div>
                  <div className="text-xs text-muted-foreground">{duel.opponentName}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleMarkResult(duel.id, true)}
                  className="flex-1 rounded-xl gap-2"
                >
                  <Trophy className="w-4 h-4" /> Mark as Won
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkResult(duel.id, false)}
                  className="flex-1 rounded-xl"
                >
                  Mark as Lost
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {completedDuels.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">Completed Duels</h2>
          {completedDuels.map(duel => (
            <div
              key={duel.id}
              data-testid={`duel-completed-${duel.id}`}
              className={`bg-card border rounded-2xl p-4 flex items-center justify-between ${
                duel.status === "won" ? "border-yellow-500/30" : "border-border"
              }`}
            >
              <div>
                <div className="font-medium text-foreground">{duel.skillName}</div>
                <div className="text-xs text-muted-foreground">vs {duel.opponentName}</div>
              </div>
              <div className={`text-sm font-bold px-3 py-1 rounded-full ${
                duel.status === "won" ? "bg-yellow-500/20 text-yellow-400" : "bg-muted text-muted-foreground"
              }`}>
                {duel.status === "won" ? "⚔️ Victory" : "🤝 Good Fight"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Duel Modal */}
      <Dialog open={showCreate} onOpenChange={() => { setShowCreate(false); setGeneratedLink(""); }}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Sora', sans-serif" }}>Create a Skill Duel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!generatedLink ? (
              <>
                <div className="space-y-2">
                  <Label>Skill</Label>
                  <Select value={form.skillId} onValueChange={v => setForm(f => ({ ...f, skillId: v }))}>
                    <SelectTrigger data-testid="select-duel-skill" className="rounded-xl">
                      <SelectValue placeholder="Pick a skill" />
                    </SelectTrigger>
                    <SelectContent>
                      {skills.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={form.duration} onValueChange={v => setForm(f => ({ ...f, duration: v }))}>
                    <SelectTrigger data-testid="select-duel-duration" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 days</SelectItem>
                      <SelectItem value="5">5 days</SelectItem>
                      <SelectItem value="7">7 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Goal Metric</Label>
                  <Select value={form.metric} onValueChange={v => setForm(f => ({ ...f, metric: v as 'sessions' | 'xp' }))}>
                    <SelectTrigger data-testid="select-duel-metric" className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sessions">Most sessions logged</SelectItem>
                      <SelectItem value="xp">Most XP earned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  data-testid="button-generate-duel-link"
                  onClick={handleCreate}
                  disabled={!form.skillId}
                  className="w-full rounded-xl"
                >
                  Generate Duel Link
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-xl">
                  <p className="text-sm text-muted-foreground mb-2">Share this link with your challenger:</p>
                  <div className="text-xs font-mono text-primary break-all">{generatedLink}</div>
                </div>
                <Button
                  data-testid="button-copy-duel-link"
                  onClick={handleCopyLink}
                  className="w-full rounded-xl gap-2"
                >
                  <Copy className="w-4 h-4" /> Copy Link
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowCreate(false); setGeneratedLink(""); }}
                  className="w-full rounded-xl"
                >
                  Done
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
