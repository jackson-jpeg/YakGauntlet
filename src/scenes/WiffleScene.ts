import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, getRandomSuccess, createStoolIcon } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { createSceneUI, updateTimer, showSuccessEffect, showFailEffect, type SceneUI } from '../utils/UIHelper';
import { getCharacterQuote } from '../data/characterQuotes';
import { createStudioBackground } from '../utils/StudioAtmosphere';
import { AudioSystem } from '../utils/AudioSystem';
import type { CharacterId } from '../types';

export class WiffleScene extends Phaser.Scene {
  // Ball
  private ball!: Phaser.GameObjects.Container;
  private ballShadow!: Phaser.GameObjects.Ellipse;
  private ballActive = false;
  private ballProgress = 0;

  // Bat
  private bat!: Phaser.GameObjects.Container;
  private isSwinging = false;

  // Sweet spot indicator
  private sweetSpot!: Phaser.GameObjects.Container;
  private sweetSpotRing!: Phaser.GameObjects.Arc;

  // Trail
  private trail!: Phaser.GameObjects.Graphics;
  private trailPoints: { x: number; y: number; scale: number }[] = [];

  // UI
  private ui!: SceneUI;
  private instructionText!: Phaser.GameObjects.Text;
  private timingText!: Phaser.GameObjects.Text;
  private missCount = 0;

  // Ball path (bezier curve points)
  private pitchStart = { x: GAME_WIDTH / 2, y: 320 };
  private pitchEnd = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 120 };
  private pitchControl = { x: GAME_WIDTH / 2, y: 520 };

  constructor() {
    super({ key: 'WiffleScene' });
  }

  create(): void {
    // Initialize audio
    AudioSystem.init();

    this.createBackground();
    this.trail = this.add.graphics().setDepth(45);
    this.createSweetSpot();
    this.createBat();
    this.createBall();

    // Unified UI header (station 2 = wiffle)
    this.ui = createSceneUI(this, 2, 'Strikes');

    // Instruction text
    this.instructionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, 'TAP TO SWING!', {
      fontSize: '26px',
      fontFamily: YAK_FONTS.title,
      color: '#ffca28',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: this.instructionText,
      scale: 1.08,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    // Timing feedback text
    this.timingText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 300, '', {
      fontSize: '32px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(150).setAlpha(0);

    // Tap to swing
    this.input.on('pointerdown', () => this.trySwing());

    // Entrance effects
    this.cameras.main.fadeIn(400, 0, 0, 0);
    AudioSystem.playBeep(1.1);

    // Start first pitch
    this.time.delayedCall(1500, () => this.throwPitch());
  }

  private createBackground(): void {
    // Studio atmosphere
    createStudioBackground(this);

    // Sky gradient (over studio)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x4a90d9, 0x4a90d9, 0x87ceeb, 0x87ceeb, 0.7);
    sky.fillRect(0, 0, GAME_WIDTH, 480);

    // Clouds
    this.createCloud(80, 200);
    this.createCloud(350, 240);
    this.createCloud(480, 180);

    // Sun
    this.add.circle(480, 220, 50, 0xfff176, 0.9);
    this.add.circle(480, 220, 70, 0xfff176, 0.2);

    // Grass field
    this.add.rectangle(GAME_WIDTH / 2, 720, GAME_WIDTH, 520, 0x2e8b57);

    // Grass stripes
    for (let i = 0; i < 10; i++) {
      const y = 480 + i * 55;
      const shade = i % 2 === 0 ? 0x3cb371 : 0x2e8b57;
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 55, shade);
    }

    // Outfield fence
    this.add.rectangle(GAME_WIDTH / 2, 370, GAME_WIDTH, 8, 0x8b4513).setDepth(2);
    this.add.rectangle(GAME_WIDTH / 2, 360, GAME_WIDTH, 60, 0x228b22).setDepth(1);

    // Fence posts
    for (let x = 30; x < GAME_WIDTH; x += 80) {
      this.add.rectangle(x, 360, 6, 70, 0x654321).setDepth(3);
    }

    // Pitcher's area
    this.add.ellipse(GAME_WIDTH / 2, 410, 100, 40, 0xc19a6b);
    this.createPitcher();

    // Home plate dirt
    this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 100, 250, 120, 0xc19a6b).setDepth(1);

    // Home plate
    const plate = this.add.polygon(GAME_WIDTH / 2, GAME_HEIGHT - 80, [
      0, -15, 15, -8, 15, 8, -15, 8, -15, -8
    ], 0xffffff).setDepth(5);
    plate.setStrokeStyle(2, 0x888888);
  }

  private createCloud(x: number, y: number): void {
    const cloud = this.add.container(x, y);
    [
      { dx: 0, dy: 0, r: 30 },
      { dx: -25, dy: 8, r: 22 },
      { dx: 25, dy: 8, r: 22 },
      { dx: -12, dy: -10, r: 20 },
      { dx: 12, dy: -10, r: 20 },
    ].forEach(c => {
      cloud.add(this.add.circle(c.dx, c.dy, c.r, 0xffffff, 0.95));
    });
  }

  private createPitcher(): void {
    const p = this.add.container(GAME_WIDTH / 2, 400).setDepth(10).setScale(0.5);

    // Shadow
    p.add(this.add.ellipse(0, 45, 50, 15, 0x000000, 0.3));

    // Legs
    p.add(this.add.rectangle(-8, 32, 14, 30, 0xeeeeee));
    p.add(this.add.rectangle(8, 32, 14, 30, 0xeeeeee));

    // Body - Yak red
    const body = this.add.rectangle(0, 5, 40, 45, YAK_COLORS.primary);
    body.setStrokeStyle(2, YAK_COLORS.primaryDark);
    p.add(body);

    // Arms
    p.add(this.add.rectangle(-25, 5, 14, 40, YAK_COLORS.primary));
    p.add(this.add.rectangle(25, 5, 14, 40, YAK_COLORS.primary));

    // Head
    p.add(this.add.circle(0, -28, 16, 0xffdbac));

    // Cap - Yak red
    p.add(this.add.ellipse(0, -38, 30, 10, YAK_COLORS.primary));
    p.add(this.add.rectangle(0, -42, 28, 10, YAK_COLORS.primary));

    // Idle bob
    this.tweens.add({
      targets: p,
      y: 398,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createSweetSpot(): void {
    const zoneY = GAME_HEIGHT - 220;

    this.sweetSpot = this.add.container(GAME_WIDTH / 2, zoneY).setDepth(40);

    // Outer glow ring
    this.sweetSpotRing = this.add.circle(0, 0, 70, YAK_COLORS.successBright, 0);
    this.sweetSpotRing.setStrokeStyle(6, YAK_COLORS.successBright, 0.5);
    this.sweetSpot.add(this.sweetSpotRing);

    // Inner target
    const inner = this.add.circle(0, 0, 50, YAK_COLORS.successBright, 0.15);
    inner.setStrokeStyle(3, YAK_COLORS.successBright, 0.8);
    this.sweetSpot.add(inner);

    // Crosshairs
    const cross = this.add.graphics();
    cross.lineStyle(2, YAK_COLORS.successBright, 0.6);
    cross.moveTo(-60, 0).lineTo(-35, 0);
    cross.moveTo(35, 0).lineTo(60, 0);
    cross.moveTo(0, -60).lineTo(0, -35);
    cross.moveTo(0, 35).lineTo(0, 60);
    cross.strokePath();
    this.sweetSpot.add(cross);

    // Label
    const label = this.add.text(0, 85, 'TAP WHEN BALL IS HERE!', {
      fontSize: '14px',
      fontFamily: YAK_FONTS.title,
      color: '#4ade80',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    this.sweetSpot.add(label);

    // Pulse animation
    this.tweens.add({
      targets: this.sweetSpotRing,
      scale: 1.1,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1
    });
  }

  private createBat(): void {
    this.bat = this.add.container(GAME_WIDTH / 2 + 100, GAME_HEIGHT - 180);
    this.bat.setDepth(100);
    this.bat.setRotation(-0.8);

    // Bat shadow
    this.bat.add(this.add.ellipse(-20, 90, 100, 25, 0x000000, 0.25));

    // Handle
    const handle = this.add.rectangle(0, 60, 12, 45, 0x5d4037);
    handle.setStrokeStyle(2, 0x3e2723);
    this.bat.add(handle);

    // Grip tape
    this.bat.add(this.add.rectangle(0, 75, 14, 25, 0x212121));

    // Barrel - Yak gold
    const barrel = this.add.rectangle(0, 10, 20, 70, YAK_COLORS.secondary);
    barrel.setStrokeStyle(2, YAK_COLORS.secondaryDark);
    this.bat.add(barrel);

    // Barrel end cap
    this.bat.add(this.add.ellipse(0, -27, 20, 10, YAK_COLORS.secondary)
      .setStrokeStyle(2, YAK_COLORS.secondaryDark));

    // Yak logo stripe
    this.bat.add(this.add.rectangle(0, 5, 14, 6, YAK_COLORS.primary));
  }

  private createBall(): void {
    this.ball = this.add.container(this.pitchStart.x, this.pitchStart.y);
    this.ball.setDepth(80);
    this.ball.setScale(0.4);
    this.ball.setVisible(false);

    // Wiffle ball base
    const base = this.add.circle(0, 0, 22, 0xfafafa);
    base.setStrokeStyle(2, 0xbdbdbd);
    this.ball.add(base);

    // Holes pattern
    const holes = this.add.graphics();
    holes.fillStyle(0x9e9e9e, 0.8);
    [
      { x: 0, y: 0 },
      { x: -10, y: -8 }, { x: 10, y: -8 },
      { x: -10, y: 8 }, { x: 10, y: 8 },
    ].forEach(h => {
      holes.fillEllipse(h.x, h.y, 7, 4);
    });
    this.ball.add(holes);

    // Highlight
    this.ball.add(this.add.circle(-7, -7, 5, 0xffffff, 0.7));

    // Shadow
    this.ballShadow = this.add.ellipse(GAME_WIDTH / 2, GAME_HEIGHT - 90, 40, 12, 0x000000, 0.35);
    this.ballShadow.setDepth(4);
    this.ballShadow.setVisible(false);
  }

  private throwPitch(): void {
    if (this.ballActive) return;

    // Randomize pitch slightly
    this.pitchControl.x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 60;
    this.pitchEnd.x = GAME_WIDTH / 2 + (Math.random() - 0.5) * 40;

    this.ball.setPosition(this.pitchStart.x, this.pitchStart.y);
    this.ball.setScale(0.4);
    this.ball.setVisible(true);
    this.ball.setRotation(0);
    this.ball.setAlpha(1);
    this.ballShadow.setVisible(true);

    this.ballActive = true;
    this.ballProgress = 0;
    this.isSwinging = false;
    this.trailPoints = [];

    this.instructionText.setText('TAP TO SWING!');

    GameStateService.startTimer();
  }

  private trySwing(): void {
    if (this.isSwinging || !this.ballActive) return;

    this.isSwinging = true;

    // Audio
    AudioSystem.playWhoosh();

    // Swing animation
    this.tweens.add({
      targets: this.bat,
      rotation: 1.8,
      duration: 120,
      ease: 'Power3',
      onComplete: () => {
        this.checkHit();

        // Return bat
        this.tweens.add({
          targets: this.bat,
          rotation: -0.8,
          duration: 250,
          ease: 'Power2',
          onComplete: () => {
            this.isSwinging = false;
          }
        });
      }
    });

    // Whoosh visual
    const whoosh = this.add.text(this.bat.x - 80, this.bat.y - 20, 'WHOOSH!', {
      fontSize: '18px',
      fontFamily: YAK_FONTS.body,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(120).setAlpha(0.9);

    this.tweens.add({
      targets: whoosh,
      x: whoosh.x - 60,
      alpha: 0,
      duration: 250,
      onComplete: () => whoosh.destroy()
    });
  }

  private checkHit(): void {
    const timing = this.ballProgress;

    if (timing >= 0.60 && timing <= 0.88) {
      const quality = 1 - Math.abs(timing - 0.75) * 4;
      this.handleHit(quality);
    } else if (timing < 0.60) {
      this.showTimingFeedback('TOO EARLY!', '#fbbf24');
    } else {
      this.showTimingFeedback('TOO LATE!', '#ef4444');
    }
  }

  private showTimingFeedback(text: string, color: string): void {
    this.timingText.setText(text);
    this.timingText.setColor(color);
    this.timingText.setAlpha(1);
    this.timingText.setScale(1);

    this.tweens.add({
      targets: this.timingText,
      alpha: 0,
      scale: 1.3,
      y: this.timingText.y - 30,
      duration: 600,
      onComplete: () => {
        this.timingText.y = GAME_HEIGHT - 300;
      }
    });
  }

  private handleHit(quality: number): void {
    this.ballActive = false;
    this.trail.clear();

    // Audio
    AudioSystem.playExplosion();
    this.time.delayedCall(100, () => AudioSystem.playCrowdCheer());

    // Ball flies toward outfield
    const hitPower = 400 + quality * 200;
    const hitAngle = -1.2 + (Math.random() - 0.5) * 0.4;

    this.tweens.add({
      targets: this.ball,
      x: this.ball.x + Math.cos(hitAngle) * hitPower,
      y: this.ball.y + Math.sin(hitAngle) * hitPower,
      scale: 0.15,
      rotation: this.ball.rotation + Math.PI * 8,
      duration: 700,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: this.ballShadow,
      alpha: 0,
      duration: 200
    });

    // Impact flash
    const flash = this.add.circle(this.ball.x, this.ball.y, 35, 0xffffff).setDepth(130);
    this.tweens.add({
      targets: flash,
      scale: 3,
      alpha: 0,
      duration: 250,
      onComplete: () => flash.destroy()
    });

    // Hit sparks
    for (let i = 0; i < 25; i++) {
      const spark = this.add.circle(
        this.ball.x + (Math.random() - 0.5) * 30,
        this.ball.y + (Math.random() - 0.5) * 30,
        Math.random() * 5 + 2,
        [YAK_COLORS.secondary, 0xffffff, YAK_COLORS.warning][Math.floor(Math.random() * 3)]
      ).setDepth(140);

      this.tweens.add({
        targets: spark,
        x: spark.x + (Math.random() - 0.5) * 180,
        y: spark.y - Math.random() * 120 - 50,
        alpha: 0,
        scale: 0,
        duration: 500 + Math.random() * 200,
        onComplete: () => spark.destroy()
      });
    }

    // Screen effects
    this.cameras.main.flash(250, 255, 200, 50);
    this.cameras.main.shake(180, 0.02);

    // Success text
    const hitText = quality > 0.7 ? getRandomSuccess() : 'CONTACT!';

    // Get character quote
    const state = GameStateService.getState();
    const characterId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(characterId, 'success');
    this.showCharacterQuote(quote, YAK_COLORS.success);

    showSuccessEffect(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, hitText, () => {
      AudioSystem.playWhoosh();
      this.scene.start('FootballScene');
    });
  }

  private handleMiss(): void {
    this.missCount++;
    this.ui.missText.setText(`Strikes: ${this.missCount}`);
    GameStateService.recordMiss('wiffle');

    // Audio
    AudioSystem.playFail();

    // Get character quote
    const state = GameStateService.getState();
    const characterId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(characterId, 'miss');
    this.showCharacterQuote(quote, YAK_COLORS.danger);

    showFailEffect(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'STRIKE!');

    this.time.delayedCall(900, () => this.resetPitch());
  }

  private resetPitch(): void {
    this.ball.setVisible(false);
    this.ballShadow.setVisible(false);
    this.ballActive = false;
    this.trailPoints = [];
    this.trail.clear();

    this.instructionText.setText('GET READY...');

    this.time.delayedCall(800, () => this.throwPitch());
  }

  update(): void {
    if (this.ballActive) {
      // Move ball along path
      this.ballProgress += 0.018;

      // Bezier curve interpolation
      const t = this.ballProgress;
      const t1 = 1 - t;

      const x = t1 * t1 * this.pitchStart.x + 2 * t1 * t * this.pitchControl.x + t * t * this.pitchEnd.x;
      const y = t1 * t1 * this.pitchStart.y + 2 * t1 * t * this.pitchControl.y + t * t * this.pitchEnd.y;

      this.ball.setPosition(x, y);

      // Scale increases as ball approaches
      const scale = 0.4 + t * 0.9;
      this.ball.setScale(Math.min(scale, 1.3));

      // Rotation
      this.ball.rotation += 0.12;

      // Shadow
      this.ballShadow.x = x;
      this.ballShadow.setScale(scale * 0.6, scale * 0.25);
      this.ballShadow.setAlpha(0.35 * Math.min(scale, 1));

      // Trail
      this.trailPoints.push({ x, y, scale });
      if (this.trailPoints.length > 10) this.trailPoints.shift();

      this.trail.clear();
      for (let i = 0; i < this.trailPoints.length; i++) {
        const pt = this.trailPoints[i];
        const alpha = (i / this.trailPoints.length) * 0.5;
        const size = (i / this.trailPoints.length) * 12 * pt.scale;
        this.trail.fillStyle(0xffffff, alpha);
        this.trail.fillCircle(pt.x, pt.y, size);
      }

      // Highlight sweet spot when ball is close
      if (t > 0.5 && t < 0.9) {
        this.sweetSpotRing.setStrokeStyle(6, YAK_COLORS.successBright, 0.9);
        if (t > 0.6 && t < 0.85) {
          this.instructionText.setText('NOW!');
          this.instructionText.setColor('#4ade80');
        }
      } else {
        this.sweetSpotRing.setStrokeStyle(6, YAK_COLORS.successBright, 0.5);
        this.instructionText.setColor('#ffca28');
      }

      // Ball passed - miss
      if (t > 1.0) {
        this.ballActive = false;
        this.trail.clear();
        if (!this.isSwinging) {
          this.handleMiss();
        }
      }
    }

    updateTimer(this.ui.timerText);
  }

  private showCharacterQuote(text: string, color: number): void {
    const quoteY = GAME_HEIGHT * 0.3;
    
    // Quote bubble
    const bubble = this.add.graphics();
    bubble.fillStyle(0x1a1a1a, 0.95);
    bubble.fillRoundedRect(GAME_WIDTH / 2 - 100, quoteY - 20, 200, 40, 12);
    bubble.lineStyle(3, color, 1);
    bubble.strokeRoundedRect(GAME_WIDTH / 2 - 100, quoteY - 20, 200, 40, 12);
    bubble.setDepth(200);

    // Quote text
    const quoteText = this.add.text(GAME_WIDTH / 2, quoteY, text, {
      fontSize: '18px',
      fontFamily: YAK_FONTS.title,
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(201);

    // Animate in
    [bubble, quoteText].forEach(obj => {
      obj.setScale(0);
      this.tweens.add({
        targets: obj,
        scale: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    });

    // Auto-hide
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: [bubble, quoteText],
        alpha: 0,
        y: quoteY - 20,
        duration: 300,
        onComplete: () => {
          bubble.destroy();
          quoteText.destroy();
        },
      });
    });
  }

  shutdown(): void {
    // Clean up event handlers
    this.events.removeAllListeners('update');
    this.input.removeAllListeners();
    // Clean up tweens
    this.tweens.killAll();
    // Clean up timers
    this.time.removeAllEvents();
  }
}
