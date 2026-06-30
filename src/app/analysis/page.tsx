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
import { Wallet, Brain, ArrowLeft, MessageCircle, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
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
  computeBudgetBalance,
  DAILY_BUDGET,
  DEFAULT_DAY_LABELS,
  getDefaultWeek,
  type DayExpense,
} from "@/lib/finance-calculator";
import { STORAGE_KEY, ANALYSIS_STORAGE_KEY, CACHE_CLEARED_KEY } from "@/lib/storage-keys";
import { addPointsForWeekIfNew } from "@/lib/points";
import {
  loadWeekHistory,
  getPreviousWeeksSummary,
  appendWeek,
} from "@/lib/week-history";

type StoredLog = { days: DayExpense[]; budget?: number };

type CachedAnalysis = {
  plan: string;
  points?: number;
  overspend: number;
  underspend: number;
  budget?: number;
};

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type BudgetTooltipPayload = {
  value: number;
  name: string;
};

function BudgetTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0] as BudgetTooltipPayload | undefined;
  if (!point || typeof point.value !== "number") return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/95 px-3.5 py-2 shadow-lg backdrop-blur-sm dark:border-slate-700/60 dark:bg-slate-900/85">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">${point.value.toFixed(2)}</p>
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

    if (lines.length === 0) return null;

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

export default function AnalysisPage() {
  const [days, setDays] = useState<DayExpense[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [planVisible, setPlanVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [revealSections, setRevealSections] = useState(false);
  const [budget, setBudget] = useState<number>(DAILY_BUDGET);
  const [planPoints, setPlanPoints] = useState<number | undefined>(undefined);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatListRef = useRef<HTMLDivElement | null>(null);

  const balance = useMemo(
    () => (days.length === 7 ? computeBudgetBalance(days, budget) : null),
    [days, budget]
  );

  useEffect(() => {
    if (!chatListRef.current) return;
    chatListRef.current.scrollTo({ top: chatListRef.current.scrollHeight, behavior: "smooth" });
  }, [chatMessages.length]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setMounted(true);
        return;
      }
      const data = JSON.parse(raw) as DayExpense[] | StoredLog;
      const parsed = Array.isArray(data) ? data : data.days;

      if (!Array.isArray(parsed) || parsed.length !== 7) {
        setMounted(true);
        return;
      }

      setDays(
        DEFAULT_DAY_LABELS.map((day, i) => ({
          day,
          spent: typeof parsed[i]?.spent === "number" ? parsed[i].spent : 0,
          category: parsed[i]?.category,
          note: parsed[i]?.note,
        }))
      );

      if (!Array.isArray(data) && typeof data.budget === "number") {
        setBudget(Math.min(Math.max(10, data.budget), 1000));
      }
    } catch {
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
    const tone =
      net < 0
        ? `You went $${Math.abs(net).toFixed(2)} over budget this week — let's find ways to balance things out.`
        : net > 0
          ? `You saved $${net.toFixed(2)} this week — nice work staying disciplined.`
          : "You landed right on target this week, which is a great baseline.";
    const opener = `Hey, I'm your FinWise coach. ${tone} Ask me anything about the budget plan or how to adjust your spending habits.`;
    setChatMessages([{ role: "assistant", content: opener }]);
  }, [plan, balance, chatMessages.length]);

  const sendChatMessage = async () => {
    if (!plan || !balance) return;
    if (days.length !== 7) return;
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
          expenseLog: balance.days.map(({ day, spent, overspend, underspend }) => ({
            day, spent, overspend, underspend,
          })),
          totals: {
            overspend: balance.totalOverspend,
            underspend: balance.totalUnderspend,
            net: balance.netBalance,
          },
          plan,
          points: planPoints,
          targetBudget: budget,
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

  useEffect(() => {
    if (!mounted || !balance) return;

    const history = loadWeekHistory();
    const isFirstWeek = history.length === 0;
    const previousWeeks = getPreviousWeeksSummary(2);

    try {
      const cachedRaw = localStorage.getItem(ANALYSIS_STORAGE_KEY);
      if (cachedRaw) {
        const cached = JSON.parse(cachedRaw) as CachedAnalysis;
        const overspendMatch = Math.abs((cached.overspend ?? 0) - balance.totalOverspend) < 0.01;
        const underspendMatch = Math.abs((cached.underspend ?? 0) - balance.totalUnderspend) < 0.01;
        const budgetMatch = Math.abs((cached.budget ?? budget) - budget) < 0.01;
        if (typeof cached.plan === "string" && overspendMatch && underspendMatch && budgetMatch) {
          setPlan(cached.plan);
          setPlanPoints(typeof cached.points === "number" ? cached.points : undefined);
          setChatMessages([]);
          setChatError(null);
          addPointsForWeekIfNew(balance.days, cached.points, budget);
          try {
            localStorage.setItem(
              STORAGE_KEY,
              JSON.stringify({ days: getDefaultWeek(), budget })
            );
            localStorage.setItem(CACHE_CLEARED_KEY, "1");
          } catch {
          }
          return;
        }
      }
    } catch {
    }

    if (plan !== null || loading || error) return;

    setLoading(true);
    setError(null);

    const payload: Record<string, unknown> = {
      expenseLog: balance.days.map(({ day, spent, category, note }) => ({
        day, spent, category, note,
      })),
      overspend: balance.totalOverspend,
      underspend: balance.totalUnderspend,
      isFirstWeek,
      previousWeeks,
      budget,
    };

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
              overspend: balance.totalOverspend,
              underspend: balance.totalUnderspend,
              budget,
            } as CachedAnalysis)
          );
          addPointsForWeekIfNew(balance.days, pointsFromAI, budget);
          appendWeek({
            days: balance.days,
            totalOverspend: balance.totalOverspend,
            totalUnderspend: balance.totalUnderspend,
            netBalance: balance.netBalance,
            plan: planText,
            points: pointsFromAI ?? 0,
            targetBudget: budget,
          });
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ days: getDefaultWeek(), budget })
          );
          localStorage.setItem(CACHE_CLEARED_KEY, "1");
        } catch {
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
  }, [mounted, balance, plan, loading, error, budget]);

  const showChat = Boolean(plan && !loading);
  const chatDisabled = chatLoading || chatInput.trim().length === 0;

  const chartData = useMemo(
    () =>
      balance?.days.map((d) => ({
        day: d.day,
        spent: d.spent,
      })) ?? [],
    [balance]
  );
  const chartYMax = useMemo(() => {
    const values = chartData.map((d) => d.spent);
    const maxSpent = values.length > 0 ? Math.max(...values, budget + 20) : budget + 20;
    return Math.max(50, Math.ceil(maxSpent / 10) * 10 + 10);
  }, [chartData, budget]);

  const sectionClass = (extra?: string) =>
    ["reveal-section", revealSections ? "reveal-active" : "", extra].filter(Boolean).join(" ");

  const sectionDelay = (index: number): CSSProperties => ({ transitionDelay: `${index * 90}ms` });
  const planDelay = (index: number): CSSProperties => ({ transitionDelay: `${index * 70 + 260}ms` });

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Loading…</p>
      </main>
    );
  }

  if (days.length !== 7) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 dark:bg-slate-900">
        <p className="text-slate-600 dark:text-slate-400">
          No spending data. Log your last 7 days first.
        </p>
        <Link href="/">
          <Button>Go to Dashboard</Button>
        </Link>
      </main>
    );
  }

  const netBalance = balance!.netBalance;
  const isOverspent = netBalance < 0;
  const balanceLabel = `${isOverspent ? "-$" : "+$"}${Math.abs(netBalance).toFixed(2)}`;

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
            <div className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-100 to-emerald-50 px-4 py-2 shadow-md dark:from-emerald-900/40 dark:to-emerald-800/20 dark:shadow-lg">
              <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">FinWise</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <Card
          className={sectionClass(
            `mb-10 rounded-3xl shadow-xl transition-all duration-300 ${isOverspent ? 'border-red-200/60 dark:border-red-800/60' : 'border-emerald-200/60 dark:border-emerald-800/60'}`
          )}
          style={sectionDelay(1)}
        >
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className={`rounded-full p-3 ${isOverspent ? 'bg-red-100 dark:bg-red-800/30' : 'bg-emerald-100 dark:bg-emerald-800/30'}`}>
                <Wallet className={`h-6 w-6 ${isOverspent ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
              </div>
              <div>
                <CardTitle className="text-xl">Budget Balance</CardTitle>
                <CardDescription className="text-base mt-1">Net over the last 7 days (underspend − overspend)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            <div className="space-y-4">
              <p
                className={`text-5xl font-bold tracking-tight sm:text-6xl ${
                  isOverspent ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {balanceLabel}
              </p>
              <div className="flex gap-8 text-base">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-lg font-semibold text-red-600 dark:text-red-400">
                    <TrendingDown className="h-4 w-4" />
                    ${balance!.totalOverspend.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Overspend</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                    ${balance!.totalUnderspend.toFixed(2)}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Underspend</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={sectionClass("mb-10 rounded-3xl shadow-xl transition-all duration-300")}
          style={sectionDelay(2)}
        >
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-slate-100 p-3 dark:bg-slate-700">
                <DollarSign className="h-6 w-6 text-slate-600 dark:text-slate-300" />
              </div>
              <div>
                <CardTitle className="text-xl">Weekly Spending</CardTitle>
                <CardDescription className="text-base mt-1">
                  Daily spending (goal ${budget}/day)
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
                    width={40}
                    tickFormatter={(v: number) => `$${v}`}
                  />
                  <ReferenceLine
                    y={budget}
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(148, 163, 184, 0.18)", radius: 12 }}
                    wrapperStyle={{ margin: 0 }}
                    content={<BudgetTooltip />}
                  />
                  <Bar
                    dataKey="spent"
                    fill="#059669"
                    radius={[8, 8, 0, 0]}
                    name="Spent"
                    className="dark:opacity-90"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card
          className={sectionClass(
            "rounded-3xl bg-gradient-to-r from-emerald-50/80 to-emerald-100/60 shadow-xl transition-all duration-300 dark:from-emerald-900/20 dark:to-emerald-800/10 dark:border-emerald-800/40"
          )}
          style={sectionDelay(3)}
        >
          <CardHeader className="pb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-emerald-100 shadow-lg dark:from-emerald-800 dark:to-emerald-700">
                <Brain className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
              </div>
              <div>
                <CardTitle className="text-xl">Your AI Coach Says</CardTitle>
                <CardDescription className="text-base mt-1">
                  Personalized for you—not financial advice, just support.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6">
            {loading && (
              <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-600"></div>
                <p className="text-base">
                  Your coach is reading your spending data and creating a plan…
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
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-200 to-emerald-100 shadow-lg dark:from-emerald-800 dark:to-emerald-700">
                  <MessageCircle className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />
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
                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-emerald-50"
                              : "bg-white/80 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200 border border-emerald-100/60 dark:border-emerald-800/40"
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
                        <span className="h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500"></span>
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
                  className="min-h-[3.5rem] flex-1 resize-none rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-inner transition-all duration-200 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-200 dark:focus:border-emerald-500"
                  rows={3}
                />
                <Button
                  type="submit"
                  disabled={chatDisabled}
                  className="h-12 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-6 font-semibold text-slate-900 shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-60 disabled:shadow-none"
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
