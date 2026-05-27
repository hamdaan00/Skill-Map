import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Skill } from "@/lib/storage";

const MOODS = [
  { value: 1, emoji: "😴", label: "Exhausted" },
  { value: 2, emoji: "😐", label: "Okay" },
  { value: 3, emoji: "😊", label: "Good" },
  { value: 4, emoji: "💪", label: "Motivated" },
  { value: 5, emoji: "🔥", label: "On Fire" },
];

const sessionSchema = z.object({
  date: z.string(),
  duration: z.number().min(1).max(600),
  notes: z.string().default(""),
  progress: z.number().min(0).max(100),
  mood: z.number().min(1).max(5).default(3),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

interface LogPracticeModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SessionFormValues) => void;
  skill: Skill | null;
}

export default function LogPracticeModal({ open, onClose, onSave, skill }: LogPracticeModalProps) {
  const today = new Date().toISOString().split("T")[0];

  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: { date: today, duration: 30, notes: "", progress: skill?.progress ?? 0, mood: 3 },
    values: { date: today, duration: 30, notes: "", progress: skill?.progress ?? 0, mood: 3 },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Sora', sans-serif" }}>
            Log Practice{skill ? ` — ${skill.name}` : ""}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="mood"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>How are you feeling?</FormLabel>
                  <div className="flex gap-2 pt-1">
                    {MOODS.map(m => (
                      <button
                        key={m.value}
                        type="button"
                        data-testid={`mood-${m.value}`}
                        onClick={() => field.onChange(m.value)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl border text-lg transition-all ${
                          field.value === m.value
                            ? "border-primary bg-primary/15 scale-105"
                            : "border-border hover:border-primary/40"
                        }`}
                        title={m.label}
                      >
                        {m.emoji}
                        <span className="text-xs text-muted-foreground hidden sm:block">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input data-testid="input-session-date" type="date" {...field} className="rounded-xl" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes): {field.value}</FormLabel>
                  <FormControl>
                    <Slider
                      data-testid="slider-duration"
                      min={5} max={240} step={5}
                      value={[field.value]}
                      onValueChange={([v]) => field.onChange(v)}
                      className="py-2"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress Update: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      data-testid="slider-session-progress"
                      min={0} max={100} step={1}
                      value={[field.value]}
                      onValueChange={([v]) => field.onChange(v)}
                      className="py-2"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea data-testid="input-session-notes" placeholder="What did you practice today?" {...field} className="rounded-xl resize-none" rows={2} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
              <Button data-testid="button-log-practice" type="submit" className="flex-1 rounded-xl">Log Practice</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
