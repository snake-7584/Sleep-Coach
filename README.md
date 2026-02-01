# Sleep Coach

A hackathon MVP that turns 7 days of sleep data into **sleep debt/credit** and an **AI-generated recovery plan**.  
*The calculator finds the debt — the AI decides the recovery.*

## Tech

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **UI:** shadcn-style components, Recharts, Lucide
- **Storage:** localStorage
- **AI:** Groq (free hosted LLM only)

## Setup

1. Install: `npm install`
2. Copy `.env.example` to `.env.local` and add your [Groq](https://console.groq.com) API key (free tier).
3. Run: `npm run dev`

## Flow

1. **/** — Log last 7 nights (hours per night). Primary CTA: **Analyze My Sleep**.
2. **/analysis** — Sleep Balance (big number, red/green), Weekly bar chart, AI Recovery Plan (plain language, no diagnoses).

## Rules

- No local models, no paid APIs, no auth, no medical diagnoses.
- One AI call per analysis; temperature 0.2–0.4; prompt used verbatim per spec.
