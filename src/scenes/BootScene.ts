import Phaser from 'phaser';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebaseConfig';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS } from '../config/theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 25, 320, 50);

    const loadingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'Loading...', {
      fontFamily: YAK_FONTS.body,
      fontSize: '20px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(YAK_COLORS.primary, 1);
      progressBar.fillRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    this.createPlaceholderTextures();
  }

  create(): void {
    // Initialize Firebase
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      this.registry.set('firebase', { app, db });
    } catch (error) {
      console.error('Firebase init error:', error);
    }

    this.createTitleScreen();
  }

  private createTitleScreen(): void {
    // Background gradient
    const bg = this.add.graphics();
    bg.fillGradientStyle(YAK_COLORS.bgDark, YAK_COLORS.bgDark, YAK_COLORS.bgMedium, YAK_COLORS.bgMedium, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle grid pattern for depth
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0xffffff, 0.03);
    for (let x = 0; x < GAME_WIDTH; x += 60) {
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, GAME_HEIGHT);
    }
    for (let y = 0; y < GAME_HEIGHT; y += 60) {
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(GAME_WIDTH, y);
    }
    gridGraphics.strokePath();

    // Animated background particles
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const size = Math.random() * 4 + 2;
      const colors = [YAK_COLORS.primary, YAK_COLORS.secondary, 0x3b82f6, 0x8b5cf6];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const particle = this.add.circle(x, y, size, color, 0.25);

      this.tweens.add({
        targets: particle,
        y: y - 100 - Math.random() * 200,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }

    // Main logo container
    const logoY = 280;

    // "THE" text
    const theText = this.add.text(GAME_WIDTH / 2, logoY - 80, 'THE', {
      fontFamily: YAK_FONTS.title,
      fontSize: '32px',
      color: YAK_COLORS.textWhite,
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setAlpha(0);

    // "YAK" main title with enhanced glow effect
    const yakGlow = this.add.text(GAME_WIDTH / 2, logoY, 'YAK', {
      fontFamily: YAK_FONTS.title,
      fontSize: '120px',
      color: '#e74c3c',
    }).setOrigin(0.5).setAlpha(0.4);

    const yakText = this.add.text(GAME_WIDTH / 2, logoY, 'YAK', {
      fontFamily: YAK_FONTS.title,
      fontSize: '120px',
      color: YAK_COLORS.textWhite,
      stroke: '#c0392b',
      strokeThickness: 10,
    }).setOrigin(0.5).setAlpha(0).setScale(0.9);

    // "GAUNTLET" text
    const gauntletText = this.add.text(GAME_WIDTH / 2, logoY + 80, 'GAUNTLET', {
      fontFamily: YAK_FONTS.title,
      fontSize: '48px',
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setAlpha(0);

    // Station preview icons with emojis
    const iconsY = logoY + 180;
    STATIONS.forEach((station, i) => {
      const iconX = GAME_WIDTH / 2 + (i - 3) * 65;

      // Background circle
      const iconBg = this.add.circle(iconX, iconsY, 24, station.color, 0.9);
      iconBg.setStrokeStyle(3, 0xffffff, 0.6);
      iconBg.setAlpha(0);

      // Emoji icon
      const iconEmoji = this.add.text(iconX, iconsY, station.emoji, {
        fontSize: '28px',
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: [iconBg, iconEmoji],
        alpha: 1,
        y: iconsY - 5,
        duration: 400,
        delay: 800 + i * 100,
        ease: 'Back.easeOut',
      });

      // Subtle float animation
      this.tweens.add({
        targets: [iconBg, iconEmoji],
        y: iconsY - 10,
        duration: 1500 + i * 200,
        yoyo: true,
        repeat: -1,
        delay: 1500 + i * 100,
        ease: 'Sine.easeInOut',
      });
    });

    // Animated entrance
    this.tweens.add({
      targets: theText,
      alpha: 1,
      y: logoY - 70,
      duration: 500,
      delay: 100,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: yakText,
      alpha: 1,
      scale: 1,
      duration: 600,
      delay: 200,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: yakGlow,
      alpha: 0.4,
      duration: 600,
      delay: 200,
      ease: 'Power2',
    });

    this.tweens.add({
      targets: gauntletText,
      alpha: 1,
      y: logoY + 70,
      duration: 500,
      delay: 400,
      ease: 'Power2',
    });

    // Glow pulse animation
    this.tweens.add({
      targets: yakGlow,
      scale: 1.08,
      alpha: 0.2,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      delay: 1000,
      ease: 'Sine.easeInOut',
    });

    // "Start" prompt (device-agnostic)
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const startText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 200,
      isMobile ? 'TAP TO START' : 'CLICK TO START',
      {
        fontFamily: YAK_FONTS.title,
        fontSize: '32px',
        color: YAK_COLORS.textWhite,
        stroke: '#000000',
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: startText,
      alpha: 1,
      duration: 500,
      delay: 1200,
    });

    // Pulsing animation for start text
    this.tweens.add({
      targets: startText,
      scale: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      delay: 1700,
    });

    // Tap indicator ring
    const tapRing = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT - 200, 80, 0xffffff, 0);
    tapRing.setStrokeStyle(3, 0xffffff, 0.3);

    this.tweens.add({
      targets: tapRing,
      scale: 1.5,
      alpha: 0,
      duration: 1500,
      repeat: -1,
      delay: 1500,
    });

    // Tagline
    const tagline = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 120, '7 CHALLENGES. 1 CLOCK. NO EXCUSES.', {
      fontFamily: YAK_FONTS.body,
      fontSize: '14px',
      color: '#9ca3af',
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: tagline,
      alpha: 0.8,
      duration: 500,
      delay: 1500,
    });

    // Start on tap
    this.input.once('pointerdown', () => {
      // Quick flash and transition
      this.cameras.main.flash(200, 255, 255, 255);
      this.time.delayedCall(150, () => {
        this.scene.start('RunScene');
      });
    });
  }

  private createPlaceholderTextures(): void {
    // Beanbag texture
    const beanbagGraphics = this.make.graphics({ x: 0, y: 0 });
    beanbagGraphics.fillStyle(0xc0392b);
    beanbagGraphics.fillRoundedRect(0, 0, 40, 40, 8);
    beanbagGraphics.generateTexture('beanbag', 40, 40);
    beanbagGraphics.destroy();

    // Basketball texture
    const basketballGraphics = this.make.graphics({ x: 0, y: 0 });
    basketballGraphics.fillStyle(0xe67e22);
    basketballGraphics.fillCircle(25, 25, 25);
    basketballGraphics.lineStyle(2, 0x000000);
    basketballGraphics.strokeCircle(25, 25, 25);
    basketballGraphics.beginPath();
    basketballGraphics.moveTo(25, 0);
    basketballGraphics.lineTo(25, 50);
    basketballGraphics.moveTo(0, 25);
    basketballGraphics.lineTo(50, 25);
    basketballGraphics.strokePath();
    basketballGraphics.generateTexture('basketball', 50, 50);
    basketballGraphics.destroy();

    // Soccer ball texture
    const soccerGraphics = this.make.graphics({ x: 0, y: 0 });
    soccerGraphics.fillStyle(0xffffff);
    soccerGraphics.fillCircle(22, 22, 22);
    soccerGraphics.lineStyle(2, 0x000000);
    soccerGraphics.strokeCircle(22, 22, 22);
    soccerGraphics.fillStyle(0x000000);
    soccerGraphics.fillCircle(22, 22, 8);
    soccerGraphics.generateTexture('soccerball', 44, 44);
    soccerGraphics.destroy();

    // Wiffle ball texture
    const wiffleGraphics = this.make.graphics({ x: 0, y: 0 });
    wiffleGraphics.fillStyle(0xffffff);
    wiffleGraphics.fillCircle(20, 20, 20);
    wiffleGraphics.fillStyle(0xcccccc);
    wiffleGraphics.fillCircle(12, 12, 4);
    wiffleGraphics.fillCircle(28, 12, 4);
    wiffleGraphics.fillCircle(12, 28, 4);
    wiffleGraphics.fillCircle(28, 28, 4);
    wiffleGraphics.generateTexture('wiffleball', 40, 40);
    wiffleGraphics.destroy();
  }
}
