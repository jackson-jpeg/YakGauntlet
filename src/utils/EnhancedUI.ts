import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS, getPowerColor } from '../config/theme';
import { GameStateService } from '../services/GameStateService';

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
