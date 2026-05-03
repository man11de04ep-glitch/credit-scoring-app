import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { computeScore, type FinancialProfile } from "@/lib/scoring";
import { analyzeFoir } from "@/lib/foir";
import { assess } from "@/lib/engine";
import { exportAssessmentPdf } from "@/lib/exportPdf";
import type { ScoreAttempt } from "@/lib/storage";
import { storage } from "@/lib/storage";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  Download,
  Minus,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SnapshotDetailProps {
  attempt: ScoreAttempt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SnapshotDetail = ({ attempt, open, onOpenChange }: SnapshotDetailProps) => {
  const currentProfile = storage.getProfile();
  const [whatIf, setWhatIf] = useState<FinancialProfile | null>(null);
  const [openFactor, setOpenFactor] = useState<string | null>(null);

  const data = useMemo(() => {
    if (!attempt || !currentProfile) return null;
    const past = computeScore(attempt.profile);
    const now = computeScore(currentProfile);
    const pastFoir = analyzeFoir(attempt.profile, past.band);
    const nowFoir = analyzeFoir(currentProfile, now.band);

    const factors = past.contributions
      .map((p) => {
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
      })
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

    return {
      past,
      now,
      pastFoir,
      nowFoir,
      factors,
      scoreDelta: now.score - past.score,
    };
  }, [attempt, currentProfile]);

  const whatIfResult = useMemo(
    () => (whatIf ? computeScore(whatIf) : null),
    [whatIf]
  );

  if (!attempt || !data) return null;

  const dateLabel = new Date(attempt.createdAt).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const startWhatIf = () => setWhatIf({ ...attempt.profile });
  const exitWhatIf = () => setWhatIf(null);

  const update = <K extends keyof FinancialProfile>(k: K, v: FinancialProfile[K]) =>
    setWhatIf((prev) => (prev ? { ...prev, [k]: v } : prev));

  const handleExport = () => {
    const user = storage.getUser();
    // Export the active view: what-if projection if active, otherwise the snapshot itself.
    const profileToExport = whatIf ?? attempt.profile;
    const a = assess(profileToExport);
    const labelSuffix = whatIf ? " (what-if from " : " (snapshot from ";
    exportAssessmentPdf(
      a,
      `${user?.name ?? "Member"}${labelSuffix}${dateLabel})`
    );
    toast.success("PDF downloaded");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Snapshot from {dateLabel}</DialogTitle>
          <DialogDescription>
            How this score was generated, and what's changed since then.
          </DialogDescription>
        </DialogHeader>

        {/* Action bar */}
        <div className="flex flex-wrap gap-2 mt-1">
          {!whatIf ? (
            <Button size="sm" variant="outline" onClick={startWhatIf}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> What-if from this date
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={exitWhatIf}>
              <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Exit what-if
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleExport}>
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export PDF
          </Button>
        </div>

        {/* Score deltas */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          <SnapshotStat label="Then" value={data.past.score} sub={data.past.band + " risk"} />
          <div className="rounded-2xl border border-border bg-background p-4 text-center flex flex-col justify-center">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              {whatIfResult ? "What-if" : "Net change"}
            </p>
            {whatIfResult ? (
              <>
                <p className="font-display text-3xl font-semibold mt-1 text-primary">
                  {whatIfResult.score}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {whatIfResult.score - data.past.score >= 0 ? "+" : ""}
                  {whatIfResult.score - data.past.score} vs then
                </p>
              </>
            ) : (
              <>
                <p
                  className={cn(
                    "font-display text-3xl font-semibold mt-1 inline-flex items-center justify-center gap-1",
                    data.scoreDelta > 0 && "text-accent",
                    data.scoreDelta < 0 && "text-destructive",
                    data.scoreDelta === 0 && "text-muted-foreground"
                  )}
                >
                  {data.scoreDelta > 0 ? (
                    <TrendingUp className="h-6 w-6" />
                  ) : data.scoreDelta < 0 ? (
                    <TrendingDown className="h-6 w-6" />
                  ) : null}
                  {data.scoreDelta > 0 ? "+" : ""}
                  {data.scoreDelta}
                </p>
                <p className="text-xs text-muted-foreground mt-1">points</p>
              </>
            )}
          </div>
          <SnapshotStat label="Now" value={data.now.score} sub={data.now.band + " risk"} />
        </div>

        {/* What-if sliders */}
        {whatIf && whatIfResult && (
          <section className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Tweak from this snapshot</h3>
              <span className="text-xs text-muted-foreground">
                Starting from {dateLabel}
              </span>
            </div>
            <WhatIfSlider
              label="Monthly income"
              value={whatIf.monthlyIncome}
              min={5000}
              max={200000}
              step={1000}
              format={(v) => `₹${v.toLocaleString()}`}
              onChange={(v) => update("monthlyIncome", v)}
            />
            <WhatIfSlider
              label="Monthly expenses"
              value={whatIf.monthlyExpenses}
              min={1000}
              max={Math.max(200000, whatIf.monthlyIncome)}
              step={1000}
              format={(v) => `₹${v.toLocaleString()}`}
              onChange={(v) => {
                update("monthlyExpenses", v);
                update("monthlySavings", Math.max(0, whatIf.monthlyIncome - v));
              }}
            />
            <WhatIfSlider
              label="Monthly savings"
              value={whatIf.monthlySavings}
              min={0}
              max={Math.max(50000, whatIf.monthlyIncome)}
              step={500}
              format={(v) => `₹${v.toLocaleString()}`}
              onChange={(v) => update("monthlySavings", v)}
            />
            <WhatIfSlider
              label="Utility on-time payments"
              value={Math.round(whatIf.utilityOnTimeRate * 100)}
              min={0}
              max={100}
              step={5}
              format={(v) => `${v}%`}
              onChange={(v) => update("utilityOnTimeRate", v / 100)}
            />
            <WhatIfSlider
              label="Mobile on-time payments"
              value={Math.round(whatIf.mobileOnTimeRate * 100)}
              min={0}
              max={100}
              step={5}
              format={(v) => `${v}%`}
              onChange={(v) => update("mobileOnTimeRate", v / 100)}
            />
            <div className="flex items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
              <Label className="text-sm">Has emergency fund</Label>
              <Switch
                checked={whatIf.hasEmergencyFund}
                onCheckedChange={(v) => update("hasEmergencyFund", v)}
              />
            </div>
          </section>
        )}

        {/* What-if per-factor deltas vs the original snapshot */}
        {whatIf && whatIfResult && (
          <section className="mt-5">
            <h3 className="text-sm font-medium mb-2">
              Per-factor impact vs snapshot
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              How each factor moves your score relative to {dateLabel}.
            </p>
            <ul className="space-y-2">
              {data.past.contributions
                .map((p) => {
                  const w = whatIfResult.contributions.find((x) => x.key === p.key)!;
                  return {
                    key: p.key,
                    label: p.label,
                    pastSub: p.rawSubScore,
                    nowSub: w.rawSubScore,
                    delta: (w.rawSubScore - p.rawSubScore) * p.weight * 600,
                    insight: w.insight,
                  };
                })
                .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
                .map((f) => {
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
                        {dir === "up" ? (
                          <ArrowUp className="h-3.5 w-3.5" />
                        ) : dir === "down" ? (
                          <ArrowDown className="h-3.5 w-3.5" />
                        ) : (
                          <Minus className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{f.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Snapshot: {Math.round(f.pastSub * 100)}% → What-if:{" "}
                          {Math.round(f.nowSub * 100)}%
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
                        {f.delta > 0 ? "+" : ""}
                        {f.delta.toFixed(1)} pts
                      </span>
                    </li>
                  );
                })}
            </ul>
          </section>
        )}

        {/* Why this score */}
        {!whatIf && (
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
        )}

        {/* What shifted — with expandable "Why this changed" per factor */}
        {!whatIf && (
          <section className="mt-5">
            <h3 className="text-sm font-medium mb-2">What shifted since then</h3>
            <ul className="space-y-2">
              {data.factors.slice(0, 5).map((f) => {
                const dir = f.delta > 0.5 ? "up" : f.delta < -0.5 ? "down" : "flat";
                const isOpen = openFactor === f.key;
                return (
                  <li
                    key={f.key}
                    className="rounded-xl border border-border bg-background overflow-hidden"
                  >
                    <Collapsible open={isOpen} onOpenChange={(o) => setOpenFactor(o ? f.key : null)}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full grid grid-cols-[auto_1fr_auto_auto] gap-3 items-center px-3 py-2.5 text-left hover:bg-secondary/40 transition-colors">
                          <span
                            className={cn(
                              "h-7 w-7 rounded-full flex items-center justify-center shrink-0",
                              dir === "up" && "bg-accent/15 text-accent",
                              dir === "down" && "bg-destructive/15 text-destructive",
                              dir === "flat" && "bg-muted text-muted-foreground"
                            )}
                          >
                            {dir === "up" ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : dir === "down" ? (
                              <ArrowDown className="h-3.5 w-3.5" />
                            ) : (
                              <Minus className="h-3.5 w-3.5" />
                            )}
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
                            {f.delta > 0 ? "+" : ""}
                            {f.delta.toFixed(1)} pts
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-muted-foreground transition-transform",
                              isOpen && "rotate-180"
                            )}
                          />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-3 pb-3 pt-1 border-t border-border/60 bg-secondary/20 space-y-2">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mt-2">
                            Why this changed
                          </p>
                          <p className="text-sm leading-relaxed">
                            {explainDelta(
                              f.key,
                              f.delta,
                              attempt.profile,
                              currentProfile!
                            )}
                          </p>
                          <div className="grid sm:grid-cols-2 gap-2 pt-1">
                            <div className="rounded-lg bg-background border border-border px-2.5 py-2">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Then</p>
                              <p className="text-xs mt-0.5">{f.pastInsight}</p>
                            </div>
                            <div className="rounded-lg bg-background border border-border px-2.5 py-2">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Now</p>
                              <p className="text-xs mt-0.5">{f.nowInsight}</p>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Roadmap */}
        {!whatIf && data.scoreDelta < 0 && (
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

const WhatIfSlider = ({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) => (
  <div className="space-y-1.5">
    <div className="flex justify-between">
      <Label className="text-xs">{label}</Label>
      <span className="text-xs font-medium">{format(value)}</span>
    </div>
    <Slider
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={([v]) => onChange(v)}
    />
  </div>
);

/** Plain-language explanation for a factor's delta between two profiles. */
function explainDelta(
  key: string,
  delta: number,
  past: FinancialProfile,
  now: FinancialProfile
): string {
  const dir = delta > 0.5 ? "improved" : delta < -0.5 ? "dropped" : "stayed flat";
  const fmt = (n: number) => `₹${Math.round(n).toLocaleString()}`;
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  switch (key) {
    case "savingsRate": {
      const pastRate = past.monthlySavings / Math.max(past.monthlyIncome, 1);
      const nowRate = now.monthlySavings / Math.max(now.monthlyIncome, 1);
      return `You were saving ${pct(pastRate)} of income (${fmt(past.monthlySavings)}/mo) and now save ${pct(nowRate)} (${fmt(now.monthlySavings)}/mo). Lenders read savings rate as your repayment cushion, so this ${dir}.`;
    }
    case "billPayments": {
      return `Utility on-time went from ${pct(past.utilityOnTimeRate)} → ${pct(now.utilityOnTimeRate)} and mobile from ${pct(past.mobileOnTimeRate)} → ${pct(now.mobileOnTimeRate)}. Bill timeliness is the single biggest predictor of repayment, so this ${dir} the score.`;
    }
    case "expenseRatio": {
      const pastRatio = past.monthlyExpenses / Math.max(past.monthlyIncome, 1);
      const nowRatio = now.monthlyExpenses / Math.max(now.monthlyIncome, 1);
      return `Expenses moved from ${pct(pastRatio)} of income to ${pct(nowRatio)}. Lower is safer because it leaves room for an EMI, so this ${dir}.`;
    }
    case "loanHistory": {
      return `Past attempts went from ${past.pastLoanAttempts} (${past.pastLoanRejections} rejected) to ${now.pastLoanAttempts} (${now.pastLoanRejections} rejected). Each rejection is a red flag for the next lender, so this ${dir}.`;
    }
    case "emergencyFund": {
      if (past.hasEmergencyFund === now.hasEmergencyFund) {
        return `Emergency fund status is unchanged (${now.hasEmergencyFund ? "still in place" : "still missing"}), so this factor barely moved.`;
      }
      return `Your emergency fund ${now.hasEmergencyFund ? "is now in place" : "was lost"}. Lenders treat a 1-month buffer as proof you can absorb a missed paycheck, so this ${dir}.`;
    }
    case "txnFrequency": {
      return `Digital transaction activity went from ${past.txnFrequency} to ${now.txnFrequency}. A richer digital footprint helps lenders verify income flow, so this ${dir}.`;
    }
    case "employment": {
      return `Income tenure went from ${past.employmentMonths} months to ${now.employmentMonths} months. Lenders prefer 12+ months of stability, so this ${dir}.`;
    }
    default:
      return `This factor ${dir} between the two snapshots.`;
  }
}
