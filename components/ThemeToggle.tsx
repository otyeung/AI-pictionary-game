"use client";

import { useTheme } from "@/components/ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <span className="text-xl" role="img" aria-label="Dark mode">
          🌙
        </span>
      ) : (
        <span className="text-xl" role="img" aria-label="Light mode">
          ☀️
        </span>
      )}
    </button>
  );
}
