import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialProfile } from "@/lib/scoring";

type Item = {
  id: string;
  label: string;
  hint: string;
  done: boolean;
  to: string;
  cta: string;
};

export const OnboardingChecklist = ({
  profile,
  hasGoal,
  attemptsCount,
}: {
  profile: FinancialProfile | null;
  hasGoal: boolean;
  attemptsCount: number;
}) => {
  const items: Item[] = [
    {
      id: "profile",
      label: "Share your income & expenses",
      hint: "We need these to gauge cash-flow and savings rate.",
      done: !!profile && profile.monthlyIncome > 0,
      to: "/app/onboarding",
      cta: "Add details",
    },
    {
      id: "bills",
      label: "Confirm bill-payment history",
      hint: "Utility & mobile on-time rates — your strongest signal.",
      done:
        !!profile &&
        (profile.utilityOnTimeRate > 0 || profile.mobileOnTimeRate > 0),
      to: "/app/onboarding",
      cta: "Review",
    },
    {
      id: "simulate",
      label: "Try the what-if simulator",
      hint: "See how small changes move your score instantly.",
      done: attemptsCount >= 2,
      to: "/app/simulator",
      cta: "Open simulator",
    },
    {
      id: "goal",
      label: "Set a target score",
      hint: "Pick a goal & date — we'll track your progress.",
      done: hasGoal,
      to: "/app/goals",
      cta: "Set goal",
    },
  ];

  const completed = items.filter((i) => i.done).length;
  const pct = Math.round((completed / items.length) * 100);
  if (completed === items.length) return null;

  return (
    <div className="warm-card p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <div>
            <h2 className="font-display text-xl font-semibold">Get set up for an accurate score</h2>
            <p className="text-sm text-muted-foreground">
              Finish these {items.length - completed} quick steps — each one sharpens your result.
            </p>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground shrink-0">
          {completed}/{items.length} done
        </span>
      </div>

      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-5">
        <div
          className="h-full bg-gradient-warm ease-soft transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ul className="space-y-2">
        {items.map((it) => (
          <li
            key={it.id}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl border ease-soft transition-colors",
              it.done ? "border-accent/30 bg-accent/5" : "border-border bg-background",
            )}
          >
            <span
              className={cn(
                "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                it.done ? "bg-accent border-accent" : "border-muted-foreground/40",
              )}
            >
              {it.done && <Check className="h-3 w-3 text-accent-foreground" />}
            </span>
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium", it.done && "line-through text-muted-foreground")}>
                {it.label}
              </p>
              <p className="text-xs text-muted-foreground">{it.hint}</p>
            </div>
            {!it.done && (
              <Link
                to={it.to}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-1 shrink-0"
              >
                {it.cta} <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
