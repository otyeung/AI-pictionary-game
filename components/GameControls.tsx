"use client";

const WORD_LIST = [
  "cat", "dog", "house", "tree", "sun", "moon", "star", "car", "fish", "bird",
  "flower", "mountain", "boat", "hat", "shoe", "book", "clock", "chair", "table", "lamp",
  "apple", "banana", "pizza", "cake", "ice cream", "guitar", "piano", "drum", "rocket", "airplane",
  "bicycle", "umbrella", "rainbow", "cloud", "rain", "snow", "fire", "heart", "diamond", "crown",
  "sword", "shield", "castle", "bridge", "train", "bus", "helicopter", "balloon", "kite", "spider",
  "butterfly", "snake", "elephant", "lion", "monkey", "penguin", "whale", "octopus", "crab", "turtle",
];

export function getRandomWord(): string {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

interface GameControlsProps {
  onSubmit: () => void;
  onNewWord: () => void;
  isLoading: boolean;
  currentWord: string;
  timeRemaining?: number | null;
}

export default function GameControls({
  onSubmit,
  onNewWord,
  isLoading,
  currentWord,
  timeRemaining,
}: GameControlsProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
        <p className="text-sm font-medium text-purple-600 uppercase tracking-wider">
          Draw this:
        </p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{currentWord}</p>
        {timeRemaining != null && (
          <p
            className={`text-lg font-bold mt-2 ${
              timeRemaining <= 5 ? "text-red-500" : "text-gray-600"
            }`}
          >
            ⏱ {timeRemaining}s
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSubmit}
          disabled={isLoading}
          className="flex-1 px-5 py-3 text-lg font-bold text-white bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
        >
          {isLoading ? "Thinking..." : "🤖 Ask AI to Guess"}
        </button>
        <button
          onClick={onNewWord}
          className="px-5 py-3 text-lg font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors active:scale-[0.98]"
        >
          🎲 New Word
        </button>
      </div>
    </div>
  );
}
