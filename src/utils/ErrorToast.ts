import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS } from '../config/theme';

/**
 * ErrorToast - User-visible error notification system
 * Displays non-intrusive toast messages for network/Firebase errors
 */

interface ToastConfig {
  message: string;
  duration?: number;
  type?: 'error' | 'warning' | 'info';
}

/**
 * Shows an error toast notification at the top of the screen
 * Auto-dismisses after the specified duration
 */
export function showErrorToast(
  scene: Phaser.Scene,
  message: string,
  duration: number = 3000
): void {
  showToast(scene, { message, duration, type: 'error' });
}

/**
 * Shows a warning toast notification
 */
export function showWarningToast(
  scene: Phaser.Scene,
  message: string,
  duration: number = 3000
): void {
  showToast(scene, { message, duration, type: 'warning' });
}

/**
 * Shows an info toast notification
 */
export function showInfoToast(
  scene: Phaser.Scene,
  message: string,
  duration: number = 3000
): void {
  showToast(scene, { message, duration, type: 'info' });
}

/**
 * Core toast display function
 */
function showToast(scene: Phaser.Scene, config: ToastConfig): void {
  const { message, duration = 3000, type = 'error' } = config;

  // Color based on type
  const colors = {
    error: { bg: 0xef4444, border: 0xdc2626, text: '#ffffff' },
    warning: { bg: 0xf59e0b, border: 0xd97706, text: '#000000' },
    info: { bg: 0x3b82f6, border: 0x2563eb, text: '#ffffff' },
  };
  const colorScheme = colors[type];

  const toastWidth = Math.min(GAME_WIDTH - 40, 360);
  const toastHeight = 50;
  const startY = -toastHeight;
  const endY = 20;

  // Container for the toast
  const container = scene.add.container(GAME_WIDTH / 2, startY);
  container.setDepth(1000); // Ensure it's on top

  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(colorScheme.bg, 0.95);
  bg.fillRoundedRect(-toastWidth / 2, 0, toastWidth, toastHeight, 8);
  bg.lineStyle(2, colorScheme.border, 1);
  bg.strokeRoundedRect(-toastWidth / 2, 0, toastWidth, toastHeight, 8);
  container.add(bg);

  // Icon based on type
  const icons = {
    error: '!',
    warning: '!',
    info: 'i',
  };
  const icon = scene.add.text(-toastWidth / 2 + 20, toastHeight / 2, icons[type], {
    fontSize: '20px',
    fontFamily: YAK_FONTS.title,
    color: colorScheme.text,
  }).setOrigin(0.5);
  container.add(icon);

  // Message text
  const text = scene.add.text(0, toastHeight / 2, message, {
    fontSize: '14px',
    fontFamily: YAK_FONTS.body,
    color: colorScheme.text,
    wordWrap: { width: toastWidth - 60 },
  }).setOrigin(0.5);
  container.add(text);

  // Slide in animation
  scene.tweens.add({
    targets: container,
    y: endY,
    duration: 300,
    ease: 'Back.easeOut',
    onComplete: () => {
      // Wait, then slide out
      scene.time.delayedCall(duration, () => {
        scene.tweens.add({
          targets: container,
          y: startY,
          duration: 250,
          ease: 'Power2.easeIn',
          onComplete: () => {
            container.destroy();
          },
        });
      });
    },
  });
}

/**
 * Shows a network error toast with a standard message
 */
export function showNetworkErrorToast(scene: Phaser.Scene): void {
  showErrorToast(scene, 'Network error. Playing offline.');
}

/**
 * Shows a Firebase error toast with a standard message
 */
export function showFirebaseErrorToast(scene: Phaser.Scene): void {
  showErrorToast(scene, 'Could not save to leaderboard. Try again later.');
}
