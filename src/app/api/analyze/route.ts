import { NextRequest, NextResponse } from "next/server";
import { DAILY_BUDGET } from "@/lib/finance-calculator";

const GROQ_MODEL = "llama-3.1-8b-instant";
const TEMPERATURE = 0.3;
const MAX_TOKENS = 400;

const SYSTEM_PROMPT = `You are a financial behavior coach talking directly to the user. Always address them as "you" and "your." Be warm, conversational, and supportive—like a coach sitting with them reviewing their budget. Explain spending patterns clearly and calmly. You do not provide financial advice that requires a license; your goal is to help them build sustainable money habits without guilt or alarm.`;

function buildUserPrompt(params: {
  expense_log: string;
  overspend: number;
  underspend: number;
  budget: number;
  isFirstWeek: boolean;
  previousWeeksSummary: string;
}): string {
  const {
    expense_log,
    overspend,
    underspend,
    budget,
    isFirstWeek,
    previousWeeksSummary,
  } = params;
  return `Here is the user's spending data for the past 7 days:
${expense_log}

Daily budget: $${budget}
Total overspend: $${overspend}
Total underspend: $${underspend}
${previousWeeksSummary ? `Previous weeks (for context):\n${previousWeeksSummary}` : ""}

Analyze their spending pattern for this week only. Address the user directly as "you."
${isFirstWeek ? "Do not call anything 'typical'—this is the only week entered." : ""}
Explain the pattern in simple terms.
Create a realistic budget improvement plan with specific actionable steps.
Be specific about amounts and durations when suggesting changes.
Before you state the points, include one concise sentence explaining why you awarded that specific number of points, referencing their spending pattern.
Keep it focused but you may use up to 220 words in total.
At the very end of your response, add exactly one line: POINTS: N (N is an integer from 0 to 10, how much budget credit to give for this week's spending based on your assessment).`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      expenseLog,
      overspend,
      underspend,
      budget: bodyBudget,
      isFirstWeek = true,
      previousWeeks = [],
    } = body;

    if (
      !Array.isArray(expenseLog) ||
      typeof overspend !== "number" ||
      typeof underspend !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing or invalid expenseLog, overspend, or underspend" },
        { status: 400 }
      );
    }

    const budget = typeof bodyBudget === "number"
      ? Math.min(Math.max(bodyBudget, 10), 1000)
      : DAILY_BUDGET;

    const expense_log = expenseLog
      .map(
        (d: { day: string; spent: number; category?: string; note?: string }) => {
          const parts = [`${d.day}: $${d.spent.toFixed(2)}`];
          if (d.category) parts.push(`(${d.category})`);
          if (d.note) parts.push(`- ${d.note}`);
          return parts.join(" ");
        }
      )
      .join("\n");

    const previousWeeksSummary =
      Array.isArray(previousWeeks) && previousWeeks.length > 0
        ? previousWeeks
            .slice(0, 3)
            .map(
              (w: { overspend?: number; underspend?: number; points?: number }, i: number) =>
                `Week ${i + 1} ago: overspend $${w.overspend ?? 0}, underspend $${w.underspend ?? 0}, points ${w.points ?? 0}`
            )
            .join("\n")
        : "";

    const userPrompt = buildUserPrompt({
      expense_log,
      overspend,
      underspend,
      budget,
      isFirstWeek: Boolean(isFirstWeek),
      previousWeeksSummary,
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
        max_tokens: MAX_TOKENS,
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
      "Unable to generate a budget plan. Please try again.";
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
