# YAK GAUNTLET - Strategic Improvement Roadmap

**Status:** Post-v6.1 Major Overhaul
**Date:** 2026-01-24
**Purpose:** Prioritized enhancement plan to elevate from solid foundation to AAA quality

---

## Executive Summary

The Yak Gauntlet has a **strong technical foundation** with recent fixes to critical bugs, enhanced physics, and high-fidelity graphics. However, there are significant opportunities to improve:

- **Mobile Experience** (Current: 5/10 → Target: 9/10)
- **Feature Depth** (Current: 4/10 → Target: 8/10)
- **Yak Brand Authenticity** (Current: 5/10 → Target: 9/10)
- **Accessibility** (Current: 2/10 → Target: 7/10)
- **Performance** (Current: 7/10 → Target: 9/10)

**Estimated Total Effort:** 80-100 hours of development work organized into 4 sprint cycles

---

## Priority Matrix

### 🔴 Critical (Do First - Week 1)
High impact, fixes blocking issues or missing fundamentals

### 🟠 High Priority (Week 2-3)
High impact, adds core value to user experience

### 🟡 Medium Priority (Week 4-6)
Medium impact, polish and engagement features

### 🟢 Low Priority (Future Backlog)
Low impact or nice-to-have features

---

## Sprint 1: Critical Fixes & Stability (Week 1)

**Goal:** Fix memory leaks, optimize performance, ensure mobile compatibility

### 🔴 Critical Issues (10 hours)

#### 1. Memory Leak Fixes (2 hours)
**Problem:** Event handlers not cleaned up in scene transitions
**Files:** All scene files (9 scenes)
**Impact:** Memory accumulation over gaming sessions, crashes on low-end devices

**Implementation:**
```typescript
// Add to EVERY scene that's missing it
shutdown(): void {
  this.events.removeAllListeners('update');
  this.input.removeAllListeners();
  this.tweens.killAll();
  this.time.removeAllEvents();

  // Scene-specific cleanup
  if (this.textureFactory) this.textureFactory.destroy();
  if (this.lightingManager) this.lightingManager.destroy();
}
```

**Affected Files:**
- `src/scenes/BootScene.ts` - Add comprehensive shutdown
- `src/scenes/GoalieScene.ts` - Add input listener cleanup
- `src/scenes/WiffleScene.ts` - Add tween cleanup
- `src/scenes/FootballScene.ts` - Add timer cleanup
- `src/scenes/Corner3RightScene.ts` - Add physics cleanup
- `src/scenes/Corner3LeftScene.ts` - Add physics cleanup

---

#### 2. Texture Caching Optimization (2 hours)
**Problem:** ProceduralTextureFactory regenerates textures every scene load
**File:** `src/utils/ProceduralTextureFactory.ts`
**Impact:** 200-400ms scene load delay on mobile

**Implementation:**
```typescript
export class ProceduralTextureFactory {
  private static globalTextureCache = new Map<string, boolean>();

  createHardwoodCourt(width: number, height: number, key?: string): string {
    const textureKey = key || `hardwood_${width}_${height}`;

    // Check if texture already exists in Phaser texture manager
    if (this.scene.textures.exists(textureKey)) {
      return textureKey;
    }

    // Check global cache
    if (ProceduralTextureFactory.globalTextureCache.has(textureKey)) {
      return textureKey;
    }

    // Generate texture (existing code)
    // ...

    // Mark in cache
    ProceduralTextureFactory.globalTextureCache.set(textureKey, true);
    return textureKey;
  }

  // Apply same pattern to createBeanbag(), createCornholeBoard()
}
```

---

#### 3. Mobile Safe Area Padding (1 hour)
**Problem:** UI elements hidden by notches/rounded corners on modern phones
**Files:** `src/config/gameConfig.ts`, all scene UI creation
**Impact:** Unplayable on iPhone 14+, Pixel 7+

**Implementation:**
```typescript
// In gameConfig.ts
export const SAFE_AREA = {
  top: 40,    // Notch area
  bottom: 20, // Home indicator
  left: 20,
  right: 20
};

// In UIHelper.ts - update createSceneUI
export function createSceneUI(scene: Phaser.Scene, stationIndex: number): SceneUI {
  // Timer at top with safe area padding
  const timerY = SAFE_AREA.top + 30; // Instead of hardcoded 30

  // Station badge at top-left with padding
  const badgeX = SAFE_AREA.left + 50;

  // ... rest of UI
}
```

---

#### 4. Force Portrait Orientation (1 hour)
**Problem:** Game scales poorly in landscape mode
**File:** `src/config/gameConfig.ts`
**Impact:** Awkward mobile experience, text too small

**Implementation:**
```typescript
// In gameConfig.ts
export const config: Phaser.Types.Core.GameConfig = {
  // ... existing config
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    // Add orientation lock
    orientation: Phaser.Scale.Orientation.PORTRAIT,
    fullscreenTarget: 'game-container',
  },
  // ...
};
```

**Additional:** Add CSS to index.html
```html
<style>
  @media (orientation: landscape) and (max-height: 600px) {
    body::before {
      content: 'Please rotate your device';
      position: fixed;
      z-index: 9999;
      /* Styling */
    }
  }
</style>
```

---

#### 5. Keyboard Navigation Basics (4 hours)
**Problem:** No keyboard support - violates WCAG 2.1.1
**Files:** `src/scenes/BootScene.ts`, `src/scenes/ResultScene.ts`
**Impact:** Inaccessible to keyboard-only users

**Implementation:**

**BootScene:**
```typescript
create(): void {
  // ... existing code

  // Add keyboard shortcuts
  this.input.keyboard?.on('keydown-SPACE', () => {
    if (!this.isTransitioning) {
      this.startGame();
    }
  });

  this.input.keyboard?.on('keydown-ENTER', () => {
    if (!this.isTransitioning) {
      this.startGame();
    }
  });

  // Add visual focus indicator to EASY button
  this.addEasyButtonFocusState();
}

private addEasyButtonFocusState(): void {
  const focusRing = this.add.graphics();
  focusRing.lineStyle(4, YAK_COLORS.secondary, 1);
  focusRing.strokeCircle(0, 0, 90);
  focusRing.setVisible(false);
  this.easyButton.add(focusRing);

  // Show focus on Tab key
  this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
    event.preventDefault();
    focusRing.setVisible(true);
  });
}
```

**ResultScene:**
```typescript
// In buildInitialsStep - keyboard input already works
// Add Tab navigation between input boxes
this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
  event.preventDefault();
  this.currentInitialIndex = (this.currentInitialIndex + 1) % 3;
  this.updateBoxHighlights();
  this.updateCursorPosition();
});
```

---

### Sprint 1 Deliverables

✅ All scenes properly clean up resources
✅ Texture caching reduces load times by 50%
✅ Mobile UI respects safe areas
✅ Portrait mode enforced
✅ Basic keyboard navigation works

**Testing Checklist:**
- [ ] Play 10+ consecutive runs - no memory increase
- [ ] Test on iPhone with notch - UI visible
- [ ] Test landscape mode - shows rotation message
- [ ] Tab through menu - focus visible
- [ ] Space/Enter starts game

---

## Sprint 2: Core Features & Engagement (Week 2)

**Goal:** Add difficulty progression, combo system, and achievements

### 🟠 High Priority Features (10 hours)

#### 1. Difficulty Progression System (6 hours)

**Design:**
- 3 difficulty tiers: **Easy**, **Normal**, **Hard**
- Affects: target sizes, timing windows, goalie speed, max misses
- Player chooses difficulty at start (BootScene)
- Separate leaderboards per difficulty

**Implementation:**

**New File: `src/types/difficulty.ts`**
```typescript
export type DifficultyLevel = 'easy' | 'normal' | 'hard';

export interface DifficultyModifiers {
  targetSizeMultiplier: number;     // 1.2 (easy) -> 0.8 (hard)
  timingWindowMultiplier: number;   // 1.3 (easy) -> 0.7 (hard)
  goalieSpeedMultiplier: number;    // 0.8 (easy) -> 1.3 (hard)
  maxMissesAllowed: number;         // 5 (easy) -> 2 (hard)
  timerSpeedMultiplier: number;     // 0.9 (easy) -> 1.1 (hard)
}

export const DIFFICULTY_SETTINGS: Record<DifficultyLevel, DifficultyModifiers> = {
  easy: {
    targetSizeMultiplier: 1.2,
    timingWindowMultiplier: 1.3,
    goalieSpeedMultiplier: 0.8,
    maxMissesAllowed: 5,
    timerSpeedMultiplier: 0.9,
  },
  normal: {
    targetSizeMultiplier: 1.0,
    timingWindowMultiplier: 1.0,
    goalieSpeedMultiplier: 1.0,
    maxMissesAllowed: 3,
    timerSpeedMultiplier: 1.0,
  },
  hard: {
    targetSizeMultiplier: 0.8,
    timingWindowMultiplier: 0.7,
    goalieSpeedMultiplier: 1.3,
    maxMissesAllowed: 2,
    timerSpeedMultiplier: 1.1,
  },
};
```

**Update GameStateService:**
```typescript
// Add to RunState interface
export interface RunState {
  // ... existing fields
  difficulty: DifficultyLevel;
}

// Add to GameStateService
private difficulty: DifficultyLevel = 'normal';

setDifficulty(level: DifficultyLevel): void {
  this.difficulty = level;
}

getDifficulty(): DifficultyLevel {
  return this.difficulty;
}

getDifficultyModifiers(): DifficultyModifiers {
  return DIFFICULTY_SETTINGS[this.difficulty];
}
```

**Update BootScene - Add Difficulty Selection:**
```typescript
private createDifficultySelector(): void {
  const y = GAME_HEIGHT * 0.6;

  const difficulties: DifficultyLevel[] = ['easy', 'normal', 'hard'];
  const colors = [YAK_COLORS.success, YAK_COLORS.secondary, YAK_COLORS.danger];

  difficulties.forEach((diff, index) => {
    const x = GAME_WIDTH / 2 - 150 + index * 150;
    const button = this.createDifficultyButton(x, y, diff, colors[index]);
    button.on('pointerdown', () => {
      GameStateService.setDifficulty(diff);
      this.selectedDifficulty = diff;
      this.updateDifficultyButtons();
    });
  });
}
```

**Apply to Scenes:**

**RunScene (Cornhole):**
```typescript
create(): void {
  // ... existing code
  const modifiers = GameStateService.getDifficultyModifiers();
  this.holeRadius = 38 * modifiers.targetSizeMultiplier;
  this.maxMisses = modifiers.maxMissesAllowed;
}
```

**WiffleScene:**
```typescript
create(): void {
  const modifiers = GameStateService.getDifficultyModifiers();
  this.timingWindowStart = 0.60 / modifiers.timingWindowMultiplier;
  this.timingWindowEnd = 0.88 * modifiers.timingWindowMultiplier;
}
```

**GoalieScene:**
```typescript
private calculateGoalieSpeed(): number {
  const charMods = CHARACTER_MODIFIERS[this.character];
  const diffMods = GameStateService.getDifficultyModifiers();
  return charMods.goalieSpeedMultiplier * diffMods.goalieSpeedMultiplier;
}
```

---

#### 2. Combo/Streak System (4 hours)

**Design:**
- Track consecutive station successes (no misses)
- Combo multiplier: 2x at 3 stations, 3x at 5 stations, 5x at 6 (perfect)
- Visual feedback: Combo counter in UI
- Bonus points applied to time (reduce final time by multiplier)

**Implementation:**

**Update GameStateService:**
```typescript
export interface RunState {
  // ... existing fields
  currentCombo: number;
  maxCombo: number;
}

recordMiss(stationId: StationId): void {
  this.runState.missCountByStation[stationId]++;
  // Break combo on miss
  this.runState.currentCombo = 0;
}

recordStationSuccess(): void {
  // Increment combo only if no misses on this station
  const currentStationMisses = this.runState.missCountByStation[this.runState.currentStationId] || 0;
  if (currentStationMisses === 0) {
    this.runState.currentCombo++;
    this.runState.maxCombo = Math.max(this.runState.maxCombo, this.runState.currentCombo);
  }
}

getComboMultiplier(): number {
  if (this.runState.currentCombo >= 6) return 5.0; // Perfect run
  if (this.runState.currentCombo >= 5) return 3.0;
  if (this.runState.currentCombo >= 3) return 2.0;
  return 1.0;
}
```

**Update UIHelper - Add Combo Display:**
```typescript
export interface SceneUI {
  // ... existing fields
  comboText: Phaser.GameObjects.Text;
  comboContainer: Phaser.GameObjects.Container;
}

export function createSceneUI(scene: Phaser.Scene, stationIndex: number): SceneUI {
  // ... existing UI creation

  // Combo counter (top-right, below progress dots)
  const combo = GameStateService.getState()?.currentCombo || 0;
  const comboText = scene.add.text(
    GAME_WIDTH - 60,
    80,
    combo > 0 ? `${combo}x COMBO` : '',
    {
      fontSize: '20px',
      fontFamily: YAK_FONTS.title,
      color: YAK_COLORS.secondary,
      stroke: '#000000',
      strokeThickness: 4,
    }
  ).setOrigin(1, 0).setDepth(110);

  // Animate combo on update
  if (combo > 0) {
    scene.tweens.add({
      targets: comboText,
      scale: 1.1,
      duration: 300,
      yoyo: true,
      repeat: -1,
    });
  }

  return { /* ... existing fields */, comboText };
}
```

**Update ResultScene - Apply Combo Bonus:**
```typescript
private calculateFinalTime(): number {
  const rawTime = GameStateService.getFinalTimeMs();
  const multiplier = GameStateService.getComboMultiplier();

  // Apply combo bonus (reduce time)
  const bonusTime = multiplier > 1 ? rawTime * (1 - (0.1 * (multiplier - 1))) : rawTime;

  return Math.floor(bonusTime);
}

private displayComboBonus(): void {
  const combo = GameStateService.getState()?.maxCombo || 0;
  const multiplier = GameStateService.getComboMultiplier();

  if (multiplier > 1) {
    const bonusText = this.add.text(
      GAME_WIDTH / 2,
      400,
      `${combo}x COMBO BONUS!\n-${((multiplier - 1) * 10).toFixed(0)}% Time`,
      {
        fontSize: '28px',
        fontFamily: YAK_FONTS.title,
        color: YAK_COLORS.secondary,
        align: 'center',
        stroke: '#000000',
        strokeThickness: 5,
      }
    ).setOrigin(0.5);

    // Celebration animation
    this.tweens.add({
      targets: bonusText,
      scale: { from: 0, to: 1.2 },
      duration: 500,
      ease: 'Back.easeOut',
    });
  }
}
```

---

### Sprint 2 Deliverables

✅ Players can choose difficulty (Easy/Normal/Hard)
✅ Difficulty affects target sizes, timing, goalie speed
✅ Combo system rewards consecutive successes
✅ Combo bonus reduces final time
✅ Visual feedback for combo multiplier

**Testing Checklist:**
- [ ] Easy mode has larger targets, slower goalie
- [ ] Hard mode has smaller targets, faster goalie
- [ ] Combo counter appears after 3 successes
- [ ] Perfect run (6 combo) shows 5x multiplier
- [ ] Combo breaks on miss

---

## Sprint 3: Polish & Brand Authenticity (Week 3)

**Goal:** Enhance visuals, deepen Yak brand integration, improve UX

### 🟠 High Priority Polish (10 hours)

#### 1. "Wet" Concept Enhancement (4 hours)

**Problem:** "Wet" badge is underwhelming, doesn't match show's humor
**Goal:** Make wet runs memorable with character-specific reactions

**Implementation:**

**New File: `src/data/wetReactions.ts`**
```typescript
import type { CharacterId } from '../types';

export const WET_REACTIONS: Record<CharacterId, string[]> = {
  BIG_CAT: [
    "That was SOAKING wet!",
    "Time to spin the Wet Wheel!",
    "Absolutely drenched!",
  ],
  BRANDON_WALKER: [
    "Wetter than a Mississippi summer!",
    "That's a Wet Wheel special right there!",
    "Soggy like my bracket picks!",
  ],
  KB: [
    "Geographically speaking, that was WET!",
    "Wet as the Pacific Ocean!",
    "That's a Category 5 Wet Run!",
  ],
  // ... other characters
};

export function getWetReaction(characterId: CharacterId): string {
  const reactions = WET_REACTIONS[characterId];
  return reactions[Math.floor(Math.random() * reactions.length)];
}
```

**Update ResultScene:**
```typescript
private createTimeDisplayInto(container: Phaser.GameObjects.Container, finalTimeMs: number, isWet: boolean): void {
  // ... existing time display

  if (isWet) {
    // Existing WET stamp
    // ...

    // Add character reaction
    const state = GameStateService.getState();
    if (state) {
      const reaction = getWetReaction(state.goalieCharacterId);
      const reactionText = this.add.text(
        GAME_WIDTH / 2,
        containerY + 80,
        `"${reaction}"`,
        {
          fontSize: '18px',
          fontFamily: YAK_FONTS.body,
          color: YAK_COLORS.textGold,
          align: 'center',
          fontStyle: 'italic',
          stroke: '#000000',
          strokeThickness: 3,
        }
      ).setOrigin(0.5);

      container.add(reactionText);

      // Animate in
      this.tweens.add({
        targets: reactionText,
        alpha: { from: 0, to: 1 },
        y: { from: containerY + 100, to: containerY + 80 },
        duration: 600,
        delay: 1000,
        ease: 'Back.easeOut',
      });
    }

    // Add "Wet Wheel" visual reference
    this.createWetWheelGraphic(GAME_WIDTH / 2, containerY + 120);
  }
}

private createWetWheelGraphic(x: number, y: number): void {
  // Create spinning wheel icon
  const wheel = this.add.graphics();
  wheel.lineStyle(4, YAK_COLORS.danger, 1);
  wheel.strokeCircle(0, 0, 30);

  // Add spokes
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    wheel.moveTo(0, 0);
    wheel.lineTo(Math.cos(angle) * 30, Math.sin(angle) * 30);
  }
  wheel.strokePath();

  const wheelContainer = this.add.container(x, y, [wheel]);
  wheelContainer.setAlpha(0.7);

  // Slow rotation
  this.tweens.add({
    targets: wheelContainer,
    rotation: Math.PI * 2,
    duration: 4000,
    repeat: -1,
    ease: 'Linear',
  });
}
```

---

#### 2. Visual Depth Enhancements (3 hours)

**Goal:** Make cornhole hole look deeper, add shadows, improve spatial awareness

**Update RunScene:**
```typescript
private createBoard(): void {
  // ... existing board creation

  // Enhanced hole depth using multiple layers
  this.createDeepHole(this.holeX, this.holeY, this.holeRadius);
}

private createDeepHole(x: number, y: number, radius: number): void {
  // Layer 1: Outer shadow (darkest)
  const outerShadow = this.add.circle(x + 3, y + 3, radius + 6, 0x000000, 0.5);
  outerShadow.setDepth(5);
  this.lightingManager.addToPipeline(outerShadow);

  // Layer 2: Hole rim (wood edge)
  const rim = this.add.circle(x, y, radius + 4, 0x5c4033);
  rim.setDepth(6);
  this.lightingManager.addToPipeline(rim);

  // Layer 3: Inner hole (very dark)
  const innerHole = this.add.circle(x, y, radius, 0x0a0a0a);
  innerHole.setDepth(7);
  this.lightingManager.addToPipeline(innerHole);

  // Layer 4: Deep black center
  const deepCenter = this.add.circle(x, y, radius - 8, 0x000000);
  deepCenter.setDepth(8);

  // Layer 5: Depth gradient (procedural)
  const depthGradient = this.add.graphics();
  depthGradient.setDepth(9);

  const gradient = depthGradient.fillGradientStyle(
    0x1a1a1a, 0x1a1a1a,
    0x000000, 0x000000,
    0.8, 0.8, 1, 1
  );
  depthGradient.fillCircle(x, y, radius - 4);

  // Add subtle inner ring highlight (light reflection)
  const highlight = this.add.graphics();
  highlight.lineStyle(1, 0x404040, 0.6);
  highlight.strokeCircle(x - 2, y - 2, radius - 12);
  highlight.setDepth(10);
}
```

**Add Landing Ripple Effect:**
```typescript
private launchBag(vx: number, vy: number): void {
  // ... existing launch logic

  const updateHandler = () => {
    // ... existing physics

    // When bag lands on board
    if (isOverBoard && velocityY > 0 && !onBoard) {
      velocityY = -velocityY * boardBounce;
      onBoard = true;
      AudioSystem.playBeep(0.8);

      // Add landing ripple
      this.createLandingRipple(this.bagContainer.x, this.bagContainer.y);
    }

    // ... rest of physics
  };
}

private createLandingRipple(x: number, y: number): void {
  const ripple = this.add.graphics();
  ripple.setDepth(4);

  this.tweens.add({
    targets: ripple,
    alpha: { from: 1, to: 0 },
    duration: 600,
    onUpdate: (tween) => {
      ripple.clear();
      const progress = tween.progress;
      const radius = progress * 40;
      ripple.lineStyle(3, YAK_COLORS.primary, 1 - progress);
      ripple.strokeCircle(x, y, radius);
    },
    onComplete: () => ripple.destroy(),
  });
}
```

---

#### 3. Character Integration Expansion (3 hours)

**Goal:** Add character reactions to more scenes, not just goalie

**Update Success/Fail Handlers:**

**RunScene (Cornhole):**
```typescript
private handleSuccess(): void {
  // ... existing success logic

  // Add character reaction
  const state = GameStateService.getState();
  if (state) {
    const quote = getCharacterQuote(state.goalieCharacterId, 'success');
    this.showCharacterQuote(quote, YAK_COLORS.success);
  }
}

private handleMiss(): void {
  // ... existing miss logic

  // Add character reaction on 3rd miss
  if (this.missCount >= 3) {
    const state = GameStateService.getState();
    if (state) {
      const quote = getCharacterQuote(state.goalieCharacterId, 'failure');
      this.showCharacterQuote(quote, YAK_COLORS.danger);
    }
  }
}

private showCharacterQuote(quote: string, color: number): void {
  const bubble = this.add.graphics();
  bubble.fillStyle(0x000000, 0.85);
  bubble.fillRoundedRect(GAME_WIDTH / 2 - 150, 100, 300, 80, 12);
  bubble.setDepth(200);

  const quoteText = this.add.text(GAME_WIDTH / 2, 140, `"${quote}"`, {
    fontSize: '16px',
    fontFamily: YAK_FONTS.body,
    color: Phaser.Display.Color.IntegerToColor(color).rgba,
    align: 'center',
    wordWrap: { width: 280 },
    fontStyle: 'italic',
  }).setOrigin(0.5).setDepth(201);

  // Fade out after 2 seconds
  this.tweens.add({
    targets: [bubble, quoteText],
    alpha: 0,
    duration: 400,
    delay: 2000,
    onComplete: () => {
      bubble.destroy();
      quoteText.destroy();
    },
  });
}
```

**Apply same pattern to:**
- WiffleScene (bat swing reactions)
- FootballScene (throw reactions)
- Corner3RightScene/Corner3LeftScene (shot reactions)

---

### Sprint 3 Deliverables

✅ Wet runs have character-specific reactions
✅ Wet Wheel graphic appears on wet results
✅ Cornhole hole has realistic depth with multiple layers
✅ Landing ripple effect when bag hits board
✅ Character quotes appear in all 6 stations

**Testing Checklist:**
- [ ] Wet run shows character quote
- [ ] Wet Wheel graphic visible and rotating
- [ ] Cornhole hole looks deep and realistic
- [ ] Bag landing creates visible ripple
- [ ] Character reacts to successes/misses in all scenes

---

## Sprint 4: Social Features & Accessibility (Week 4)

**Goal:** Enable sharing, improve accessibility for broader audience

### 🟠 High Priority Social Features (5 hours)

#### 1. Share Score Button (3 hours)

**Implementation:**

**Update ResultScene - Add Share Button:**
```typescript
private buildLeaderboardStep(): void {
  // ... existing leaderboard UI

  const shareBtn = this.createSecondaryButton(
    GAME_WIDTH / 2,
    GAME_HEIGHT - 150,
    'SHARE SCORE',
    () => this.shareScore()
  );

  this.leaderboardStepContainer.add(shareBtn);
}

private async shareScore(): Promise<void> {
  const state = GameStateService.getState();
  if (!state) return;

  const timeSeconds = (GameStateService.getFinalTimeMs() / 1000).toFixed(2);
  const isWet = state.wet;
  const difficulty = state.difficulty.toUpperCase();

  const shareText = isWet
    ? `I got a WET run in Yak Gauntlet! ⏱️ ${timeSeconds}s on ${difficulty} mode. Can you beat it? 🎮`
    : `I conquered the Yak Gauntlet in ${timeSeconds}s on ${difficulty} mode! 🏆 Think you can beat my time? 🎮`;

  const shareUrl = window.location.href;

  // Modern Web Share API
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Yak Gauntlet',
        text: shareText,
        url: shareUrl,
      });

      AudioSystem.playSuccess();
      this.cameras.main.flash(200, 100, 255, 100);
    } catch (err) {
      console.log('Share cancelled or failed:', err);
    }
  } else {
    // Fallback: Copy to clipboard
    await this.copyToClipboard(shareText + '\n' + shareUrl);

    // Show confirmation
    const copiedText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      'Link copied to clipboard!',
      {
        fontSize: '24px',
        fontFamily: YAK_FONTS.title,
        color: YAK_COLORS.success,
        stroke: '#000000',
        strokeThickness: 4,
      }
    ).setOrigin(0.5).setDepth(999);

    this.tweens.add({
      targets: copiedText,
      alpha: 0,
      duration: 400,
      delay: 1500,
      onComplete: () => copiedText.destroy(),
    });
  }
}

private async copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch (err) {
    console.error('Failed to copy:', err);
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  }
}
```

---

#### 2. Open Graph Metadata (1 hour)

**Update index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0">
  <title>Yak Gauntlet - Mini-Game Challenge</title>

  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://yourdomain.com/yak-gauntlet">
  <meta property="og:title" content="Yak Gauntlet - Can You Beat The Challenge?">
  <meta property="og:description" content="Test your skills in 6 sports mini-games inspired by The Yak. Cornhole, penalty kicks, wiffle ball, and more! Can you beat the timer?">
  <meta property="og:image" content="https://yourdomain.com/yak-gauntlet-share.jpg">

  <!-- Twitter -->
  <meta property="twitter:card" content="summary_large_image">
  <meta property="twitter:url" content="https://yourdomain.com/yak-gauntlet">
  <meta property="twitter:title" content="Yak Gauntlet - Mini-Game Challenge">
  <meta property="twitter:description" content="I just completed the Yak Gauntlet! Can you beat my time? 🏆">
  <meta property="twitter:image" content="https://yourdomain.com/yak-gauntlet-share.jpg">

  <!-- Favicon -->
  <link rel="icon" type="image/png" href="/favicon.png">

  <!-- ... rest of existing head -->
</head>
<!-- ... -->
</html>
```

**Create Share Image (Manual):**
- Design 1200x630px image with Yak branding
- Show game screenshot with "Beat My Time!" overlay
- Save as `public/yak-gauntlet-share.jpg`

---

#### 3. Leaderboard Permalinks (1 hour)

**Goal:** Allow sharing specific leaderboard ranks

**Implementation:**

**Update LeaderboardService:**
```typescript
generateShareableLink(entry: LeaderboardEntry, rank: number): string {
  const params = new URLSearchParams({
    time: entry.time_ms.toString(),
    wet: entry.wet.toString(),
    rank: rank.toString(),
    name: entry.username,
    difficulty: entry.difficulty || 'normal',
  });

  return `${window.location.origin}${window.location.pathname}?share=${params.toString()}`;
}
```

**Update ResultScene:**
```typescript
create(): void {
  // ... existing code

  // Check for shared leaderboard link
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('share')) {
    this.displaySharedScore(urlParams);
  }
}

private displaySharedScore(params: URLSearchParams): void {
  const time = parseInt(params.get('time') || '0');
  const wet = params.get('wet') === 'true';
  const rank = parseInt(params.get('rank') || '0');
  const name = params.get('name') || 'UNKNOWN';

  // Display challenge banner
  const banner = this.add.text(
    GAME_WIDTH / 2,
    50,
    `${name} challenged you! Rank #${rank} - ${(time / 1000).toFixed(2)}s`,
    {
      fontSize: '20px',
      fontFamily: YAK_FONTS.title,
      color: YAK_COLORS.secondary,
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 },
    }
  ).setOrigin(0.5).setDepth(500);

  // Pulse animation
  this.tweens.add({
    targets: banner,
    scale: 1.05,
    duration: 600,
    yoyo: true,
    repeat: -1,
  });
}
```

---

### 🟠 High Priority Accessibility (5 hours)

#### 1. Prefers-Reduced-Motion Support (2 hours)

**Implementation:**

**New File: `src/utils/AccessibilityManager.ts`**
```typescript
export class AccessibilityManager {
  private static instance: AccessibilityManager;

  private prefersReducedMotion: boolean;
  private highContrastMode: boolean;
  private textScale: number = 1.0;

  private constructor() {
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.highContrastMode = window.matchMedia('(prefers-contrast: more)').matches;

    // Listen for changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
    });
  }

  static getInstance(): AccessibilityManager {
    if (!AccessibilityManager.instance) {
      AccessibilityManager.instance = new AccessibilityManager();
    }
    return AccessibilityManager.instance;
  }

  shouldReduceMotion(): boolean {
    return this.prefersReducedMotion;
  }

  shouldUseHighContrast(): boolean {
    return this.highContrastMode;
  }

  getTweenDuration(baseDuration: number): number {
    return this.prefersReducedMotion ? Math.min(baseDuration * 0.3, 200) : baseDuration;
  }

  shouldSkipAnimation(): boolean {
    return this.prefersReducedMotion;
  }
}
```

**Update All Scenes:**
```typescript
import { AccessibilityManager } from '../utils/AccessibilityManager';

create(): void {
  // ... existing code

  const a11y = AccessibilityManager.getInstance();

  // Conditional animations
  if (!a11y.shouldSkipAnimation()) {
    this.tweens.add({
      targets: this.easyButton,
      y: y - 10,
      duration: a11y.getTweenDuration(2000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // Skip celebration particles
  if (!a11y.shouldReduceMotion()) {
    EnhancedVisuals.celebrateVictory(this);
  }
}
```

---

#### 2. Color Contrast Audit & Fixes (2 hours)

**Audit Current Colors:**

**File: `src/config/theme.ts`**

Run contrast checks on all text/background combinations:
```typescript
// Example fixes based on WCAG AA requirements (4.5:1 for normal text)

export const YAK_COLORS = {
  // ... existing colors

  // Text colors - ensure 4.5:1 contrast on dark backgrounds
  textGold: '#FFC107',      // Current - CHECK: vs #1e3a5f (navy) = 4.2:1 ❌
  textGoldA11y: '#FFD54F',  // NEW: vs #1e3a5f = 5.1:1 ✅

  textOrange: '#ff9800',    // Current - CHECK needed
  textOrangeA11y: '#FFB74D', // Lighter for better contrast

  // UI elements - ensure 3:1 contrast (WCAG 1.4.11)
  buttonBorder: '#FFC107',  // vs #ff5722 (primary) - CHECK
};

// Function to get accessible color
export function getAccessibleTextColor(useA11y: boolean): number {
  const a11y = AccessibilityManager.getInstance();
  const needsHighContrast = a11y.shouldUseHighContrast() || useA11y;

  return needsHighContrast ? YAK_COLORS.textGoldA11y : YAK_COLORS.textGold;
}
```

**Update UIHelper:**
```typescript
export function createSceneUI(scene: Phaser.Scene, stationIndex: number): SceneUI {
  const a11y = AccessibilityManager.getInstance();
  const textColor = a11y.shouldUseHighContrast()
    ? YAK_COLORS.textGoldA11y
    : YAK_COLORS.textGold;

  const timerText = scene.add.text(GAME_WIDTH / 2, 30, '0.00', {
    fontSize: '48px',
    fontFamily: YAK_FONTS.title,
    color: textColor, // Use accessible color
    stroke: '#000000',
    strokeThickness: 6, // Increased for better contrast
  }).setOrigin(0.5).setDepth(110);

  // ... rest of UI
}
```

---

#### 3. Accessibility Settings Panel (1 hour)

**New Scene: `src/scenes/SettingsScene.ts`**
```typescript
export class SettingsScene extends Phaser.Scene {
  private settings = {
    reduceMotion: false,
    highContrast: false,
    textScale: 1.0,
    soundVolume: 1.0,
  };

  constructor() {
    super({ key: 'SettingsScene' });
  }

  create(): void {
    // Title
    this.add.text(GAME_WIDTH / 2, 60, 'SETTINGS', {
      fontSize: '42px',
      fontFamily: YAK_FONTS.title,
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    // Accessibility section
    this.createToggle(200, 'Reduce Motion', this.settings.reduceMotion, (value) => {
      this.settings.reduceMotion = value;
      // Save to localStorage
      localStorage.setItem('a11y_reduceMotion', value.toString());
    });

    this.createToggle(280, 'High Contrast', this.settings.highContrast, (value) => {
      this.settings.highContrast = value;
      localStorage.setItem('a11y_highContrast', value.toString());
    });

    this.createSlider(360, 'Text Size', 0.8, 1.5, this.settings.textScale, (value) => {
      this.settings.textScale = value;
      localStorage.setItem('a11y_textScale', value.toString());
    });

    this.createSlider(440, 'Sound Volume', 0, 1, this.settings.soundVolume, (value) => {
      this.settings.soundVolume = value;
      localStorage.setItem('sound_volume', value.toString());
      AudioSystem.setVolume(value);
    });

    // Back button
    const backBtn = this.createBackButton();
  }

  private createToggle(
    y: number,
    label: string,
    initialValue: boolean,
    onChange: (value: boolean) => void
  ): void {
    const labelText = this.add.text(80, y, label, {
      fontSize: '20px',
      fontFamily: YAK_FONTS.body,
      color: '#ffffff',
    });

    const toggle = this.add.rectangle(
      GAME_WIDTH - 100,
      y,
      60,
      30,
      initialValue ? YAK_COLORS.success : YAK_COLORS.bgMedium
    );
    toggle.setStrokeStyle(2, YAK_COLORS.secondary);
    toggle.setInteractive({ useHandCursor: true });

    const knob = this.add.circle(
      GAME_WIDTH - (initialValue ? 85 : 115),
      y,
      12,
      0xffffff
    );

    toggle.on('pointerdown', () => {
      const newValue = !initialValue;
      toggle.setFillStyle(newValue ? YAK_COLORS.success : YAK_COLORS.bgMedium);
      this.tweens.add({
        targets: knob,
        x: GAME_WIDTH - (newValue ? 85 : 115),
        duration: 200,
      });
      onChange(newValue);
    });
  }

  private createSlider(
    y: number,
    label: string,
    min: number,
    max: number,
    initialValue: number,
    onChange: (value: number) => void
  ): void {
    // ... slider implementation with drag interaction
  }
}
```

**Add Settings Button to BootScene:**
```typescript
private createSettingsButton(): void {
  const btn = this.add.text(GAME_WIDTH - 50, 50, '⚙️', {
    fontSize: '32px',
  }).setOrigin(0.5);

  btn.setInteractive({ useHandCursor: true });
  btn.on('pointerdown', () => {
    this.scene.start('SettingsScene');
  });
}
```

---

### Sprint 4 Deliverables

✅ Share button copies link to clipboard
✅ Web Share API integration for mobile
✅ Open Graph metadata for rich social previews
✅ Leaderboard permalinks for challenges
✅ Prefers-reduced-motion support
✅ Color contrast meets WCAG AA
✅ Accessibility settings panel

**Testing Checklist:**
- [ ] Share button works on mobile (Web Share API)
- [ ] Share button copies to clipboard on desktop
- [ ] Social media preview shows correct image/text
- [ ] Reduced motion preference respected
- [ ] High contrast mode improves readability
- [ ] Settings panel accessible via keyboard

---

## Future Roadmap (Weeks 5-8+)

### 🟡 Medium Priority Enhancements

#### Code Refactoring
- [ ] Extract Corner3BaseScene (eliminate duplication) - 4 hours
- [ ] Create centralized constants file - 2 hours
- [ ] Add TypeScript null safety checks - 3 hours
- [ ] Implement error boundary pattern - 2 hours

#### Visual Polish
- [ ] Add goalie dive animations - 4 hours
- [ ] Implement wiffle ball sweet spot pulse - 2 hours
- [ ] Create football spiral rotation - 3 hours
- [ ] Add backboard flex animation - 3 hours
- [ ] Implement crowd reaction animations - 5 hours

#### Feature Additions
- [ ] Achievements system with badges - 8 hours
- [ ] Daily/weekly challenge rotation - 6 hours
- [ ] Practice mode (no timer) - 3 hours
- [ ] Tutorial/onboarding flow - 5 hours
- [ ] Replay/highlight system - 8 hours

#### Mobile Optimization
- [ ] True haptic feedback (vibration API) - 1 hour
- [ ] Touch target size audit - 2 hours
- [ ] Gesture support (swipe navigation) - 3 hours
- [ ] Performance mode toggle - 3 hours

#### Multiplayer/Social
- [ ] Local pass-and-play mode - 6 hours
- [ ] Ghost mode (replay comparison) - 8 hours
- [ ] Friend challenges (shareable seeds) - 5 hours
- [ ] Public leaderboard website - 12 hours

---

## Success Metrics

Track these metrics after each sprint:

### Performance
- **Target:** < 200ms scene load time
- **Target:** Steady 60 FPS on mid-range mobile
- **Target:** < 100MB memory usage after 20+ runs

### Engagement
- **Target:** 70%+ mobile users
- **Target:** 3+ runs per session average
- **Target:** 20%+ return rate (7-day)

### Quality
- **Target:** Zero critical accessibility violations
- **Target:** WCAG AA compliance
- **Target:** < 5% error rate in production

### Social
- **Target:** 10%+ share rate on results screen
- **Target:** 50+ daily leaderboard entries
- **Target:** 5+ shared challenges per day

---

## Implementation Tips

### Best Practices
1. **Test on Real Devices:** Use BrowserStack or physical phones for mobile testing
2. **Version Control:** Create feature branches for each sprint
3. **Code Review:** Review changes before merging to main
4. **Documentation:** Update APP_ARCHITECTURE.md with each change
5. **Performance:** Run Lighthouse audits after each sprint

### Development Workflow
```bash
# Sprint 1
git checkout -b feature/sprint-1-critical-fixes
# Implement fixes
git commit -m "Fix: Add scene shutdown methods"
git push origin feature/sprint-1-critical-fixes
# Create PR, review, merge

# Sprint 2
git checkout -b feature/sprint-2-core-features
# Implement features
git commit -m "Feature: Add difficulty progression system"
# ... etc
```

### Testing Strategy
- **Unit Tests:** Critical business logic (GameStateService, LeaderboardService)
- **Integration Tests:** Scene transitions, state management
- **E2E Tests:** Complete game runs on different devices
- **Accessibility Tests:** Screen reader, keyboard navigation, color contrast

---

## Resources & Tools

### Development
- **Phaser Documentation:** https://photonstorm.github.io/phaser3-docs/
- **TypeScript Handbook:** https://www.typescriptlang.org/docs/
- **Vite Guide:** https://vitejs.dev/guide/

### Accessibility
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **NVDA Screen Reader:** https://www.nvaccess.org/download/

### Testing
- **BrowserStack:** Cross-browser/device testing
- **Lighthouse:** Performance and accessibility audits
- **axe DevTools:** Accessibility testing

### Design
- **Figma:** UI mockups and prototypes
- **Piskel:** Pixel art editor (if needed for sprites)
- **Procedural Art:** All textures already generated via code ✅

---

## Conclusion

This roadmap provides **80-100 hours of focused development** organized into **4 weekly sprints** that will transform The Yak Gauntlet from a solid foundation into a polished, accessible, and engaging AAA mobile game.

**Key Focus Areas:**
1. **Sprint 1:** Stability and mobile compatibility
2. **Sprint 2:** Core engagement features
3. **Sprint 3:** Brand authenticity and polish
4. **Sprint 4:** Social features and accessibility

Each sprint is designed to deliver **tangible value** that improves the user experience. Prioritize based on your goals:
- **Want more players?** Focus on Sprints 1, 2, 4 (mobile + social)
- **Want deeper engagement?** Focus on Sprints 2, 3 (features + polish)
- **Want brand strength?** Focus on Sprint 3 (Yak authenticity)
- **Want accessibility?** Focus on Sprint 4 (a11y features)

Good luck with the implementation! 🎮🏆
