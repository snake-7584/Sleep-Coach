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

<br>
<br>
<br>
<br>
A lot of people (including myself) have trouble maintaining a sleep schedule and having good sleeping habits so I built Sleep Coach. Sleep Coach will take in you hours and create a plan to get you back on track with your sleep and the AI Chatbot will help you with any additional questions you might have.
I built this using Cursor and OpenCode.
