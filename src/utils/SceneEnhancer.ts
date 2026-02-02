import Phaser from 'phaser';
import { YAK_COLORS, YAK_FONTS, getPowerColor } from '../config/theme';
import { AudioSystem } from './AudioSystem';
import { EnhancedVisuals } from './EnhancedVisuals';

/**
 * Power meter container with update method
 */
export interface PowerMeterContainer extends Phaser.GameObjects.Container {
  updatePower: (power: number) => void;
}

/**
 * Unified scene enhancement system for AAA polish
 */

export class SceneEnhancer {
  /**
   * Create a professional gradient background for a scene
   */
  static createPremiumBackground(
    scene: Phaser.Scene,
    topColor: number = 0x1a1a2e,
    bottomColor: number = 0x0f0f1a
  ): Phaser.GameObjects.Graphics {
    const bg = scene.add.graphics();
    bg.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    bg.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);
    bg.setDepth(-100);

    // Add subtle noise texture
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * scene.cameras.main.width;
      const y = Math.random() * scene.cameras.main.height;
      const alpha = Math.random() * 0.05;
      bg.fillStyle(0xffffff, alpha);
      bg.fillCircle(x, y, 1);
    }

    return bg;
  }

  /**
   * Create animated stadium lights
   */
  static createStadiumLights(scene: Phaser.Scene): void {
    const width = scene.cameras.main.width;
    const lightCount = 6;

    for (let i = 0; i < lightCount; i++) {
      const x = (width / (lightCount + 1)) * (i + 1);
      const y = 30;

      // Light pole
      const pole = scene.add.rectangle(x, y + 40, 8, 80, 0x2a2a3a);
      pole.setDepth(1);

      // Light fixture
      const fixture = scene.add.ellipse(x, y, 40, 20, 0x3a3a4a);
      fixture.setDepth(2);

      // Glow effect
      const glow = scene.add.circle(x, y, 20, 0xfef3c7, 0.8);
      glow.setDepth(3);

      // Pulsing animation
      scene.tweens.add({
        targets: glow,
        alpha: 0.5,
        scale: 0.9,
        duration: 1000 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Light beam
      const beam = scene.add.graphics();
      beam.fillStyle(0xfef3c7, 0.03);
      const beamWidth = 120;
      beam.fillTriangle(
        x, y + 10,
        x - beamWidth / 2, scene.cameras.main.height,
        x + beamWidth / 2, scene.cameras.main.height
      );
      beam.setDepth(0);
    }
  }

  /**
   * Create crowd silhouettes
   */
  static createCrowd(scene: Phaser.Scene): void {
    const width = scene.cameras.main.width;
    const height = scene.cameras.main.height;

    // Left side crowd
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 100;
      const y = 100 + Math.random() * (height - 200);
      const size = 3 + Math.random() * 5;
      const person = scene.add.circle(x, y, size, 0x1a1a2e, 0.4);
      person.setDepth(-5);
    }

    // Right side crowd
    for (let i = 0; i < 30; i++) {
      const x = width - (Math.random() * 100);
      const y = 100 + Math.random() * (height - 200);
      const size = 3 + Math.random() * 5;
      const person = scene.add.circle(x, y, size, 0x1a1a2e, 0.4);
      person.setDepth(-5);
    }
  }

  /**
   * Add success feedback (visual + audio)
   */
  static celebrateSuccess(
    scene: Phaser.Scene,
    x: number,
    y: number,
    message: string = 'NICE!'
  ): void {
    // Audio
    AudioSystem.playSuccess();
    scene.time.delayedCall(100, () => AudioSystem.playCrowdCheer());

    // Visual explosion
    EnhancedVisuals.createEpicExplosion(scene, x, y);

    // Floating text
    EnhancedVisuals.createFloatingText(scene, x, y - 50, message, {
      fontSize: 64,
      rainbow: true,
    });

    // Screen effects
    EnhancedVisuals.screenFlash(scene, YAK_COLORS.successGreen, 150, 0.3);
    EnhancedVisuals.screenShake(scene, 0.015, 200);

    // Ripple waves
    EnhancedVisuals.createRippleWaves(scene, x, y, 4, YAK_COLORS.successGreen);
  }

  /**
   * Add fail feedback (visual + audio)
   */
  static celebrateFail(
    scene: Phaser.Scene,
    x: number,
    y: number,
    message: string = 'MISS!'
  ): void {
    // Audio
    AudioSystem.playFail();

    // Visual
    const text = scene.add.text(x, y, message, {
      fontSize: '48px',
      fontFamily: YAK_FONTS.title,
      color: '#ff4444',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);
    text.setDepth(200);

    scene.tweens.add({
      targets: text,
      y: y - 60,
      scale: 0.5,
      alpha: 0,
      duration: 800,
      ease: 'Back.easeIn',
      onComplete: () => text.destroy(),
    });

    // Screen shake (lighter)
    EnhancedVisuals.screenShake(scene, 0.008, 150);
  }

  /**
   * Create premium ball trail effect
   */
  static addBallTrail(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number = YAK_COLORS.primaryBright
  ): void {
    const trail = scene.add.circle(x, y, 8, color, 0.7);
    trail.setDepth(5);
    trail.setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: trail,
      scale: 0.1,
      alpha: 0,
      duration: 500,
      ease: 'Cubic.easeOut',
      onComplete: () => trail.destroy(),
    });
  }

  /**
   * Create target indicator with pulse
   */
  static createTargetIndicator(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number = 50,
    color: number = YAK_COLORS.successGreen
  ): Phaser.GameObjects.Graphics {
    const target = scene.add.graphics();
    target.setDepth(20);

    scene.tweens.add({
      targets: target,
      duration: 800,
      repeat: -1,
      yoyo: true,
      onUpdate: (tween) => {
        target.clear();
        const scale = 1 + tween.progress * 0.2;
        const alpha = 0.6 - tween.progress * 0.3;

        // Outer ring
        target.lineStyle(4, color, alpha);
        target.strokeCircle(x, y, radius * scale);

        // Inner ring
        target.lineStyle(2, color, alpha * 1.5);
        target.strokeCircle(x, y, radius * scale * 0.6);

        // Center dot
        target.fillStyle(color, alpha * 2);
        target.fillCircle(x, y, 4);
      },
    });

    return target;
  }

  /**
   * Create power meter for drag-based controls
   */
  static createPowerMeter(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number = 200
  ): PowerMeterContainer {
    const container = scene.add.container(x, y) as PowerMeterContainer;
    container.setDepth(150);

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.6);
    bg.fillRoundedRect(-width / 2, -15, width, 30, 8);
    bg.lineStyle(2, YAK_COLORS.secondaryGold, 0.8);
    bg.strokeRoundedRect(-width / 2, -15, width, 30, 8);

    // Power bar
    const powerBar = scene.add.graphics();

    // Label
    const label = scene.add.text(0, -35, 'POWER', {
      fontSize: '14px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    container.add([bg, powerBar, label]);

    // Method to update power
    container.updatePower = (power: number) => {
      powerBar.clear();

      const barWidth = (width - 10) * power;
      const color = getPowerColor(power);

      powerBar.fillStyle(color, 0.9);
      powerBar.fillRoundedRect(-width / 2 + 5, -10, barWidth, 20, 5);
    };

    return container;
  }

  /**
   * Add scene transition animation
   */
  static transitionToScene(
    scene: Phaser.Scene,
    nextSceneKey: string,
    transitionType: 'fade' | 'flash' | 'wipe' = 'flash'
  ): void {
    AudioSystem.playWhoosh();

    if (transitionType === 'flash') {
      scene.cameras.main.flash(400, 255, 255, 255);
      scene.time.delayedCall(350, () => {
        scene.scene.start(nextSceneKey);
      });
    } else if (transitionType === 'fade') {
      scene.cameras.main.fadeOut(400, 0, 0, 0);
      scene.cameras.main.once('camerafadeoutcomplete', () => {
        scene.scene.start(nextSceneKey);
      });
    }
  }

  /**
   * Create premium instruction text with icon
   */
  static createInstructionText(
    scene: Phaser.Scene,
    text: string,
    icon: string = '👆'
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(
      scene.cameras.main.centerX,
      scene.cameras.main.height - 100
    );
    container.setDepth(100);

    // Background
    const bg = scene.add.graphics();
    bg.fillStyle(0x000000, 0.75);
    bg.fillRoundedRect(-200, -35, 400, 70, 15);
    bg.lineStyle(3, YAK_COLORS.secondaryGold, 0.9);
    bg.strokeRoundedRect(-200, -35, 400, 70, 15);

    // Icon
    const iconText = scene.add.text(-160, 0, icon, {
      fontSize: '40px',
    }).setOrigin(0.5);

    // Main text
    const mainText = scene.add.text(0, 0, text, {
      fontSize: '20px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5);

    container.add([bg, iconText, mainText]);

    // Pulse animation
    scene.tweens.add({
      targets: container,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    return container;
  }
}
