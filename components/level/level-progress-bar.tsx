"use client";

import * as React from "react";
import { Progress } from "@/components/ui/progress";
import { calculateLevelProgress } from "@/lib/level";

interface LevelProgressBarProps {
  momentumScore: number;
}

export function LevelProgressBar({ momentumScore }: LevelProgressBarProps) {
  const progress = calculateLevelProgress(momentumScore);

  return (
    <div className="w-full bg-card border rounded-xl p-6 space-y-5 shadow-sm relative overflow-hidden">
      {/* Decorative background element */}
      <div className="absolute top-0 right-0 -mr-12 -mt-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 relative z-10">
        <div>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Current Level
          </h2>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-black tracking-tighter text-foreground">
              {progress.currentLevel}
            </span>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-sm font-semibold">
            {progress.pointsToNextLevel} pts
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            menuju Level {progress.currentLevel + 1}
          </p>
        </div>
      </div>

      <div className="space-y-2.5 relative z-10">
        <Progress 
          value={progress.percentage} 
          className="h-3.5 bg-primary/20"
        />
        <div className="flex justify-between text-xs font-mono text-muted-foreground">
          <span>{progress.currentMomentum} total pts</span>
          <span>{progress.momentumNext} pts target</span>
        </div>
      </div>
    </div>
  );
}
