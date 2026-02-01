# Sleep Coach - Agent Development Guide

## Project Overview

Sleep Coach is a Next.js 14 hackathon MVP that analyzes 7 days of sleep data to calculate sleep debt/credit and generate AI-powered recovery plans using Groq's free API.

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
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint
npm run lint
```

**Note:** This project does not have a test framework configured. No test commands are available.

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

```typescript
// ✅ Correct order
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SleepDay } from "@/lib/sleep-calculator";
```

### TypeScript & Types
- **Strict mode enabled** - All types must be properly defined
- Use `type` for type aliases, `interface` for object shapes with inheritance
- Prefer explicit return types for functions
- Use `Readonly` for immutable props

```typescript
// ✅ Preferred patterns
type RowEditMode = "hours" | "times";

interface SleepDay {
  day: string;
  hours: number;
  wakeTime?: string;
  bedtime?: string;
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}
```

### Component Patterns
- Use **forwardRef** for components that accept refs
- Implement **displayName** for forwardRef components
- Use **cva** (class-variance-authority) for component variants
- Apply **cn()** utility for conditional Tailwind classes

```typescript
// ✅ Component pattern
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
);
Button.displayName = "Button";
```

### Naming Conventions
- **Components:** PascalCase (e.g., `ThemeProvider`, `ThemeToggle`)
- **Functions:** camelCase with descriptive names (e.g., `computeSleepBalance`, `buildUserPrompt`)
- **Constants:** UPPER_SNAKE_CASE for configuration constants (e.g., `GROQ_MODEL`, `TEMPERATURE`)
- **Files:** kebab-case for utilities (e.g., `sleep-calculator.ts`), PascalCase for components

### Error Handling
- API routes should return proper HTTP status codes
- Use try-catch blocks with meaningful error messages
- Validate input data before processing
- Return structured error objects: `{ error: string, details?: string }`

```typescript
// ✅ API error handling
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!Array.isArray(body.sleepLog)) {
      return NextResponse.json(
        { error: "Missing or invalid sleepLog" },
        { status: 400 }
      );
    }
    // ... process request
  } catch (e) {
    console.error("API error:", e);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
```

### Styling & Theming
- **Primary color:** Amber (amber-400, amber-600, amber-500)
- **Dark mode support** required for all components
- Use **rounded-xl** for cards, **rounded-lg** for smaller elements
- Implement **transition-all** for interactive states
- Dark mode focus rings: `dark:focus-visible:ring-amber-500`

### State Management
- Use **useState** for local component state
- **localStorage** for persistence (use defined storage keys)
- Implement **mounted** state pattern to avoid hydration mismatches
- Use **useEffect** with proper dependency arrays

### API Integration
- **Groq API** only (no other LLM providers)
- Temperature: **0.3** (range: 0.2-0.4)
- Model: **llama-3.1-8b-instant**
- Maximum tokens: **400**
- One API call per analysis
- Include proper error handling for API failures

### Code Comments
- Add **JSDoc-style comments** for complex functions
- Use **single-line comments** for implementation notes
- Add **section dividers** for major code blocks in API routes

```typescript
/**
 * Builds the user prompt: 7-day log, totals, wake/bed times, constraints.
 * When isFirstWeek, use "for this week" (don't assume typical from one occurrence).
 */
function buildUserPrompt(params: {
  sleep_log: string;
  debt: number;
  // ...
}): string {
  // Implementation
}
```

## Project-Specific Rules

### Sleep Data Handling
- Target sleep: **8 hours** per night
- Process exactly **7 days** of sleep data
- Calculate both **debt** and **credit** separately
- Support both **hours-based** and **time-based** entry methods
- Auto-calculate hours when both bedtime and wake time are provided

### AI Response Processing
- Extract **POINTS: N** from AI responses (0-10 scale)
- Remove the points line from the displayed content
- Validate points range before storage
- Cache analysis results to avoid duplicate API calls

### Storage Keys
Use the defined constants from `@/lib/storage-keys`:
- `STORAGE_KEY` for sleep data
- `ANALYSIS_STORAGE_KEY` for AI analysis results
- `CACHE_CLEARED_KEY` for cache management

### Accessibility
- All interactive elements need proper focus states
- Use semantic HTML elements
- Provide text alternatives for icons
- Implement proper ARIA labels where needed

## Development Workflow

1. **Start development** with `npm run dev`
2. **Run linting** before committing: `npm run lint`
3. **Test manually** - no automated tests available
4. **Build check** with `npm run build` before deployment

## Constraints & Limitations

- **No auth system** - localStorage only
- **No medical diagnoses** - behavioral coaching only
- **Free tier only** - Groq API free tier
- **No local models** - cloud API only
- **Single page app** - dashboard and analysis pages only