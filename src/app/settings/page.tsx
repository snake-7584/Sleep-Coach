"use client";

import {
  Fragment,
  useState,
  useEffect,
  useMemo,
  useRef,
  type KeyboardEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Settings,
  Trash2,
  ArrowLeft,
  Wallet,
  ChevronDown,
  ChevronUp,
  Calendar,
  MessageCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  STORAGE_KEY,
  ANALYSIS_STORAGE_KEY,
  POINTS_STORAGE_KEY,
  CACHE_CLEARED_KEY,
} from "@/lib/storage-keys";
import { loadWeekHistory, clearWeekHistory, type WeekEntry } from "@/lib/week-history";
import { DAILY_BUDGET } from "@/lib/finance-calculator";
import type { TooltipProps } from "recharts";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

type WeekChatState = {
  messages: ChatMessage[];
  input: string;
  loading: boolean;
  error: string | null;
};

type WeekTooltipPayload = {
  value: number;
  name: string;
};

function renderChatContent(content: string) {
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

function WeekBudgetTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0] as WeekTooltipPayload | undefined;
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

export default function SettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [cleared, setCleared] = useState(false);
  const [weeks, setWeeks] = useState<WeekEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chatByWeek, setChatByWeek] = useState<Record<string, WeekChatState>>({});
  const chatListRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const weekItems = useMemo(
    () => weeks.map((week, index) => ({ week, index, id: `${week.createdAt}-${index}` })),
    [weeks]
  );

  const findWeekById = (id: string) => weekItems.find((item) => item.id === id);

  useEffect(() => {
    if (!expandedId) return;
    const entry = findWeekById(expandedId);
    if (!entry) return;
    setChatByWeek((prev) => {
      if (prev[expandedId]) return prev;
      const { week } = entry;
      const dateLabel = new Date(week.createdAt).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const greeting = `Hey, I'm your FinWise coach. This snapshot from ${dateLabel} earned ${week.points} point${week.points === 1 ? "" : "s"}. Want to revisit what worked or what to adjust?`;
      return {
        ...prev,
        [expandedId]: {
          messages: [{ role: "assistant", content: greeting }],
          input: "",
          loading: false,
          error: null,
        },
      };
    });
  }, [expandedId, weekItems]);

  const activeMessageCount = expandedId ? chatByWeek[expandedId]?.messages.length ?? 0 : 0;

  useEffect(() => {
    if (!expandedId) return;
    const ref = chatListRefs.current[expandedId];
    if (!ref) return;
    ref.scrollTo({ top: ref.scrollHeight, behavior: "smooth" });
  }, [expandedId, activeMessageCount]);

  useEffect(() => {
    setMounted(true);
    setWeeks(loadWeekHistory());
  }, []);

  const handleChatInputChange = (id: string, value: string) => {
    setChatByWeek((prev) => {
      const current = prev[id];
      if (!current) return prev;
      return { ...prev, [id]: { ...current, input: value } };
    });
  };

  const sendChatForWeek = async (id: string) => {
    const entry = findWeekById(id);
    if (!entry) return;
    const chatState = chatByWeek[id];
    if (!chatState) return;
    if (chatState.loading) return;
    const trimmed = chatState.input.trim();
    if (!trimmed) return;

    const optimisticMessages: ChatMessage[] = [...chatState.messages, { role: "user", content: trimmed }];
    setChatByWeek((prev) => ({
      ...prev,
      [id]: { ...chatState, messages: optimisticMessages, input: "", loading: true, error: null },
    }));

    try {
      const { week } = entry;
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: optimisticMessages,
          expenseLog: week.days,
          totals: {
            overspend: week.totalOverspend,
            underspend: week.totalUnderspend,
            net: week.netBalance,
          },
          plan: week.plan,
          points: week.points,
          totalOverspend: week.totalOverspend,
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

      const minDelay = 420;
      const maxDelay = 1100;
      const jitter = minDelay + Math.random() * (maxDelay - minDelay);
      await new Promise((resolve) => setTimeout(resolve, jitter));

      setChatByWeek((prev) => {
        const current = prev[id];
        const baseState = current ?? { messages: optimisticMessages, input: "", loading: false, error: null };
        return {
          ...prev,
          [id]: {
            ...baseState,
            messages: [...optimisticMessages, { role: "assistant", content: reply }],
            input: "",
            loading: false,
            error: null,
          },
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Coach chat failed. Please try again.";
      setChatByWeek((prev) => {
        const current = prev[id];
        if (!current) return prev;
        return { ...prev, [id]: { ...current, messages: optimisticMessages, loading: false, error: message, input: trimmed } };
      });
    }
  };

  const handleChatKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>, id: string) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendChatForWeek(id);
    }
  };

  const handleClearCache = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ANALYSIS_STORAGE_KEY);
      localStorage.removeItem(POINTS_STORAGE_KEY);
      clearWeekHistory();
      localStorage.setItem(CACHE_CLEARED_KEY, "1");
      setCleared(true);
      setWeeks([]);
      setChatByWeek({});
      setExpandedId(null);
      router.push("/");
    } catch {
    }
  };

  if (!mounted) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Loading…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-900">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-3 py-1.5 dark:bg-emerald-900/30">
              <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">FinWise</span>
            </div>
            <ThemeToggle />
          </div>
        </header>

        <Card className="mb-6 rounded-2xl shadow-sm dark:shadow-slate-900/20">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-slate-100">Points & rewards</CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              <strong>This week</strong> is the credit (0–10) your AI coach gave for your last budget analysis. It updates when you run &quot;Analyze My Budget&quot; and matches the current 7-day log.
              <br />
              <strong>All time</strong> is the total points you&apos;ve earned over time; it adds this week&apos;s credit each time you get a new analysis (once per unique week).
              <br />
              Clearing cache resets the log, analysis cache, and points. <strong>This week and all time both go to 0</strong> after you clear.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="mb-6 rounded-2xl shadow-sm dark:shadow-slate-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <CardTitle>Previous weeks</CardTitle>
            </div>
            <CardDescription>
              Past analysis snapshots. Newest first. Expand to see the coach&apos;s budget plan for that week.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weeks.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No previous weeks yet. Run &quot;Analyze My Budget&quot; to add entries.
              </p>
            ) : (
              <ul className="space-y-2">
                {weekItems.map(({ week: w, id }) => {
                  const isExpanded = expandedId === id;
                  const date = new Date(w.createdAt);
                  const dateStr = date.toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const balanceStr =
                    w.netBalance >= 0 ? `+$${w.netBalance.toFixed(2)}` : `-$${Math.abs(w.netBalance).toFixed(2)}`;
                  const budgetLine = w.targetBudget ?? DAILY_BUDGET;
                  const chartData = w.days.map((d) => ({ day: d.day, spent: d.spent }));
                  const maxDaily = Math.max(budgetLine, ...w.days.map((d) => d.spent));
                  const yMax = Math.max(50, Math.ceil(Math.max(maxDaily + 10, budgetLine + 20) / 10) * 10);
                  const chatState = chatByWeek[id];
                  const planText = w.plan.trim();
                  const chatDisabled = !chatState || chatState.loading || chatState.input.trim().length === 0;
                  return (
                    <li
                      key={id}
                      className="rounded-xl border border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-800/50"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : id)}
                        className="flex w-full items-center justify-between gap-2 p-3 text-left text-sm"
                      >
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {dateStr}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {balanceStr} · {w.points} pts
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                      </button>
                      {isExpanded && (
                        <div className="space-y-4 border-t border-slate-200 px-3 py-4 dark:border-slate-600">
                          <div className="rounded-2xl bg-slate-50/80 p-4 shadow-inner dark:bg-slate-900/40">
                            <div className="h-48 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={chartData}
                                  margin={{ top: 12, right: 12, left: 6, bottom: 12 }}
                                >
                                  <XAxis
                                    dataKey="day"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                  />
                                  <YAxis
                                    domain={[0, yMax]}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: "#64748b", fontSize: 12 }}
                                    width={36}
                                    tickFormatter={(v: number) => `$${v}`}
                                  />
                                  <ReferenceLine
                                    y={budgetLine}
                                    stroke="#94a3b8"
                                    strokeDasharray="4 4"
                                    strokeWidth={1.25}
                                  />
                                  <Tooltip
                                    cursor={{ fill: "rgba(148, 163, 184, 0.18)", radius: 12 }}
                                    wrapperStyle={{ margin: 0 }}
                                    content={<WeekBudgetTooltip />}
                                  />
                                  <Bar
                                    dataKey="spent"
                                    fill="#059669"
                                    radius={[8, 8, 0, 0]}
                                    className="dark:opacity-90"
                                  />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center justify-around gap-3 text-xs text-slate-600 dark:text-slate-400">
                              <div className="text-center">
                                <div className="text-sm font-semibold text-red-500 dark:text-red-400">
                                  ${w.totalOverspend.toFixed(2)}
                                </div>
                                <div>Overspend</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                  ${w.totalUnderspend.toFixed(2)}
                                </div>
                                <div>Underspend</div>
                              </div>
                              <div className="text-center">
                                <div
                                  className={`text-sm font-semibold ${
                                    w.netBalance >= 0
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : "text-red-500 dark:text-red-400"
                                  }`}
                                >
                                  {balanceStr}
                                </div>
                                <div>Net</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                                  {w.points}
                                </div>
                                <div>Coach points</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm font-semibold text-slate-600 dark:text-slate-200">
                                  ${budgetLine}
                                </div>
                                <div>Budget/day</div>
                              </div>
                            </div>
                          </div>

                          {planText && (
                            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                              {planText}
                            </p>
                          )}

                          {chatState ? (
                            <div className="rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/60">
                              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                <MessageCircle className="h-4 w-4 text-emerald-500" />
                                Ask your coach about this week
                              </div>
                              <div
                                ref={(el) => { chatListRefs.current[id] = el; }}
                                className="chat-scroll max-h-60 overflow-y-auto rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700/60 dark:bg-slate-800/60"
                              >
                                <div className="flex flex-col gap-2">
                                  {chatState.messages.map((message, index) => {
                                    const isUser = message.role === "user";
                                    return (
                                      <div
                                        key={`${message.role}-${index}`}
                                        className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                                      >
                                        <div
                                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed shadow-md transition-all duration-200 ${
                                            isUser
                                              ? "bg-gradient-to-r from-emerald-500 to-emerald-400 text-emerald-50"
                                              : "border border-emerald-100/60 bg-white/85 text-slate-700 dark:border-emerald-800/40 dark:bg-slate-900/70 dark:text-slate-200"
                                          }`}
                                        >
                                          <div className="space-y-2 text-left">
                                            {renderChatContent(message.content)}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {chatState.loading && (
                                    <div className="flex justify-start">
                                      <div className="flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2 text-xs text-slate-600 shadow-inner dark:bg-slate-800/70 dark:text-slate-300">
                                        <span className="h-2 w-2 animate-ping rounded-full bg-emerald-500"></span>
                                        <span>Coach is typing…</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {chatState.error && (
                                <div className="mt-3 rounded-xl border border-red-200/60 bg-red-50/80 px-3 py-2 text-xs text-red-700 dark:border-red-800/60 dark:bg-red-900/20 dark:text-red-300">
                                  {chatState.error}
                                </div>
                              )}
                              <form
                                className="mt-3 flex flex-col gap-2 sm:flex-row"
                                onSubmit={(event) => {
                                  event.preventDefault();
                                  void sendChatForWeek(id);
                                }}
                              >
                                <textarea
                                  value={chatState.input}
                                  onChange={(event) => handleChatInputChange(id, event.target.value)}
                                  onKeyDown={(event) => handleChatKeyDown(event, id)}
                                  placeholder="Ask a follow-up about this week…"
                                  className="min-h-[3.25rem] flex-1 resize-none rounded-2xl border border-slate-200/70 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-inner transition-all duration-200 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300/40 dark:border-slate-700/60 dark:bg-slate-800/70 dark:text-slate-200 dark:focus:border-emerald-500"
                                  rows={3}
                                />
                                <Button
                                  type="submit"
                                  disabled={chatDisabled}
                                  className="h-11 rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-5 text-sm font-semibold text-slate-900 shadow-lg transition-all duration-200 hover:shadow-xl disabled:opacity-60 disabled:shadow-none"
                                >
                                  {chatState.loading ? "Sending…" : "Send"}
                                </Button>
                              </form>
                              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                Press Enter to send, Shift+Enter for a new line.
                              </p>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                              Initializing coach…
                            </div>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm dark:shadow-slate-900/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              <CardTitle>Clear cache</CardTitle>
            </div>
            <CardDescription>
              Remove stored spending log, analysis cache, week history, and points. This week and all-time points will show 0. App will behave as if you just started.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              variant="outline"
              onClick={handleClearCache}
              className="gap-2 text-emerald-700 dark:text-emerald-400"
            >
              <Trash2 className="h-4 w-4" />
              Clear cache
            </Button>
            {cleared && (
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Cache cleared. This week set to 0. Redirecting to dashboard…
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
