"use client";

import { useState, useEffect, useMemo, type CSSProperties } from "react";
import Link from "next/link";
import { Wallet, TrendingUp, Settings, Award, Sparkles, DollarSign, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getDefaultWeek,
  computeBudgetBalance,
  DAILY_BUDGET,
  DEFAULT_DAY_LABELS,
  EXPENSE_CATEGORIES,
  type DayExpense,
} from "@/lib/finance-calculator";
import { STORAGE_KEY, ANALYSIS_STORAGE_KEY, CACHE_CLEARED_KEY } from "@/lib/storage-keys";
import { loadPoints } from "@/lib/points";

type Achievement = {
  points: number;
  label: string;
  summary: string;
};

const ACHIEVEMENTS: Achievement[] = [
  { points: 5, label: "Budget Aware", summary: "Log five days on budget." },
  { points: 10, label: "Saver Starter", summary: "Stay steady for ten points." },
  { points: 20, label: "Money Mindful", summary: "Build two strong budget weeks." },
  { points: 50, label: "Budget Pro", summary: "Hold the course long-term." },
  { points: 75, label: "Fiscal Champ", summary: "You're leading by example." },
  { points: 100, label: "Wealth Wise", summary: "Elite money habits unlocked." },
];

export default function DashboardPage() {
  const [days, setDays] = useState<DayExpense[]>(getDefaultWeek());
  const [budget, setBudget] = useState<number>(DAILY_BUDGET);
  const [mounted, setMounted] = useState(false);
  const [revealSections, setRevealSections] = useState(false);
  const [allTimePoints, setAllTimePoints] = useState(0);
  const [thisWeekPoints, setThisWeekPoints] = useState<number>(0);

  const unlockedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((a) => allTimePoints >= a.points),
    [allTimePoints]
  );
  const nextAchievement = useMemo(
    () => ACHIEVEMENTS.find((a) => a.points > allTimePoints),
    [allTimePoints]
  );
  const latestAchievement = unlockedAchievements[unlockedAchievements.length - 1];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as
          | (DayExpense)[]
          | { days: DayExpense[]; budget?: number };
        const parsed = Array.isArray(data) ? data : data.days;
        if (Array.isArray(parsed) && parsed.length === 7) {
          setDays(
            DEFAULT_DAY_LABELS.map((day, i) => ({
              day,
              spent: typeof parsed[i]?.spent === "number" ? parsed[i].spent : 0,
              category: parsed[i]?.category ?? "",
              note: parsed[i]?.note ?? "",
            }))
          );
        }
        if (!Array.isArray(data) && typeof data.budget === "number") {
          setBudget(Math.min(Math.max(10, data.budget), 1000));
        }
      }
      setAllTimePoints(loadPoints().totalPoints ?? 0);
    } catch {
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ days, budget }));
      setAllTimePoints(loadPoints().totalPoints ?? 0);
      if (typeof localStorage.getItem(CACHE_CLEARED_KEY) === "string") {
        localStorage.removeItem(CACHE_CLEARED_KEY);
        setDays(getDefaultWeek());
        setThisWeekPoints(0);
        return;
      }
      try {
        const raw = localStorage.getItem(ANALYSIS_STORAGE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as {
            overspend?: number;
            underspend?: number;
            points?: number;
            budget?: number;
          };
          const balance = computeBudgetBalance(days, budget);
          const overspendMatch = Math.abs((cached.overspend ?? 0) - balance.totalOverspend) < 0.01;
          const underspendMatch = Math.abs((cached.underspend ?? 0) - balance.totalUnderspend) < 0.01;
          const budgetMatch = Math.abs((cached.budget ?? DAILY_BUDGET) - budget) < 0.01;
          if (overspendMatch && underspendMatch && budgetMatch)
            setThisWeekPoints(Math.min(10, Math.max(0, cached.points ?? 0)));
          else setThisWeekPoints(0);
        } else setThisWeekPoints(0);
      } catch {
        setThisWeekPoints(0);
      }
    } catch {
    }
  }, [days, mounted, budget]);

  useEffect(() => {
    if (!mounted) return;
    const frame = window.requestAnimationFrame(() => setRevealSections(true));
    return () => window.cancelAnimationFrame(frame);
  }, [mounted]);

  const sectionClass = (extra?: string) =>
    ["reveal-section", revealSections ? "reveal-active" : "", extra].filter(Boolean).join(" ");

  const sectionDelay = (index: number): CSSProperties => ({ transitionDelay: `${index * 80}ms` });
  const rowDelay = (index: number): CSSProperties => ({ transitionDelay: `${index * 45 + 220}ms` });

  const handleBudgetChange = (value: string) => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) {
      setBudget(DAILY_BUDGET);
      return;
    }
    setBudget(Math.round(Math.min(Math.max(num, 10), 1000)));
  };

  const handleSpentChange = (index: number, value: string) => {
    const num = parseFloat(value);
    if (Number.isNaN(num) || num < 0) return;
    const next = [...days];
    next[index] = { ...next[index], spent: Math.min(9999, num) };
    setDays(next);
  };

  const handleCategoryChange = (index: number, category: string) => {
    const next = [...days];
    next[index] = { ...next[index], category };
    setDays(next);
  };

  const handleNoteChange = (index: number, note: string) => {
    const next = [...days];
    next[index] = { ...next[index], note };
    setDays(next);
  };

  const { totalOverspend, totalUnderspend, netBalance } = computeBudgetBalance(days, budget);

  return (
    <main className="dashboard-scroll min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 transition-colors dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-4xl px-6 py-16 sm:px-8 sm:py-20">
        <header
          className={sectionClass(
            "mb-12 flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:items-start sm:text-left"
          )}
          style={sectionDelay(0)}
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 px-6 py-3 shadow-md dark:from-emerald-900/40 dark:to-emerald-800/20 dark:shadow-lg">
              <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">FinWise</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
                Your Spending Dashboard
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                Log your daily spending and track your budget. Stay under your daily target and earn points for smart money habits.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:flex-row">
            <ThemeToggle />
            <Link href="/settings">
              <Button variant="outline" size="sm" className="gap-2 shadow-md hover:shadow-lg">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </header>

        <Card
          className={sectionClass(
            "card-glow mb-8 border-emerald-200/60 bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 dark:border-emerald-800/60 dark:from-emerald-900/30 dark:to-emerald-800/20"
          )}
          style={sectionDelay(1)}
        >
          <CardContent className="flex flex-wrap items-center justify-between gap-6 py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-200/60 p-2 dark:bg-emerald-800/60">
                <Award className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <span className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">Budget Points</span>
            </div>
            <div className="flex gap-8 text-base">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{thisWeekPoints}</div>
                <div className="text-sm text-emerald-700/80 dark:text-emerald-300/80">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">{allTimePoints}</div>
                <div className="text-sm text-emerald-700/80 dark:text-emerald-300/80">All Time</div>
              </div>
            </div>
            <div className="basis-full">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800/80 dark:text-emerald-200/80">
                  <Sparkles className="h-4 w-4" />
                  Milestones
                </div>
                <div className="text-xs text-emerald-700/70 dark:text-emerald-200/70">
                  {nextAchievement
                    ? `Next: ${nextAchievement.label} @ ${nextAchievement.points} pts`
                    : "All milestones unlocked!"}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {ACHIEVEMENTS.map((achievement) => {
                  const unlocked = allTimePoints >= achievement.points;
                  const isLatest = latestAchievement?.points === achievement.points;
                  return (
                    <div
                      key={achievement.points}
                      title={achievement.summary}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-all duration-200 ${
                        unlocked
                          ? "border-emerald-400/70 bg-emerald-100/70 text-emerald-900 shadow-sm dark:border-emerald-700/70 dark:bg-emerald-800/40 dark:text-emerald-100"
                          : "border-emerald-200/60 bg-white/70 text-emerald-700/60 dark:border-emerald-800/40 dark:bg-slate-900/40 dark:text-emerald-300/40"
                      } ${isLatest ? "ring-2 ring-emerald-400/60 ring-offset-2 dark:ring-offset-slate-900" : ""}`}
                    >
                      <span>{achievement.label}</span>
                      <span className="text-[11px] opacity-80">{achievement.points}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={sectionClass("rounded-3xl shadow-xl transition-all duration-300 dark:shadow-slate-900/40")}
          style={sectionDelay(2)}
        >
          <CardHeader className="pb-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-slate-100 p-2 dark:bg-slate-700">
                <DollarSign className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <CardTitle className="text-xl">Spending Log</CardTitle>
                <CardDescription className="text-base mt-1">
                  Set your daily budget and log each day&apos;s spending. Add categories and notes to track where your money goes.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 px-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <PiggyBank className="h-4 w-4 text-emerald-500" />
                Daily budget
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={10}
                  max={1000}
                  step={5}
                  value={budget}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  className="h-9 w-24 rounded-lg text-center text-sm"
                />
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  <div>dollars per day</div>
                  <div className="text-[11px]">range $10–$1000</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {days.map((d, i) => (
                <div
                  key={d.day}
                  className={sectionClass(
                    "rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/80 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/60 hover:shadow-lg dark:border-slate-600/60 dark:from-slate-800/80 dark:to-slate-900/60 dark:hover:border-slate-500/60"
                  )}
                  style={rowDelay(i)}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="w-10 shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {d.day}
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                        <Input
                          type="number"
                          min={0}
                          max={9999}
                          step={0.01}
                          value={d.spent || ""}
                          onChange={(e) => handleSpentChange(i, e.target.value)}
                          placeholder="0.00"
                          className="w-28 rounded-xl pl-7"
                        />
                      </div>
                    </div>
                    <select
                      value={d.category ?? ""}
                      onChange={(e) => handleCategoryChange(i, e.target.value)}
                      className="h-11 rounded-xl border border-slate-200/60 bg-white/80 px-3 text-sm text-slate-700 transition-colors focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 dark:border-slate-600/60 dark:bg-slate-800/80 dark:text-slate-100"
                    >
                      <option value="">Category</option>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <Input
                      type="text"
                      value={d.note ?? ""}
                      onChange={(e) => handleNoteChange(i, e.target.value)}
                      placeholder="Note"
                      className="w-32 rounded-xl text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div
              className={sectionClass(
                "rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/80 p-6 transition-all duration-500 dark:from-slate-800/50 dark:to-slate-700/30"
              )}
              style={sectionDelay(3)}
            >
              <div className="flex flex-wrap items-center justify-around gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">${totalOverspend.toFixed(2)}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Overspend</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">${totalUnderspend.toFixed(2)}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Underspend</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {netBalance >= 0 ? "+" : ""}${netBalance.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Net</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Overspend shows how much you went over your ${budget} daily budget. Underspend tracks the money you saved. Net is underspend minus overspend—keep it positive to build savings.
              </p>
            </div>
            <Link href="/analysis" className="block pt-4">
              <Button
                className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 text-base font-semibold py-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:brightness-105 focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                size="lg"
              >
                <TrendingUp className="h-5 w-5 mr-2" />
                Analyze My Budget
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div
          className={sectionClass("mt-12 text-center text-slate-600 transition-all duration-500 dark:text-slate-400 font-medium")}
          style={sectionDelay(4)}
        >
          <p className="text-base">
            The tracker finds the overspend — your AI coach decides the budget plan.
          </p>
        </div>
      </div>
    </main>
  );
}
