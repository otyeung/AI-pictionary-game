import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="text-center max-w-lg">
        <h1 className="text-6xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent mb-4">
          AI Pictionary
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-10">
          Draw something. See if AI can guess what it is!
        </p>

        <div className="grid grid-cols-3 gap-4 mb-10 text-center">
          <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="text-3xl">🎲</span>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Get a word</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="text-3xl">🎨</span>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Draw it</p>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <span className="text-3xl">🤖</span>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">AI guesses</p>
          </div>
        </div>

        <Link
          href="/game"
          className="inline-block px-8 py-4 text-xl font-bold text-white bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-[0.98]"
        >
          Start Playing →
        </Link>
      </div>
    </div>
  );
}
