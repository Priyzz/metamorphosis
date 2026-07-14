import { db, getSettings } from "./db";
import type {
  Quest,
  MomentumHistoryEntry,
  JournalEntry,
  Theme,
  Reward,
  RewardRedemption,
  Settings,
} from "./db";

export interface BackupData {
  version: 1;
  exportedAt: string;
  quests: Quest[];
  momentumHistory: MomentumHistoryEntry[];
  journalEntries: JournalEntry[];
  themes: Theme[];
  rewards: Reward[];
  rewardRedemptions: RewardRedemption[];
  settings: Settings[];
}

/**
 * Export semua data dari IndexedDB menjadi satu objek JSON,
 * lalu men-download-nya sebagai file .json di browser.
 */
export async function exportAllData(): Promise<void> {
  const data: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    quests: await db.quests.toArray(),
    momentumHistory: await db.momentumHistory.toArray(),
    journalEntries: await db.journalEntries.toArray(),
    themes: await db.themes.toArray(),
    rewards: await db.rewards.toArray(),
    rewardRedemptions: await db.rewardRedemptions.toArray(),
    settings: await db.settings.toArray(),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `metamorphosis-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validasi dan import data dari file JSON backup.
 * PERINGATAN: akan menimpa semua data yang ada!
 */
export async function importData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString) as BackupData;

  // Validasi dasar
  if (!data.version || data.version !== 1) {
    throw new Error("Format backup tidak dikenali. Pastikan file berasal dari aplikasi Metamorphosis.");
  }

  if (!Array.isArray(data.quests) || !Array.isArray(data.settings)) {
    throw new Error("File backup rusak: tabel utama tidak ditemukan.");
  }

  // Hapus semua data lama lalu masukkan data baru dalam satu transaksi
  await db.transaction(
    "rw",
    [
      db.quests,
      db.momentumHistory,
      db.journalEntries,
      db.themes,
      db.rewards,
      db.rewardRedemptions,
      db.settings,
    ],
    async () => {
      // Bersihkan semua tabel
      await db.quests.clear();
      await db.momentumHistory.clear();
      await db.journalEntries.clear();
      await db.themes.clear();
      await db.rewards.clear();
      await db.rewardRedemptions.clear();
      await db.settings.clear();

      // Masukkan data dari backup
      if (data.quests.length > 0) await db.quests.bulkAdd(data.quests);
      if (data.momentumHistory.length > 0) await db.momentumHistory.bulkAdd(data.momentumHistory);
      if (data.journalEntries.length > 0) await db.journalEntries.bulkAdd(data.journalEntries);
      if (data.themes.length > 0) await db.themes.bulkAdd(data.themes);
      if (data.rewards.length > 0) await db.rewards.bulkAdd(data.rewards);
      if (data.rewardRedemptions.length > 0) await db.rewardRedemptions.bulkAdd(data.rewardRedemptions);
      if (data.settings.length > 0) await db.settings.bulkAdd(data.settings);
    }
  );
}

/**
 * Menghapus seluruh data dari IndexedDB (Reset total).
 * Data akan terhapus dan kembali ke pengaturan awal.
 */
export async function resetAllData(): Promise<void> {
  await db.transaction(
    "rw",
    [
      db.quests,
      db.momentumHistory,
      db.journalEntries,
      db.themes,
      db.rewards,
      db.rewardRedemptions,
      db.settings,
    ],
    async () => {
      await db.quests.clear();
      await db.momentumHistory.clear();
      await db.journalEntries.clear();
      await db.themes.clear();
      await db.rewards.clear();
      await db.rewardRedemptions.clear();
      await db.settings.clear();
    }
  );
  // Re-initialize pengaturan awal (akan membuat record "singleton" baru di db.settings)
  await getSettings();
}
