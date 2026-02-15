# AGENTS.md

> Guidance for AI coding agents operating in this repository.

## Project Overview

AI Pictionary game built with Next.js 16 (App Router), React 19, TypeScript 5, and Tailwind CSS 4. Users draw on a canvas and a local Ollama vision model (qwen3-vl) guesses what was drawn.

## Build / Dev / Lint Commands

```bash
npm run dev          # Start dev server (next dev)
npm run build        # Production build (next build)
npm run start        # Start production server (next start)
npm run lint         # Run ESLint (eslint)
```

No test framework is configured. There are no test files. If adding tests, use the Next.js-recommended approach (Jest + React Testing Library or Vitest).

## Project Structure

```
app/
  layout.tsx          # Root layout (Geist fonts, global CSS)
  page.tsx            # Home/landing page (server component)
  globals.css         # Tailwind imports + CSS custom properties
  game/
    page.tsx          # Main game page (client component)
  api/
    guess/
      route.ts        # POST /api/guess - sends drawing to Ollama
components/
  DrawingCanvas.tsx   # Canvas with drawing tools (forwardRef)
  GameControls.tsx    # Word display + submit/new-word buttons
  GuessDisplay.tsx    # Renders AI guess history
lib/
  ollama.ts           # Ollama API client (types, fetch wrapper, error handling)
```

## TypeScript Configuration

- **Strict mode**: Enabled (`"strict": true`)
- **Path aliases**: `@/*` maps to project root (e.g., `@/components/DrawingCanvas`)
- **Target**: ES2017
- **Module resolution**: Bundler
- **JSX**: react-jsx

## Code Style

### Formatting

- 2-space indentation
- Double quotes for strings (enforced by ESLint via next config)
- Semicolons: yes
- Trailing commas in multi-line constructs
- Max line length ~100-120 chars (not strictly enforced)

### Imports

- **Order**: External packages first, then local imports (no blank line separator used)
- **Path aliases**: Always use `@/` for cross-directory imports (e.g., `@/components/...`, `@/lib/...`)
- **Relative imports**: Only for same-directory files (e.g., `./globals.css`)
- **Type imports**: Use `import type { X }` for type-only imports (e.g., `import type { Metadata } from "next"`)
- **Inline type imports**: Use `type` keyword inside braces when mixing values and types: `import DrawingCanvas, { type DrawingCanvasHandle } from "@/components/DrawingCanvas"`

### Components

- **Functional components only** using `function` keyword (not arrow functions)
- **Default exports** for page/layout components and UI components
- **Named exports** for utility functions and types alongside the default (e.g., `getRandomWord`, `Guess`)
- **`"use client"`** directive at top of file for any component using hooks, state, or browser APIs
- **Server components** by default (no directive needed) - e.g., `app/page.tsx`
- **forwardRef pattern**: Named function inside `forwardRef` for DevTools clarity:
  ```tsx
  const DrawingCanvas = forwardRef<Handle>(function DrawingCanvas(_props, ref) { ... });
  export default DrawingCanvas;
  ```
- **Props**: Defined as `interface` directly above the component, named `{ComponentName}Props`

### Types & Interfaces

- **`interface`** for object shapes and component props (not `type`)
- **`type`** for unions and simple aliases (e.g., `"high" | "medium" | "low"`)
- **Co-located**: Types live in the same file as their component/module, exported alongside
- **No separate type files** - types are defined where they're used
- **Explicit return types** on API/library functions (`Promise<GuessResult>`)
- **Inline typing** for simple state: `useState<string | null>(null)`

### Naming Conventions

- **Files**: PascalCase for components (`DrawingCanvas.tsx`), camelCase for utilities (`ollama.ts`)
- **Components**: PascalCase (`GameControls`, `GuessDisplay`)
- **Interfaces**: PascalCase, no `I` prefix (`GuessResult`, `GameControlsProps`)
- **Functions**: camelCase (`guessDrawing`, `getRandomWord`, `handleSubmit`)
- **Constants**: SCREAMING_SNAKE_CASE for module-level constants (`WORD_LIST`, `COLORS`, `MAX_UNDO_STEPS`)
- **Event handlers**: `handle` prefix for component handlers (`handleMouseDown`, `handleClear`)
- **CSS classes**: Tailwind utility classes inline, no CSS modules

### Error Handling

- **Custom error classes**: Extend `Error` with a `code` property (see `OllamaError`)
- **API routes**: Return typed `NextResponse<SuccessType | ErrorType>` with appropriate HTTP status codes
- **Client-side**: `try/catch` with error state (`useState<string | null>`) displayed in UI
- **Catch blocks**: Empty `catch {}` only when error is intentionally swallowed (e.g., parsing fallback)
- **Error re-throwing**: Re-throw known error types, wrap unknown errors with context
- **Timeouts**: Use `AbortController` with `setTimeout` for fetch requests

### Hooks & State

- **`useCallback`** for all event handlers and functions passed as props or used in dependency arrays
- **`useRef`** for DOM elements and mutable state that shouldn't trigger re-renders (undo stack)
- **`useImperativeHandle`** to expose component methods via ref
- **`useState` with initializer**: Lazy initialization via callback (`useState(() => getRandomWord())`)

### Styling

- **Tailwind CSS 4** with `@import "tailwindcss"` syntax (not `@tailwind` directives)
- **Utility-first**: All styling via Tailwind classes inline in JSX
- **No CSS modules**, no styled-components, no CSS-in-JS
- **Gradients**: Used heavily for branding (`bg-gradient-to-r from-blue-500 to-purple-600`)
- **Responsive**: Grid layouts with breakpoint variants (`grid-cols-1 lg:grid-cols-[1fr_340px]`)
- **Interactive states**: `hover:`, `disabled:`, `active:scale-[0.98]` for micro-interactions
- **CSS custom properties**: Defined in `globals.css` `:root` for theme colors

### API Routes (App Router)

- Export named HTTP method functions (`POST`, `GET`, etc.)
- Validate request body with explicit type checks (not a validation library)
- Return `NextResponse.json<Type>(data, { status })` with generic type parameter
- Map error codes to HTTP status codes via helper functions
- Log unexpected errors with `console.error`

## ESLint

Flat config (`eslint.config.mjs`) using:
- `eslint-config-next/core-web-vitals`
- `eslint-config-next/typescript`

No custom rules. No Prettier config (formatting via ESLint defaults).

## External Dependencies

- **Ollama** must be running locally at `http://localhost:11434` with the `qwen3-vl` model pulled
- No environment variables required (Ollama URL is hardcoded in `lib/ollama.ts`)

## Do NOT

- Add `as any`, `@ts-ignore`, or `@ts-expect-error`
- Use arrow functions for component declarations
- Create separate type definition files (co-locate types)
- Use CSS modules or CSS-in-JS libraries (use Tailwind)
- Add `"use client"` to server components unnecessarily
- Suppress ESLint warnings
