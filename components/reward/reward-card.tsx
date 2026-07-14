"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2Icon, CoinsIcon } from "lucide-react";
import type { Reward } from "@/lib/db";

interface RewardCardProps {
  reward: Reward;
  userCoins: number;
  onRedeem: (rewardId: string) => Promise<void>;
  onArchive: (rewardId: string) => Promise<void>;
}

export function RewardCard({ reward, userCoins, onRedeem, onArchive }: RewardCardProps) {
  const [isRedeeming, setIsRedeeming] = React.useState(false);
  const canAfford = userCoins >= reward.pointsCost;

  const handleRedeem = async () => {
    if (!canAfford || isRedeeming) return;
    try {
      setIsRedeeming(true);
      await onRedeem(reward.id);
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all duration-200 hover:shadow-md border-border/60">
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight text-foreground">
            {reward.name}
          </h3>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onArchive(reward.id)}
            className="text-muted-foreground hover:text-destructive shrink-0 -mt-1 -mr-1"
            title="Hapus Reward"
          >
            <Trash2Icon className="size-4" />
          </Button>
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 font-medium text-sm">
          <CoinsIcon className="size-4" />
          <span>{reward.pointsCost} Koin</span>
        </div>
      </div>
      <div className="p-3 bg-muted/30 border-t border-border/50">
        <Button
          onClick={handleRedeem}
          disabled={!canAfford || isRedeeming}
          className="w-full font-medium"
          variant={canAfford ? "default" : "secondary"}
        >
          {isRedeeming ? "Menukarkan..." : canAfford ? "Redeem" : "Koin Tidak Cukup"}
        </Button>
      </div>
    </Card>
  );
}
