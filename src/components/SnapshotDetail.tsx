import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { computeScore } from "@/lib/scoring";
import { analyzeFoir } from "@/lib/foir";
import type { ScoreAttempt } from "@/lib/storage";
import { storage } from "@/lib/storage";
import { ArrowDown, ArrowUp, Minus, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SnapshotDetailProps {
  attempt: ScoreAttempt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SnapshotDetail = ({ attempt, open, onOpenChange }: SnapshotDetailProps) => {
  const currentProfile = storage.getProfile();

  const data = useMemo(() => {
    if (!attempt || !currentProfile) return null;
    const past = computeScore(attempt.profile);
    const now = computeScore(currentProfile);
    const pastFoir = analyzeFoir(attempt.profile, past.band);
    const nowFoir = analyzeFoir(currentProfile, now.band);

    const factors = past.contributions.map((p) => {
      const c = now.contributions.find((x) => x.key === p.key)!;
      return {
        key: p.key,
        label: p.label,
        pastSub: p.rawSubScore,
        nowSub: c.rawSubScore,
        delta: (c.rawSubScore - p.rawSubScore) * p.weight * 600,
        pastInsight: p.insight,
        nowInsight: c.insight,
        weight: p.weight,
      };
    }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return {
      past,
      now,
      pastFoir,
      nowFoir,
      factors,
      scoreDelta: now.score - past.score,
      savingsDelta: currentProfile.monthlySavings - attempt.profile.monthlySavings,
      incomeDelta: currentProfile.monthlyIncome - attempt.profile.monthlyIncome,
      expenseDelta: currentProfile.monthlyExpenses - attempt.profile.monthlyExpenses,
    };
  }, [attempt, currentProfile]);

  if (!attempt || !data) return null;

  const dateLabel = new Date(attempt.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Snapshot from {dateLabel}</DialogTitle>
          <DialogDescription>
            How this score was generated, and what's changed since then.
          </DialogDescription>
        </DialogHeader>

        {/* Score deltas */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          <SnapshotStat label="Then" value={data.past.score} sub={data.past.band + " risk"} />
          <div className="rounded-2xl border border-border bg-background p-4 text-center flex flex-col justify-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Net change</p>
            <p
              className={cn(
                "font-display text-3xl font-semibold mt-1 inline-flex items-center justify-center gap-1",
                data.scoreDelta > 0 && "text-accent",
                data.scoreDelta < 0 && "text-destructive",
                data.scoreDelta === 0 && "text-muted-foreground"
              )}
            >
              {data.scoreDelta > 0 ? <TrendingUp className="h-6 w-6" /> : data.scoreDelta < 0 ? <TrendingDown className="h-6 w-6" /> : null}
              {data.scoreDelta > 0 ? "+" : ""}{data.scoreDelta}
            </p>
            <p className="text-xs text-muted-foreground mt-1">points</p>
          </div>
          <SnapshotStat label="Now" value={data.now.score} sub={data.now.band + " risk"} />
        </div>

        {/* Why this score */}
        <section className="mt-4">
          <h3 className="text-sm font-medium mb-2">Why this {attempt.score} was generated</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{data.past.summary}</p>
          <div className="grid sm:grid-cols-3 gap-2 mt-3 text-xs">
            <SnapshotMini label="Income" value={`₹${attempt.profile.monthlyIncome.toLocaleString()}`} />
            <SnapshotMini label="Expenses" value={`₹${attempt.profile.monthlyExpenses.toLocaleString()}`} />
            <SnapshotMini label="Savings" value={`₹${attempt.profile.monthlySavings.toLocaleString()}`} />
            <SnapshotMini label="Utility on-time" value={`${Math.round(attempt.profile.utilityOnTimeRate * 100)}%`} />
            <SnapshotMini label="Mobile on-time" value={`${Math.round(attempt.profile.mobileOnTimeRate * 100)}%`} />
            <SnapshotMini label="FOIR cap" value={`${Math.round(data.pastFoir.foirCap * 100)}%`} />
          </div>
        </section>

        {/* Roadmap to higher band */}
        <section className="mt-5">
          <h3 className="text-sm font-medium mb-2">What shifted since then</h3>
          <ul className="space-y-2">
            {data.factors.slice(0, 5).map((f) => {
              const dir = f.delta > 0.5 ? "up" : f.delta < -0.5 ? "down" : "flat";
              return (
                <li
                  key={f.key}
                  className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-3 py-2.5 rounded-xl border border-border bg-background"
                >
                  <span
                    className={cn(
                      "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                      dir === "up" && "bg-accent/15 text-accent",
                      dir === "down" && "bg-destructive/15 text-destructive",
                      dir === "flat" && "bg-muted text-muted-foreground"
                    )}
                  >
                    {dir === "up" ? <ArrowUp className="h-3.5 w-3.5" /> : dir === "down" ? <ArrowDown className="h-3.5 w-3.5" /> : <Minus className="h-3.5 w-3.5" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{f.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Then: {Math.round(f.pastSub * 100)}% → Now: {Math.round(f.nowSub * 100)}%
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-semibold whitespace-nowrap",
                      dir === "up" && "text-accent",
                      dir === "down" && "text-destructive",
                      dir === "flat" && "text-muted-foreground"
                    )}
                  >
                    {f.delta > 0 ? "+" : ""}{f.delta.toFixed(1)} pts
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Roadmap */}
        {data.scoreDelta < 0 && (
          <section className="mt-5 p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <h3 className="text-sm font-medium mb-2">Roadmap back to {attempt.score}+</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {data.factors
                .filter((f) => f.delta < -0.5)
                .slice(0, 3)
                .map((f) => (
                  <li key={f.key}>
                    • Restore <strong className="text-foreground">{f.label.toLowerCase()}</strong> — {f.pastInsight}
                  </li>
                ))}
            </ul>
          </section>
        )}
      </DialogContent>
    </Dialog>
  );
};

const SnapshotStat = ({ label, value, sub }: { label: string; value: number; sub: string }) => (
  <div className="rounded-2xl border border-border bg-background p-4 text-center">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="font-display text-3xl font-semibold mt-1">{value}</p>
    <p className="text-xs text-muted-foreground mt-1 capitalize">{sub}</p>
  </div>
);

const SnapshotMini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-muted/50 px-2.5 py-2">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-sm font-medium mt-0.5">{value}</p>
  </div>
);
