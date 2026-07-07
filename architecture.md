# Metamorphosis - Development Guidelines

## Architecture Principles

Proyek ini mengikuti prinsip Clean Architecture dengan penyesuaian untuk Next.js + Supabase:

### 1. **Separation of Concerns**

- **Presentation Layer** (`app/components`, `app/(auth)`, `app/(main)`): UI components dan pages
- **Business Logic Layer** (`app/lib`, `app/api`): Aturan bisnis (kalkulasi momentum, level, penalty) dan API routes
- **Data Layer** (Supabase: tables, RLS policies, database functions): Skema database dan akses data

### 2. **Folder Structure**

```
app/
├── (auth)/                    # Route group untuk autentikasi
│   ├── login/
│   └── register/
├── (main)/                    # Route group untuk halaman utama
│   ├── dashboard/             # Ringkasan quest hari ini + status level
│   ├── quests/                # Manajemen quest (CRUD, tandai selesai/gagal)
│   ├── rewards/                # Reward shop
│   ├── journal/                # Jurnal refleksi (hasil checkpoint level up)
│   ├── history/                # Riwayat quest & reward yang ditukar
│   └── settings/               # Konfigurasi penalty, tema, preferensi
├── api/                        # API routes (Route Handlers)
│   ├── quests/
│   │   ├── route.ts            # GET, POST /api/quests
│   │   └── [id]/
│   │       └── route.ts        # PATCH (selesai/gagal), DELETE
│   ├── rewards/
│   │   ├── route.ts            # GET, POST /api/rewards
│   │   └── [id]/redeem/
│   │       └── route.ts        # POST /api/rewards/:id/redeem
│   ├── momentum/                # Endpoint kalkulasi & pengecekan decay
│   ├── journal/                 # CRUD entry refleksi
│   └── themes/                  # Unlock & pemilihan tema
├── components/
│   ├── ui/                     # Primitif UI (Button, Input, Card, Modal)
│   ├── layout/                 # Navbar, Sidebar, ThemeProvider
│   ├── quest/                  # QuestCard, QuestForm, RankBadge
│   ├── reward/                 # RewardCard, RewardForm, RedeemButton
│   ├── level/                  # LevelProgressBar, ReflectionModal
│   └── theme/                  # ThemePicker, ThemePreview
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Supabase client (browser)
│   │   ├── server.ts           # Supabase client (server components/actions)
│   │   └── middleware.ts       # Session refresh middleware
│   ├── momentum.ts             # Logika Momentum Score & decay
│   ├── level.ts                 # Formula konversi Momentum Score → Level
│   ├── penalty.ts               # Kalkulasi potongan poin saat quest gagal
│   └── utils.ts                 # Helper umum
└── types/                      # Definisi TypeScript (Quest, Reward, User, dll)
```

### 3. **Component Organization**

- **UI Components**: Elemen kecil yang reusable (Button, Input, Card, Modal)
- **Feature Components**: Komponen dengan logika bisnis spesifik (QuestCard, RewardCard, LevelProgressBar)
- **Page Components**: Komponen spesifik per route

### 4. **API Routes Structure**

```
app/api/
├── quests/
│   ├── route.ts                    # GET semua quest, POST quest baru
│   └── [id]/route.ts               # PATCH status (selesai/gagal), DELETE
├── rewards/
│   ├── route.ts                    # GET semua reward, POST reward baru
│   └── [id]/redeem/route.ts        # POST tukar reward dengan poin
├── momentum/route.ts               # GET status momentum, trigger recalculation decay
├── journal/route.ts                # GET/POST entry refleksi
└── themes/
    ├── route.ts                    # GET tema yang sudah unlock
    └── [id]/activate/route.ts      # POST set tema aktif
```

### 5. **Database Layer (Supabase)**

- Gunakan Supabase (PostgreSQL) sebagai satu-satunya sumber kebenaran skema
- Setiap tabel utama memiliki kolom `user_id` sejak awal (siap multi-user)
- **Row Level Security (RLS)** diaktifkan di semua tabel — user hanya bisa akses data miliknya sendiri
- Gunakan **Postgres functions/triggers** untuk logika yang harus konsisten di level database (contoh: update Total EXP saat quest ditandai selesai)
- Gunakan transaction (via RPC/Postgres function) untuk operasi yang menyentuh banyak tabel sekaligus (contoh: redeem reward → kurangi poin + catat log riwayat)
- Soft delete untuk quest/reward yang dihapus (kolom `deleted_at`), agar riwayat tetap utuh

### 6. **State Management**

- Server Components sebagai default (Next.js App Router)
- Client Components hanya untuk elemen interaktif (form quest, form reward, theme picker, reflection modal)
- Gunakan **Next.js Server Actions** untuk mutasi data (buat quest, tandai selesai, redeem reward)
- URL state untuk filter/paginasi riwayat (misal `?status=completed`)

### 7. **Security Best Practices**

- Validasi input di semua form (gunakan Zod untuk schema validation)
- Supabase RLS sebagai lapisan utama pencegahan akses data lintas user
- Proteksi XSS (React escape secara default)
- Autentikasi & session management via Supabase Auth
- Rate limiting pada API routes yang sensitif (contoh: redeem reward)
- Validasi ulang di server untuk kalkulasi poin/level (jangan percaya nilai dari client)

### 8. **Performance Optimization**

- Next.js Image component untuk aset visual (tema, ikon rank)
- Lazy loading untuk komponen berat (modal refleksi, theme picker)
- Query Supabase hanya select kolom yang diperlukan
- Static generation untuk halaman yang tidak butuh data real-time (landing page, jika ada)
- Caching ringan untuk daftar tema yang sudah unlock

### 9. **Code Style**

- TypeScript strict mode aktif
- ESLint + Prettier untuk konsistensi format
- Functional components dengan hooks
- Async/await, hindari `.then()` chaining
- Fungsi bisnis penting (momentum, level, penalty) punya explicit return type

### 10. **Testing Strategy**

- Unit test untuk logika bisnis inti: kalkulasi Momentum Score, decay, formula level, penalty
- Integration test untuk API routes (quest CRUD, redeem reward)
- E2E test untuk flow kritis: buat quest → selesaikan → cek level naik → redeem reward
- Mock Supabase client saat testing logika bisnis murni

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
   - Environment staging (Supabase project terpisah) untuk uji coba sebelum production
   - Deploy ke Vercel setelah lolos staging

## Naming Conventions

- **Files**: kebab-case (`quest-card.tsx`)
- **Components**: PascalCase (`QuestCard`)
- **Functions**: camelCase (`calculateMomentumScore`)
- **Constants**: UPPER_SNAKE_CASE (`DEFAULT_DECAY_GRACE_DAYS`)
- **Database**: snake_case (`user_id`, `created_at`, `momentum_score`)

## Module Dependencies

```
Presentation Layer
    ↓
Business Logic Layer
    ↓
Data Layer (Supabase)
```

Data Layer tidak boleh bergantung pada Presentation Layer. Logika bisnis inti (momentum, level, penalty) ditempatkan di `app/lib`, bukan tersebar di dalam komponen UI, agar mudah di-test secara terpisah.
