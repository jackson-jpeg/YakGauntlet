import Phaser from 'phaser';

/**
 * TweenHelpers - Standardized animation presets for consistent UX
 * These helpers encapsulate common tween patterns used across scenes.
 */

/**
 * Entrance animation with bounce effect (scale from 0)
 * Great for UI elements, success indicators, and pop-up text
 */
export function entranceBounce(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  duration: number = 300,
  delay: number = 0
): Phaser.Tweens.Tween {
  return scene.tweens.add({
    targets: target,
    scale: { from: 0, to: 1 },
    duration,
    delay,
    ease: 'Back.easeOut',
  });
}

/**
 * Infinite pulse animation (scale oscillation)
 * Great for highlighting important elements, targets, or active states
 */
export function pulse(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  scale: number = 1.1,
  duration: number = 500
): Phaser.Tweens.Tween {
  return scene.tweens.add({
    targets: target,
    scale,
    duration,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}

/**
 * Fade out and destroy the target(s)
 * Great for cleanup animations on temporary elements
 */
export function fadeOutDestroy(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  duration: number = 400,
  delay: number = 0
): Phaser.Tweens.Tween {
  return scene.tweens.add({
    targets: target,
    alpha: 0,
    duration,
    delay,
    ease: 'Power2',
    onComplete: () => {
      const targets = Array.isArray(target) ? target : [target];
      targets.forEach((t) => {
        if (t && 'destroy' in t && typeof t.destroy === 'function') {
          t.destroy();
        }
      });
    },
  });
}

/**
 * Float up and fade effect for feedback text
 * Great for score popups, hit/miss indicators, and floating labels
 */
export function floatUpFade(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  yOffset: number = -80,
  duration: number = 800
): Phaser.Tweens.Tween {
  return scene.tweens.add({
    targets: target,
    y: `-=${yOffset}`,
    alpha: 0,
    duration,
    ease: 'Power2',
    onComplete: () => {
      const targets = Array.isArray(target) ? target : [target];
      targets.forEach((t) => {
        if (t && 'destroy' in t && typeof t.destroy === 'function') {
          t.destroy();
        }
      });
    },
  });
}

/**
 * Shake animation for fail/error feedback
 * Horizontal shake effect that returns to original position
 */
export function shake(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  intensity: number = 5,
  duration: number = 50,
  repeats: number = 3
): Phaser.Tweens.Tween {
  return scene.tweens.add({
    targets: target,
    x: `+=${intensity}`,
    duration,
    yoyo: true,
    repeat: repeats,
    ease: 'Sine.easeInOut',
  });
}

/**
 * Slide in from direction
 * Great for UI panels, menus, and content transitions
 */
export function slideIn(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  from: 'left' | 'right' | 'top' | 'bottom',
  distance: number = 100,
  duration: number = 400,
  delay: number = 0
): Phaser.Tweens.Tween {
  const property = from === 'left' || from === 'right' ? 'x' : 'y';
  const offset = from === 'left' || from === 'top' ? -distance : distance;

  return scene.tweens.add({
    targets: target,
    [property]: `-=${offset}`,
    duration,
    delay,
    ease: 'Back.easeOut',
  });
}

/**
 * Spin animation (full rotation)
 * Great for loading indicators, success celebrations
 */
export function spin(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  rotations: number = 1,
  duration: number = 500,
  repeat: number = 0
): Phaser.Tweens.Tween {
  return scene.tweens.add({
    targets: target,
    rotation: `+=${Math.PI * 2 * rotations}`,
    duration,
    repeat,
    ease: 'Linear',
  });
}

/**
 * Breathing effect (subtle scale oscillation)
 * Great for idle animations on characters or interactive elements
 */
export function breathe(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[],
  scaleRange: number = 0.03,
  duration: number = 2000
): Phaser.Tweens.Tween {
  return scene.tweens.add({
    targets: target,
    scaleX: `+=${scaleRange}`,
    scaleY: `+=${scaleRange}`,
    duration,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });
}
