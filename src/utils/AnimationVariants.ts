import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS } from '../config/theme';

/**
 * Animation Variants
 * Provides variety in success/fail animations for better engagement
 */

export type SuccessStyle = 'burst' | 'spiral' | 'wave' | 'explosion' | 'rainbow';
export type FailStyle = 'shake' | 'collapse' | 'fade' | 'bounce' | 'spin';

/**
 * Create varied success animation
 */
export function createSuccessAnimation(
  scene: Phaser.Scene,
  x: number,
  y: number,
  style: SuccessStyle = 'burst',
  message: string = 'SUCCESS!'
): void {
  switch (style) {
    case 'burst':
      createBurstSuccess(scene, x, y, message);
      break;
    case 'spiral':
      createSpiralSuccess(scene, x, y, message);
      break;
    case 'wave':
      createWaveSuccess(scene, x, y, message);
      break;
    case 'explosion':
      createExplosionSuccess(scene, x, y, message);
      break;
    case 'rainbow':
      createRainbowSuccess(scene, x, y, message);
      break;
  }
}

function createBurstSuccess(scene: Phaser.Scene, x: number, y: number, message: string): void {
  // Radial particle burst
  for (let i = 0; i < 50; i++) {
    const angle = (Math.PI * 2 * i) / 50;
    const distance = 100 + Math.random() * 100;
    const particle = scene.add.circle(
      x,
      y,
      Math.random() * 6 + 3,
      [YAK_COLORS.primary, YAK_COLORS.secondary, YAK_COLORS.success][Math.floor(Math.random() * 3)],
      0.9
    ).setDepth(200);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      alpha: 0,
      scale: 0,
      rotation: Math.PI * 2,
      duration: 800 + Math.random() * 400,
      ease: 'Power2',
      onComplete: () => particle.destroy(),
    });
  }

  createSuccessText(scene, x, y - 50, message, 0x4ade80);
}

function createSpiralSuccess(scene: Phaser.Scene, x: number, y: number, message: string): void {
  // Spiral particle effect
  for (let i = 0; i < 30; i++) {
    const angle = (Math.PI * 2 * i) / 30;
    const spiral = scene.add.circle(x, y, 4, YAK_COLORS.secondary, 0.9).setDepth(200);

    scene.tweens.add({
      targets: spiral,
      x: x + Math.cos(angle) * 150,
      y: y + Math.sin(angle) * 150,
      scale: 0,
      alpha: 0,
      rotation: Math.PI * 4,
      duration: 1000,
      delay: i * 20,
      ease: 'Power2',
      onComplete: () => spiral.destroy(),
    });
  }

  createSuccessText(scene, x, y - 50, message, YAK_COLORS.secondary);
}

function createWaveSuccess(scene: Phaser.Scene, x: number, y: number, message: string): void {
  // Expanding wave rings
  for (let i = 0; i < 3; i++) {
    const ring = scene.add.circle(x, y, 20, YAK_COLORS.success, 0).setDepth(199);
    ring.setStrokeStyle(4, YAK_COLORS.success, 0.8);

    scene.tweens.add({
      targets: ring,
      radius: 200,
      alpha: 0,
      duration: 600,
      delay: i * 150,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
  }

  // Particles along wave
  for (let i = 0; i < 20; i++) {
    const angle = (Math.PI * 2 * i) / 20;
    const particle = scene.add.circle(x, y, 3, YAK_COLORS.success, 0.9).setDepth(200);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * 150,
      y: y + Math.sin(angle) * 150,
      alpha: 0,
      scale: 0,
      duration: 600,
      delay: Math.random() * 200,
      ease: 'Power2',
      onComplete: () => particle.destroy(),
    });
  }

  createSuccessText(scene, x, y - 50, message, YAK_COLORS.success);
}

function createExplosionSuccess(scene: Phaser.Scene, x: number, y: number, message: string): void {
  // Multi-stage explosion
  const colors = [YAK_COLORS.primary, YAK_COLORS.secondary, YAK_COLORS.success, 0x3b82f6, 0xa855f7];
  
  for (let stage = 0; stage < 3; stage++) {
    for (let i = 0; i < 15; i++) {
      const angle = (Math.PI * 2 * i) / 15 + stage * 0.2;
      const distance = 50 + stage * 50;
      const particle = scene.add.rectangle(
        x,
        y,
        Math.random() * 8 + 4,
        Math.random() * 8 + 4,
        colors[Math.floor(Math.random() * colors.length)],
        0.9
      ).setDepth(200).setRotation(Math.random() * Math.PI);

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        rotation: particle.rotation + Math.PI * 2,
        duration: 500 + stage * 200,
        delay: stage * 100,
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  createSuccessText(scene, x, y - 50, message, YAK_COLORS.primary);
}

function createRainbowSuccess(scene: Phaser.Scene, x: number, y: number, message: string): void {
  // Rainbow particle effect
  const rainbowColors = [0xff0000, 0xff7f00, 0xffff00, 0x00ff00, 0x0000ff, 0x4b0082, 0x9400d3];
  
  for (let i = 0; i < 40; i++) {
    const angle = (Math.PI * 2 * i) / 40;
    const color = rainbowColors[i % rainbowColors.length];
    const particle = scene.add.circle(x, y, 5, color, 0.9).setDepth(200);

    scene.tweens.add({
      targets: particle,
      x: x + Math.cos(angle) * 120,
      y: y + Math.sin(angle) * 120,
      alpha: 0,
      scale: 0,
      duration: 700,
      delay: i * 10,
      ease: 'Power2',
      onComplete: () => particle.destroy(),
    });
  }

  createSuccessText(scene, x, y - 50, message, 0xffffff);
}

function createSuccessText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  color: number
): void {
  const successText = scene.add.text(x, y, text, {
    fontSize: '64px',
    fontFamily: 'Arial Black',
    color: `#${color.toString(16).padStart(6, '0')}`,
    stroke: '#000000',
    strokeThickness: 6,
  }).setOrigin(0.5).setDepth(250).setScale(0);

  scene.tweens.add({
    targets: successText,
    scale: 1.2,
    duration: 300,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: successText,
        scale: 1,
        y: y - 30,
        alpha: 0,
        duration: 500,
        delay: 400,
        onComplete: () => successText.destroy(),
      });
    },
  });
}

/**
 * Create varied fail animation
 */
export function createFailAnimation(
  scene: Phaser.Scene,
  x: number,
  y: number,
  style: FailStyle = 'shake',
  message: string = 'MISS!'
): void {
  switch (style) {
    case 'shake':
      createShakeFail(scene, x, y, message);
      break;
    case 'collapse':
      createCollapseFail(scene, x, y, message);
      break;
    case 'fade':
      createFadeFail(scene, x, y, message);
      break;
    case 'bounce':
      createBounceFail(scene, x, y, message);
      break;
    case 'spin':
      createSpinFail(scene, x, y, message);
      break;
  }
}

function createShakeFail(scene: Phaser.Scene, x: number, y: number, message: string): void {
  scene.cameras.main.shake(200, 0.015);

  const failText = scene.add.text(x, y, message, {
    fontSize: '56px',
    fontFamily: 'Arial Black',
    color: '#ef4444',
    stroke: '#000000',
    strokeThickness: 6,
  }).setOrigin(0.5).setDepth(200);

  // Shake animation
  scene.tweens.add({
    targets: failText,
    x: x + 10,
    duration: 50,
    yoyo: true,
    repeat: 5,
    ease: 'Sine.easeInOut',
    onComplete: () => {
      scene.tweens.add({
        targets: failText,
        y: y - 60,
        alpha: 0,
        scale: 1.3,
        duration: 500,
        onComplete: () => failText.destroy(),
      });
    },
  });
}

function createCollapseFail(scene: Phaser.Scene, x: number, y: number, message: string): void {
  const failText = scene.add.text(x, y, message, {
    fontSize: '56px',
    fontFamily: 'Arial Black',
    color: '#ef4444',
    stroke: '#000000',
    strokeThickness: 6,
  }).setOrigin(0.5).setDepth(200).setScaleY(1);

  scene.tweens.add({
    targets: failText,
    scaleY: 0,
    duration: 300,
    ease: 'Power2',
    onComplete: () => {
      scene.tweens.add({
        targets: failText,
        alpha: 0,
        y: y - 40,
        duration: 300,
        onComplete: () => failText.destroy(),
      });
    },
  });
}

function createFadeFail(scene: Phaser.Scene, x: number, y: number, message: string): void {
  const failText = scene.add.text(x, y, message, {
    fontSize: '56px',
    fontFamily: 'Arial Black',
    color: '#ef4444',
    stroke: '#000000',
    strokeThickness: 6,
  }).setOrigin(0.5).setDepth(200).setAlpha(0);

  scene.tweens.add({
    targets: failText,
    alpha: 1,
    scale: 1.1,
    duration: 200,
    ease: 'Power2',
    onComplete: () => {
      scene.tweens.add({
        targets: failText,
        alpha: 0,
        scale: 0.9,
        y: y - 50,
        duration: 400,
        onComplete: () => failText.destroy(),
      });
    },
  });
}

function createBounceFail(scene: Phaser.Scene, x: number, y: number, message: string): void {
  const failText = scene.add.text(x, y, message, {
    fontSize: '56px',
    fontFamily: 'Arial Black',
    color: '#ef4444',
    stroke: '#000000',
    strokeThickness: 6,
  }).setOrigin(0.5).setDepth(200).setScale(0);

  scene.tweens.add({
    targets: failText,
    scale: 1.3,
    y: y - 20,
    duration: 200,
    ease: 'Bounce.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: failText,
        scale: 1.1,
        y: y - 10,
        duration: 150,
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          scene.tweens.add({
            targets: failText,
            alpha: 0,
            y: y - 60,
            duration: 400,
            onComplete: () => failText.destroy(),
          });
        },
      });
    },
  });
}

function createSpinFail(scene: Phaser.Scene, x: number, y: number, message: string): void {
  const failText = scene.add.text(x, y, message, {
    fontSize: '56px',
    fontFamily: 'Arial Black',
    color: '#ef4444',
    stroke: '#000000',
    strokeThickness: 6,
  }).setOrigin(0.5).setDepth(200).setScale(0);

  scene.tweens.add({
    targets: failText,
    scale: 1.2,
    rotation: Math.PI * 2,
    duration: 400,
    ease: 'Power2',
    onComplete: () => {
      scene.tweens.add({
        targets: failText,
        alpha: 0,
        scale: 0.8,
        rotation: Math.PI * 4,
        y: y - 60,
        duration: 500,
        onComplete: () => failText.destroy(),
      });
    },
  });
}

/**
 * Get random animation style
 */
export function getRandomSuccessStyle(): SuccessStyle {
  const styles: SuccessStyle[] = ['burst', 'spiral', 'wave', 'explosion', 'rainbow'];
  return styles[Math.floor(Math.random() * styles.length)];
}

export function getRandomFailStyle(): FailStyle {
  const styles: FailStyle[] = ['shake', 'collapse', 'fade', 'bounce', 'spin'];
  return styles[Math.floor(Math.random() * styles.length)];
}
