"use client";

import { Circle, Square, Triangle, Diamond, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const SHAPES = [Triangle, Diamond, Circle, Square];
const COLOR_CLASSES = [
  "bg-chart-1 hover:bg-chart-1/90",
  "bg-chart-3 hover:bg-chart-3/90",
  "bg-chart-5 hover:bg-chart-5/90",
  "bg-chart-4 hover:bg-chart-4/90 text-foreground",
];

export function AnswerButton({
  index,
  label,
  onClick,
  disabled,
  selected,
  reveal,
}: {
  index: number;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  selected?: boolean;
  /** Present once the answer is revealed: shows correct/wrong state + count. */
  reveal?: { isCorrect: boolean; count: number };
}) {
  const Shape = SHAPES[index % SHAPES.length];
  const colorClass = COLOR_CLASSES[index % COLOR_CLASSES.length];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "relative flex min-h-20 w-full items-center gap-3 rounded-xl px-5 py-4 text-left text-lg font-semibold text-white shadow-sm transition disabled:cursor-not-allowed",
        colorClass,
        reveal && !reveal.isCorrect && "opacity-40",
        selected && !reveal && "ring-4 ring-ring ring-offset-2",
        reveal?.isCorrect && "ring-4 ring-primary ring-offset-2",
      )}
    >
      <Shape className="size-6 shrink-0" fill="currentColor" />
      <span className="flex-1 break-words">{label}</span>
      {reveal && (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-black/15 px-2 py-1 text-sm">
          {reveal.isCorrect ? <Check className="size-4" /> : <X className="size-4" />}
          {reveal.count}
        </span>
      )}
    </button>
  );
}
