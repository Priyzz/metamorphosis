// =====================================================================
// Metamorphosis — Local-first Database (Dexie / IndexedDB)
// =====================================================================
// Menggantikan Supabase + Postgres. Karena app ini dipakai dari 1
// browser/device saja, semua data disimpan langsung di IndexedDB milik
// browser lewat Dexie — tidak ada auth, tidak ada network call, tidak
// ada RLS (karena memang cuma ada 1 "user": kamu).
//
// Entitas: quests, momentumHistory, journalEntries, themes, rewards,
//          rewardRedemptions, settings (1 baris tunggal untuk state
//          agregat: total_exp, momentum_score, current_level, config
//          decay & penalty, tema aktif).
//
// Kalau nanti app ini butuh multi-device/multi-user, migrasi ke
// Supabase/Postgres tinggal export semua tabel di bawah ini jadi JSON
// dan import ke skema `supabase/schema.sql` (struktur tabelnya sengaja
// dibuat semirip mungkin).
// =====================================================================

import Dexie, { type EntityTable } from "dexie";

// ---------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------

export type QuestRank = "E" | "D" | "C" | "B" | "A" | "S";
export type QuestStatus = "pending" | "completed" | "failed";
export type MomentumChangeReason =
  | "quest_completed"
  | "quest_failed_penalty"
  | "decay"
  | "manual_adjustment";

export interface Quest {
  id: string;
  title: string;
  rank: QuestRank;
  points: number; // diisi manual oleh user, harus > 0
  status: QuestStatus;
  questDate: string; // format YYYY-MM-DD, untuk tampilan "quest hari ini"
  createdAt: string; // ISO timestamp
  completedAt?: string; // diisi saat status berubah jadi completed/failed
}

export interface MomentumHistoryEntry {
  id: string;
  questId?: string;
  momentumDelta: number; // bisa negatif (decay/penalty)
  expDelta: number; // Total EXP tidak pernah berkurang, selalu >= 0
  reason: MomentumChangeReason;
  momentumAfter: number; // snapshot momentum setelah perubahan
  levelAfter: number; // snapshot level setelah perubahan
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  level: number; // level yang baru dicapai
  reflection: string;
  createdAt: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: Record<string, string>; // contoh: { primary: "#7c3aed", background: "#0f0f14" }
  unlockedAtLevel: number;
  createdAt: string;
}

export interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  isArchived: boolean; // soft-delete supaya histori redemption tetap valid
  createdAt: string;
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  rewardNameSnapshot: string; // snapshot nama reward saat ditukar
  pointsSpent: number;
  redeemedAt: string;
}

// Tabel settings cuma punya 1 baris (id selalu "singleton")
export interface Settings {
  id: "singleton";
  totalExp: number;
  momentumScore: number;
  currentLevel: number;

  decayGracePeriodDays: number;
  decayPercentage: number;
  lastQuestCompletedAt?: string;
  lastDecayAppliedAt?: string;

  penaltyEnabled: boolean;
  penaltyPercentage: number;

  activeThemeId?: string;
}

// ---------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------

class MetamorphosisDB extends Dexie {
  quests!: EntityTable<Quest, "id">;
  momentumHistory!: EntityTable<MomentumHistoryEntry, "id">;
  journalEntries!: EntityTable<JournalEntry, "id">;
  themes!: EntityTable<Theme, "id">;
  rewards!: EntityTable<Reward, "id">;
  rewardRedemptions!: EntityTable<RewardRedemption, "id">;
  settings!: EntityTable<Settings, "id">;

  constructor() {
    super("MetamorphosisDB");

    // String setelah nama tabel = index. Field pertama = primary key.
    this.version(1).stores({
      quests: "id, status, questDate, createdAt",
      momentumHistory: "id, questId, createdAt",
      journalEntries: "id, level, createdAt",
      themes: "id, unlockedAtLevel",
      rewards: "id, isArchived",
      rewardRedemptions: "id, rewardId, redeemedAt",
      settings: "id",
    });
  }
}

export const db = new MetamorphosisDB();

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

export const genId = (): string => crypto.randomUUID();

const DEFAULT_SETTINGS: Settings = {
  id: "singleton",
  totalExp: 0,
  momentumScore: 0,
  currentLevel: 1,
  decayGracePeriodDays: 3,
  decayPercentage: 10,
  penaltyEnabled: true,
  penaltyPercentage: 85,
};

/** Ambil settings; kalau belum ada (first run), buat dengan nilai default. */
export async function getSettings(): Promise<Settings> {
  const existing = await db.settings.get("singleton");
  if (existing) return existing;

  await db.settings.add(DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(
  patch: Partial<Omit<Settings, "id">>
): Promise<Settings> {
  await getSettings(); // pastikan row sudah ada
  await db.settings.update("singleton", patch);
  return (await db.settings.get("singleton")) as Settings;
}

/**
 * Formula sementara Momentum Score -> Level.
 * Kurva akar kuadrat: makin tinggi level, makin banyak momentum yang
 * dibutuhkan, supaya grinding 1 hari tidak melonjakkan level.
 * Sesuaikan saat tuning (lihat PRD §8).
 */
export function calculateLevel(momentum: number): number {
  if (momentum <= 0) return 1;
  return Math.floor(Math.sqrt(momentum / 10)) + 1;
}
