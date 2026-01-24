# YAK GAUNTLET - Complete Application Architecture & Documentation

**Version:** 6.1 (Major Overhaul)
**Last Updated:** 2026-01-24
**Total Codebase:** ~13,713 lines of TypeScript

## Recent Updates (v6.1)

### Critical Bug Fixes
- **Fixed State Management Loop Bug**: Removed duplicate `GameStateService.initNewRun()` call from RunScene that was causing state corruption. Now properly initialized only in BootScene when starting a new game.
- **Fixed End-Game Flow**: Corner3LeftScene now correctly transitions to ResultScene instead of forcing players through QuizScene, eliminating the loop bug that sent players back to quiz after entering initials.
- **Quiz Made Optional**: QuizScene removed from required gauntlet flow - now available as bonus content only.

### Cornhole Physics Overhaul
- **Realistic Sliding Mechanics**: Beanbags now properly slide on the board with friction-based physics instead of just bouncing
- **Board Friction**: Separate friction coefficients for air (0.98) vs board surface (0.92)
- **Minimal Bounce**: Beanbags have realistic low bounce (0.15) when hitting the board
- **Slide-Into-Hole**: Bags can now slide into the hole from any direction, not just drop straight in
- **Improved Feedback**: Added "thud" sound effect when bag lands on board

### Game Flow Improvements
- **Proper State Reset**: Game state now cleanly resets between runs
- **Timer Management**: Timer properly starts on first station input and stops when final station completes
- **7-Station Gauntlet**: Cornhole → Goalie → Wiffle → Football → 3PT Right → 3PT Left → Quiz → Results

### High-Fidelity Graphics Engine (NEW)
- **Procedural Texture Factory**: Zero-dependency runtime texture generation using Phaser Graphics API
  - Hardwood court with realistic wood grain, knots, glossy finish, and court lines
  - Fabric beanbags with cross-hatch texture, stitching details, and specular highlights
  - Wooden cornhole board with grain patterns, scuff marks, and deep shadowy hole
- **Dynamic Lighting System**: Phaser Light2D pipeline for depth and realism
  - Studio overhead lighting simulating professional studio setup
  - Warm ambient fill light for natural look
  - Pointer-following spotlight that intensifies on click/touch
  - All game objects respond to lighting for 3D-like depth in 2D space
- **Performance**: All textures generated at runtime - zero external image files required

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Patterns](#architecture-patterns)
4. [Directory Structure](#directory-structure)
5. [Core Systems](#core-systems)
6. [Game Flow](#game-flow)
7. [Frontend/UI Implementation](#frontendui-implementation)
8. [Backend/API Integration](#backendapi-integration)
9. [Data Models & Types](#data-models--types)
10. [Scene Breakdown](#scene-breakdown)
11. [Utilities & Helpers](#utilities--helpers)
12. [Build & Deployment](#build--deployment)
13. [Performance & Optimization](#performance--optimization)
14. [Future Development Guidelines](#future-development-guidelines)

---

## Project Overview

### What is Yak Gauntlet?

**Yak Gauntlet** is a web-based interactive sports mini-game collection inspired by "The Yak" podcast/streaming show. It's a multi-station challenge gauntlet where players complete 6 sports-themed mini-games in sequence, racing against time to achieve the best score.

### Key Features

- **6 Physics-Based Mini-Games:** Cornhole, Penalty Kicks, Wiffle Ball, Football Throws, 3-Point Shooting (Left & Right)
- **Real-Time Timer:** Runs over 75 seconds are marked as "wet" (poor performance)
- **Character System:** AI opponents with unique personalities and difficulty modifiers
- **Leaderboard System:** Top 10 scores tracked locally and via Firebase
- **Procedural Generation:** All graphics and audio generated at runtime (no asset files needed)
- **Responsive Design:** Works on desktop and mobile devices
- **Professional Polish:** Particles, animations, haptic feedback, sound effects

### Target Audience

- Fans of "The Yak" show
- Casual gamers looking for quick, arcade-style challenges
- Players who enjoy time-trial competitions

---

## Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Phaser 3** | 3.90.0 | Game engine for 2D physics, rendering, and input |
| **TypeScript** | 5.9.3 | Type-safe language with strict compilation |
| **Vite** | 7.2.4 | Build tool and dev server with hot reload |
| **Firebase** | 12.7.0 | Cloud Firestore for leaderboard persistence |
| **Matter.js** | (bundled) | Physics engine via Phaser |
| **Web Audio API** | (browser) | Procedural sound synthesis |

### Development Environment

```bash
# Install dependencies
npm install

# Start development server (localhost:5173)
npm run dev

# Build for production
npm run build
```

### Browser Requirements

- Modern browsers with ES2022 support
- WebGL support (falls back to Canvas)
- localStorage for score persistence
- Optional: Vibration API for haptic feedback

---

## Architecture Patterns

### 1. Scene-Based Architecture

The game uses **Phaser's Scene System** to organize different game states:

```
BootScene (Menu/Lobby)
    ↓
RunScene (Station 1: Cornhole)
    ↓
GoalieScene (Station 2: Penalty Kicks)
    ↓
WiffleScene (Station 3: Wiffle Ball)
    ↓
FootballScene (Station 4: Football Throws)
    ↓
Corner3RightScene (Station 5: 3-Point Right)
    ↓
Corner3LeftScene (Station 6: 3-Point Left)
    ↓
QuizScene (Station 7: Trivia)
    ↓
ResultScene (Leaderboard & Results)
```

### 2. Singleton Service Pattern

Core game logic is managed by singleton services:

**GameStateService** (`src/services/GameStateService.ts:204`)
- Manages run state (timer, misses, current station)
- Handles station progression
- Calculates "wet" status (>75 seconds)

**LeaderboardService** (`src/services/LeaderboardService.ts:141`)
- Stores and retrieves leaderboard data
- Sorts by time and wet status
- Handles localStorage/memory fallback

### 3. Reusable Controller Pattern

**FlickController** (`src/utils/FlickController.ts:227`)
- Drag-to-throw input mechanic
- Used across 5+ scenes
- Provides visual feedback (aim line, power meter)
- Configurable power scaling and max velocity

### 4. Configuration-Driven Design

Centralized configuration files:
- `theme.ts` - Colors, fonts, physics constants
- `gameConfig.ts` - Phaser game setup, scene registration
- `firebaseConfig.ts` - Backend credentials

### 5. Error Resilience

**ErrorHandler** (`src/utils/ErrorHandler.ts`)
- Wraps all critical operations
- Provides fallback values
- Detects localStorage availability
- Implements MemoryStorage fallback

---

## Directory Structure

```
/home/user/YakGauntlet/
├── src/
│   ├── config/                 # Configuration files
│   │   ├── gameConfig.ts      # Phaser game config (9 scenes)
│   │   ├── firebaseConfig.ts  # Firebase initialization
│   │   ├── physicsConfig.ts   # Physics constants
│   │   └── theme.ts           # Colors, fonts, UI styles (255 lines)
│   │
│   ├── scenes/                 # Game scenes (9 files)
│   │   ├── BootScene.ts       # Menu/lobby with physics toys
│   │   ├── RunScene.ts        # Station 1: Cornhole
│   │   ├── GoalieScene.ts     # Station 2: Penalty kicks
│   │   ├── WiffleScene.ts     # Station 3: Wiffle ball
│   │   ├── FootballScene.ts   # Station 4: Football throws
│   │   ├── Corner3RightScene.ts # Station 5: 3-point (right)
│   │   ├── Corner3LeftScene.ts  # Station 6: 3-point (left)
│   │   ├── QuizScene.ts       # Bonus: Quiz game
│   │   └── ResultScene.ts     # End-of-run results
│   │
│   ├── services/               # Business logic
│   │   ├── GameStateService.ts # Run state management (205 lines)
│   │   └── LeaderboardService.ts # Score storage (142 lines)
│   │
│   ├── data/                   # Static content
│   │   ├── characterQuotes.ts # NPC dialogue
│   │   └── quizQuestions.ts   # Quiz content
│   │
│   ├── types/                  # TypeScript interfaces
│   │   └── index.ts           # RunState, Station, LeaderboardEntry (138 lines)
│   │
│   ├── utils/                  # 15+ utility modules
│   │   ├── AudioSystem.ts     # Procedural Web Audio
│   │   ├── EnhancedVisuals.ts # Particle effects
│   │   ├── UIHelper.ts        # Common UI creation
│   │   ├── VisualEffects.ts   # Explosions, confetti
│   │   ├── ErrorHandler.ts    # Error recovery
│   │   ├── FlickController.ts # Drag-to-throw input (227 lines)
│   │   ├── CharacterSprites.ts # NPC sprite generation
│   │   ├── SceneEnhancer.ts   # Visual polish
│   │   ├── StudioAtmosphere.ts # Backgrounds
│   │   ├── HapticFeedback.ts  # Mobile vibration
│   │   ├── PerformanceTracker.ts # FPS monitoring
│   │   └── [others]
│   │
│   └── main.ts                 # Entry point
│
├── dist/                       # Build output (generated)
├── index.html                  # HTML entry point
├── package.json               # Dependencies
├── tsconfig.json              # TypeScript config (strict mode)
├── vite.config.ts             # Build config
├── .env                       # Environment variables (git-ignored)
├── .env.example               # Environment template
└── [*.md files]               # Documentation
```

---

## Core Systems

### 1. Game State Management

**File:** `src/services/GameStateService.ts:204`

The `GameStateService` is a singleton that maintains the current run state:

```typescript
interface RunState {
  runId: string;                    // Unique UUID for this run
  startTimeMs: number;              // When timer started (0 = not started)
  endTimeMs: number | null;         // When run completed
  currentStationId: StationId;      // Which station player is on
  missCountByStation: Record<...>;  // Misses per station
  wet: boolean;                     // True if time > 75 seconds
  goalieCharacterId: CharacterId;   // Which NPC is goalie
}
```

**Key Methods:**
- `initNewRun()` - Creates new run with random goalie
- `startTimer()` - Starts timer on first station
- `stopTimer()` - Stops timer and calculates wet status
- `recordMiss(stationId)` - Increments miss count
- `advanceToNextStation()` - Moves to next station
- `getCurrentTimeMs()` - Returns elapsed time
- `resetGame()` - Resets for new run

**Station Order:**
```typescript
const STATION_ORDER = [
  'cornhole',
  'goalie',
  'wiffle',
  'football',
  'corner3_right',
  'corner3_left'
];
```

### 2. Leaderboard System

**File:** `src/services/LeaderboardService.ts:141`

Manages top 10 scores with sorting and persistence:

```typescript
interface LeaderboardEntry {
  username: string;      // 3-letter initials
  time_ms: number;       // Final time in milliseconds
  wet: boolean;          // Whether run was "wet"
  timestamp: number;     // When entry was created
  device: string;        // 'mobile' or 'desktop'
  goalie: CharacterId;   // Which goalie they faced
  version: string;       // Game version
}
```

**Sorting Logic:**
1. Non-wet runs before wet runs
2. Within each category, faster times first
3. Top 10 entries kept

**Storage Strategy:**
- Primary: localStorage
- Fallback: MemoryStorage (in-memory Map)
- Validates JSON on load
- Auto-saves on each entry

### 3. Input System (Flick Controller)

**File:** `src/utils/FlickController.ts:227`

Reusable drag-to-throw mechanic used across 5+ scenes:

```typescript
interface FlickControllerConfig {
  powerScale: number;        // Distance → velocity conversion
  maxPower: number;          // Max velocity cap
  minDragDistance: number;   // Minimum drag to register
  aimLineColor: number;      // Visual feedback color
  colorByPower: boolean;     // Green/Yellow/Red gradient
  onFlick: (velocity, angle, power) => void;
}
```

**How It Works:**
1. User presses pointer down → records start position
2. User drags → displays aim line showing direction and power
3. User releases → calculates velocity vector, applies to physics body
4. Visual feedback shows trajectory with color-coded power

**Color Coding:**
- Green: < 33% power
- Yellow: 33-66% power
- Red: > 66% power

### 4. Audio System

**File:** `src/utils/AudioSystem.ts`

Procedural sound generation using Web Audio API:

```typescript
AudioSystem.playSound('swoosh');   // Ball throw
AudioSystem.playSound('hit');      // Success sound
AudioSystem.playSound('goal');     // Goal celebration
AudioSystem.playSound('miss');     // Miss sound
```

**Sound Types:**
- Swoosh: Oscillator sweep (100Hz → 50Hz)
- Hit: Short percussive click
- Goal: Ascending tone celebration
- Miss: Descending tone

**Benefits:**
- Zero external audio files
- Instant playback (no loading)
- ~50 lines of code

### 5. Visual Effects System

**File:** `src/utils/VisualEffects.ts`

Particle effects and animations:

```typescript
VisualEffects.explosion(scene, x, y, color);
VisualEffects.confetti(scene, x, y);
VisualEffects.ripple(scene, x, y);
VisualEffects.fireworks(scene, x, y);
```

**Effects:**
- Explosions: Radial particle burst
- Confetti: Colorful falling particles
- Ripples: Expanding circle waves
- Fireworks: Multi-burst celebration
- Trails: Motion trails for objects

---

## Game Flow

### Complete Game Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER OPENS APP                                           │
│    - index.html loads                                       │
│    - main.ts initializes Phaser                             │
│    - gameConfig.ts registers scenes                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. BOOTSCENE (MENU/LOBBY)                                   │
│    - Initialize Firebase                                    │
│    - Initialize AudioSystem                                 │
│    - Display "EASY" button                                  │
│    - Show physics toys (balls, character heads)             │
│    - Display station preview ticker                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (User clicks "EASY" button)
┌─────────────────────────────────────────────────────────────┐
│ 3. GAME INITIALIZATION                                      │
│    - GameStateService.initNewRun()                          │
│    - Generate unique runId (UUID)                           │
│    - Randomly select goalie character                       │
│    - Reset miss counts to 0                                 │
│    - Scene.start('RunScene')                                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. STATION 1: CORNHOLE (RunScene)                           │
│    - GameStateService.startTimer() on first input           │
│    - Display UI: timer, station badge, progress (1/6)       │
│    - Player drags beanbag                                   │
│    - FlickController shows aim line                         │
│    - Physics simulates throw                                │
│    - Check success: did bag land on board/in hole?          │
│    - If miss: recordMiss('cornhole'), max 3 attempts        │
│    - On success: visual/audio feedback, advance             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (advanceToNextStation())
┌─────────────────────────────────────────────────────────────┐
│ 5. STATION 2: PENALTY KICKS (GoalieScene)                   │
│    - Spawn AI goalie (character from runState)              │
│    - Apply character modifiers (speed, width, reaction)     │
│    - Player drags soccer ball                               │
│    - Goalie tracks ball, tries to block                     │
│    - Success: ball enters goal                              │
│    - Miss: goalie blocks or ball misses                     │
│    - Character taunts appear based on frequency             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. STATION 3: WIFFLE BALL (WiffleScene)                     │
│    - Ball pitched automatically                             │
│    - Player swings bat (pointer down)                       │
│    - Check collision timing                                 │
│    - Success: ball flies to target zone                     │
│    - Physics: low gravity, high air resistance              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. STATION 4: FOOTBALL THROWS (FootballScene)               │
│    - Target hoop appears                                    │
│    - Player drags football                                  │
│    - Football spins/spirals                                 │
│    - Success: football passes through hoop                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. STATION 5: 3-POINT RIGHT (Corner3RightScene)             │
│    - Basketball hoop on right side                          │
│    - Player drags basketball                                │
│    - Arc trajectory required                                │
│    - Success: ball enters hoop                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. STATION 6: 3-POINT LEFT (Corner3LeftScene)               │
│    - Basketball hoop on left side                           │
│    - Same mechanics as right side                           │
│    - Final station                                          │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 10. RUN COMPLETE                                            │
│     - GameStateService.stopTimer()                          │
│     - Calculate final time                                  │
│     - Check if wet (time > 75000ms)                         │
│     - Scene.start('ResultScene')                            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 11. RESULT SCENE                                            │
│     - Display final time                                    │
│     - Show "WET" badge if applicable                        │
│     - User enters 3-letter initials                         │
│     - Create LeaderboardEntry                               │
│     - LeaderboardService.addEntry()                         │
│     - Display rank (1-10 or "didn't make top 10")          │
│     - Show full leaderboard                                 │
│     - Celebration/commiseration based on rank               │
│     - "PLAY AGAIN" button                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼ (User clicks "PLAY AGAIN")
          Back to BootScene
```

### Per-Station Flow

Each mini-game station follows this pattern:

```typescript
class StationScene extends Phaser.Scene {
  create() {
    // 1. Initialize UI (timer, badge, progress)
    this.createUI();

    // 2. Setup physics bodies
    this.createPhysicsObjects();

    // 3. Initialize FlickController
    this.flickController = new FlickController(this, config);

    // 4. Display instructions
    this.showInstructions();
  }

  update() {
    // 5. Update timer display
    this.updateTimer();

    // 6. Check success condition
    if (this.checkSuccess()) {
      this.onSuccess();
    }

    // 7. Check miss condition
    if (this.checkMiss() && this.missCount >= 3) {
      this.onMaxMisses();
    }
  }

  onSuccess() {
    // 8. Visual/audio feedback
    VisualEffects.confetti(this, x, y);
    AudioSystem.playSound('goal');

    // 9. Advance to next station
    const nextStation = GameStateService.advanceToNextStation();
    if (nextStation) {
      this.scene.start(this.getSceneKey(nextStation));
    } else {
      this.scene.start('ResultScene');
    }
  }
}
```

---

## Frontend/UI Implementation

### Design System

**File:** `src/config/theme.ts:255`

The theme system provides consistent styling across all scenes:

#### Color Palette

```typescript
YAK_COLORS = {
  // Brand Colors
  primary: 0xff5722,        // Yak Orange-Red
  secondary: 0xffc107,      // Bright Gold
  navy: 0x1e3a5f,           // Yak Navy

  // Game States
  success: 0x4caf50,        // Green (success)
  danger: 0xf44336,         // Red (miss)
  warning: 0xffca28,        // Yellow (caution)

  // Vibrant Accents
  vibrantRed: 0xe53935,
  vibrantOrange: 0xff6f00,
  vibrantYellow: 0xfdd835,
  vibrantGreen: 0x43a047,
  vibrantBlue: 0x1e88e5,
  vibrantPurple: 0x8e24aa,
}
```

#### Typography

```typescript
YAK_FONTS = {
  title: 'Arial Black',     // Bold headings
  body: 'Arial',            // Body text
  mono: 'Courier New'       // Data/numbers
}

TEXT_STYLES = {
  timer: {
    fontSize: '48px',
    fontFamily: 'Arial Black',
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4
  },
  instruction: {
    fontSize: '22px',
    color: '#ffc107',
    strokeThickness: 4
  },
  feedback: {
    fontSize: '64px',
    strokeThickness: 8
  }
}
```

#### Physics Constants

```typescript
PHYSICS = {
  GRAVITY_NORMAL: 0.45,
  GRAVITY_HEAVY: 0.55,      // Basketball
  GRAVITY_LIGHT: 0.35,      // Wiffle ball

  AIR_RESISTANCE: 0.997,
  AIR_RESISTANCE_HIGH: 0.99, // Wiffle ball

  BOUNCE_LOW: 0.25,         // Beanbag
  BOUNCE_MEDIUM: 0.5,       // Soccer ball
  BOUNCE_HIGH: 0.7,         // Basketball

  MAX_VELOCITY: 50,
}
```

### UI Components

**File:** `src/utils/UIHelper.ts`

Standard UI created for each station:

```typescript
createSceneUI(scene, stationId) {
  // Top-left: Station badge
  const badge = createStationBadge(stationName, stationColor);

  // Top-right: Progress dots (1/6, 2/6, etc.)
  const progress = createProgressDots(currentIndex, totalStations);

  // Top-center: Timer with gradient background
  const timer = createTimer();

  // Bottom-right: Miss counter
  const missCounter = createMissCounter();
}
```

**Visual Elements:**
- Station badges with emoji and color
- Animated progress dots
- Gradient timer background
- Floating feedback text ("NICE!", "MISS!")
- Character quote bubbles
- Particle effects (confetti, explosions)

### Responsive Design

**File:** `src/config/gameConfig.ts`

```typescript
scale: {
  mode: Phaser.Scale.RESIZE,
  width: window.innerWidth,
  height: window.innerHeight,
  autoCenter: Phaser.Scale.CENTER_BOTH
}
```

**Mobile Optimizations:**
- Touch input (2 pointer support)
- Haptic feedback via Vibration API
- No scrollbars (`overflow: hidden`)
- Dynamic GAME_WIDTH/GAME_HEIGHT

---

## Backend/API Integration

### Firebase Setup

**File:** `src/config/firebaseConfig.ts:33`

Firebase provides cloud persistence for leaderboards:

```typescript
// Environment variables required in .env
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

**Initialization:**
```typescript
// BootScene.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
```

### Firestore Schema

**Collection:** `leaderboard`

**Document Structure:**
```json
{
  "username": "ABC",
  "time_ms": 63450,
  "wet": false,
  "timestamp": 1737676800000,
  "device": "desktop",
  "goalie": "BIG_CAT",
  "version": "6"
}
```

### Local Storage Fallback

**File:** `src/services/LeaderboardService.ts:141`

The game works without Firebase using localStorage:

```typescript
// Primary storage
localStorage.setItem('yak_gauntlet_leaderboard', JSON.stringify(entries));

// Fallback if localStorage unavailable (private browsing)
MemoryStorage.setItem(key, value);  // In-memory Map
```

**Storage Priority:**
1. Try localStorage
2. If unavailable, use MemoryStorage
3. Data persists across page reloads (localStorage only)

### API Integration Points

Currently, the game does NOT make external API calls. Future enhancements could add:

- ☐ Global leaderboard sync via Firestore
- ☐ User authentication
- ☐ Social sharing
- ☐ Analytics tracking
- ☐ Daily challenges

---

## Data Models & Types

**File:** `src/types/index.ts:138`

### Core Interfaces

#### RunState
```typescript
interface RunState {
  runId: string;                          // UUID
  startTimeMs: number;                    // Epoch ms
  endTimeMs: number | null;               // Epoch ms or null
  currentStationId: StationId;            // Current station
  missCountByStation: Record<StationId, number>;
  wet: boolean;                           // Time > 75s
  goalieCharacterId: CharacterId;         // NPC opponent
}
```

#### LeaderboardEntry
```typescript
interface LeaderboardEntry {
  username: string;                       // 3-letter initials
  time_ms: number;                        // Milliseconds
  wet: boolean;                           // Over 75 seconds
  timestamp: number;                      // When entry created
  device: 'mobile' | 'desktop';
  goalie: CharacterId;                    // Which goalie faced
  version: string;                        // Game version
}
```

#### CharacterModifiers
```typescript
interface CharacterModifiers {
  goalieSpeedMultiplier: number;          // 0.9 - 1.2
  goalieWidthMultiplier: number;          // 0.85 - 1.1
  goalieReactionDelayMs: number;          // 30 - 100ms
  tauntFrequency: number;                 // 0.2 - 0.6
}
```

### Type Definitions

```typescript
type StationId =
  | 'cornhole'
  | 'goalie'
  | 'wiffle'
  | 'football'
  | 'corner3_right'
  | 'corner3_left';

type CharacterId =
  | 'BIG_CAT'
  | 'BRANDON_WALKER'
  | 'KB'
  | 'NICK_TURANI'
  | 'KATE'
  | 'ZAH'
  | 'STEVEN_CHEAH'
  | 'DANNY_CONRAD'
  | 'MARK_TITUS'
  | 'TJ';
```

### Character Balance Data

**File:** `src/types/index.ts:76-137`

Each character has unique difficulty modifiers:

| Character | Speed | Width | Reaction | Taunt % |
|-----------|-------|-------|----------|---------|
| Big Cat | 1.1x | 1.0x | 50ms | 30% |
| Brandon Walker | 0.9x | 1.1x | 80ms | 50% |
| KB | 1.2x | 0.9x | 30ms | 40% |
| Kate | 1.15x | 0.85x | 40ms | 30% |
| Steven Cheah | 1.0x | 1.0x | 100ms | 20% |

**Hardest:** KB (fast, thin, quick reaction)
**Easiest:** Steven Cheah (slow reaction, average stats)

---

## Scene Breakdown

### 1. BootScene (Menu/Lobby)

**File:** `src/scenes/BootScene.ts`

**Purpose:** Main menu where players start their run

**Features:**
- "EASY" button to start game
- Physics playground (balls, character heads bouncing)
- Spinning "Wet Wheel" background
- Data ticker with scrolling stats
- Studio atmosphere (spotlight, scanlines, vignette)
- Station preview carousel

**User Actions:**
- Click "EASY" → Starts new run
- Interact with physics objects (optional)

**Transitions To:** RunScene

---

### 2. RunScene (Station 1: Cornhole)

**File:** `src/scenes/RunScene.ts`

**Objective:** Land beanbag on cornhole board

**Mechanics:**
- Drag beanbag backward
- Aim line shows trajectory
- Release to throw
- Success: Bag lands on board or in hole
- Max 3 misses before auto-advance

**Physics:**
- Low bounce (0.25)
- High friction
- Medium gravity

**Transitions To:** GoalieScene

---

### 3. GoalieScene (Station 2: Penalty Kicks)

**File:** `src/scenes/GoalieScene.ts`

**Objective:** Score past AI goalie

**Mechanics:**
- Drag soccer ball to aim
- AI goalie tracks ball position
- Character-specific difficulty modifiers
- Taunts appear based on character
- Success: Ball enters goal

**AI Behavior:**
```typescript
// Goalie tracks ball with delay
update() {
  if (ball.velocity > threshold) {
    setTimeout(() => {
      goalie.moveToward(ball.x);
    }, character.reactionDelayMs);
  }
}
```

**Transitions To:** WiffleScene

---

### 4. WiffleScene (Station 3: Wiffle Ball)

**File:** `src/scenes/WiffleScene.ts`

**Objective:** Hit pitched wiffle ball to target zone

**Mechanics:**
- Ball automatically pitched
- Player times swing (pointer down)
- Check collision between bat and ball
- Success: Ball reaches target zone
- Physics: High air resistance, low gravity

**Transitions To:** FootballScene

---

### 5. FootballScene (Station 4: Football Throws)

**File:** `src/scenes/FootballScene.ts`

**Objective:** Throw football through target hoop

**Mechanics:**
- Drag football to aim
- Football spins/rotates realistically
- Target hoop at distance
- Success: Football passes through hoop
- Max 3 misses

**Transitions To:** Corner3RightScene

---

### 6. Corner3RightScene (Station 5: 3-Point Right)

**File:** `src/scenes/Corner3RightScene.ts`

**Objective:** Make 3-point shot from right corner

**Mechanics:**
- Drag basketball to aim
- Hoop positioned top-left
- Requires arc trajectory
- Success: Ball enters hoop (sensor detection)
- Max 3 misses

**Physics:**
- High bounce (0.7)
- Heavy gravity (0.55)

**Transitions To:** Corner3LeftScene

---

### 7. Corner3LeftScene (Station 6: 3-Point Left)

**File:** `src/scenes/Corner3LeftScene.ts`

**Objective:** Make 3-point shot from left corner

**Mechanics:**
- Same as Corner3RightScene, mirrored
- Hoop positioned top-right
- Final station

**Transitions To:** ResultScene

---

### 8. ResultScene (End Screen)

**File:** `src/scenes/ResultScene.ts`

**Purpose:** Display results and leaderboard

**Features:**
- Show final time (formatted as MM:SS.mmm)
- "WET" badge if time > 75 seconds
- Input for 3-letter initials
- Display player rank
- Show top 10 leaderboard
- Celebration/commiseration animations
- "PLAY AGAIN" button

**Data Flow:**
```typescript
create() {
  const runState = GameStateService.getState();
  const finalTime = runState.endTimeMs - runState.startTimeMs;

  // User enters initials
  const entry = {
    username: initials,
    time_ms: finalTime,
    wet: runState.wet,
    timestamp: Date.now(),
    device: isMobile() ? 'mobile' : 'desktop',
    goalie: runState.goalieCharacterId,
    version: '6'
  };

  const rank = LeaderboardService.addEntry(entry);

  // Display rank and leaderboard
  this.showRank(rank);
  this.showLeaderboard();
}
```

**Transitions To:** BootScene (on "PLAY AGAIN")

---

### 9. QuizScene (Bonus)

**File:** `src/scenes/QuizScene.ts`

**Purpose:** Sporcle-style trivia game (optional)

**Features:**
- Multiple choice questions
- Timer per question
- Score tracking
- Yak-themed questions

---

## Utilities & Helpers

### Audio System

**File:** `src/utils/AudioSystem.ts`

Procedural sound generation:

```typescript
AudioSystem.init();
AudioSystem.playSound('swoosh', frequency, duration);
AudioSystem.playSound('hit');
AudioSystem.playSound('goal');
AudioSystem.playSound('miss');
```

**Implementation:**
- Web Audio API
- Oscillator synthesis
- No external audio files needed
- Instant playback

---

### Visual Effects

**File:** `src/utils/VisualEffects.ts`

Particle effects library:

```typescript
VisualEffects.explosion(scene, x, y, color);
VisualEffects.confetti(scene, x, y);
VisualEffects.ripple(scene, x, y);
VisualEffects.fireworks(scene, x, y);
VisualEffects.trail(scene, gameObject);
```

---

### Error Handler

**File:** `src/utils/ErrorHandler.ts`

Robust error handling with fallbacks:

```typescript
ErrorHandler.withErrorHandlingSync(
  'ServiceName',
  'methodName',
  () => { /* operation */ },
  fallbackValue,
  { context: 'data' }
);

// localStorage helpers
ErrorHandler.isLocalStorageAvailable();
ErrorHandler.setLocalStorage(key, value);
ErrorHandler.getLocalStorage(key);
```

**MemoryStorage Fallback:**
```typescript
// When localStorage unavailable
MemoryStorage.setItem(key, value);
MemoryStorage.getItem(key);
MemoryStorage.removeItem(key);
```

---

### Character System

**File:** `src/utils/CharacterSprites.ts`

Procedural NPC sprite generation:

```typescript
CharacterSprites.generateCrewHead(characterId);
// Returns pixel art sprite with unique colors/features
```

**File:** `src/data/characterQuotes.ts`

NPC dialogue system:

```typescript
getCharacterQuote(characterId, context);
// Returns context-appropriate taunt/quote
```

---

### UI Helper

**File:** `src/utils/UIHelper.ts`

Common UI creation:

```typescript
UIHelper.createSceneUI(scene, stationId);
UIHelper.createTimer(scene);
UIHelper.createProgressDots(scene, current, total);
UIHelper.createStationBadge(scene, stationName, color);
UIHelper.createMissCounter(scene);
```

---

### Performance Tracker

**File:** `src/utils/PerformanceTracker.ts`

FPS monitoring and optimization:

```typescript
PerformanceTracker.init(scene);
PerformanceTracker.getFPS();
PerformanceTracker.logPerformance();
```

---

### Procedural Texture Factory (NEW)

**File:** `src/utils/ProceduralTextureFactory.ts`

High-fidelity runtime texture generation without external assets:

```typescript
const factory = new ProceduralTextureFactory(scene);

// Create realistic hardwood basketball court
const courtKey = factory.createHardwoodCourt(width, height);
const court = scene.add.image(0, 0, courtKey);

// Create fabric beanbag with stitching
const bagKey = factory.createBeanbag(radius, color);
const bag = scene.add.image(x, y, bagKey);

// Create wooden cornhole board with deep hole
const boardKey = factory.createCornholeBoard(width, height);
const board = scene.add.image(x, y, boardKey);

// Cleanup when done
factory.destroy();
```

**Features:**
- **Wood Grain**: Perlin-like noise generation for realistic grain patterns
- **Glossy Highlights**: Simulates polished hardwood finish
- **Fabric Texture**: Cross-hatch patterns for cloth materials
- **Stitching Details**: Dashed lines and radial patterns
- **Knots & Scuffs**: Random imperfections for realism
- **Gradients**: Radial and linear for 3D depth
- **Vignettes**: Edge darkening for studio atmosphere

---

### Dynamic Lighting Manager (NEW)

**File:** `src/utils/ProceduralTextureFactory.ts`

Phaser Light2D implementation for depth and realism:

```typescript
const lighting = new DynamicLightingManager(scene);

// Enable studio lighting setup
lighting.enable();

// Add objects to lighting pipeline
lighting.addToPipeline(gameObject);

// Automatic pointer-following spotlight with smooth interpolation
// Cleanup
lighting.destroy();
```

**Lighting Setup:**
- **Main Light**: Overhead studio light (400px radius, white, 1.5 intensity)
- **Ambient Light**: Fill light (800px radius, warm 0xffd4a3, 0.6 intensity)
- **Pointer Light**: Follows mouse/touch (200-250px radius, increases on click)
- **Ambient Color**: Dim base lighting (0x404040)

**Performance Notes:**
- Lights update every frame for smooth tracking
- Intensity varies based on pointer state (1.2 idle, 1.8 active)
- Uses smooth interpolation (15% smoothing factor) for natural movement

---

## Build & Deployment

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# Server runs at http://localhost:5173
# Hot reload enabled
```

### Production Build

```bash
# Build for production
npm run build
# Output: dist/

# Build configuration (vite.config.ts)
{
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    outDir: 'dist'
  }
}
```

### Environment Setup

1. Copy `.env.example` to `.env`
2. Fill in Firebase credentials:
```
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_here
...
```

### Deployment Options

**Static Hosting:**
- Netlify
- Vercel
- GitHub Pages
- Firebase Hosting
- Any static file server

**Deploy Steps:**
1. Run `npm run build`
2. Upload `dist/` folder to hosting
3. Configure environment variables
4. Ensure Firebase Firestore rules are set

**Firestore Rules (example):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{entry} {
      allow read: if true;
      allow write: if request.resource.data.keys().hasAll(['username', 'time_ms', 'wet', 'timestamp']);
    }
  }
}
```

---

## Performance & Optimization

### Current Optimizations

1. **Reduced Physics Objects** (BootScene)
   - Balls: 45 → 25
   - Character heads: 7 → 5
   - Improves mobile performance

2. **Procedural Generation**
   - No external assets to load
   - Zero network requests for media
   - Faster initial load

3. **Efficient Build**
   - esbuild minification (fast)
   - Tree-shaking unused code
   - ES2022 target (modern browsers)

4. **Proper Cleanup**
   - Scene shutdown methods
   - Destroy tweens, timers, physics bodies
   - Prevent memory leaks

5. **Lazy Initialization**
   - Firebase loaded in BootScene
   - Audio context on first interaction
   - Scenes loaded on demand

### Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| FPS | 60 | ~60 (desktop), ~50-60 (mobile) |
| Initial Load | < 2s | ~1.5s |
| Bundle Size | < 500KB | ~405KB gzipped |
| Physics Objects | < 50 | 30 (BootScene) |

### Performance Tips

```typescript
// Good: Reuse objects
const graphics = scene.add.graphics();
graphics.clear();
graphics.lineStyle(...);

// Bad: Create new objects every frame
update() {
  const graphics = scene.add.graphics(); // Memory leak!
}

// Good: Destroy on scene shutdown
shutdown() {
  this.tweens.forEach(t => t.remove());
  this.timers.forEach(t => t.remove());
  this.bodies.forEach(b => scene.matter.world.remove(b));
}
```

---

## Future Development Guidelines

### Adding a New Station

1. **Create Scene File** (`src/scenes/NewStationScene.ts`)
```typescript
export class NewStationScene extends Phaser.Scene {
  constructor() {
    super({ key: 'NewStationScene' });
  }

  create() {
    // Use UIHelper for standard UI
    UIHelper.createSceneUI(this, 'newstation');

    // Setup FlickController for input
    this.flickController = new FlickController(this, config);

    // Create physics objects
    // Implement success/miss logic
  }
}
```

2. **Register in gameConfig.ts**
```typescript
scene: [
  BootScene,
  RunScene,
  // ... other scenes
  NewStationScene,
  ResultScene
]
```

3. **Add to theme.ts**
```typescript
export const STATIONS = [
  // ... existing stations
  { id: 'newstation', name: 'NEW GAME', color: 0x..., emoji: '🎮' }
];
```

4. **Update types**
```typescript
type StationId =
  | 'cornhole'
  | ...
  | 'newstation';
```

5. **Update GameStateService**
```typescript
const STATION_ORDER: StationId[] = [
  'cornhole',
  // ...
  'newstation'
];
```

### Adding a New Character

1. **Update types/index.ts**
```typescript
type CharacterId =
  | 'BIG_CAT'
  | ...
  | 'NEW_CHARACTER';

export const CHARACTER_MODIFIERS: Record<CharacterId, CharacterModifiers> = {
  // ...
  NEW_CHARACTER: {
    goalieSpeedMultiplier: 1.0,
    goalieWidthMultiplier: 1.0,
    goalieReactionDelayMs: 60,
    tauntFrequency: 0.4
  }
};
```

2. **Add quotes** (`src/data/characterQuotes.ts`)
```typescript
NEW_CHARACTER: {
  taunt: ["Quote 1", "Quote 2"],
  success: ["You got lucky!"],
  failure: ["Knew it!"]
}
```

3. **Add sprite** (`src/utils/CharacterSprites.ts`)
```typescript
case 'NEW_CHARACTER':
  return generateCrewHead(scene, baseColor, features);
```

### Extending Leaderboard

**Global Sync with Firebase:**

```typescript
// Add to LeaderboardService
async syncWithFirebase() {
  const db = getFirestore();
  const leaderboardRef = collection(db, 'leaderboard');

  // Fetch top 10
  const q = query(leaderboardRef, orderBy('time_ms'), limit(10));
  const snapshot = await getDocs(q);

  // Merge with local
  // ...
}
```

**Add User Authentication:**

```typescript
// Add to BootScene
import { getAuth, signInAnonymously } from 'firebase/auth';

async initAuth() {
  const auth = getAuth();
  const user = await signInAnonymously(auth);
  // Store user.uid in GameStateService
}
```

### Code Style Guidelines

1. **Use TypeScript strict mode** (already enabled)
2. **Prefer composition over inheritance**
3. **Keep scenes < 500 lines** (extract to utils if needed)
4. **Use constants from theme.ts**
5. **Always provide fallback values in ErrorHandler**
6. **Clean up resources in shutdown()**
7. **Document complex physics calculations**

### Testing Checklist

- [ ] Test on mobile (touch input)
- [ ] Test on desktop (mouse input)
- [ ] Test with localStorage disabled (private browsing)
- [ ] Test with slow network (Firebase timeout)
- [ ] Test all 6 stations individually
- [ ] Test timer accuracy
- [ ] Test leaderboard sorting
- [ ] Test "wet" calculation (>75s)
- [ ] Verify all character modifiers work
- [ ] Check FPS on lower-end devices

---

## Architecture Diagrams

### Component Dependency Graph

```
main.ts
  └─> gameConfig.ts
       ├─> BootScene
       │    ├─> firebaseConfig
       │    ├─> AudioSystem
       │    └─> theme
       │
       ├─> RunScene
       │    ├─> GameStateService
       │    ├─> FlickController
       │    ├─> UIHelper
       │    └─> VisualEffects
       │
       ├─> [Other Station Scenes]
       │    └─> (same dependencies as RunScene)
       │
       └─> ResultScene
            ├─> GameStateService
            ├─> LeaderboardService
            └─> UIHelper

Services Layer (Singletons):
  ├─> GameStateService (manages run state)
  ├─> LeaderboardService (manages scores)
  └─> AudioSystem (manages sound)

Utilities Layer:
  ├─> FlickController (reusable input)
  ├─> UIHelper (reusable UI)
  ├─> VisualEffects (reusable effects)
  ├─> ErrorHandler (error resilience)
  └─> [12+ other utilities]

Data Layer:
  ├─> localStorage (primary persistence)
  ├─> MemoryStorage (fallback)
  └─> Firebase Firestore (optional cloud sync)
```

### State Flow Diagram

```
┌─────────────────┐
│   BootScene     │
│   (no state)    │
└────────┬────────┘
         │ initNewRun()
         ▼
┌─────────────────┐
│ GameStateService│
│   RunState:     │
│   - runId       │
│   - timer       │
│   - station     │
│   - misses      │
│   - goalie      │
└────────┬────────┘
         │ shared across all scenes
         ▼
┌─────────────────┐     ┌─────────────────┐
│  Station Scenes │────▶│  Visual/Audio   │
│  (read state)   │     │  Feedback       │
│  (recordMiss)   │     └─────────────────┘
│  (advanceNext)  │
└────────┬────────┘
         │ stopTimer()
         ▼
┌─────────────────┐
│  ResultScene    │
│  (read final)   │
└────────┬────────┘
         │ addEntry()
         ▼
┌─────────────────┐     ┌─────────────────┐
│LeaderboardSvc   │────▶│  localStorage   │
│  (persist)      │     │  (+ Firebase)   │
└─────────────────┘     └─────────────────┘
```

---

## Conclusion

The Yak Gauntlet is a well-architected, scalable web game built with modern tools and best practices. Key strengths:

✅ **Modular Architecture** - Clean separation of concerns
✅ **Reusable Components** - FlickController, UIHelper, etc.
✅ **Type Safety** - Strict TypeScript throughout
✅ **Error Resilience** - Graceful fallbacks everywhere
✅ **Zero Assets** - Procedural generation for graphics/audio
✅ **Responsive** - Works on mobile and desktop
✅ **Performant** - Optimized physics, efficient rendering
✅ **Extensible** - Easy to add stations, characters, features

This documentation should serve as the single source of truth for understanding the application architecture, data flow, and implementation details.

---

**Last Updated:** 2026-01-24
**Maintained By:** Development Team
**Contact:** See project repository for issues/PRs
