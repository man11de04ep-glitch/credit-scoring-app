import { Wallet, TrendingDown, CheckCircle2, AlertTriangle, ShieldX, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n/LanguageProvider";
import type { FoirAnalysis } from "@/lib/foir";

const fmt = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const yearsMonths = (m: number, t: (k: string) => string) => {
  const y = Math.floor(m / 12);
  const mm = m % 12;
  if (y && mm) return `${y} ${t("common.year")} ${mm} ${t("common.month")}`;
  if (y) return `${y} ${t("common.years")}`;
  return `${mm} ${t("common.months")}`;
};

interface FoirCardProps {
  foir: FoirAnalysis;
  /** When provided, allows the user to apply the alternative amount. */
  onUseAlternative?: (amount: number) => void;
}

export const FoirCard = ({ foir, onUseAlternative }: FoirCardProps) => {
  const { t } = useT();

  const tone =
    foir.verdict === "sustainable"
      ? { ring: "border-accent/30 bg-accent/5", chip: "bg-accent text-accent-foreground", Icon: CheckCircle2 }
      : foir.verdict === "stretch"
      ? { ring: "border-warning/40 bg-warning/5", chip: "bg-warning text-warning-foreground", Icon: AlertTriangle }
      : { ring: "border-destructive/30 bg-destructive/5", chip: "bg-destructive text-destructive-foreground", Icon: ShieldX };

  const reason = t(foir.reasonKey, {
    pct: Math.round(foir.foirCap * 100),
    cap: Math.round(foir.foirCap * 100),
    req: Math.round(foir.requestedFoir * 100),
  });

  const altIsSame = foir.isSustainable && foir.alternativeAmount === foir.requestedAmount;

  return (
    <div className="space-y-4">
      <div className={cn("rounded-3xl p-6 border", tone.ring)}>
        <div className="flex items-start gap-3">
          <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", tone.chip)}>
            <tone.Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{t("foir.title")}</p>
            <h2 className="font-display text-xl font-semibold mt-0.5">{t(foir.headlineKey)}</h2>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{reason}</p>

            <div className="grid sm:grid-cols-2 gap-3 mt-4">
              <Stat icon={Wallet} label={t("foir.cap")} value={`${Math.round(foir.foirCap * 100)}%`} />
              <Stat icon={TrendingDown} label={t("foir.maxEmi")} value={fmt(foir.maxEmi)} />
              <Stat icon={Wallet} label={t("foir.maxLoan")} value={fmt(foir.maxPrincipal)} />
              <Stat
                icon={TrendingDown}
                label={t("foir.requestedEmi")}
                value={fmt(foir.requestedEmi)}
                sub={`${fmt(foir.requestedAmount)} · ${yearsMonths(foir.tenureMonths, t)}`}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-3">
              {t("foir.tenure")}: {yearsMonths(foir.tenureMonths, t)} · {t("foir.rate")}: {(foir.annualRate * 100).toFixed(0)}% p.a.
            </p>
          </div>
        </div>
      </div>

      {/* Satisfying Alternative */}
      <div className="rounded-3xl p-6 border border-primary/30 bg-gradient-warm/5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-[220px]">
            <p className="text-xs uppercase tracking-widest text-primary font-medium">{t("foir.alt.title")}</p>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
              {altIsSame ? t("foir.alt.same") : t("foir.alt.desc")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">{t("foir.alt.amount")}</p>
            <p className="font-display text-3xl font-semibold gradient-text leading-none mt-0.5">
              {fmt(foir.alternativeAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {t("foir.alt.emi")}: <span className="font-medium text-foreground">{fmt(foir.alternativeEmi)}</span>
            </p>
            {!altIsSame && onUseAlternative && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => onUseAlternative(foir.alternativeAmount)}
              >
                {t("foir.alt.use")} <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Stat = ({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
}) => (
  <div className="rounded-xl bg-card/60 border border-border/60 px-3.5 py-2.5">
    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wide">
      <Icon className="h-3 w-3" /> {label}
    </div>
    <p className="font-display text-lg font-semibold mt-0.5">{value}</p>
    {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
  </div>
);
