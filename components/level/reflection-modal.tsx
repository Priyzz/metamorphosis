"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveJournalEntry } from "@/lib/journal";
import { toast } from "sonner";
import { SparklesIcon } from "lucide-react";

const schema = z.object({
  reflection: z.string().min(3, "Tulis minimal beberapa kata untuk refleksi Anda."),
});

type FormValues = z.infer<typeof schema>;

interface ReflectionModalProps {
  level: number | null;
  onClose: () => void;
}

export function ReflectionModal({ level, onClose }: ReflectionModalProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const isOpen = level !== null;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { reflection: "" },
  });

  // Reset form tiap kali modal terbuka untuk level baru
  React.useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: FormValues) => {
    if (level === null) return;
    
    try {
      setIsSubmitting(true);
      await saveJournalEntry(level, data.reflection);
      toast.success("Jurnal tersimpan!", {
        description: "Luar biasa! Terus pertahankan momentum Anda.",
      });
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan.";
      toast.error("Gagal menyimpan jurnal", {
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    toast.info("Refleksi dilewati", {
      description: "Jangan lupa untuk refleksi di level berikutnya!",
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      // Kita intercept onOpenChange supaya kalau klik di luar (backdrop),
      // itu ekuivalen dengan skip.
      if (!open) handleSkip();
    }}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <div className="mx-auto bg-amber-500/10 p-3 rounded-full mb-2">
            <SparklesIcon className="size-6 text-amber-500" />
          </div>
          <DialogTitle className="text-center text-xl">Level Up! (Level {level})</DialogTitle>
          <DialogDescription className="text-center">
            Selamat! Anda telah mencapai level baru. Ambil waktu sejenak untuk menulis apa yang Anda pelajari atau banggakan hari ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Textarea
              placeholder="Contoh: Saya merasa lebih produktif karena mulai membiasakan mematikan notifikasi..."
              className="min-h-[120px] resize-none"
              {...register("reflection")}
            />
            {errors.reflection && (
              <p className="text-xs text-destructive">{errors.reflection.message}</p>
            )}
          </div>

          <div className="pt-2 flex justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={handleSkip}
              disabled={isSubmitting}
            >
              Lewati Sementara
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Refleksi"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
