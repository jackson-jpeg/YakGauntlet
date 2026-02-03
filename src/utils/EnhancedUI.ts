import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS, getPowerColor } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { popScale, objectShake } from './JuiceFactory';
import { createStarBurst } from './VisualEffects';

/**
 * Enhanced UI System
 * Provides rich, animated UI components with better visual feedback
 */

export interface EnhancedSceneUI {
  timerText: Phaser.GameObjects.Text;
  timerContainer: Phaser.GameObjects.Container;
  timerProgress: Phaser.GameObjects.Arc;
  stationBadge: Phaser.GameObjects.Container;
  progressContainer: Phaser.GameObjects.Container;
  progressText: Phaser.GameObjects.Text;
  missText: Phaser.GameObjects.Text;
  powerMeter?: PowerMeter;
  comboIndicator?: ComboIndicator;
}

export interface PowerMeter {
  container: Phaser.GameObjects.Container;
  bar: Phaser.GameObjects.Graphics;
  fill: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  update: (power: number, maxPower: number) => void;
}

export interface ComboIndicator {
  container: Phaser.GameObjects.Container;
  text: Phaser.GameObjects.Text;
  streak: number;
  show: (streak: number) => void;
  hide: () => void;
}

/**
 * Creates enhanced UI header with animations and better visual hierarchy
 */
export function createEnhancedSceneUI(
  scene: Phaser.Scene,
  stationIndex: number,
  missLabel: string = 'Misses',
  options: {
    showPowerMeter?: boolean;
    showCombo?: boolean;
  } = {}
): EnhancedSceneUI {
  const station = STATIONS[stationIndex];
  const totalStations = STATIONS.length;

  // === TOP BAR BACKGROUND (with gradient) ===
  const topBar = scene.add.graphics();
  topBar.fillGradientStyle(0x000000, 0x000000, 0x1a1a1a, 0x1a1a1a, 1);
  topBar.fillRect(0, 0, GAME_WIDTH, 140);
  topBar.setDepth(90);

  // Subtle top border glow
  const borderGlow = scene.add.graphics();
  borderGlow.lineStyle(2, YAK_COLORS.secondary, 0.3);
  borderGlow.moveTo(0, 0);
  borderGlow.lineTo(GAME_WIDTH, 0);
  borderGlow.strokePath();
  borderGlow.setDepth(91);

  // === ENHANCED STATION BADGE (top left) ===
  const stationBadge = createEnhancedBadge(scene, station, 60, 40);

  // === ENHANCED PROGRESS INDICATOR (top right) ===
  const progressContainer = createEnhancedProgress(scene, stationIndex, totalStations, GAME_WIDTH - 60, 40);

  // === ENHANCED TIMER (center) ===
  const { timerContainer, timerText, timerProgress } = createEnhancedTimer(scene, GAME_WIDTH / 2, 85);

  // === MISS COUNTER (below timer) ===
  const missText = scene.add.text(GAME_WIDTH / 2, 145, `${missLabel}: 0`, {
    fontSize: '15px',
    fontFamily: YAK_FONTS.body,
    color: '#ffcdd2',
    stroke: '#000000',
    strokeThickness: 2,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(100);

  // Pulse animation for miss counter
  scene.tweens.add({
    targets: missText,
    alpha: 0.7,
    duration: 1000,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  const ui: EnhancedSceneUI = {
    timerText,
    timerContainer,
    timerProgress,
    stationBadge,
    progressContainer,
    progressText: progressContainer.getByName('progressText') as Phaser.GameObjects.Text,
    missText,
  };

  // === OPTIONAL: POWER METER ===
  if (options.showPowerMeter) {
    ui.powerMeter = createPowerMeter(scene, GAME_WIDTH / 2, GAME_HEIGHT - 120);
  }

  // === OPTIONAL: COMBO INDICATOR ===
  if (options.showCombo) {
    ui.comboIndicator = createComboIndicator(scene, GAME_WIDTH / 2, 200);
  }

  return ui;
}

/**
 * Creates enhanced station badge with glow and animation
 */
function createEnhancedBadge(
  scene: Phaser.Scene,
  station: typeof STATIONS[0],
  x: number,
  y: number
): Phaser.GameObjects.Container {
  const badge = scene.add.container(x, y);
  badge.setDepth(100);

  // Outer glow
  const glow = scene.add.graphics();
  glow.fillStyle(station.color, 0.2);
  glow.fillRoundedRect(-55, -23, 110, 46, 12);
  badge.add(glow);

  // Badge background with gradient effect
  const badgeBg = scene.add.graphics();
  badgeBg.fillStyle(station.color, 1);
  badgeBg.fillRoundedRect(-50, -18, 100, 36, 10);
  badgeBg.lineStyle(3, 0xffffff, 0.4);
  badgeBg.strokeRoundedRect(-50, -18, 100, 36, 10);
  badge.add(badgeBg);

  // Inner highlight
  const highlight = scene.add.graphics();
  highlight.fillStyle(0xffffff, 0.15);
  highlight.fillRoundedRect(-48, -16, 96, 20, 8);
  badge.add(highlight);

  // Badge text
  const badgeText = scene.add.text(0, 0, station.name, {
    fontSize: '17px',
    fontFamily: YAK_FONTS.title,
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 2,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  badge.add(badgeText);

  // Station emoji (if available)
  if (station.emoji) {
    const emoji = scene.add.text(-35, 0, station.emoji, {
      fontSize: '20px',
    }).setOrigin(0.5);
    badge.add(emoji);
  }

  // Entrance animation
  badge.setScale(0);
  scene.tweens.add({
    targets: badge,
    scale: 1,
    duration: 400,
    ease: 'Back.easeOut',
  });

  // Subtle pulse
  scene.tweens.add({
    targets: glow,
    alpha: 0.3,
    duration: 1500,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  return badge;
}

/**
 * Creates enhanced progress indicator with animations
 */
function createEnhancedProgress(
  scene: Phaser.Scene,
  stationIndex: number,
  totalStations: number,
  x: number,
  y: number
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  container.setDepth(100);

  // Progress dots with connecting lines
  const dots: Phaser.GameObjects.Arc[] = [];
  for (let i = 0; i < totalStations; i++) {
    const dotX = (i - (totalStations - 1) / 2) * 20;
    const isCompleted = i < stationIndex;
    const isCurrent = i === stationIndex;

    // Connecting line (before current)
    if (i > 0) {
      const line = scene.add.graphics();
      const prevDotX = ((i - 1) - (totalStations - 1) / 2) * 20;
      const lineColor = isCompleted ? YAK_COLORS.success : 0x4a5568;
      line.lineStyle(2, lineColor, isCompleted ? 0.8 : 0.3);
      line.moveTo(prevDotX + 6, 0);
      line.lineTo(dotX - 6, 0);
      line.strokePath();
      container.add(line);
    }

    // Dot
    const dot = scene.add.circle(dotX, 0, isCurrent ? 8 : 6,
      isCurrent ? YAK_COLORS.secondary :
      isCompleted ? YAK_COLORS.success : 0x4a5568
    );

    if (isCurrent) {
      dot.setStrokeStyle(3, 0xffffff, 1);
      // Pulse animation
      scene.tweens.add({
        targets: dot,
        scale: 1.4,
        duration: 600,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    } else if (isCompleted) {
      // Checkmark for completed
      const check = scene.add.text(dotX, 0, '✓', {
        fontSize: '10px',
        color: '#ffffff',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(check);
    }

    dots.push(dot);
    container.add(dot);
  }

  // Progress text
  const progressText = scene.add.text(0, 25, `${stationIndex + 1}/${totalStations}`, {
    fontSize: '15px',
    fontFamily: YAK_FONTS.title,
    color: '#9ca3af',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  progressText.setName('progressText');
  container.add(progressText);

  // Progress bar background
  const barBg = scene.add.graphics();
  barBg.fillStyle(0x1a1a1a, 0.5);
  barBg.fillRoundedRect(-60, 40, 120, 6, 3);
  container.add(barBg);

  // Progress bar fill
  const progress = (stationIndex + 1) / totalStations;
  const barFill = scene.add.graphics();
  barFill.fillStyle(YAK_COLORS.secondary, 1);
  barFill.fillRoundedRect(-60, 40, 120 * progress, 6, 3);
  container.add(barFill);

  // Animate progress bar
  barFill.setScaleX(0);
  scene.tweens.add({
    targets: barFill,
    scaleX: progress,
    duration: 500,
    ease: 'Power2',
  });

  return container;
}

/**
 * Creates enhanced timer with circular progress indicator
 */
function createEnhancedTimer(
  scene: Phaser.Scene,
  x: number,
  y: number
): {
  timerContainer: Phaser.GameObjects.Container;
  timerText: Phaser.GameObjects.Text;
  timerProgress: Phaser.GameObjects.Arc;
} {
  const container = scene.add.container(x, y);
  container.setDepth(100);

  // Circular progress background
  const progressBg = scene.add.graphics();
  progressBg.lineStyle(8, 0x1a1a1a, 1);
  progressBg.strokeCircle(0, 0, 50);
  container.add(progressBg);

  // Circular progress indicator
  const progress = scene.add.graphics();
  progress.lineStyle(8, YAK_COLORS.primary, 1);
  progress.setDepth(96);
  container.add(progress);

  // Timer background with gradient
  const timerBg = scene.add.graphics();
  timerBg.fillGradientStyle(
    YAK_COLORS.primary, YAK_COLORS.primary,
    YAK_COLORS.primaryDark, YAK_COLORS.primaryDark,
    1
  );
  timerBg.fillRoundedRect(-85, -32, 170, 70, 14);
  timerBg.lineStyle(4, YAK_COLORS.secondary, 0.9);
  timerBg.strokeRoundedRect(-85, -32, 170, 70, 14);
  timerBg.setDepth(95);
  container.add(timerBg);

  // Inner glow
  const innerGlow = scene.add.graphics();
  innerGlow.fillStyle(0xffffff, 0.1);
  innerGlow.fillRoundedRect(-82, -29, 164, 30, 10);
  innerGlow.setDepth(96);
  container.add(innerGlow);

  // Timer text
  const timerText = scene.add.text(0, -5, '0.00', {
    fontSize: '48px',
    fontFamily: YAK_FONTS.title,
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 3,
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(100);
  container.add(timerText);

  // Timer label
  const timerLabel = scene.add.text(0, 25, 'TIME', {
    fontSize: '12px',
    fontFamily: YAK_FONTS.body,
    color: '#ffcdd2',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(100);
  container.add(timerLabel);

  // Entrance animation
  container.setScale(0);
  scene.tweens.add({
    targets: container,
    scale: 1,
    duration: 500,
    ease: 'Back.easeOut',
  });

  return {
    timerContainer: container,
    timerText,
    timerProgress: progress as Phaser.GameObjects.Arc,
  };
}

/**
 * Creates power meter for aim/power visualization
 */
export function createPowerMeter(
  scene: Phaser.Scene,
  x: number,
  y: number
): PowerMeter {
  const container = scene.add.container(x, y);
  container.setDepth(150);
  container.setVisible(false);

  // Background
  const bar = scene.add.graphics();
  bar.fillStyle(0x1a1a1a, 0.8);
  bar.fillRoundedRect(-100, -12, 200, 24, 12);
  bar.lineStyle(2, 0x4a5568, 1);
  bar.strokeRoundedRect(-100, -12, 200, 24, 12);
  container.add(bar);

  // Fill
  const fill = scene.add.graphics();
  container.add(fill);

  // Label
  const label = scene.add.text(0, -35, 'POWER', {
    fontSize: '14px',
    fontFamily: YAK_FONTS.title,
    color: '#9ca3af',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  container.add(label);

  const update = (power: number, maxPower: number) => {
    const percent = Math.min(power / maxPower, 1);
    fill.clear();

    // Color based on power level
    const color = getPowerColor(percent);

    fill.fillStyle(color, 1);
    fill.fillRoundedRect(-98, -10, 196 * percent, 20, 10);

    // Glow effect for high power
    if (percent > 0.8) {
      fill.lineStyle(2, color, 0.8);
      fill.strokeRoundedRect(-98, -10, 196 * percent, 20, 10);
    }
  };

  return { container, bar, fill, label, update };
}

/**
 * Creates combo/streak indicator
 */
export function createComboIndicator(
  scene: Phaser.Scene,
  x: number,
  y: number
): ComboIndicator {
  const container = scene.add.container(x, y);
  container.setDepth(200);
  container.setVisible(false);
  container.setAlpha(0);

  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.7);
  bg.fillRoundedRect(-80, -25, 160, 50, 12);
  bg.lineStyle(3, YAK_COLORS.secondary, 1);
  bg.strokeRoundedRect(-80, -25, 160, 50, 12);
  container.add(bg);

  // Text
  const text = scene.add.text(0, 0, 'COMBO x1', {
    fontSize: '24px',
    fontFamily: YAK_FONTS.title,
    color: YAK_COLORS.secondary,
    stroke: '#000000',
    strokeThickness: 4,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  container.add(text);

  let streak = 0;

  const show = (newStreak: number) => {
    streak = newStreak;
    text.setText(`COMBO x${streak}`);
    container.setVisible(true);

    scene.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: container,
          scale: 1,
          duration: 150,
        });
      },
    });
  };

  const hide = () => {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scale: 0.8,
      duration: 300,
      onComplete: () => {
        container.setVisible(false);
      },
    });
  };

  return { container, text, streak, show, hide };
}

/**
 * Enhanced timer update with circular progress
 */
export function updateEnhancedTimer(
  timerText: Phaser.GameObjects.Text,
  timerProgress: Phaser.GameObjects.Graphics,
  timerContainer: Phaser.GameObjects.Container
): void {
  const state = GameStateService.getState();
  if (state && state.startTimeMs > 0) {
    const timeMs = GameStateService.getCurrentTimeMs();
    const timeSeconds = timeMs / 1000;
    timerText.setText(timeSeconds.toFixed(2));

    // Update circular progress (75 seconds = full circle)
    const maxTime = 75000;
    const progress = Math.min(timeMs / maxTime, 1);
    const angle = progress * Math.PI * 2 - Math.PI / 2;

    timerProgress.clear();
    timerProgress.lineStyle(8, YAK_COLORS.primary, 1);
    timerProgress.beginPath();
    timerProgress.arc(0, 0, 50, -Math.PI / 2, angle, false);
    timerProgress.strokePath();

    // Color changes for urgency
    let color = '#ffffff';
    let progressColor = YAK_COLORS.primary;
    if (timeMs > 60000) {
      color = '#ef4444';
      progressColor = YAK_COLORS.danger;
      // Pulse effect
      timerContainer.setScale(1 + Math.sin(Date.now() / 100) * 0.05);
    } else if (timeMs > 45000) {
      color = '#fbbf24';
      progressColor = YAK_COLORS.warning;
    }

    timerText.setColor(color);
    timerProgress.clear();
    timerProgress.lineStyle(8, progressColor, 1);
    timerProgress.beginPath();
    timerProgress.arc(0, 0, 50, -Math.PI / 2, angle, false);
    timerProgress.strokePath();
  }
}

/**
 * Creates floating hint text
 */
export function createHint(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  duration: number = 3000
): void {
  const hint = scene.add.text(x, y, text, {
    fontSize: '16px',
    fontFamily: YAK_FONTS.body,
    color: '#ffffff',
    backgroundColor: '#000000',
    padding: { x: 12, y: 8 },
    align: 'center',
  }).setOrigin(0.5).setDepth(250).setAlpha(0);

  scene.tweens.add({
    targets: hint,
    alpha: 1,
    y: y - 20,
    duration: 300,
    ease: 'Power2',
    onComplete: () => {
      scene.tweens.add({
        targets: hint,
        alpha: 0,
        y: y - 60,
        duration: 500,
        delay: duration,
        ease: 'Power2',
        onComplete: () => hint.destroy(),
      });
    },
  });
}

// ============================================
// ANIMATED COUNTER SYSTEM
// ============================================

export interface AnimatedCounterConfig {
  tickSound?: boolean;
  popScale?: number;
  flashColor?: number;
  milestoneParticles?: boolean;
  milestoneInterval?: number;
  prefix?: string;
  suffix?: string;
  fontSize?: string;
  color?: string;
}

export interface AnimatedCounterInstance {
  container: Phaser.GameObjects.Container;
  text: Phaser.GameObjects.Text;
  value: number;
  setValue: (newValue: number, animate?: boolean) => void;
  increment: (amount?: number) => void;
  decrement: (amount?: number) => void;
  destroy: () => void;
}

/**
 * Creates an animated counter with tick-up effects, pops, flashes, and milestone particles
 */
export function createAnimatedCounter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  initialValue: number = 0,
  config: AnimatedCounterConfig = {}
): AnimatedCounterInstance {
  const {
    tickSound = true,
    popScale: popScaleAmount = 1.2,
    flashColor = YAK_COLORS.secondary,
    milestoneParticles = true,
    milestoneInterval = 10,
    prefix = '',
    suffix = '',
    fontSize = '32px',
    color = '#ffffff'
  } = config;

  const container = scene.add.container(x, y);
  container.setDepth(150);

  // Glow behind text
  const glow = scene.add.graphics();
  glow.setAlpha(0);
  container.add(glow);

  // Main counter text
  const text = scene.add.text(0, 0, `${prefix}${initialValue}${suffix}`, {
    fontSize: fontSize,
    fontFamily: YAK_FONTS.title,
    color: color,
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0.5);
  container.add(text);

  let currentValue = initialValue;
  let animating = false;

  const flashGlow = () => {
    glow.clear();
    glow.fillStyle(flashColor, 0.5);
    glow.fillCircle(0, 0, 40);
    glow.setAlpha(1);

    scene.tweens.add({
      targets: glow,
      alpha: 0,
      duration: 300,
      ease: 'Power2'
    });
  };

  const setValue = (newValue: number, animate: boolean = true) => {
    if (animating) return;

    const oldValue = currentValue;
    const isMilestone = milestoneParticles && newValue > 0 && newValue % milestoneInterval === 0;
    const isIncrease = newValue > oldValue;

    if (!animate || oldValue === newValue) {
      currentValue = newValue;
      text.setText(`${prefix}${currentValue}${suffix}`);
      return;
    }

    animating = true;

    // Animate the number change
    const counter = { value: oldValue };
    scene.tweens.add({
      targets: counter,
      value: newValue,
      duration: Math.min(Math.abs(newValue - oldValue) * 50, 500),
      ease: 'Power2',
      onUpdate: () => {
        const displayValue = Math.round(counter.value);
        text.setText(`${prefix}${displayValue}${suffix}`);
      },
      onComplete: () => {
        currentValue = newValue;
        text.setText(`${prefix}${currentValue}${suffix}`);
        animating = false;

        // Pop effect
        popScale(scene, text, popScaleAmount, 100);

        // Flash effect
        if (isIncrease) {
          flashGlow();
        }

        // Milestone particles
        if (isMilestone) {
          createStarBurst(scene, x, y, {
            points: 6,
            colors: [flashColor, 0xffffff],
            outerRadius: 80,
            duration: 500
          });
        }
      }
    });
  };

  const increment = (amount: number = 1) => {
    setValue(currentValue + amount);
  };

  const decrement = (amount: number = 1) => {
    setValue(Math.max(0, currentValue - amount));
  };

  const destroy = () => {
    container.destroy(true);
  };

  return {
    container,
    text,
    get value() { return currentValue; },
    setValue,
    increment,
    decrement,
    destroy
  };
}

// ============================================
// ENHANCED MISS COUNTER
// ============================================

export interface EnhancedMissCounterConfig {
  showIcons?: boolean;
  shakeOnAdd?: boolean;
  pulseRed?: boolean;
  maxDisplay?: number;
  iconEmoji?: string;
}

export interface EnhancedMissCounterInstance {
  container: Phaser.GameObjects.Container;
  missCount: number;
  addMiss: () => void;
  reset: () => void;
  destroy: () => void;
}

/**
 * Creates enhanced miss counter with visual icons, shake, and pulse effects
 */
export function createEnhancedMissCounter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string = 'Misses',
  config: EnhancedMissCounterConfig = {}
): EnhancedMissCounterInstance {
  const {
    showIcons = true,
    shakeOnAdd = true,
    pulseRed = true,
    maxDisplay = 5,
    iconEmoji = '❌'
  } = config;

  const container = scene.add.container(x, y);
  container.setDepth(100);

  // Label
  const labelText = scene.add.text(0, 0, `${label}: `, {
    fontSize: '16px',
    fontFamily: YAK_FONTS.body,
    color: '#ffcdd2',
    stroke: '#000000',
    strokeThickness: 2
  }).setOrigin(0.5, 0.5);
  container.add(labelText);

  // Counter text
  const counterText = scene.add.text(labelText.width / 2 + 15, 0, '0', {
    fontSize: '18px',
    fontFamily: YAK_FONTS.title,
    color: '#ef4444',
    stroke: '#000000',
    strokeThickness: 3
  }).setOrigin(0, 0.5);
  container.add(counterText);

  // Icons container
  const iconsContainer = scene.add.container(0, 25);
  container.add(iconsContainer);

  const icons: Phaser.GameObjects.Text[] = [];
  let missCount = 0;

  const addMiss = () => {
    missCount++;
    counterText.setText(String(missCount));

    // Shake effect
    if (shakeOnAdd) {
      objectShake(scene, container, 1, 200);
    }

    // Pulse red effect
    if (pulseRed) {
      const originalColor = counterText.style.color;
      counterText.setColor('#ff0000');
      scene.tweens.add({
        targets: counterText,
        scale: 1.3,
        duration: 100,
        yoyo: true,
        onComplete: () => {
          counterText.setColor(originalColor as string);
        }
      });
    }

    // Add icon
    if (showIcons && icons.length < maxDisplay) {
      const iconX = (icons.length - (Math.min(missCount, maxDisplay) - 1) / 2) * 25;
      const icon = scene.add.text(iconX, 0, iconEmoji, {
        fontSize: '16px'
      }).setOrigin(0.5).setScale(0).setAlpha(0);

      iconsContainer.add(icon);
      icons.push(icon);

      // Animate icon entrance with shake
      scene.tweens.add({
        targets: icon,
        scale: 1,
        alpha: 1,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          // Shake the icon
          objectShake(scene, icon, 0.8, 150);
        }
      });

      // Reposition existing icons
      icons.forEach((ic, idx) => {
        const newX = (idx - (icons.length - 1) / 2) * 25;
        scene.tweens.add({
          targets: ic,
          x: newX,
          duration: 150,
          ease: 'Power2'
        });
      });
    } else if (showIcons && icons.length >= maxDisplay) {
      // Flash all icons red if over limit
      icons.forEach(ic => {
        scene.tweens.add({
          targets: ic,
          scale: 1.2,
          duration: 100,
          yoyo: true
        });
      });
    }
  };

  const reset = () => {
    missCount = 0;
    counterText.setText('0');

    // Remove icons with animation
    icons.forEach((icon, idx) => {
      scene.tweens.add({
        targets: icon,
        scale: 0,
        alpha: 0,
        duration: 150,
        delay: idx * 30,
        onComplete: () => icon.destroy()
      });
    });
    icons.length = 0;
  };

  const destroy = () => {
    container.destroy(true);
  };

  return {
    container,
    get missCount() { return missCount; },
    addMiss,
    reset,
    destroy
  };
}

// ============================================
// ENHANCED POWER METER
// ============================================

export interface EnhancedPowerMeterConfig {
  liquidFill?: boolean;
  glow?: boolean;
  particles?: boolean;
  shakeAtMax?: boolean;
  width?: number;
  height?: number;
  showLabel?: boolean;
}

export interface EnhancedPowerMeterInstance {
  container: Phaser.GameObjects.Container;
  update: (power: number, maxPower: number) => void;
  show: () => void;
  hide: () => void;
  destroy: () => void;
}

/**
 * Creates enhanced power meter with liquid fill, glow, particles, and shake effects
 */
export function createEnhancedPowerMeter(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: EnhancedPowerMeterConfig = {}
): EnhancedPowerMeterInstance {
  const {
    liquidFill = true,
    glow = true,
    particles = true,
    shakeAtMax = true,
    width = 200,
    height = 24,
    showLabel = true
  } = config;

  const container = scene.add.container(x, y);
  container.setDepth(150);
  container.setVisible(false);
  container.setAlpha(0);

  // Outer glow (for high power)
  const outerGlow = scene.add.graphics();
  outerGlow.setAlpha(0);
  container.add(outerGlow);

  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(0x1a1a1a, 0.9);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
  bg.lineStyle(2, 0x4a5568, 1);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);
  container.add(bg);

  // Fill graphics
  const fill = scene.add.graphics();
  container.add(fill);

  // Liquid bubbles container (for liquid effect)
  const bubblesContainer = scene.add.container(0, 0);
  container.add(bubblesContainer);

  // Inner highlight
  const highlight = scene.add.graphics();
  highlight.fillStyle(0xffffff, 0.15);
  highlight.fillRoundedRect(-width / 2 + 4, -height / 2 + 2, width - 8, height / 3, 4);
  container.add(highlight);

  // Label
  if (showLabel) {
    const label = scene.add.text(0, -height / 2 - 20, 'POWER', {
      fontSize: '14px',
      fontFamily: YAK_FONTS.title,
      color: '#9ca3af'
    }).setOrigin(0.5);
    container.add(label);
  }

  // Particle emitter tracking
  const activeParticles: Phaser.GameObjects.Arc[] = [];
  let isAtMax = false;
  let wavePhase = 0;
  let lastPower = 0;

  const update = (power: number, maxPower: number) => {
    const percent = Math.min(power / maxPower, 1);
    const fillWidth = (width - 8) * percent;
    const color = getPowerColor(percent);

    lastPower = percent;

    // Clear and redraw fill
    fill.clear();

    if (fillWidth > 0) {
      // Main fill
      fill.fillStyle(color, 1);
      fill.fillRoundedRect(-width / 2 + 4, -height / 2 + 4, fillWidth, height - 8, (height - 8) / 2);

      // Liquid wave effect
      if (liquidFill && percent > 0.1) {
        wavePhase += 0.15;
        const waveHeight = 3;
        const waveCount = Math.floor(fillWidth / 20);

        fill.fillStyle(color, 0.7);
        for (let i = 0; i < waveCount; i++) {
          const waveX = -width / 2 + 4 + (i + 0.5) * 20;
          const waveY = Math.sin(wavePhase + i * 0.8) * waveHeight;
          fill.fillCircle(waveX, waveY, 4);
        }

        // Bubbles
        if (Math.random() < 0.1 * percent) {
          const bubble = scene.add.circle(
            -width / 2 + 4 + Math.random() * fillWidth,
            height / 4,
            2 + Math.random() * 2,
            0xffffff,
            0.6
          );
          bubblesContainer.add(bubble);

          scene.tweens.add({
            targets: bubble,
            y: -height / 4,
            alpha: 0,
            duration: 500 + Math.random() * 300,
            ease: 'Power1',
            onComplete: () => bubble.destroy()
          });
        }
      }
    }

    // Glow effect for high power
    if (glow && percent > 0.7) {
      const glowIntensity = (percent - 0.7) / 0.3;
      outerGlow.clear();
      outerGlow.fillStyle(color, 0.3 * glowIntensity);
      outerGlow.fillRoundedRect(-width / 2 - 5, -height / 2 - 5, width + 10, height + 10, (height + 10) / 2);
      outerGlow.setAlpha(1);
    } else {
      outerGlow.setAlpha(0);
    }

    // Particles at high power
    if (particles && percent > 0.8 && Math.random() < 0.3) {
      const particle = scene.add.circle(
        -width / 2 + fillWidth + Math.random() * 10,
        (Math.random() - 0.5) * height,
        2,
        color,
        1
      );
      particle.setDepth(151);
      activeParticles.push(particle);

      scene.tweens.add({
        targets: particle,
        x: particle.x + 20 + Math.random() * 20,
        y: particle.y - 10 - Math.random() * 20,
        alpha: 0,
        scale: 0,
        duration: 300,
        onComplete: () => {
          const idx = activeParticles.indexOf(particle);
          if (idx > -1) activeParticles.splice(idx, 1);
          particle.destroy();
        }
      });
    }

    // Shake at max
    if (shakeAtMax && percent >= 1 && !isAtMax) {
      isAtMax = true;
      // Start continuous shake
      const shakeLoop = () => {
        if (isAtMax && lastPower >= 1) {
          objectShake(scene, container, 0.5, 100);
          scene.time.delayedCall(100, shakeLoop);
        }
      };
      shakeLoop();

      // Flash
      scene.tweens.add({
        targets: outerGlow,
        alpha: 1,
        duration: 50,
        yoyo: true,
        repeat: 2
      });
    } else if (percent < 1) {
      isAtMax = false;
    }
  };

  const show = () => {
    container.setVisible(true);
    scene.tweens.add({
      targets: container,
      alpha: 1,
      y: y,
      duration: 200,
      ease: 'Back.easeOut'
    });
  };

  const hide = () => {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      duration: 150,
      onComplete: () => {
        container.setVisible(false);
        fill.clear();
        outerGlow.clear();
        bubblesContainer.removeAll(true);
        activeParticles.forEach(p => p.destroy());
        activeParticles.length = 0;
      }
    });
  };

  const destroy = () => {
    activeParticles.forEach(p => p.destroy());
    container.destroy(true);
  };

  return {
    container,
    update,
    show,
    hide,
    destroy
  };
}
