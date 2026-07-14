"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, updateSettings } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  PaletteIcon,
  SettingsIcon,
  CheckCircle2Icon,
  DownloadIcon,
  UploadIcon,
  DatabaseIcon,
  Trash2Icon,
} from "lucide-react";
import { exportAllData, importData, resetAllData } from "@/lib/backup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const settings = useLiveQuery(() => db.settings.get("singleton"));
  const themes = useLiveQuery(() => db.themes.orderBy("unlockedAtLevel").toArray());
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [isResetting, setIsResetting] = React.useState(false);

  if (!settings || themes === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="size-8 animate-spin rounded-full border-4 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  const handlePenaltyToggle = async (checked: boolean) => {
    await updateSettings({ penaltyEnabled: checked });
    toast.success("Pengaturan penalti diperbarui");
  };

  const handlePenaltyChange = async (val: number[]) => {
    await updateSettings({ penaltyPercentage: val[0] });
  };

  const handlePenaltyCommit = () => {
    toast.success("Persentase denda disimpan");
  };

  const handleThemeSelect = async (themeId: string | undefined) => {
    await updateSettings({ activeThemeId: themeId });
    toast.success("Tema berhasil diubah!");
  };

  const handleExport = async () => {
    try {
      await exportAllData();
      toast.success("Data berhasil diekspor");
    } catch (error: unknown) {
      toast.error("Gagal mengekspor data", {
        description: error instanceof Error ? error.message : "Kesalahan tidak dikenal",
      });
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      await importData(text);
      toast.success("Data berhasil diimpor", {
        description: "Halaman akan dimuat ulang untuk menerapkan perubahan.",
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: unknown) {
      toast.error("Gagal mengimpor data", {
        description: error instanceof Error ? error.message : "Kesalahan tidak dikenal",
      });
      setIsImporting(false);
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await resetAllData();
      toast.success("Semua data berhasil dihapus", {
        description: "Aplikasi telah dikembalikan ke kondisi awal.",
      });
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 1500);
    } catch (error: unknown) {
      toast.error("Gagal menghapus data", {
        description: error instanceof Error ? error.message : "Kesalahan tidak dikenal",
      });
      setIsResetting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
          <SettingsIcon className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Sesuaikan tingkat kesulitan dan tampilan aplikasi Anda.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Personalisasi Tema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PaletteIcon className="size-5" />
              Personalisasi Tema
            </CardTitle>
            <CardDescription>
              Pilih warna aksen aplikasi. Slot tema baru akan terbuka setiap kelipatan 5 level!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Default Theme */}
              <button
                type="button"
                onClick={() => handleThemeSelect(undefined)}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                  !settings.activeThemeId ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 mb-2 border border-slate-700" />
                <span className="text-sm font-medium">Default (Vega)</span>
                {!settings.activeThemeId && (
                  <CheckCircle2Icon className="absolute top-2 right-2 size-4 text-primary" />
                )}
              </button>

              {/* Unlocked Themes */}
              {themes.map((theme) => {
                const isActive = settings.activeThemeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                      isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div 
                      className="w-8 h-8 rounded-full mb-2 shadow-sm border border-black/10" 
                      style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                    />
                    <span className="text-sm font-medium line-clamp-1">{theme.name}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">Level {theme.unlockedAtLevel}</span>
                    {isActive && (
                      <CheckCircle2Icon className="absolute top-2 right-2 size-4 text-primary" />
                    )}
                  </button>
                );
              })}
            </div>
            
            {themes.length === 0 && (
              <div className="bg-muted/50 p-4 rounded-lg text-center text-sm text-muted-foreground">
                Terus selesaikan quest untuk mencapai Level 5 dan membuka slot tema pertamamu!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tingkat Kesulitan */}
        <Card>
          <CardHeader>
            <CardTitle>Tingkat Kesulitan</CardTitle>
            <CardDescription>
              Atur seberapa keras penalti yang Anda terima jika gagal menyelesaikan quest.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Aktifkan Denda Kegagalan</Label>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Jika gagal, sejumlah koin (berdasarkan poin quest) akan ditarik.
                </p>
              </div>
              <Switch 
                checked={settings.penaltyEnabled} 
                onCheckedChange={handlePenaltyToggle}
              />
            </div>

            {settings.penaltyEnabled && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Persentase Denda</Label>
                  <span className="font-bold">{settings.penaltyPercentage}%</span>
                </div>
                <Slider
                  defaultValue={[settings.penaltyPercentage]}
                  max={100}
                  step={5}
                  onValueChange={handlePenaltyChange}
                  onValueCommit={handlePenaltyCommit}
                  className="py-4"
                />
                <p className="text-xs text-muted-foreground">
                  Jika quest bernilai 100 poin dan persentase ini 50%, Anda akan kehilangan 50 koin jika gagal. Koin tidak akan bernilai minus.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backup & Restore */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DatabaseIcon className="size-5" />
              Pencadangan Data
            </CardTitle>
            <CardDescription>
              Karena data hanya disimpan di browser Anda, pastikan untuk rutin mengekspor data sebagai cadangan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleExport} className="w-full sm:w-auto" variant="outline">
                <DownloadIcon className="size-4 mr-2" />
                Ekspor Data
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <UploadIcon className="size-4 mr-2" />
                    Impor Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Anda yakin ingin mengimpor?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini akan menimpa seluruh data Anda saat ini (termasuk quest, level, dan tema) dengan data dari file cadangan. Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isImporting}
                    >
                      Ya, Lanjutkan Impor
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleImport}
                className="hidden"
              />
              
              <div className="flex-1 hidden sm:block" />

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full sm:w-auto text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2Icon className="size-4 mr-2" />
                    Reset Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Semua Data?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tindakan ini akan menghapus permanen seluruh quest, level, koin, riwayat, dan tema Anda. Aplikasi akan kembali seperti baru pertama kali diinstal. Tindakan ini tidak dapat dibatalkan. Pastikan Anda sudah mengekspor data jika masih membutuhkannya.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReset}
                      disabled={isResetting}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isResetting ? "Menghapus..." : "Ya, Hapus Semuanya"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
