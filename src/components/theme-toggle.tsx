"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Button to toggle light/dark theme. Shows moon in light mode, sun in dark. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      className={cn(
        "rounded-xl border-slate-200/60 bg-white/80 backdrop-blur-sm shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg dark:border-slate-600/60 dark:bg-slate-800/80 dark:hover:bg-slate-700/80",
        className
      )}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
    >
      {theme === "light" ? (
        <Moon className="h-4 w-4 text-amber-600" />
      ) : (
        <Sun className="h-4 w-4 text-amber-400" />
      )}
    </Button>
  );
}
