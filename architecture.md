# Metamorphosis - Development Guidelines

## Architecture Principles

Proyek ini local-first: semua logika dan data jalan di browser (client-side), tanpa backend. Prinsip Clean Architecture tetap dipakai, tapi disesuaikan — Data Layer bukan lagi Supabase/Postgres di server, melainkan IndexedDB (via Dexie) di browser yang sama dengan Business Logic Layer.

### 1. **Separation of Concerns**

- **Presentation Layer** (`app/components`, `app/(main)`): UI components dan pages
- **Business Logic Layer** (`app/lib`): Aturan bisnis (kalkulasi momentum, level, penalty) — dipanggil langsung dari komponen/hook, bukan lewat API routes
- **Data Layer** (`app/lib/db.ts`): Definisi tabel Dexie/IndexedDB dan akses data

Karena semuanya jalan di browser yang sama, ketiga layer ini hidup dalam satu runtime (tidak ada network boundary antara Business Logic dan Data Layer seperti pada arsitektur client-server).

### 2. **Folder Structure**

```
app/
├── (main)/                    # Route group untuk halaman utama
│   ├── dashboard/             # Ringkasan quest hari ini + status level
│   ├── quests/                # Manajemen quest (CRUD, tandai selesai/gagal)
│   ├── rewards/                # Reward shop
│   ├── journal/                # Jurnal refleksi (hasil checkpoint level up)
│   ├── history/                # Riwayat quest & reward yang ditukar
│   └── settings/               # Konfigurasi penalty, decay, tema, preferensi
├── components/
│   ├── ui/                     # Primitif UI (Button, Input, Card, Modal)
│   ├── layout/                 # Navbar, Sidebar, ThemeProvider
│   ├── quest/                  # QuestCard, QuestForm, RankBadge
│   ├── reward/                 # RewardCard, RewardForm, RedeemButton
│   ├── level/                  # LevelProgressBar, ReflectionModal
│   └── theme/                  # ThemePicker, ThemePreview
├── lib/
│   ├── db.ts                    # Definisi database Dexie (semua tabel + helper get/update)
│   ├── momentum.ts              # Logika Momentum Score & decay
│   ├── level.ts                  # Formula konversi Momentum Score → Level
│   ├── penalty.ts                # Kalkulasi potongan poin saat quest gagal
│   ├── backup.ts                 # Export/import data ke JSON (satu-satunya cara backup, karena tidak ada cloud)
│   └── utils.ts                  # Helper umum
└── types/                       # Definisi TypeScript (Quest, Reward, Theme, dll) — biasanya re-export dari lib/db.ts
```

Tidak ada `app/api/` dan tidak ada `app/(auth)/`. Tidak ada API routes karena tidak ada server logic untuk dituju — komponen memanggil fungsi di `app/lib` secara langsung, dan fungsi-fungsi itu membaca/menulis ke `db.ts`. Tidak ada auth karena hanya ada satu user per browser.

### 3. **Component Organization**

- **UI Components**: Elemen kecil yang reusable (Button, Input, Card, Modal)
- **Feature Components**: Komponen dengan logika bisnis spesifik (QuestCard, RewardCard, LevelProgressBar)
- **Page Components**: Komponen spesifik per route

### 4. **Data Access Pattern**

Tidak ada API routes — pola aksesnya langsung: **Component/Hook → `app/lib/*.ts` → `app/lib/db.ts` (Dexie)**.

Contoh alur "tandai quest selesai":

```
QuestCard (component)
  → completeQuest(questId)  // app/lib/momentum.ts
      → db.quests.update(...)         // app/lib/db.ts
      → calculateLevel(newMomentum)   // app/lib/level.ts
      → db.momentumHistory.add(...)   // app/lib/db.ts
      → db.settings.update(...)       // app/lib/db.ts
```

Fungsi-fungsi di `app/lib` yang menyentuh lebih dari satu tabel (misal redeem reward: kurangi poin di `settings` + tambah baris di `rewardRedemptions`) sebaiknya dibungkus dalam satu fungsi async dan dijalankan lewat `db.transaction(...)` milik Dexie, supaya tetap atomik walau tanpa database server.

### 5. **Data Layer (Dexie / IndexedDB)**

- `app/lib/db.ts` sebagai satu-satunya sumber kebenaran skema (tabel, tipe, index)
- Tidak ada kolom `user_id` dan tidak ada RLS — hanya ada satu user per browser, jadi tidak relevan
- Tabel `settings` cuma punya 1 baris (`id: 'singleton'`) untuk state agregat: total EXP, momentum score, level, config decay & penalty, tema aktif
- Gunakan `db.transaction('rw', [...tabel], async () => {...})` untuk operasi yang menyentuh banyak tabel sekaligus (contoh: redeem reward)
- Soft delete (`isArchived` / `deletedAt`) untuk quest/reward yang dihapus, agar riwayat tetap utuh
- **Backup manual**: karena tidak ada cloud, `lib/backup.ts` menyediakan export seluruh tabel ke file JSON dan import kembali — ini pengganti "cadangan otomatis" yang biasanya didapat gratis dari database cloud

### 6. **State Management**

- Karena IndexedDB hanya bisa diakses dari browser, halaman yang menampilkan data (dashboard, quests, rewards, journal, history) harus **Client Components** (`"use client"`) — Server Components tidak bisa membaca Dexie karena mereka render di server
- Tidak ada Next.js Server Actions untuk mutasi data (Server Actions jalan di server, tidak punya akses ke IndexedDB browser) — mutasi dilakukan lewat fungsi client-side biasa di `app/lib`, dipanggil dari event handler (`onClick`, `onSubmit`, dst)
- State lokal komponen (`useState`) atau state management ringan (misal `zustand`) untuk cache di memori supaya tidak query Dexie berulang kali dalam satu render; sinkronkan ulang setelah tiap mutasi
- URL state untuk filter/paginasi riwayat (misal `?status=completed`) tetap relevan, tidak berubah dari sebelumnya

### 7. **Security Best Practices**

- Validasi input di semua form (gunakan Zod untuk schema validation) — sekarang jadi lapisan pertahanan utama, karena tidak ada validasi server terpisah
- Proteksi XSS (React escape secara default)
- Tidak ada isu akses data lintas user (tidak ada auth, tidak ada user lain) — tapi karena itu juga, jangan simpan data sensitif (password, token pihak ketiga, dll) di IndexedDB tanpa enkripsi, karena siapa pun yang punya akses ke device/browser bisa membaca lewat DevTools
- Tidak perlu rate limiting (tidak ada API routes/server untuk diserang)
- Kalkulasi poin/level tetap divalidasi di titik yang sama tempat data ditulis (`app/lib`), supaya UI tidak bisa langsung menulis nilai sembarangan ke `db.ts` tanpa lewat aturan bisnis

### 8. **Performance Optimization**

- Next.js Image component untuk aset visual (tema, ikon rank)
- Lazy loading untuk komponen berat (modal refleksi, theme picker)
- Query Dexie hanya field/index yang diperlukan (manfaatkan index yang didefinisikan di `db.ts`, contoh: `quests.where('status').equals('pending')`)
- Static generation tetap relevan untuk halaman yang benar-benar statis (landing page, jika ada) — tapi halaman yang baca IndexedDB otomatis butuh client-side rendering
- Caching ringan di memori (bukan network cache) untuk daftar tema yang sudah unlock, supaya tidak query Dexie di setiap re-render

### 9. **Code Style**

- TypeScript strict mode aktif
- ESLint + Prettier untuk konsistensi format
- Functional components dengan hooks
- Async/await, hindari `.then()` chaining
- Fungsi bisnis penting (momentum, level, penalty) punya explicit return type

### 10. **Testing Strategy**

- Unit test untuk logika bisnis inti: kalkulasi Momentum Score, decay, formula level, penalty
- Integration test untuk operasi `db.ts`: gunakan [`fake-indexeddb`](https://www.npmjs.com/package/fake-indexeddb) supaya Dexie bisa jalan di lingkungan Node (Jest/Vitest) tanpa browser sungguhan
- E2E test (Playwright) untuk flow kritis: buat quest → selesaikan → cek level naik → redeem reward — jalankan di browser asli karena butuh IndexedDB beneran
- Tidak perlu mock database eksternal (tidak ada Supabase) — cukup reset IndexedDB (`db.delete()` lalu re-init) di antara test

## Development Workflow

1. **Feature Development**
   - Buat feature branch dari `main`
   - Implementasi fitur beserta test untuk logika bisnis inti
   - Jalankan linter dan test secara lokal
   - Buat pull request (jika sudah kolaborasi; untuk solo dev bisa langsung commit ke `main` dengan disiplin commit message)

2. **Code Review** (opsional di fase solo, wajib saat sudah multi-kontributor)
   - Minimal satu approval sebelum merge
   - Cek konsistensi dengan arsitektur ini
   - Pastikan logika momentum/level/penalty punya test

3. **Deployment**
   - CI/CD otomatis via GitHub Actions (lint + test sebelum deploy)
   - Tidak ada environment staging database (tidak ada backend) — cukup preview deployment Vercel per branch/PR untuk uji coba UI sebelum merge ke `main`
   - Deploy ke Vercel setelah lolos CI

## Naming Conventions

- **Files**: kebab-case (`quest-card.tsx`)
- **Components**: PascalCase (`QuestCard`)
- **Functions**: camelCase (`calculateMomentumScore`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_DECAY_GRACE_DAYS`)
- **Database (Dexie)**: camelCase untuk nama tabel & field (`momentumHistory`, `createdAt`, `momentumScore`) — mengikuti konvensi TypeScript, bukan snake_case ala SQL

## Module Dependencies

```
Presentation Layer
    ↓
Business Logic Layer (app/lib)
    ↓
Data Layer (Dexie / IndexedDB, app/lib/db.ts)
```

Semua layer jalan di browser yang sama — tidak ada network boundary. Data Layer tetap tidak boleh bergantung pada Presentation Layer. Logika bisnis inti (momentum, level, penalty) ditempatkan di `app/lib`, bukan tersebar di dalam komponen UI, agar mudah di-test secara terpisah (lihat §10 — bisa di-test tanpa browser sungguhan berkat `fake-indexeddb`).

## Catatan Migrasi ke Multi-device/Multi-user

Kalau nanti app ini butuh sinkron lintas device atau multi-user, ini bukan penyesuaian kecil — Business Logic Layer (`app/lib`) perlu ditulis ulang supaya bicara ke backend (API routes/Server Actions) alih-alih langsung ke Dexie, dan baru backend itu yang bicara ke database beneran (misal Supabase/Postgres, dengan `user_id` + RLS). Struktur tabel di `db.ts` sengaja dibuat semirip mungkin dengan skema relasional supaya migrasi datanya (export JSON → import ke Postgres) tetap mudah, tapi bagian arsitektur di dokumen ini (§4, §6) akan berubah signifikan saat migrasi itu terjadi.
