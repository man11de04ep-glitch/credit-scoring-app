import type { FinancialProfile, ScoreResult } from "./scoring";

const ATTEMPTS_KEY = "smart-credit:attempts";
const PROFILE_KEY = "smart-credit:profile";
const GOAL_KEY = "smart-credit:goal";
const HABITS_KEY = "smart-credit:habits";
const USER_KEY = "smart-credit:user";

export type ScoreAttempt = {
  id: string;
  createdAt: string;
  profile: FinancialProfile;
  score: number;
  band: ScoreResult["band"];
};

export type Goal = {
  targetScore: number;
  byDate: string; // ISO
  createdAt: string;
};

export type Habit = {
  id: string;
  label: string;
  done: boolean;
};

export type StoredUser = {
  name: string;
  email: string;
  createdAt: string;
};

const safeParse = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
};

export const storage = {
  getAttempts: (): ScoreAttempt[] =>
    safeParse<ScoreAttempt[]>(localStorage.getItem(ATTEMPTS_KEY), []),
  saveAttempt: (attempt: ScoreAttempt) => {
    const all = storage.getAttempts();
    all.unshift(attempt);
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all.slice(0, 50)));
  },
  getProfile: (): FinancialProfile | null =>
    safeParse<FinancialProfile | null>(localStorage.getItem(PROFILE_KEY), null),
  saveProfile: (p: FinancialProfile) =>
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p)),

  getGoal: (): Goal | null =>
    safeParse<Goal | null>(localStorage.getItem(GOAL_KEY), null),
  saveGoal: (g: Goal) => localStorage.setItem(GOAL_KEY, JSON.stringify(g)),
  clearGoal: () => localStorage.removeItem(GOAL_KEY),

  getHabits: (): Habit[] =>
    safeParse<Habit[]>(localStorage.getItem(HABITS_KEY), DEFAULT_HABITS),
  saveHabits: (h: Habit[]) => localStorage.setItem(HABITS_KEY, JSON.stringify(h)),

  getUser: (): StoredUser | null =>
    safeParse<StoredUser | null>(localStorage.getItem(USER_KEY), null),
  saveUser: (u: StoredUser) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clearUser: () => localStorage.removeItem(USER_KEY),
};

export const DEFAULT_HABITS: Habit[] = [
  { id: "h1", label: "Pay mobile bill on time this month", done: false },
  { id: "h2", label: "Pay electricity bill on time this month", done: false },
  { id: "h3", label: "Move ₹1000+ to savings this week", done: false },
  { id: "h4", label: "Use UPI for at least 5 daily expenses", done: false },
  { id: "h5", label: "Review expenses every Sunday", done: false },
];
