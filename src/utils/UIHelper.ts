import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS, TEXT_STYLES } from '../config/theme';
import { GameStateService } from '../services/GameStateService';

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

/**
 * Updates the timer display
 */
export function updateTimer(timerText: Phaser.GameObjects.Text): void {
  const state = GameStateService.getState();
  if (state && state.startTimeMs > 0) {
    const timeMs = GameStateService.getCurrentTimeMs();
    timerText.setText((timeMs / 1000).toFixed(2));

    // Color changes for urgency
    if (timeMs > 60000) {
      timerText.setColor('#ef4444');
      // Pulse effect for critical time
      timerText.setScale(1 + Math.sin(Date.now() / 100) * 0.05);
    } else if (timeMs > 45000) {
      timerText.setColor('#fbbf24');
      timerText.setScale(1);
    } else {
      timerText.setColor('#ffffff');
      timerText.setScale(1);
    }
  }
}

/**
 * Creates the success celebration effect with enhanced animations
 */
export function showSuccessEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  onComplete?: () => void
): void {
  // Enhanced flash with color variation
  scene.cameras.main.flash(400, 100, 255, 100);

  // Ripple effect
  for (let i = 0; i < 3; i++) {
    const ripple = scene.add.circle(x, y, 20, 0x4ade80, 0);
    ripple.setStrokeStyle(4, 0x4ade80, 0.6).setDepth(199);
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

  // Enhanced confetti burst with more variety
  for (let i = 0; i < 40; i++) {
    const colors = [YAK_COLORS.primary, YAK_COLORS.secondary, YAK_COLORS.success, 0x3b82f6, 0xa855f7, 0xff6b35];
    const isCircle = Math.random() > 0.5;
    const size = Math.random() * 10 + 4;
    
    const particle = isCircle
      ? scene.add.circle(
          x + (Math.random() - 0.5) * 80,
          y + (Math.random() - 0.5) * 80,
          size,
          colors[Math.floor(Math.random() * colors.length)],
          0.9
        ).setDepth(200)
      : scene.add.rectangle(
          x + (Math.random() - 0.5) * 80,
          y + (Math.random() - 0.5) * 80,
          size * 2,
          size,
          colors[Math.floor(Math.random() * colors.length)],
          0.9
        ).setDepth(200).setRotation(Math.random() * Math.PI);

    const angle = Math.random() * Math.PI * 2;
    const distance = 150 + Math.random() * 200;
    const targetX = x + Math.cos(angle) * distance;
    const targetY = y + Math.sin(angle) * distance - Math.random() * 100;

    scene.tweens.add({
      targets: particle,
      x: targetX,
      y: targetY,
      rotation: particle.rotation + Math.PI * (4 + Math.random() * 2),
      alpha: 0,
      scale: 0.2,
      duration: 1000 + Math.random() * 500,
      ease: 'Power2',
      onComplete: () => particle.destroy()
    });
  }

  // Enhanced success text with glow
  const text = scene.add.text(GAME_WIDTH / 2, y - 50, message, {
    fontSize: '80px',
    fontFamily: YAK_FONTS.title,
    color: '#4ade80',
    stroke: '#000000',
    strokeThickness: 10,
    shadow: {
      offsetX: 0,
      offsetY: 0,
      color: '#4ade80',
      blur: 20,
      stroke: true,
      fill: true
    }
  }).setOrigin(0.5).setDepth(250).setScale(0);

  // Text glow effect
  const glow = scene.add.text(GAME_WIDTH / 2, y - 50, message, {
    fontSize: '80px',
    fontFamily: YAK_FONTS.title,
    color: '#4ade80',
    alpha: 0.3,
  }).setOrigin(0.5).setDepth(249).setScale(0);

  scene.tweens.add({
    targets: [text, glow],
    scale: 1,
    duration: 300,
    ease: 'Back.easeOut',
    onComplete: () => {
      // Pulse animation
      scene.tweens.add({
        targets: text,
        scale: 1.15,
        duration: 400,
        yoyo: true,
        repeat: 1,
        ease: 'Sine.easeInOut',
        onComplete: () => {
          // Glow pulse
          scene.tweens.add({
            targets: glow,
            scale: 1.3,
            alpha: 0,
            duration: 500,
            onComplete: () => {
              glow.destroy();
              if (onComplete) onComplete();
            }
          });
        }
      });
    }
  });
}

/**
 * Creates the fail/miss effect with enhanced feedback
 */
export function showFailEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string
): void {
  // Enhanced shake
  scene.cameras.main.shake(200, 0.015);

  // Red flash
  scene.cameras.main.flash(150, 239, 68, 68, false, undefined, 0.2);

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

  // Enhanced fail text with shake animation
  const text = scene.add.text(x, y - 30, message, {
    fontSize: '56px',
    fontFamily: YAK_FONTS.title,
    color: '#ef4444',
    stroke: '#000000',
    strokeThickness: 6,
    shadow: {
      offsetX: 0,
      offsetY: 0,
      color: '#ef4444',
      blur: 15,
      stroke: true,
      fill: true
    }
  }).setOrigin(0.5).setDepth(200).setScale(0);

  // Entrance animation with shake
  scene.tweens.add({
    targets: text,
    scale: 1.2,
    duration: 200,
    ease: 'Back.easeOut',
    onComplete: () => {
      // Shake effect
      scene.tweens.add({
        targets: text,
        x: text.x + 5,
        duration: 50,
        yoyo: true,
        repeat: 3,
        ease: 'Sine.easeInOut',
        onComplete: () => {
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
