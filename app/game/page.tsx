'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import DrawingCanvas, {
  type DrawingCanvasHandle,
} from '@/components/DrawingCanvas'
import GuessDisplay, { type Guess } from '@/components/GuessDisplay'
import GameControls, { getRandomWord } from '@/components/GameControls'

const TIMER_DURATION = 20

export default function GamePage() {
  const canvasRef = useRef<DrawingCanvasHandle>(null)
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentWord, setCurrentWord] = useState('cat')
  const [error, setError] = useState<string | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasTimerStarted = useRef(false)
  const hasSubmittedOnTimeout = useRef(false)

  useEffect(() => {
    setCurrentWord(getRandomWord())
  }, [])

  const handleSubmit = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const base64Image = canvas.getImageBase64()
    if (!base64Image) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Something went wrong')
        return
      }

      setGuesses((prev) => [
        {
          guess: data.guess,
          confidence: data.confidence,
          duration_ms: data.duration_ms,
          timestamp: new Date(),
        },
        ...prev,
      ])
    } catch {
      setError('Failed to connect. Is the server running?')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const resetTimer = useCallback(() => {
    stopTimer()
    setTimeRemaining(null)
    hasTimerStarted.current = false
    hasSubmittedOnTimeout.current = false
  }, [stopTimer])

  const handleNewWord = useCallback(() => {
    setCurrentWord(getRandomWord())
    setGuesses([])
    setError(null)
    resetTimer()
    canvasRef.current?.clear()
  }, [resetTimer])

  const handleDrawingStart = useCallback(() => {
    if (hasTimerStarted.current) return
    hasTimerStarted.current = true
    setTimeRemaining(TIMER_DURATION)

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  useEffect(() => {
    if (timeRemaining === 0 && !hasSubmittedOnTimeout.current) {
      hasSubmittedOnTimeout.current = true
      handleSubmit()
    }
  }, [timeRemaining, handleSubmit])

  useEffect(() => {
    return () => stopTimer()
  }, [stopTimer])

  return (
    <div className='min-h-screen bg-gradient-to-b from-gray-50 to-white'>
      <header className='py-6 text-center'>
        <h1 className='text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
          🎨 AI Pictionary
        </h1>
        <p className='text-gray-500 mt-1'>Draw it. AI guesses it.</p>
      </header>

      <main className='max-w-5xl mx-auto px-4 pb-12'>
        <div className='grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6'>
          <div className='flex flex-col gap-4'>
            <GameControls
              onSubmit={handleSubmit}
              onNewWord={handleNewWord}
              isLoading={isLoading}
              currentWord={currentWord}
              timeRemaining={timeRemaining}
            />
            <DrawingCanvas
              ref={canvasRef}
              onDrawingStart={handleDrawingStart}
            />
          </div>

          <div className='flex flex-col gap-3'>
            <h2 className='text-lg font-bold text-gray-700'>AI Guesses</h2>

            {error && (
              <div className='p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm'>
                {error}
              </div>
            )}

            <GuessDisplay guesses={guesses} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  )
}
