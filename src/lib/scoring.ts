// Smart Credit scoring engine
// Deterministic, transparent score (300–900) inspired by Random Forest feature weights.
// Each input contributes a normalised sub-score (0–1) with a weight.
// We compute: final = 300 + 600 * sum(weight * subScore)

export type FinancialProfile = {
  monthlyIncome: number;            // INR / month
  monthlyExpenses: number;          // INR / month
  monthlySavings: number;           // INR / month (can be negative)
  utilityOnTimeRate: number;        // 0..1 (% of utility bills paid on time, last 6 months)
  mobileOnTimeRate: number;         // 0..1
  txnFrequency: "low" | "medium" | "high"; // weekly digital transactions
  pastLoanAttempts: number;         // total prior loan applications
  pastLoanRejections: number;       // of those, how many were rejected
  hasEmergencyFund: boolean;        // > 1 month expenses saved
  employmentMonths: number;         // months in current job / income source
};

export type RiskBand = "low" | "medium" | "high";

export type ContributionDetail = {
  key: string;
  label: string;
  weight: number;          // 0..1
  rawSubScore: number;     // 0..1
  weightedPoints: number;  // contribution to the 300–900 scale
  status: "great" | "ok" | "weak";
  insight: string;
};

export type ScoreResult = {
  score: number;           // 300..900
  band: RiskBand;
  approvalLikelihood: number; // 0..100
  contributions: ContributionDetail[];
  topStrengths: ContributionDetail[];
  topWeaknesses: ContributionDetail[];
  summary: string;
  suggestions: string[];
  loanVerdict: {
    likelyApproved: boolean;
    headline: string;
    reason: string;
    fixes: string[];
  };
};

const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));

const txnScore: Record<FinancialProfile["txnFrequency"], number> = {
  low: 0.35,
  medium: 0.7,
  high: 1,
};

// Weights sum to 1. Calibrated to mimic typical RF feature importance.
const WEIGHTS = {
  savingsRate: 0.22,
  billPayments: 0.22,
  expenseRatio: 0.18,
  loanHistory: 0.14,
  emergencyFund: 0.08,
  txnFrequency: 0.08,
  employment: 0.08,
} as const;

function statusFor(sub: number): ContributionDetail["status"] {
  if (sub >= 0.7) return "great";
  if (sub >= 0.45) return "ok";
  return "weak";
}

export function computeScore(p: FinancialProfile): ScoreResult {
  const income = Math.max(p.monthlyIncome, 1);
  const savingsRate = clamp(p.monthlySavings / income, -0.5, 1);
  const expenseRatio = clamp(p.monthlyExpenses / income, 0, 2);

  // 1. Savings rate: 0% → 0, 30%+ → 1
  const savingsSub = clamp(savingsRate / 0.3);
  // 2. Bill payments: weighted average of utility & mobile on-time rates
  const billsSub = clamp(0.6 * p.utilityOnTimeRate + 0.4 * p.mobileOnTimeRate);
  // 3. Expense ratio: <50% income → 1, >100% → 0
  const expenseSub = clamp(1 - (expenseRatio - 0.5) / 0.5);
  // 4. Loan history: rejections hurt, attempts without rejection neutral
  const rejectionRate = p.pastLoanAttempts > 0 ? p.pastLoanRejections / p.pastLoanAttempts : 0;
  const loanSub = p.pastLoanAttempts === 0 ? 0.65 : clamp(1 - rejectionRate);
  // 5. Emergency fund: binary boost
  const emergencySub = p.hasEmergencyFund ? 1 : 0.2;
  // 6. Transaction frequency
  const txnSub = txnScore[p.txnFrequency];
  // 7. Employment stability: 0 mo → 0, 24+ mo → 1
  const employmentSub = clamp(p.employmentMonths / 24);

  const breakdown: Array<Omit<ContributionDetail, "weightedPoints" | "status">> = [
    {
      key: "savingsRate",
      label: "Savings rate",
      weight: WEIGHTS.savingsRate,
      rawSubScore: savingsSub,
      insight:
        savingsSub >= 0.7
          ? `You save about ${Math.round(savingsRate * 100)}% of your income — excellent cushion.`
          : savingsSub >= 0.45
          ? `You save ~${Math.round(savingsRate * 100)}% of income. Aim for 20–30%.`
          : `Savings are only ~${Math.round(savingsRate * 100)}% of income — lenders see this as risky.`,
    },
    {
      key: "billPayments",
      label: "Bill payment behavior",
      weight: WEIGHTS.billPayments,
      rawSubScore: billsSub,
      insight:
        billsSub >= 0.9
          ? "Near-perfect on-time bill payments — strongest positive signal."
          : billsSub >= 0.7
          ? "Mostly on-time payments. Small slips still drag your score down."
          : "Frequent late payments on utility/mobile bills hurt your score the most.",
    },
    {
      key: "expenseRatio",
      label: "Expense-to-income ratio",
      weight: WEIGHTS.expenseRatio,
      rawSubScore: expenseSub,
      insight:
        expenseSub >= 0.7
          ? `Expenses are ~${Math.round(expenseRatio * 100)}% of income — well controlled.`
          : expenseSub >= 0.45
          ? `Expenses are ~${Math.round(expenseRatio * 100)}% of income — leaves little room.`
          : `Expenses are ~${Math.round(expenseRatio * 100)}% of income — you're stretched thin.`,
    },
    {
      key: "loanHistory",
      label: "Past loan attempts",
      weight: WEIGHTS.loanHistory,
      rawSubScore: loanSub,
      insight:
        p.pastLoanAttempts === 0
          ? "No prior loan history — neutral. Consider a small credit-builder."
          : rejectionRate === 0
          ? "Clean record on prior loan attempts."
          : `${p.pastLoanRejections} of ${p.pastLoanAttempts} loan attempts were rejected.`,
    },
    {
      key: "emergencyFund",
      label: "Emergency fund",
      weight: WEIGHTS.emergencyFund,
      rawSubScore: emergencySub,
      insight: p.hasEmergencyFund
        ? "You have an emergency cushion — great resilience signal."
        : "No emergency fund — small shocks could derail repayments.",
    },
    {
      key: "txnFrequency",
      label: "Digital transaction activity",
      weight: WEIGHTS.txnFrequency,
      rawSubScore: txnSub,
      insight:
        txnSub >= 0.9
          ? "Active digital footprint helps lenders verify income flows."
          : txnSub >= 0.5
          ? "Moderate digital activity — usable but not strong."
          : "Low digital activity makes it harder for lenders to assess you.",
    },
    {
      key: "employment",
      label: "Income stability",
      weight: WEIGHTS.employment,
      rawSubScore: employmentSub,
      insight:
        employmentSub >= 0.7
          ? `${p.employmentMonths} months of stable income — strong.`
          : employmentSub >= 0.45
          ? `${p.employmentMonths} months of income history — building up.`
          : `Only ${p.employmentMonths} months of income history — lenders prefer 12+.`,
    },
  ];

  const contributions: ContributionDetail[] = breakdown.map((c) => ({
    ...c,
    weightedPoints: c.weight * c.rawSubScore * 600,
    status: statusFor(c.rawSubScore),
  }));

  const totalNormalised = contributions.reduce((acc, c) => acc + c.weight * c.rawSubScore, 0);
  const score = Math.round(300 + 600 * totalNormalised);

  const band: RiskBand = score >= 720 ? "low" : score >= 580 ? "medium" : "high";
  const approvalLikelihood = Math.round(clamp((score - 300) / 600) * 100);

  const sorted = [...contributions].sort((a, b) => b.rawSubScore - a.rawSubScore);
  const topStrengths = sorted.filter((c) => c.status !== "weak").slice(0, 2);
  const topWeaknesses = [...contributions]
    .filter((c) => c.status === "weak")
    .sort((a, b) => a.rawSubScore - b.rawSubScore)
    .slice(0, 3);

  const suggestions = buildSuggestions(p, contributions);
  const summary = buildSummary(score, band, topStrengths, topWeaknesses);
  const loanVerdict = buildLoanVerdict(score, band, topWeaknesses);

  return {
    score,
    band,
    approvalLikelihood,
    contributions,
    topStrengths,
    topWeaknesses,
    summary,
    suggestions,
    loanVerdict,
  };
}

function buildSummary(
  score: number,
  band: RiskBand,
  strengths: ContributionDetail[],
  weaknesses: ContributionDetail[]
): string {
  const tone =
    band === "low"
      ? "You look like a trustworthy borrower."
      : band === "medium"
      ? "You're on the right track — a few tweaks can move you up."
      : "Lenders may hesitate today, but this is fixable.";
  const strengthLine = strengths.length
    ? ` Strongest signals: ${strengths.map((s) => s.label.toLowerCase()).join(" and ")}.`
    : "";
  const weaknessLine = weaknesses.length
    ? ` Biggest drag: ${weaknesses[0].label.toLowerCase()}.`
    : "";
  return `Your estimated score is ${score}. ${tone}${strengthLine}${weaknessLine}`;
}

function buildSuggestions(p: FinancialProfile, contributions: ContributionDetail[]): string[] {
  const tips: string[] = [];
  const byKey = Object.fromEntries(contributions.map((c) => [c.key, c]));

  if (byKey.billPayments.status !== "great") {
    tips.push("Set autopay for at least your mobile + electricity bill — this single habit moves your score the most.");
  }
  if (byKey.savingsRate.status !== "great") {
    const target = Math.round(p.monthlyIncome * 0.2);
    tips.push(`Try to save ₹${target.toLocaleString()} per month (≈20% of income) into a separate account.`);
  }
  if (byKey.expenseRatio.status === "weak") {
    tips.push("Track expenses for 30 days and trim the top 2 discretionary categories by 15%.");
  }
  if (byKey.emergencyFund.status === "weak") {
    tips.push("Build a small emergency fund of ₹5,000–10,000 first — it dramatically reduces lender risk.");
  }
  if (byKey.loanHistory.status === "weak") {
    tips.push("Avoid new loan applications for 60 days; each rejection hurts. Try a small secured credit-builder instead.");
  }
  if (byKey.txnFrequency.status !== "great") {
    tips.push("Use UPI/digital payments for groceries and bills — it builds a verifiable transaction history.");
  }
  if (byKey.employment.status !== "great") {
    tips.push("Stay in your current income source for at least 6 more months — stability is a major positive signal.");
  }
  return tips.slice(0, 5);
}

function buildLoanVerdict(score: number, band: RiskBand, weaknesses: ContributionDetail[]) {
  if (band === "low") {
    return {
      likelyApproved: true,
      headline: "Likely approved ✓",
      reason: "Your profile shows healthy savings, on-time payments, and stable income — most lenders will say yes.",
      fixes: [],
    };
  }
  if (band === "medium") {
    return {
      likelyApproved: true,
      headline: "Approved with conditions",
      reason: "You'd qualify for a smaller loan amount or a slightly higher interest rate. Strengthening 1–2 areas could unlock better terms.",
      fixes: weaknesses.slice(0, 2).map((w) => `Improve ${w.label.toLowerCase()}`),
    };
  }
  return {
    likelyApproved: false,
    headline: "Likely rejected today",
    reason: "Your current profile doesn't yet meet most lender thresholds — but this is very fixable in 2–3 months.",
    fixes: weaknesses.map((w) => `Improve ${w.label.toLowerCase()}`),
  };
}

export const DEFAULT_PROFILE: FinancialProfile = {
  monthlyIncome: 25000,
  monthlyExpenses: 18000,
  monthlySavings: 4000,
  utilityOnTimeRate: 0.85,
  mobileOnTimeRate: 0.9,
  txnFrequency: "medium",
  pastLoanAttempts: 1,
  pastLoanRejections: 0,
  hasEmergencyFund: false,
  employmentMonths: 8,
};
