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

// ============================================
// NEW ENHANCED PARTICLE TYPES
// ============================================

/**
 * Star burst - points radiate outward in a star pattern
 */
export function createStarBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    points?: number;
    colors?: number[];
    innerRadius?: number;
    outerRadius?: number;
    duration?: number;
    depth?: number;
  } = {}
): void {
  const {
    points = 8,
    colors = [YAK_COLORS.secondary, YAK_COLORS.primary, 0xffffff],
    innerRadius = 20,
    outerRadius = 120,
    duration = 600,
    depth = 100,
  } = config;

  // Create star points
  for (let i = 0; i < points; i++) {
    const angle = (Math.PI * 2 * i) / points;
    const color = colors[i % colors.length];

    // Inner spark
    const innerSpark = scene.add.star(x, y, 4, 3, 6, color, 1).setDepth(depth);

    scene.tweens.add({
      targets: innerSpark,
      x: x + Math.cos(angle) * innerRadius,
      y: y + Math.sin(angle) * innerRadius,
      scale: 0.5,
      alpha: 0,
      duration: duration * 0.4,
      ease: 'Power2',
      onComplete: () => innerSpark.destroy(),
    });

    // Outer beam
    const beam = scene.add.line(
      0, 0, x, y,
      x + Math.cos(angle) * 10,
      y + Math.sin(angle) * 10,
      color, 1
    ).setDepth(depth - 1).setLineWidth(3);

    scene.tweens.add({
      targets: beam,
      alpha: 0,
      duration: duration,
      onUpdate: () => {
        const progress = 1 - beam.alpha;
        const dist = innerRadius + (outerRadius - innerRadius) * progress;
        beam.setTo(x, y, x + Math.cos(angle) * dist, y + Math.sin(angle) * dist);
        beam.setLineWidth(3 * (1 - progress));
      },
      onComplete: () => beam.destroy(),
    });
  }

  // Center flash
  const flash = scene.add.circle(x, y, 20, 0xffffff, 1).setDepth(depth + 1);
  scene.tweens.add({
    targets: flash,
    scale: 2,
    alpha: 0,
    duration: duration * 0.3,
    ease: 'Power2',
    onComplete: () => flash.destroy(),
  });
}

/**
 * Spiral burst - particles spiral outward
 */
export function createSpiralBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    count?: number;
    colors?: number[];
    radius?: number;
    rotations?: number;
    duration?: number;
    depth?: number;
  } = {}
): void {
  const {
    count = 30,
    colors = [YAK_COLORS.primary, YAK_COLORS.secondary, 0xffffff],
    radius = 150,
    rotations = 2,
    duration = 1000,
    depth = 100,
  } = config;

  for (let i = 0; i < count; i++) {
    const delay = (i / count) * 200;
    const color = colors[i % colors.length];
    const size = 3 + Math.random() * 4;

    const particle = scene.add.circle(x, y, size, color, 1).setDepth(depth);

    const startAngle = (Math.PI * 2 * i) / count;
    const targetAngle = startAngle + Math.PI * 2 * rotations;
    const targetRadius = radius * (0.5 + Math.random() * 0.5);

    const progress = { value: 0 };

    scene.tweens.add({
      targets: progress,
      value: 1,
      duration: duration,
      delay: delay,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        const angle = startAngle + (targetAngle - startAngle) * progress.value;
        const r = targetRadius * progress.value;
        particle.x = x + Math.cos(angle) * r;
        particle.y = y + Math.sin(angle) * r;
        particle.setAlpha(1 - progress.value * 0.8);
        particle.setScale(1 - progress.value * 0.5);
      },
      onComplete: () => particle.destroy(),
    });
  }
}

/**
 * Firework - multi-stage explosion with trails
 */
export function createFirework(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    layers?: number;
    colors?: number[];
    size?: number;
    duration?: number;
    depth?: number;
  } = {}
): void {
  const {
    layers = 3,
    colors = [0xff6b6b, 0xfeca57, 0x48dbfb, 0xff9ff3, 0x54a0ff],
    size = 100,
    duration = 1200,
    depth = 100,
  } = config;

  // Initial burst
  const burstCount = 12;
  for (let i = 0; i < burstCount; i++) {
    const angle = (Math.PI * 2 * i) / burstCount;
    const color = colors[i % colors.length];

    // Main particle with trail
    const trailLength = 8;
    const particles: Phaser.GameObjects.Arc[] = [];

    for (let t = 0; t < trailLength; t++) {
      const trailParticle = scene.add.circle(x, y, 4 - t * 0.4, color, 1 - t * 0.1).setDepth(depth - t);
      particles.push(trailParticle);
    }

    const targetX = x + Math.cos(angle) * size;
    const targetY = y + Math.sin(angle) * size - 30; // Slight upward arc

    scene.tweens.add({
      targets: particles[0],
      x: targetX,
      y: targetY,
      duration: duration * 0.4,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        // Update trail
        for (let t = trailLength - 1; t > 0; t--) {
          particles[t].x = particles[t - 1].x;
          particles[t].y = particles[t - 1].y;
        }
      },
      onComplete: () => {
        particles.forEach(p => p.destroy());

        // Secondary burst at this location
        if (layers > 1) {
          createSecondaryBurst(scene, targetX, targetY, color, size * 0.4, depth);
        }
      },
    });
  }

  // Center flash
  const flash = scene.add.circle(x, y, 15, 0xffffff, 1).setDepth(depth + 1);
  scene.tweens.add({
    targets: flash,
    scale: 3,
    alpha: 0,
    duration: 200,
    ease: 'Power2',
    onComplete: () => flash.destroy(),
  });
}

function createSecondaryBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number,
  size: number,
  depth: number
): void {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const particle = scene.add.circle(x, y, 3, color, 1).setDepth(depth);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * size,
      y: y + Math.sin(angle) * size,
      alpha: 0,
      scale: 0.3,
      duration: 400,
      ease: 'Power2.easeOut',
      onComplete: () => particle.destroy(),
    });
  }

  // Sparkles
  for (let i = 0; i < 5; i++) {
    const sparkle = scene.add.star(
      x + (Math.random() - 0.5) * size,
      y + (Math.random() - 0.5) * size,
      4, 2, 4, 0xffffff, 1
    ).setDepth(depth + 1);

    scene.tweens.add({
      targets: sparkle,
      alpha: 0,
      scale: 0,
      duration: 300,
      delay: Math.random() * 200,
      onComplete: () => sparkle.destroy(),
    });
  }
}

/**
 * Mega confetti - with stars, ribbons, and spin
 */
export function createMegaConfetti(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    count?: number;
    includeStars?: boolean;
    includeRibbons?: boolean;
    gravity?: boolean;
    spin?: boolean;
    spread?: number;
    colors?: number[];
    duration?: number;
    depth?: number;
  } = {}
): void {
  const {
    count = 80,
    includeStars = true,
    includeRibbons = true,
    gravity = true,
    spin = true,
    spread = 300,
    colors = [0x4ade80, 0xfbbf24, 0x60a5fa, 0xe74c3c, 0xff6b35, 0x8b5cf6, 0xec4899],
    duration = 2000,
    depth = 100,
  } = config;

  const { height } = scene.cameras.main;

  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    const isRibbon = includeRibbons && Math.random() < 0.3;
    const isStar = includeStars && !isRibbon && Math.random() < 0.2;

    let particle: Phaser.GameObjects.GameObject;

    if (isStar) {
      particle = scene.add.star(x, y, 5, 3, 6, color, 1).setDepth(depth);
    } else if (isRibbon) {
      // Ribbon is a thin rectangle
      particle = scene.add.rectangle(x, y, 3, 15, color, 1).setDepth(depth);
    } else {
      // Regular confetti (circle or rectangle)
      const size = 3 + Math.random() * 5;
      particle = Math.random() > 0.5
        ? scene.add.circle(x, y, size, color, 1).setDepth(depth)
        : scene.add.rectangle(x, y, size * 2, size, color, 1).setDepth(depth);
    }

    // Initial velocity
    const vx = (Math.random() - 0.5) * 15;
    const vy = -5 - Math.random() * 10;
    const targetX = x + vx * 20 + (Math.random() - 0.5) * spread;
    const targetY = gravity ? height + 50 : y + Math.random() * 200;

    // Rotation
    const rotation = spin ? Math.random() * Math.PI * 8 * (Math.random() > 0.5 ? 1 : -1) : 0;

    // Animation with gravity curve
    if (gravity) {
      const particleObj = particle as any;
      particleObj.vx = vx;
      particleObj.vy = vy;
      particleObj.gravity = 0.3;
      particleObj.rotSpeed = spin ? (Math.random() - 0.5) * 0.2 : 0;
      particleObj.startTime = scene.time.now;
      particleObj.maxDuration = duration;

      const updateGravity = () => {
        if (!particle.active) return;

        const elapsed = scene.time.now - particleObj.startTime;
        if (elapsed > particleObj.maxDuration || particleObj.y > height + 50) {
          particle.destroy();
          return;
        }

        particleObj.vy += particleObj.gravity;
        particleObj.x += particleObj.vx;
        particleObj.y += particleObj.vy;

        // Air resistance
        particleObj.vx *= 0.99;

        // Wobble for ribbons
        if (isRibbon) {
          particleObj.x += Math.sin(elapsed * 0.01) * 0.5;
        }

        if (spin) {
          particleObj.rotation += particleObj.rotSpeed;
        }

        // Fade near end
        const fadeStart = particleObj.maxDuration * 0.7;
        if (elapsed > fadeStart) {
          particleObj.alpha = 1 - (elapsed - fadeStart) / (particleObj.maxDuration - fadeStart);
        }

        scene.time.delayedCall(16, updateGravity);
      };

      updateGravity();
    } else {
      // Simple tween without gravity
      scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        rotation: rotation,
        alpha: 0,
        duration: duration,
        ease: 'Power1',
        onComplete: () => particle.destroy(),
      });
    }
  }
}

/**
 * Impact sparks - directional spray for collisions
 */
export function createImpactSparks(
  scene: Phaser.Scene,
  x: number,
  y: number,
  angle: number,
  config: {
    intensity?: number;
    color?: number;
    count?: number;
    spread?: number;
    depth?: number;
  } = {}
): void {
  const {
    intensity = 1,
    color = 0xffaa00,
    count = 15,
    spread = 0.8,
    depth = 100,
  } = config;

  const sparkCount = Math.floor(count * intensity);

  for (let i = 0; i < sparkCount; i++) {
    const sparkAngle = angle + (Math.random() - 0.5) * spread;
    const speed = 50 + Math.random() * 100 * intensity;
    const size = 2 + Math.random() * 3;

    const spark = scene.add.circle(x, y, size, color, 1).setDepth(depth);

    // Add glow
    const glow = scene.add.circle(x, y, size * 2, color, 0.3).setDepth(depth - 1);

    const targetX = x + Math.cos(sparkAngle) * speed;
    const targetY = y + Math.sin(sparkAngle) * speed;

    scene.tweens.add({
      targets: [spark, glow],
      x: targetX,
      y: targetY,
      alpha: 0,
      scale: 0.2,
      duration: 300 + Math.random() * 200,
      ease: 'Power2.easeOut',
      onComplete: () => {
        spark.destroy();
        glow.destroy();
      },
    });
  }

  // Flash at impact point
  const flash = scene.add.circle(x, y, 10, 0xffffff, 0.8).setDepth(depth + 1);
  scene.tweens.add({
    targets: flash,
    scale: 2,
    alpha: 0,
    duration: 100,
    onComplete: () => flash.destroy(),
  });
}

/**
 * Dust poof - for landings and impacts
 */
export function createDustPoof(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    color?: number;
    count?: number;
    size?: number;
    duration?: number;
    depth?: number;
  } = {}
): void {
  const {
    color = 0xccbbaa,
    count = 12,
    size = 80,
    duration = 500,
    depth = 50,
  } = config;

  // Ground-level dust cloud
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * i) / count - Math.PI / 2; // Semi-circle upward
    const distance = size * (0.3 + Math.random() * 0.7);
    const particleSize = 10 + Math.random() * 15;

    const dust = scene.add.circle(x, y, particleSize, color, 0.6).setDepth(depth);

    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance * 0.5; // Flattened arc

    scene.tweens.add({
      targets: dust,
      x: targetX,
      y: targetY,
      scale: 2,
      alpha: 0,
      duration: duration,
      ease: 'Power2.easeOut',
      onComplete: () => dust.destroy(),
    });
  }

  // Quick flash at ground
  const flash = scene.add.ellipse(x, y, 60, 20, color, 0.4).setDepth(depth - 1);
  scene.tweens.add({
    targets: flash,
    scaleX: 2,
    alpha: 0,
    duration: 300,
    onComplete: () => flash.destroy(),
  });
}

/**
 * Speed lines - motion blur effect behind moving objects
 */
export function createSpeedLines(
  scene: Phaser.Scene,
  obj: { x: number; y: number },
  velocityX: number,
  velocityY: number,
  config: {
    count?: number;
    length?: number;
    color?: number;
    alpha?: number;
    depth?: number;
  } = {}
): void {
  const {
    count = 8,
    length = 40,
    color = 0xffffff,
    alpha = 0.5,
    depth = 50,
  } = config;

  const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
  if (speed < 5) return; // Don't show for slow objects

  const angle = Math.atan2(velocityY, velocityX);
  const lineLength = Math.min(length, speed * 2);

  for (let i = 0; i < count; i++) {
    const offsetAngle = angle + Math.PI + (Math.random() - 0.5) * 0.5;
    const offsetDist = Math.random() * 15;
    const startX = obj.x + Math.cos(offsetAngle + Math.PI / 2) * offsetDist;
    const startY = obj.y + Math.sin(offsetAngle + Math.PI / 2) * offsetDist;

    const endX = startX + Math.cos(offsetAngle) * lineLength;
    const endY = startY + Math.sin(offsetAngle) * lineLength;

    const line = scene.add.line(0, 0, startX, startY, endX, endY, color, alpha * (1 - i / count))
      .setDepth(depth)
      .setLineWidth(2 - i * 0.2);

    scene.tweens.add({
      targets: line,
      alpha: 0,
      duration: 150,
      onComplete: () => line.destroy(),
    });
  }
}

/**
 * Enhanced trail system with glow, sparkles, and gradient
 */
export function createEnhancedTrail(
  scene: Phaser.Scene,
  obj: { x: number; y: number },
  config: {
    color?: number;
    glow?: boolean;
    sparkle?: number;
    gradient?: boolean;
    maxLength?: number;
    depth?: number;
  } = {}
): { update: () => void; destroy: () => void } {
  const {
    color = YAK_COLORS.primary,
    glow = true,
    sparkle = 0.3,
    gradient = true,
    maxLength = 15,
    depth = 50,
  } = config;

  const trail: { x: number; y: number; time: number }[] = [];
  const graphics = scene.add.graphics().setDepth(depth);
  const glowGraphics = glow ? scene.add.graphics().setDepth(depth - 1) : null;
  const sparkles: Phaser.GameObjects.GameObject[] = [];

  const update = () => {
    // Add current position
    trail.unshift({ x: obj.x, y: obj.y, time: scene.time.now });

    // Limit trail length
    while (trail.length > maxLength) {
      trail.pop();
    }

    // Draw trail
    graphics.clear();
    glowGraphics?.clear();

    if (trail.length < 2) return;

    // Calculate colors for gradient
    const r = (color >> 16) & 0xff;
    const g = (color >> 8) & 0xff;
    const b = color & 0xff;

    for (let i = 1; i < trail.length; i++) {
      const prev = trail[i - 1];
      const curr = trail[i];
      const progress = i / trail.length;
      const alpha = 1 - progress;
      const size = (1 - progress) * 6 + 2;

      // Gradient color (fade to white at tail if enabled)
      let drawColor = color;
      if (gradient) {
        const fadeR = Math.floor(r + (255 - r) * progress * 0.5);
        const fadeG = Math.floor(g + (255 - g) * progress * 0.5);
        const fadeB = Math.floor(b + (255 - b) * progress * 0.5);
        drawColor = (fadeR << 16) | (fadeG << 8) | fadeB;
      }

      // Glow layer
      if (glowGraphics) {
        glowGraphics.fillStyle(drawColor, alpha * 0.3);
        glowGraphics.fillCircle(curr.x, curr.y, size * 2);
      }

      // Core trail
      graphics.fillStyle(drawColor, alpha * 0.8);
      graphics.fillCircle(curr.x, curr.y, size);
    }

    // Random sparkle
    if (sparkle > 0 && Math.random() < sparkle && trail.length > 0) {
      const sparkleObj = scene.add.star(
        trail[0].x + (Math.random() - 0.5) * 10,
        trail[0].y + (Math.random() - 0.5) * 10,
        4, 2, 4, 0xffffff, 1
      ).setDepth(depth + 1);
      sparkles.push(sparkleObj);

      scene.tweens.add({
        targets: sparkleObj,
        alpha: 0,
        scale: 0,
        rotation: Math.PI,
        duration: 200,
        onComplete: () => {
          const idx = sparkles.indexOf(sparkleObj);
          if (idx > -1) sparkles.splice(idx, 1);
          sparkleObj.destroy();
        },
      });
    }
  };

  const destroy = () => {
    graphics.destroy();
    glowGraphics?.destroy();
    sparkles.forEach(s => s.destroy());
  };

  return { update, destroy };
}

/**
 * Ring burst - expanding rings for celebrations
 */
export function createRingBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    count?: number;
    colors?: number[];
    maxRadius?: number;
    duration?: number;
    depth?: number;
  } = {}
): void {
  const {
    count = 5,
    colors = [YAK_COLORS.primary, YAK_COLORS.secondary, 0xffffff],
    maxRadius = 150,
    duration = 800,
    depth = 100,
  } = config;

  for (let i = 0; i < count; i++) {
    const delay = i * 100;
    const color = colors[i % colors.length];

    const ring = scene.add.circle(x, y, 10, color, 0).setDepth(depth);
    ring.setStrokeStyle(4 - i * 0.5, color, 1);

    scene.tweens.add({
      targets: ring,
      radius: maxRadius,
      alpha: 0,
      delay: delay,
      duration: duration,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        const progress = ring.radius / maxRadius;
        ring.setStrokeStyle((4 - i * 0.5) * (1 - progress), color, 1 - progress);
      },
      onComplete: () => ring.destroy(),
    });
  }
}

/**
 * Victory rays - radiating light beams for big wins
 */
export function createVictoryRays(
  scene: Phaser.Scene,
  x: number,
  y: number,
  config: {
    count?: number;
    color?: number;
    length?: number;
    duration?: number;
    depth?: number;
  } = {}
): void {
  const {
    count = 12,
    color = 0xffd700,
    length = 300,
    duration = 1500,
    depth = 90,
  } = config;

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;

    const ray = scene.add.graphics().setDepth(depth);
    ray.setAlpha(0);

    // Draw tapered ray
    const drawRay = (len: number, alpha: number) => {
      ray.clear();
      ray.fillStyle(color, alpha);
      ray.beginPath();
      ray.moveTo(x, y);
      ray.lineTo(
        x + Math.cos(angle - 0.05) * len,
        y + Math.sin(angle - 0.05) * len
      );
      ray.lineTo(
        x + Math.cos(angle + 0.05) * len,
        y + Math.sin(angle + 0.05) * len
      );
      ray.closePath();
      ray.fillPath();
    };

    const progress = { value: 0, alpha: 0 };

    // Fade in
    scene.tweens.add({
      targets: progress,
      alpha: 0.6,
      duration: duration * 0.2,
      onUpdate: () => drawRay(20, progress.alpha),
    });

    // Extend
    scene.tweens.add({
      targets: progress,
      value: 1,
      delay: duration * 0.1 + i * 30,
      duration: duration * 0.4,
      ease: 'Power2.easeOut',
      onUpdate: () => {
        const len = 20 + (length - 20) * progress.value;
        drawRay(len, progress.alpha);
      },
    });

    // Fade out
    scene.tweens.add({
      targets: progress,
      alpha: 0,
      delay: duration * 0.6,
      duration: duration * 0.4,
      onUpdate: () => drawRay(length, progress.alpha),
      onComplete: () => ray.destroy(),
    });
  }
}
