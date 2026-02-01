import { NextRequest, NextResponse } from "next/server";

const GROQ_MODEL = "llama-3.1-8b-instant";
const TEMPERATURE = 0.3;
const MAX_TOKENS = 300;

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type SleepLogDay = {
  day: string;
  hours: number;
  debt?: number;
  credit?: number;
};

type ChatRequestBody = {
  messages: ChatMessage[];
  sleepLog: SleepLogDay[];
  totals?: {
    debt: number;
    credit: number;
    net: number;
  };
  plan?: string;
  points?: number;
  timingNote?: string;
  targetHours?: number;
};

const SYSTEM_PROMPT = `You are the user's sleep behavior coach. Stay supportive, warm, and practical. Reference the provided sleep data and plan when giving advice. Do not contradict earlier guidance unless you explain why you're updating it. Keep answers under 170 words, use short paragraphs or bullet lists, and never fabricate medical expertise.`;

function buildContext(body: ChatRequestBody): string {
  const { sleepLog = [], totals, plan, points, timingNote, targetHours } = body;
  const logLines = sleepLog
    .map((d) => {
      const debtPart = typeof d.debt === "number" ? `, debt ${d.debt.toFixed(1)}h` : "";
      const creditPart = typeof d.credit === "number" ? `, credit ${d.credit.toFixed(1)}h` : "";
      return `${d.day}: ${d.hours}h${debtPart}${creditPart}`;
    })
    .join("\n");

  const totalsLine = totals
    ? `Totals — debt ${totals.debt.toFixed(1)}h, credit ${totals.credit.toFixed(1)}h, net ${totals.net.toFixed(1)}h.`
    : "";

  const pointsLine = typeof points === "number" ? `Coach points for the week: ${points}.` : "";
  const targetLine = typeof targetHours === "number" ? `Sleep target: ${targetHours} hrs/night.` : "";
  const planLine = plan ? `Latest plan summary:\n${plan}` : "";
  const timingLine = timingNote ? `Timing note: ${timingNote}` : "";

  return [`Sleep log:\n${logLines}`, totalsLine, pointsLine, targetLine, planLine, timingLine]
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
