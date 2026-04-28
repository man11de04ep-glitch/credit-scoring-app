// Local "backend" engine — single entry point for all credit scoring logic.
// All frontend inputs flow through this module instead of an external API.
import {
  computeScore,
  DEFAULT_PROFILE,
  type FinancialProfile,
  type ScoreResult,
  type RiskBand,
  type ContributionDetail,
} from "./scoring";
import { storage, type ScoreAttempt } from "./storage";

export type EngineInput = Partial<FinancialProfile> & {
  // Convenience fields mapped onto FinancialProfile
  age?: number;
  loanAmount?: number;
  loanTermMonths?: number;
};

export type EngineAssessment = ScoreResult & {
  profile: FinancialProfile;
  riskBand: RiskBand;
  riskLabel: string;
  computedAt: string;
  // Chart-ready data for Recharts
  factorChartData: Array<{
    name: string;
    score: number;       // 0–100
    weight: number;      // 0–100
    contribution: number; // weighted points on 300–900 scale
  }>;
};

const RISK_LABEL: Record<RiskBand, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

/** Merge a partial input with defaults/stored profile into a full FinancialProfile. */
export function normalizeInput(input: EngineInput = {}): FinancialProfile {
  const base = storage.getProfile() ?? DEFAULT_PROFILE;
  const merged: FinancialProfile = { ...base, ...stripExtras(input) };

  // If savings not provided but income/expenses are, derive it.
  if (input.monthlySavings === undefined && (input.monthlyIncome !== undefined || input.monthlyExpenses !== undefined)) {
    merged.monthlySavings = Math.max(0, merged.monthlyIncome - merged.monthlyExpenses);
  }
  return merged;
}

function stripExtras(i: EngineInput): Partial<FinancialProfile> {
  const { age: _a, loanAmount: _l, loanTermMonths: _t, ...rest } = i;
  return rest;
}

function toChartData(contributions: ContributionDetail[]) {
  return contributions.map((c) => ({
    name: c.label,
    score: Math.round(c.rawSubScore * 100),
    weight: Math.round(c.weight * 100),
    contribution: Math.round(c.weightedPoints),
  }));
}

/** Synchronous — compute a full assessment from any partial input. */
export function assess(input: EngineInput = {}): EngineAssessment {
  const profile = normalizeInput(input);
  const result = computeScore(profile);
  return {
    ...result,
    profile,
    riskBand: result.band,
    riskLabel: RISK_LABEL[result.band],
    computedAt: new Date().toISOString(),
    factorChartData: toChartData(result.contributions),
  };
}

/** Run an assessment AND persist the profile + history attempt. */
export function submitAssessment(input: EngineInput): EngineAssessment {
  const assessment = assess(input);
  storage.saveProfile(assessment.profile);
  const attempt: ScoreAttempt = {
    id: crypto.randomUUID(),
    createdAt: assessment.computedAt,
    profile: assessment.profile,
    score: assessment.score,
    band: assessment.band,
  };
  storage.saveAttempt(attempt);
  return assessment;
}

/** Current stored assessment, or null if user hasn't onboarded. */
export function getCurrentAssessment(): EngineAssessment | null {
  const p = storage.getProfile();
  if (!p) return null;
  return assess(p);
}

/** Simulate a change without saving — used by the what-if simulator. */
export function simulate(input: EngineInput): EngineAssessment {
  return assess(input);
}

export type { FinancialProfile, ScoreResult, RiskBand, ContributionDetail };
