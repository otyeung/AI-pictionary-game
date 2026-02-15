/**
 * Ollama API client wrapper for AI Pictionary game
 * Uses the /api/chat endpoint with vision capabilities
 */

// Types for Ollama API requests
interface OllamaMessage {
  role: 'user' | 'assistant'
  content: string
  images?: string[]
}

interface OllamaRequestOptions {
  temperature: number
  num_predict: number
}

interface OllamaRequest {
  model: string
  messages: OllamaMessage[]
  stream: false
  options: OllamaRequestOptions
  keep_alive: string
}

// Types for Ollama API responses
interface OllamaResponseMessage {
  role: 'assistant'
  content: string
}

interface OllamaResponse {
  model: string
  message?: OllamaResponseMessage
  response?: string
  done?: boolean
  total_duration?: number // nanoseconds
}

interface OllamaErrorResponse {
  error: string
}

// Types for our application
export interface GuessResult {
  guess: string
  confidence: 'high' | 'medium' | 'low'
  duration_ms: number
}

export class OllamaError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'OllamaError'
  }
}

/**
 * Strip data URI prefix from base64 string if present
 * Handles: data:image/png;base64,... → raw base64
 */
function stripDataUriPrefix(base64: string): string {
  const dataUriRegex = /^data:[^;]+;base64,/
  return base64.replace(dataUriRegex, '')
}

/**
 * Guess what is drawn in an image using Ollama vision model
 * @param base64Image - Base64 encoded image (with or without data URI prefix)
 * @returns GuessResult with guess, confidence, and duration
 */
export async function guessDrawing(base64Image: string): Promise<GuessResult> {
  const cleanBase64 = stripDataUriPrefix(base64Image)

  const prompt = `You are an expert at identifying drawings and sketches. Look at the image and guess what object or thing has been drawn.

Respond with EXACTLY two lines:
1. First line: The single word or short phrase of what is drawn (e.g., "cat", "house", "tree")
2. Second line: Your confidence level as one word - either "high", "medium", or "low"

Do not include any other text, explanation, or punctuation. Just the guess and confidence level.`

  const request: OllamaRequest = {
    model: 'qwen3-vl',
    messages: [
      {
        role: 'user',
        content: prompt,
        images: [cleanBase64],
      },
    ],
    stream: false,
    options: {
      temperature: 0.3,
      num_predict: 200,
    },
    keep_alive: '15m',
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 120s timeout

    const response = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMessage = `Ollama API returned status ${response.status}`
      try {
        const errorData = (await response.json()) as OllamaErrorResponse
        if (errorData.error) {
          errorMessage = errorData.error
        }
      } catch {
        // If we can't parse error response, use default message
      }

      if (response.status === 404) {
        throw new OllamaError(
          'MODEL_NOT_FOUND',
          `Ollama model 'qwen3-vl' not found: ${errorMessage}`,
        )
      } else if (response.status === 500) {
        throw new OllamaError(
          'OLLAMA_SERVER_ERROR',
          `Ollama server error: ${errorMessage}`,
        )
      } else {
        throw new OllamaError(
          'OLLAMA_API_ERROR',
          `Ollama API error: ${errorMessage}`,
        )
      }
    }

    const data = (await response.json()) as OllamaResponse
    const rawContent = extractResponseContent(data)
    const duration_ms = Math.round((data.total_duration ?? 0) / 1_000_000)

    if (!rawContent) {
      return {
        guess: 'unclear',
        confidence: 'low',
        duration_ms,
      }
    }

    // Parse the response: expecting "guess\nconfidence"
    // The AI may include extra text, thinking markers, etc. — be forgiving.
    const lines = rawContent
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
    const guess = extractGuess(lines)

    // Search all lines for a confidence keyword, default to "medium" if not found
    const confidence = extractConfidence(lines) || 'medium'

    if (!guess) {
      throw new OllamaError('EMPTY_GUESS', 'Ollama returned empty guess')
    }

    return {
      guess,
      confidence,
      duration_ms,
    }
  } catch (error) {
    // Re-throw OllamaError as-is
    if (error instanceof OllamaError) {
      throw error
    }

    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new OllamaError(
        'TIMEOUT',
        'Ollama API request timed out after 120 seconds',
      )
    }

    // Handle network errors
    if (error instanceof TypeError) {
      throw new OllamaError(
        'NETWORK_ERROR',
        `Failed to connect to Ollama API: ${error.message}`,
      )
    }

    // Unexpected error
    throw new OllamaError(
      'UNKNOWN_ERROR',
      `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function extractResponseContent(data: OllamaResponse): string {
  const messageContent = data.message?.content?.trim() ?? ''
  if (messageContent) return messageContent

  const fallbackResponse = data.response?.trim() ?? ''
  if (fallbackResponse) return fallbackResponse

  return ''
}

function extractGuess(lines: string[]): string {
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (
      lower.includes('high') ||
      lower.includes('medium') ||
      lower.includes('low')
    ) {
      continue
    }

    const cleaned = line
      .replace(/^guess\s*[:\-]\s*/i, '')
      .replace(/^answer\s*[:\-]\s*/i, '')
      .replace(/^it\s+is\s+/i, '')
      .trim()

    if (cleaned) {
      return cleaned
    }
  }

  return ''
}

function extractConfidence(lines: string[]): 'high' | 'medium' | 'low' | null {
  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('high')) return 'high'
    if (lower.includes('medium')) return 'medium'
    if (lower.includes('low')) return 'low'
  }
  return null
}
