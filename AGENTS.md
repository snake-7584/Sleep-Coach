# FinWise - Development Guide

## Project Overview

FinWise is a Next.js 14 app that tracks 7 days of daily spending, calculates budget overspend/underspend, and generates AI-powered budget coaching using Groq's free API.

**Tech Stack:**
- Framework: Next.js 14 (App Router)
- Styling: Tailwind CSS with shadcn-style components
- UI Library: Lucide React icons, Recharts for charts
- Storage: localStorage (no backend database)
- AI: Groq API (llama-3.1-8b-instant model)
- Language: TypeScript with strict mode

## Development Commands

### Core Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

## Code Style Guidelines

### File Structure & Imports
```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   └── layout.tsx      # Root layout
├── components/
│   └── ui/             # Reusable UI components (shadcn-style)
└── lib/                # Utilities and business logic
```

**Import Order:**
1. React/Next.js imports
2. Third-party library imports
3. Local imports (using `@/` prefix)
4. Type imports (use `type` keyword when possible)

### TypeScript & Types
- **Strict mode enabled** - All types must be properly defined
- Use `type` for type aliases, `interface` for object shapes with inheritance
- Prefer explicit return types for functions

### Component Patterns
- Use **forwardRef** for components that accept refs
- Implement **displayName** for forwardRef components
- Use **cva** (class-variance-authority) for component variants
- Apply **cn()** utility for conditional Tailwind classes

### Naming Conventions
- **Components:** PascalCase
- **Functions:** camelCase with descriptive names
- **Constants:** UPPER_SNAKE_CASE for configuration constants
- **Files:** kebab-case for utilities, PascalCase for components

### Styling & Theming
- **Primary color:** Emerald (emerald-400, emerald-600, emerald-500)
- **Dark mode support** required for all components
- Use **rounded-xl** for cards, **rounded-lg** for smaller elements
- Implement **transition-all** for interactive states

### State Management
- Use **useState** for local component state
- **localStorage** for persistence (use defined storage keys)
- Implement **mounted** state pattern to avoid hydration mismatches

### API Integration
- **Groq API** only (no other LLM providers)
- Temperature: **0.3**
- Model: **llama-3.1-8b-instant**
- Maximum tokens: **400**
- One API call per analysis

### Storage Keys
Use constants from `@/lib/storage-keys`:
- `STORAGE_KEY` for spending data
- `ANALYSIS_STORAGE_KEY` for AI analysis results
- `POINTS_STORAGE_KEY` for budget points
- `CACHE_CLEARED_KEY` for cache management
- `WEEKS_HISTORY_KEY` for week history

## Spending Data Handling
- Daily budget: **$100** per day (configurable)
- Process exactly **7 days** of spending data
- Calculate **overspend** and **underspend** separately
- Support category assignment and notes per day

## App Store Deployment (Capacitor + Vercel)

This app uses **Capacitor** to wrap the Next.js web app as a native iOS app for App Store submission.

### Prerequisites
- [Xcode](https://apps.apple.com/app/xcode/id497799835) (from Mac App Store)
- [Apple Developer](https://developer.apple.com/programs/) account ($99/yr)
- [Vercel](https://vercel.com) account (free)

### Deployment Steps

1. **Deploy the Next.js app to Vercel:**
   ```bash
   npm run deploy:vercel
   ```
   Follow the prompts. After deployment, copy your Vercel URL.

2. **Point Capacitor to your deployed URL:**
   Edit `capacitor.config.ts` and uncomment/update:
   ```ts
   server: { url: 'https://finwise.vercel.app' },
   ```

3. **Sync and open in Xcode:**
   ```bash
   npm run deploy:appstore
   ```

4. **In Xcode:**
   - Select your team under Signing & Capabilities
   - Bundle Identifier: `com.finwise.app`
   - Build & archive (Product > Archive)
   - Upload to App Store Connect via the Organizer window

5. **Submit on App Store Connect:**
   - Fill in metadata, screenshots, pricing
   - Submit for review

### Commands

| Command | What it does |
|---------|-------------|
| `npm run deploy:vercel` | Deploy Next.js to Vercel |
| `npm run cap:sync` | Sync web assets to iOS project |
| `npm run cap:open` | Open iOS project in Xcode |
| `npm run deploy:appstore` | Build + sync + open Xcode |

## Constraints & Limitations
- **No auth system** - localStorage only
- **No financial advice requiring a license** - behavioral coaching only
- **Free tier only** - Groq API free tier
- **No local models** - cloud API only
