"use client";

import * as React from "react";
import { QuestForm } from "@/components/quest/quest-form";
import { QuestCard } from "@/components/quest/quest-card";
import { createQuest, getQuestsByDate, deleteQuest } from "@/lib/quests";
import { completeQuest, failQuest } from "@/lib/momentum";
import type { Quest, QuestRank } from "@/types";
import { ScrollTextIcon } from "lucide-react";
import { toast } from "sonner";
import { ReflectionModal } from "@/components/level/reflection-modal";

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

/** Format YYYY-MM-DD dari Date lokal. */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------

export default function QuestsPage() {
  const today = toDateString(new Date());

  const [quests, setQuests] = React.useState<Quest[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [reflectionLevel, setReflectionLevel] = React.useState<number | null>(null);

  // -- Fetch quests on mount & setiap kali ada perubahan
  const loadQuests = React.useCallback(async () => {
    const data = await getQuestsByDate(today);
    setQuests(data);
    setLoading(false);
  }, [today]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadQuests();
  }, [loadQuests]);

  // -- Handlers
  const handleCreateQuest = React.useCallback(
    async (data: { title: string; rank: QuestRank; points: number; isDaily?: boolean }) => {
      await createQuest({
        title: data.title,
        rank: data.rank,
        points: data.points,
        questDate: today,
        isDaily: data.isDaily,
      });
      await loadQuests();
    },
    [today, loadQuests]
  );

  const handleDeleteQuest = React.useCallback(
    async (questId: string) => {
      await deleteQuest(questId);
      await loadQuests();
    },
    [loadQuests]
  );

  const handleComplete = React.useCallback(async (questId: string) => {
    const res = await completeQuest(questId);
    await loadQuests();
    
    if (res.leveledUp) {
      setReflectionLevel(res.newLevel);
    } else {
      toast.success("Quest Selesai!", {
        description: "Momentum dan EXP kamu telah bertambah.",
      });
    }
  }, [loadQuests]);

  const handleFail = React.useCallback(async (questId: string) => {
    await failQuest(questId);
    await loadQuests();
    toast.error("Quest Gagal", {
      description: "Jangan menyerah, coba lagi besok!",
    });
  }, [loadQuests]);

  // -- Kelompokkan quest berdasarkan status
  const pendingQuests = quests.filter((q) => q.status === "pending");
  const completedQuests = quests.filter((q) => q.status === "completed");
  const failedQuests = quests.filter((q) => q.status === "failed");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Quest Hari Ini</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <QuestForm onSubmit={handleCreateQuest} />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
        </div>
      )}

      {/* Empty state */}
      {!loading && quests.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex items-center justify-center size-14 rounded-full bg-muted mb-4">
            <ScrollTextIcon className="size-7 text-muted-foreground" aria-hidden="true" />
          </div>
          <h2 className="text-base font-medium mb-1">Belum ada quest</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Klik &quot;Tambah Quest&quot; untuk membuat quest pertama hari ini.
          </p>
        </div>
      )}

      {/* Quest list */}
      {!loading && quests.length > 0 && (
        <div className="space-y-6">
          {/* Pending */}
          {pendingQuests.length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Aktif ({pendingQuests.length})
              </h2>
              <div className="space-y-2">
                {pendingQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onComplete={handleComplete}
                    onFail={handleFail}
                    onDelete={handleDeleteQuest}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Completed */}
          {completedQuests.length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Selesai ({completedQuests.length})
              </h2>
              <div className="space-y-2">
                {completedQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onDelete={handleDeleteQuest}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Failed */}
          {failedQuests.length > 0 && (
            <section>
              <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Gagal ({failedQuests.length})
              </h2>
              <div className="space-y-2">
                {failedQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onDelete={handleDeleteQuest}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <ReflectionModal 
        level={reflectionLevel} 
        onClose={() => setReflectionLevel(null)} 
      />
    </div>
  );
}
