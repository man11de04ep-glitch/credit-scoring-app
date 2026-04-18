import { useEffect, useState } from "react";
import type { RiskBand } from "@/lib/scoring";
import { cn } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;          // 300..900
  band: RiskBand;
  size?: number;
  animate?: boolean;
}

const bandLabel: Record<RiskBand, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

const bandColor: Record<RiskBand, string> = {
  low: "hsl(var(--risk-low))",
  medium: "hsl(var(--risk-medium))",
  high: "hsl(var(--risk-high))",
};

export const ScoreGauge = ({ score, band, size = 240, animate = true }: ScoreGaugeProps) => {
  const [displayScore, setDisplayScore] = useState(animate ? 300 : score);

  useEffect(() => {
    if (!animate) { setDisplayScore(score); return; }
    let raf = 0;
    const start = performance.now();
    const from = displayScore;
    const dur = 900;
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayScore(Math.round(from + (score - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score, animate]);

  const radius = size / 2 - 18;
  const circumference = 2 * Math.PI * radius;
  // Use 75% of circle (270deg arc)
  const arc = 0.75;
  const progress = (displayScore - 300) / 600;
  const dash = circumference * arc * progress;
  const gap = circumference - dash;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[135deg]">
        <defs>
          <linearGradient id="score-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--risk-high))" />
            <stop offset="50%" stopColor="hsl(var(--risk-medium))" />
            <stop offset="100%" stopColor="hsl(var(--risk-low))" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={14}
          strokeDasharray={`${circumference * arc} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#score-grad)"
          strokeWidth={14}
          strokeDasharray={`${dash} ${gap + circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 200ms ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Your score</span>
        <span className="font-display text-6xl font-semibold gradient-text leading-none mt-1 animate-count-up">
          {displayScore}
        </span>
        <span className="text-sm text-muted-foreground mt-1">out of 900</span>
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn("h-2 w-2 rounded-full animate-pulse-ring")}
            style={{ background: bandColor[band] }}
          />
          <span className="text-sm font-medium" style={{ color: bandColor[band] }}>
            {bandLabel[band]}
          </span>
        </div>
      </div>
    </div>
  );
};
