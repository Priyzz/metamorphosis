"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import type { Quest, RewardRedemption, JournalEntry } from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankBadge } from "@/components/quest/rank-badge";
import {
  HistoryIcon,
  CheckCircle2Icon,
  XCircleIcon,
  GiftIcon,
  BookOpenIcon,
  CoinsIcon,
} from "lucide-react";

function formatDate(isoStr: string) {
  return new Date(isoStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type QuestFilter = "all" | "completed" | "failed";

export default function HistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "quests";
  const statusFilter = (searchParams.get("status") as QuestFilter) || "all";

  const [quests, setQuests] = React.useState<Quest[]>([]);
  const [redemptions, setRedemptions] = React.useState<RewardRedemption[]>([]);
  const [journals, setJournals] = React.useState<JournalEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      const allQuests = await db.quests.toArray();
      const finishedQuests = allQuests
        .filter((q) => q.status === "completed" || q.status === "failed")
        .sort(
          (a, b) =>
            new Date(b.completedAt || b.createdAt).getTime() -
            new Date(a.completedAt || a.createdAt).getTime()
        );
      setQuests(finishedQuests);

      const allRedemptions = await db.rewardRedemptions.toArray();
      setRedemptions(
        allRedemptions.sort(
          (a, b) =>
            new Date(b.redeemedAt).getTime() - new Date(a.redeemedAt).getTime()
        )
      );

      const allJournals = await db.journalEntries.toArray();
      setJournals(
        allJournals.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );

      setLoading(false);
    }
    load();
  }, []);

  const setTab = (tab: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    if (tab !== "quests") params.delete("status");
    router.replace(`/history?${params.toString()}`);
  };

  const setFilter = (filter: QuestFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("status", filter);
    router.replace(`/history?${params.toString()}`);
  };

  const filteredQuests =
    statusFilter === "all"
      ? quests
      : quests.filter((q) => q.status === statusFilter);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="size-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
          <HistoryIcon className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Riwayat</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lacak seluruh pencapaian dan aktivitas Anda di satu tempat.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quests" className="gap-1.5 text-xs sm:text-sm">
            <CheckCircle2Icon className="size-4 hidden sm:block" />
            Quest
          </TabsTrigger>
          <TabsTrigger value="rewards" className="gap-1.5 text-xs sm:text-sm">
            <GiftIcon className="size-4 hidden sm:block" />
            Reward
          </TabsTrigger>
          <TabsTrigger value="journal" className="gap-1.5 text-xs sm:text-sm">
            <BookOpenIcon className="size-4 hidden sm:block" />
            Jurnal
          </TabsTrigger>
        </TabsList>

        {/* Quest History */}
        <TabsContent value="quests" className="space-y-4 mt-4">
          {/* Filters */}
          <div className="flex gap-2">
            {(["all", "completed", "failed"] as QuestFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                  statusFilter === f
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {f === "all" ? "Semua" : f === "completed" ? "Selesai" : "Gagal"}
              </button>
            ))}
          </div>

          {filteredQuests.length === 0 ? (
            <EmptyState text="Belum ada riwayat quest." />
          ) : (
            <div className="space-y-2">
              {filteredQuests.map((q) => (
                <div
                  key={q.id}
                  className="flex items-center gap-3 p-3 bg-card border rounded-lg"
                >
                  <RankBadge rank={q.rank} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{q.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(q.completedAt || q.createdAt)} · {q.points} pts
                    </p>
                  </div>
                  {q.status === "completed" ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">
                      <CheckCircle2Icon className="size-3" /> Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500 bg-red-500/10 px-2 py-1 rounded-md">
                      <XCircleIcon className="size-3" /> Gagal
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reward Redemption History */}
        <TabsContent value="rewards" className="space-y-2 mt-4">
          {redemptions.length === 0 ? (
            <EmptyState text="Belum ada reward yang pernah ditukar." />
          ) : (
            <div className="space-y-2">
              {redemptions.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 p-3 bg-card border rounded-lg"
                >
                  <div className="bg-amber-500/10 p-2 rounded-lg">
                    <GiftIcon className="size-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {r.rewardNameSnapshot}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(r.redeemedAt)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 bg-amber-500/10 px-2 py-1 rounded-md">
                    <CoinsIcon className="size-3" /> -{r.pointsSpent}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Journal History */}
        <TabsContent value="journal" className="space-y-2 mt-4">
          {journals.length === 0 ? (
            <EmptyState text="Belum ada catatan jurnal refleksi." />
          ) : (
            <div className="space-y-3">
              {journals.map((j) => (
                <div
                  key={j.id}
                  className="p-4 bg-card border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-sm font-bold text-primary">
                      <BookOpenIcon className="size-4" /> Level {j.level}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(j.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {j.reflection}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center bg-card border rounded-xl">
      <div className="flex items-center justify-center size-12 rounded-full bg-muted mb-3">
        <HistoryIcon className="size-6 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
