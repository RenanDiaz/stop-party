# StopParty - Project Guide

## Overview

StopParty is a real-time multiplayer Stop/Basta/Tuttifrutti game with a Latin focus and mobile-first design. Players compete by filling in categories with words starting with a randomly selected letter.

## Tech Stack

- **Frontend:** SvelteKit with Svelte 5 (runes-based reactivity)
- **Backend:** PartyKit (real-time WebSocket server)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS (mobile-first)
- **i18n:** svelte-i18n (Spanish default, English supported)
- **PWA:** Service Worker + Web App Manifest

## Project Structure

```
stopparty/
├── src/                    # SvelteKit frontend
│   ├── lib/
│   │   ├── components/     # Svelte components (game/, lobby/, ui/)
│   │   ├── stores/         # Svelte 5 runes state (.svelte.ts files)
│   │   ├── utils/          # Utilities (scoring, validation, sounds)
│   │   └── i18n/           # Translation files (en.json, es.json)
│   └── routes/             # SvelteKit routes (+page.svelte, room/[roomId])
├── party/                  # PartyKit backend
│   ├── stopServer.ts       # Main WebSocket server
│   ├── gameEngine.ts       # Game logic and state management
│   ├── votingManager.ts    # Vote handling and results
│   ├── letterManager.ts    # Letter selection
│   ├── timerManager.ts     # Round/voting timers
│   └── types.ts            # Server-side types
├── shared/                 # Shared code (frontend + backend)
│   ├── types.ts            # Game types (GamePhase, RoomConfig, Player, etc.)
│   ├── messages.ts         # WebSocket message types
│   ├── constants.ts        # Game constants
│   └── categories.ts       # Category presets
└── static/                 # Static assets (manifest.json, icons)
```

## Development Commands

```bash
npm run dev          # Frontend only (port 5173)
npm run dev:party    # PartyKit server only (port 1999)
npm run dev:all      # Both concurrently
npm run build        # Build frontend
npm run check        # TypeScript/Svelte check
npm run lint         # ESLint
npm run format       # Prettier
```

## Key Architecture Patterns

### Game Phases
The game flows through these phases: `lobby` → `countdown` → `playing` → `basta_called` → `voting` → `results` → `ready_check` → (repeat or `game_over`)

### State Management
- **Server:** `RoomState` in `party/types.ts` - authoritative game state
- **Client:** Svelte 5 runes in `.svelte.ts` files for reactive state

### WebSocket Messages
- **Client → Server:** `ClientMessage` types in `shared/messages.ts`
- **Server → Client:** `ServerMessage` types in `shared/messages.ts`

### Scoring System
- Unique valid answer: 10 points
- Duplicate valid answer: 5 points
- Invalid/empty answer: 0 points

## Code Conventions

- Components use Svelte 5 runes (`$state`, `$derived`, `$effect`)
- Server uses class-based PartyKit implementation
- All types are in `shared/types.ts` (shared) or `party/types.ts` (server-only)
- Translations in JSON files under `src/lib/i18n/`

## Environment Variables

- `PUBLIC_PARTYKIT_HOST`: PartyKit server URL (set after deployment)
