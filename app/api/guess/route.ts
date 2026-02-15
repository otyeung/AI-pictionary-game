import { NextRequest, NextResponse } from "next/server";
import { guessDrawing, OllamaError } from "@/lib/ollama";

interface GuessRequest {
  image?: string;
}

interface GuessResponse {
  guess: string;
  confidence: string;
  duration_ms: number;
}

interface ErrorResponse {
  error: string;
  code?: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<GuessResponse | ErrorResponse>> {
  try {
    let body: GuessRequest;
    try {
      body = (await request.json()) as GuessRequest;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    if (!body.image || typeof body.image !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'image' field. Expected base64 string." },
        { status: 400 }
      );
    }

    if (body.image.trim().length === 0) {
      return NextResponse.json(
        { error: "Image field cannot be empty" },
        { status: 400 }
      );
    }

    const result = await guessDrawing(body.image);

    return NextResponse.json<GuessResponse>(
      {
        guess: result.guess,
        confidence: result.confidence,
        duration_ms: result.duration_ms,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof OllamaError) {
      const statusCode = getStatusCodeForError(error.code);
      return NextResponse.json<ErrorResponse>(
        {
          error: error.message,
          code: error.code,
        },
        { status: statusCode }
      );
    }

    console.error("Unexpected error in /api/guess:", error);
    return NextResponse.json<ErrorResponse>(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function getStatusCodeForError(code: string): number {
  switch (code) {
    case "MODEL_NOT_FOUND":
      return 503; // Service Unavailable
    case "OLLAMA_SERVER_ERROR":
      return 503;
    case "TIMEOUT":
      return 504; // Gateway Timeout
    case "NETWORK_ERROR":
      return 503;
    case "INVALID_RESPONSE":
    case "INVALID_CONFIDENCE":
    case "EMPTY_GUESS":
      return 500;
    default:
      return 500;
  }
}
