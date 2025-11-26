# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cozy City Explorer is a 3D city exploration game built with React Three Fiber. Players control a customizable animal character that can walk, run, drive vehicles, and interact with AI-powered NPCs using Google's Gemini Live API for real-time voice conversations.

## Development Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server at localhost:3000
npm run build   # Production build to dist/
npm run preview # Preview production build
```

**Environment**: Set `GEMINI_API_KEY` in `.env.local` for NPC voice interactions.

## Architecture

### Core Stack
- **React 19** + **TypeScript** + **Vite**
- **Three.js** via `@react-three/fiber` (React renderer)
- **@react-three/drei** (3D helpers and controls)
- **@react-three/rapier** (Physics engine)
- **Zustand** (State management)
- **@google/genai** (Gemini Live API for voice NPCs)

### Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Canvas setup, physics world, keyboard controls mapping |
| `store.ts` | Global state (player, character, dialogue, driving, mobile input) |
| `config/physics.ts` | Centralized physics constants (player, skateboard, camera) |
| `config/world.ts` | World generation constants (grid, buildings, traffic) |
| `types/game.ts` | TypeScript types and utility functions |
| `hooks/useGameInput.ts` | Unified keyboard + mobile input handling |
| `hooks/useIsMobile.ts` | Mobile/orientation detection hooks |
| `components/Player.tsx` | Player controller with physics, camera follow, sitting/driving states |
| `components/World.tsx` | Procedural city grid generation, traffic system, NPC placement |
| `components/Vehicle.tsx` | Skateboard (with drift/engine sound) and NPC car physics |
| `components/UI.tsx` | HUD orchestrator, imports from ui-components/ |
| `utils/audio.ts` | Web Audio API synth for all game sounds (no external assets) |

### Project Structure

```
├── config/
│   ├── physics.ts      # Physics constants (PHYSICS.PLAYER, PHYSICS.SKATEBOARD)
│   ├── world.ts        # World generation constants (WORLD.BUILDING, WORLD.TRAFFIC)
│   └── index.ts        # Exports
├── types/
│   ├── game.ts         # TypeScript types, validation utilities
│   └── index.ts        # Exports
├── hooks/
│   ├── useGameInput.ts # Unified input (keyboard + mobile joystick)
│   ├── useIsMobile.ts  # Mobile detection and orientation
│   └── index.ts        # Exports
├── components/
│   ├── Player.tsx          # Main player with RigidBody physics
│   ├── World.tsx           # City grid generator
│   ├── Vehicle.tsx         # Skateboard (with drift), NPCCar
│   ├── UI.tsx              # UI orchestrator
│   ├── Lights.tsx          # Scene lighting with day/night/weather
│   ├── player/
│   │   └── CharacterModel.tsx  # Animated animal character
│   ├── npc/
│   │   ├── SimpleNPC.tsx   # Static dialogue NPCs
│   │   └── LiveNPC.tsx     # Voice-enabled NPCs (Gemini Live)
│   ├── ui-components/      # Extracted UI components
│   │   ├── ChatWindow.tsx  # Voice session chat with typing indicators
│   │   ├── MobileControls.tsx  # Touch joystick + context-aware buttons
│   │   ├── Minimap.tsx     # Top-down city view
│   │   ├── Customization.tsx   # Character customization modal
│   │   ├── GeminiLiveManager.tsx # Headless Gemini API manager
│   │   └── index.ts
│   └── world/
│       ├── Props.tsx       # Street furniture
│       ├── Buildings.tsx   # Building variants
│       ├── Nature.tsx      # Trees, bushes, flowers
│       ├── Signs.tsx       # Street signs, billboards
│       ├── Interactables.tsx  # Coins, fountains
│       └── Playground.tsx  # Park equipment
└── utils/
    ├── audio.ts        # Web Audio API sound synthesis
    └── materials.tsx   # Shared Three.js materials
```

### State Management (Zustand)

The `useGameStore` in `store.ts` manages:
- **Character customization**: `type`, `skin`, `shirt`, `pants`, `accessory`
- **Player state**: `isSitting`, `isDriving`, `isHolding`, `playerPosition`
- **Environment**: `isNight`, `weather`, `trafficState`
- **Dialogue/Voice**: `dialogue` (static), `liveSession` (Gemini voice)
- **Mobile input**: `joystick`, `buttons` (for touch controls)

### Physics Configuration

- Gravity: `[0, -40, 0]` (snappier fall than default)
- Player uses `CapsuleCollider` with ground detection sensor
- RigidBodies: `type="fixed"` for static world, `type="dynamic"` for vehicles/thrown objects
- Vehicle physics in `Vehicle.tsx` handle throttle, steering, and collision

### City Generation

`World.tsx` generates a 5x5 grid of city blocks:
- `CELL_SIZE = BLOCK_SIZE + SIDEWALK_WIDTH*2 + STREET_WIDTH`
- Block content determined by seed-based procedural generation
- Center block (0,0) is always a park with fountain
- Traffic lights cycle through states managed by `setTrafficState`

### Audio System

`utils/audio.ts` uses Web Audio API oscillators - no external audio files:
- `playSound(type, position?)` - spatial audio for game events
- `createEngineSound()` - continuous vehicle engine
- `updateListener()` - sync audio position with player

### Gemini Live Integration

Voice conversations with NPCs use `@google/genai` Live API:
1. `LiveNPC` component detects player proximity
2. Pressing interact key calls `startLiveSession(npcConfig)`
3. `UI.tsx` manages WebSocket connection, microphone capture, audio playback
4. Uses `gemini-2.5-flash-native-audio-preview` model with voice personas
