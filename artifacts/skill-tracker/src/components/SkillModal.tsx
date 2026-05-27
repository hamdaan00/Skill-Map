import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Skill } from "@/lib/storage";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/badges";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const skillSchema = z.object({
  name: z.string().min(1, "Skill name is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().default(""),
  dailyTarget: z.string().default(""),
  progress: z.number().min(0).max(100).default(0),
  scheduledDays: z.array(z.string()).default([]),
});

type SkillFormValues = z.infer<typeof skillSchema>;

interface SkillModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: SkillFormValues) => void;
  skill?: Skill | null;
}

export default function SkillModal({ open, onClose, onSave, skill }: SkillModalProps) {
  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: "", category: "Tech", description: "", dailyTarget: "", progress: 0, scheduledDays: [] },
  });

  useEffect(() => {
    if (skill) {
      form.reset({
        name: skill.name,
        category: skill.category,
        description: skill.description,
        dailyTarget: skill.dailyTarget,
        progress: skill.progress,
        scheduledDays: skill.scheduledDays || [],
      });
    } else {
      form.reset({ name: "", category: "Tech", description: "", dailyTarget: "", progress: 0, scheduledDays: [] });
    }
  }, [skill, form, open]);

  const scheduledDays = form.watch("scheduledDays") || [];

  const toggleDay = (day: string) => {
    const current = form.getValues("scheduledDays");
    if (current.includes(day)) {
      form.setValue("scheduledDays", current.filter(d => d !== day));
    } else {
      form.setValue("scheduledDays", [...current, day]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "'Sora', sans-serif" }}>
            {skill ? "Edit Skill" : "Add New Skill"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skill Name</FormLabel>
                  <FormControl>
                    <Input data-testid="input-skill-name" placeholder="e.g. Guitar, Python, Running..." {...field} className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-category" className="rounded-xl">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                            {cat}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea data-testid="input-skill-description" placeholder="What is this skill about?" {...field} className="rounded-xl resize-none" rows={2} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dailyTarget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Daily Target (optional)</FormLabel>
                  <FormControl>
                    <Input data-testid="input-daily-target" placeholder="e.g. Practice 30 minutes" {...field} className="rounded-xl" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Progress: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider data-testid="slider-progress" min={0} max={100} step={1} value={[field.value]} onValueChange={([v]) => field.onChange(v)} className="py-2" />
                  </FormControl>
                </FormItem>
              )}
            />
            {/* Scheduled Days */}
            <div className="space-y-2">
              <Label>Practice Days (optional)</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    data-testid={`day-${day}`}
                    onClick={() => toggleDay(day)}
                    className={`w-11 h-9 text-xs font-medium rounded-lg border transition-all ${
                      scheduledDays.includes(day)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Only these days will show in Today's Targets.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">Cancel</Button>
              <Button data-testid="button-save-skill" type="submit" className="flex-1 rounded-xl">
                {skill ? "Save Changes" : "Add Skill"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
