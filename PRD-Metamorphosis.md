# Product Requirements Document: Metamorphosis

## 1. Overview

**Nama Produk:** Metamorphosis

**Deskripsi Singkat:** Web app produktivitas bergaya RPG (terinspirasi Solo Leveling) di mana pengguna mengubah to-do harian menjadi "quest" berperingkat, mendapatkan poin, naik level, dan menukar poin dengan reward nyata yang mereka tentukan sendiri.

**Tujuan:** Membantu pengguna membangun kebiasaan produktif secara konsisten lewat sistem gamifikasi yang punya konsekuensi nyata (bukan sekadar dekorasi), dengan dorongan utama berupa progres yang berarti dan reward yang benar-benar relevan dengan hidup mereka.

## 2. Target User

- **Primer:** Pembuat produk sendiri (personal use)
- **Sekunder (masa depan):** Individu lain yang ingin sistem produktivitas gamifikasi personal

Arsitektur dirancang **cloud-ready & multi-user-ready** sejak awal, meski peluncuran awal hanya untuk satu pengguna.

## 3. Core Concept

Loop inti pengguna:

```
Buat Quest → Selesaikan/Gagal → Poin & Momentum Berubah →
Level/Refleksi (jika naik level) → Tukar Reward dengan Poin
```

## 4. Fitur MVP

### 4.1 Autentikasi
- Login/register menggunakan Supabase Auth
- Setiap data terikat ke `user_id` sejak awal (siap multi-user)

### 4.2 Manajemen Quest
- Tambah quest: judul, rank (E/D/C/B/A/S), poin
- **Poin diisi manual oleh pengguna** per quest (bukan skala otomatis)
- Tandai quest sebagai **Selesai** atau **Gagal**
- Daftar quest harian (bisa lihat quest hari ini)

### 4.3 Sistem Poin, EXP, dan Level

Dua metrik terpisah:

| Metrik | Fungsi | Karakteristik |
|---|---|---|
| **Total EXP** | Statistik lifetime untuk histori/riwayat | Selalu bertambah, tidak pernah berkurang |
| **Momentum Score** | Dasar perhitungan Level | Naik saat quest selesai; **decay** jika vakum |

**Decay Momentum Score:**
- Grace period: **2–3 hari** tanpa quest selesai sebelum decay mulai berjalan
- Persentase decay per hari: default sedang, **configurable** di Settings (nilai pasti ditentukan saat implementasi/testing)

**Level** dihitung dari Momentum Score (bukan Total EXP), sehingga:
- Grinding satu hari saja tidak melonjakkan level secara drastis
- Vakum lama dapat menurunkan level (mendorong konsistensi asli)

### 4.4 Checkpoint Refleksi
- Setiap kali naik level, muncul modal/prompt refleksi sederhana
- MVP: 1 text box terbuka ("Apa yang paling berhasil sejak level terakhir?")
- Jawaban disimpan sebagai entry di "Jurnal Level" yang bisa dilihat kembali

### 4.5 Unlock Tema UI
- Tema UI baru ke-unlock **tiap 5 level**
- Pengguna **menentukan sendiri nama & warna tema** (tidak disediakan preset oleh sistem)
- Halaman Settings untuk memilih tema aktif dari tema-tema yang sudah ke-unlock

### 4.6 Sistem Penalty (Configurable)
- Toggle on/off di Settings
- Jika aktif: quest gagal → poin dipotong sejumlah **default sedang** (persentase pasti ditentukan saat implementasi, dengan asumsi awal di kisaran 70–100% dari poin quest tersebut)
- Pengguna dapat mengubah besaran penalty sendiri di Settings kapan saja

### 4.7 Reward Shop
- Pengguna menambahkan reward sendiri: nama reward + jumlah poin yang dibutuhkan
- Reward bersifat **nyata/offline** (contoh: nonton, jajan, me-time — bebas ditentukan pengguna)
- Tombol "Tukar": jika poin cukup, poin dipotong dan reward tercatat sebagai "diklaim"

### 4.8 Dashboard Utama
- Ringkasan: daftar quest hari ini, status Level & Momentum, akses cepat ke Reward Shop

### 4.9 Riwayat
- Log quest selesai/gagal
- Log reward yang sudah ditukar
- Jurnal Level (hasil checkpoint refleksi)

## 5. Non-Goals (Belum Masuk MVP)

Fitur berikut sengaja ditunda ke fase berikutnya:

- Stat kategori ala RPG (STR/INT/VIT, dll per jenis quest)
- Aturan penalty lanjutan (debuff bertingkat, efek berantai)
- Streak harian & sistem achievement/badge terpisah
- Fitur sosial (leaderboard, guild, share progress ke teman)
- Notifikasi/reminder otomatis
- Statistik & grafik progres jangka panjang
- Versi mobile native / PWA
- Preset tema UI yang disediakan sistem

## 6. User Flow Utama

1. Pengguna login
2. Pengguna menambahkan quest baru dengan rank & poin manual
3. Pengguna menandai quest sebagai selesai/gagal sepanjang hari
4. Sistem memperbarui Total EXP dan Momentum Score
5. Jika Momentum Score naik cukup untuk naik level:
   - Modal refleksi muncul
   - Jika level tersebut kelipatan 5 → tema baru ke-unlock
6. Pengguna dapat menukar poin dengan reward di Reward Shop
7. Semua aktivitas tercatat di halaman Riwayat

## 7. Tech Stack

- **Frontend:** Next.js (React) + Tailwind CSS
- **Backend/Database/Auth:** Supabase (PostgreSQL)
- **Deployment:** Vercel (frontend), Supabase Cloud (backend)

## 8. Parameter yang Masih Perlu Ditentukan Saat Implementasi

Nilai-nilai berikut disepakati sebagai *default sementara*, dan sebaiknya dibuat **configurable** dari awal agar mudah di-tuning setelah beberapa minggu pemakaian nyata:

- Persentase decay Momentum Score per hari (setelah grace period 2–3 hari)
- Persentase potongan poin saat penalty aktif (default "sedang")
- Formula konversi Momentum Score → Level
- Rentang poin wajar per rank quest (E–S) sebagai panduan, meski pengisian tetap manual

## 9. Nama & Branding

- **Nama Produk:** Metamorphosis
- Tema visual awal: bebas ditentukan pengguna (tidak ada preset dari sistem)
