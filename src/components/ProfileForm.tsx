import { useState } from "react";
import type { FinancialProfile } from "@/lib/scoring";
import { DEFAULT_PROFILE } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";

interface ProfileFormProps {
  initial?: FinancialProfile;
  onSubmit: (p: FinancialProfile) => void;
  submitLabel?: string;
}

export const ProfileForm = ({ initial, onSubmit, submitLabel = "Calculate my score" }: ProfileFormProps) => {
  const [p, setP] = useState<FinancialProfile>(initial ?? DEFAULT_PROFILE);

  const update = <K extends keyof FinancialProfile>(k: K, v: FinancialProfile[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(p);
      }}
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="income">Monthly income (₹)</Label>
          <Input
            id="income"
            type="number"
            min={0}
            value={p.monthlyIncome}
            onChange={(e) => update("monthlyIncome", Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="expenses">Monthly expenses (₹)</Label>
          <Input
            id="expenses"
            type="number"
            min={0}
            value={p.monthlyExpenses}
            onChange={(e) => {
              const exp = Math.max(0, Number(e.target.value));
              update("monthlyExpenses", exp);
              update("monthlySavings", Math.max(0, p.monthlyIncome - exp));
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="savings">Monthly savings (₹)</Label>
          <Input
            id="savings"
            type="number"
            value={p.monthlySavings}
            onChange={(e) => update("monthlySavings", Number(e.target.value))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="employment">Months in current income source</Label>
          <Input
            id="employment"
            type="number"
            min={0}
            value={p.employmentMonths}
            onChange={(e) => update("employmentMonths", Math.max(0, Number(e.target.value)))}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Utility bills paid on time</Label>
            <span className="text-sm text-muted-foreground">{Math.round(p.utilityOnTimeRate * 100)}%</span>
          </div>
          <Slider
            value={[p.utilityOnTimeRate * 100]}
            min={0} max={100} step={5}
            onValueChange={([v]) => update("utilityOnTimeRate", v / 100)}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Mobile bills paid on time</Label>
            <span className="text-sm text-muted-foreground">{Math.round(p.mobileOnTimeRate * 100)}%</span>
          </div>
          <Slider
            value={[p.mobileOnTimeRate * 100]}
            min={0} max={100} step={5}
            onValueChange={([v]) => update("mobileOnTimeRate", v / 100)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Digital transaction frequency</Label>
        <RadioGroup
          value={p.txnFrequency}
          onValueChange={(v) => update("txnFrequency", v as FinancialProfile["txnFrequency"])}
          className="grid grid-cols-3 gap-2"
        >
          {(["low", "medium", "high"] as const).map((opt) => (
            <Label
              key={opt}
              htmlFor={`txn-${opt}`}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card cursor-pointer ease-soft hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <RadioGroupItem id={`txn-${opt}`} value={opt} />
              <span className="capitalize text-sm">{opt}</span>
            </Label>
          ))}
        </RadioGroup>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="attempts">Past loan attempts</Label>
          <Input
            id="attempts"
            type="number"
            min={0}
            value={p.pastLoanAttempts}
            onChange={(e) => update("pastLoanAttempts", Math.max(0, Number(e.target.value)))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="rejections">Of those, rejected</Label>
          <Input
            id="rejections"
            type="number"
            min={0}
            max={p.pastLoanAttempts}
            value={p.pastLoanRejections}
            onChange={(e) =>
              update("pastLoanRejections", Math.min(p.pastLoanAttempts, Math.max(0, Number(e.target.value))))
            }
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div>
          <Label htmlFor="emergency" className="text-sm">I have an emergency fund</Label>
          <p className="text-xs text-muted-foreground">More than one month of expenses saved</p>
        </div>
        <Switch
          id="emergency"
          checked={p.hasEmergencyFund}
          onCheckedChange={(v) => update("hasEmergencyFund", v)}
        />
      </div>

      <Button type="submit" size="lg" className="w-full bg-gradient-warm border-0 shadow-warm hover:opacity-95">
        {submitLabel}
      </Button>
    </form>
  );
};
