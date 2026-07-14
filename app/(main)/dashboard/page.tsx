"use client";

import * as React from "react";
import { LevelProgressBar } from "@/components/level/level-progress-bar";
import { getDashboardSummary, type DashboardSummary, completeQuest, failQuest } from "@/lib/momentum";
import { QuestCard } from "@/components/quest/quest-card";
import { ReflectionModal } from "@/components/level/reflection-modal";
import { deleteQuest } from "@/lib/quests";
import { ScrollTextIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DashboardPage() {
  const today = React.useMemo(() => toDateString(new Date()), []);
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [reflectionLevel, setReflectionLevel] = React.useState<number | null>(null);

  const loadDashboard = React.useCallback(async () => {
    const data = await getDashboardSummary(today);
    setSummary(data);
    setLoading(false);
  }, [today]);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDashboard();
  }, [loadDashboard]);

  const handleComplete = React.useCallback(async (questId: string) => {
    const res = await completeQuest(questId);
    await loadDashboard();
    
    if (res.leveledUp) {
      setReflectionLevel(res.newLevel);
    } else {
      toast.success("Quest Selesai!", {
        description: "Momentum dan EXP kamu telah bertambah.",
      });
    }
  }, [loadDashboard]);

  const handleFail = React.useCallback(async (questId: string) => {
    await failQuest(questId);
    await loadDashboard();
    toast.error("Quest Gagal", {
      description: "Jangan menyerah, coba lagi besok!",
    });
  }, [loadDashboard]);

  const handleDeleteQuest = React.useCallback(async (questId: string) => {
    await deleteQuest(questId);
    await loadDashboard();
  }, [loadDashboard]);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="size-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  const { settings, todayQuests, completedCount } = summary;
  const pendingQuestsList = todayQuests.filter((q) => q.status === "pending");

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
      {/* Level Progress */}
      <section>
        <LevelProgressBar momentumScore={settings.momentumScore} />
      </section>

      {/* Quick Stats & Reward Shop Link */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/40 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Momentum</p>
          <p className="text-2xl font-bold">{settings.momentumScore}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Total EXP</p>
          <p className="text-2xl font-bold">{settings.totalExp}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-medium text-amber-600 mb-1">Koin (Pts)</p>
          <p className="text-2xl font-bold text-amber-600">{settings.coins || 0}</p>
        </div>
        <div className="bg-muted/40 rounded-xl p-4 flex flex-col items-center justify-center text-center">
          <p className="text-xs font-medium text-muted-foreground mb-1">Quest Selesai</p>
          <p className="text-2xl font-bold">{completedCount}</p>
        </div>
      </section>

      {/* Reward Shop shortcut */}
      <section>
        <Link href="/rewards" className="block focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl">
          <div className="bg-primary/10 hover:bg-primary/15 transition-colors border border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm font-medium text-primary">Reward Shop</p>
            <ArrowRightIcon className="size-4 text-primary/80" />
          </div>
        </Link>
      </section>

      {/* Today's Quests Preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Tugas Aktif</h2>
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/quests">Kelola Quest</Link>
          </Button>
        </div>

        {pendingQuestsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-card border rounded-xl shadow-sm">
            <div className="flex items-center justify-center size-12 rounded-full bg-muted mb-3">
              <ScrollTextIcon className="size-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-sm font-medium mb-1">Semua tugas selesai!</h3>
            <p className="text-xs text-muted-foreground max-w-[200px]">
              Tambahkan tugas baru atau nikmati waktu istirahat Anda.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {pendingQuestsList.map((quest) => (
              <QuestCard
                key={quest.id}
                quest={quest}
                onComplete={handleComplete}
                onFail={handleFail}
                onDelete={handleDeleteQuest}
              />
            ))}
          </div>
        )}
      </section>

      <ReflectionModal 
        level={reflectionLevel} 
        onClose={() => setReflectionLevel(null)} 
      />
    </div>
  );
}
