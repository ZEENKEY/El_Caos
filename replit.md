# Cancun Chaos — Workspace

## Overview

pnpm workspace monorepo using TypeScript. A social, async, humorous browser game set in a Cancun-style city.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind v4 + framer-motion

## Artifacts

- **`artifacts/cancun-chaos`** — React Vite frontend at `/`
- **`artifacts/api-server`** — Express API server at port 8080

## Packages

- `lib/api-spec` — OpenAPI spec (`openapi.yaml`) + Orval config
- `lib/api-zod` — Generated Zod schemas from OpenAPI
- `lib/api-client-react` — Generated React Query hooks (`lib/api-client-react/src/generated/api.ts`)
- `lib/db` — Drizzle schema (13 tables) + PostgreSQL connection

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Architecture Notes

- Frontend Vite config proxies `/api` → `http://localhost:8080` for dev
- Frontend calls `setBaseUrl("/api")` in `main.tsx`
- API server mounts all routes at `/api` prefix (`app.use("/api", router)`)
- Player ID stored in `localStorage` key `"cancunChaosPlayerId"`
- Admin panel at `/admin` (no auth required)
- Orval codegen uses single-file mode: `lib/api-zod/src/index.ts` must only export from `./generated/api`

## Database Tables

`players`, `characters`, `locations`, `houses`, `events`, `minigames`, `missions`, `inventory`, `npcs`, `achievements`, `gossip`, `traits`, `game_logs`

## Seeded Data

- 8 locations (El Crucero, Oxxo, Malecon, Plaza, Antro Neon, Taxi Fantasma, Tacos El Imprevisto, La Laguna Nichupte)
- 10 events with probability and effects
- 4 minigames (all timing-bar style)
- 8 NPCs with dialogue
- 8 achievements
- 6 personality traits
- 5 missions
- 5 starter gossip items
- Locations linked to minigames via `minigame_id`

## Pages

- `/` — Auth (enter alias, creates player)
- `/game` — Hex map, stats, bottom nav
- `/location/:id` — Location detail + minigame entry
- `/minigame/:id` — Timing-bar minigame
- `/inventory` — Player inventory
- `/social` — Gossip feed + pending decisions
- `/missions` — Active/completed missions
- `/achievements` — Achievement list
- `/house` — House with upgrade levels
- `/admin` — Full admin panel (stats, players, all entities, logs)
