import { NextRequest, NextResponse } from "next/server";

const GROQ_MODEL = "llama-3.1-8b-instant";
const TEMPERATURE = 0.3;
const MAX_TOKENS = 300;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ExpenseLogDay = {
  day: string;
  spent: number;
  overspend?: number;
  underspend?: number;
};

type ChatRequestBody = {
  messages: ChatMessage[];
  expenseLog: ExpenseLogDay[];
  totals?: {
    overspend: number;
    underspend: number;
    net: number;
  };
  plan?: string;
  points?: number;
  targetBudget?: number;
};

const SYSTEM_PROMPT = `You are the user's financial behavior coach. Stay supportive, warm, and practical. Reference the provided spending data and budget plan when giving advice. Do not contradict earlier guidance unless you explain why you're updating it. Keep answers under 170 words, use short paragraphs or bullet lists, and never fabricate financial expertise.`;

function buildContext(body: ChatRequestBody): string {
  const { expenseLog = [], totals, plan, points, targetBudget } = body;
  const logLines = expenseLog
    .map((d) => {
      const overspendPart = typeof d.overspend === "number" ? `, overspend $${d.overspend.toFixed(2)}` : "";
      const underspendPart = typeof d.underspend === "number" ? `, underspend $${d.underspend.toFixed(2)}` : "";
      return `${d.day}: $${d.spent.toFixed(2)}${overspendPart}${underspendPart}`;
    })
    .join("\n");

  const totalsLine = totals
    ? `Totals — overspend $${totals.overspend.toFixed(2)}, underspend $${totals.underspend.toFixed(2)}, net $${totals.net.toFixed(2)}.`
    : "";

  const pointsLine = typeof points === "number" ? `Coach points for the week: ${points}.` : "";
  const budgetLine = typeof targetBudget === "number" ? `Daily budget: $${targetBudget}.` : "";
  const planLine = plan ? `Latest budget plan:\n${plan}` : "";

  return [`Spending log:\n${logLines}`, totalsLine, pointsLine, budgetLine, planLine]
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatRequestBody;

    if (!body || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: "Missing conversation history." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { error: "GROQ_API_KEY not set. Add it in .env.local." },
        { status: 503 }
      );
    }

    const context = buildContext(body);
    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: context },
      ...body.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
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

    const content =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I'm having trouble replying right now. Please try again.";

    return NextResponse.json({ message: content });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}
