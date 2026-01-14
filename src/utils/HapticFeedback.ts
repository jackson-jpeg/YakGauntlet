import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS } from '../config/theme';

/**
 * Haptic-like Visual Feedback System
 * Provides visual "haptic" feedback for mobile-like feel
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';

export interface HapticConfig {
  intensity: number;
  duration: number;
  color: number;
  shake?: boolean;
  flash?: boolean;
}

const HAPTIC_PRESETS: Record<HapticType, HapticConfig> = {
  light: {
    intensity: 0.003,
    duration: 50,
    color: 0xffffff,
    shake: true,
    flash: false,
  },
  medium: {
    intensity: 0.008,
    duration: 100,
    color: 0xffffff,
    shake: true,
    flash: true,
  },
  heavy: {
    intensity: 0.015,
    duration: 150,
    color: 0xffffff,
    shake: true,
    flash: true,
  },
  success: {
    intensity: 0.005,
    duration: 100,
    color: 0x4ade80,
    shake: false,
    flash: true,
  },
  error: {
    intensity: 0.012,
    duration: 120,
    color: 0xef4444,
    shake: true,
    flash: true,
  },
};

/**
 * Trigger haptic-like visual feedback
 */
export function triggerHaptic(
  scene: Phaser.Scene,
  type: HapticType = 'medium',
  customConfig?: Partial<HapticConfig>
): void {
  const preset = HAPTIC_PRESETS[type];
  const config = { ...preset, ...customConfig };

  // Camera shake
  if (config.shake) {
    scene.cameras.main.shake(config.duration, config.intensity);
  }

  // Screen flash
  if (config.flash) {
    const [r, g, b] = [
      (config.color >> 16) & 0xff,
      (config.color >> 8) & 0xff,
      config.color & 0xff,
    ];
    scene.cameras.main.flash(config.duration, r, g, b, false, undefined, 0.2);
  }

  // Visual pulse (optional overlay)
  if (type === 'success' || type === 'error') {
    const pulse = scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      config.color,
      0
    ).setDepth(300);

    scene.tweens.add({
      targets: pulse,
      alpha: 0.1,
      duration: config.duration * 0.3,
      yoyo: true,
      onComplete: () => pulse.destroy(),
    });
  }
}

/**
 * Create a visual impact indicator (like haptic feedback)
 */
export function createImpactIndicator(
  scene: Phaser.Scene,
  x: number,
  y: number,
  type: 'hit' | 'miss' | 'success' = 'hit'
): void {
  const colors = {
    hit: 0xffffff,
    miss: 0xef4444,
    success: 0x4ade80,
  };

  const color = colors[type];
  const size = type === 'success' ? 40 : type === 'miss' ? 30 : 25;

  // Expanding circle
  const circle = scene.add.circle(x, y, 5, color, 0).setDepth(250);
  circle.setStrokeStyle(3, color, 1);

  scene.tweens.add({
    targets: circle,
    radius: size,
    alpha: 0,
    duration: 400,
    ease: 'Power2',
    onComplete: () => circle.destroy(),
  });

  // Particle burst
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8;
    const particle = scene.add.circle(x, y, 3, color, 0.8).setDepth(251);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * 30,
      y: y + Math.sin(angle) * 30,
      alpha: 0,
      scale: 0,
      duration: 300,
      ease: 'Power2',
      onComplete: () => particle.destroy(),
    });
  }
}

/**
 * Create a visual "tap" feedback
 */
export function createTapFeedback(
  scene: Phaser.Scene,
  x: number,
  y: number
): void {
  // Ripple effect
  const ripple = scene.add.circle(x, y, 10, 0xffffff, 0).setDepth(250);
  ripple.setStrokeStyle(2, 0xffffff, 0.8);

  scene.tweens.add({
    targets: ripple,
    radius: 50,
    alpha: 0,
    duration: 300,
    ease: 'Power2',
    onComplete: () => ripple.destroy(),
  });

  // Center dot
  const dot = scene.add.circle(x, y, 8, 0xffffff, 0.9).setDepth(251);

  scene.tweens.add({
    targets: dot,
    scale: 0,
    alpha: 0,
    duration: 200,
    ease: 'Power2',
    onComplete: () => dot.destroy(),
  });
}
