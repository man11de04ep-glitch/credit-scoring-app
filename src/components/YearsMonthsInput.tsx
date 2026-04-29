import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/i18n/LanguageProvider";

interface YearsMonthsInputProps {
  /** Total months (years*12 + months). */
  value: number;
  onChange: (totalMonths: number) => void;
  label: string;
  hint?: string;
  maxYears?: number;
  idPrefix: string;
}

/** Two-field Years + Months input. Combines into total months internally. */
export const YearsMonthsInput = ({
  value,
  onChange,
  label,
  hint,
  maxYears = 40,
  idPrefix,
}: YearsMonthsInputProps) => {
  const { t } = useT();
  const safe = Math.max(0, value);
  const years = Math.floor(safe / 12);
  const months = safe % 12;

  const update = (y: number, m: number) => {
    const ny = Math.max(0, Math.min(maxYears, y));
    const nm = Math.max(0, Math.min(11, m));
    onChange(ny * 12 + nm);
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Input
            id={`${idPrefix}-years`}
            type="number"
            inputMode="numeric"
            min={0}
            max={maxYears}
            value={years}
            onChange={(e) => update(Number(e.target.value), months)}
            aria-label={t("common.years")}
          />
          <p className="text-[11px] text-muted-foreground mt-1 ml-0.5">{t("common.years")}</p>
        </div>
        <div>
          <Input
            id={`${idPrefix}-months`}
            type="number"
            inputMode="numeric"
            min={0}
            max={11}
            value={months}
            onChange={(e) => update(years, Number(e.target.value))}
            aria-label={t("common.months")}
          />
          <p className="text-[11px] text-muted-foreground mt-1 ml-0.5">{t("common.months")}</p>
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
};
