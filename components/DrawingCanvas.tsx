"use client";

import {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  type MouseEvent,
  type TouchEvent,
} from "react";

export interface DrawingCanvasHandle {
  getImageBase64: () => string;
  clear: () => void;
}

const COLORS = [
  "#000000",
  "#ffffff",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
];

const MAX_UNDO_STEPS = 20;

interface DrawingCanvasProps {
  onDrawingStart?: () => void;
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  function DrawingCanvas({ onDrawingStart }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSize, setBrushSize] = useState(4);
  const [brushColor, setBrushColor] = useState("#000000");
  const undoStack = useRef<ImageData[]>([]);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  const saveState = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current.push(imageData);
    if (undoStack.current.length > MAX_UNDO_STEPS) {
      undoStack.current.shift();
    }
  }, [getCtx]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    undoStack.current = [imageData];
  }, []);

  const getPosition = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const getTouchPosition = useCallback(
    (e: TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (x: number, y: number) => {
      const ctx = getCtx();
      if (!ctx) return;
      saveState();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      setIsDrawing(true);
      onDrawingStart?.();
    },
    [getCtx, saveState, brushColor, brushSize, onDrawingStart]
  );

  const draw = useCallback(
    (x: number, y: number) => {
      if (!isDrawing) return;
      const ctx = getCtx();
      if (!ctx) return;
      ctx.lineTo(x, y);
      ctx.stroke();
    },
    [isDrawing, getCtx]
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    const ctx = getCtx();
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  }, [isDrawing, getCtx]);

  const handleMouseDown = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const pos = getPosition(e);
      startDrawing(pos.x, pos.y);
    },
    [getPosition, startDrawing]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent<HTMLCanvasElement>) => {
      const pos = getPosition(e);
      draw(pos.x, pos.y);
    },
    [getPosition, draw]
  );

  const handleTouchStart = useCallback(
    (e: TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const pos = getTouchPosition(e);
      startDrawing(pos.x, pos.y);
    },
    [getTouchPosition, startDrawing]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const pos = getTouchPosition(e);
      draw(pos.x, pos.y);
    },
    [getTouchPosition, draw]
  );

  const handleUndo = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas || undoStack.current.length <= 1) return;
    undoStack.current.pop();
    const prevState = undoStack.current[undoStack.current.length - 1];
    ctx.putImageData(prevState, 0, 0);
  }, [getCtx]);

  const handleClear = useCallback(() => {
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    saveState();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, [getCtx, saveState]);

  useImperativeHandle(
    ref,
    () => ({
      getImageBase64: () => {
        const canvas = canvasRef.current;
        if (!canvas) return "";
        const dataUrl = canvas.toDataURL("image/png");
        return dataUrl.split(",")[1] || "";
      },
      clear: handleClear,
    }),
    [handleClear]
  );

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={stopDrawing}
        className="w-full max-w-[500px] aspect-square rounded-xl border-2 border-gray-200 cursor-crosshair bg-white shadow-inner touch-none"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setBrushColor(color)}
              className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                brushColor === color
                  ? "border-blue-500 scale-110 ring-2 ring-blue-300"
                  : "border-gray-300"
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">Size:</label>
          <input
            type="range"
            min={1}
            max={20}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-24 accent-blue-500"
          />
          <span className="text-sm text-gray-500 w-6 text-center">
            {brushSize}
          </span>
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleUndo}
            className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            ↩ Undo
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            ✕ Clear
          </button>
        </div>
      </div>
    </div>
  );
});

export type { DrawingCanvasProps };
export default DrawingCanvas;
