"use client";

import * as React from "react";
import { getJournalEntries } from "@/lib/journal";
import type { JournalEntry } from "@/lib/db";
import { BookOpenIcon, CalendarIcon } from "lucide-react";

function toDateFormatted(isoStr: string) {
  const d = new Date(isoStr);
  return d.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function JournalPage() {
  const [entries, setEntries] = React.useState<JournalEntry[]>([]);
  const [loading, setLoading] = React.useState(true);

  const loadData = React.useCallback(async () => {
    const data = await getJournalEntries();
    setEntries(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="size-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
          <BookOpenIcon className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jurnal Refleksi</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Catatan perjalanan Anda di setiap level yang berhasil dilewati.
          </p>
        </div>
      </div>

      {/* Journal List */}
      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border rounded-xl shadow-sm">
          <div className="flex items-center justify-center size-12 rounded-full bg-muted mb-4">
            <BookOpenIcon className="size-6 text-muted-foreground" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-medium mb-1.5">Buku Jurnal Kosong</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Terus selesaikan quest dan kumpulkan EXP untuk naik level. Catatan refleksi Anda akan muncul di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          {entries.map((entry) => (
            <div key={entry.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                <span className="text-primary-foreground text-sm font-bold">{entry.level}</span>
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-lg text-primary">Level {entry.level}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarIcon className="size-3" />
                    <time dateTime={entry.createdAt}>{toDateFormatted(entry.createdAt)}</time>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {entry.reflection}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
