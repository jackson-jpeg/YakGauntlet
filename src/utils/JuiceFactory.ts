/**
 * JuiceFactory - The core system that makes every interaction feel amazing
 * Implements squash & stretch, anticipation, follow-through, secondary motion
 */

import { YAK_COLORS } from '../config/theme';

export interface JuiceConfig {
  intensity?: number;       // 0-1, default 1
  duration?: number;        // ms
  easing?: string;         // Phaser easing function name
}

export interface TrailConfig {
  color?: number;
  glow?: boolean;
  sparkle?: number;        // 0-1 chance of sparkle
  gradient?: boolean;
  maxLength?: number;
}

/**
 * Apply squash and stretch based on velocity
 * Makes objects feel like they have mass and energy
 */
export function applyMotionJuice(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { scaleX: number; scaleY: number; setScale: (x: number, y?: number) => void },
  velocityX: number,
  velocityY: number,
  intensity: number = 1
): void {
  const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
  const maxStretch = 0.3 * intensity;
  const stretchFactor = Math.min(speed / 30, maxStretch);

  // Calculate stretch direction based on velocity
  const angle = Math.atan2(velocityY, velocityX);
  const stretchX = 1 + stretchFactor * Math.abs(Math.cos(angle));
  const stretchY = 1 - stretchFactor * 0.5 * Math.abs(Math.sin(angle));

  // Apply scale - maintain volume (squash one axis, stretch the other)
  const volumeCorrection = 1 / Math.sqrt(stretchX * stretchY);
  obj.setScale(stretchX * volumeCorrection, stretchY * volumeCorrection);
}

/**
 * Wind-up animation before an action (anticipation)
 * Creates a brief pullback before the main motion
 */
export function windUp(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { x: number; y: number; scaleX: number; scaleY: number },
  directionX: number,
  directionY: number,
  callback: () => void,
  config: JuiceConfig = {}
): Phaser.Tweens.Tween {
  const { intensity = 1, duration = 150 } = config;

  const pullbackX = -directionX * 10 * intensity;
  const pullbackY = -directionY * 5 * intensity;
  const originalX = obj.x;
  const originalY = obj.y;
  const originalScaleX = obj.scaleX;
  const originalScaleY = obj.scaleY;

  return scene.tweens.add({
    targets: obj,
    x: originalX + pullbackX,
    y: originalY + pullbackY,
    scaleX: originalScaleX * (1 - 0.1 * intensity),
    scaleY: originalScaleY * (1 + 0.15 * intensity),
    duration: duration,
    ease: 'Back.easeIn',
    onComplete: () => {
      // Quick snap back
      scene.tweens.add({
        targets: obj,
        x: originalX,
        y: originalY,
        scaleX: originalScaleX,
        scaleY: originalScaleY,
        duration: 50,
        ease: 'Power2',
        onComplete: callback
      });
    }
  });
}

/**
 * Impact squash effect for landings and collisions
 * Object squashes flat then rebounds
 */
export function impactJuice(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { scaleX: number; scaleY: number },
  intensity: number = 1,
  config: JuiceConfig = {}
): Phaser.Tweens.Tween {
  const { duration = 200 } = config;
  const originalScaleX = obj.scaleX;
  const originalScaleY = obj.scaleY;

  // Squash on impact
  const squashX = originalScaleX * (1 + 0.3 * intensity);
  const squashY = originalScaleY * (1 - 0.25 * intensity);

  return scene.tweens.add({
    targets: obj,
    scaleX: squashX,
    scaleY: squashY,
    duration: duration * 0.3,
    ease: 'Power2',
    yoyo: true,
    onYoyo: () => {
      // Overshoot then settle
      scene.tweens.add({
        targets: obj,
        scaleX: originalScaleX * (1 - 0.05 * intensity),
        scaleY: originalScaleY * (1 + 0.08 * intensity),
        duration: duration * 0.3,
        ease: 'Bounce.easeOut',
        onComplete: () => {
          scene.tweens.add({
            targets: obj,
            scaleX: originalScaleX,
            scaleY: originalScaleY,
            duration: duration * 0.4,
            ease: 'Power1'
          });
        }
      });
    }
  });
}

/**
 * Satisfying button press feedback
 * Scale down, color flash, then bounce back
 */
export function buttonPress(
  scene: Phaser.Scene,
  btn: Phaser.GameObjects.Container | Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image,
  callback: () => void,
  config: JuiceConfig = {}
): Phaser.Tweens.Tween {
  const { intensity = 1, duration = 150 } = config;
  const originalScaleX = btn.scaleX;
  const originalScaleY = btn.scaleY;

  return scene.tweens.add({
    targets: btn,
    scaleX: originalScaleX * (1 - 0.15 * intensity),
    scaleY: originalScaleY * (1 - 0.1 * intensity),
    duration: duration * 0.3,
    ease: 'Power2',
    onComplete: () => {
      // Bounce back with overshoot
      scene.tweens.add({
        targets: btn,
        scaleX: originalScaleX * (1 + 0.1 * intensity),
        scaleY: originalScaleY * (1 + 0.1 * intensity),
        duration: duration * 0.3,
        ease: 'Back.easeOut',
        onComplete: () => {
          scene.tweens.add({
            targets: btn,
            scaleX: originalScaleX,
            scaleY: originalScaleY,
            duration: duration * 0.4,
            ease: 'Power1',
            onComplete: callback
          });
        }
      });
    }
  });
}

/**
 * Animate a number counting up/down
 * Creates satisfying tick-up counter effect
 */
export function animateNumber(
  scene: Phaser.Scene,
  textObj: Phaser.GameObjects.Text,
  from: number,
  to: number,
  config: JuiceConfig & {
    prefix?: string;
    suffix?: string;
    onUpdate?: (value: number) => void;
    popOnComplete?: boolean;
  } = {}
): Phaser.Tweens.Tween {
  const {
    duration = 500,
    prefix = '',
    suffix = '',
    onUpdate,
    popOnComplete = true
  } = config;

  const counter = { value: from };

  return scene.tweens.add({
    targets: counter,
    value: to,
    duration: duration,
    ease: 'Power2',
    onUpdate: () => {
      const current = Math.round(counter.value);
      textObj.setText(`${prefix}${current}${suffix}`);
      onUpdate?.(current);
    },
    onComplete: () => {
      textObj.setText(`${prefix}${to}${suffix}`);
      if (popOnComplete) {
        popScale(scene, textObj, 1.2, 100);
      }
    }
  });
}

/**
 * Quick scale pop effect
 */
export function popScale(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { scaleX: number; scaleY: number },
  targetScale: number = 1.2,
  duration: number = 100
): Phaser.Tweens.Tween {
  const originalScaleX = obj.scaleX;
  const originalScaleY = obj.scaleY;

  return scene.tweens.add({
    targets: obj,
    scaleX: originalScaleX * targetScale,
    scaleY: originalScaleY * targetScale,
    duration: duration,
    ease: 'Back.easeOut',
    yoyo: true
  });
}

/**
 * Shake an individual object
 * Different from camera shake - this shakes just one object
 */
export function objectShake(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { x: number; y: number },
  intensity: number = 1,
  duration: number = 200
): void {
  const originalX = obj.x;
  const originalY = obj.y;
  const shakeAmount = 5 * intensity;
  const steps = Math.floor(duration / 30);

  for (let i = 0; i < steps; i++) {
    const decay = 1 - (i / steps);
    scene.time.delayedCall(i * 30, () => {
      obj.x = originalX + (Math.random() - 0.5) * shakeAmount * 2 * decay;
      obj.y = originalY + (Math.random() - 0.5) * shakeAmount * 2 * decay;
    });
  }

  // Ensure we return to original position
  scene.time.delayedCall(duration, () => {
    obj.x = originalX;
    obj.y = originalY;
  });
}

/**
 * Pop in entrance animation
 * Scale from 0 to 1.2 to 1 with bounce
 */
export function popIn(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { scaleX: number; scaleY: number; setScale: (x: number, y?: number) => void; alpha: number; setAlpha: (a: number) => void },
  config: JuiceConfig & { targetScale?: number; delay?: number } = {}
): Phaser.Tweens.Tween {
  const { duration = 300, targetScale = 1, delay = 0 } = config;

  obj.setScale(0);
  obj.setAlpha(0);

  return scene.tweens.add({
    targets: obj,
    scaleX: targetScale * 1.2,
    scaleY: targetScale * 1.2,
    alpha: 1,
    duration: duration * 0.6,
    delay: delay,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: obj,
        scaleX: targetScale,
        scaleY: targetScale,
        duration: duration * 0.4,
        ease: 'Power2'
      });
    }
  });
}

/**
 * Pop out exit animation
 * Scale from 1 to 1.1 to 0 with callback
 */
export function popOut(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { scaleX: number; scaleY: number; alpha: number },
  callback?: () => void,
  config: JuiceConfig = {}
): Phaser.Tweens.Tween {
  const { duration = 250 } = config;
  const originalScaleX = obj.scaleX;
  const originalScaleY = obj.scaleY;

  return scene.tweens.add({
    targets: obj,
    scaleX: originalScaleX * 1.1,
    scaleY: originalScaleY * 1.1,
    duration: duration * 0.3,
    ease: 'Power2',
    onComplete: () => {
      scene.tweens.add({
        targets: obj,
        scaleX: 0,
        scaleY: 0,
        alpha: 0,
        duration: duration * 0.7,
        ease: 'Back.easeIn',
        onComplete: callback
      });
    }
  });
}

/**
 * Slam in from direction (top, bottom, left, right)
 * Object flies in with overshoot
 */
export function slamIn(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { x: number; y: number; alpha: number; setAlpha: (a: number) => void },
  direction: 'top' | 'bottom' | 'left' | 'right',
  config: JuiceConfig & { delay?: number; distance?: number } = {}
): Phaser.Tweens.Tween {
  const { duration = 400, delay = 0, distance = 200 } = config;
  const targetX = obj.x;
  const targetY = obj.y;

  // Set starting position based on direction
  switch (direction) {
    case 'top':
      obj.y = targetY - distance;
      break;
    case 'bottom':
      obj.y = targetY + distance;
      break;
    case 'left':
      obj.x = targetX - distance;
      break;
    case 'right':
      obj.x = targetX + distance;
      break;
  }

  obj.setAlpha(0);

  return scene.tweens.add({
    targets: obj,
    x: targetX,
    y: targetY,
    alpha: 1,
    duration: duration,
    delay: delay,
    ease: 'Back.easeOut'
  });
}

/**
 * Slide in with elastic overshoot
 */
export function slideIn(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { x: number; y: number; alpha: number; setAlpha: (a: number) => void },
  direction: 'top' | 'bottom' | 'left' | 'right',
  config: JuiceConfig & { delay?: number; distance?: number } = {}
): Phaser.Tweens.Tween {
  const { duration = 500, delay = 0, distance = 300 } = config;
  const targetX = obj.x;
  const targetY = obj.y;

  switch (direction) {
    case 'top':
      obj.y = targetY - distance;
      break;
    case 'bottom':
      obj.y = targetY + distance;
      break;
    case 'left':
      obj.x = targetX - distance;
      break;
    case 'right':
      obj.x = targetX + distance;
      break;
  }

  obj.setAlpha(0);

  return scene.tweens.add({
    targets: obj,
    x: targetX,
    y: targetY,
    alpha: 1,
    duration: duration,
    delay: delay,
    ease: 'Elastic.easeOut'
  });
}

/**
 * Wobble effect - object wobbles side to side
 */
export function wobble(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { angle: number },
  intensity: number = 1,
  duration: number = 300
): Phaser.Tweens.Tween {
  const maxAngle = 10 * intensity;
  const originalAngle = obj.angle;

  return scene.tweens.add({
    targets: obj,
    angle: originalAngle + maxAngle,
    duration: duration / 4,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: 1,
    onYoyo: function() {
      scene.tweens.add({
        targets: obj,
        angle: originalAngle - maxAngle * 0.7,
        duration: duration / 4,
        ease: 'Sine.easeInOut'
      });
    },
    onComplete: () => {
      scene.tweens.add({
        targets: obj,
        angle: originalAngle,
        duration: duration / 4,
        ease: 'Sine.easeOut'
      });
    }
  });
}

/**
 * Bounce in place - object bounces vertically
 */
export function bounceInPlace(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { y: number },
  intensity: number = 1,
  duration: number = 400
): Phaser.Tweens.Tween {
  const bounceHeight = 20 * intensity;
  const originalY = obj.y;

  return scene.tweens.add({
    targets: obj,
    y: originalY - bounceHeight,
    duration: duration * 0.4,
    ease: 'Quad.easeOut',
    yoyo: true,
    onYoyo: () => {
      // Small secondary bounce
      scene.time.delayedCall(duration * 0.4, () => {
        scene.tweens.add({
          targets: obj,
          y: originalY - bounceHeight * 0.3,
          duration: duration * 0.2,
          ease: 'Quad.easeOut',
          yoyo: true
        });
      });
    }
  });
}

/**
 * Pulse glow effect - adds pulsing glow behind object
 */
export function pulseGlow(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { x: number; y: number },
  color: number = YAK_COLORS.secondary,
  config: JuiceConfig & { radius?: number; pulseCount?: number } = {}
): Phaser.GameObjects.Graphics {
  const { duration = 1000, radius = 50, pulseCount = 3 } = config;

  const glow = scene.add.graphics();
  glow.setPosition(obj.x, obj.y);
  glow.setDepth((obj as any).depth ? (obj as any).depth - 1 : 0);

  // Create pulsing glow
  let currentRadius = radius * 0.5;
  let expanding = true;
  let pulses = 0;

  const updateGlow = () => {
    glow.clear();

    // Draw multiple layers for soft glow
    for (let i = 3; i >= 1; i--) {
      const layerRadius = currentRadius * (1 + i * 0.2);
      const alpha = 0.2 / i;
      glow.fillStyle(color, alpha);
      glow.fillCircle(0, 0, layerRadius);
    }
  };

  const pulseTimer = scene.time.addEvent({
    delay: 16,
    callback: () => {
      if (expanding) {
        currentRadius += radius * 0.02;
        if (currentRadius >= radius) {
          expanding = false;
        }
      } else {
        currentRadius -= radius * 0.015;
        if (currentRadius <= radius * 0.5) {
          expanding = true;
          pulses++;
          if (pulses >= pulseCount) {
            pulseTimer.remove();
            glow.destroy();
            return;
          }
        }
      }
      updateGlow();
    },
    loop: true
  });

  updateGlow();
  return glow;
}

/**
 * Create a squash/stretch trail effect
 */
export function createJuicyTrail(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { x: number; y: number },
  config: TrailConfig = {}
): { update: () => void; destroy: () => void } {
  const {
    color = YAK_COLORS.primary,
    glow = true,
    sparkle = 0.3,
    maxLength = 10
  } = config;

  const trail: { x: number; y: number; alpha: number }[] = [];
  const graphics = scene.add.graphics();
  graphics.setDepth((obj as any).depth ? (obj as any).depth - 1 : 5);

  const sparkles: Phaser.GameObjects.Arc[] = [];

  const update = () => {
    // Add current position to trail
    trail.unshift({ x: obj.x, y: obj.y, alpha: 1 });

    // Limit trail length
    if (trail.length > maxLength) {
      trail.pop();
    }

    // Update alpha values
    trail.forEach((point, i) => {
      point.alpha = 1 - (i / maxLength);
    });

    // Draw trail
    graphics.clear();

    if (trail.length >= 2) {
      for (let i = 1; i < trail.length; i++) {
        const prev = trail[i - 1];
        const curr = trail[i];
        const size = (1 - i / trail.length) * 8;

        // Glow layer
        if (glow) {
          graphics.fillStyle(color, curr.alpha * 0.3);
          graphics.fillCircle(curr.x, curr.y, size * 2);
        }

        // Core trail
        graphics.fillStyle(color, curr.alpha * 0.7);
        graphics.fillCircle(curr.x, curr.y, size);
      }
    }

    // Random sparkle
    if (sparkle > 0 && Math.random() < sparkle && trail.length > 0) {
      const sparkleObj = scene.add.circle(
        trail[0].x + (Math.random() - 0.5) * 10,
        trail[0].y + (Math.random() - 0.5) * 10,
        3,
        0xffffff
      );
      sparkles.push(sparkleObj);

      scene.tweens.add({
        targets: sparkleObj,
        alpha: 0,
        scale: 0,
        duration: 200,
        onComplete: () => {
          const idx = sparkles.indexOf(sparkleObj);
          if (idx > -1) sparkles.splice(idx, 1);
          sparkleObj.destroy();
        }
      });
    }
  };

  const destroy = () => {
    graphics.destroy();
    sparkles.forEach(s => s.destroy());
  };

  return { update, destroy };
}

/**
 * Apply follow-through overshoot animation
 * Object overshoots target then settles back
 */
export function followThrough(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { x: number; y: number },
  targetX: number,
  targetY: number,
  config: JuiceConfig & { overshoot?: number } = {}
): Phaser.Tweens.Tween {
  const { duration = 400, overshoot = 0.15 } = config;

  // Calculate overshoot position
  const dx = targetX - obj.x;
  const dy = targetY - obj.y;
  const overshootX = targetX + dx * overshoot;
  const overshootY = targetY + dy * overshoot;

  return scene.tweens.add({
    targets: obj,
    x: overshootX,
    y: overshootY,
    duration: duration * 0.6,
    ease: 'Power2.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: obj,
        x: targetX,
        y: targetY,
        duration: duration * 0.4,
        ease: 'Back.easeOut'
      });
    }
  });
}

/**
 * Stretch towards target - anticipation before movement
 */
export function stretchTowards(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { x: number; y: number; scaleX: number; scaleY: number; rotation: number },
  targetX: number,
  targetY: number,
  config: JuiceConfig = {}
): Phaser.Tweens.Tween {
  const { intensity = 1, duration = 200 } = config;

  const angle = Math.atan2(targetY - obj.y, targetX - obj.x);
  const stretchAmount = 0.2 * intensity;
  const originalScaleX = obj.scaleX;
  const originalScaleY = obj.scaleY;
  const originalRotation = obj.rotation;

  return scene.tweens.add({
    targets: obj,
    scaleX: originalScaleX * (1 + stretchAmount),
    scaleY: originalScaleY * (1 - stretchAmount * 0.5),
    rotation: angle,
    duration: duration,
    ease: 'Power2.easeOut',
    yoyo: true
  });
}

/**
 * Breathing/idle animation - subtle scale pulsing
 */
export function breathe(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { scaleX: number; scaleY: number },
  config: JuiceConfig & { amplitude?: number } = {}
): Phaser.Tweens.Tween {
  const { duration = 2000, amplitude = 0.03 } = config;
  const originalScaleX = obj.scaleX;
  const originalScaleY = obj.scaleY;

  return scene.tweens.add({
    targets: obj,
    scaleX: originalScaleX * (1 + amplitude),
    scaleY: originalScaleY * (1 + amplitude * 0.7),
    duration: duration,
    ease: 'Sine.easeInOut',
    yoyo: true,
    repeat: -1
  });
}

/**
 * Type out text letter by letter
 */
export function typeText(
  scene: Phaser.Scene,
  textObj: Phaser.GameObjects.Text,
  fullText: string,
  config: JuiceConfig & { letterDelay?: number; onComplete?: () => void } = {}
): void {
  const { letterDelay = 50, onComplete } = config;

  textObj.setText('');
  let currentIndex = 0;

  const typeTimer = scene.time.addEvent({
    delay: letterDelay,
    callback: () => {
      currentIndex++;
      textObj.setText(fullText.substring(0, currentIndex));

      if (currentIndex >= fullText.length) {
        typeTimer.remove();
        onComplete?.();
      }
    },
    loop: true
  });
}

/**
 * Rainbow shimmer effect on text
 */
export function rainbowShimmer(
  scene: Phaser.Scene,
  textObj: Phaser.GameObjects.Text,
  duration: number = 2000
): void {
  const colors = [
    '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3'
  ];
  let colorIndex = 0;

  const shimmerTimer = scene.time.addEvent({
    delay: 100,
    callback: () => {
      colorIndex = (colorIndex + 1) % colors.length;
      textObj.setColor(colors[colorIndex]);
    },
    repeat: Math.floor(duration / 100)
  });
}

/**
 * Combine multiple juice effects for "maximum juice"
 */
export function maxJuice(
  scene: Phaser.Scene,
  obj: Phaser.GameObjects.GameObject & { x: number; y: number; scaleX: number; scaleY: number; alpha: number },
  type: 'success' | 'fail' | 'impact'
): void {
  switch (type) {
    case 'success':
      popScale(scene, obj, 1.3, 150);
      pulseGlow(scene, obj, YAK_COLORS.success, { pulseCount: 2 });
      scene.time.delayedCall(100, () => wobble(scene, obj as any, 0.5, 200));
      break;

    case 'fail':
      objectShake(scene, obj, 1.5, 300);
      pulseGlow(scene, obj, YAK_COLORS.danger, { pulseCount: 1, radius: 30 });
      break;

    case 'impact':
      impactJuice(scene, obj, 1.2);
      scene.cameras.main.shake(100, 0.01);
      break;
  }
}

export const JuiceFactory = {
  applyMotionJuice,
  windUp,
  impactJuice,
  buttonPress,
  animateNumber,
  popScale,
  objectShake,
  popIn,
  popOut,
  slamIn,
  slideIn,
  wobble,
  bounceInPlace,
  pulseGlow,
  createJuicyTrail,
  followThrough,
  stretchTowards,
  breathe,
  typeText,
  rainbowShimmer,
  maxJuice
};

export default JuiceFactory;
