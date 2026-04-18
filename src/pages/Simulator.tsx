import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { computeScore, type FinancialProfile } from "@/lib/scoring";
import { storage } from "@/lib/storage";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ScoreGauge } from "@/components/ScoreGauge";
import { ArrowRight, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const Simulator = () => {
  const stored = storage.getProfile();
  const baseline = useMemo(() => (stored ? computeScore(stored) : null), [stored]);
  const [draft, setDraft] = useState<FinancialProfile | null>(stored);
  const result = useMemo(() => (draft ? computeScore(draft) : null), [draft]);

  if (!stored || !baseline || !draft || !result) return <Navigate to="/app/onboarding" replace />;
  const delta = result.score - baseline.score;

  const update = <K extends keyof FinancialProfile>(k: K, v: FinancialProfile[K]) =>
    setDraft((prev) => (prev ? { ...prev, [k]: v } : prev));

  return (
    <div className="space-y-6 animate-float-up">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">What-if simulator</p>
        <h1 className="font-display text-3xl lg:text-4xl font-semibold mt-1">
          See how habits change your score
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Drag the sliders below — your projected score updates instantly. Save it to make this your new baseline.
        </p>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
        <div className="warm-card p-6 flex flex-col items-center sticky top-6">
          <ScoreGauge score={result.score} band={result.band} size={200} animate={false} />
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">vs current</p>
            <p
              className={`font-display text-2xl font-semibold ${
                delta > 0 ? "text-accent" : delta < 0 ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {delta > 0 ? "+" : ""}
              {delta}
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full mt-5">
            <Button
              className="bg-gradient-warm border-0 shadow-warm hover:opacity-95"
              onClick={() => {
                storage.saveProfile(draft);
                storage.saveAttempt({
                  id: crypto.randomUUID(),
                  createdAt: new Date().toISOString(),
                  profile: draft,
                  score: result.score,
                  band: result.band,
                });
                toast.success("Saved as your new baseline");
              }}
            >
              Save as new baseline
            </Button>
            <Button variant="ghost" onClick={() => setDraft(stored)}>
              <RotateCcw className="h-4 w-4 mr-1.5" /> Reset
            </Button>
          </div>
        </div>

        <div className="warm-card p-6 space-y-6">
          <SliderRow
            label="Monthly income"
            value={draft.monthlyIncome}
            min={5000} max={200000} step={1000}
            format={(v) => `₹${v.toLocaleString()}`}
            onChange={(v) => update("monthlyIncome", v)}
          />
          <SliderRow
            label="Monthly expenses"
            value={draft.monthlyExpenses}
            min={1000} max={Math.max(200000, draft.monthlyIncome)} step={1000}
            format={(v) => `₹${v.toLocaleString()}`}
            onChange={(v) => {
              update("monthlyExpenses", v);
              update("monthlySavings", Math.max(0, draft.monthlyIncome - v));
            }}
          />
          <SliderRow
            label="Monthly savings"
            value={draft.monthlySavings}
            min={0} max={Math.max(50000, draft.monthlyIncome)} step={500}
            format={(v) => `₹${v.toLocaleString()}`}
            onChange={(v) => update("monthlySavings", v)}
          />
          <SliderRow
            label="Utility on-time payments"
            value={Math.round(draft.utilityOnTimeRate * 100)}
            min={0} max={100} step={5}
            format={(v) => `${v}%`}
            onChange={(v) => update("utilityOnTimeRate", v / 100)}
          />
          <SliderRow
            label="Mobile on-time payments"
            value={Math.round(draft.mobileOnTimeRate * 100)}
            min={0} max={100} step={5}
            format={(v) => `${v}%`}
            onChange={(v) => update("mobileOnTimeRate", v / 100)}
          />
          <SliderRow
            label="Months in current income"
            value={draft.employmentMonths}
            min={0} max={60} step={1}
            format={(v) => `${v} mo`}
            onChange={(v) => update("employmentMonths", v)}
          />

          <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3">
            <div>
              <Label className="text-sm">Has emergency fund</Label>
              <p className="text-xs text-muted-foreground">More than one month of expenses saved</p>
            </div>
            <Switch
              checked={draft.hasEmergencyFund}
              onCheckedChange={(v) => update("hasEmergencyFund", v)}
            />
          </div>
        </div>
      </div>

      {result.topWeaknesses.length > 0 && (
        <div className="warm-card p-6">
          <h2 className="font-display text-lg font-semibold mb-3">Biggest opportunities</h2>
          <ul className="space-y-2">
            {result.topWeaknesses.map((w) => (
              <li key={w.key} className="flex items-start gap-2 text-sm text-muted-foreground">
                <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <span>
                  <span className="text-foreground font-medium">{w.label}:</span> {w.insight}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const SliderRow = ({
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
  <div className="space-y-2">
    <div className="flex justify-between">
      <Label className="text-sm">{label}</Label>
      <span className="text-sm font-medium">{format(value)}</span>
    </div>
    <Slider value={[value]} min={min} max={max} step={step} onValueChange={([v]) => onChange(v)} />
  </div>
);

export default Simulator;
