import { useState } from "react";
import type { FinancialProfile } from "@/lib/scoring";
import { DEFAULT_PROFILE } from "@/lib/scoring";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { YearsMonthsInput } from "@/components/YearsMonthsInput";
import { useT } from "@/i18n/LanguageProvider";

interface ProfileFormProps {
  initial?: FinancialProfile;
  onSubmit: (p: FinancialProfile) => void;
  submitLabel?: string;
}

export const ProfileForm = ({ initial, onSubmit, submitLabel }: ProfileFormProps) => {
  const { t } = useT();
  const [p, setP] = useState<FinancialProfile>(initial ?? DEFAULT_PROFILE);

  const update = <K extends keyof FinancialProfile>(k: K, v: FinancialProfile[K]) =>
    setP((prev) => ({ ...prev, [k]: v }));

  return (
    <form
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(p);
      }}
    >
      {/* About you */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          {t("form.section.you")}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="income">{t("form.income")}</Label>
            <Input
              id="income"
              type="number"
              min={0}
              max={10000000}
              value={p.monthlyIncome}
              onChange={(e) => update("monthlyIncome", Math.max(0, Math.min(10000000, Number(e.target.value))))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="expenses">{t("form.expenses")}</Label>
            <Input
              id="expenses"
              type="number"
              min={0}
              max={10000000}
              value={p.monthlyExpenses}
              onChange={(e) => {
                const exp = Math.max(0, Math.min(10000000, Number(e.target.value)));
                update("monthlyExpenses", exp);
                update("monthlySavings", Math.max(0, p.monthlyIncome - exp));
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="savings">{t("form.savings")}</Label>
            <Input
              id="savings"
              type="number"
              value={p.monthlySavings}
              onChange={(e) => update("monthlySavings", Number(e.target.value))}
            />
          </div>
          <YearsMonthsInput
            idPrefix="emp"
            label={t("form.workExperience")}
            hint={t("form.workExperience.hint")}
            value={p.employmentMonths}
            onChange={(m) => update("employmentMonths", m)}
            maxYears={45}
          />
        </div>
      </section>

      {/* Bills */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          {t("form.section.bills")}
        </h3>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>{t("form.utility")}</Label>
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
              <Label>{t("form.mobile")}</Label>
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
          <Label>{t("form.txn")}</Label>
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
                <span className="capitalize text-sm">{t(`form.txn.${opt}`)}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>
      </section>

      {/* History */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          {t("form.section.history")}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="attempts">{t("form.attempts")}</Label>
            <Input
              id="attempts"
              type="number"
              min={0}
              max={50}
              value={p.pastLoanAttempts}
              onChange={(e) => update("pastLoanAttempts", Math.max(0, Math.min(50, Number(e.target.value))))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rejections">{t("form.rejections")}</Label>
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
            <Label htmlFor="emergency" className="text-sm">{t("form.emergency")}</Label>
            <p className="text-xs text-muted-foreground">{t("form.emergency.hint")}</p>
          </div>
          <Switch
            id="emergency"
            checked={p.hasEmergencyFund}
            onCheckedChange={(v) => update("hasEmergencyFund", v)}
          />
        </div>
      </section>

      {/* Loan you're considering */}
      <section className="space-y-4">
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
          {t("form.section.loan")}
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="loanAmount">{t("form.loanAmount")}</Label>
            <Input
              id="loanAmount"
              type="number"
              min={0}
              max={50000000}
              value={p.desiredLoanAmount}
              onChange={(e) => update("desiredLoanAmount", Math.max(0, Math.min(50000000, Number(e.target.value))))}
            />
            <p className="text-xs text-muted-foreground">{t("form.loanAmount.hint")}</p>
          </div>
          <YearsMonthsInput
            idPrefix="ten"
            label={t("form.loanTenure")}
            hint={t("form.loanTenure.hint")}
            value={p.loanTenureMonths}
            onChange={(m) => update("loanTenureMonths", Math.max(1, m))}
            maxYears={30}
          />
        </div>
      </section>

      <Button type="submit" size="lg" className="w-full bg-gradient-warm border-0 shadow-warm hover:opacity-95">
        {submitLabel ?? t("form.submit")}
      </Button>
    </form>
  );
};
