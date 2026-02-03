import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS, GAUNTLET_COLORS } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { AudioSystem } from './AudioSystem';
import { createStarBurst, createMegaConfetti, createFirework, createRingBurst, createVictoryRays } from './VisualEffects';
import { zoomPunch, colorFlash, slowMotion, vignettePulse } from './ScreenEffects';
import { popScale, objectShake, slamIn } from './JuiceFactory';

/**
 * Configuration for creating rounded rectangle panels
 */
export interface PanelConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
  fillColor?: number;
  fillAlpha?: number;
  strokeColor?: number;
  strokeWidth?: number;
}

/**
 * Creates a rounded rectangle panel with optional stroke
 */
export function createPanel(
  scene: Phaser.Scene,
  config: PanelConfig
): Phaser.GameObjects.Graphics {
  const {
    x,
    y,
    width,
    height,
    radius = 12,
    fillColor = 0x000000,
    fillAlpha = 0.7,
    strokeColor,
    strokeWidth = 2,
  } = config;

  const graphics = scene.add.graphics();

  // Fill
  graphics.fillStyle(fillColor, fillAlpha);
  graphics.fillRoundedRect(x, y, width, height, radius);

  // Stroke (optional)
  if (strokeColor !== undefined) {
    graphics.lineStyle(strokeWidth, strokeColor, 1);
    graphics.strokeRoundedRect(x, y, width, height, radius);
  }

  return graphics;
}

export interface SceneUI {
  timerText: Phaser.GameObjects.Text;
  stationBadge: Phaser.GameObjects.Container;
  progressText: Phaser.GameObjects.Text;
  missText: Phaser.GameObjects.Text;
}

/**
 * Creates consistent UI header across all game scenes
 */
export function createSceneUI(
  scene: Phaser.Scene,
  stationIndex: number,
  missLabel: string = 'Misses'
): SceneUI {
  const station = STATIONS[stationIndex];
  const totalStations = STATIONS.length;

  // === TOP BAR BACKGROUND ===
  const topBar = scene.add.graphics();
  topBar.fillStyle(0x000000, 0.7);
  topBar.fillRect(0, 0, GAME_WIDTH, 130);
  topBar.setDepth(90);

  // === STATION BADGE (top left) ===
  const stationBadge = scene.add.container(60, 35);
  stationBadge.setDepth(100);

  // Badge background
  const badgeBg = scene.add.graphics();
  badgeBg.fillStyle(station.color, 1);
  badgeBg.fillRoundedRect(-50, -18, 100, 36, 10);
  badgeBg.lineStyle(2, 0xffffff, 0.3);
  badgeBg.strokeRoundedRect(-50, -18, 100, 36, 10);
  stationBadge.add(badgeBg);

  // Badge text
  const badgeText = scene.add.text(0, 0, station.name, {
    fontSize: '16px',
    fontFamily: YAK_FONTS.title,
    color: '#ffffff',
  }).setOrigin(0.5);
  stationBadge.add(badgeText);

  // === PROGRESS INDICATOR (top right) ===
  const progressContainer = scene.add.container(GAME_WIDTH - 60, 35);
  progressContainer.setDepth(100);

  // Progress dots
  for (let i = 0; i < totalStations; i++) {
    const dotX = (i - (totalStations - 1) / 2) * 18;
    const isCompleted = i < stationIndex;
    const isCurrent = i === stationIndex;

    const dot = scene.add.circle(dotX, 0, 6,
      isCurrent ? YAK_COLORS.secondary :
      isCompleted ? YAK_COLORS.success : 0x4a5568
    );

    if (isCurrent) {
      dot.setStrokeStyle(2, 0xffffff);
      scene.tweens.add({
        targets: dot,
        scale: 1.3,
        duration: 500,
        yoyo: true,
        repeat: -1,
      });
    }

    progressContainer.add(dot);
  }

  // Progress text below dots
  const progressText = scene.add.text(0, 20, `${stationIndex + 1}/${totalStations}`, {
    fontSize: '14px',
    fontFamily: YAK_FONTS.title,
    color: '#9ca3af',
  }).setOrigin(0.5);
  progressContainer.add(progressText);

  // === TIMER (center) ===
  const timerBg = scene.add.graphics();
  timerBg.fillStyle(YAK_COLORS.primary, 0.9);
  timerBg.fillRoundedRect(GAME_WIDTH / 2 - 90, 55, 180, 65, 12);
  timerBg.lineStyle(3, YAK_COLORS.secondary, 0.8);
  timerBg.strokeRoundedRect(GAME_WIDTH / 2 - 90, 55, 180, 65, 12);
  timerBg.setDepth(95);

  const timerText = scene.add.text(GAME_WIDTH / 2, 88, '0.00', {
    fontSize: '44px',
    fontFamily: YAK_FONTS.title,
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 2,
  }).setOrigin(0.5).setDepth(100);

  // === MISS COUNTER (below timer) ===
  const missText = scene.add.text(GAME_WIDTH / 2, 135, `${missLabel}: 0`, {
    fontSize: '14px',
    fontFamily: YAK_FONTS.body,
    color: '#ffcdd2',
    stroke: '#000000',
    strokeThickness: 2,
  }).setOrigin(0.5).setDepth(100);

  return {
    timerText,
    stationBadge,
    progressText,
    missText,
  };
}

// Track last tick time for sound throttling
let lastUrgentTickTime = 0;

// Timer pressure visual state tracking
interface TimerPressureState {
  urgencyVignette: { update: (urgency: number) => void; destroy: () => void } | null;
  edgePulse: { start: () => void; stop: () => void; destroy: () => void } | null;
  lastStage: 'normal' | 'yellow' | 'orange' | 'red';
  backgroundDesaturated: boolean;
}

const timerPressureStates: Map<Phaser.Scene, TimerPressureState> = new Map();

/**
 * Timer visual escalation stages
 * | Time    | Color  | Effects                                           |
 * |---------|--------|---------------------------------------------------|
 * | 0-60s   | White  | Normal                                            |
 * | 60-70s  | Yellow | Subtle pulse (scale 1.02)                         |
 * | 70-73s  | Orange | Faster pulse, background glow starts              |
 * | 73s+    | Red    | Aggressive pulse, vignette, edge glow, tick sound |
 */
export function getTimerStyle(elapsedMs: number): {
  color: string;
  pulse: boolean;
  aggressive: boolean;
  stage: 'normal' | 'yellow' | 'orange' | 'red';
  urgency: number; // 0-1 scale
} {
  if (elapsedMs >= 73000) {
    return { color: '#ff3333', pulse: true, aggressive: true, stage: 'red', urgency: 1 };
  }
  if (elapsedMs >= 70000) {
    const urgency = (elapsedMs - 70000) / 3000; // 0-1 over 3 seconds
    return { color: '#ff6600', pulse: true, aggressive: false, stage: 'orange', urgency: 0.5 + urgency * 0.5 };
  }
  if (elapsedMs >= 60000) {
    const urgency = (elapsedMs - 60000) / 10000; // 0-1 over 10 seconds
    return { color: '#ffcc00', pulse: false, aggressive: false, stage: 'yellow', urgency: urgency * 0.5 };
  }
  return { color: '#ffffff', pulse: false, aggressive: false, stage: 'normal', urgency: 0 };
}

/**
 * Initialize timer pressure visuals for a scene
 */
export function initTimerPressureVisuals(scene: Phaser.Scene): void {
  // Clean up any existing state
  cleanupTimerPressureVisuals(scene);

  timerPressureStates.set(scene, {
    urgencyVignette: null,
    edgePulse: null,
    lastStage: 'normal',
    backgroundDesaturated: false
  });
}

/**
 * Clean up timer pressure visuals when leaving a scene
 */
export function cleanupTimerPressureVisuals(scene: Phaser.Scene): void {
  const state = timerPressureStates.get(scene);
  if (state) {
    state.urgencyVignette?.destroy();
    state.edgePulse?.destroy();
    timerPressureStates.delete(scene);
  }
}

/**
 * Updates the timer display with enhanced time warnings and visual escalation
 */
export function updateTimer(timerText: Phaser.GameObjects.Text, scene?: Phaser.Scene): void {
  const state = GameStateService.getState();
  if (state && state.startTimeMs > 0) {
    const timeMs = GameStateService.getCurrentTimeMs();
    timerText.setText((timeMs / 1000).toFixed(2));

    const style = getTimerStyle(timeMs);
    timerText.setColor(style.color);

    // Get pressure state for this scene
    const pressureState = scene ? timerPressureStates.get(scene) : null;

    // Handle stage transitions
    if (pressureState && scene && style.stage !== pressureState.lastStage) {
      handleTimerStageTransition(scene, pressureState, pressureState.lastStage, style.stage);
      pressureState.lastStage = style.stage;
    }

    // Update urgency vignette
    if (pressureState?.urgencyVignette) {
      pressureState.urgencyVignette.update(style.urgency);
    }

    if (style.aggressive) {
      // Aggressive red pulse for 73s+
      const pulseAmount = Math.sin(Date.now() / 80) * 0.12;
      timerText.setScale(1 + pulseAmount);

      // Shake timer text occasionally
      if (Math.random() < 0.05) {
        shakeTimer(timerText, 0.5);
      }

      // Play urgent tick sound (throttled to prevent audio spam)
      const now = Date.now();
      if (now - lastUrgentTickTime > 500) {
        AudioSystem.playUrgentTick();
        lastUrgentTickTime = now;
      }
    } else if (style.stage === 'orange') {
      // Faster orange pulse for 70s-73s
      const pulseAmount = Math.sin(Date.now() / 100) * 0.08;
      timerText.setScale(1 + pulseAmount);
    } else if (style.stage === 'yellow') {
      // Subtle yellow pulse for 60s-70s
      const pulseAmount = Math.sin(Date.now() / 200) * 0.03;
      timerText.setScale(1 + pulseAmount);
    } else {
      timerText.setScale(1);
    }
  }
}

/**
 * Handle visual transitions between timer stages
 */
function handleTimerStageTransition(
  scene: Phaser.Scene,
  pressureState: TimerPressureState,
  fromStage: string,
  toStage: string
): void {
  // Transitioning to yellow (60s)
  if (toStage === 'yellow' && fromStage === 'normal') {
    // Subtle flash to indicate time warning
    colorFlash(scene, GAUNTLET_COLORS.timerYellow, 'edges', { intensity: 0.2, duration: 200 });
  }

  // Transitioning to orange (70s)
  if (toStage === 'orange' && fromStage === 'yellow') {
    colorFlash(scene, GAUNTLET_COLORS.timerOrange, 'edges', { intensity: 0.4, duration: 300 });

    // Start urgency vignette if not already created
    if (!pressureState.urgencyVignette) {
      pressureState.urgencyVignette = createUrgencyVignette(scene);
    }
  }

  // Transitioning to red (73s)
  if (toStage === 'red' && fromStage === 'orange') {
    colorFlash(scene, GAUNTLET_COLORS.timerRed, 'solid', { intensity: 0.5, duration: 200 });
    scene.cameras.main.shake(150, 0.01);

    // Start edge pulse
    if (!pressureState.edgePulse) {
      pressureState.edgePulse = createEdgePulse(scene);
    }
    pressureState.edgePulse.start();

    // Desaturate background
    if (!pressureState.backgroundDesaturated) {
      desaturateBackground(scene, 0.3);
      pressureState.backgroundDesaturated = true;
    }
  }
}

/**
 * Create pulsing urgency vignette that intensifies with time
 */
export function createUrgencyVignette(
  scene: Phaser.Scene,
  intensity: number = 0.5
): { update: (urgency: number) => void; destroy: () => void } {
  const { width, height } = scene.cameras.main;

  const vignette = scene.add.graphics();
  vignette.setDepth(950);

  let pulsePhase = 0;

  const update = (urgency: number) => {
    pulsePhase += 0.1;

    vignette.clear();

    if (urgency <= 0) return;

    // Pulsing intensity (heartbeat-like)
    const pulse = Math.sin(pulsePhase) * 0.3 + 0.7;
    const alpha = urgency * intensity * pulse;

    // Red vignette from edges
    const maxBorder = Math.max(width, height) * 0.25 * urgency;

    for (let i = 10; i >= 1; i--) {
      const ringAlpha = (alpha * (11 - i)) / 10;
      const border = (i / 10) * maxBorder;

      vignette.fillStyle(GAUNTLET_COLORS.timerRed, ringAlpha * 0.3);
      vignette.fillRect(0, 0, width, border);
      vignette.fillRect(0, height - border, width, border);
      vignette.fillRect(0, 0, border, height);
      vignette.fillRect(width - border, 0, border, height);
    }
  };

  const destroy = () => {
    vignette.destroy();
  };

  return { update, destroy };
}

/**
 * Create edge pulse effect - glowing edges that pulse like a heartbeat
 */
export function createEdgePulse(
  scene: Phaser.Scene,
  color: number = GAUNTLET_COLORS.timerRed
): { start: () => void; stop: () => void; destroy: () => void } {
  const { width, height } = scene.cameras.main;

  const edgeGraphics = scene.add.graphics();
  edgeGraphics.setDepth(945);

  let isActive = false;
  let pulseTimer: Phaser.Time.TimerEvent | null = null;

  const pulse = () => {
    if (!isActive) return;

    const alphaObj = { value: 0 };

    scene.tweens.add({
      targets: alphaObj,
      value: 0.8,
      duration: 150,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        edgeGraphics.clear();
        edgeGraphics.lineStyle(4, color, alphaObj.value);
        edgeGraphics.strokeRect(2, 2, width - 4, height - 4);
      },
      onComplete: () => {
        scene.tweens.add({
          targets: alphaObj,
          value: 0,
          duration: 300,
          ease: 'Power2.easeIn',
          onUpdate: () => {
            edgeGraphics.clear();
            edgeGraphics.lineStyle(4, color, alphaObj.value);
            edgeGraphics.strokeRect(2, 2, width - 4, height - 4);
          }
        });
      }
    });
  };

  const start = () => {
    if (isActive) return;
    isActive = true;

    // Heartbeat pattern: quick-quick-pause
    const heartbeat = () => {
      if (!isActive) return;
      pulse();
      scene.time.delayedCall(200, () => {
        if (isActive) pulse();
      });
    };

    pulseTimer = scene.time.addEvent({
      delay: 1000,
      callback: heartbeat,
      loop: true
    });

    heartbeat(); // Start immediately
  };

  const stop = () => {
    isActive = false;
    if (pulseTimer) {
      pulseTimer.remove();
      pulseTimer = null;
    }
    edgeGraphics.clear();
  };

  const destroy = () => {
    stop();
    edgeGraphics.destroy();
  };

  return { start, stop, destroy };
}

/**
 * Shake the timer text for urgency
 */
export function shakeTimer(timerText: Phaser.GameObjects.Text, intensity: number = 1): void {
  const originalX = timerText.x;
  const originalY = timerText.y;
  const shakeAmount = 3 * intensity;

  const scene = timerText.scene;
  const steps = 6;

  for (let i = 0; i < steps; i++) {
    const decay = 1 - (i / steps);
    scene.time.delayedCall(i * 25, () => {
      timerText.x = originalX + (Math.random() - 0.5) * shakeAmount * 2 * decay;
      timerText.y = originalY + (Math.random() - 0.5) * shakeAmount * decay;
    });
  }

  scene.time.delayedCall(steps * 25, () => {
    timerText.x = originalX;
    timerText.y = originalY;
  });
}

/**
 * Apply desaturation effect to background (overlay method)
 */
export function desaturateBackground(scene: Phaser.Scene, amount: number = 0.3): Phaser.GameObjects.Rectangle {
  const { width, height } = scene.cameras.main;

  // Create a gray overlay to simulate desaturation
  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x808080, 0);
  overlay.setDepth(5); // Behind UI but above background
  overlay.setBlendMode(Phaser.BlendModes.SATURATION);

  // Fade in the desaturation
  scene.tweens.add({
    targets: overlay,
    alpha: amount,
    duration: 500,
    ease: 'Power2'
  });

  return overlay;
}

/**
 * Success tier types for different celebration levels
 */
export type SuccessTier = 'normal' | 'perfect' | 'legendary';

/**
 * Creates the success celebration effect with tiered animations
 *
 * Normal Success: Screen flash, camera shake, confetti, text slam, ripples
 * Perfect Success (no misses): + Slow-mo, star burst, rainbow shimmer, extra confetti
 * Legendary Success (record time): + Full gold flash, LEGENDARY stamp, fireworks, zoom punch
 */
export function showSuccessEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  onComplete?: () => void,
  tier: SuccessTier = 'normal'
): void {
  const centerX = GAME_WIDTH / 2;

  // === TIER-SPECIFIC SCREEN EFFECTS ===
  if (tier === 'legendary') {
    // Full screen gold flash
    colorFlash(scene, 0xffd700, 'radial', { intensity: 0.9, duration: 400 });
    zoomPunch(scene, 1.08, 200);
    slowMotion(scene, 0.3, 500);

    // Victory rays
    createVictoryRays(scene, centerX, y);

    // Fireworks
    scene.time.delayedCall(200, () => createFirework(scene, centerX - 100, y - 50));
    scene.time.delayedCall(400, () => createFirework(scene, centerX + 100, y - 30));
    scene.time.delayedCall(600, () => createFirework(scene, centerX, y - 80));
  } else if (tier === 'perfect') {
    colorFlash(scene, YAK_COLORS.success, 'solid', { intensity: 0.6, duration: 300 });
    slowMotion(scene, 0.5, 300);

    // Star burst
    createStarBurst(scene, x, y, { points: 12, colors: [YAK_COLORS.secondary, 0xffffff, YAK_COLORS.success] });
  } else {
    // Normal success
    scene.cameras.main.flash(400, 100, 255, 100);
    scene.cameras.main.shake(100, 0.008);
  }

  // === RIPPLE EFFECTS (all tiers) ===
  const rippleCount = tier === 'legendary' ? 5 : tier === 'perfect' ? 4 : 3;
  for (let i = 0; i < rippleCount; i++) {
    const ripple = scene.add.circle(x, y, 20, 0x4ade80, 0);
    ripple.setStrokeStyle(4, tier === 'legendary' ? 0xffd700 : 0x4ade80, 0.6).setDepth(199);
    scene.tweens.add({
      targets: ripple,
      radius: 150 + i * 50,
      alpha: 0,
      duration: 600 + i * 100,
      delay: i * 100,
      ease: 'Power2',
      onComplete: () => ripple.destroy()
    });
  }

  // === CONFETTI (scaled by tier) ===
  const confettiCount = tier === 'legendary' ? 100 : tier === 'perfect' ? 70 : 40;
  createMegaConfetti(scene, x, y, {
    count: confettiCount,
    includeStars: tier !== 'normal',
    includeRibbons: tier === 'legendary',
    gravity: true,
    spin: true,
    spread: tier === 'legendary' ? 400 : 300
  });

  // Extra confetti layer for perfect/legendary
  if (tier !== 'normal') {
    scene.time.delayedCall(200, () => {
      createMegaConfetti(scene, x, y - 50, {
        count: confettiCount / 2,
        includeStars: true,
        gravity: true
      });
    });
  }

  // Ring burst for legendary
  if (tier === 'legendary') {
    createRingBurst(scene, x, y, { count: 6, colors: [0xffd700, 0xffffff, YAK_COLORS.secondary] });
  }

  // === SUCCESS TEXT ===
  const textColor = tier === 'legendary' ? '#ffd700' : '#4ade80';
  const fontSize = tier === 'legendary' ? '90px' : '80px';

  const text = scene.add.text(centerX, y - 50, message, {
    fontSize: fontSize,
    fontFamily: YAK_FONTS.title,
    color: textColor,
    stroke: '#000000',
    strokeThickness: 10,
    shadow: {
      offsetX: 0,
      offsetY: 0,
      color: textColor,
      blur: 20,
      stroke: true,
      fill: true
    }
  }).setOrigin(0.5).setDepth(250).setScale(0);

  // Text glow effect
  const glow = scene.add.text(centerX, y - 50, message, {
    fontSize: fontSize,
    fontFamily: YAK_FONTS.title,
    color: textColor,
  }).setOrigin(0.5).setDepth(249).setScale(0).setAlpha(0.3);

  // Slam in animation
  slamIn(scene, text, 'top', { duration: 300, distance: 200 });
  slamIn(scene, glow, 'top', { duration: 300, distance: 200 });

  scene.time.delayedCall(300, () => {
    // Pulse animation
    scene.tweens.add({
      targets: text,
      scale: tier === 'legendary' ? 1.2 : 1.15,
      duration: 400,
      yoyo: true,
      repeat: tier === 'legendary' ? 2 : 1,
      ease: 'Sine.easeInOut'
    });

    // Rainbow shimmer for perfect/legendary
    if (tier !== 'normal') {
      const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'];
      let colorIndex = 0;
      const shimmerTimer = scene.time.addEvent({
        delay: 80,
        callback: () => {
          colorIndex = (colorIndex + 1) % colors.length;
          text.setColor(colors[colorIndex]);
        },
        repeat: tier === 'legendary' ? 25 : 15
      });

      scene.time.delayedCall(tier === 'legendary' ? 2000 : 1200, () => {
        shimmerTimer.remove();
        text.setColor(textColor);
      });
    }
  });

  // === LEGENDARY STAMP ===
  if (tier === 'legendary') {
    scene.time.delayedCall(500, () => {
      const stamp = scene.add.text(centerX, y + 40, '★ LEGENDARY ★', {
        fontSize: '36px',
        fontFamily: YAK_FONTS.title,
        color: '#ffd700',
        stroke: '#000000',
        strokeThickness: 6
      }).setOrigin(0.5).setDepth(251).setScale(3).setAlpha(0).setAngle(-10);

      scene.tweens.add({
        targets: stamp,
        scale: 1,
        alpha: 1,
        duration: 200,
        ease: 'Back.easeOut',
        onComplete: () => {
          scene.cameras.main.shake(80, 0.015);
          popScale(scene, stamp, 1.1, 100);
        }
      });
    });
  }

  // Cleanup and callback
  const cleanupDelay = tier === 'legendary' ? 2500 : tier === 'perfect' ? 1800 : 1200;
  scene.time.delayedCall(cleanupDelay, () => {
    scene.tweens.add({
      targets: [text, glow],
      alpha: 0,
      y: text.y - 50,
      duration: 400,
      onComplete: () => {
        text.destroy();
        glow.destroy();
        if (onComplete) onComplete();
      }
    });
  });
}

/**
 * Fail type for different feedback levels
 */
export type FailType = 'miss' | 'blocked' | 'close';

/**
 * Creates the fail/miss effect with tiered feedback
 *
 * Miss (complete whiff): Red flash, camera shake, dust poof, text wobble
 * Blocked/Saved: Orange flash, impact sparks, "DENIED" text slam, quick zoom on blocker
 * Close (almost made it): Yellow flash, "ALMOST!" with bounce, encouraging particles
 */
export function showFailEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  failType: FailType = 'miss'
): void {
  // === TYPE-SPECIFIC SCREEN EFFECTS ===
  switch (failType) {
    case 'blocked':
      // Orange flash and bigger shake
      colorFlash(scene, 0xff8800, 'edges', { intensity: 0.5, duration: 200 });
      scene.cameras.main.shake(150, 0.015);
      zoomPunch(scene, 1.03, 100);

      // Impact sparks (directional spray)
      for (let i = 0; i < 20; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2; // Spray upward
        const speed = 50 + Math.random() * 80;
        const spark = scene.add.circle(x, y, 3 + Math.random() * 2, 0xffaa00, 1).setDepth(200);

        scene.tweens.add({
          targets: spark,
          x: x + Math.cos(angle) * speed,
          y: y + Math.sin(angle) * speed,
          alpha: 0,
          scale: 0.2,
          duration: 300 + Math.random() * 150,
          ease: 'Power2.easeOut',
          onComplete: () => spark.destroy()
        });
      }
      break;

    case 'close':
      // Yellow flash, gentler feedback
      colorFlash(scene, YAK_COLORS.warning, 'solid', { intensity: 0.3, duration: 150 });
      scene.cameras.main.shake(80, 0.005);

      // Encouraging sparkle particles
      for (let i = 0; i < 12; i++) {
        const sparkle = scene.add.star(
          x + (Math.random() - 0.5) * 60,
          y + (Math.random() - 0.5) * 60,
          4, 3, 6, YAK_COLORS.warning, 0.8
        ).setDepth(199);

        scene.tweens.add({
          targets: sparkle,
          y: sparkle.y - 30 - Math.random() * 30,
          alpha: 0,
          scale: 0,
          rotation: Math.PI,
          duration: 500 + Math.random() * 200,
          ease: 'Power2.easeOut',
          onComplete: () => sparkle.destroy()
        });
      }
      break;

    case 'miss':
    default:
      // Standard miss feedback
      scene.cameras.main.shake(200, 0.015);
      colorFlash(scene, YAK_COLORS.danger, 'solid', { intensity: 0.3, duration: 150 });

      // Dust poof effect
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * i) / 8 - Math.PI / 2;
        const dust = scene.add.circle(x, y, 10 + Math.random() * 8, 0xccbbaa, 0.5).setDepth(198);

        scene.tweens.add({
          targets: dust,
          x: x + Math.cos(angle) * (40 + Math.random() * 30),
          y: y + Math.sin(angle) * 20,
          scale: 2,
          alpha: 0,
          duration: 400,
          ease: 'Power2.easeOut',
          onComplete: () => dust.destroy()
        });
      }

      // Impact particles
      for (let i = 0; i < 15; i++) {
        const particle = scene.add.circle(
          x + (Math.random() - 0.5) * 40,
          y + (Math.random() - 0.5) * 40,
          Math.random() * 4 + 2,
          0xef4444,
          0.8
        ).setDepth(199);

        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 50;

        scene.tweens.add({
          targets: particle,
          x: x + Math.cos(angle) * distance,
          y: y + Math.sin(angle) * distance,
          alpha: 0,
          scale: 0,
          duration: 400,
          ease: 'Power2',
          onComplete: () => particle.destroy()
        });
      }
      break;
  }

  // === FAIL TEXT ===
  const textColors: Record<FailType, string> = {
    miss: '#ef4444',
    blocked: '#ff8800',
    close: '#fbbf24'
  };

  const textColor = textColors[failType];
  const fontSize = failType === 'blocked' ? '64px' : '56px';

  const text = scene.add.text(x, y - 30, message, {
    fontSize: fontSize,
    fontFamily: YAK_FONTS.title,
    color: textColor,
    stroke: '#000000',
    strokeThickness: 6,
    shadow: {
      offsetX: 0,
      offsetY: 0,
      color: textColor,
      blur: 15,
      stroke: true,
      fill: true
    }
  }).setOrigin(0.5).setDepth(200).setScale(0);

  // === TYPE-SPECIFIC TEXT ANIMATION ===
  if (failType === 'blocked') {
    // Slam in from top
    slamIn(scene, text, 'top', { duration: 250, distance: 150 });

    scene.time.delayedCall(250, () => {
      // Quick shake
      objectShake(scene, text, 1.2, 200);

      // Exit after delay
      scene.time.delayedCall(600, () => {
        scene.tweens.add({
          targets: text,
          alpha: 0,
          scale: 0.8,
          duration: 300,
          onComplete: () => text.destroy()
        });
      });
    });
  } else if (failType === 'close') {
    // Bounce in
    scene.tweens.add({
      targets: text,
      scale: 1,
      duration: 300,
      ease: 'Bounce.easeOut',
      onComplete: () => {
        // Gentle bounce
        scene.tweens.add({
          targets: text,
          y: text.y - 15,
          duration: 200,
          yoyo: true,
          repeat: 1,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            scene.tweens.add({
              targets: text,
              alpha: 0,
              y: text.y - 40,
              duration: 400,
              ease: 'Power2',
              onComplete: () => text.destroy()
            });
          }
        });
      }
    });
  } else {
    // Standard miss animation with wobble
    scene.tweens.add({
      targets: text,
      scale: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Wobble effect
        scene.tweens.add({
          targets: text,
          angle: 5,
          duration: 50,
          yoyo: true,
          repeat: 3,
          ease: 'Sine.easeInOut',
          onComplete: () => {
            text.setAngle(0);
            // Exit animation
            scene.tweens.add({
              targets: text,
              y: text.y - 80,
              alpha: 0,
              scale: 1.4,
              rotation: 0.1,
              duration: 600,
              ease: 'Power2',
              onComplete: () => text.destroy()
            });
          }
        });
      }
    });
  }
}
