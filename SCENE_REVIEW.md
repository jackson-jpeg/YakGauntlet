# Scene Files Review - Comprehensive Analysis

## Executive Summary

The scene files are well-structured and follow consistent patterns, but there are several areas for improvement around code duplication, memory management, and type safety.

**Overall Grade: B+**

---

## 🎯 Strengths

1. **Consistent Architecture**: All scenes follow similar patterns (create → update → handlers)
2. **Good UI Abstraction**: `createSceneUI` provides consistent header across scenes
3. **Visual Polish**: Excellent use of graphics, shadows, trails, and effects
4. **Physics Feel**: Consistent physics constants and realistic ball movement
5. **Code Organization**: Clear separation of concerns within each scene

---

## 🚨 Critical Issues

### 1. Memory Leaks - Event Handlers

**Location**: `BootScene.ts:233`, `FootballScene.ts:548`, `GoalieScene.ts:572`, `RunScene.ts:427`

**Problem**: Event handlers registered with `this.events.on('update', ...)` may not be cleaned up if scene is destroyed before completion.

**Fix**: Add `shutdown()` method to all scenes:

```typescript
shutdown(): void {
  // Clean up all event handlers
  this.events.removeAllListeners('update');
  this.input.removeAllListeners();
  // Clean up any other subscriptions
}
```

**Status**: ⚠️ **HIGH PRIORITY** - Can cause memory leaks in long sessions

---

### 2. Code Duplication - Corner3 Scenes

**Location**: `Corner3LeftScene.ts` (907 lines) vs `Corner3RightScene.ts` (924 lines)

**Problem**: ~95% code duplication. Only differences:
- `BACKBOARD_X` position (left: `GAME_WIDTH - 140`, right: `140`)
- Rim center calculation (left: `BACKBOARD_X - 35`, right: `BACKBOARD_X + 35`)
- Spawn position (left: `90`, right: `GAME_WIDTH - 90`)
- Collision detection direction

**Fix**: Create base class `BaseCorner3Scene`:

```typescript
abstract class BaseCorner3Scene extends Phaser.Scene {
  protected abstract BACKBOARD_X: number;
  protected abstract getRimCenterX(): number;
  protected abstract getSpawnX(): number;
  // ... shared implementation
}
```

**Status**: ⚠️ **MEDIUM PRIORITY** - Maintenance burden, but not breaking

---

### 3. Type Safety Issues

**Location**: `ResultScene.ts:515-526`

**Problem**: Unsafe type checking when filtering children:

```typescript
const inputElements = this.children.list.slice(0, -1);
inputElements.forEach(child => {
  if (child instanceof Phaser.GameObjects.Text ||
      child instanceof Phaser.GameObjects.Graphics ||
      child instanceof Phaser.GameObjects.Rectangle) {
    // ...
  }
});
```

**Fix**: Use proper type guards or track elements explicitly:

```typescript
private inputElements: Phaser.GameObjects.GameObject[] = [];

// When creating elements:
this.inputElements.push(text, graphics, rectangle);

// When cleaning up:
this.inputElements.forEach(el => el.destroy());
```

**Status**: ⚠️ **MEDIUM PRIORITY** - Could cause runtime errors

---

## ⚡ Performance Issues

### 4. QuizScene Resize Handling

**Location**: `QuizScene.ts:367-371`

**Problem**: Restarts entire scene on resize (expensive):

```typescript
handleResize(_gameSize: Phaser.Structs.Size): void {
  this.scene.restart(); // Recreates everything!
}
```

**Fix**: Reposition elements instead:

```typescript
handleResize(gameSize: Phaser.Structs.Size): void {
  // Reposition existing elements
  this.repositionElements(gameSize.width, gameSize.height);
}
```

**Status**: ⚠️ **LOW PRIORITY** - Works but inefficient

---

### 5. Graphics Clearing Every Frame

**Location**: Multiple scenes (trail updates, net drawing)

**Problem**: `graphics.clear()` called every frame without pooling.

**Fix**: Consider object pooling for frequently created/destroyed graphics.

**Status**: ℹ️ **OPTIMIZATION** - Current performance likely fine, but could improve

---

## 🐛 Logic Issues

### 6. Rim Bounce Limit Too Strict

**Location**: `Corner3LeftScene.ts:728`, `Corner3RightScene.ts:757`

**Problem**: Hard limit of 6 rim bounces may frustrate players:

```typescript
if (this.rimBounces > 6 && !this.passedThroughHoop) {
  this.handleRimOut();
}
```

**Fix**: Make configurable or increase limit:

```typescript
private readonly MAX_RIM_BOUNCES = 10; // More forgiving
```

**Status**: ℹ️ **GAMEPLAY TUNING** - May be intentional difficulty

---

### 7. Goalie Movement After Launch

**Location**: `GoalieScene.ts:714-728`

**Problem**: Goalie continues patrolling after ball is launched (should freeze or react).

**Fix**: Stop movement when ball is in flight:

```typescript
update(): void {
  if (!this.hasLaunched) {
    // Only patrol when ball not launched
    this.patrolGoalie();
  }
  updateTimer(this.ui.timerText);
}
```

**Status**: ℹ️ **GAMEPLAY TUNING** - May be intentional

---

### 8. Wiffle Timing Window Hardcoded

**Location**: `WiffleScene.ts:361`

**Problem**: Timing window hardcoded in multiple places:

```typescript
if (timing >= 0.60 && timing <= 0.88) {
  const quality = 1 - Math.abs(timing - 0.75) * 4;
}
```

**Fix**: Extract to constants:

```typescript
private readonly SWING_WINDOW_START = 0.60;
private readonly SWING_WINDOW_END = 0.88;
private readonly SWING_WINDOW_CENTER = 0.75;
```

**Status**: ℹ️ **CODE QUALITY** - Makes tuning easier

---

## 📋 Code Quality Issues

### 9. Magic Numbers Everywhere

**Problem**: Hardcoded values throughout:
- `0.35` (gravity) - should use `PHYSICS.GRAVITY_LIGHT`
- `0.995` (air resistance) - should use `PHYSICS.AIR_RESISTANCE`
- `380` (hoop Y position) - should be constant
- `50` (power max) - should be configurable

**Fix**: Extract to scene-level constants or config:

```typescript
private readonly HOOP_Y = 380;
private readonly MAX_POWER = 50;
private readonly GRAVITY = PHYSICS.GRAVITY_NORMAL;
```

**Status**: ℹ️ **CODE QUALITY** - Makes code more maintainable

---

### 10. Inconsistent Error Handling

**Problem**: Some scenes validate input, others don't:
- `Corner3LeftScene` checks `distance < 15`
- `FootballScene` checks `distance < 20`
- `GoalieScene` checks `distance < 20`
- Inconsistent thresholds

**Fix**: Standardize minimum drag distance:

```typescript
private readonly MIN_DRAG_DISTANCE = 15; // Consistent across all scenes
```

**Status**: ℹ️ **CODE QUALITY** - Consistency improvement

---

### 11. Missing Null Checks

**Location**: Multiple scenes

**Problem**: Assumes `GameStateService.getState()` returns non-null:

```typescript
const state = GameStateService.getState();
// Uses state without null check
```

**Fix**: Add defensive checks:

```typescript
const state = GameStateService.getState();
if (!state) {
  console.error('No game state available');
  this.scene.start('BootScene');
  return;
}
```

**Status**: ⚠️ **MEDIUM PRIORITY** - Could cause crashes

---

## 🔧 Recommended Refactorings

### 12. Extract Physics Utility

**Create**: `src/utils/PhysicsHelper.ts`

```typescript
export class PhysicsHelper {
  static applyGravity(vy: number, gravity: number): number {
    return vy + gravity;
  }
  
  static applyAirResistance(vx: number, vy: number, resistance: number) {
    return {
      vx: vx * resistance,
      vy: vy * resistance
    };
  }
  
  static calculateTrajectory(startX, startY, vx, vy, gravity, steps) {
    // Shared trajectory calculation
  }
}
```

**Status**: 💡 **ENHANCEMENT** - Reduces duplication

---

### 13. Create Base Projectile Scene

**Create**: `src/scenes/BaseProjectileScene.ts`

Common functionality for all throwing/kicking scenes:
- Drag-to-aim input
- Trajectory preview
- Physics update loop
- Trail rendering
- Shadow updates

**Status**: 💡 **ENHANCEMENT** - Major refactor, high value

---

### 14. Standardize Scene Lifecycle

**Add to all scenes**:

```typescript
create(): void {
  // Setup
}

update(): void {
  // Game loop
}

shutdown(): void {
  // Cleanup - REQUIRED
  this.events.removeAllListeners();
  this.input.removeAllListeners();
  this.tweens.killAll();
  this.time.removeAllEvents();
}
```

**Status**: ⚠️ **HIGH PRIORITY** - Prevents memory leaks

---

## 📊 Scene-by-Scene Analysis

### BootScene.ts ✅
- **Status**: Good
- **Issues**: Event handler cleanup (line 233)
- **Size**: 334 lines (reasonable)

### Corner3LeftScene.ts ⚠️
- **Status**: Needs refactoring
- **Issues**: Code duplication, magic numbers
- **Size**: 907 lines (too large)

### Corner3RightScene.ts ⚠️
- **Status**: Needs refactoring
- **Issues**: Code duplication, magic numbers
- **Size**: 924 lines (too large)

### FootballScene.ts ✅
- **Status**: Good
- **Issues**: Event handler cleanup, magic numbers
- **Size**: 649 lines (reasonable)

### GoalieScene.ts ✅
- **Status**: Good
- **Issues**: Goalie movement logic, magic numbers
- **Size**: 733 lines (reasonable)

### QuizScene.ts ⚠️
- **Status**: Needs optimization
- **Issues**: Resize handling, type safety
- **Size**: 372 lines (good)

### ResultScene.ts ⚠️
- **Status**: Needs type safety improvements
- **Issues**: Unsafe child filtering, missing null checks
- **Size**: 676 lines (reasonable)

### RunScene.ts ✅
- **Status**: Good
- **Issues**: Event handler cleanup, magic numbers
- **Size**: 510 lines (reasonable)

### WiffleScene.ts ✅
- **Status**: Good
- **Issues**: Hardcoded timing values
- **Size**: 541 lines (reasonable)

---

## 🎯 Priority Action Items

### High Priority (Do First)
1. ✅ Add `shutdown()` methods to all scenes
2. ✅ Add null checks for `GameStateService.getState()`
3. ✅ Fix unsafe type checking in `ResultScene`

### Medium Priority (Do Soon)
4. ✅ Extract base class for Corner3 scenes
5. ✅ Standardize minimum drag distances
6. ✅ Extract magic numbers to constants

### Low Priority (Nice to Have)
7. ✅ Optimize QuizScene resize handling
8. ✅ Create physics utility class
9. ✅ Create base projectile scene class
10. ✅ Tune gameplay values (rim bounces, timing windows)

---

## 📝 Code Style Observations

### Good Practices ✅
- Consistent naming conventions
- Clear method names
- Good use of TypeScript interfaces
- Proper use of Phaser containers
- Consistent depth layering

### Areas for Improvement
- Some methods too long (100+ lines)
- Could benefit from more helper methods
- Some complex conditionals could be extracted
- Magic numbers should be constants

---

## 🧪 Testing Recommendations

1. **Memory Leak Testing**: Run game for extended period, check memory usage
2. **Scene Transition Testing**: Rapidly switch scenes, ensure cleanup
3. **Input Validation**: Test edge cases (very short drags, rapid clicks)
4. **Physics Testing**: Verify consistent feel across all projectile scenes
5. **Resize Testing**: Test on various screen sizes, especially QuizScene

---

## 📚 Documentation Needs

1. Document scene lifecycle expectations
2. Document physics constants and their effects
3. Document scene transition flow
4. Add JSDoc comments to complex methods
5. Document magic number meanings

---

## ✅ Conclusion

The scene files are well-written and functional, but would benefit from:
- Better memory management (shutdown methods)
- Reduced code duplication (base classes)
- Improved type safety
- More consistent patterns

**Estimated Refactoring Time**: 2-3 days for high/medium priority items

**Risk Level**: Low - Current code works, improvements are incremental
