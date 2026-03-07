# ClassCiv — Classroom Civilization Simulation

> A 6-week classroom civilization simulation teaching the **5 Themes of Geography**. Built for Mr. Somers' middle school classes at Next Chapter Homeschool.
>
> **Live:** [next-chapter-homeschool.vercel.app](https://next-chapter-homeschool.vercel.app)
> **Repo:** [TheAccidentalTeacher/NextChapterHomeschool](https://github.com/TheAccidentalTeacher/NextChapterHomeschool)

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Authentication & Roles](#authentication--roles)
- [Project Structure](#project-structure)
- [Pages & Routes](#pages--routes)
- [API Reference](#api-reference)
- [Game Engine](#game-engine)
- [Components](#components)
- [Database Schema](#database-schema)
- [Deployment](#deployment)
- [Testing Guide](#testing-guide)
- [Build Status](#build-status)
- [Related Documents](#related-documents)

---

## Overview

ClassCiv is a turn-based classroom civilization simulation where teams of students build, expand, trade, and defend their civilizations across a shared world map. The teacher acts as **Dungeon Master (DM)**, controlling the pace, firing events, and scoring submissions. A separate **projector view** displays the map and game state on the classroom screen.

**Key concepts:**
- **Epochs** — Each class session is one epoch (day). The game runs ~15 epochs (adjustable).
- **Rounds** — Each epoch cycles through phases: LOGIN → BUILD → BUILD_ROUTING → EXPAND → EXPAND_ROUTING → DEFINE → DEFINE_ROUTING → DEFEND → DEFEND_ROUTING → RESOLVE → EXIT
- **Roles** — Each student on a team holds a specialist role: Architect, Merchant, Diplomat, Lorekeeper, or Warlord
- **Submissions** — During each round, the team's lead role answers a scaffolded question. The DM scores it (1-5). Higher scores = better resource yields.
- **Resources** — ⚙️ Production, 🧭 Reach, 📜 Legacy, 🛡️ Resilience, 🌾 Food
- **Victory** — Multiple paths: Economic, Population, Cultural, Scientific, or Endgame Epoch

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Next.js (App Router) | 16.1.6 |
| **Language** | TypeScript | 5.x |
| **UI** | React | 19.2.3 |
| **Styling** | Tailwind CSS | 4.x |
| **Database** | Supabase (PostgreSQL + Realtime + RLS) | — |
| **Auth** | Clerk (username-only, no email/phone) | 7.x |
| **Map** | Leaflet + React-Leaflet | 1.9.4 / 5.0.0 |
| **State** | Zustand | 5.x |
| **Hosting** | Vercel | — |
| **AI (planned)** | Claude (narration) + HeyGen (NPC video) | — |

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    VERCEL (Next.js)                   │
│                                                      │
│  ┌────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  Student    │  │   DM/      │  │   Projector    │  │
│  │  Dashboard  │  │   Teacher  │  │   Display      │  │
│  │  /dashboard │  │   /dm/*    │  │   /projector   │  │
│  └──────┬─────┘  └──────┬─────┘  └───────┬────────┘  │
│         └───────────┬───┘────────────────┘            │
│                     │                                 │
│             ┌───────▼────────┐                        │
│             │  API Routes    │                        │
│             │  /api/games/*  │                        │
│             └───┬────────┬───┘                        │
│                 │        │                            │
│  ┌──────────────▼──┐  ┌──▼───────────────┐            │
│  │  Clerk Auth     │  │  Supabase Client │            │
│  │  (middleware)   │  │  (server-side)   │            │
│  └─────────────────┘  └────────┬─────────┘            │
└─────────────────────────────────┼─────────────────────┘
                                  │
                       ┌──────────▼──────────┐
                       │     SUPABASE        │
                       │  PostgreSQL + RLS   │
                       │  Realtime channels  │
                       │  29 tables          │
                       └─────────────────────┘
```

---

## Getting Started

### Prerequisites

- **Node.js** 20+ and npm
- **Supabase** project (free tier works)
- **Clerk** application (free tier works)

### Installation

```bash
# Clone the repo
git clone https://github.com/TheAccidentalTeacher/NextChapterHomeschool.git
cd NextChapterHomeschool

# Install dependencies
npm install

# Copy env template
cp .env.local.example .env.local
# Fill in your keys (see Environment Variables below)

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (default port 3000) |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (e.g. `https://xxxxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key (starts with `pk_`) |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (starts with `sk_`) |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Sign-in route path. Set to `/sign-in` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Post-login redirect. Set to `/dashboard` |
| `ANTHROPIC_API_KEY` | No | Claude API key (for AI narration — future feature) |
| `HEYGEN_API_KEY` | No | HeyGen API key (for NPC video — future feature) |

> **Note:** `NEXT_PUBLIC_DEBUG=true` enables the F12 console debug toolkit. Type `classciv.debug.help()` in the browser console for available commands.

---

## Authentication & Roles

ClassCiv uses **Clerk** with **username-only auth** (no email, no phone — designed for students).

### Three Roles

| Role | How to set | What they access |
|------|-----------|-----------------|
| **teacher** | Clerk `publicMetadata.role = "teacher"` | `/dm/*` — Game management, DM controls |
| **student** | Clerk `publicMetadata.role = "student"` (or default) | `/dashboard` — Team view, submissions |
| **projector** | Clerk `publicMetadata.role = "projector"` | `/projector` — No login required |

### Creating Users via Clerk API

```bash
# Teacher user
curl -X POST https://api.clerk.com/v1/users \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"username":"scott","password":"YourPassword!","public_metadata":{"role":"teacher"}}'

# Student users
curl -X POST https://api.clerk.com/v1/users \
  -H "Authorization: Bearer YOUR_CLERK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"YourPassword!","public_metadata":{"role":"student"}}'
```

You can also create users in the [Clerk Dashboard](https://dashboard.clerk.com) → Users → Create User. Set `publicMetadata` to `{ "role": "teacher" }` or `{ "role": "student" }`.

### Route Protection (Middleware)

| Route Pattern | Access |
|--------------|--------|
| `/` | Public (landing page) |
| `/sign-in(.*)` | Public (Clerk sign-in) |
| `/api/webhooks(.*)` | Public |
| `/projector(.*)` | Public (no auth required) |
| `/dashboard` | Authenticated — students stay, teachers redirect to `/dm` |
| `/dm/*` | Authenticated (teacher role enforced at API level) |
| All other routes | Authenticated (Clerk `auth.protect()`) |

---

## Project Structure

```
classroom-civ/
├── public/
│   └── data/
│       ├── question-bank.json    # 12 starter questions across roles/rounds
│       ├── regions.json          # 12 macro-regions with GeoJSON boundaries
│       └── sub-zones.json        # 72 sub-zones (6 per region)
├── scripts/
│   ├── simulate.ts               # Game simulation engine (36 students, 6 teams, 8 epochs)
│   └── run-migration.ts          # Utility to run SQL migrations against Supabase
├── src/
│   ├── app/
│   │   ├── api/                  # 20 API route files (see API Reference)
│   │   ├── dashboard/            # Student dashboard (page + client component)
│   │   ├── dm/                   # Teacher DM pages (overview, setup, roster, names, game)
│   │   ├── projector/            # Projector display (page + client component)
│   │   ├── sign-in/              # Clerk sign-in page
│   │   ├── layout.tsx            # Root layout (ClerkProvider, fonts, CSS)
│   │   ├── page.tsx              # Landing page
│   │   └── globals.css           # Tailwind CSS config
│   ├── components/
│   │   ├── dashboard/            # Student panels (Architect, Merchant, etc.)
│   │   ├── dm/                   # DM controls (submissions, events, intel)
│   │   ├── game/                 # Game mechanics (resource routing)
│   │   ├── map/                  # Leaflet map (GameMap, SubZoneLayer, MarkerLayer)
│   │   ├── modals/               # Student-facing modals (events, intel)
│   │   ├── projector/            # Projector overlays (resolve, events, pause)
│   │   ├── student/              # Student-specific (CivNamePrompt)
│   │   └── submission/           # Submission cards and status tracking
│   ├── hooks/
│   │   └── useEpochState.ts      # Realtime epoch state polling + Supabase subscription
│   ├── lib/
│   │   ├── auth/roles.ts         # Clerk role helpers (getUserRole, requireTeacher)
│   │   ├── game/                 # Game engine modules (epoch, yield, decay, population, etc.)
│   │   ├── questions/            # Question selector + types
│   │   ├── supabase/             # Supabase client config (browser, server, middleware)
│   │   └── constants.ts          # Game constants (resources, roles, terrain, regions)
│   ├── stores/
│   │   └── game-store.ts         # Zustand client state store
│   └── types/
│       └── database.ts           # Full TypeScript types for all 29 DB tables
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql # 29 tables, 13 enums, RLS policies
│       └── 002_fix_current_round.sql # Add DEFEND enum + change current_round to text
├── BRAINSTORM.md                  # 93 locked design decisions (1,518 lines)
├── BUILD-PLAN.md                  # 15-phase build plan (1,701 lines)
├── AUDIT-REPORT.md                # Decision consistency audit
├── student-ideas-analysis.md      # 86 student brainstorm submissions analyzed
├── .env.local.example             # Environment variable template
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## Pages & Routes

### User-Facing Pages

| Route | Role | Description |
|-------|------|-------------|
| `/` | Public | Landing page — links to sign-in and projector |
| `/sign-in` | Public | Clerk username/password sign-in |
| `/dashboard` | Student | Main student view — role panels, map, submissions, resources |
| `/dm` | Teacher | DM overview — list of games, quick actions |
| `/dm/setup` | Teacher | Create new game — name, class period, victory conditions |
| `/dm/roster` | Teacher | Manage teams — add students, assign roles |
| `/dm/names` | Teacher | Review and approve/reject civilization names |
| `/dm/game/[id]` | Teacher | Live game management — map, submissions, controls, events |
| `/projector` | Public | Classroom display — map, overlays, leaderboard, events |

---

## API Reference

All API routes are under `/api/`. Teacher-only routes enforce role via `requireTeacher()`.

### Games

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/games` | Teacher | List all games for this teacher |
| POST | `/api/games` | Teacher | Create a new game |
| GET | `/api/games/[id]` | Auth | Get full game state |
| PUT | `/api/games/[id]` | Teacher | Update game settings |
| DELETE | `/api/games/[id]` | Teacher | Delete a game |

### Epoch (Game Clock)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/games/[id]/epoch/state` | Auth | Get current epoch, round, phase, timer |
| PUT | `/api/games/[id]/epoch/advance` | Teacher | Advance epoch: `next_step`, `next_epoch`, `set_step`, `pause`, `resume` |

### Teams & Students

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/games/[id]/teams` | Auth | List all teams in game |
| POST | `/api/games/[id]/teams` | Teacher | Create a new team |
| GET | `/api/games/[id]/teams/[teamId]/students` | Auth | List students on team |
| POST | `/api/games/[id]/teams/[teamId]/students` | Teacher | Add student to team |
| PUT | `/api/games/[id]/teams/[teamId]/students/[studentId]` | Teacher | Update student role or mark absent |
| DELETE | `/api/games/[id]/teams/[teamId]/students/[studentId]` | Teacher | Remove student from team |

### Civilization Names

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/games/[id]/names` | Teacher | List all pending civ name submissions |
| POST | `/api/games/[id]/teams/[teamId]/name` | Student | Submit a civilization name |
| GET | `/api/games/[id]/teams/[teamId]/name` | Auth | Get current name status |
| PUT | `/api/games/[id]/teams/[teamId]/name/approve` | Teacher | Approve or reject a civ name |

### Submissions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/games/[id]/submissions` | Student | Submit a round decision (answer + justification) |
| GET | `/api/games/[id]/submissions` | Auth | List submissions (filterable by epoch/round/team) |
| GET | `/api/games/[id]/submissions/status` | Auth | Per-team submission status (which roles have submitted) |
| PUT | `/api/games/[id]/submissions/[submissionId]/score` | Teacher | DM scores a submission (1-5 + feedback) |

### Resources

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/games/[id]/resources` | Student | Route earned resources (spend/contribute/bank split) |

### Map & Fog

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/games/[id]/fog` | Auth | Get fog-of-war state (per-team or all for DM) |

### Messages & Events

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/games/[id]/messages/private` | Teacher | Send private intel drop to a team |
| GET | `/api/games/[id]/messages/private` | Auth | Get private messages for a team |
| POST | `/api/games/[id]/events/global` | Teacher | Fire a global event (Flood, Plague, Gold Rush, etc.) |
| GET | `/api/games/[id]/events/global` | Auth | List global events |

### Conflicts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/games/[id]/conflicts/resolve` | Teacher | Resolve a conflict flag |
| GET | `/api/games/[id]/conflicts/resolve` | Auth | List active conflicts |

### Recaps

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/games/[id]/recap/[teamId]` | Auth | Get daily recap for a team |

### Student Self-Service

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/me/team` | Student | Get current student's team + game info |

---

## Game Engine

The game engine is split into focused modules in `src/lib/game/`:

| Module | File | Purpose |
|--------|------|---------|
| **Epoch Machine** | `epoch-machine.ts` | 11-phase state machine controlling the game clock. Phases: `login` → `build` → `build_routing` → `expand` → `expand_routing` → `define` → `define_routing` → `defend` → `defend_routing` → `resolve` → `exit`. Includes timer presets (8 min for 6th grade, 5 min for 7-8th). |
| **Yield Calculator** | `yield-calculator.ts` | Formula: `Base × JustificationMultiplier × d20Modifier × TerrainBonus × TechBonus × DepletionPenalty × PopulationMultiplier`. Produces detailed breakdown. |
| **Bank Decay** | `bank-decay.ts` | 10% decay per epoch on banked resources. Banking tech reduces to 5% + adds interest. Caravan theft mechanic. |
| **Population Engine** | `population-engine.ts` | Food-driven growth. Farms/Granaries produce food. Population is a yield multiplier AND capacity gate. Famine = population loss. |
| **Depletion Engine** | `depletion-engine.ts` | Sub-zone soil fertility + wildlife stock tracking. Over-harvesting degrades zones. Recovery when unworked. |
| **War Exhaustion** | `war-exhaustion.ts` | Multi-epoch consequences for warfare. 50/75/100 thresholds. Yield penalties escalate. |
| **Dark Ages** | `dark-ages.ts` | Triggered by combined crises (famine + war exhaustion + depletion). Reduced yields, restricted actions, recovery conditions. |

### Question System

| File | Purpose |
|------|---------|
| `src/lib/questions/types.ts` | `QuestionBankEntry`, `QuestionOption`, `TeamStateSnapshot`, `ScaffoldingConfig` types |
| `src/lib/questions/selector.ts` | Scores question bank entries against current team state (resources, epoch, tech level) to pick contextually appropriate questions |
| `public/data/question-bank.json` | 12 starter questions across all round types and roles |

### Simulation Engine

The simulation engine in `scripts/simulate.ts` runs a complete automated game against live Supabase — bypassing Clerk auth to exercise all game mechanics end-to-end.

| Feature | Detail |
|---------|--------|
| **Students** | 36 simulated with 6 personality archetypes (scholar, adventurer, cautious, random, minimalist, warmonger) |
| **Teams** | 6 teams of 6, each with all 5 roles assigned |
| **Epochs** | Default 8 (configurable via `--epochs N`) |
| **Mechanics tested** | Yield calculator, population engine, bank decay, dark age checks, question selection, resource routing, epoch state machine (11 steps per epoch) |
| **Output** | Full play-by-play log + final standings. Log saved to `simulation-log-{gameId}.txt` |

```bash
# Full 8-epoch simulation
npx tsx scripts/simulate.ts

# Quick 3-epoch test
npx tsx scripts/simulate.ts --fast --epochs 3

# 4 teams instead of 6
npx tsx scripts/simulate.ts --teams 4

# Dry run (no DB writes)
npx tsx scripts/simulate.ts --dry-run

# Clean up a simulation game
npx tsx scripts/simulate.ts --cleanup GAME_ID
```

> **Important:** Must be run from the `classroom-civ/` directory.

---

## Components

### Dashboard (Student-Facing) — `src/components/dashboard/`

| Component | Props | Purpose |
|-----------|-------|---------|
| `TopBar` | teamName, civName, epoch, step, role, resources, population, ciScore | Top HUD showing all vital game state |
| `ResourceBar` | resources (Record), population, ciScore, compact? | Resource display with emoji icons |
| `PopulationBar` | population, foodStored, growthRate, maxPop? | Population bar with food/growth details |
| `ArchitectPanel` | teamBuildings, productionAvailable, onBuild? | BUILD round — buildings list and build queue |
| `MerchantPanel` | reachAvailable, tradeOffers, activeAgreements, isEmbargoActive + callbacks | EXPAND round — trade board and agreements |
| `DiplomatPanel` | alliances, laws, pendingProposals, warExhaustion + callbacks | DEFINE round — diplomacy actions |
| `LorekeeperPanel` | creatures, codex, hasWritingTech, ciScore, ciSpread, flagUrl + callbacks | DEFINE round — mythology and cultural influence |
| `WarlordPanel` | units, armyStrength, resilienceAvailable, warExhaustion, defenseStatus + callbacks | DEFEND round — military management |
| `LoginRecapCard` | gameId, teamId, epoch | "Previously on your civilization..." recap |

### DM Controls — `src/components/dm/`

| Component | Props | Purpose |
|-----------|-------|---------|
| `DMControlBar` | gameId, epochState, onAdvance | Pause/resume, advance round, next epoch buttons |
| `SubmissionQueue` | gameId, epochState | Real-time team × role submission tracker with 5s polling |
| `SubmissionOverrideModal` | submission, onScore, onClose | DM reviews and scores a submission (1-5 + feedback) |
| `IntelDropForm` | gameId, teams | Send private intel message to a specific team |
| `GlobalEventForm` | gameId | Broadcast event with presets (Flood, Plague, Gold Rush, etc.) |
| `ConflictFlagBanner` | gameId | Red banner for unresolved conflicts |
| `PushToProjector` | gameId | Push view or announcement to the projector display |
| `TeamCard` | team | Card showing team members, roles, region |
| `RosterManager` | game, team | Full CRUD for team roster (add students, assign roles, mark absent) |

### Map — `src/components/map/`

| Component | Props | Purpose |
|-----------|-------|---------|
| `MapWrapper` | ...GameMap props | SSR-safe dynamic import wrapper |
| `GameMap` | center, zoom, subZones, teamColors, fogState, markers, onSubZoneClick | Leaflet map with CartoDB dark tiles |
| `SubZoneLayer` | subZones, teamColors, fogState, onClick | GeoJSON polygon rendering with depletion coloring + fog |
| `MarkerLayer` | markers | Unit/building emoji markers with tooltips |
| `RegionBonusCard` | region | Regional terrain bonus display |

### Projector Overlays — `src/components/projector/`

| Component | Props | Purpose |
|-----------|-------|---------|
| `PausedOverlay` | — | Full-screen "GAME PAUSED" with blur |
| `ResolveSequence` | teams, onComplete | 3-phase animated resolve (intro → processing → results) |
| `AnnouncementOverlay` | text, onDismiss | Timed full-screen announcement |
| `EventCardOverlay` | event, onDismiss | Event notification with type-specific icons |
| `DarkAgesBanner` | teamName | "Dark Ages" dramatic overlay |
| `DailyRecapCard` | recapText | Epoch recap text display |
| `ExitHookCard` | epoch | End-of-class reflection prompt (8 rotating prompts) |

### Submission — `src/components/submission/`

| Component | Props | Purpose |
|-----------|-------|---------|
| `RoundSubmissionCard` | gameId, teamId, role, roundType, epoch, promptText, options, historicalContext, allowFreeText, grade | Full submission card with question, options, justification |
| `JustificationField` | value, onChange, grade, roundType | Scaffolded writing field (6th grade: sentence starters; 7-8th: guided questions) |
| `SubmissionStatus` | gameId, teamId, currentRound | Real-time submission tracker per role/round |

### Modals — `src/components/modals/`

| Component | Props | Purpose |
|-----------|-------|---------|
| `IntelDropModal` | gameId, teamId | Polls for private DM messages, displays with dismiss |
| `GlobalEventModal` | gameId | Polls for global events, displays with dismiss |

---

## Database Schema

The full schema is in `supabase/migrations/001_initial_schema.sql` (29 tables with RLS policies) + `002_fix_current_round.sql` (DEFEND enum fix + current_round type change).

### Core Tables

| Table | Purpose |
|-------|---------|
| `games` | Game sessions — epoch state, round, timer, teacher ID |
| `teams` | Teams within a game — name, civ name, region, color |
| `team_members` | Student-to-team assignments with role |
| `team_resources` | Resource balances per team (production, reach, legacy, resilience, food) |
| `submissions` | Round submissions — answer, justification, DM score, yield |
| `sub_zones` | Map zones — terrain, depletion, ownership, buildings |
| `buildings` | Constructed buildings per sub-zone |
| `tech_tree_progress` | Per-team tech research state |
| `epoch_logs` | Historical log per epoch/team (resources, population, events) |
| `events` | Global and team-specific event log |
| `trade_agreements` | Active trade deals between teams |
| `wars` | Active wars between teams |
| `war_battles` | Individual battle outcomes |
| `conflict_flags` | Flagged conflicts awaiting DM resolution |
| `daily_recaps` | Per-team daily narrative recaps |
| `private_messages` | DM-to-team intel drops |

### Enums

`user_role` · `role_name` · `resource_type` · `terrain_type` · `round_type` (includes DEFEND as of migration 002) · `epoch_phase` · `building_type` · `event_type` · `trade_status` · `war_status` · `victory_type` · `endgame_epoch_type` · `civ_name_status`

---

## Deployment

### Vercel

The app deploys automatically from the `main` branch via Vercel:

1. Push to `main` → Vercel triggers build
2. Build: `next build` (currently 30 routes, clean)
3. Environment variables set in Vercel project settings (same as `.env.local`)

### Supabase

- Project: `dyifhrodlkqjdlzbwckg` (us-west-2)
- Schema deployed via `supabase/migrations/001_initial_schema.sql` + `002_fix_current_round.sql`
- Migration 002 applied March 6, 2026 (DEFEND enum + current_round→text)
- Realtime enabled for epoch state + submission channels

---

## Testing Guide

See [TESTING-GUIDE.md](TESTING-GUIDE.md) for step-by-step instructions on running through the full game flow.

### Quick Start

| Username | Password | Role | Destination |
|----------|----------|------|-------------|
| `scott` | `ClassCiv2026!` | Teacher | `/dm` |
| `student1` | `ClassCiv2026!` | Student | `/dashboard` |
| `student2` | `ClassCiv2026!` | Student | `/dashboard` |
| `student3` | `ClassCiv2026!` | Student | `/dashboard` |

1. Sign in as **scott** → creates a game at `/dm/setup`
2. Add teams and assign students at `/dm/roster`
3. Open `/projector` on the classroom screen (no login needed)
4. Sign in as **student1** in incognito → see student dashboard
5. Use the DM game page (`/dm/game/[id]`) to advance epochs and score submissions

---

## Build Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 0 | ✅ Complete | Foundation — scaffold, DB, auth, types |
| Phase 1 | ✅ Complete | Auth + Game/Team Setup — CRUD APIs, civ naming |
| Phase 2 | ✅ Complete | Map Layer — Leaflet, GeoJSON, regions, sub-zones |
| Phase 3 | ✅ Complete | Submission System — round cards, justification, status |
| Phase 4 | ✅ Complete | DM Panel — controls, queue, scoring, events, intel |
| Phase 5 | ✅ Complete | Resource Engine — yield calc, decay, population, depletion |
| Phase 6 | ✅ Complete | Projector Display — overlays, resolve animation, exit hooks |
| — | ✅ Complete | Simulation Engine — 36 students, 6 teams, 8 epochs, 1,152 submissions |
| — | ✅ Complete | DB Migration 002 — DEFEND enum + current_round→text |
| Phase 7 | 🔲 Planned | Purchase Menu + Buildings on Map |
| Phase 8 | 🔲 Planned | d20 Event System + Math Gate |
| Phase 9 | 🔲 Planned | Tech Tree UI + Research |
| Phase 10 | 🔲 Planned | Wonder System |
| Phase 11 | 🔲 Planned | Trade System |
| Phase 12 | 🔲 Planned | HeyGen Clips + Kaiju Animations |
| Phase 13 | 🔲 Planned | NPC System |
| Phase 14 | 🔲 Planned | Portfolio Export + Epilogue |

---

## Related Documents

| Document | Description |
|----------|-------------|
| [BRAINSTORM.md](BRAINSTORM.md) | 93 locked design decisions — the full game spec (1,518 lines) |
| [BUILD-PLAN.md](BUILD-PLAN.md) | 15-phase step-by-step build plan (1,701 lines) |
| [AUDIT-REPORT.md](AUDIT-REPORT.md) | Consistency audit between BRAINSTORM and BUILD-PLAN |
| [TESTING-GUIDE.md](TESTING-GUIDE.md) | Walkthrough for testing the full game flow + simulation engine |
| [student-ideas-analysis.md](student-ideas-analysis.md) | Analysis of 86 student brainstorm submissions |
| [../Documents/game-mechanics-research.md](../Documents/game-mechanics-research.md) | Deep-dive on Civ/Oregon Trail/Carmen Sandiego/Catan mechanics |
| [../Documents/persona.md](../Documents/persona.md) | The Brand Whisperer persona + Scott & Anna profiles |
| [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql) | Initial DB schema (29 tables, 13 enums) |
| [supabase/migrations/002_fix_current_round.sql](supabase/migrations/002_fix_current_round.sql) | DEFEND enum + current_round→text fix |

---

## License

Private project. Built by Scott Somers (The Accidental Teacher) for Next Chapter Homeschool.

---

*Built with AI partnership. Designed for real classrooms. Tested in Glennallen, Alaska — population 439.*
