"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RankBadge } from "@/components/quest/rank-badge";
import { PlusIcon } from "lucide-react";
import type { QuestRank } from "@/types";

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

const QUEST_RANKS: QuestRank[] = ["E", "D", "C", "B", "A", "S"];

const questSchema = z.object({
  title: z
    .string()
    .min(1, "Judul quest wajib diisi")
    .max(200, "Judul maksimal 200 karakter"),
  rank: z.enum(["E", "D", "C", "B", "A", "S"], {
    message: "Pilih rank quest",
  }),
  points: z
    .number({ message: "Poin harus berupa angka" })
    .int("Poin harus bilangan bulat")
    .min(1, "Poin harus lebih dari 0")
    .max(10000, "Poin maksimal 10.000"),
  isDaily: z.boolean().default(false),
});

type QuestFormData = z.infer<typeof questSchema>;

// ---------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------

export interface QuestFormProps {
  /** Callback saat quest berhasil disubmit (sudah lolos validasi). */
  onSubmit: (data: QuestFormData) => void | Promise<void>;
  /** Tanggal quest (YYYY-MM-DD), default hari ini. */
  questDate?: string;
  className?: string;
}

// ---------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------

export function QuestForm({ onSubmit, className }: QuestFormProps) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [rank, setRank] = React.useState<QuestRank>("E");
  const [points, setPoints] = React.useState("");
  const [isDaily, setIsDaily] = React.useState(false);
  const [errors, setErrors] = React.useState<Partial<Record<keyof QuestFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const resetForm = React.useCallback(() => {
    setTitle("");
    setRank("E");
    setPoints("");
    setIsDaily(false);
    setErrors({});
    setIsSubmitting(false);
  }, []);

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const parsed = questSchema.safeParse({
        title: title.trim(),
        rank,
        points: points === "" ? undefined : Number(points),
        isDaily,
      });

      if (!parsed.success) {
        const fieldErrors: Partial<Record<keyof QuestFormData, string>> = {};
        for (const issue of parsed.error.issues) {
          const field = issue.path[0] as keyof QuestFormData;
          if (!fieldErrors[field]) {
            fieldErrors[field] = issue.message;
          }
        }
        setErrors(fieldErrors);
        return;
      }

      setErrors({});
      setIsSubmitting(true);

      try {
        await onSubmit(parsed.data);
        resetForm();
        setOpen(false);
      } catch {
        // Error handling di sini minimal — bisa diperkaya nanti
        setIsSubmitting(false);
      }
    },
    [title, rank, points, isDaily, onSubmit, resetForm]
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className={cn(className)} id="add-quest-button">
          <PlusIcon aria-hidden="true" />
          Tambah Quest
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quest Baru</DialogTitle>
          <DialogDescription>
            Tentukan judul, rank, dan poin untuk quest-mu.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4" id="quest-form">
          {/* Title */}
          <div className="grid gap-2">
            <Label htmlFor="quest-title">Judul</Label>
            <Input
              id="quest-title"
              placeholder="Contoh: Selesaikan bab 3 buku"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-invalid={!!errors.title}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Rank */}
          <div className="grid gap-2">
            <Label htmlFor="quest-rank">Rank</Label>
            <Select
              value={rank}
              onValueChange={(v) => setRank(v as QuestRank)}
            >
              <SelectTrigger id="quest-rank" className="w-full">
                <SelectValue placeholder="Pilih rank" />
              </SelectTrigger>
              <SelectContent>
                {QUEST_RANKS.map((r) => (
                  <SelectItem key={r} value={r}>
                    <span className="inline-flex items-center gap-2">
                      <RankBadge rank={r} size="sm" />
                      <span>Rank {r}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.rank && (
              <p className="text-sm text-destructive">{errors.rank}</p>
            )}
          </div>

          {/* Points */}
          <div className="grid gap-2">
            <Label htmlFor="quest-points">Poin</Label>
            <Input
              id="quest-points"
              type="number"
              min={1}
              max={10000}
              placeholder="Contoh: 50"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              aria-invalid={!!errors.points}
            />
            {errors.points && (
              <p className="text-sm text-destructive">{errors.points}</p>
            )}
          </div>

          {/* Daily Quest Checkbox */}
          <div className="flex items-center space-x-2 mt-2">
            <Checkbox
              id="quest-daily"
              checked={isDaily}
              onCheckedChange={(checked) => setIsDaily(checked === true)}
            />
            <Label
              htmlFor="quest-daily"
              className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Jadikan Quest Harian (muncul setiap hari)
            </Label>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting} id="submit-quest-button">
              {isSubmitting ? "Menyimpan…" : "Simpan Quest"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

QuestForm.displayName = "QuestForm";
