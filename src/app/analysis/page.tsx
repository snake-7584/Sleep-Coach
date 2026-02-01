"use client";

import {
  Fragment,
  useState,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { Moon, Brain, ArrowLeft, MessageCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
  type TooltipProps,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  computeSleepBalance,
  TARGET_SLEEP_HOURS,
  DEFAULT_DAY_LABELS,
  getTypicalWakeTime,
  getTypicalBedtime,
  getDefaultSleepLog,
  type SleepDay,
} from "@/lib/sleep-calculator";
import { STORAGE_KEY, ANALYSIS_STORAGE_KEY, CACHE_CLEARED_KEY } from "@/lib/storage-keys";
import { addPointsForWeekIfNew } from "@/lib/points";
import {
  loadWeekHistory,
  getPreviousWeeksSummary,
  appendWeek,
} from "@/lib/week-history";
import { hoursBetweenBedAndWake } from "@/lib/time-utils";

/** Stored log shape: { days, typicalWake?, typicalBedtime?, targetHours? } */
type StoredLog = { days: SleepDay[]; typicalWake?: string; typicalBedtime?: string; targetHours?: number };

/** Cached analysis shape: plan + points (from AI) + metadata for cache invalidation */
type CachedAnalysis = {
  plan: string;
  points?: number;
  debt: number;
  credit: number;
  wakeTime: string;
  bedtime?: string;
  constraints: string;
  targetHours?: number;
};

type BalanceResult = ReturnType<typeof computeSleepBalance>;

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type SleepTooltipPayload = {
  value: number;
  name: string;
};

function SleepTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0] as SleepTooltipPayload | undefined;
  if (!point || typeof point.value !== "number") return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/85">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">{point.value} hrs</p>
    </div>
  );
}

function renderChatContent(content: string): ReactNode {
  const trimmed = content.trim();
  if (!trimmed) return null;

  const blocks = trimmed.split(/\n{2,}/);
  return blocks.map((block, blockIndex) => {
    const lines = block
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return null;
    }

    const bulletLines = lines.every((line) => /^[-*•]\s+/.test(line));
    if (bulletLines) {
      return (
        <ul key={`chat-block-${blockIndex}`} className="ml-4 list-disc space-y-1 text-left">
          {lines.map((line, lineIndex) => (
            <li key={`chat-block-${blockIndex}-line-${lineIndex}`}>
              {line.replace(/^[-*•]\s+/, "")}
            </li>
          ))}
        </ul>
      );
    }

    const numberedLines = lines.every((line) => /^\d+[\.)]\s+/.test(line));
    if (numberedLines) {
      const startMatch = lines[0].match(/^(\d+)/);
      const start = startMatch ? parseInt(startMatch[1] ?? "1", 10) : 1;
      return (
        <ol key={`chat-block-${blockIndex}`} className="ml-4 list-decimal space-y-1 text-left" start={start}>
          {lines.map((line, lineIndex) => (
            <li key={`chat-block-${blockIndex}-line-${lineIndex}`}>
              {line.replace(/^\d+[\.)]\s+/, "")}
            </li>
          ))}
        </ol>
      );
    }

    return (
      <p key={`chat-block-${blockIndex}`} className="text-left">
        {lines.map((line, lineIndex) => (
          <Fragment key={`chat-block-${blockIndex}-fragment-${lineIndex}`}>
            {line}
            {lineIndex < lines.length - 1 ? <br /> : null}
          </Fragment>
        ))}
      </p>
    );
  });
}

/**
 * Analysis page: shows Sleep Balance, Weekly chart, and AI Recovery Plan.
 * Loads 7-day log from localStorage; calls /api/analyze once (or uses cache).
 */
export default function AnalysisPage() {
  const [days, setDays] = useState<SleepDay[]>([]);
  const [typicalWake, setTypicalWake] = useState<string | undefined>(undefined);
  const [typicalBedtime, setTypicalBedtime] = useState<string | undefined>(undefined);
  const [plan, setPlan] = useState<string | null>(null);
  const [planVisible, setPlanVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [revealSections, setRevealSections] = useState(false);
  const [targetHours, setTargetHours] = useState<number>(TARGET_SLEEP_HOURS);
  const [planPoints, setPlanPoints] = useState<number | undefined>(undefined);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);

  const balance = useMemo(
    () => (days.length === 7 ? computeSleepBalance(days, targetHours) : null),
    [days, targetHours]
  );

  const { sanitizedDays, timingNote, hasMismatch } = useMemo<{
    sanitizedDays: BalanceResult["days"];
    timingNote?: string;
    hasMismatch: boolean;
  }>(() => {
    if (!balance) {
      return {
        sanitizedDays: [] as BalanceResult["days"],
        timingNote: undefined,
        hasMismatch: false,
      };
    }

    const mismatches: string[] = [];
    const formatList = (values: string[]): string => {
      if (values.length <= 1) return values[0] ?? "";
      if (values.length === 2) return `${values[0]} and ${values[1]}`;
      return `${values.slice(0, -1).join(", ")}, and ${values[values.length - 1]}`;
    };

    const sanitized = balance.days.map((d) => {
      if (d.bedtime?.trim() && d.wakeTime?.trim()) {
        const derived = hoursBetweenBedAndWake(d.bedtime.trim(), d.wakeTime.trim());
        if (derived !== null && Math.abs(derived - d.hours) > 0.25) {
          mismatches.push(d.day);
          return { ...d, bedtime: undefined, wakeTime: undefined };
        }
      }
      return d;
    }) as BalanceResult["days"];

    const note = mismatches.length
      ? `Hours override the logged bed/wake times for ${formatList(mismatches)}. Use the recorded hours for accuracy.`
      : undefined;

    return { sanitizedDays: sanitized, timingNote: note, hasMismatch: mismatches.length > 0 };
  }, [balance]);

  const chatReadyDays = useMemo(
    () =>
      sanitizedDays.map(({ day, hours, debt, credit }) => ({
        day,
        hours,
        debt,
        credit,
      })),
    [sanitizedDays]
  );

  useEffect(() => {
    if (!chatListRef.current) return;
    chatListRef.current.scrollTo({ top: chatListRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages.length]);

  // Load log from localStorage on mount (supports { days, typicalWake } or legacy array)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setMounted(true);
        return;
      }
      const data = JSON.parse(raw) as SleepDay[] | StoredLog;
      const parsed = Array.isArray(data) ? data : data.days;

      if (!Array.isArray(parsed) || parsed.length !== 7) {
        setMounted(true);
        return;
      }

      setDays(
        DEFAULT_DAY_LABELS.map((day, i) => ({
          day,
          hours:
            typeof parsed[i]?.hours === "number" ? parsed[i].hours : TARGET_SLEEP_HOURS,
          wakeTime: parsed[i]?.wakeTime,
          bedtime: parsed[i]?.bedtime,
        }))
      );

      if (!Array.isArray(data)) {
        setTypicalWake(data.typicalWake ?? getTypicalWakeTime(parsed as SleepDay[]) ?? undefined);
        setTypicalBedtime(data.typicalBedtime ?? getTypicalBedtime(parsed as SleepDay[]) ?? undefined);
        if (typeof data.targetHours === "number") {
          setTargetHours(Math.min(Math.max(4, data.targetHours), 12));
        }
      } else {
        setTypicalWake(getTypicalWakeTime(parsed as SleepDay[]) ?? undefined);
        setTypicalBedtime(getTypicalBedtime(parsed as SleepDay[]) ?? undefined);
      }
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const frame = window.requestAnimationFrame(() => setRevealSections(true));
    return () => window.cancelAnimationFrame(frame);
  }, [mounted]);

  useEffect(() => {
    if (!plan) {
      setPlanVisible(false);
      return;
    }
    setPlanVisible(false);
    const frame = window.requestAnimationFrame(() => setPlanVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [plan]);

  useEffect(() => {
    if (!plan || !balance) return;
    if (chatMessages.length > 0) return;
    const net = balance.netBalance;
    const netAbs = Math.abs(net).toFixed(1);
    const debtPhrase = net < 0 ? `${netAbs} hour${netAbs === "1.0" ? "" : "s"} of sleep debt` : `${netAbs} hour${netAbs === "1.0" ? "" : "s"} of extra rest`;
    const tone =
      net < 0
        ? `You picked up ${debtPhrase} this week, but we can plan a gentle rebound.`
        : net > 0
          ? `You banked ${debtPhrase} — nice work keeping a steady rhythm.`
          : "You landed right on target this week, which is a great baseline to build from.";
    const opener = `Hey, I'm your Sleep Coach. ${tone} Ask me anything about the plan or how to adapt it to your schedule.`;
    setChatMessages([{ role: "assistant", content: opener }]);
  }, [plan, balance, chatMessages.length]);

  const sendChatMessage = async () => {
    if (!plan || !balance) return;
    if (sanitizedDays.length !== 7) return;
    if (chatLoading) return;
    const trimmed = chatInput.trim();
    if (!trimmed) return;

    const userMessage: ChatMessage = { role: "user", content: trimmed };
    const optimisticMessages = [...chatMessages, userMessage];
    setChatMessages(optimisticMessages);
    setChatInput("");
    setChatError(null);
    setChatLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: optimisticMessages,
          sleepLog: chatReadyDays,
          totals: {
            debt: balance.totalDebt,
            credit: balance.totalCredit,
            net: balance.netBalance,
          },
          plan,
          points: planPoints,
          timingNote,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { message?: string; error?: string; details?: string }
        | null;

      if (!response.ok) {
        const detail = data?.details ?? data?.error ?? `Coach error (${response.status})`;
        throw new Error(detail);
      }

      const reply = data?.message?.trim();
      if (!reply) {
        throw new Error(data?.error ?? "The coach didn't send a reply. Try again in a moment.");
      }

      const minDelay = 450;
      const maxDelay = 1050;
      const jitter = Math.random() * (maxDelay - minDelay) + minDelay;
      await new Promise((resolve) => setTimeout(resolve, jitter));

      setChatMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Coach chat failed. Please try again.";
      setChatError(message);
      setChatInput((current) => current || trimmed);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendChatMessage();
    }
  };

  // When mounted and we have balance: try cache, else call API once
  useEffect(() => {
    if (!mounted || !balance) return;

    const trimmedWake = typicalWake?.trim() ?? "";
    const trimmedBed = typicalBedtime?.trim() ?? "";
    const dailyWakeTimes = sanitizedDays
      .map((d) => d.wakeTime?.trim())
      .filter((value): value is string => Boolean(value));
    const dailyBedTimes = sanitizedDays
      .map((d) => d.bedtime?.trim())
      .filter((value): value is string => Boolean(value));

    const wakeHasDaily = dailyWakeTimes.length > 0;
    const bedHasDaily = dailyBedTimes.length > 0;
    const wakeSingleValue = new Set(dailyWakeTimes).size <= 1;
    const bedSingleValue = new Set(dailyBedTimes).size <= 1;
    const wakeAlignsTypical = !trimmedWake || !wakeHasDaily || dailyWakeTimes.every((t) => t === trimmedWake);
    const bedAlignsTypical = !trimmedBed || !bedHasDaily || dailyBedTimes.every((t) => t === trimmedBed);
    const wakeIsConsistent = (!wakeHasDaily && Boolean(trimmedWake)) || (wakeHasDaily && wakeSingleValue && wakeAlignsTypical);
    const bedIsConsistent = (!bedHasDaily && Boolean(trimmedBed)) || (bedHasDaily && bedSingleValue && bedAlignsTypical);

    const overrideLabel = hasMismatch ? "Hours override logged times" : undefined;
    const wakeDisplay =
      overrideLabel ??
      (wakeHasDaily
        ? wakeIsConsistent
          ? dailyWakeTimes[0]
          : "Varies by day"
        : trimmedWake || "Not specified");
    const bedDisplay =
      overrideLabel ??
      (bedHasDaily
        ? bedIsConsistent
          ? dailyBedTimes[0]
          : "Varies by day"
        : trimmedBed || "Not specified");
    const wakeForRequest = !hasMismatch && wakeIsConsistent ? wakeDisplay : undefined;
    const bedForRequest = !hasMismatch && bedIsConsistent ? bedDisplay : undefined;
    const history = loadWeekHistory();
    const isFirstWeek = history.length === 0;
    const previousWeeks = getPreviousWeeksSummary(2);

    // Try to use cached analysis if debt/credit match
    try {
      const cachedRaw = localStorage.getItem(ANALYSIS_STORAGE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as CachedAnalysis;
        const debtMatch = Math.abs((cached.debt ?? 0) - balance.totalDebt) < 0.01;
        const creditMatch = Math.abs((cached.credit ?? 0) - balance.totalCredit) < 0.01;
        const targetMatch = Math.abs((cached.targetHours ?? targetHours) - targetHours) < 0.01;
        if (typeof cached.plan === "string" && debtMatch && creditMatch && targetMatch) {
          setPlan(cached.plan);
          setPlanPoints(typeof cached.points === "number" ? cached.points : undefined);
          setChatMessages([]);
          setChatError(null);
          addPointsForWeekIfNew(sanitizedDays, cached.points, balance.totalDebt, targetHours);
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ days: getDefaultSleepLog(), targetHours })
            );
            localStorage.setItem(CACHE_CLEARED_KEY, "1");
          } catch {
            // ignore
          }
          return;
        }
      }
    } catch {
      // ignore
    }

    // No cache hit: call API once
    if (plan !== null || loading || error) return;

    setLoading(true);
    setError(null);

    const payload: Record<string, unknown> = {
      sleepLog: sanitizedDays,
      debt: balance.totalDebt,
      credit: balance.totalCredit,
      constraints: "Work/school weekdays; flexible on weekends",
      isFirstWeek,
      previousWeeks,
      targetHours,
    };

    if (wakeForRequest && wakeForRequest !== "Not specified") {
      payload.wakeTime = wakeForRequest;
    }
    if (bedForRequest && bedForRequest !== "Not specified") {
      payload.bedtime = bedForRequest;
    }
    if (timingNote) {
      payload.timingNote = timingNote;
    }

    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) {
          return res
            .json()
            .then((d: { error?: string; details?: string }) =>
              Promise.reject({ error: d.error, details: d.details })
            );
        }
        return res.json();
      })
      .then((data: { plan: string; points?: number }) => {
        const planText = data.plan ?? "";
        const pointsFromAI = data.points;
        setPlan(planText);
        setPlanPoints(pointsFromAI ?? undefined);
        setChatMessages([]);
        setChatError(null);
        try {
          localStorage.setItem(
            ANALYSIS_STORAGE_KEY,
            JSON.stringify({
              plan: planText,
              points: pointsFromAI,
              debt: balance.totalDebt,
              credit: balance.totalCredit,
              wakeTime: wakeDisplay,
              bedtime: bedDisplay,
              constraints: "Work/school weekdays; flexible on weekends",
              targetHours,
            } as CachedAnalysis)
          );
          addPointsForWeekIfNew(sanitizedDays, pointsFromAI, balance.totalDebt, targetHours);
          appendWeek({
            days: sanitizedDays,
            totalDebt: balance.totalDebt,
            totalCredit: balance.totalCredit,
            netBalance: balance.netBalance,
            plan: planText,
            points: pointsFromAI ?? 0,
            typicalWake: wakeDisplay,
            typicalBedtime: bedDisplay,
            targetHours,
          });
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ days: getDefaultSleepLog(), targetHours })
          );
          localStorage.setItem(CACHE_CLEARED_KEY, "1");
        } catch {
          // ignore
        }
      })
      .catch((e: { error?: string; details?: string } | Error) => {
        const msg =
          e && typeof e === "object" && "details" in e
            ? (e.details ?? e.error ?? "Analysis failed")
            : e instanceof Error
              ? e.message
              : "Analysis failed";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [mounted, balance, plan, loading, error, typicalWake, typicalBedtime, sanitizedDays, timingNote, hasMismatch, targetHours]);

  const showChat = Boolean(plan && !loading);
  const chatDisabled = chatLoading || chatInput.trim().length === 0;

  const chartData = useMemo(
    () =>
      balance?.days.map((d) => ({
        day: d.day,
        hours: d.hours,
      })) ?? [],
    [balance]
  );
  const chartYMax = useMemo(() => {
    const values = chartData.map((d) => d.hours);
    const maxHours = values.length > 0 ? Math.max(...values, targetHours + 2) : targetHours + 2;
    return Math.max(10, Math.ceil(maxHours + 1));
  }, [chartData, targetHours]);

  const sectionClass = (extra?: string) =>
    ["reveal-section", revealSections ? "reveal-active" : "", extra].filter(Boolean).join(" ");

  const sectionDelay = (index: number): CSSProperties => ({ transitionDelay: `${index * 90}ms` });

  const planDelay = (index: number): CSSProperties => ({ transitionDelay: `${index * 70 + 260}ms` });

  // Loading state (before hydration / storage read)
  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Loading…</p>
      </main>
    );
  }

  // No data: redirect user to dashboard
  if (days.length !== 7) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">
          No sleep data. Log your last 7 nights first.
        </p>
        <Link href="/">
          <Button>Go to Dashboard</Button>
        </Link>
      </main>
    );
  }

  const netBalance = balance!.netBalance;
  const isDebt = netBalance < 0;
  const balanceLabel = `${isDebt ? "" : "+"}${netBalance.toFixed(1)} hrs`;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100 transition-colors dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <div className="mx-auto max-w-4xl px-6 py-12 sm:px-8 sm:py-16">
        <header
          className={sectionClass("mb-12 flex flex-wrap items-center justify-between gap-6")}
          style={sectionDelay(0)}
        >
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-base font-medium text-slate-600 transition-all duration-200 hover:text-slate-900 hover:gap-4 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-100 to-amber-50 px-4 py-2 shadow-md dark:from-amber-900/40 dark:to-amber-800/20 dark:shadow-lg">
              <Moon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-800 dark:text-amber-200">Sleep Coach</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* 1. Sleep Balance — computed totals; color by debt vs credit */}
        <Card
          className={sectionClass(
            `mb-10 rounded-3xl shadow-xl transition-all duration-300 ${isDebt ? 'border-red-200/60 dark:border-red-800/60' : 'border-emerald-200/60 dark:border-emerald-800/60'}`
          )}
          style={sectionDelay(1)}
        >
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${isDebt ? 'bg-red-100 dark:bg-red-800/30' : 'bg-emerald-100 dark:bg-emerald-800/30'}`}>
                <Moon className={`h-6 w-6 ${isDebt ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
              </div>
              <div>
                <CardTitle className="text-xl">Sleep Balance</CardTitle>
                <CardDescription className="text-base mt-1">Net over the last 7 days (credit − debt)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <div className="space-y-4">
              <p
                className={`text-5xl font-bold tracking-tight sm:text-6xl ${
                  isDebt ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {balanceLabel}
              </p>
              <div className="flex gap-8 text-base">
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600 dark:text-red-400">{balance!.totalDebt.toFixed(1)}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Debt hrs</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">{balance!.totalCredit.toFixed(1)}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Credit hrs</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Weekly Sleep — Recharts bar chart, 8hr reference line */}
        <Card
          className={sectionClass("mb-10 rounded-3xl shadow-xl transition-all duration-300")}
          style={sectionDelay(2)}
        >
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-700">
                <Moon className="h-6 w-6 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <CardTitle className="text-xl">Weekly Sleep</CardTitle>
                <CardDescription className="text-base mt-1">
                  Hours per night (goal {targetHours} hrs)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 12, left: 8, bottom: 12 }}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 13 }}
                  />
                  <YAxis
                    domain={[0, chartYMax]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 13 }}
                    width={32}
                  />
                                  <ReferenceLine
                                    y={targetHours}
                                    stroke="#94a3b8"
                                    strokeDasharray="4 4"
                                    strokeWidth={1.5}
                                  />
                                  <Tooltip
                                    cursor={{ fill: "rgba(148, 163, 184, 0.18)", radius: 12 }}
                                    wrapperStyle={{ margin: 0 }}
                                    content={<SleepTooltip />}
                                  />
                  <Bar
                    dataKey="hours"
                    fill="#475569"
                    radius={[8, 8, 0, 0]}
                    name="Hours"
                    className="dark:opacity-90"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* 3. AI Recovery Plan — coach speaks directly to user */}
        <Card
          className={sectionClass(
            "rounded-3xl bg-gradient-to-r from-amber-50/80 to-amber-100/60 shadow-xl transition-all duration-300 dark:from-amber-900/20 dark:to-amber-800/10 dark:border-amber-800/40"
          )}
          style={sectionDelay(3)}
        >
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-100 shadow-lg dark:from-amber-800 dark:to-amber-700">
                <Brain className="h-6 w-6 text-amber-700 dark:text-amber-300" />
              </div>
              <div>
                <CardTitle className="text-xl">Your AI Coach Says</CardTitle>
                <CardDescription className="text-base mt-1">
                  Personalized for you—no medical advice, just support.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            {loading && (
              <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-300 border-t-amber-600"></div>
                <p className="text-base">
                  Your coach is reading your sleep data and writing a plan for you…
                </p>
              </div>
            )}
            {error && (
              <div className="rounded-2xl bg-red-50/80 border border-red-200/60 p-4 dark:bg-red-900/20 dark:border-red-800/60">
                <p className="text-red-700 dark:text-red-400 text-base">
                  {error}. Check GROQ_API_KEY in .env.local or try again.
                </p>
              </div>
            )}
            {plan && !loading && (
              <div className="space-y-4 text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {plan.split(/\n\n+/).map((paragraph, i) => (
                  <div
                    key={i}
                    className={`rounded-xl bg-white/60 p-4 transition-all duration-500 dark:bg-slate-800/60 ${
                      planVisible && revealSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                    }`}
                    style={planDelay(i)}
                  >
                    <p className="leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {showChat && (
          <Card
            className={sectionClass(
              "mt-10 rounded-3xl border border-slate-200/60 bg-white/80 shadow-xl transition-all duration-300 dark:border-slate-700/60 dark:bg-slate-900/50"
            )}
            style={sectionDelay(4)}
          >
            <CardHeader className="pb-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 to-amber-100 shadow-lg dark:from-amber-800 dark:to-amber-700">
                  <MessageCircle className="h-6 w-6 text-amber-700 dark:text-amber-300" />
                </div>
                <div>
                  <CardTitle className="text-xl">Chat with Your Coach</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Keep the conversation going—ask follow-up questions about this week&apos;s results.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div
                ref={chatListRef}
                className="chat-scroll max-h-[22rem] overflow-y-auto rounded-2xl border border-slate-200/60 bg-white/60 p-4 shadow-inner dark:border-slate-700/60 dark:bg-slate-800/50"
              >
                <div className="flex flex-col gap-3">
                  {chatMessages.map((message, index) => {
                    const isUser = message.role === "user";
                    return (
                      <div key={`${message.role}-${index}`} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-md transition-all duration-200 ${
                            isUser
                              ? "bg-gradient-to-r from-amber-500 to-amber-400 text-amber-50"
                              : "bg-white/80 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200 border border-amber-100/60 dark:border-amber-800/40"
                          }`}
                        >
                          <div className="space-y-2 text-left">
                            {renderChatContent(message.content)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-4 py-3 text-sm text-slate-600 shadow-md dark:bg-slate-800/70 dark:text-slate-300">
                        <span className="h-2.5 w-2.5 animate-ping rounded-full bg-amber-500"></span>
                        <span>Coach is typing…</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {chatError && (
                <div className="mt-3 rounded-2xl border border-red-200/60 bg-red-50/80 px-4 py-2 text-sm text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
                  {chatError}
                </div>
              )}

              <form
                className="mt-4 flex flex-col gap-3 sm:flex-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void sendChatMessage();
                }}
              >
                <textarea
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Ask a follow-up or request tweaks…"
                  className="min-h-[3.5rem] flex-1 resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner transition-all duration-200 focus:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-300/50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:focus:border-amber-500"
                  rows={3}
                />
                <Button
                  type="submit"
                  disabled={chatDisabled}
                  className="h-12 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-6 font-semibold text-slate-900 shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-60 disabled:shadow-none"
                >
                  {chatLoading ? "Sending…" : "Send"}
                </Button>
              </form>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Press Enter to send, Shift+Enter for a new line.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
