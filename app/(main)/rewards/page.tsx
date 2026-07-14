"use client";

import * as React from "react";
import { RewardForm } from "@/components/reward/reward-form";
import { RewardCard } from "@/components/reward/reward-card";
import { createReward, getActiveRewards, archiveReward, redeemReward } from "@/lib/rewards";
import { getSettings } from "@/lib/db";
import type { Reward } from "@/lib/db";
import { CoinsIcon, GiftIcon } from "lucide-react";
import { toast } from "sonner";

export default function RewardsPage() {
  const [rewards, setRewards] = React.useState<Reward[]>([]);
  const [coins, setCoins] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    const activeRewards = await getActiveRewards();
    const settings = await getSettings();
    setRewards(activeRewards);
    setCoins(settings.coins || 0);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  const handleCreateReward = async (data: { name: string; pointsCost: number }) => {
    await createReward(data.name, data.pointsCost);
    await loadData();
    toast.success("Reward berhasil ditambahkan!");
  };

  const handleArchive = async (rewardId: string) => {
    await archiveReward(rewardId);
    await loadData();
    toast.info("Reward telah dihapus.");
  };

  const handleRedeem = async (rewardId: string) => {
    try {
      await redeemReward(rewardId);
      await loadData();
      toast.success("Berhasil menukar reward!", {
        description: "Selamat menikmati hadiahmu!",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error("Gagal", {
        description: errorMessage,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="size-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reward Shop</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tukarkan koin yang Anda kumpulkan dengan hadiah!
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg">
            <CoinsIcon className="size-5 text-amber-600" />
            <span className="font-bold text-amber-600 text-lg">{coins} Koin</span>
          </div>
          <RewardForm onSubmit={handleCreateReward} />
        </div>
      </div>

      {/* Reward List */}
      {rewards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border rounded-xl shadow-sm">
          <div className="flex items-center justify-center size-16 rounded-full bg-muted mb-4">
            <GiftIcon className="size-8 text-muted-foreground" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-medium mb-1.5">Toko Masih Kosong</h2>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Anda belum menambahkan reward apapun. Mulai tambahkan reward untuk memotivasi diri Anda!
          </p>
          <RewardForm onSubmit={handleCreateReward} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <RewardCard
              key={reward.id}
              reward={reward}
              userCoins={coins}
              onRedeem={handleRedeem}
              onArchive={handleArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
