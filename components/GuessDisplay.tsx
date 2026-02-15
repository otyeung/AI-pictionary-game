"use client";

export interface Guess {
  guess: string;
  confidence: "high" | "medium" | "low";
  duration_ms: number;
  timestamp: Date;
}

interface GuessDisplayProps {
  guesses: Guess[];
  isLoading: boolean;
}

const CONFIDENCE_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  high: { bg: "bg-green-100", text: "text-green-700", label: "High" },
  medium: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Medium" },
  low: { bg: "bg-red-100", text: "text-red-700", label: "Low" },
};

export default function GuessDisplay({ guesses, isLoading }: GuessDisplayProps) {
  if (!isLoading && guesses.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <span className="text-5xl mb-4">🎨</span>
        <p className="text-lg font-medium">Draw something!</p>
        <p className="text-sm">Then click &quot;Ask AI to Guess&quot; to see what it thinks.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {isLoading && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-pulse">
          <div className="w-6 h-6 border-3 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-blue-600 font-medium">
            AI is thinking...
          </span>
        </div>
      )}

      {guesses.map((g, i) => {
        const style = CONFIDENCE_STYLES[g.confidence] || CONFIDENCE_STYLES.low;
        return (
          <div
            key={i}
            className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xl font-bold text-gray-800">{g.guess}</p>
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${style.bg} ${style.text}`}
              >
                {style.label}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {(g.duration_ms / 1000).toFixed(1)}s
            </p>
          </div>
        );
      })}
    </div>
  );
}
