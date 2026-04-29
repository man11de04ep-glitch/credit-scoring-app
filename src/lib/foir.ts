// FOIR (Fixed Obligation to Income Ratio) consultant engine.
// Risk-band scaled limits: high → 30%, medium → 40%, low → 45%.
// Uses an indicative annual interest rate to convert max EMI ↔ principal.

import type { FinancialProfile, RiskBand } from "./scoring";

/** Annual interest rate (indicative) used for affordability math. */
export const INDICATIVE_ANNUAL_RATE = 0.12; // 12% p.a.

export const FOIR_BY_BAND: Record<RiskBand, number> = {
  low: 0.45,
  medium: 0.40,
  high: 0.30,
};

export type FoirAnalysis = {
  foirCap: number;             // 0..1 — risk-adjusted FOIR limit
  maxEmi: number;              // INR — maximum sustainable EMI
  maxPrincipal: number;        // INR — max safe loan at that EMI for chosen tenure
  requestedAmount: number;     // INR — what the user asked for
  requestedEmi: number;        // INR — EMI for the requested amount
  requestedFoir: number;       // 0..1 — requestedEmi / income
  isSustainable: boolean;      // true when requested ≤ max
  shortfall: number;           // INR — how much the request exceeds max safe
  alternativeAmount: number;   // INR — "Satisfying Alternative" suggestion
  alternativeEmi: number;      // INR — EMI for the alternative
  tenureMonths: number;        // chosen tenure (echo)
  annualRate: number;          // rate used for math
  verdict: "sustainable" | "stretch" | "unsustainable";
  headlineKey: "foir.headline.sustainable" | "foir.headline.stretch" | "foir.headline.unsustainable";
  reasonKey:
    | "foir.reason.sustainable"
    | "foir.reason.stretch"
    | "foir.reason.unsustainable";
};

/** Standard EMI formula. Returns 0 if principal/tenure invalid. */
export function emiFor(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  if (annualRate === 0) return principal / months;
  const r = annualRate / 12;
  const pow = Math.pow(1 + r, months);
  return (principal * r * pow) / (pow - 1);
}

/** Reverse: max principal that can be repaid at given EMI for tenure. */
export function principalFor(emi: number, annualRate: number, months: number): number {
  if (emi <= 0 || months <= 0) return 0;
  if (annualRate === 0) return emi * months;
  const r = annualRate / 12;
  const pow = Math.pow(1 + r, months);
  return (emi * (pow - 1)) / (r * pow);
}

/** Round down to a clean, satisfying figure (nearest 10k for ≥1L, 5k for ≥25k, else 1k). */
export function friendlyRoundDown(amount: number): number {
  if (amount <= 0) return 0;
  const step = amount >= 100000 ? 10000 : amount >= 25000 ? 5000 : 1000;
  return Math.max(step, Math.floor(amount / step) * step);
}

export function analyzeFoir(
  profile: FinancialProfile,
  band: RiskBand,
  annualRate = INDICATIVE_ANNUAL_RATE,
): FoirAnalysis {
  const income = Math.max(0, profile.monthlyIncome);
  const tenureMonths = Math.max(1, profile.loanTenureMonths);
  const requestedAmount = Math.max(0, profile.desiredLoanAmount);
  const foirCap = FOIR_BY_BAND[band];

  const maxEmi = Math.max(0, income * foirCap);
  const maxPrincipal = Math.floor(principalFor(maxEmi, annualRate, tenureMonths));
  const requestedEmi = emiFor(requestedAmount, annualRate, tenureMonths);
  const requestedFoir = income > 0 ? requestedEmi / income : 1;

  const isSustainable = requestedAmount > 0 && requestedAmount <= maxPrincipal;
  const shortfall = Math.max(0, requestedAmount - maxPrincipal);

  // Satisfying Alternative — friendly rounded-down figure at ~95% of max.
  const altRaw = maxPrincipal * 0.95;
  const alternativeAmount = isSustainable
    ? friendlyRoundDown(requestedAmount)
    : friendlyRoundDown(altRaw);
  const alternativeEmi = emiFor(alternativeAmount, annualRate, tenureMonths);

  let verdict: FoirAnalysis["verdict"];
  let headlineKey: FoirAnalysis["headlineKey"];
  let reasonKey: FoirAnalysis["reasonKey"];

  if (isSustainable) {
    verdict = "sustainable";
    headlineKey = "foir.headline.sustainable";
    reasonKey = "foir.reason.sustainable";
  } else if (requestedFoir <= foirCap + 0.1) {
    verdict = "stretch";
    headlineKey = "foir.headline.stretch";
    reasonKey = "foir.reason.stretch";
  } else {
    verdict = "unsustainable";
    headlineKey = "foir.headline.unsustainable";
    reasonKey = "foir.reason.unsustainable";
  }

  return {
    foirCap,
    maxEmi: Math.round(maxEmi),
    maxPrincipal,
    requestedAmount,
    requestedEmi: Math.round(requestedEmi),
    requestedFoir,
    isSustainable,
    shortfall,
    alternativeAmount,
    alternativeEmi: Math.round(alternativeEmi),
    tenureMonths,
    annualRate,
    verdict,
    headlineKey,
    reasonKey,
  };
}
