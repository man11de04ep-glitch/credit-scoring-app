import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/i18n/LanguageProvider";
import type { RiskBand, ContributionDetail } from "@/lib/scoring";
import { FOIR_BY_BAND } from "@/lib/foir";

interface WhyCapExplainerProps {
  band: RiskBand;
  /** Top weaknesses that pulled the band down. */
  movers: ContributionDetail[];
}

/**
 * Collapsible "Why this cap?" — explains the risk band → 30/40/45% FOIR
 * mapping and which factors moved the user into their current band.
 */
export const WhyCapExplainer = ({ band, movers }: WhyCapExplainerProps) => {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const cap = Math.round(FOIR_BY_BAND[band] * 100);
  const bandLabel = t(`risk.${band}`);

  const rows: Array<{ b: RiskBand; key: string }> = [
    { b: "low", key: "foir.why.low" },
    { b: "medium", key: "foir.why.medium" },
    { b: "high", key: "foir.why.high" },
  ];

  return (
    <div className="rounded-2xl border border-border/60 bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          <Info className="h-4 w-4 text-primary" />
          {open ? t("foir.why.close") : t("foir.why.open")}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 animate-float-up">
          <p className="text-xs text-muted-foreground">{t("foir.why.intro")}</p>
          <ul className="space-y-1.5">
            {rows.map(({ b, key }) => (
              <li
                key={b}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm border",
                  b === band
                    ? "border-primary/40 bg-primary/5 font-medium"
                    : "border-transparent text-muted-foreground"
                )}
              >
                <span>{t(key)}</span>
                {b === band && (
                  <span className="text-xs uppercase tracking-wide text-primary">●</span>
                )}
              </li>
            ))}
          </ul>

          <p className="text-sm">
            {t("foir.why.bandLine", { band: bandLabel, cap })}
          </p>

          {movers.length > 0 && (
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
                {t("foir.why.movers")}
              </p>
              <ul className="space-y-1">
                {movers.slice(0, 3).map((m) => (
                  <li key={m.key} className="text-sm flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-destructive shrink-0" />
                    <span>
                      <span className="font-medium">{m.label}</span>{" "}
                      <span className="text-muted-foreground">— {m.insight}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
