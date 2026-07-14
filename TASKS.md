# TASKS.md — Metamorphosis Build Checklist

Urutan kerja buat dikasih ke AI coding agent (atau dikerjain manual) satu fase per satu. Tiap fase sengaja dibuat bisa jalan & di-test sendiri sebelum lanjut ke fase berikutnya — jangan loncat fase sebelum yang sebelumnya beres.

Referensi: `PRD-Metamorphosis.md` (requirement fitur), `architecture.md` (pola kode & folder), `lib/db.ts` (skema data).

---

## Fase 0 — Project Setup

- [x] Scaffold Next.js (App Router + TypeScript + Tailwind)
- [x] Install `dexie`
- [x] Init shadcn/ui (preset Vega)
- [x] Struktur folder `app/(main)/*` sesuai `architecture.md`
- [x] `lib/db.ts` di tempat (tabel: quests, momentumHistory, journalEntries, themes, rewards, rewardRedemptions, settings)
- [x] Push scaffold awal ke GitHub (`main` branch)
- [x] Pastikan `npm run dev` jalan tanpa error, halaman default kebuka di localhost

**Selesai kalau:** project jalan di localhost, `db.ts` bisa di-import tanpa error, repo ke-push.

---

## Fase 1 — Quest Management (fondasi)

Referensi PRD §4.2.

- [x] `types/` — re-export type `Quest`, `QuestRank`, `QuestStatus` dari `lib/db.ts`
- [x] `lib/quests.ts` — fungsi CRUD dasar: `createQuest()`, `getQuestsByDate()`, `getAllQuests()`, `deleteQuest()` (pakai `db.quests` langsung, belum sentuh momentum)
- [x] `components/quest/RankBadge.tsx` — badge visual buat rank E–S
- [x] `components/quest/QuestForm.tsx` — form tambah quest (judul, rank, poin manual) pakai Zod buat validasi (poin harus > 0)
- [x] `components/quest/QuestCard.tsx` — tampilkan 1 quest + tombol aksi (belum berfungsi penuh, UI dulu)
- [x] `app/(main)/quests/page.tsx` — list semua quest, bisa tambah quest baru
- [x] Test manual: tambah quest, muncul di list, refresh browser data tetap ada (baca dari IndexedDB)

**Selesai kalau:** bisa tambah quest baru dan lihat listnya, data persist setelah refresh.

---

## Fase 2 — Momentum, Level & Penalty Logic

Referensi PRD §4.3, §4.6.

- [ ] `lib/level.ts` — `calculateLevel(momentum: number): number` (sudah ada versi awal di `db.ts`, pindahkan/rapikan di sini kalau perlu)
- [ ] `lib/penalty.ts` — `calculatePenalty(points: number, percentage: number): number`
- [ ] `lib/momentum.ts`:
  - [ ] `completeQuest(questId)` — update status quest jadi `completed`, tambah `momentumScore` & `totalExp`, catat `momentumHistory`, cek level naik
  - [ ] `failQuest(questId)` — update status jadi `failed`, kalau `penaltyEnabled` maka potong `momentumScore` sesuai `penaltyPercentage`, catat `momentumHistory`
  - [ ] `checkAndApplyDecay()` — cek `lastQuestCompletedAt` vs `decayGracePeriodDays`, kalau lewat grace period maka potong `momentumScore` sesuai `decayPercentage`, catat `momentumHistory` dengan reason `decay`
  - [ ] Semua fungsi di atas pakai `db.transaction('rw', [...])` supaya atomik antar tabel
- [ ] Hubungkan `QuestCard` ke `completeQuest()` / `failQuest()` — tombol "Selesai"/"Gagal" beneran berfungsi
- [ ] Unit test: `calculateLevel`, `calculatePenalty`, dan skenario decay (pakai `fake-indexeddb` buat test yang sentuh `db.ts`)

**Selesai kalau:** tandai quest selesai/gagal beneran mengubah momentum & level, ada test yang lulus untuk kalkulasi inti.

---

## Fase 3 — Dashboard

Referensi PRD §4.8.

- [x] `components/level/LevelProgressBar.tsx` — tampilkan level saat ini + progress ke level berikutnya
- [x] `lib/momentum.ts` — tambahkan `getTodayQuests()` / helper ringkasan
- [x] `app/(main)/dashboard/page.tsx` — gabungkan: quest hari ini, level & momentum, akses cepat ke Reward Shop
- [x] Panggil `checkAndApplyDecay()` saat dashboard di-load (client-side, sekali per sesi) supaya decay ke-apply otomatis

**Selesai kalau:** buka dashboard langsung kelihatan status lengkap tanpa pindah halaman.

---

## Fase 4 — Reward Shop

Referensi PRD §4.7.

- [x] `lib/rewards.ts` — `createReward()`, `getActiveRewards()`, `archiveReward()`, `redeemReward(rewardId)` (transaksi: kurangi poin di `settings` + tambah baris `rewardRedemptions`, snapshot nama & poin)
- [x] `components/reward/RewardForm.tsx` — tambah reward baru (nama + poin dibutuhkan)
- [x] `components/reward/RewardCard.tsx` + `RedeemButton.tsx` — tombol redeem, disabled kalau poin kurang
- [x] `app/(main)/rewards/page.tsx`

**Selesai kalau:** bisa bikin reward custom, redeem berhasil motong poin dan tercatat.

---

## Fase 5 — Reflection Checkpoint & Journal

Referensi PRD §4.4.

- [x] `components/level/ReflectionModal.tsx` — modal 1 text box, muncul otomatis saat level naik
- [x] `lib/momentum.ts` — trigger modal (via state/callback) tiap kali `completeQuest()` menghasilkan level up
- [x] `lib/journal.ts` — `saveJournalEntry(level, reflection)`, `getJournalEntries()`
- [x] `app/(main)/journal/page.tsx` — list semua entry jurnal

**Selesai kalau:** naik level memicu modal refleksi, hasil isian tersimpan dan bisa dilihat lagi di halaman Journal.

---

## Fase 6 — Theme System

Referensi PRD §4.5.

- [x] `lib/themes.ts` — `unlockTheme(name, colors, level)`, `getUnlockedThemes()`, `setActiveTheme(themeId)`
- [x] Cek unlock tema otomatis tiap kelipatan 5 level (di dalam alur `completeQuest()` / setelah level-up)
- [x] `components/theme/ThemePicker.tsx`, `ThemePreview.tsx`
- [x] `components/layout/ThemeProvider.tsx` — apply warna tema aktif ke seluruh app (CSS variables)
- [x] `app/(main)/settings/page.tsx` — pilih tema aktif dari yang sudah unlock, plus konfigurasi penalty & decay (§4.6, §4.3)

**Selesai kalau:** level kelipatan 5 otomatis unlock slot tema baru, user bisa kasih nama+warna sendiri dan aktifkan.

---

## Fase 7 — History

Referensi PRD §4.9.

- [x] `app/(main)/history/page.tsx` — 3 tab/section: log quest selesai/gagal, log reward ditukar, jurnal level
- [x] Filter dasar via URL state (misal `?status=completed`)

**Selesai kalau:** semua histori bisa dilihat di satu tempat, gak perlu buka banyak halaman buat lacak progress lama.

---

## Fase 8 — Backup (Export/Import JSON)

Karena data cuma hidup di IndexedDB satu browser (lihat `architecture.md` §5), ini bukan opsional.

- [x] `lib/backup.ts` — `exportAllData()` (semua tabel jadi 1 file JSON, download via browser) dan `importData(json)` (validasi dulu sebelum overwrite `db`)
- [x] Tombol Export & Import di halaman Settings
- [x] Konfirmasi/warning sebelum import (karena bakal timpa data yang ada)

**Selesai kalau:** bisa export data ke file, hapus semua data (test), lalu import balik dan datanya utuh sama persis.

---

## Fase 9 — Polish (opsional, setelah semua fase di atas jalan)

- [ ] Loading states & empty states di tiap halaman
- [ ] Responsive check (mobile browser)
- [ ] E2E test (Playwright) untuk flow kritis: buat quest → selesaikan → level naik → redeem reward (lihat `architecture.md` §10)
- [ ] Tuning nilai default: `decayPercentage`, `penaltyPercentage`, formula `calculateLevel` (PRD §8 — sesuaikan setelah pemakaian nyata beberapa minggu)

---

## Catatan

- Tiap fase sebaiknya jadi commit/PR terpisah biar gampang ditelusuri kalau ada bug.
- Kalau AI agent bikin file di luar struktur `architecture.md` (misal bikin `app/api/` lagi), tolak — itu tanda dia balik ke pola lama (Supabase/server), bukan local-first.
