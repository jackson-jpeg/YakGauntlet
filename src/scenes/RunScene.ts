import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, getRandomSuccess, getRandomFail } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { createSceneUI, updateTimer, showSuccessEffect, showFailEffect, type SceneUI } from '../utils/UIHelper';
import { AudioSystem } from '../utils/AudioSystem';
import { ProceduralTextureFactory, DynamicLightingManager } from '../utils/ProceduralTextureFactory';

/**
 * CORNHOLE - Simple beanbag toss
 *
 * MECHANICS:
 * 1. Touch bag at bottom
 * 2. Swipe UP (longer = more power)
 * 3. Bag arcs toward board
 * 4. Hit board = success, in hole = mega success
 */
export class RunScene extends Phaser.Scene {
  // Bag
  private bag!: Phaser.GameObjects.Image;
  private bagStartX = 0;
  private bagStartY = 0;
  private shadow!: Phaser.GameObjects.Ellipse;

  // Physics
  private isFlying = false;
  private bagX = 0;
  private bagY = 0;
  private bagVX = 0;
  private bagVY = 0;

  // Board
  private board!: Phaser.GameObjects.Image;
  private boardX = 0;
  private boardY = 0;
  private holeX = 0;
  private holeY = 0;

  // Input
  private touchStartY = 0;
  private touchStartTime = 0;
  private isTouching = false;

  // Visuals
  private trajectory!: Phaser.GameObjects.Graphics;
  private powerBar!: Phaser.GameObjects.Graphics;

  // UI
  private ui!: SceneUI;
  private instructionText!: Phaser.GameObjects.Text;
  private missCount = 0;
  private readonly MAX_MISSES = 3;

  // Graphics
  private textureFactory!: ProceduralTextureFactory;
  private lightingManager!: DynamicLightingManager;

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    AudioSystem.init();

    // Graphics
    this.textureFactory = new ProceduralTextureFactory(this);
    this.lightingManager = new DynamicLightingManager(this);

    this.createBackground();
    this.lightingManager.enable();

    this.trajectory = this.add.graphics().setDepth(50);
    this.powerBar = this.add.graphics().setDepth(150);

    this.createBoard();
    this.createBag();

    // UI
    this.ui = createSceneUI(this, 0, 'Misses');
    this.instructionText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 120,
      '☝️ SWIPE UP TO TOSS ☝️',
      {
        fontSize: '32px',
        fontFamily: YAK_FONTS.title,
        color: YAK_COLORS.textGold,
        stroke: '#000000',
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setDepth(200);

    // Pulse
    this.tweens.add({
      targets: this.instructionText,
      scale: 1.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Input
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);

    // Entrance
    this.cameras.main.fadeIn(400);
    AudioSystem.playBeep(1.2);
  }

  private createBackground(): void {
    const courtKey = this.textureFactory.createHardwoodCourt(GAME_WIDTH, GAME_HEIGHT);
    const court = this.add.image(0, 0, courtKey).setOrigin(0, 0).setDepth(0);
    this.lightingManager.addToPipeline(court);
  }

  private createBoard(): void {
    // Board at top-middle
    this.boardX = GAME_WIDTH / 2;
    this.boardY = 220;

    // Shadow
    const shadow = this.add.ellipse(this.boardX + 5, this.boardY + 5, 180, 260, 0x000000, 0.4).setDepth(2);
    this.lightingManager.addToPipeline(shadow);

    // Board texture
    const boardKey = this.textureFactory.createCornholeBoard(170, 250);
    this.board = this.add.image(this.boardX, this.boardY, boardKey).setDepth(3);
    this.lightingManager.addToPipeline(this.board);

    // Hole position
    this.holeX = this.boardX;
    this.holeY = this.boardY - 45;

    // Hole glow indicator
    const holeGlow = this.add.circle(this.holeX, this.holeY, 40, YAK_COLORS.secondary, 0);
    holeGlow.setStrokeStyle(5, YAK_COLORS.secondary, 0.7);
    holeGlow.setDepth(4);

    this.tweens.add({
      targets: holeGlow,
      alpha: 0.9,
      scale: 1.1,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });

    // Legs
    const leg1 = this.add.rectangle(this.boardX - 55, this.boardY + 140, 15, 70, 0x5c4033).setDepth(1);
    const leg2 = this.add.rectangle(this.boardX + 55, this.boardY + 140, 15, 70, 0x5c4033).setDepth(1);
    this.lightingManager.addToPipeline(leg1);
    this.lightingManager.addToPipeline(leg2);
  }

  private createBag(): void {
    // Bag starting position (bottom center)
    this.bagStartX = GAME_WIDTH / 2;
    this.bagStartY = GAME_HEIGHT - 90;
    this.bagX = this.bagStartX;
    this.bagY = this.bagStartY;

    // Shadow
    this.shadow = this.add.ellipse(this.bagX, this.bagY + 5, 60, 24, 0x000000, 0.5).setDepth(10);

    // Bag
    const bagKey = this.textureFactory.createBeanbag(28, YAK_COLORS.primary);
    this.bag = this.add.image(this.bagX, this.bagY, bagKey).setDepth(100);
    this.lightingManager.addToPipeline(this.bag);
  }

  // ==================== INPUT ====================

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.isFlying) return;

    // Only touch bottom half of screen
    if (pointer.y > GAME_HEIGHT / 2) {
      this.isTouching = true;
      this.touchStartY = pointer.y;
      this.touchStartTime = Date.now();

      // Visual feedback
      this.tweens.add({
        targets: this.bag,
        scale: 1.2,
        duration: 100,
        ease: 'Back.easeOut',
      });

      AudioSystem.playBeep(0.8);
    }
  }

  private onMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isTouching || this.isFlying) return;

    // Calculate power from swipe distance
    const swipeDistance = this.touchStartY - pointer.y; // Positive = swiping up
    const power = Math.max(0, Math.min(swipeDistance / 3, 100)); // 0-100%

    // Show trajectory
    if (power > 5) {
      this.drawTrajectory(power);
      this.drawPowerBar(power);
      this.instructionText.setText(`POWER: ${Math.floor(power)}%`);
    }
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isTouching || this.isFlying) return;

    this.isTouching = false;
    this.trajectory.clear();
    this.powerBar.clear();

    // Calculate power
    const swipeDistance = this.touchStartY - pointer.y;
    const swipeTime = Date.now() - this.touchStartTime;
    const swipeSpeed = Math.abs(swipeDistance) / Math.max(swipeTime, 1);

    let power = Math.max(0, Math.min(swipeDistance / 3, 100));
    power += swipeSpeed * 30; // Bonus for fast swipes
    power = Math.min(power, 100);

    if (power < 10) {
      // Not enough power
      this.instructionText.setText('☝️ SWIPE UP TO TOSS ☝️');
      this.tweens.add({
        targets: this.bag,
        scale: 1,
        duration: 100,
      });
      return;
    }

    // Start timer on first throw
    GameStateService.startTimer();

    // Launch!
    this.throwBag(power);
  }

  // ==================== TRAJECTORY PREVIEW ====================

  private drawTrajectory(power: number): void {
    this.trajectory.clear();

    // Calculate arc path
    const velocity = power * 0.9;
    const angle = -75; // Upward angle
    const vx = 0;
    const vy = -velocity;

    let px = this.bagX;
    let py = this.bagY;
    let pvx = vx;
    let pvy = vy;
    const gravity = 0.65;

    const points: { x: number; y: number }[] = [];

    for (let i = 0; i < 150; i++) {
      pvy += gravity;
      px += pvx;
      py += pvy;

      if (py > GAME_HEIGHT) break;
      points.push({ x: px, y: py });
    }

    // Draw dotted arc
    let color = YAK_COLORS.success;
    if (power > 60) color = YAK_COLORS.warning;
    if (power > 85) color = YAK_COLORS.danger;

    this.trajectory.lineStyle(8, color, 0.7);

    for (let i = 0; i < points.length - 1; i++) {
      if (i % 3 === 0) {
        this.trajectory.beginPath();
        this.trajectory.moveTo(points[i].x, points[i].y);
        this.trajectory.lineTo(points[i + 1].x, points[i + 1].y);
        this.trajectory.strokePath();
      }
    }

    // Landing marker
    if (points.length > 0) {
      const landing = points[points.length - 1];
      this.trajectory.fillStyle(color, 0.6);
      this.trajectory.fillCircle(landing.x, landing.y, 20);
      this.trajectory.lineStyle(3, 0xffffff, 0.9);
      this.trajectory.strokeCircle(landing.x, landing.y, 20);
    }
  }

  private drawPowerBar(power: number): void {
    this.powerBar.clear();

    const barX = 40;
    const barY = GAME_HEIGHT / 2 - 100;
    const barWidth = 30;
    const barHeight = 200;

    // Background
    this.powerBar.fillStyle(0x000000, 0.7);
    this.powerBar.fillRoundedRect(barX, barY, barWidth, barHeight, 8);

    // Fill
    let color = YAK_COLORS.success;
    if (power > 60) color = YAK_COLORS.warning;
    if (power > 85) color = YAK_COLORS.danger;

    const fillHeight = (barHeight * power) / 100;
    this.powerBar.fillStyle(color, 1);
    this.powerBar.fillRoundedRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight, 8);

    // Border
    this.powerBar.lineStyle(3, YAK_COLORS.secondary, 1);
    this.powerBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 8);

    // Label
    const label = this.add.text(barX + barWidth / 2, barY - 20, 'POWER', {
      fontSize: '14px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(151);

    this.time.delayedCall(100, () => label.destroy());
  }

  // ==================== THROW PHYSICS ====================

  private throwBag(power: number): void {
    this.isFlying = true;
    this.instructionText.setVisible(false);

    // Set velocity
    const velocity = power * 0.9;
    this.bagVX = 0;
    this.bagVY = -velocity;

    // Visual
    this.tweens.add({
      targets: this.bag,
      scale: 1,
      duration: 100,
    });

    AudioSystem.playSwoosh();

    // Physics loop
    this.events.on('update', this.updateBagPhysics, this);
  }

  private updateBagPhysics(): void {
    if (!this.isFlying) return;

    const gravity = 0.65;
    this.bagVY += gravity;

    this.bagX += this.bagVX;
    this.bagY += this.bagVY;

    this.bag.setPosition(this.bagX, this.bagY);
    this.bag.rotation += this.bagVY * 0.015;

    // Shadow (shrinks as bag goes up)
    const groundDist = GAME_HEIGHT - this.bagY;
    const shadowScale = Math.max(0.2, 1 - groundDist / 700);
    this.shadow.setScale(shadowScale);
    this.shadow.setAlpha(shadowScale * 0.5);
    this.shadow.setPosition(this.bagX, GAME_HEIGHT - 85);

    // Check board collision
    if (this.checkBoardHit()) {
      this.onBoardHit();
      return;
    }

    // Check miss
    if (this.bagY > GAME_HEIGHT + 50 || this.bagY < -50) {
      this.onMiss();
    }
  }

  private checkBoardHit(): boolean {
    // Simple box collision - anywhere on board surface
    const boardLeft = this.boardX - 85;
    const boardRight = this.boardX + 85;
    const boardTop = this.boardY - 125;
    const boardBottom = this.boardY + 125;

    return (
      this.bagX > boardLeft &&
      this.bagX < boardRight &&
      this.bagY > boardTop &&
      this.bagY < boardBottom &&
      this.bagVY > 0 // Falling
    );
  }

  private onBoardHit(): void {
    this.events.off('update', this.updateBagPhysics);
    this.isFlying = false;

    // Check if in hole
    const distToHole = Phaser.Math.Distance.Between(this.bagX, this.bagY, this.holeX, this.holeY);

    if (distToHole < 42) {
      this.onHoleIn();
    } else {
      this.onBoardSuccess();
    }
  }

  private onHoleIn(): void {
    AudioSystem.playSuccess();
    this.cameras.main.flash(300, 255, 215, 0);

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '🎯 CORNHOLE! 🎯', {
      fontSize: '68px',
      fontFamily: YAK_FONTS.title,
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(500).setScale(0);

    this.tweens.add({
      targets: text,
      scale: 1.3,
      duration: 400,
      ease: 'Back.easeOut',
    });

    this.time.delayedCall(1500, () => {
      showSuccessEffect(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, getRandomSuccess(), () => {
        this.scene.start('GoalieScene');
      });
    });
  }

  private onBoardSuccess(): void {
    AudioSystem.playBeep(1.3);

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, '✓ ON THE BOARD!', {
      fontSize: '46px',
      fontFamily: YAK_FONTS.title,
      color: YAK_COLORS.textGreen,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(500).setScale(0);

    this.tweens.add({
      targets: text,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });

    this.time.delayedCall(1200, () => {
      showSuccessEffect(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, getRandomSuccess(), () => {
        this.scene.start('GoalieScene');
      });
    });
  }

  private onMiss(): void {
    this.events.off('update', this.updateBagPhysics);
    this.isFlying = false;
    this.missCount++;

    GameStateService.recordMiss('cornhole');
    this.ui.missText.setText(`Misses: ${this.missCount}`);

    AudioSystem.playBeep(0.4);

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'MISS!', {
      fontSize: '52px',
      fontFamily: YAK_FONTS.title,
      color: YAK_COLORS.textRed,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(500).setScale(0);

    this.tweens.add({
      targets: text,
      scale: 1,
      alpha: 0,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => text.destroy(),
    });

    if (this.missCount >= this.MAX_MISSES) {
      this.time.delayedCall(1000, () => {
        showFailEffect(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, getRandomFail(), () => {
          this.scene.start('GoalieScene');
        });
      });
    } else {
      this.time.delayedCall(1000, () => {
        this.resetBag();
      });
    }
  }

  private resetBag(): void {
    this.bagX = this.bagStartX;
    this.bagY = this.bagStartY;
    this.bag.setPosition(this.bagX, this.bagY);
    this.bag.setRotation(0);
    this.bag.setScale(1);

    this.shadow.setPosition(this.bagX, this.bagY + 5);
    this.shadow.setScale(1);
    this.shadow.setAlpha(0.5);

    this.instructionText.setVisible(true);
    this.instructionText.setText('☝️ SWIPE UP TO TOSS ☝️');
  }

  update(): void {
    if (!this.isFlying) {
      updateTimer(this.ui);
    }
  }

  shutdown(): void {
    this.events.removeAllListeners('update');
    this.input.removeAllListeners();
    this.tweens.killAll();
    this.time.removeAllEvents();

    if (this.textureFactory) {
      this.textureFactory.destroy();
    }
    if (this.lightingManager) {
      this.lightingManager.destroy();
    }
  }
}
