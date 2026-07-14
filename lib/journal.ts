import { db, genId } from "./db";
import type { JournalEntry } from "./db";

export async function saveJournalEntry(level: number, reflection: string): Promise<void> {
  await db.journalEntries.add({
    id: genId(),
    level,
    reflection,
    createdAt: new Date().toISOString(),
  });
}

export async function getJournalEntries(): Promise<JournalEntry[]> {
  const entries = await db.journalEntries.toArray();
  // Urutkan dari yang terbaru
  return entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
