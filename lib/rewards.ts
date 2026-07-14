import { db, genId, getSettings } from "./db";
import type { Reward } from "./db";

export async function createReward(name: string, pointsCost: number): Promise<void> {
  await db.rewards.add({
    id: genId(),
    name,
    pointsCost,
    isArchived: false,
    createdAt: new Date().toISOString(),
  });
}

export async function getActiveRewards(): Promise<Reward[]> {
  const allRewards = await db.rewards.toArray();
  // Filter yang belum diarchive dan urutkan terbaru di atas
  return allRewards
    .filter((r) => !r.isArchived)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function archiveReward(rewardId: string): Promise<void> {
  await db.rewards.update(rewardId, { isArchived: true });
}

export async function redeemReward(rewardId: string): Promise<void> {
  await db.transaction("rw", [db.rewards, db.settings, db.rewardRedemptions], async () => {
    const reward = await db.rewards.get(rewardId);
    if (!reward) throw new Error("Reward not found");
    if (reward.isArchived) throw new Error("Reward is archived");

    const settings = await getSettings();
    if ((settings.coins || 0) < reward.pointsCost) {
      throw new Error("Koin tidak cukup");
    }

    const newCoins = (settings.coins || 0) - reward.pointsCost;

    // Kurangi koin
    await db.settings.update("singleton", { coins: newCoins });

    // Catat histori penukaran
    await db.rewardRedemptions.add({
      id: genId(),
      rewardId: reward.id,
      rewardNameSnapshot: reward.name,
      pointsSpent: reward.pointsCost,
      redeemedAt: new Date().toISOString(),
    });
  });
}
