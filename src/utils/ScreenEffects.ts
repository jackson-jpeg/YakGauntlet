/**
 * ScreenEffects - Screen-wide visual effects for dramatic moments
 * Zoom punch, vignette pulse, color flash, chromatic aberration, screen warp, etc.
 */

import { YAK_COLORS, GAUNTLET_COLORS } from '../config/theme';

export interface ScreenEffectConfig {
  intensity?: number;
  duration?: number;
  color?: number;
}

/**
 * Zoom punch - quick zoom in/out for impacts
 * Creates a satisfying "punch" feeling on big moments
 */
export function zoomPunch(
  scene: Phaser.Scene,
  scale: number = 1.05,
  duration: number = 150
): Phaser.Tweens.Tween {
  const camera = scene.cameras.main;
  const originalZoom = camera.zoom;

  return scene.tweens.add({
    targets: camera,
    zoom: originalZoom * scale,
    duration: duration * 0.4,
    ease: 'Power2.easeOut',
    yoyo: true,
    onComplete: () => {
      camera.zoom = originalZoom;
    }
  });
}

/**
 * Vignette pulse - edges darken and release
 * Creates focus effect and dramatic tension
 */
export function vignettePulse(
  scene: Phaser.Scene,
  intensity: number = 0.5,
  color: number = 0x000000,
  duration: number = 400
): Phaser.GameObjects.Graphics {
  const { width, height } = scene.cameras.main;

  const vignette = scene.add.graphics();
  vignette.setDepth(1000);
  vignette.setAlpha(0);

  // Create vignette gradient
  const drawVignette = (alpha: number) => {
    vignette.clear();

    // Multiple rings for smooth gradient
    const rings = 10;
    for (let i = rings; i >= 1; i--) {
      const ringAlpha = (alpha * intensity * (rings - i)) / rings;
      const r = ((color >> 16) & 0xff);
      const g = ((color >> 8) & 0xff);
      const b = (color & 0xff);

      vignette.fillStyle(color, ringAlpha);

      // Draw as expanding border
      const borderSize = (i / rings) * Math.max(width, height) * 0.3;

      // Top
      vignette.fillRect(0, 0, width, borderSize);
      // Bottom
      vignette.fillRect(0, height - borderSize, width, borderSize);
      // Left
      vignette.fillRect(0, 0, borderSize, height);
      // Right
      vignette.fillRect(width - borderSize, 0, borderSize, height);
    }
  };

  // Animate the vignette
  const alphaObj = { value: 0 };

  scene.tweens.add({
    targets: alphaObj,
    value: 1,
    duration: duration * 0.3,
    ease: 'Power2.easeOut',
    onUpdate: () => {
      drawVignette(alphaObj.value);
      vignette.setAlpha(1);
    },
    onComplete: () => {
      scene.tweens.add({
        targets: alphaObj,
        value: 0,
        duration: duration * 0.7,
        ease: 'Power1.easeIn',
        onUpdate: () => drawVignette(alphaObj.value),
        onComplete: () => vignette.destroy()
      });
    }
  });

  return vignette;
}

/**
 * Color flash with patterns
 * Solid, radial, or edge-focused flash
 */
export function colorFlash(
  scene: Phaser.Scene,
  color: number = 0xffffff,
  pattern: 'solid' | 'radial' | 'edges' = 'solid',
  config: ScreenEffectConfig = {}
): Phaser.GameObjects.Graphics {
  const { intensity = 0.8, duration = 200 } = config;
  const { width, height } = scene.cameras.main;

  const flash = scene.add.graphics();
  flash.setDepth(999);
  flash.setAlpha(0);

  const drawFlash = (alpha: number) => {
    flash.clear();

    switch (pattern) {
      case 'solid':
        flash.fillStyle(color, alpha * intensity);
        flash.fillRect(0, 0, width, height);
        break;

      case 'radial':
        // Radial gradient from center
        const centerX = width / 2;
        const centerY = height / 2;
        const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

        for (let i = 20; i >= 1; i--) {
          const ringAlpha = (alpha * intensity * (21 - i)) / 20;
          const radius = (i / 20) * maxRadius;
          flash.fillStyle(color, ringAlpha * 0.5);
          flash.fillCircle(centerX, centerY, radius);
        }
        break;

      case 'edges':
        // Flash from edges
        const borderWidth = Math.max(width, height) * 0.2 * alpha;
        flash.fillStyle(color, alpha * intensity * 0.8);
        flash.fillRect(0, 0, width, borderWidth); // Top
        flash.fillRect(0, height - borderWidth, width, borderWidth); // Bottom
        flash.fillRect(0, 0, borderWidth, height); // Left
        flash.fillRect(width - borderWidth, 0, borderWidth, height); // Right
        break;
    }
  };

  const alphaObj = { value: 0 };

  scene.tweens.add({
    targets: alphaObj,
    value: 1,
    duration: duration * 0.2,
    ease: 'Power3.easeOut',
    onUpdate: () => {
      drawFlash(alphaObj.value);
      flash.setAlpha(1);
    },
    onComplete: () => {
      scene.tweens.add({
        targets: alphaObj,
        value: 0,
        duration: duration * 0.8,
        ease: 'Power2.easeIn',
        onUpdate: () => drawFlash(alphaObj.value),
        onComplete: () => flash.destroy()
      });
    }
  });

  return flash;
}

/**
 * Chromatic aberration effect (RGB split)
 * Simulates lens distortion for intense moments
 */
export function chromaticAberration(
  scene: Phaser.Scene,
  intensity: number = 5,
  duration: number = 300
): void {
  // Create colored overlays that shift
  const { width, height } = scene.cameras.main;

  const redOverlay = scene.add.graphics();
  const blueOverlay = scene.add.graphics();

  redOverlay.setDepth(998);
  blueOverlay.setDepth(997);
  redOverlay.setBlendMode(Phaser.BlendModes.ADD);
  blueOverlay.setBlendMode(Phaser.BlendModes.ADD);

  // Draw thin colored bars
  const drawAberration = (offset: number) => {
    redOverlay.clear();
    blueOverlay.clear();

    // Red shift left
    redOverlay.fillStyle(0xff0000, 0.1);
    redOverlay.fillRect(-offset, 0, width, height);

    // Blue shift right
    blueOverlay.fillStyle(0x0000ff, 0.1);
    blueOverlay.fillRect(offset, 0, width, height);
  };

  const offsetObj = { value: 0 };

  scene.tweens.add({
    targets: offsetObj,
    value: intensity,
    duration: duration * 0.3,
    ease: 'Power2.easeOut',
    onUpdate: () => drawAberration(offsetObj.value),
    onComplete: () => {
      scene.tweens.add({
        targets: offsetObj,
        value: 0,
        duration: duration * 0.7,
        ease: 'Elastic.easeOut',
        onUpdate: () => drawAberration(offsetObj.value),
        onComplete: () => {
          redOverlay.destroy();
          blueOverlay.destroy();
        }
      });
    }
  });
}

/**
 * Screen warp effect - distortion for big moments
 * Creates a ripple/warp effect emanating from center or point
 */
export function screenWarp(
  scene: Phaser.Scene,
  intensity: number = 1,
  originX?: number,
  originY?: number,
  duration: number = 400
): void {
  const camera = scene.cameras.main;
  const { width, height } = camera;
  const ox = originX ?? width / 2;
  const oy = originY ?? height / 2;

  // Create ripple rings
  const rings: Phaser.GameObjects.Arc[] = [];
  const ringCount = 3;

  for (let i = 0; i < ringCount; i++) {
    const ring = scene.add.circle(ox, oy, 10, 0xffffff, 0);
    ring.setStrokeStyle(3 - i, 0xffffff, 0.5 - i * 0.15);
    ring.setDepth(1000);
    rings.push(ring);

    scene.tweens.add({
      targets: ring,
      radius: Math.max(width, height) * (0.5 + intensity * 0.5),
      alpha: 0,
      duration: duration + i * 100,
      delay: i * 80,
      ease: 'Quad.easeOut',
      onComplete: () => ring.destroy()
    });
  }

  // Subtle camera shake
  camera.shake(duration * 0.5, 0.005 * intensity);
}

/**
 * Freeze frame - pause with zoom for dramatic effect
 */
export function freezeFrame(
  scene: Phaser.Scene,
  duration: number = 500,
  withZoom: boolean = true,
  callback?: () => void
): void {
  const camera = scene.cameras.main;
  const originalTimeScale = scene.time.timeScale;

  // Flash white
  colorFlash(scene, 0xffffff, 'solid', { intensity: 0.5, duration: 100 });

  // Pause physics/tweens briefly
  scene.time.timeScale = 0.01;

  if (withZoom) {
    const originalZoom = camera.zoom;
    scene.tweens.add({
      targets: camera,
      zoom: originalZoom * 1.1,
      duration: duration * 0.5,
      ease: 'Power2.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: camera,
          zoom: originalZoom,
          duration: duration * 0.3,
          ease: 'Power2.easeIn'
        });
      }
    });
  }

  // Resume after duration
  scene.time.delayedCall(duration / scene.time.timeScale, () => {
    scene.time.timeScale = originalTimeScale;
    callback?.();
  });
}

/**
 * Dramatic slow-motion effect
 */
export function slowMotion(
  scene: Phaser.Scene,
  timeScale: number = 0.3,
  duration: number = 1000,
  callback?: () => void
): void {
  const originalTimeScale = scene.time.timeScale;

  // Ease into slow-mo
  const scaleObj = { value: originalTimeScale };

  scene.tweens.add({
    targets: scaleObj,
    value: timeScale,
    duration: 100,
    ease: 'Power2.easeOut',
    onUpdate: () => {
      scene.time.timeScale = scaleObj.value;
    },
    onComplete: () => {
      // Hold slow-mo
      scene.time.delayedCall((duration - 200) / timeScale, () => {
        // Ease out of slow-mo
        scene.tweens.add({
          targets: scaleObj,
          value: originalTimeScale,
          duration: 100,
          ease: 'Power2.easeIn',
          onUpdate: () => {
            scene.time.timeScale = scaleObj.value;
          },
          onComplete: () => {
            scene.time.timeScale = originalTimeScale;
            callback?.();
          }
        });
      });
    }
  });

  // Visual feedback - slight desaturation effect (via overlay)
  const desatOverlay = scene.add.graphics();
  desatOverlay.setDepth(990);
  desatOverlay.fillStyle(0x808080, 0.1);
  desatOverlay.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);

  scene.time.delayedCall(duration / timeScale, () => {
    desatOverlay.destroy();
  });
}

/**
 * Letterbox - cinematic black bars
 */
export function letterbox(
  scene: Phaser.Scene,
  show: boolean = true,
  duration: number = 500,
  barHeight: number = 60
): { top: Phaser.GameObjects.Rectangle; bottom: Phaser.GameObjects.Rectangle } {
  const { width, height } = scene.cameras.main;

  // Check if bars already exist
  let topBar = scene.children.getByName('letterbox_top') as Phaser.GameObjects.Rectangle;
  let bottomBar = scene.children.getByName('letterbox_bottom') as Phaser.GameObjects.Rectangle;

  if (!topBar) {
    topBar = scene.add.rectangle(width / 2, -barHeight / 2, width, barHeight, 0x000000);
    topBar.setName('letterbox_top');
    topBar.setDepth(2000);
  }

  if (!bottomBar) {
    bottomBar = scene.add.rectangle(width / 2, height + barHeight / 2, width, barHeight, 0x000000);
    bottomBar.setName('letterbox_bottom');
    bottomBar.setDepth(2000);
  }

  if (show) {
    scene.tweens.add({
      targets: topBar,
      y: barHeight / 2,
      duration: duration,
      ease: 'Power2.easeOut'
    });
    scene.tweens.add({
      targets: bottomBar,
      y: height - barHeight / 2,
      duration: duration,
      ease: 'Power2.easeOut'
    });
  } else {
    scene.tweens.add({
      targets: topBar,
      y: -barHeight / 2,
      duration: duration,
      ease: 'Power2.easeIn'
    });
    scene.tweens.add({
      targets: bottomBar,
      y: height + barHeight / 2,
      duration: duration,
      ease: 'Power2.easeIn'
    });
  }

  return { top: topBar, bottom: bottomBar };
}

/**
 * Urgency vignette - pulsing red vignette for time pressure
 */
export function createUrgencyVignette(
  scene: Phaser.Scene,
  intensity: number = 0.5
): { update: (urgency: number) => void; destroy: () => void } {
  const { width, height } = scene.cameras.main;

  const vignette = scene.add.graphics();
  vignette.setDepth(950);

  let pulsePhase = 0;
  let currentUrgency = 0;

  const update = (urgency: number) => {
    currentUrgency = urgency;
    pulsePhase += 0.1;

    vignette.clear();

    if (urgency <= 0) return;

    // Pulsing intensity
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
 * Edge pulse - glowing edges that pulse like a heartbeat
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
 * Impact flash at a specific location
 */
export function impactFlash(
  scene: Phaser.Scene,
  x: number,
  y: number,
  color: number = 0xffffff,
  radius: number = 100,
  duration: number = 200
): void {
  const flash = scene.add.circle(x, y, 10, color, 1);
  flash.setDepth(900);

  scene.tweens.add({
    targets: flash,
    radius: radius,
    alpha: 0,
    duration: duration,
    ease: 'Power2.easeOut',
    onComplete: () => flash.destroy()
  });

  // Secondary ring
  const ring = scene.add.circle(x, y, 10, color, 0);
  ring.setStrokeStyle(3, color);
  ring.setDepth(899);

  scene.tweens.add({
    targets: ring,
    radius: radius * 1.5,
    alpha: 0,
    duration: duration * 1.5,
    ease: 'Quad.easeOut',
    onComplete: () => ring.destroy()
  });
}

/**
 * Radial blur effect (simulated with overlays)
 */
export function radialBlur(
  scene: Phaser.Scene,
  x: number,
  y: number,
  intensity: number = 1,
  duration: number = 300
): void {
  const { width, height } = scene.cameras.main;

  // Create radial lines
  const lines = scene.add.graphics();
  lines.setDepth(995);
  lines.setAlpha(0);

  const lineCount = 36;
  const maxLength = Math.max(width, height);

  const drawBlur = (alpha: number, lengthMultiplier: number) => {
    lines.clear();
    lines.lineStyle(2, 0xffffff, alpha * 0.3);

    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const length = maxLength * lengthMultiplier;
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;

      lines.lineBetween(x, y, endX, endY);
    }
  };

  const progress = { value: 0 };

  scene.tweens.add({
    targets: progress,
    value: 1,
    duration: duration,
    ease: 'Power3.easeOut',
    onUpdate: () => {
      const alpha = Math.sin(progress.value * Math.PI) * intensity;
      drawBlur(alpha, progress.value);
      lines.setAlpha(1);
    },
    onComplete: () => lines.destroy()
  });
}

/**
 * Screen shake with direction bias
 */
export function directionalShake(
  scene: Phaser.Scene,
  directionX: number,
  directionY: number,
  intensity: number = 1,
  duration: number = 200
): void {
  const camera = scene.cameras.main;
  const steps = Math.floor(duration / 20);

  for (let i = 0; i < steps; i++) {
    const decay = 1 - (i / steps);
    const time = i * 20;

    scene.time.delayedCall(time, () => {
      // Bias shake in direction of impact
      const biasX = directionX * 3 * decay * intensity;
      const biasY = directionY * 3 * decay * intensity;
      const randomX = (Math.random() - 0.5) * 6 * decay * intensity;
      const randomY = (Math.random() - 0.5) * 6 * decay * intensity;

      camera.setScroll(
        camera.scrollX + biasX + randomX,
        camera.scrollY + biasY + randomY
      );
    });
  }

  scene.time.delayedCall(duration, () => {
    camera.setScroll(0, 0);
  });
}

/**
 * Success screen effect combo
 */
export function successScreenEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tier: 'normal' | 'perfect' | 'legendary' = 'normal'
): void {
  switch (tier) {
    case 'legendary':
      colorFlash(scene, 0xffd700, 'radial', { intensity: 0.9, duration: 400 });
      zoomPunch(scene, 1.08, 200);
      screenWarp(scene, 1.5, x, y);
      scene.time.delayedCall(100, () => {
        chromaticAberration(scene, 8, 400);
      });
      break;

    case 'perfect':
      colorFlash(scene, YAK_COLORS.success, 'solid', { intensity: 0.6, duration: 300 });
      zoomPunch(scene, 1.05, 150);
      slowMotion(scene, 0.5, 300);
      break;

    case 'normal':
    default:
      colorFlash(scene, YAK_COLORS.success, 'solid', { intensity: 0.4, duration: 200 });
      scene.cameras.main.shake(100, 0.008);
      break;
  }
}

/**
 * Fail screen effect combo
 */
export function failScreenEffect(
  scene: Phaser.Scene,
  type: 'miss' | 'blocked' | 'close' = 'miss'
): void {
  switch (type) {
    case 'blocked':
      colorFlash(scene, 0xff8800, 'edges', { intensity: 0.5, duration: 200 });
      scene.cameras.main.shake(150, 0.015);
      break;

    case 'close':
      colorFlash(scene, YAK_COLORS.warning, 'solid', { intensity: 0.3, duration: 150 });
      scene.cameras.main.shake(80, 0.005);
      break;

    case 'miss':
    default:
      colorFlash(scene, YAK_COLORS.danger, 'solid', { intensity: 0.4, duration: 200 });
      scene.cameras.main.shake(120, 0.01);
      break;
  }
}

export const ScreenEffects = {
  zoomPunch,
  vignettePulse,
  colorFlash,
  chromaticAberration,
  screenWarp,
  freezeFrame,
  slowMotion,
  letterbox,
  createUrgencyVignette,
  createEdgePulse,
  impactFlash,
  radialBlur,
  directionalShake,
  successScreenEffect,
  failScreenEffect
};

export default ScreenEffects;
