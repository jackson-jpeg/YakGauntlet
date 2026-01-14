import Phaser from 'phaser';
import { YAK_COLORS } from '../config/theme';

/**
 * Visual Effects Utility
 * Reusable visual effects and particles for game polish
 */

/**
 * Create explosion particle effect
 */
export function createExplosion(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    count?: number;
    color?: number;
    minSize?: number;
    maxSize?: number;
    spread?: number;
    duration?: number;
    depth?: number;
  } = {}
): void {
  const {
    count = 20,
    color = YAK_COLORS.primary,
    minSize = 3,
    maxSize = 8,
    spread = 150,
    duration = 800,
    depth = 100,
  } = config;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = Math.random() * spread;
    const size = Math.random() * (maxSize - minSize) + minSize;

    const particle = scene.add.circle(x, y, size, color, 0.9).setDepth(depth);

    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance;

    scene.tweens.add({
      targets: particle,
      x: targetX,
      y: targetY,
      alpha: 0,
      scale: 0.2,
      duration: duration + Math.random() * 300,
      ease: 'Power2',
      onComplete: () => particle.destroy(),
    });
  }
}

/**
 * Create confetti effect for celebrations
 */
export function createConfetti(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    count?: number;
    colors?: number[];
    spread?: number;
    height?: number;
    depth?: number;
  } = {}
): void {
  const {
    count = 40,
    colors = [0x4ade80, 0xfbbf24, 0x60a5fa, 0xe74c3c, 0xff6b35],
    spread = 200,
    height = 300,
    depth = 100,
  } = config;

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 5 + 3;
    const shape = Math.random() > 0.5 ? 'circle' : 'rect';

    const particle = shape === 'circle'
      ? scene.add.circle(x, y, size, color, 0.9).setDepth(depth)
      : scene.add.rectangle(x, y, size * 2, size, color, 0.9).setDepth(depth);

    const targetX = x + (Math.random() - 0.5) * spread;
    const targetY = y + Math.random() * height;
    const rotation = Math.random() * Math.PI * 4;

    scene.tweens.add({
      targets: particle,
      x: targetX,
      y: targetY,
      rotation: rotation,
      alpha: 0,
      duration: 1000 + Math.random() * 500,
      ease: 'Power2',
      onComplete: () => particle.destroy(),
    });
  }
}

/**
 * Create impact ripple effect
 */
export function createRipple(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    color?: number;
    startRadius?: number;
    endRadius?: number;
    duration?: number;
    lineWidth?: number;
    depth?: number;
  } = {}
): void {
  const {
    color = 0xffffff,
    startRadius = 10,
    endRadius = 80,
    duration = 600,
    lineWidth = 3,
    depth = 50,
  } = config;

  const ripple = scene.add.circle(x, y, startRadius, color, 0).setDepth(depth);
  ripple.setStrokeStyle(lineWidth, color, 1);

  scene.tweens.add({
    targets: ripple,
    radius: endRadius,
    alpha: 0,
    duration: duration,
    ease: 'Power2',
    onUpdate: () => {
      ripple.setStrokeStyle(lineWidth * (1 - ripple.alpha), color, ripple.alpha);
    },
    onComplete: () => ripple.destroy(),
  });
}

/**
 * Create floating text that rises and fades
 */
export function createFloatingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  config: {
    fontSize?: string;
    color?: string;
    stroke?: string;
    strokeThickness?: number;
    duration?: number;
    distance?: number;
    depth?: number;
    scale?: number;
  } = {}
): Phaser.GameObjects.Text {
  const {
    fontSize = '24px',
    color = '#ffffff',
    stroke = '#000000',
    strokeThickness = 4,
    duration = 1000,
    distance = 50,
    depth = 200,
    scale = 1,
  } = config;

  const floatText = scene.add.text(x, y, text, {
    fontFamily: 'Arial Black',
    fontSize,
    color,
    stroke,
    strokeThickness,
  }).setOrigin(0.5).setDepth(depth).setScale(scale).setAlpha(0);

  scene.tweens.add({
    targets: floatText,
    y: y - distance,
    alpha: 1,
    duration: duration * 0.3,
    ease: 'Power2',
  });

  scene.tweens.add({
    targets: floatText,
    alpha: 0,
    duration: duration * 0.4,
    delay: duration * 0.6,
    onComplete: () => floatText.destroy(),
  });

  return floatText;
}

/**
 * Create trail effect for moving objects
 */
export function createTrailPoint(
  graphics: Phaser.GameObjects.Graphics,
  trailPoints: { x: number; y: number; alpha: number }[],
  x: number,
  y: number,
  config: {
    maxPoints?: number;
    color?: number;
    maxSize?: number;
    alphaDecay?: number;
  } = {}
): void {
  const {
    maxPoints = 20,
    color = 0xffffff,
    maxSize = 12,
    alphaDecay = 0.05,
  } = config;

  trailPoints.push({ x, y, alpha: 1 });
  if (trailPoints.length > maxPoints) trailPoints.shift();

  // Decay alpha for existing points
  trailPoints.forEach(point => {
    point.alpha -= alphaDecay;
  });

  // Draw trail
  graphics.clear();
  trailPoints.forEach((point, i) => {
    if (point.alpha > 0) {
      const progress = i / trailPoints.length;
      const size = progress * maxSize;
      graphics.fillStyle(color, point.alpha * progress);
      graphics.fillCircle(point.x, point.y, size);
    }
  });
}

/**
 * Screen shake helper
 */
export function shakeCamera(
  scene: Phaser.Scene,
  intensity: 'light' | 'medium' | 'heavy' = 'medium'
): void {
  const config = {
    light: { duration: 100, intensity: 0.003 },
    medium: { duration: 150, intensity: 0.008 },
    heavy: { duration: 250, intensity: 0.015 },
  };

  const { duration, intensity: amount } = config[intensity];
  scene.cameras.main.shake(duration, amount);
}

/**
 * Flash screen with color
 */
export function flashScreen(
  scene: Phaser.Scene,
  color: 'white' | 'green' | 'red' | 'gold' = 'white',
  duration: number = 200
): void {
  const colors = {
    white: [255, 255, 255],
    green: [16, 185, 129],
    red: [239, 68, 68],
    gold: [251, 191, 36],
  };

  const [r, g, b] = colors[color];
  scene.cameras.main.flash(duration, r, g, b, false, undefined, 0.3);
}

/**
 * Create glow effect around object
 */
export function createGlow(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    radius?: number;
    color?: number;
    alpha?: number;
    duration?: number;
    depth?: number;
  } = {}
): Phaser.GameObjects.Arc {
  const {
    radius = 40,
    color = YAK_COLORS.successBright,
    alpha = 0.3,
    duration = 1500,
    depth = 10,
  } = config;

  const glow = scene.add.circle(x, y, radius, color, 0).setDepth(depth);
  glow.setStrokeStyle(3, color, alpha);

  scene.tweens.add({
    targets: glow,
    scaleX: 1.5,
    scaleY: 1.5,
    alpha: 0,
    duration: duration,
    repeat: -1,
  });

  return glow;
}

/**
 * Pulse animation for objects
 */
export function pulseObject(
  scene: Phaser.Scene,
  target: Phaser.GameObjects.GameObject,
  config: {
    scale?: number;
    duration?: number;
    repeat?: number;
  } = {}
): void {
  const { scale = 1.1, duration = 600, repeat = -1 } = config;

  scene.tweens.add({
    targets: target,
    scale: scale,
    duration: duration,
    yoyo: true,
    repeat: repeat,
    ease: 'Sine.easeInOut',
  });
}

/**
 * Create streak/motion lines behind object
 */
export function createMotionLines(
  scene: Phaser.Scene,
  x: number,
  y: number,
  angle: number,
  config: {
    count?: number;
    length?: number;
    color?: number;
    depth?: number;
  } = {}
): void {
  const {
    count = 5,
    length = 30,
    color = 0xffffff,
    depth = 5,
  } = config;

  for (let i = 0; i < count; i++) {
    const offset = i * 15;
    const startX = x - Math.cos(angle) * offset;
    const startY = y - Math.sin(angle) * offset;
    const endX = startX - Math.cos(angle) * length;
    const endY = startY - Math.sin(angle) * length;

    const line = scene.add.line(
      0, 0,
      startX, startY,
      endX, endY,
      color,
      0.6 - i * 0.1
    ).setDepth(depth).setLineWidth(3 - i * 0.4);

    scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 300,
      delay: i * 50,
      onComplete: () => line.destroy(),
    });
  }
}
