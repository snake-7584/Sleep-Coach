"use client";

import { useState, useEffect, useMemo, type CSSProperties } from "react";
import Link from "next/link";
import { Moon, Sunrise, BedDouble, Settings, Award, Sparkles, Gauge } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getDefaultSleepLog,
  computeSleepBalance,
  TARGET_SLEEP_HOURS,
  DEFAULT_DAY_LABELS,
  type SleepDay,
} from "@/lib/sleep-calculator";
import { STORAGE_KEY, ANALYSIS_STORAGE_KEY, CACHE_CLEARED_KEY } from "@/lib/storage-keys";
import { loadPoints } from "@/lib/points";
import { hoursBetweenBedAndWake, splitTime, combineTimeAmPm } from "@/lib/time-utils";

/** Per-row edit mode: editing hours (times greyed) or editing bed/wake (hours greyed). */
type RowEditMode = "hours" | "times";

/** Dashboard: log last 7 nights; hours and bed/wake linked; points; settings. */
type Achievement = {
  points: number;
  label: string;
  summary: string;
};

const ACHIEVEMENTS: Achievement[] = [
  { points: 5, label: "Consistency Spark", summary: "Log five solid nights." },
  { points: 10, label: "Rhythm Rising", summary: "Stay steady for ten points." },
  { points: 20, label: "Momentum Maker", summary: "Build two strong weeks." },
  { points: 50, label: "Sleep Champion", summary: "Hold the course long-term." },
  { points: 75, label: "Dream Chaser", summary: "You're leading by example." },
  { points: 100, label: "Rest Royalty", summary: "Elite rest habits unlocked." },
];

const sanitizeHourInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";
  let num = parseInt(digits, 10);
  if (Number.isNaN(num)) return "";
  num = Math.min(Math.max(num, 1), 12);
  return String(num);
};

const sanitizeMinuteInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 2);
  if (!digits) return "";
  let num = parseInt(digits, 10);
  if (Number.isNaN(num)) return "";
  num = Math.min(Math.max(num, 0), 59);
  const length = digits.length;
  return num.toString().padStart(length >= 2 ? 2 : length, "0");
};

const parseTimeParts = (time: string): { hour: string; minute: string } => {
  const [hour = "", minute = ""] = time.split(":");
  const trimmedHour = hour.trim();
  const trimmedMinute = minute.trim();
  let displayMinute = trimmedMinute;
  if (displayMinute.length === 2 && displayMinute.startsWith("0")) {
    const numeric = parseInt(displayMinute, 10);
    displayMinute = Number.isNaN(numeric) ? "" : numeric === 0 ? "00" : String(numeric);
  }
  return { hour: trimmedHour, minute: displayMinute };
};

const buildTimeFromParts = (hour: string, minute: string): string => {
  const cleanedHour = hour.trim();
  if (!cleanedHour) return "";
  const cleanedMinute = minute.trim();
  if (!cleanedMinute) return cleanedHour;
  return `${cleanedHour}:${cleanedMinute.padStart(2, "0")}`;
};

export default function DashboardPage() {
  const [days, setDays] = useState<SleepDay[]>(getDefaultSleepLog());
  const [targetHours, setTargetHours] = useState<number>(TARGET_SLEEP_HOURS);
  const [mounted, setMounted] = useState(false);
  const [revealSections, setRevealSections] = useState(false);
  /** Which field is editable per row: hours or bed/wake times. */
  const [editModeByDay, setEditModeByDay] = useState<RowEditMode[]>(() =>
    Array(7).fill("hours" as RowEditMode)
  );
  const [allTimePoints, setAllTimePoints] = useState(0);
  /** This week = AI coach credit from last analysis (or 0 after clear / no analysis). */
  const [thisWeekPoints, setThisWeekPoints] = useState<number>(0);

  const unlockedAchievements = useMemo(
    () => ACHIEVEMENTS.filter((achievement) => allTimePoints >= achievement.points),
    [allTimePoints]
  );
  const nextAchievement = useMemo(
    () => ACHIEVEMENTS.find((achievement) => achievement.points > allTimePoints),
    [allTimePoints]
  );
  const latestAchievement = unlockedAchievements[unlockedAchievements.length - 1];

  // Load from localStorage on mount (supports legacy shapes)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as
          | (SleepDay & { wakeTime?: string; bedtime?: string })[]
          | { days: SleepDay[]; targetHours?: number };
        const parsed = Array.isArray(data) ? data : data.days;

        if (Array.isArray(parsed) && parsed.length === 7) {
          setDays(
            DEFAULT_DAY_LABELS.map((day, i) => ({
              day,
              hours: typeof parsed[i]?.hours === "number" ? parsed[i].hours : TARGET_SLEEP_HOURS,
              wakeTime: parsed[i]?.wakeTime ?? "",
              bedtime: parsed[i]?.bedtime ?? "",
            }))
          );
        }

        if (!Array.isArray(data) && typeof data.targetHours === "number") {
          setTargetHours(Math.min(Math.max(4, data.targetHours), 12));
        }
      }

      setAllTimePoints(loadPoints().totalPoints ?? 0);
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  // Persist log; refresh all-time and this-week (from AI coach or 0 after clear)
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ days, targetHours }));
      setAllTimePoints(loadPoints().totalPoints ?? 0);
      if (typeof localStorage.getItem(CACHE_CLEARED_KEY) === "string") {
        localStorage.removeItem(CACHE_CLEARED_KEY);
        setDays(getDefaultSleepLog());
        setThisWeekPoints(0);
        return;
      }
      try {
        const raw = localStorage.getItem(ANALYSIS_STORAGE_KEY);
        if (raw) {
          const cached = JSON.parse(raw) as {
            debt?: number;
            credit?: number;
            points?: number;
            targetHours?: number;
          };
          const balance = computeSleepBalance(days, targetHours);
          const debtMatch = Math.abs((cached.debt ?? 0) - balance.totalDebt) < 0.01;
          const creditMatch = Math.abs((cached.credit ?? 0) - balance.totalCredit) < 0.01;
          const targetMatch = Math.abs((cached.targetHours ?? TARGET_SLEEP_HOURS) - targetHours) < 0.01;
          if (debtMatch && creditMatch && targetMatch)
            setThisWeekPoints(Math.min(10, Math.max(0, cached.points ?? 0)));
          else setThisWeekPoints(0);
        } else setThisWeekPoints(0);
      } catch {
        setThisWeekPoints(0);
      }
    } catch {
      // ignore
    }
  }, [days, mounted, targetHours]);

  useEffect(() => {
    if (!mounted) return;
    const frame = window.requestAnimationFrame(() => setRevealSections(true));
    return () => window.cancelAnimationFrame(frame);
  }, [mounted]);

  const sectionClass = (extra?: string) =>
    ["reveal-section", revealSections ? "reveal-active" : "", extra].filter(Boolean).join(" ");

  const sectionDelay = (index: number): CSSProperties => ({ transitionDelay: `${index * 80}ms` });

  const rowDelay = (index: number): CSSProperties => ({ transitionDelay: `${index * 45 + 220}ms` });

  const setEditMode = (index: number, mode: RowEditMode) => {
    setEditModeByDay((prev) => {
      const next = [...prev];
      next[index] = mode;
      return next;
    });
  };

  const handleTargetChange = (value: string) => {
    const num = parseFloat(value);
    if (Number.isNaN(num)) {
      setTargetHours(TARGET_SLEEP_HOURS);
      return;
    }
    const clamped = Math.min(Math.max(num, 4), 12);
    setTargetHours(Math.round(clamped * 2) / 2);
  };

  const handleHoursChange = (index: number, value: string) => {
    const num = parseFloat(value);
    if (Number.isNaN(num) || num < 0) return;
    const next = [...days];
    const updatedHours = Math.min(24, num);
    const current = next[index];
    const clearedTimes = current.wakeTime || current.bedtime;
    next[index] = {
      ...current,
      hours: updatedHours,
      wakeTime: clearedTimes ? undefined : current.wakeTime,
      bedtime: clearedTimes ? undefined : current.bedtime,
    };
    setDays(next);
  };

  const updateBedtime = (index: number, updates: { hour?: string; minute?: string; amPm?: "AM" | "PM" }) => {
    setDays((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      const current = next[index];
      const split = splitTime(current.bedtime ?? "");
      const parts = parseTimeParts(split.time);
      const hour = updates.hour !== undefined ? sanitizeHourInput(updates.hour) : parts.hour;
      const minute = updates.minute !== undefined ? sanitizeMinuteInput(updates.minute) : parts.minute;
      const amPm = updates.amPm ?? split.amPm;
      const combined = buildTimeFromParts(hour, minute);
      const bedtimeValue = combined ? combineTimeAmPm(combined, amPm) : "";
      const updatedDay = {
        ...current,
        bedtime: bedtimeValue || undefined,
      };
      const wake = updatedDay.wakeTime?.trim();
      if (bedtimeValue && wake) {
        const hrs = hoursBetweenBedAndWake(bedtimeValue, wake);
        if (hrs !== null) updatedDay.hours = hrs;
      }
      next[index] = updatedDay;
      return next;
    });
  };

  const updateWakeTime = (index: number, updates: { hour?: string; minute?: string; amPm?: "AM" | "PM" }) => {
    setDays((prev) => {
      if (!prev[index]) return prev;
      const next = [...prev];
      const current = next[index];
      const split = splitTime(current.wakeTime ?? "");
      const parts = parseTimeParts(split.time);
      const hour = updates.hour !== undefined ? sanitizeHourInput(updates.hour) : parts.hour;
      const minute = updates.minute !== undefined ? sanitizeMinuteInput(updates.minute) : parts.minute;
      const amPm = updates.amPm ?? split.amPm;
      const combined = buildTimeFromParts(hour, minute);
      const wakeValue = combined ? combineTimeAmPm(combined, amPm) : "";
      const updatedDay = {
        ...current,
        wakeTime: wakeValue || undefined,
      };
      const bed = updatedDay.bedtime?.trim();
      if (wakeValue && bed) {
        const hrs = hoursBetweenBedAndWake(bed, wakeValue);
        if (hrs !== null) updatedDay.hours = hrs;
      }
      next[index] = updatedDay;
      return next;
    });
  };

  const { totalDebt, totalCredit, netBalance } = computeSleepBalance(days, targetHours);

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
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-100 to-amber-50 px-6 py-3 shadow-md dark:from-amber-900/40 dark:to-amber-800/20 dark:shadow-lg">
              <Moon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Sleep Coach</span>
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
                Your Sleep Dashboard
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">
                Log your last 7 nights—bed/wake times automatically calculate hours. Build healthy sleep habits and earn points.
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

        {/* Points: this week + all-time */}
        <Card
          className={sectionClass(
            "card-glow mb-8 border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-amber-100/60 dark:border-amber-800/60 dark:from-amber-900/30 dark:to-amber-800/20"
          )}
          style={sectionDelay(1)}
        >
          <CardContent className="flex flex-wrap items-center justify-between gap-6 py-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-200/60 p-2 dark:bg-amber-800/60">
                <Award className="h-6 w-6 text-amber-700 dark:text-amber-300" />
              </div>
              <span className="text-lg font-semibold text-amber-900 dark:text-amber-100">Sleep Points</span>
            </div>
            <div className="flex gap-8 text-base">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">{thisWeekPoints}</div>
                <div className="text-sm text-amber-700/80 dark:text-amber-300/80">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-800 dark:text-amber-200">{allTimePoints}</div>
                <div className="text-sm text-amber-700/80 dark:text-amber-300/80">All Time</div>
              </div>
            </div>
            <div className="basis-full">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-amber-800/80 dark:text-amber-200/80">
                  <Sparkles className="h-4 w-4" />
                  Milestones
                </div>
                <div className="text-xs text-amber-700/70 dark:text-amber-200/70">
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
                          ? "border-amber-400/70 bg-amber-100/70 text-amber-900 shadow-sm dark:border-amber-700/70 dark:bg-amber-800/40 dark:text-amber-100"
                          : "border-amber-200/60 bg-white/70 text-amber-700/60 dark:border-amber-800/40 dark:bg-slate-900/40 dark:text-amber-300/40"
                      } ${isLatest ? "ring-2 ring-amber-400/60 ring-offset-2 dark:ring-offset-slate-900" : ""}`}
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
                <Moon className="h-5 w-5 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <CardTitle className="text-xl">Sleep Log</CardTitle>
                <CardDescription className="text-base mt-1">
                  Set your nightly target and log each day. When both times are set, hours update automatically.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8 px-6">
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Gauge className="h-4 w-4 text-amber-500" />
                Sleep target
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={4}
                  max={12}
                  step={0.5}
                  value={targetHours}
                  onChange={(e) => handleTargetChange(e.target.value)}
                  className="h-9 w-20 rounded-lg text-center text-sm"
                />
                <div className="text-right text-xs text-slate-500 dark:text-slate-400">
                  <div>hours per night</div>
                  <div className="text-[11px]">range 4–12 • step 0.5</div>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              {days.map((d, i) => {
                const mode = editModeByDay[i] ?? "hours";
                const bedSplit = splitTime(d.bedtime ?? "");
                const wakeSplit = splitTime(d.wakeTime ?? "");
                const bedParts = parseTimeParts(bedSplit.time);
                const wakeParts = parseTimeParts(wakeSplit.time);
                return (
                  <div
                    key={d.day}
                    className={sectionClass(
                      "rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/80 p-6 shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-300/60 hover:shadow-lg dark:border-slate-600/60 dark:from-slate-800/80 dark:to-slate-900/60 dark:hover:border-slate-500/60"
                    )}
                    style={rowDelay(i)}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <label className="w-10 shrink-0 text-sm font-medium text-slate-700 dark:text-slate-300">
                        {d.day}
                      </label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={24}
                          step={0.5}
                          value={d.hours}
                          onChange={(e) => handleHoursChange(i, e.target.value)}
                          onFocus={() => setEditMode(i, "hours")}
                          readOnly={mode === "times"}
                          className={`w-20 rounded-xl ${mode === "times" ? "cursor-pointer opacity-60" : ""}`}
                        />
                        <span className="text-xs text-slate-500 dark:text-slate-400">hrs</span>
                      </div>
                    </div>
                    {/* Bed first, then Wake; grey when mode is 'hours'; click to switch to 'times' */}
                    <div className="flex flex-wrap items-center gap-3 pl-[2.5rem]">
                      <div className="flex items-center gap-2">
                        <BedDouble className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="hh"
                            value={bedParts.hour}
                            onChange={(e) => updateBedtime(i, { hour: e.target.value })}
                            onFocus={() => setEditMode(i, "times")}
                            readOnly={mode === "hours"}
                            className={`h-8 w-12 rounded-lg px-2 text-center text-sm ${mode === "hours" ? "cursor-pointer opacity-60" : ""}`}
                          />
                          <span className="px-1 text-sm text-slate-400 dark:text-slate-500">:</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="mm"
                            value={bedParts.minute}
                            onChange={(e) => updateBedtime(i, { minute: e.target.value })}
                            onFocus={() => setEditMode(i, "times")}
                            readOnly={mode === "hours"}
                            className={`h-8 w-12 rounded-lg px-2 text-center text-sm ${mode === "hours" ? "cursor-pointer opacity-60" : ""}`}
                          />
                          <select
                            value={bedSplit.amPm}
                            onChange={(e) =>
                              updateBedtime(i, { amPm: e.target.value as "AM" | "PM" })
                            }
                            onFocus={() => setEditMode(i, "times")}
                            disabled={mode === "hours"}
                            className={`h-8 min-w-[4rem] rounded-lg border border-slate-200 bg-white px-2 text-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-amber-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${mode === "hours" ? "cursor-pointer opacity-60" : ""}`}
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sunrise className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                        <div className="flex items-center gap-1">
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="hh"
                            value={wakeParts.hour}
                            onChange={(e) => updateWakeTime(i, { hour: e.target.value })}
                            onFocus={() => setEditMode(i, "times")}
                            readOnly={mode === "hours"}
                            className={`h-8 w-12 rounded-lg px-2 text-center text-sm ${mode === "hours" ? "cursor-pointer opacity-60" : ""}`}
                          />
                          <span className="px-1 text-sm text-slate-400 dark:text-slate-500">:</span>
                          <Input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            placeholder="mm"
                            value={wakeParts.minute}
                            onChange={(e) => updateWakeTime(i, { minute: e.target.value })}
                            onFocus={() => setEditMode(i, "times")}
                            readOnly={mode === "hours"}
                            className={`h-8 w-12 rounded-lg px-2 text-center text-sm ${mode === "hours" ? "cursor-pointer opacity-60" : ""}`}
                          />
                          <select
                            value={wakeSplit.amPm}
                            onChange={(e) =>
                              updateWakeTime(i, { amPm: e.target.value as "AM" | "PM" })
                            }
                            onFocus={() => setEditMode(i, "times")}
                            disabled={mode === "hours"}
                            className={`h-8 min-w-[4rem] rounded-lg border border-slate-200 bg-white px-2 text-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-amber-400/40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 ${mode === "hours" ? "cursor-pointer opacity-60" : ""}`}
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className={sectionClass(
                "rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/80 p-6 transition-all duration-500 dark:from-slate-800/50 dark:to-slate-700/30"
              )}
              style={sectionDelay(3)}
            >
              <div className="flex flex-wrap items-center justify-around gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600 dark:text-red-400">{totalDebt.toFixed(1)}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Debt hrs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{totalCredit.toFixed(1)}</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Credit hrs</div>
                </div>
                <div className="text-center">
                  <div className={`text-lg font-bold ${netBalance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {netBalance >= 0 ? "+" : ""}{netBalance.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Net hrs</div>
                </div>
              </div>
              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Debt shows how many hours you fell short of your {targetHours}-hour goal. Credit tracks the extra rest you banked. Net is credit minus debt—keep it positive to move toward recovery.
              </p>
            </div>
            <Link href="/analysis" className="block pt-4">
              <Button
                className="w-full rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 text-base font-semibold py-4 shadow-lg transition-all duration-300 hover:shadow-xl hover:brightness-105 focus-visible:ring-2 focus-visible:ring-amber-400/70"
                size="lg"
              >
                <Moon className="h-5 w-5 mr-2" />
                Analyze My Sleep
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div
          className={sectionClass("mt-12 text-center text-slate-600 transition-all duration-500 dark:text-slate-400 font-medium")}
          style={sectionDelay(4)}
        >
          <p className="text-base">
            🌙 The calculator finds the debt — your AI coach decides the recovery.
          </p>
        </div>
      </div>
    </main>
  );
}
