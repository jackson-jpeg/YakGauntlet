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
    } else if (timeMs > 45000) {
      timerText.setColor('#fbbf24');
    }
  }
}

/**
 * Creates the success celebration effect
 */
export function showSuccessEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  onComplete?: () => void
): void {
  // Flash
  scene.cameras.main.flash(400, 100, 255, 100);

  // Confetti burst
  for (let i = 0; i < 30; i++) {
    const colors = [YAK_COLORS.primary, YAK_COLORS.secondary, YAK_COLORS.success, 0x3b82f6, 0xa855f7];
    const particle = scene.add.rectangle(
      x + (Math.random() - 0.5) * 60,
      y + (Math.random() - 0.5) * 60,
      Math.random() * 12 + 4,
      Math.random() * 12 + 4,
      colors[Math.floor(Math.random() * colors.length)]
    ).setDepth(200).setRotation(Math.random() * Math.PI);

    scene.tweens.add({
      targets: particle,
      x: particle.x + (Math.random() - 0.5) * 250,
      y: particle.y + Math.random() * 150 - 200,
      rotation: particle.rotation + Math.PI * 3,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => particle.destroy()
    });
  }

  // Success text
  const text = scene.add.text(GAME_WIDTH / 2, y - 50, message, {
    fontSize: '72px',
    fontFamily: YAK_FONTS.title,
    color: '#4ade80',
    stroke: '#000000',
    strokeThickness: 8
  }).setOrigin(0.5).setDepth(250).setScale(0);

  scene.tweens.add({
    targets: text,
    scale: 1,
    duration: 300,
    ease: 'Back.easeOut',
    onComplete: () => {
      scene.tweens.add({
        targets: text,
        scale: 1.1,
        duration: 500,
        yoyo: true,
        onComplete: () => {
          if (onComplete) onComplete();
        }
      });
    }
  });
}

/**
 * Creates the fail/miss effect
 */
export function showFailEffect(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string
): void {
  scene.cameras.main.shake(150, 0.01);

  const text = scene.add.text(x, y - 30, message, {
    fontSize: '48px',
    fontFamily: YAK_FONTS.title,
    color: '#ef4444',
    stroke: '#000000',
    strokeThickness: 5
  }).setOrigin(0.5).setDepth(200);

  scene.tweens.add({
    targets: text,
    y: text.y - 60,
    alpha: 0,
    scale: 1.2,
    duration: 700,
    ease: 'Power2',
    onComplete: () => text.destroy()
  });
}
