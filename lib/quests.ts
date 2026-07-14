// =====================================================================
// Quest CRUD — Data Access Layer
// =====================================================================
// Fungsi dasar untuk membuat, membaca, dan menghapus quest.
// Belum menyentuh momentum/level — itu tanggung jawab lib/momentum.ts
// di Fase 2. Fungsi-fungsi di sini hanya bicara ke db.quests.
// =====================================================================

import { db, genId } from "@/lib/db";
import type { Quest, QuestRank } from "@/types";

// ---------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------

export interface CreateQuestInput {
  title: string;
  rank: QuestRank;
  points: number;
  questDate: string; // YYYY-MM-DD
  isDaily?: boolean;
}

/** Buat quest baru dengan status 'pending'. */
export async function createQuest(input: CreateQuestInput): Promise<Quest> {
  const questId = genId();
  const quest: Quest = {
    id: questId,
    title: input.title,
    rank: input.rank,
    points: input.points,
    status: "pending",
    questDate: input.questDate,
    isDaily: input.isDaily,
    originalQuestId: input.isDaily ? questId : undefined,
    createdAt: new Date().toISOString(),
  };

  await db.quests.add(quest);
  return quest;
}

// ---------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------

/** Generate quest harian yang belum ada untuk tanggal yang diminta. */
async function generateDailyQuestsForDate(date: string): Promise<void> {
  // Ambil semua quest yang isDaily = true dan merupakan template (id == originalQuestId)
  const allDailyQuests = await db.quests
    .filter((q) => q.isDaily === true && q.id === q.originalQuestId)
    .toArray();

  if (allDailyQuests.length === 0) return;

  // Cek quest yang sudah ada di tanggal ini untuk menghindari duplikasi clone
  const existingTodayQuests = await db.quests
    .where("questDate")
    .equals(date)
    .toArray();

  const existingOriginalIds = new Set(
    existingTodayQuests
      .filter((q) => q.isDaily === true && q.originalQuestId)
      .map((q) => q.originalQuestId)
  );

  const newQuests: Quest[] = [];
  const now = new Date().toISOString();

  for (const template of allDailyQuests) {
    // Jika quest hariannya dibuat di tanggal ini, template-nya sudah ada
    if (template.questDate === date) continue;

    // Jika belum ada clone-nya hari ini, buat clone
    if (template.originalQuestId && !existingOriginalIds.has(template.originalQuestId)) {
      newQuests.push({
        id: genId(),
        title: template.title,
        rank: template.rank,
        points: template.points,
        status: "pending",
        questDate: date,
        isDaily: true,
        originalQuestId: template.originalQuestId,
        createdAt: now,
      });
    }
  }

  if (newQuests.length > 0) {
    await db.quests.bulkAdd(newQuests);
  }
}

/** Ambil semua quest untuk tanggal tertentu (format YYYY-MM-DD). */
export async function getQuestsByDate(date: string): Promise<Quest[]> {
  await generateDailyQuestsForDate(date);
  return db.quests.where("questDate").equals(date).sortBy("createdAt");
}

/** Ambil semua quest, urutkan dari terbaru. */
export async function getAllQuests(): Promise<Quest[]> {
  return db.quests.orderBy("createdAt").reverse().toArray();
}

/** Ambil satu quest berdasarkan ID. */
export async function getQuestById(id: string): Promise<Quest | undefined> {
  return db.quests.get(id);
}

// ---------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------

/** Hapus quest berdasarkan ID. Jika ini daily quest, hapus semua kloningannya (permanen). */
export async function deleteQuest(id: string): Promise<void> {
  const quest = await db.quests.get(id);
  if (!quest) return;

  if (quest.isDaily && quest.originalQuestId) {
    // Hapus quest ini dan semua quest lain yang punya originalQuestId yang sama
    const relatedQuests = await db.quests
      .filter((q) => q.originalQuestId === quest.originalQuestId)
      .toArray();
    const idsToDelete = relatedQuests.map((q) => q.id);
    await db.quests.bulkDelete(idsToDelete);
  } else {
    // Quest biasa, hapus satu saja
    await db.quests.delete(id);
  }
}
