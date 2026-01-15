import Phaser from 'phaser';
import { YAK_COLORS } from '../config/theme';

/**
 * Enhanced visual effects system for 3x better appearance
 */

export class EnhancedVisuals {
  /**
   * Create an epic particle burst with multiple layers
   */
  static createEpicExplosion(
    scene: Phaser.Scene,
    x: number,
    y: number,
    colors: number[] = [YAK_COLORS.primaryBright, YAK_COLORS.secondaryGold, 0xffffff]
  ): void {
    // Outer ring - fast particles
    for (let i = 0; i < 30; i++) {
      const angle = (i / 30) * Math.PI * 2;
      const speed = 200 + Math.random() * 100;
      const particle = scene.add.circle(x, y, 4, colors[i % colors.length], 1);
      particle.setDepth(100);

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0.1,
        duration: 800 + Math.random() * 400,
        ease: 'Cubic.easeOut',
        onComplete: () => particle.destroy(),
      });
    }

    // Inner burst - sparkles
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 100;
      const star = scene.add.star(x, y, 5, 2, 4, colors[i % colors.length], 1);
      star.setDepth(101);

      scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance - 30,
        alpha: 0,
        angle: 360,
        duration: 1000 + Math.random() * 500,
        ease: 'Quad.easeOut',
        onComplete: () => star.destroy(),
      });
    }

    // Center flash
    const flash = scene.add.circle(x, y, 30, 0xffffff, 1);
    flash.setDepth(102);
    scene.tweens.add({
      targets: flash,
      scale: 3,
      alpha: 0,
      duration: 300,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Create floating text with rainbow gradient
   */
  static createFloatingText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    config: {
      fontSize?: number;
      duration?: number;
      color?: string;
      rainbow?: boolean;
    } = {}
  ): Phaser.GameObjects.Text {
    const {
      fontSize = 48,
      duration = 1500,
      color = '#ffffff',
      rainbow = false,
    } = config;

    const textObj = scene.add.text(x, y, text, {
      fontSize: `${fontSize}px`,
      fontFamily: 'Arial Black',
      color: color,
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);
    textObj.setDepth(200);

    if (rainbow) {
      // Rainbow pulse effect
      scene.tweens.add({
        targets: textObj,
        duration: 300,
        repeat: -1,
        yoyo: true,
        onUpdate: () => {
          const hue = (Date.now() % 2000) / 2000;
          textObj.setTint(Phaser.Display.Color.HSVToRGB(hue, 1, 1).color);
        },
      });
    }

    scene.tweens.add({
      targets: textObj,
      y: y - 80,
      scale: 1.3,
      alpha: 0,
      duration: duration,
      ease: 'Back.easeOut',
      onComplete: () => textObj.destroy(),
    });

    return textObj;
  }

  /**
   * Create trail effect for moving objects
   */
  static createTrailEffect(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color: number = YAK_COLORS.primaryBright
  ): void {
    const trail = scene.add.circle(x, y, 6, color, 0.6);
    trail.setDepth(5);

    scene.tweens.add({
      targets: trail,
      scale: 0.1,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
      onComplete: () => trail.destroy(),
    });
  }

  /**
   * Screen shake with intensity control
   */
  static screenShake(
    scene: Phaser.Scene,
    intensity: number = 0.02,
    duration: number = 200
  ): void {
    scene.cameras.main.shake(duration, intensity);
  }

  /**
   * Screen flash with custom color
   */
  static screenFlash(
    scene: Phaser.Scene,
    color: number = 0xffffff,
    duration: number = 200,
    alpha: number = 0.7
  ): void {
    const flash = scene.add.rectangle(
      scene.cameras.main.centerX,
      scene.cameras.main.centerY,
      scene.cameras.main.width,
      scene.cameras.main.height,
      color,
      alpha
    );
    flash.setDepth(1000);
    flash.setScrollFactor(0);

    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration: duration,
      ease: 'Cubic.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Create impact ripple waves
   */
  static createRippleWaves(
    scene: Phaser.Scene,
    x: number,
    y: number,
    count: number = 3,
    color: number = YAK_COLORS.primaryBright
  ): void {
    for (let i = 0; i < count; i++) {
      scene.time.delayedCall(i * 100, () => {
        const circle = scene.add.circle(x, y, 10, color, 0);
        circle.setStrokeStyle(4, color, 1);
        circle.setDepth(50);

        scene.tweens.add({
          targets: circle,
          scale: 8,
          alpha: 0,
          duration: 600,
          ease: 'Cubic.easeOut',
          onComplete: () => circle.destroy(),
        });
      });
    }
  }

  /**
   * Create glowing pulsing aura around object
   */
  static createAura(
    scene: Phaser.Scene,
    target: Phaser.GameObjects.GameObject & { x: number; y: number },
    color: number = YAK_COLORS.secondaryGold
  ): Phaser.GameObjects.Graphics {
    const aura = scene.add.graphics();
    aura.setDepth(-1);

    scene.tweens.add({
      targets: aura,
      duration: 1000,
      repeat: -1,
      yoyo: true,
      onUpdate: () => {
        aura.clear();
        aura.lineStyle(6, color, 0.5);
        aura.strokeCircle(target.x, target.y, 50 + Math.sin(Date.now() / 200) * 10);
      },
    });

    return aura;
  }

  /**
   * Victory celebration effect
   */
  static celebrateVictory(scene: Phaser.Scene): void {
    // Confetti burst
    const centerX = scene.cameras.main.centerX;
    const centerY = scene.cameras.main.height * 0.3;

    for (let i = 0; i < 80; i++) {
      const colors = [
        YAK_COLORS.primaryBright,
        YAK_COLORS.secondaryGold,
        YAK_COLORS.accentPurple,
        YAK_COLORS.accentCyan,
        YAK_COLORS.successGreen,
      ];
      const color = colors[i % colors.length];

      const x = centerX + (Math.random() - 0.5) * 200;
      const y = centerY;

      const confetti = scene.add.rectangle(x, y, 10, 20, color, 1);
      confetti.setDepth(200);

      const targetX = x + (Math.random() - 0.5) * scene.cameras.main.width;
      const targetY = scene.cameras.main.height + 100;

      scene.tweens.add({
        targets: confetti,
        x: targetX,
        y: targetY,
        angle: 360 * (Math.random() > 0.5 ? 1 : -1),
        duration: 2000 + Math.random() * 1000,
        ease: 'Cubic.easeIn',
        onComplete: () => confetti.destroy(),
      });
    }

    // Screen flash sequence
    this.screenFlash(scene, YAK_COLORS.secondaryGold, 100, 0.3);
    scene.time.delayedCall(100, () => {
      this.screenFlash(scene, 0xffffff, 150, 0.2);
    });
  }

  /**
   * Create animated gradient background
   */
  static createGradientBackground(
    scene: Phaser.Scene,
    topColor: number,
    bottomColor: number
  ): Phaser.GameObjects.Graphics {
    const bg = scene.add.graphics();
    bg.fillGradientStyle(topColor, topColor, bottomColor, bottomColor, 1);
    bg.fillRect(0, 0, scene.cameras.main.width, scene.cameras.main.height);
    bg.setDepth(-100);
    return bg;
  }

  /**
   * Slow motion effect
   */
  static slowMotion(
    scene: Phaser.Scene,
    timeScale: number = 0.3,
    duration: number = 500
  ): void {
    scene.time.timeScale = timeScale;

    scene.time.delayedCall(duration, () => {
      scene.time.timeScale = 1;
    });
  }

  /**
   * Create animated border pulse
   */
  static createBorderPulse(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    color: number = YAK_COLORS.primaryBright
  ): Phaser.GameObjects.Graphics {
    const border = scene.add.graphics();
    border.setDepth(100);

    scene.tweens.add({
      targets: border,
      duration: 800,
      repeat: -1,
      yoyo: true,
      onUpdate: (tween) => {
        border.clear();
        const alpha = 0.3 + tween.progress * 0.5;
        const thickness = 3 + tween.progress * 3;
        border.lineStyle(thickness, color, alpha);
        border.strokeRoundedRect(x, y, width, height, 10);
      },
    });

    return border;
  }
}
