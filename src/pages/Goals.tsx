import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { storage, DEFAULT_HABITS, type Habit } from "@/lib/storage";
import { computeScore } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Plus, Trash2, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const Goals = () => {
  const profile = storage.getProfile();
  const result = useMemo(() => (profile ? computeScore(profile) : null), [profile]);
  const initialGoal = useMemo(() => storage.getGoal(), []);
  const initialHabits = useMemo(() => storage.getHabits(), []);
  const [goal, setGoal] = useState(initialGoal);
  const [target, setTarget] = useState<number>(
    initialGoal?.targetScore ?? Math.min(900, (result?.score ?? 600) + 80)
  );
  const [byDate, setByDate] = useState<string>(initialGoal?.byDate ?? defaultDate(60));
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [newHabit, setNewHabit] = useState("");

  if (!profile || !result) return <Navigate to="/app/onboarding" replace />;

  const saveGoal = () => {
    if (target <= result.score) {
      toast.error("Pick a target above your current score");
      return;
    }
    const g = { targetScore: target, byDate, createdAt: new Date().toISOString() };
    storage.saveGoal(g);
    setGoal(g);
    toast.success("Goal saved!");
  };

  const clear = () => { storage.clearGoal(); setGoal(null); toast.success("Goal cleared"); };

  const toggleHabit = (id: string) => {
    const next = habits.map((h) => (h.id === id ? { ...h, done: !h.done } : h));
    setHabits(next);
    storage.saveHabits(next);
  };

  const addHabit = () => {
    if (!newHabit.trim()) return;
    const next = [...habits, { id: crypto.randomUUID(), label: newHabit.trim(), done: false }];
    setHabits(next);
    storage.saveHabits(next);
    setNewHabit("");
  };

  const removeHabit = (id: string) => {
    const next = habits.filter((h) => h.id !== id);
    setHabits(next);
    storage.saveHabits(next);
  };

  const resetHabits = () => {
    setHabits(DEFAULT_HABITS);
    storage.saveHabits(DEFAULT_HABITS);
    toast.success("Habits reset for the month");
  };

  const progressPct = goal
    ? Math.min(100, Math.max(0, ((result.score - 300) / (goal.targetScore - 300)) * 100))
    : 0;

  return (
    <div className="space-y-6 animate-float-up">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Goals & habits</p>
        <h1 className="font-display text-3xl lg:text-4xl font-semibold mt-1">
          Set a target, build the habits
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Pick a score you want to reach and check off small habits each week. Lenders love consistency.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="warm-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Your goal</h2>
          </div>

          {goal && (
            <div className="rounded-2xl bg-gradient-warm/10 border border-primary/20 p-4 mb-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Current</span>
                <span className="text-muted-foreground">Target</span>
              </div>
              <div className="flex justify-between font-display text-2xl font-semibold">
                <span>{result.score}</span>
                <span className="gradient-text">{goal.targetScore}</span>
              </div>
              <div className="h-2 rounded-full bg-muted mt-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-warm ease-soft transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                By {new Date(goal.byDate).toLocaleDateString(undefined, { dateStyle: "medium" })} ·{" "}
                {Math.max(0, goal.targetScore - result.score)} points to go
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="target">Target score</Label>
              <Input
                id="target"
                type="number"
                min={result.score + 1}
                max={900}
                value={target}
                onChange={(e) => setTarget(Math.min(900, Number(e.target.value)))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="byDate">By date</Label>
              <Input
                id="byDate"
                type="date"
                value={byDate}
                onChange={(e) => setByDate(e.target.value)}
                min={defaultDate(7)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveGoal} className="bg-gradient-warm border-0 shadow-warm hover:opacity-95">
                {goal ? "Update goal" : "Save goal"}
              </Button>
              {goal && <Button variant="ghost" onClick={clear}>Clear</Button>}
            </div>
          </div>
        </div>

        <div className="warm-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-semibold">Habit reminders</h2>
            <Button size="sm" variant="ghost" onClick={resetHabits}>Reset</Button>
          </div>
          <ul className="space-y-2">
            {habits.map((h) => (
              <li
                key={h.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl border ease-soft transition-colors group",
                  h.done ? "border-accent/30 bg-accent/5" : "border-border bg-background"
                )}
              >
                <button
                  onClick={() => toggleHabit(h.id)}
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ease-soft transition",
                    h.done ? "bg-accent border-accent" : "border-muted-foreground/40 hover:border-primary"
                  )}
                  aria-label={h.done ? "Mark undone" : "Mark done"}
                >
                  {h.done && <Check className="h-3 w-3 text-accent-foreground" />}
                </button>
                <span className={cn("text-sm flex-1", h.done && "line-through text-muted-foreground")}>{h.label}</span>
                <button
                  onClick={() => removeHabit(h.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive ease-soft transition"
                  aria-label="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 mt-3">
            <Input
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              placeholder="Add your own habit…"
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHabit())}
            />
            <Button onClick={addHabit} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

function defaultDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default Goals;
