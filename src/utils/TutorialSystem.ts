import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_FONTS, YAK_COLORS } from '../config/theme';

/**
 * Tutorial System
 * Provides contextual hints and tutorials for first-time players
 */

export interface TutorialStep {
  id: string;
  title: string;
  message: string;
  position: { x: number; y: number };
  highlight?: { x: number; y: number; width: number; height: number };
  action?: string;
  skipable?: boolean;
}

export class TutorialManager {
  private static hasSeenTutorial = false;
  private static tutorialKey = 'yak_gauntlet_tutorial_complete';

  static shouldShowTutorial(): boolean {
    if (typeof localStorage === 'undefined') return false;
    const seen = localStorage.getItem(this.tutorialKey);
    return !seen;
  }

  static markTutorialComplete(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(this.tutorialKey, 'true');
    this.hasSeenTutorial = true;
  }

  static resetTutorial(): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(this.tutorialKey);
    this.hasSeenTutorial = false;
  }
}

/**
 * Creates a tutorial overlay with step-by-step guidance
 */
export function createTutorialOverlay(
  scene: Phaser.Scene,
  steps: TutorialStep[],
  onComplete?: () => void
): {
  container: Phaser.GameObjects.Container;
  next: () => void;
  skip: () => void;
} {
  const container = scene.add.container(0, 0);
  container.setDepth(1000);
  container.setVisible(false);

  let currentStep = 0;

  // Dark overlay
  const overlay = scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH,
    GAME_HEIGHT,
    0x000000,
    0.7
  );
  container.add(overlay);

  // Tutorial panel
  const panel = scene.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2);
  container.add(panel);

  const panelBg = scene.add.graphics();
  panelBg.fillStyle(0x1a1a1a, 0.95);
  panelBg.fillRoundedRect(-200, -150, 400, 300, 16);
  panelBg.lineStyle(3, YAK_COLORS.secondary, 1);
  panelBg.strokeRoundedRect(-200, -150, 400, 300, 16);
  panel.add(panelBg);

  // Title
  const title = scene.add.text(0, -120, '', {
    fontSize: '24px',
    fontFamily: YAK_FONTS.title,
    color: YAK_COLORS.textGold,
    fontStyle: 'bold',
  }).setOrigin(0.5);
  panel.add(title);

  // Message
  const message = scene.add.text(0, -30, '', {
    fontSize: '16px',
    fontFamily: YAK_FONTS.body,
    color: '#ffffff',
    align: 'center',
    wordWrap: { width: 360 },
    lineSpacing: 8,
  }).setOrigin(0.5);
  panel.add(message);

  // Action hint
  const actionHint = scene.add.text(0, 80, '', {
    fontSize: '14px',
    fontFamily: YAK_FONTS.body,
    color: YAK_COLORS.textGold,
    fontStyle: 'italic',
  }).setOrigin(0.5);
  panel.add(actionHint);

  // Progress indicator
  const progress = scene.add.text(0, 120, '', {
    fontSize: '12px',
    fontFamily: YAK_FONTS.body,
    color: '#9ca3af',
  }).setOrigin(0.5);
  panel.add(progress);

  // Skip button
  const skipBtn = scene.add.text(150, -120, 'SKIP', {
    fontSize: '14px',
    fontFamily: YAK_FONTS.title,
    color: '#9ca3af',
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });
  
  skipBtn.on('pointerover', () => skipBtn.setColor('#ffffff'));
  skipBtn.on('pointerout', () => skipBtn.setColor('#9ca3af'));
  skipBtn.on('pointerdown', () => {
    if (steps[currentStep]?.skipable !== false) {
      skip();
    }
  });
  panel.add(skipBtn);

  // Highlight overlay (for pointing to specific areas)
  const highlight = scene.add.graphics();
  highlight.setDepth(999);
  container.add(highlight);

  const updateStep = () => {
    if (currentStep >= steps.length) {
      complete();
      return;
    }

    const step = steps[currentStep];
    title.setText(step.title);
    message.setText(step.message);
    actionHint.setText(step.action || 'Tap anywhere to continue');
    progress.setText(`${currentStep + 1} / ${steps.length}`);

    // Update highlight
    highlight.clear();
    if (step.highlight) {
      const { x, y, width, height } = step.highlight;
      // Draw spotlight effect
      highlight.fillStyle(0x000000, 0.8);
      highlight.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      highlight.clear();
      highlight.fillStyle(0x000000, 0.5);
      highlight.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
      highlight.blendMode = 'ERASE';
      highlight.fillRect(x - width / 2, y - height / 2, width, height);
      highlight.blendMode = 'NORMAL';
    } else {
      highlight.clear();
    }

    // Animate in
    panel.setScale(0);
    scene.tweens.add({
      targets: panel,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
  };

  const next = () => {
    currentStep++;
    updateStep();
  };

  const skip = () => {
    TutorialManager.markTutorialComplete();
    complete();
  };

  const complete = () => {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        container.destroy();
        if (onComplete) onComplete();
      },
    });
  };

  // Show tutorial
  container.setVisible(true);
  updateStep();

  // Click to advance
  overlay.setInteractive({ useHandCursor: true });
  overlay.on('pointerdown', next);

  return { container, next, skip };
}

/**
 * Quick hint tooltip
 */
export function createQuickHint(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  duration: number = 3000
): Phaser.GameObjects.Container {
  const hint = scene.add.container(x, y);
  hint.setDepth(250);

  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(0x1a1a1a, 0.95);
  bg.fillRoundedRect(-80, -20, 160, 40, 8);
  bg.lineStyle(2, YAK_COLORS.secondary, 0.8);
  bg.strokeRoundedRect(-80, -20, 160, 40, 8);
  hint.add(bg);

  // Text
  const hintText = scene.add.text(0, 0, text, {
    fontSize: '14px',
    fontFamily: YAK_FONTS.body,
    color: '#ffffff',
    align: 'center',
  }).setOrigin(0.5);
  hint.add(hintText);

  // Arrow pointing down
  const arrow = scene.add.graphics();
  arrow.fillStyle(0x1a1a1a, 0.95);
  arrow.fillTriangle(-8, 20, 8, 20, 0, 30);
  hint.add(arrow);

  // Animate in
  hint.setAlpha(0);
  hint.setScale(0.8);
  scene.tweens.add({
    targets: hint,
    alpha: 1,
    scale: 1,
    duration: 200,
    ease: 'Power2',
    onComplete: () => {
      // Pulse
      scene.tweens.add({
        targets: hint,
        y: y - 5,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Auto-hide
      scene.time.delayedCall(duration, () => {
        scene.tweens.add({
          targets: hint,
          alpha: 0,
          scale: 0.8,
          y: y - 20,
          duration: 300,
          onComplete: () => hint.destroy(),
        });
      });
    },
  });

  return hint;
}
