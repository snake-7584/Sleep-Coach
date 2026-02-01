import { NextRequest, NextResponse } from "next/server";
import { TARGET_SLEEP_HOURS, type SleepDay } from "@/lib/sleep-calculator";

// =============================================================================
// Sleep Coach — AI analysis API (FREE hosted LLM only: Groq)
// =============================================================================
// • Calculator provides: debt, credit, sleep_log (numbers + raw data).
// • AI decides: pattern (chronic vs short-term), explanation, recovery plan.
// • One call per analysis; no memory/embeddings; temperature 0.2–0.4.
// =============================================================================

const GROQ_MODEL = "llama-3.1-8b-instant";
const TEMPERATURE = 0.3;
const MAX_TOKENS = 400;

/** Instructs the model to speak directly to the user ("you") and avoid medical claims. */
const SYSTEM_PROMPT = `You are a sleep behavior coach talking directly to the user. Always address them as "you" and "your." Be warm, conversational, and supportive—like a coach in the room with them. Explain sleep patterns clearly and calmly. You do not provide medical diagnoses. Your goal is to help them recover sleep sustainably without guilt or alarm.`;

/**
 * Builds the user prompt: 7-day log, totals, wake/bed times, previous weeks (optional), constraints.
 * When isFirstWeek, use "for this week" (don't assume typical from one occurrence).
 * Ask for specific durations (how many nights).
 */
function buildUserPrompt(params: {
  sleep_log: string;
  debt: number;
  credit: number;
  wake_time: string;
  bedtime: string;
  constraints: string;
  isFirstWeek: boolean;
  previousWeeksSummary: string;
  wake_is_multi: boolean;
  bed_is_multi: boolean;
  timingNote?: string;
  severity?: "normal" | "oversleep" | "undersleep";
  target_hours: number;
}): string {
  const {
    sleep_log,
    debt,
    credit,
    wake_time,
    bedtime,
    constraints,
    isFirstWeek,
    previousWeeksSummary,
    wake_is_multi,
    bed_is_multi,
    timingNote,
    severity = "normal",
    target_hours,
  } = params;
  const wakeLabel = wake_is_multi
    ? "Wake-up times by day"
    : isFirstWeek
      ? "Wake-up time for this week (only one week entered)"
      : "Typical wake-up time";
  const bedLabel = bed_is_multi
    ? "Bedtimes by day"
    : isFirstWeek
      ? "Bedtime for this week (only one week entered)"
      : "Typical bedtime";
  return `Here is the user's sleep data for the past 7 days:
${sleep_log}

Target sleep per night: ${target_hours} hours
Total sleep debt: ${debt} hours
Total sleep credit: ${credit} hours
${wakeLabel}: ${wake_time}
${bedLabel}: ${bedtime}
Weekday constraints: ${constraints}
${previousWeeksSummary ? `Previous weeks (for context; you may build on this):\n${previousWeeksSummary}` : ""}
${timingNote ? `\nImportant note: ${timingNote}` : ""}

Analyze their sleep pattern for this week only. Address the user directly as "you."
${isFirstWeek ? "Do not call anything 'typical'—this is the only week entered." : ""}
Determine whether this is short-term or chronic sleep debt.
Explain the pattern in simple terms.
Create a realistic recovery plan using earlier bedtimes or short naps (≤30 minutes).
Be specific about durations: when suggesting e.g. "go to bed 15–30 minutes earlier", always state for how many nights (e.g. "for the next 5 nights" or "for the next 2 weeks").
Before you state the points, include one concise sentence explaining why you awarded that specific number of points, referencing their sleep pattern.
${severity === "undersleep"
    ? "They are severely underslept. Give a multi-step recovery roadmap (schedule shifts, restorative naps, morning light exposure, evening wind-down habits, contingency steps) and you may use up to 320 words in total."
    : severity === "oversleep"
      ? "They are oversleeping consistently. Provide a structured plan to rebalance sleep (consistent wake windows, daylight cues, activity timing) and you may use up to 250 words in total."
      : "Keep it focused but you may use up to 220 words in total."}
At the very end of your response, add exactly one line: POINTS: N (N is an integer from 0 to 10, how much credit to give for this week's sleep based on your assessment).`;
}

/**
 * POST /api/analyze
 * Body: { sleepLog, debt, credit, wakeTime?, constraints? }
 * Returns: { plan: string } or { error, details? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      sleepLog,
      debt,
      credit,
      wakeTime: bodyWakeTime,
      bedtime: bodyBedtime,
      constraints = "Work/school weekdays; flexible on weekends",
      isFirstWeek = true,
      previousWeeks = [],
      timingNote: bodyTimingNote,
      targetHours: bodyTarget,
    } = body;

    if (
      !Array.isArray(sleepLog) ||
      typeof debt !== "number" ||
      typeof credit !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid sleepLog, debt, or credit" },
        { status: 400 }
      );
    }

    const targetHours = typeof bodyTarget === "number"
      ? Math.min(Math.max(bodyTarget, 4), 12)
      : TARGET_SLEEP_HOURS;

    const wakeDetails = sleepLog
      .map((d: { day: string; wakeTime?: string }) =>
        d.wakeTime?.trim() ? `${d.day}: ${d.wakeTime.trim()}` : null
      )
      .filter(Boolean) as string[];
    const bedtimeDetails = sleepLog
      .map((d: { day: string; bedtime?: string }) =>
        d.bedtime?.trim() ? `${d.day}: ${d.bedtime.trim()}` : null
      )
      .filter(Boolean) as string[];

    const wakeSet = new Set(wakeDetails.map((entry) => entry.split(": ")[1]));
    const bedSet = new Set(bedtimeDetails.map((entry) => entry.split(": ")[1]));
    const wakeHasVariation = wakeSet.size > 1;
    const bedHasVariation = bedSet.size > 1;

    const wakeSummary = wakeDetails.join("; ");
    const bedSummary = bedtimeDetails.join("; ");

    const wakeTime = wakeHasVariation
      ? wakeSummary || "Not specified"
      : (bodyWakeTime ?? wakeSummary) || "Not specified";

    const bedtime = bedHasVariation
      ? bedSummary || "Not specified"
      : (bodyBedtime ?? bedSummary) || "Not specified";

    const noteParts: string[] = [];
    if (typeof bodyTimingNote === "string" && bodyTimingNote.trim()) {
      noteParts.push(bodyTimingNote.trim());
    }
    if (wakeHasVariation) {
      noteParts.push("Wake-up times vary across the week, rely on each day's entry.");
    }
    if (bedHasVariation) {
      noteParts.push("Bedtimes vary across the week, rely on each day's entry.");
    }
    const timingNote = noteParts.length
      ? noteParts.filter((value, index, self) => self.indexOf(value) === index).join(" ")
      : undefined;

    const sleep_log = sleepLog
      .map(
        (d: { day: string; hours: number; wakeTime?: string; bedtime?: string }) => {
          const parts = [`${d.day}: ${d.hours} hours`];
          if (d.wakeTime) parts.push(`wake ${d.wakeTime}`);
          if (d.bedtime) parts.push(`bed ${d.bedtime}`);
          return parts.join(", ");
        }
      )
      .join("\n");

    const previousWeeksSummary =
      Array.isArray(previousWeeks) && previousWeeks.length > 0
        ? previousWeeks
            .slice(0, 3)
            .map(
              (w: { debt?: number; credit?: number; points?: number }, i: number) =>
                `Week ${i + 1} ago: debt ${w.debt ?? 0} hrs, credit ${w.credit ?? 0} hrs, points ${w.points ?? 0}`
            )
            .join("\n")
        : "";

    const severity = determineSeverity(sleepLog as SleepDay[], targetHours);

    const userPrompt = buildUserPrompt({
      sleep_log,
      debt,
      credit,
      wake_time: typeof wakeTime === "string" ? wakeTime : "Not specified",
      bedtime: typeof bedtime === "string" ? bedtime : "Not specified",
      constraints,
      isFirstWeek: Boolean(isFirstWeek),
      previousWeeksSummary,
      wake_is_multi: wakeHasVariation,
      bed_is_multi: bedHasVariation,
      timingNote,
      severity,
      target_hours: targetHours,
    });

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "GROQ_API_KEY not set. Add it in .env.local (free at console.groq.com).",
        },
        { status: 503 }
      );
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: TEMPERATURE,
        max_tokens:
          severity === "undersleep"
            ? 520
            : severity === "oversleep"
              ? 450
              : MAX_TOKENS,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let details: string | undefined;
      try {
        const parsed = JSON.parse(errText) as { error?: { message?: string } };
        details = parsed?.error?.message ?? errText;
      } catch {
        details = errText.slice(0, 200);
      }
      return NextResponse.json(
        { error: `Groq API error: ${response.status}`, details },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    let content =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Unable to generate a recovery plan. Please try again.";
    let points: number = 5;
    const pointsMatch = content.match(/POINTS:\s*(\d+)/i);
    if (pointsMatch) {
      points = Math.min(10, Math.max(0, parseInt(pointsMatch[1], 10)));
      content = content.replace(/\n?POINTS:\s*\d+\s*$/im, "").trim();
    }
    return NextResponse.json({ plan: content, points });
  } catch (e) {
    console.error("Analyze API error:", e);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
function determineSeverity(
  log: SleepDay[],
  target: number
): "normal" | "oversleep" | "undersleep" {
  const hours = log
    .map((entry) => (typeof entry?.hours === "number" ? entry.hours : target))
    .filter((value): value is number => Number.isFinite(value));

  if (hours.length === 0) return "normal";

  const severeShortThreshold = Math.max(2, target - 4);
  const shortThreshold = Math.max(3.5, target - 2.5);
  const avg = hours.reduce((sum, value) => sum + value, 0) / hours.length;
  const severeShort = hours.filter((value) => value < severeShortThreshold).length;
  const short = hours.filter((value) => value < shortThreshold).length;
  if (severeShort >= 2 || short >= 4 || avg < target - 2.25) {
    return "undersleep";
  }

  const oversExtreme = hours.filter((value) => value >= target + 7).length;
  const overs = hours.filter((value) => value >= target + 4).length;
  if (oversExtreme >= 2 || overs >= 4 || avg > target + 2.5) {
    return "oversleep";
  }

  return "normal";
}
