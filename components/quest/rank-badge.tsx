"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { QuestRank } from "@/types";

// ---------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------

const rankBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-md font-mono font-bold border select-none",
  {
    variants: {
      rank: {
        E: "bg-muted/50 text-muted-foreground border-muted-foreground/30",
        D: "bg-blue-500/15 text-blue-400 border-blue-400/40",
        C: "bg-emerald-500/15 text-emerald-400 border-emerald-400/40",
        B: "bg-violet-500/15 text-violet-400 border-violet-400/40",
        A: "bg-amber-500/15 text-amber-400 border-amber-400/40",
        S: "bg-red-500/15 text-red-400 border-red-400/40",
      },
      size: {
        sm: "h-5 w-5 text-[10px]",
        md: "h-6 w-6 text-xs",
        lg: "h-8 w-8 text-sm",
      },
    },
    defaultVariants: { rank: "E", size: "md" },
  }
);

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export type RankBadgeProps = Omit<
  React.ComponentPropsWithoutRef<"span">,
  "children"
> &
  VariantProps<typeof rankBadgeVariants> & {
    rank: QuestRank;
  };

/**
 * Badge visual untuk rank quest E–S.
 * Selalu menampilkan huruf rank — warna sebagai penguat, bukan satu-satunya sinyal.
 */
export const RankBadge = React.forwardRef<HTMLSpanElement, RankBadgeProps>(
  ({ className, rank, size, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(rankBadgeVariants({ rank, size }), className)}
      aria-label={`Rank ${rank}`}
      {...props}
    >
      {rank}
    </span>
  )
);
RankBadge.displayName = "RankBadge";
