import { useMemo, useState } from "react";
import { computeScore } from "@/lib/scoring";
import type { ScoreAttempt } from "@/lib/storage";
import { ArrowRight, ArrowDown, ArrowUp, Minus, GitCompareArrows } from "lucide-react";
import { cn } from "@/lib/utils";

interface CompareAttemptsProps {
  attempts: ScoreAttempt[];
}

export const CompareAttempts = ({ attempts }: CompareAttemptsProps) => {
  // Default: most recent vs the one before it (chronologically)
  const [aId, setAId] = useState<string>(attempts[1]?.id ?? attempts[0]?.id ?? "");
  const [bId, setBId] = useState<string>(attempts[0]?.id ?? "");

  const a = attempts.find((x) => x.id === aId);
  const b = attempts.find((x) => x.id === bId);

  const diff = useMemo(() => {
    if (!a || !b) return null;
    const ra = computeScore(a.profile);
    const rb = computeScore(b.profile);
    const rows = ra.contributions.map((ca) => {
      const cb = rb.contributions.find((c) => c.key === ca.key)!;
      return {
        key: ca.key,
        label: ca.label,
        weight: ca.weight,
        before: ca.weightedPoints,
        after: cb.weightedPoints,
        beforeSub: ca.rawSubScore,
        afterSub: cb.rawSubScore,
        delta: cb.weightedPoints - ca.weightedPoints,
        beforeInsight: ca.insight,
        afterInsight: cb.insight,
      };
    }).sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
    return { ra, rb, rows, totalDelta: rb.score - ra.score };
  }, [a, b]);

  if (attempts.length < 2) {
    return (
      <div className="warm-card p-6 text-center">
        <GitCompareArrows className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Run another score check (e.g. via the simulator) to compare two attempts.
        </p>
      </div>
    );
  }

  if (!a || !b || !diff) return null;

  const sameAttempt = a.id === b.id;

  return (
    <div className="warm-card p-6 space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <GitCompareArrows className="h-5 w-5 text-primary" />
        <h2 className="font-display text-xl font-semibold mr-auto">Compare attempts</h2>
        <AttemptPicker label="From" attempts={attempts} value={aId} onChange={setAId} />
        <ArrowRight className="h-4 w-4 text-muted-foreground hidden sm:block" />
        <AttemptPicker label="To" attempts={attempts} value={bId} onChange={setBId} />
      </div>

      {sameAttempt ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          Pick two different attempts to see what changed.
        </p>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 items-stretch">
            <ScoreColumn label="From" date={a.createdAt} score={diff.ra.score} band={diff.ra.band} />
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Net change</p>
              <p
                className={cn(
                  "font-display text-4xl font-semibold mt-1",
                  diff.totalDelta > 0 && "text-accent",
                  diff.totalDelta < 0 && "text-destructive",
                  diff.totalDelta === 0 && "text-muted-foreground"
                )}
              >
                {diff.totalDelta > 0 ? "+" : ""}{diff.totalDelta}
              </p>
              <p className="text-xs text-muted-foreground mt-1">points</p>
            </div>
            <ScoreColumn label="To" date={b.createdAt} score={diff.rb.score} band={diff.rb.band} />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">Factors that changed most</h3>
            <ul className="space-y-2.5">
              {diff.rows.map((r) => {
                const direction = r.delta > 0.5 ? "up" : r.delta < -0.5 ? "down" : "flat";
                return (
                  <li
                    key={r.key}
                    className="grid grid-cols-[auto_1fr_auto] gap-3 items-center px-3.5 py-3 rounded-xl border border-border bg-background"
                  >
                    <span
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                        direction === "up" && "bg-accent/15 text-accent",
                        direction === "down" && "bg-destructive/15 text-destructive",
                        direction === "flat" && "bg-muted text-muted-foreground"
                      )}
                    >
                      {direction === "up" ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : direction === "down" ? (
                        <ArrowDown className="h-4 w-4" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium truncate">{r.label}</p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          weight {Math.round(r.weight * 100)}%
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <MiniBar value={r.beforeSub} muted />
                        <MiniBar value={r.afterSub} />
                      </div>
                      {direction !== "flat" && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {direction === "up" ? r.afterInsight : r.beforeInsight}
                        </p>
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold whitespace-nowrap",
                        direction === "up" && "text-accent",
                        direction === "down" && "text-destructive",
                        direction === "flat" && "text-muted-foreground"
                      )}
                    >
                      {r.delta > 0 ? "+" : ""}{r.delta.toFixed(1)} pts
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

const AttemptPicker = ({
  label,
  attempts,
  value,
  onChange,
}: {
  label: string;
  attempts: ScoreAttempt[];
  value: string;
  onChange: (id: string) => void;
}) => (
  <label className="text-xs text-muted-foreground flex items-center gap-2">
    <span>{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-background border border-border rounded-lg px-2.5 py-1.5 text-foreground text-sm"
    >
      {attempts.map((a) => (
        <option key={a.id} value={a.id}>
          {new Date(a.createdAt).toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" })} · {a.score}
        </option>
      ))}
    </select>
  </label>
);

const ScoreColumn = ({
  label,
  date,
  score,
  band,
}: {
  label: string;
  date: string;
  score: number;
  band: "low" | "medium" | "high";
}) => (
  <div className="rounded-2xl bg-background border border-border p-4 text-center">
    <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
    <p className="font-display text-3xl font-semibold mt-1">{score}</p>
    <p className="text-xs text-muted-foreground mt-1">
      {new Date(date).toLocaleDateString(undefined, { dateStyle: "medium" })}
    </p>
    <span
      className={cn(
        "inline-flex mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
        band === "low" && "bg-accent/15 text-accent",
        band === "medium" && "bg-warning/15 text-warning-foreground",
        band === "high" && "bg-destructive/15 text-destructive"
      )}
    >
      {band} risk
    </span>
  </div>
);

const MiniBar = ({ value, muted = false }: { value: number; muted?: boolean }) => (
  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
    <div
      className="h-full rounded-full ease-soft transition-all duration-500"
      style={{
        width: `${Math.max(0, Math.min(1, value)) * 100}%`,
        background: muted ? "hsl(var(--muted-foreground) / 0.5)" : "hsl(var(--primary))",
      }}
    />
  </div>
);
