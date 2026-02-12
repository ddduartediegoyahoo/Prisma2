"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRating({ value, onChange, disabled = false }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => {
            if (disabled) return;
            onChange(star === value ? 0 : star);
          }}
          disabled={disabled}
          className={cn(
            "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-0.5",
            disabled && "cursor-default opacity-70"
          )}
          aria-label={`${star} estrela${star > 1 ? "s" : ""}`}
        >
          <Star
            className={cn(
              "h-5 w-5 transition-colors",
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-transparent text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}
