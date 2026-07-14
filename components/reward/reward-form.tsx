"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";

const rewardSchema = z.object({
  name: z.string().min(1, "Nama reward tidak boleh kosong"),
  pointsCost: z.number().min(1, "Harga koin harus lebih dari 0"),
});

type RewardFormValues = z.infer<typeof rewardSchema>;

interface RewardFormProps {
  onSubmit: (data: RewardFormValues) => Promise<void>;
}

export function RewardForm({ onSubmit }: RewardFormProps) {
  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RewardFormValues>({
    resolver: zodResolver(rewardSchema),
    defaultValues: {
      name: "",
      pointsCost: 50,
    },
  });

  const onFormSubmit = async (data: RewardFormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
      reset();
      setOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 shadow-sm">
          <PlusIcon className="size-4" />
          Tambah Reward
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Reward Baru</DialogTitle>
          <DialogDescription>
            Tentukan hadiah untuk dirimu sendiri dan berapa koin harganya.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Reward</Label>
            <Input
              id="name"
              placeholder="Contoh: Main game 1 jam, Nonton 1 episode Netflix..."
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pointsCost">Harga (Koin)</Label>
            <Input
              id="pointsCost"
              type="number"
              placeholder="50"
              {...register("pointsCost", { valueAsNumber: true })}
            />
            {errors.pointsCost && (
              <p className="text-xs text-destructive">
                {errors.pointsCost.message}
              </p>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
