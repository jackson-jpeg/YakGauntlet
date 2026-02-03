/**
 * SceneTransitions - Smooth transitions between scenes and stations
 * Station intros, wipes, TV-style cuts, dramatic transitions
 */

import { YAK_COLORS, STATIONS, YAK_FONTS } from '../config/theme';
import { colorFlash, zoomPunch } from './ScreenEffects';
import { popIn, slamIn, typeText } from './JuiceFactory';

export interface StationConfig {
  name: string;
  color: number;
  emoji: string;
  id: string;
}

export interface TransitionConfig {
  duration?: number;
  color?: number;
  onComplete?: () => void;
}

/**
 * Play station intro animation when entering a new station
 * Dramatic entrance with station name, color flash, and icon
 */
export function playStationIntro(
  scene: Phaser.Scene,
  stationIndex: number,
  onComplete?: () => void
): void {
  const station = STATIONS[stationIndex] || { name: 'STATION', color: YAK_COLORS.primary, emoji: '🎯' };
  const { width, height } = scene.cameras.main;

  // 1. Black overlay
  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 1);
  overlay.setDepth(2000);

  // 2. Station name (starts off screen)
  const stationName = scene.add.text(width / 2, height / 2 - 30, station.name, {
    fontSize: '72px',
    fontFamily: YAK_FONTS.title,
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5).setDepth(2001).setAlpha(0);

  // 3. Station emoji/icon
  const emoji = scene.add.text(width / 2, height / 2 + 50, station.emoji, {
    fontSize: '64px'
  }).setOrigin(0.5).setDepth(2001).setAlpha(0).setScale(0);

  // 4. Station number badge
  const badge = scene.add.text(width / 2, height / 2 - 100, `STATION ${stationIndex + 1}`, {
    fontSize: '24px',
    fontFamily: YAK_FONTS.title,
    color: '#888888'
  }).setOrigin(0.5).setDepth(2001).setAlpha(0);

  // Animation sequence
  scene.time.delayedCall(100, () => {
    // Slam in station name from top
    slamIn(scene, stationName, 'top', { duration: 400, distance: 300 });

    // Screen shake on slam
    scene.time.delayedCall(350, () => {
      scene.cameras.main.shake(100, 0.02);
    });
  });

  scene.time.delayedCall(300, () => {
    // Fade in badge
    scene.tweens.add({
      targets: badge,
      alpha: 1,
      duration: 200
    });
  });

  scene.time.delayedCall(500, () => {
    // Pop in emoji
    popIn(scene, emoji, { duration: 300 });
  });

  scene.time.delayedCall(600, () => {
    // Color flash in station color
    colorFlash(scene, station.color, 'radial', { intensity: 0.6, duration: 300 });
  });

  // 5. Fade out overlay
  scene.time.delayedCall(1200, () => {
    scene.tweens.add({
      targets: [overlay, stationName, emoji, badge],
      alpha: 0,
      duration: 400,
      ease: 'Power2.easeIn',
      onComplete: () => {
        overlay.destroy();
        stationName.destroy();
        emoji.destroy();
        badge.destroy();
        onComplete?.();
      }
    });
  });
}

/**
 * Quick station intro (shorter version for replays)
 */
export function playQuickStationIntro(
  scene: Phaser.Scene,
  stationIndex: number,
  onComplete?: () => void
): void {
  const station = STATIONS[stationIndex] || { name: 'STATION', color: YAK_COLORS.primary, emoji: '🎯' };
  const { width, height } = scene.cameras.main;

  // Quick flash with station name
  const nameText = scene.add.text(width / 2, height / 2, station.name, {
    fontSize: '64px',
    fontFamily: YAK_FONTS.title,
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 4
  }).setOrigin(0.5).setDepth(2001).setAlpha(0).setScale(1.5);

  colorFlash(scene, station.color, 'solid', { intensity: 0.4, duration: 200 });

  scene.tweens.add({
    targets: nameText,
    alpha: 1,
    scale: 1,
    duration: 200,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.time.delayedCall(300, () => {
        scene.tweens.add({
          targets: nameText,
          alpha: 0,
          scale: 0.8,
          duration: 200,
          onComplete: () => {
            nameText.destroy();
            onComplete?.();
          }
        });
      });
    }
  });
}

/**
 * Wipe transition - horizontal wipe
 */
export function wipeLeft(
  scene: Phaser.Scene,
  nextSceneKey: string,
  config: TransitionConfig = {}
): void {
  const { duration = 500, color = 0x000000 } = config;
  const { width, height } = scene.cameras.main;

  const wipe = scene.add.rectangle(width + width / 2, height / 2, width, height, color);
  wipe.setDepth(3000);

  scene.tweens.add({
    targets: wipe,
    x: width / 2,
    duration: duration * 0.5,
    ease: 'Power2.easeIn',
    onComplete: () => {
      scene.scene.start(nextSceneKey);
    }
  });
}

/**
 * Wipe transition - right to left
 */
export function wipeRight(
  scene: Phaser.Scene,
  nextSceneKey: string,
  config: TransitionConfig = {}
): void {
  const { duration = 500, color = 0x000000 } = config;
  const { width, height } = scene.cameras.main;

  const wipe = scene.add.rectangle(-width / 2, height / 2, width, height, color);
  wipe.setDepth(3000);

  scene.tweens.add({
    targets: wipe,
    x: width / 2,
    duration: duration * 0.5,
    ease: 'Power2.easeIn',
    onComplete: () => {
      scene.scene.start(nextSceneKey);
    }
  });
}

/**
 * Circle wipe (iris out) transition
 */
export function wipeCircle(
  scene: Phaser.Scene,
  nextSceneKey: string,
  config: TransitionConfig = {}
): void {
  const { duration = 600, color = 0x000000 } = config;
  const { width, height } = scene.cameras.main;
  const maxRadius = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2) + 50;

  // Create mask circle
  const maskCircle = scene.add.circle(width / 2, height / 2, maxRadius, 0xffffff);
  maskCircle.setVisible(false);

  // Create solid overlay
  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, color);
  overlay.setDepth(3000);
  overlay.setAlpha(0);

  // Animate circle shrinking (simulated with expanding overlay)
  const ring = scene.add.graphics();
  ring.setDepth(2999);

  const progress = { value: 0 };

  scene.tweens.add({
    targets: progress,
    value: 1,
    duration: duration,
    ease: 'Power2.easeIn',
    onUpdate: () => {
      ring.clear();

      // Draw expanding ring to create iris effect
      const innerRadius = maxRadius * (1 - progress.value);

      ring.fillStyle(color, 1);
      ring.beginPath();

      // Outer rectangle
      ring.fillRect(0, 0, width, height);

      // Cut out circle (approximated with a hole)
      ring.fillStyle(0x000000, 0);
      ring.fillCircle(width / 2, height / 2, innerRadius);
    },
    onComplete: () => {
      overlay.setAlpha(1);
      ring.destroy();
      scene.scene.start(nextSceneKey);
    }
  });
}

/**
 * TV static transition
 */
export function tvStatic(
  scene: Phaser.Scene,
  nextSceneKey: string,
  config: TransitionConfig = {}
): void {
  const { duration = 400 } = config;
  const { width, height } = scene.cameras.main;

  const static_ = scene.add.graphics();
  static_.setDepth(3000);

  let frame = 0;
  const staticTimer = scene.time.addEvent({
    delay: 30,
    callback: () => {
      frame++;
      static_.clear();

      // Draw random static
      for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
          const brightness = Math.random();
          const gray = Math.floor(brightness * 255);
          static_.fillStyle(Phaser.Display.Color.GetColor(gray, gray, gray), 1);
          static_.fillRect(x, y, 4, 4);
        }
      }

      if (frame >= duration / 30) {
        staticTimer.remove();
        static_.destroy();
        scene.scene.start(nextSceneKey);
      }
    },
    loop: true
  });
}

/**
 * Channel change transition (quick flash cut)
 */
export function channelChange(
  scene: Phaser.Scene,
  nextSceneKey: string,
  config: TransitionConfig = {}
): void {
  const { duration = 200 } = config;
  const { width, height } = scene.cameras.main;

  // Quick black flash
  const flash = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000);
  flash.setDepth(3000);
  flash.setAlpha(0);

  scene.tweens.add({
    targets: flash,
    alpha: 1,
    duration: duration * 0.3,
    ease: 'Power3.easeIn',
    onComplete: () => {
      // Brief static
      const static_ = scene.add.graphics();
      static_.setDepth(3001);

      for (let y = 0; y < height; y += 8) {
        for (let x = 0; x < width; x += 8) {
          const gray = Math.floor(Math.random() * 255);
          static_.fillStyle(Phaser.Display.Color.GetColor(gray, gray, gray), 1);
          static_.fillRect(x, y, 8, 8);
        }
      }

      scene.time.delayedCall(duration * 0.2, () => {
        static_.destroy();
        scene.scene.start(nextSceneKey);
      });
    }
  });
}

/**
 * Zoom through transition (zoom into black)
 */
export function zoomThrough(
  scene: Phaser.Scene,
  nextSceneKey: string,
  config: TransitionConfig = {}
): void {
  const { duration = 500 } = config;
  const { width, height } = scene.cameras.main;
  const camera = scene.cameras.main;

  // Zoom in rapidly
  scene.tweens.add({
    targets: camera,
    zoom: 5,
    duration: duration,
    ease: 'Power3.easeIn'
  });

  // Fade to black
  const fade = scene.add.rectangle(width / 2, height / 2, width * 2, height * 2, 0x000000);
  fade.setDepth(3000);
  fade.setAlpha(0);

  scene.tweens.add({
    targets: fade,
    alpha: 1,
    duration: duration * 0.8,
    delay: duration * 0.2,
    ease: 'Power2.easeIn',
    onComplete: () => {
      camera.zoom = 1;
      scene.scene.start(nextSceneKey);
    }
  });
}

/**
 * Flash cut transition (white flash)
 */
export function flashCut(
  scene: Phaser.Scene,
  nextSceneKey: string,
  config: TransitionConfig = {}
): void {
  const { duration = 300 } = config;
  const { width, height } = scene.cameras.main;

  const flash = scene.add.rectangle(width / 2, height / 2, width, height, 0xffffff);
  flash.setDepth(3000);
  flash.setAlpha(0);

  scene.tweens.add({
    targets: flash,
    alpha: 1,
    duration: duration * 0.3,
    ease: 'Power4.easeIn',
    onComplete: () => {
      scene.scene.start(nextSceneKey);
    }
  });
}

/**
 * Slide transition with new scene sliding in
 */
export function slideTransition(
  scene: Phaser.Scene,
  nextSceneKey: string,
  direction: 'left' | 'right' | 'up' | 'down',
  config: TransitionConfig = {}
): void {
  const { duration = 600 } = config;
  const { width, height } = scene.cameras.main;

  // Push current scene content
  let offsetX = 0, offsetY = 0;
  switch (direction) {
    case 'left': offsetX = -width; break;
    case 'right': offsetX = width; break;
    case 'up': offsetY = -height; break;
    case 'down': offsetY = height; break;
  }

  scene.tweens.add({
    targets: scene.cameras.main,
    scrollX: -offsetX,
    scrollY: -offsetY,
    duration: duration,
    ease: 'Power2.easeInOut',
    onComplete: () => {
      scene.cameras.main.scrollX = 0;
      scene.cameras.main.scrollY = 0;
      scene.scene.start(nextSceneKey);
    }
  });
}

/**
 * Pixelate transition (scene pixelates then resolves)
 */
export function pixelateTransition(
  scene: Phaser.Scene,
  nextSceneKey: string,
  config: TransitionConfig = {}
): void {
  const { duration = 600 } = config;
  const { width, height } = scene.cameras.main;

  // Simulate pixelation with colored blocks
  const pixels = scene.add.graphics();
  pixels.setDepth(3000);
  pixels.setAlpha(0);

  const blockSize = 32;
  const colors = [0x1a1a2e, 0x16213e, 0x0f3460, 0x533483];

  // Draw random colored blocks
  for (let y = 0; y < height; y += blockSize) {
    for (let x = 0; x < width; x += blockSize) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      pixels.fillStyle(color, 1);
      pixels.fillRect(x, y, blockSize, blockSize);
    }
  }

  scene.tweens.add({
    targets: pixels,
    alpha: 1,
    duration: duration * 0.5,
    ease: 'Power2.easeIn',
    onComplete: () => {
      scene.scene.start(nextSceneKey);
    }
  });
}

/**
 * Countdown transition (3, 2, 1, GO!)
 */
export function countdownTransition(
  scene: Phaser.Scene,
  onComplete: () => void,
  config: { startFrom?: number; showGo?: boolean } = {}
): void {
  const { startFrom = 3, showGo = true } = config;
  const { width, height } = scene.cameras.main;

  const numbers = [];
  for (let i = startFrom; i >= 1; i--) {
    numbers.push(String(i));
  }
  if (showGo) numbers.push('GO!');

  let index = 0;

  const showNumber = () => {
    if (index >= numbers.length) {
      onComplete();
      return;
    }

    const num = numbers[index];
    const isGo = num === 'GO!';
    const color = isGo ? YAK_COLORS.success : YAK_COLORS.secondary;

    const text = scene.add.text(width / 2, height / 2, num, {
      fontSize: isGo ? '96px' : '128px',
      fontFamily: YAK_FONTS.title,
      color: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(2500).setScale(0).setAlpha(0);

    // Pop in
    scene.tweens.add({
      targets: text,
      scale: 1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Hold then shrink
        scene.time.delayedCall(isGo ? 400 : 600, () => {
          scene.tweens.add({
            targets: text,
            scale: 0.5,
            alpha: 0,
            duration: 200,
            ease: 'Power2.easeIn',
            onComplete: () => {
              text.destroy();
              index++;
              showNumber();
            }
          });
        });
      }
    });

    // Pulse camera
    zoomPunch(scene, 1.03, 100);
  };

  showNumber();
}

/**
 * Results reveal transition (for ResultScene)
 */
export function resultsReveal(
  scene: Phaser.Scene,
  onComplete?: () => void
): void {
  const { width, height } = scene.cameras.main;

  // Dramatic build-up
  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.9);
  overlay.setDepth(2000);

  // "RESULTS" text
  const resultsText = scene.add.text(width / 2, height / 2, 'RESULTS', {
    fontSize: '80px',
    fontFamily: YAK_FONTS.title,
    color: '#ffc107',
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5).setDepth(2001).setScale(0);

  // Build up
  scene.tweens.add({
    targets: resultsText,
    scale: 1.2,
    duration: 600,
    ease: 'Elastic.easeOut'
  });

  // Flash and reveal
  scene.time.delayedCall(800, () => {
    colorFlash(scene, 0xffc107, 'radial', { intensity: 0.8, duration: 300 });

    scene.tweens.add({
      targets: [overlay, resultsText],
      alpha: 0,
      duration: 400,
      ease: 'Power2.easeOut',
      onComplete: () => {
        overlay.destroy();
        resultsText.destroy();
        onComplete?.();
      }
    });
  });
}

/**
 * Victory celebration transition
 */
export function victoryCelebration(
  scene: Phaser.Scene,
  rank: number,
  onComplete?: () => void
): void {
  const { width, height } = scene.cameras.main;

  let message = '';
  let color = YAK_COLORS.success;

  if (rank === 1) {
    message = '🏆 CHAMPION! 🏆';
    color = 0xffd700;
  } else if (rank <= 3) {
    message = '🥈 TOP 3! 🥉';
    color = 0xc0c0c0;
  } else if (rank <= 10) {
    message = '⭐ TOP 10! ⭐';
    color = YAK_COLORS.secondary;
  } else {
    message = 'COMPLETE!';
  }

  const overlay = scene.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.8);
  overlay.setDepth(2000);

  const text = scene.add.text(width / 2, height / 2, message, {
    fontSize: '56px',
    fontFamily: YAK_FONTS.title,
    color: '#ffffff',
    stroke: '#000000',
    strokeThickness: 6
  }).setOrigin(0.5).setDepth(2001).setScale(0);

  // Dramatic reveal
  scene.tweens.add({
    targets: text,
    scale: 1,
    duration: 500,
    ease: 'Back.easeOut'
  });

  colorFlash(scene, color, 'radial', { intensity: 0.5, duration: 400 });

  scene.time.delayedCall(2000, () => {
    scene.tweens.add({
      targets: [overlay, text],
      alpha: 0,
      duration: 400,
      onComplete: () => {
        overlay.destroy();
        text.destroy();
        onComplete?.();
      }
    });
  });
}

export const SceneTransitions = {
  playStationIntro,
  playQuickStationIntro,
  wipeLeft,
  wipeRight,
  wipeCircle,
  tvStatic,
  channelChange,
  zoomThrough,
  flashCut,
  slideTransition,
  pixelateTransition,
  countdownTransition,
  resultsReveal,
  victoryCelebration
};

export default SceneTransitions;
