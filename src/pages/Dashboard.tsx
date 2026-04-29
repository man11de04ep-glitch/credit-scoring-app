import { useMemo } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ScoreGauge } from "@/components/ScoreGauge";
import { FactorChart } from "@/components/FactorChart";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";
import { FoirCard } from "@/components/FoirCard";
import { getCurrentAssessment, submitAssessment } from "@/lib/engine";
import { exportAssessmentPdf } from "@/lib/exportPdf";
import { storage } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Check, X, Lightbulb, MessageCircle, Sliders, Target, BarChart3,
  Plus, FileDown, Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/i18n/LanguageProvider";
const Dashboard = () => {
  const navigate = useNavigate();
  const { t } = useT();
  const attempts = storage.getAttempts();
  const habits = storage.getHabits();
  const goal = storage.getGoal();
  const user = storage.getUser();
  const profile = storage.getProfile();

  const result = useMemo(() => getCurrentAssessment(), []);

  if (!result) return <Navigate to="/app/onboarding" replace />;

  const handlePublish = async () => {
    // Re-save current profile as a fresh attempt so it's pinned to the timeline
    submitAssessment(result.profile);
    const shareText = `My Smart Credit Score: ${result.score} (${result.riskLabel}) — approval likelihood ${result.approvalLikelihood}%.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Smart Credit Score", text: shareText });
        toast.success("Shared & saved to history");
      } else {
        await navigator.clipboard.writeText(shareText);
        toast.success("Saved to history · summary copied to clipboard");
      }
    } catch {
      toast.success("Saved to history");
    }
  };

  const previous = attempts[1]?.score;
  const delta = previous !== undefined ? result.score - previous : 0;
  const completedHabits = habits.filter((h) => h.done).length;

  return (
    <div className="space-y-6 animate-float-up">
      {/* Hero score card */}
      <div className="warm-card p-6 lg:p-8 grid lg:grid-cols-[auto_1fr] gap-8 items-center">
        <div className="flex justify-center">
          <ScoreGauge score={result.score} band={result.band} />
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Smart Credit Score</p>
            <h1 className="font-display text-3xl lg:text-4xl font-semibold mt-1">{result.summary}</h1>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <Badge tone="muted">
              Approval likelihood:{" "}
              <span className="font-semibold ml-1">{result.approvalLikelihood}%</span>
            </Badge>
            {previous !== undefined && (
              <Badge tone={delta >= 0 ? "good" : "bad"}>
                {delta >= 0 ? "▲" : "▼"} {Math.abs(delta)} since last check
              </Badge>
            )}
            {goal && (
              <Badge tone="muted">
                Goal: {goal.targetScore} ({Math.max(0, goal.targetScore - result.score)} to go)
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="bg-gradient-warm border-0 shadow-warm hover:opacity-95"
              onClick={() => navigate("/app/onboarding")}
            >
              <Plus className="h-4 w-4 mr-1.5" /> New check
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/app/simulator"><Sliders className="h-4 w-4 mr-1.5" /> What-if sliders</Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                exportAssessmentPdf(result, user?.name);
                toast.success("PDF report downloaded");
              }}
            >
              <FileDown className="h-4 w-4 mr-1.5" /> Export PDF
            </Button>
            <Button size="sm" variant="outline" onClick={handlePublish}>
              <Share2 className="h-4 w-4 mr-1.5" /> Save & publish
            </Button>
            <Button asChild size="sm" variant="ghost">
              <Link to="/app/chat"><MessageCircle className="h-4 w-4 mr-1.5" /> Ask why</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Onboarding checklist — hidden when all steps done */}
      <OnboardingChecklist
        profile={profile}
        hasGoal={!!goal}
        attemptsCount={attempts.length}
      />

      {/* Loan verdict */}
      <div
        className={cn(
          "rounded-3xl p-6 border",
          result.loanVerdict.likelyApproved
            ? "border-accent/30 bg-accent/5"
            : "border-destructive/30 bg-destructive/5"
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-xl flex items-center justify-center shrink-0",
              result.loanVerdict.likelyApproved
                ? "bg-accent text-accent-foreground"
                : "bg-destructive text-destructive-foreground"
            )}
          >
            {result.loanVerdict.likelyApproved ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">{result.loanVerdict.headline}</h2>
            <p className="text-sm text-muted-foreground mt-1">{result.loanVerdict.reason}</p>
            {result.loanVerdict.fixes.length > 0 && (
              <ul className="mt-3 space-y-1.5 text-sm">
                {result.loanVerdict.fixes.map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <ArrowRight className="h-3.5 w-3.5 text-primary" /> {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* FOIR consultant verdict + Satisfying Alternative */}
      <FoirCard
        foir={result.foir}
        band={result.band}
        movers={result.topWeaknesses}
        onUseAlternative={(amount) => {
          submitAssessment({ ...result.profile, desiredLoanAmount: amount });
          toast.success(t("foir.alt.use"));
          window.location.reload();
        }}
      />

      {/* Factor breakdown */}
      <div className="warm-card p-6">
        <h2 className="font-display text-xl font-semibold mb-4">What's shaping your score</h2>
        <ul className="space-y-3">
          {result.contributions
            .slice()
            .sort((a, b) => b.weight - a.weight)
            .map((c) => (
              <li key={c.key} className="grid sm:grid-cols-[180px_1fr_auto] gap-3 items-center">
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">Weight {Math.round(c.weight * 100)}%</p>
                </div>
                <div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full ease-soft transition-all duration-700"
                      style={{
                        width: `${c.rawSubScore * 100}%`,
                        background:
                          c.status === "great"
                            ? "hsl(var(--risk-low))"
                            : c.status === "ok"
                            ? "hsl(var(--risk-medium))"
                            : "hsl(var(--risk-high))",
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">{c.insight}</p>
                </div>
                <span
                  className={cn(
                    "justify-self-start sm:justify-self-end text-xs font-medium px-2.5 py-1 rounded-full",
                    c.status === "great" && "bg-accent/15 text-accent",
                    c.status === "ok" && "bg-warning/15 text-warning-foreground",
                    c.status === "weak" && "bg-destructive/15 text-destructive"
                  )}
                >
                  {c.status === "great" ? "Strong" : c.status === "ok" ? "Okay" : "Needs work"}
                </span>
              </li>
            ))}
        </ul>
      </div>

      {/* Recharts factor chart */}
      <div className="warm-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">Factor strength vs weight</h2>
        </div>
        <FactorChart data={result.factorChartData} />
        <div className="flex gap-5 text-xs text-muted-foreground mt-3">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Your sub-score (0–100)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Factor weight (%)
          </span>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Suggestions */}
        <div className="warm-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Personalized suggestions</h2>
          </div>
          <ul className="space-y-2.5">
            {result.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Habits / reminders */}
        <div className="warm-card p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-xl font-semibold">Habit reminders</h2>
            <span className="text-xs text-muted-foreground">
              {completedHabits}/{habits.length} done
            </span>
          </div>
          <ul className="space-y-2">
            {habits.slice(0, 4).map((h) => (
              <li
                key={h.id}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl border ease-soft transition-colors",
                  h.done ? "border-accent/30 bg-accent/5" : "border-border bg-background"
                )}
              >
                <span
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                    h.done ? "bg-accent border-accent" : "border-muted-foreground/40"
                  )}
                >
                  {h.done && <Check className="h-3 w-3 text-accent-foreground" />}
                </span>
                <span className={cn("text-sm", h.done && "line-through text-muted-foreground")}>{h.label}</span>
              </li>
            ))}
          </ul>
          <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
            <Link to="/app/goals">Manage habits & goals <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
          </Button>
        </div>
      </div>

      {/* Goal CTA */}
      {!goal && (
        <div className="rounded-3xl bg-gradient-warm p-6 text-primary-foreground flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display text-xl font-semibold">Set a target score</h3>
            <p className="text-sm opacity-90 mt-1">Track your progress and stay motivated.</p>
          </div>
          <Button asChild variant="secondary">
            <Link to="/app/goals"><Target className="h-4 w-4 mr-1.5" /> Set goal</Link>
          </Button>
        </div>
      )}
    </div>
  );
};

const Badge = ({ tone, children }: { tone: "good" | "bad" | "muted"; children: React.ReactNode }) => (
  <span
    className={cn(
      "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium",
      tone === "good" && "bg-accent/15 text-accent",
      tone === "bad" && "bg-destructive/15 text-destructive",
      tone === "muted" && "bg-secondary text-secondary-foreground"
    )}
  >
    {children}
  </span>
);

export default Dashboard;
