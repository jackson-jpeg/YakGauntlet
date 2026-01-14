import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_FONTS, YAK_COLORS } from '../config/theme';

/**
 * Enhanced Instruction System
 * Provides dynamic, contextual instructions with hints and animations
 */

export interface InstructionDisplay {
  container: Phaser.GameObjects.Container;
  text: Phaser.GameObjects.Text;
  hint: Phaser.GameObjects.Text | null;
  update: (message: string, hintText?: string) => void;
  showHint: (hintText: string, duration?: number) => void;
  hide: () => void;
}

/**
 * Creates an enhanced instruction display with hint support
 */
export function createInstructionDisplay(
  scene: Phaser.Scene,
  x: number,
  y: number,
  initialText: string,
  options: {
    fontSize?: string;
    showHint?: boolean;
    autoHide?: boolean;
    hideDelay?: number;
  } = {}
): InstructionDisplay {
  const {
    fontSize = '22px',
    showHint = true,
    autoHide = false,
    hideDelay = 0,
  } = options;

  const container = scene.add.container(x, y);
  container.setDepth(100);

  // Background with gradient
  const bg = scene.add.graphics();
  bg.fillStyle(0x000000, 0.7);
  bg.fillRoundedRect(-120, -25, 240, 50, 12);
  bg.lineStyle(2, YAK_COLORS.secondary, 0.6);
  bg.strokeRoundedRect(-120, -25, 240, 50, 12);
  container.add(bg);

  // Main instruction text
  const text = scene.add.text(0, 0, initialText, {
    fontSize,
    fontFamily: YAK_FONTS.title,
    color: YAK_COLORS.textGold,
    stroke: '#000000',
    strokeThickness: 4,
    align: 'center',
  }).setOrigin(0.5);
  container.add(text);

  // Hint text (optional, shown below)
  let hint: Phaser.GameObjects.Text | null = null;
  if (showHint) {
    hint = scene.add.text(0, 35, '', {
      fontSize: '14px',
      fontFamily: YAK_FONTS.body,
      color: '#9ca3af',
      align: 'center',
      fontStyle: 'italic',
    }).setOrigin(0.5).setAlpha(0);
    container.add(hint);
  }

  // Pulse animation
  scene.tweens.add({
    targets: text,
    scale: 1.05,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  });

  // Auto-hide if enabled
  if (autoHide && hideDelay > 0) {
    scene.time.delayedCall(hideDelay, () => {
      scene.tweens.add({
        targets: container,
        alpha: 0,
        duration: 500,
        onComplete: () => container.setVisible(false),
      });
    });
  }

  const update = (message: string, hintText?: string) => {
    text.setText(message);
    
    // Animate text change
    scene.tweens.add({
      targets: text,
      scale: 1.2,
      duration: 100,
      yoyo: true,
      ease: 'Power2',
    });

    if (hintText && hint) {
      hint.setText(hintText);
      scene.tweens.add({
        targets: hint,
        alpha: 0.8,
        duration: 300,
      });
    }
  };

  const showHint = (hintText: string, duration: number = 3000) => {
    if (!hint) return;
    
    hint.setText(hintText);
    scene.tweens.add({
      targets: hint,
      alpha: 0.8,
      y: 35,
      duration: 300,
      ease: 'Power2',
      onComplete: () => {
        scene.tweens.add({
          targets: hint,
          alpha: 0,
          y: 50,
          duration: 300,
          delay: duration,
          ease: 'Power2',
        });
      },
    });
  };

  const hide = () => {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scale: 0.8,
      duration: 300,
      onComplete: () => {
        container.setVisible(false);
      },
    });
  };

  return { container, text, hint, update, showHint, hide };
}

/**
 * Creates a power indicator that shows current power level
 */
export function createPowerIndicator(
  scene: Phaser.Scene,
  x: number,
  y: number
): {
  container: Phaser.GameObjects.Container;
  update: (power: number, maxPower: number) => void;
  show: () => void;
  hide: () => void;
} {
  const container = scene.add.container(x, y);
  container.setDepth(150);
  container.setVisible(false);
  container.setAlpha(0);

  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(0x1a1a1a, 0.9);
  bg.fillRoundedRect(-110, -15, 220, 30, 8);
  bg.lineStyle(2, YAK_COLORS.secondary, 0.8);
  bg.strokeRoundedRect(-110, -15, 220, 30, 8);
  container.add(bg);

  // Power bar background
  const barBg = scene.add.graphics();
  barBg.fillStyle(0x2a2a2a, 1);
  barBg.fillRoundedRect(-105, -10, 210, 20, 6);
  container.add(barBg);

  // Power bar fill
  const barFill = scene.add.graphics();
  container.add(barFill);

  // Power percentage text
  const percentText = scene.add.text(0, 0, '0%', {
    fontSize: '16px',
    fontFamily: YAK_FONTS.title,
    color: '#ffffff',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  container.add(percentText);

  const update = (power: number, maxPower: number) => {
    const percent = Math.min((power / maxPower) * 100, 100);
    percentText.setText(`${Math.round(percent)}%`);

    barFill.clear();
    const fillWidth = 210 * (percent / 100);

    // Color based on power level
    let color = YAK_COLORS.success;
    if (percent > 60) color = YAK_COLORS.warning;
    if (percent > 85) color = YAK_COLORS.danger;

    barFill.fillStyle(color, 1);
    barFill.fillRoundedRect(-105, -10, fillWidth, 20, 6);

    // Glow for high power
    if (percent > 80) {
      barFill.lineStyle(2, color, 0.8);
      barFill.strokeRoundedRect(-105, -10, fillWidth, 20, 6);
    }

    // Update text color
    percentText.setColor(color === YAK_COLORS.success ? '#ffffff' : '#000000');
  };

  const show = () => {
    container.setVisible(true);
    scene.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 200,
      ease: 'Power2',
    });
  };

  const hide = () => {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scale: 0.9,
      duration: 200,
      onComplete: () => {
        container.setVisible(false);
      },
    });
  };

  return { container, update, show, hide };
}

/**
 * Creates a contextual tip that appears after inactivity
 */
export function createContextualTip(
  scene: Phaser.Scene,
  x: number,
  y: number,
  tipText: string,
  delay: number = 5000
): Phaser.GameObjects.Container {
  const tip = scene.add.container(x, y);
  tip.setDepth(200);
  tip.setAlpha(0);

  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(0x1a1a1a, 0.95);
  bg.fillRoundedRect(-100, -20, 200, 40, 10);
  bg.lineStyle(2, YAK_COLORS.secondary, 0.8);
  bg.strokeRoundedRect(-100, -20, 200, 40, 10);
  tip.add(bg);

  // Tip icon
  const icon = scene.add.text(-80, 0, '💡', {
    fontSize: '20px',
  }).setOrigin(0.5);
  tip.add(icon);

  // Tip text
  const text = scene.add.text(0, 0, tipText, {
    fontSize: '14px',
    fontFamily: YAK_FONTS.body,
    color: '#ffffff',
    align: 'center',
  }).setOrigin(0.5);
  tip.add(text);

  // Show after delay
  scene.time.delayedCall(delay, () => {
    scene.tweens.add({
      targets: tip,
      alpha: 1,
      y: y - 10,
      duration: 400,
      ease: 'Power2',
      onComplete: () => {
        // Pulse animation
        scene.tweens.add({
          targets: tip,
          y: y - 15,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });
  });

  return tip;
}
