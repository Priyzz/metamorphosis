"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RankBadge } from "@/components/quest/rank-badge";
import {
  CheckCircle2Icon,
  XCircleIcon,
  Trash2Icon,
  ZapIcon,
  RepeatIcon,
} from "lucide-react";
import type { Quest } from "@/types";

// ---------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------

export interface QuestCardProps {
  quest: Quest;
  /** Callback saat user klik "Selesai". Belum berfungsi penuh di Fase 1. */
  onComplete?: (questId: string) => void | Promise<void>;
  /** Callback saat user klik "Gagal". Belum berfungsi penuh di Fase 1. */
  onFail?: (questId: string) => void | Promise<void>;
  /** Callback saat user klik hapus. */
  onDelete?: (questId: string) => void | Promise<void>;
  className?: string;
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export function QuestCard({
  quest,
  onComplete,
  onFail,
  onDelete,
  className,
}: QuestCardProps) {
  const isPending = quest.status === "pending";
  const isCompleted = quest.status === "completed";
  const isFailed = quest.status === "failed";

  return (
    <Card
      className={cn(
        "relative transition-all duration-200",
        isCompleted && "opacity-70",
        isFailed && "opacity-60",
        className
      )}
      size="sm"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        {/* Rank badge */}
        <RankBadge rank={quest.rank} size="lg" className="mt-0.5 shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3
              className={cn(
                "text-sm font-medium leading-snug truncate",
                isCompleted && "line-through text-muted-foreground",
                isFailed && "line-through text-muted-foreground"
              )}
            >
              {quest.title}
            </h3>
          </div>

          {/* Points & status */}
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-xs font-mono text-muted-foreground">
              <ZapIcon className="size-3" aria-hidden="true" />
              {quest.points} pts
            </span>

            {quest.isDaily && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded">
                <RepeatIcon className="size-3" aria-hidden="true" />
                Harian
              </span>
            )}

            {isCompleted && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                <CheckCircle2Icon className="size-3" aria-hidden="true" />
                Selesai
              </span>
            )}

            {isFailed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                <XCircleIcon className="size-3" aria-hidden="true" />
                Gagal
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {isPending && (
            <>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onComplete?.(quest.id)}
                aria-label="Tandai selesai"
                id={`complete-quest-${quest.id}`}
                className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
              >
                <CheckCircle2Icon className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => onFail?.(quest.id)}
                aria-label="Tandai gagal"
                id={`fail-quest-${quest.id}`}
                className="text-destructive hover:bg-destructive/10"
              >
                <XCircleIcon className="size-4" />
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onDelete?.(quest.id)}
            aria-label="Hapus quest"
            id={`delete-quest-${quest.id}`}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

QuestCard.displayName = "QuestCard";
