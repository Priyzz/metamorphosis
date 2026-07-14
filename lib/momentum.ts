import { db, genId, getSettings, type Settings } from "@/lib/db";
import { calculateLevel } from "@/lib/level";
import { getQuestsByDate } from "@/lib/quests";
import { checkAndUnlockThemes } from "@/lib/themes";
import type { Quest, QuestRank } from "@/types";

export const RANK_EXP: Record<QuestRank, number> = {
  S: 100,
  A: 50,
  B: 30,
  C: 20,
  D: 10,
  E: 5,
};

/**
 * Tandai quest sebagai 'completed'.
 * Akan menambah momentumScore dan totalExp, lalu mencatat ke histori.
 */
export async function completeQuest(questId: string): Promise<{ leveledUp: boolean; newLevel: number }> {
  let leveledUp = false;
  let newLevel = 1;

  await db.transaction(
    "rw",
    [db.quests, db.settings, db.momentumHistory, db.themes],
    async () => {
      const quest = await db.quests.get(questId);
      if (!quest) throw new Error("Quest not found");
      if (quest.status !== "pending") throw new Error("Quest is not pending");

      const settings = await getSettings();

      // 1. Update quest status
      await db.quests.update(questId, {
        status: "completed",
        completedAt: new Date().toISOString(),
      });

      // 2. Kalkulasi momentum & exp baru
      const expGained = RANK_EXP[quest.rank];
      const coinsGained = quest.points;
      
      const newMomentum = settings.momentumScore + expGained;
      const newExp = settings.totalExp + expGained;
      const newCoins = (settings.coins || 0) + coinsGained;
      
      newLevel = calculateLevel(newMomentum);
      if (newLevel > settings.currentLevel) {
        leveledUp = true;
        // Pengecekan unlock tema baru jika kelipatan 5
        await checkAndUnlockThemes(settings.currentLevel, newLevel);
      }

      // 3. Update settings
      await db.settings.update("singleton", {
        momentumScore: newMomentum,
        totalExp: newExp,
        currentLevel: newLevel,
        coins: newCoins,
        lastQuestCompletedAt: new Date().toISOString(),
      });

      // 4. Catat histori
      await db.momentumHistory.add({
        id: genId(),
        questId: quest.id,
        momentumDelta: expGained,
        expDelta: expGained,
        reason: "quest_completed",
        momentumAfter: newMomentum,
        levelAfter: newLevel,
        createdAt: new Date().toISOString(),
      });
    }
  );

  return { leveledUp, newLevel };
}

/**
 * Tandai quest sebagai 'failed'.
 * Jika penaltyEnabled = true, kurangi momentumScore sesuai persentase.
 */
export async function failQuest(questId: string): Promise<void> {
  await db.transaction(
    "rw",
    [db.quests, db.settings, db.momentumHistory],
    async () => {
      const quest = await db.quests.get(questId);
      if (!quest) throw new Error("Quest not found");
      if (quest.status !== "pending") throw new Error("Quest is not pending");

      const settings = await getSettings();

      // 1. Update quest status
      await db.quests.update(questId, {
        status: "failed",
        completedAt: new Date().toISOString(),
      });

      // 2. Kalkulasi penalti (sekarang memotong koin berdasarkan poin quest, koin minimum 0)
      let penalty = 0;
      if (settings.penaltyEnabled) {
        penalty = Math.floor((quest.points * settings.penaltyPercentage) / 100);
      }

      const newCoins = Math.max(0, (settings.coins || 0) - penalty);

      // 3. Update settings (momentum & level tidak berubah jika gagal)
      await db.settings.update("singleton", {
        coins: newCoins,
        // Jangan update lastQuestCompletedAt karena gagal tidak me-reset periode inaktif
      });

      // 4. Catat histori (momentum tidak berubah, tapi kita catat reason failed)
      await db.momentumHistory.add({
        id: genId(),
        questId: quest.id,
        momentumDelta: 0,
        expDelta: 0,
        reason: "quest_failed_penalty",
        momentumAfter: settings.momentumScore,
        levelAfter: settings.currentLevel,
        createdAt: new Date().toISOString(),
      });
    }
  );
}

/**
 * Hitung hari di antara dua tanggal (hanya selisih kalender, hiraukan jam).
 */
export function getDaysDifference(date1: Date, date2: Date): number {
  const d1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const d2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate());
  // Selisih dalam milidetik diubah ke hari
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Cek dan terapkan penurunan skor (decay) karena inaktivitas.
 * Fungsi ini idealnya dipanggil sekali tiap sesi (saat dashboard di-load).
 */
export async function checkAndApplyDecay(): Promise<void> {
  await db.transaction(
    "rw",
    [db.settings, db.momentumHistory],
    async () => {
      const settings = await db.settings.get("singleton");
      if (!settings) return;

      const now = new Date();

      // Jika belum pernah komplit quest sama sekali, tidak ada decay.
      if (!settings.lastQuestCompletedAt) return;

      const lastActive = new Date(settings.lastQuestCompletedAt);
      const daysSinceActive = getDaysDifference(lastActive, now);

      if (daysSinceActive <= settings.decayGracePeriodDays) {
        // Masih dalam grace period
        return;
      }

      // Tentukan mulai kapan decay dihitung
      // Jika sebelumnya sudah pernah di-decay, hitung sejak decay terakhir.
      // Jika belum pernah, hitung sejak akhir grace period.
      const decayStartBase = settings.lastDecayAppliedAt
        ? new Date(settings.lastDecayAppliedAt)
        : new Date(lastActive.getTime() + settings.decayGracePeriodDays * 24 * 60 * 60 * 1000);

      const missedDaysToPenalize = getDaysDifference(decayStartBase, now);

      if (missedDaysToPenalize <= 0 || settings.momentumScore <= 0) {
        return; // Sudah pernah diaplikasikan decay untuk hari ini atau momentum sudah 0
      }

      // Hitung persentase penurunan secara majemuk
      // Rumus: S_new = S_old * (1 - rate)^n
      const rate = settings.decayPercentage / 100;
      let newMomentum = settings.momentumScore * Math.pow(1 - rate, missedDaysToPenalize);
      
      // Bulatkan ke bawah agar angka integer rapi
      newMomentum = Math.floor(newMomentum);

      if (newMomentum < 0) newMomentum = 0;

      const momentumDelta = newMomentum - settings.momentumScore; // Bernilai negatif
      const newLevel = calculateLevel(newMomentum);

      // Update settings
      await db.settings.update("singleton", {
        momentumScore: newMomentum,
        currentLevel: newLevel,
        lastDecayAppliedAt: now.toISOString(),
      });

      // Catat histori
      await db.momentumHistory.add({
        id: genId(),
        momentumDelta: momentumDelta, // negatif
        expDelta: 0,
        reason: "decay",
        momentumAfter: newMomentum,
        levelAfter: newLevel,
        createdAt: now.toISOString(),
      });
    }
  );
}

export interface DashboardSummary {
  settings: Settings;
  todayQuests: Quest[];
  completedCount: number;
  failedCount: number;
  pendingCount: number;
}

/**
 * Mengambil rangkuman data untuk halaman Dashboard, termasuk memicu pengecekan decay.
 */
export async function getDashboardSummary(date: string): Promise<DashboardSummary> {
  // Pastikan decay sudah diaplikasikan sebelum kita ambil data terbaru
  await checkAndApplyDecay();

  const settings = await getSettings();
  const todayQuests = await getQuestsByDate(date);

  let completedCount = 0;
  let failedCount = 0;
  let pendingCount = 0;

  for (const q of todayQuests) {
    if (q.status === "completed") completedCount++;
    else if (q.status === "failed") failedCount++;
    else pendingCount++;
  }

  return {
    settings,
    todayQuests,
    completedCount,
    failedCount,
    pendingCount,
  };
}
