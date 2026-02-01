# Sleep Coach


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
2. **/analysis** — Sleep Balance (big number, red/green), Weekly bar chart, AI Recovery Plan 


