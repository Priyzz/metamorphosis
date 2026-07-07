# Metamorphosis - Gamified Productivity App

A Solo-Leveling-inspired productivity app where daily to-dos become ranked quests, points build a Momentum Score that drives your level, and points can be redeemed for real-life rewards you define yourself. Built with Next.js 15, TypeScript, and local-first storage (IndexedDB via Dexie).

> **Local-first, single device.** This app runs entirely in the browser — no backend, no login, no network calls. All data lives in IndexedDB on the device you use it from. See [Multi-device / multi-user later](#multi-device--multi-user-later) if you outgrow this.

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: IndexedDB via [Dexie.js](https://dexie.org/) (local-first, in-browser)
- **Styling**: Tailwind CSS v4 + shadcn/ui + Radix UI
- **Code Quality**: ESLint, Prettier

## Architecture

### Project Structure

```
app/
├── (main)/              # App pages
│   ├── dashboard/       # Today's quests + level/momentum summary
│   ├── quests/          # Quest management (create, complete/fail)
│   ├── rewards/         # Reward shop
│   ├── journal/         # Reflection journal (level-up checkpoints)
│   ├── history/         # Quest & reward history
│   └── settings/        # Penalty config, decay config, theme picker
├── components/          # Reusable components
│   ├── ui/              # UI primitives (shadcn/ui)
│   ├── layout/          # Layout components (navbar, theme provider)
│   ├── quest/           # Quest components
│   ├── reward/          # Reward components
│   ├── level/           # Level/momentum components
│   └── theme/           # Theme picker components
├── lib/                 # Utilities and configurations
│   ├── db.ts             # Dexie database definition (all tables live here)
│   ├── momentum.ts        # Momentum Score & decay logic
│   ├── level.ts           # Level formula
│   └── penalty.ts         # Penalty calculation
└── types/                # TypeScript type definitions
```

No `(auth)/` route group and no `api/` routes — since everything runs client-side against IndexedDB, there's no server logic to route to. Read/write calls go straight from components/hooks to `lib/db.ts`.

### Key Modules

1. **Quest Management** - Create quests with rank (E–S) and manual points, mark complete/fail
2. **Points, EXP & Level** - Total EXP (lifetime stat) vs. Momentum Score (decays if inactive, drives Level)
3. **Reflection Checkpoint** - Prompt on level-up, saved to a personal journal
4. **Penalty System** - Configurable point deduction on failed quests (toggle + adjustable percentage)
5. **Reward Shop** - User-defined real-life rewards, redeemable with points
6. **Theme System** - Custom UI themes unlocked every 5 levels, colors defined by the user

## Data Storage

All data lives in IndexedDB, defined in `lib/db.ts`: `quests`, `momentumHistory`, `journalEntries`, `themes`, `rewards`, `rewardRedemptions`, and a single-row `settings` table (aggregate state: total EXP, momentum score, current level, decay/penalty config, active theme).

Because it's IndexedDB:
- Data is **per-browser**. Clearing browser storage/site data deletes it. Different browser or device = empty app.
- There's no login, no user_id, no RLS — there's only ever one "user."
- Export/import (e.g. to JSON) is worth adding early as a manual backup, since there's no cloud copy.

## Getting Started

### Prerequisites

- Node.js 20+

### Installation

1. Install dependencies

```bash
npm install
```

2. Run development server

```bash
npm run dev
```

Visit `http://localhost:3000`

No environment variables, no database setup — the first time the app loads, `lib/db.ts` creates the IndexedDB database and a default `settings` row automatically.

## Development

### Code Quality

```bash
npm run lint
```

## Deployment

Deploy on Vercel (or any static/Node host). Since there's no backend, this is just a frontend deploy — no database or auth provider to configure.

## Multi-device / multi-user later

If this ever needs to work across devices or support other users, the migration path is: swap `lib/db.ts` for a real backend (e.g. Supabase/Postgres), add auth, and add `user_id` + RLS to each table. The table shapes in `lib/db.ts` were kept close to a relational schema on purpose to make that migration straightforward — export each IndexedDB table to JSON and import into the equivalent Postgres tables.

## License

Private - Personal Project © 2026
