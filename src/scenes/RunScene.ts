import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { GAUNTLET_COLORS, YAK_FONTS } from '../config/theme';
import { GAUNTLET_BEANBAG } from '../config/physicsConfig';
import { GameStateService } from '../services/GameStateService';
import { AudioSystem } from '../utils/AudioSystem';
import { ProceduralTextureFactory, DynamicLightingManager } from '../utils/ProceduralTextureFactory';

/**
 * GAUNTLET CORNHOLE - Rapid-fire industrial style
 *
 * MECHANICS:
 * 1. Throw bags as fast as possible (no turn delays)
 * 2. Bags slide on the board
 * 3. Must get 1 bag in the hole to progress (gate)
 * 4. Timer counts UP - speed matters
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
  private isSliding = false;
  private slideVX = 0;
  private slideVY = 0;

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

  // Gauntlet UI
  private timerText!: Phaser.GameObjects.Text;
  private bagsText!: Phaser.GameObjects.Text;
  private instructionText!: Phaser.GameObjects.Text;
  private elapsedMs = 0;
  private timerStarted = false;

  // Gauntlet state
  private bagsInHole = 0;
  private readonly requiredBagsInHole = 1;
  private bagQueue = 10;
  private readonly throwCooldownMs = 150;

  // Graphics
  private textureFactory!: ProceduralTextureFactory;
  private lightingManager!: DynamicLightingManager;

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    AudioSystem.init();

    // Reset state
    this.bagsInHole = 0;
    this.bagQueue = 10;
    this.elapsedMs = 0;
    this.timerStarted = false;
    this.isFlying = false;
    this.isSliding = false;

    // Graphics
    this.textureFactory = new ProceduralTextureFactory(this);
    this.lightingManager = new DynamicLightingManager(this);

    this.createBackground();
    this.lightingManager.enable();

    this.trajectory = this.add.graphics().setDepth(50);
    this.powerBar = this.add.graphics().setDepth(150);

    this.createBoard();
    this.createBag();
    this.createGauntletUI();

    // Input
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);

    // Entrance
    this.cameras.main.fadeIn(400);
    AudioSystem.playBeep(1.2);
  }

  private createBackground(): void {
    // Industrial concrete floor
    const floorKey = this.textureFactory.createConcreteFloor(GAME_WIDTH, GAME_HEIGHT);
    const floor = this.add.image(0, 0, floorKey).setOrigin(0, 0).setDepth(0);
    this.lightingManager.addToPipeline(floor);

    // Studio lights at top
    this.textureFactory.createStudioLights(this, GAME_WIDTH);
  }

  private createBoard(): void {
    // Board at top-middle
    this.boardX = GAME_WIDTH / 2;
    this.boardY = 220;

    // Shadow
    const shadow = this.add.ellipse(this.boardX + 5, this.boardY + 5, 180, 260, 0x000000, 0.5).setDepth(2);
    this.lightingManager.addToPipeline(shadow);

    // Board texture (using worn wood color)
    const boardKey = this.textureFactory.createCornholeBoard(170, 250);
    this.board = this.add.image(this.boardX, this.boardY, boardKey).setDepth(3);
    this.lightingManager.addToPipeline(this.board);

    // Hole position
    this.holeX = this.boardX;
    this.holeY = this.boardY - 45;

    // Hole glow indicator (more subtle for industrial look)
    const holeGlow = this.add.circle(this.holeX, this.holeY, 40, GAUNTLET_COLORS.timerRed, 0);
    holeGlow.setStrokeStyle(3, GAUNTLET_COLORS.timerRed, 0.5);
    holeGlow.setDepth(4);

    this.tweens.add({
      targets: holeGlow,
      alpha: 0.7,
      scale: 1.05,
      duration: 800,
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

    // Bag (red for Gauntlet style)
    const bagKey = this.textureFactory.createBeanbag(28, GAUNTLET_COLORS.bagRed);
    this.bag = this.add.image(this.bagX, this.bagY, bagKey).setDepth(100);
    this.lightingManager.addToPipeline(this.bag);
  }

  private createGauntletUI(): void {
    // Large timer at TOP CENTER (counts UP)
    this.timerText = this.add.text(GAME_WIDTH / 2, 70, '0.00', {
      fontSize: '64px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(200);

    // Bags counter on LEFT
    this.bagsText = this.add.text(30, 70, `BAGS: ${this.bagQueue}`, {
      fontSize: '28px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0, 0.5).setDepth(200);

    // Instruction text
    this.instructionText = this.add.text(
      GAME_WIDTH / 2,
      GAME_HEIGHT - 160,
      'GET ONE IN THE HOLE!',
      {
        fontSize: '36px',
        fontFamily: YAK_FONTS.title,
        color: '#ff3333',
        stroke: '#000000',
        strokeThickness: 6,
      }
    ).setOrigin(0.5).setDepth(200);
  }

  // ==================== INPUT ====================

  private onDown(pointer: Phaser.Input.Pointer): void {
    if (this.isFlying || this.isSliding) return;

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
    if (!this.isTouching || this.isFlying || this.isSliding) return;

    // Calculate power from swipe distance
    const swipeDistance = this.touchStartY - pointer.y; // Positive = swiping up
    const power = Math.max(0, Math.min(swipeDistance / 3, 100)); // 0-100%

    // Show trajectory
    if (power > 5) {
      this.drawTrajectory(power);
      this.drawPowerBar(power);
    }
  }

  private onUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isTouching || this.isFlying || this.isSliding) return;

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
      this.tweens.add({
        targets: this.bag,
        scale: 1,
        duration: 100,
      });
      return;
    }

    // Start timer on first throw
    if (!this.timerStarted) {
      this.timerStarted = true;
      GameStateService.startTimer();
    }

    // Launch!
    this.throwBag(power);
  }

  // ==================== TRAJECTORY PREVIEW ====================

  private drawTrajectory(power: number): void {
    this.trajectory.clear();

    // Calculate arc path
    const velocity = power * 0.9;
    const vx = 0;
    const vy = -velocity;

    let px = this.bagX;
    let py = this.bagY;
    let pvx = vx;
    let pvy = vy;

    const points: { x: number; y: number }[] = [];

    for (let i = 0; i < 150; i++) {
      pvy += GAUNTLET_BEANBAG.gravity;
      px += pvx;
      py += pvy;

      if (py > GAME_HEIGHT) break;
      points.push({ x: px, y: py });
    }

    // Draw dotted arc (industrial gray/red colors)
    let color = 0x888888;
    if (power > 60) color = GAUNTLET_COLORS.timerOrange;
    if (power > 85) color = GAUNTLET_COLORS.timerRed;

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

    // Fill (industrial colors)
    let color = 0x888888;
    if (power > 60) color = GAUNTLET_COLORS.timerOrange;
    if (power > 85) color = GAUNTLET_COLORS.timerRed;

    const fillHeight = (barHeight * power) / 100;
    this.powerBar.fillStyle(color, 1);
    this.powerBar.fillRoundedRect(barX, barY + barHeight - fillHeight, barWidth, fillHeight, 8);

    // Border
    this.powerBar.lineStyle(3, 0x666666, 1);
    this.powerBar.strokeRoundedRect(barX, barY, barWidth, barHeight, 8);
  }

  // ==================== THROW PHYSICS ====================

  private throwBag(power: number): void {
    this.isFlying = true;
    this.bagQueue--;
    this.bagsText.setText(`BAGS: ${this.bagQueue}`);

    // Warning color when bags are low
    if (this.bagQueue <= 3) {
      this.bagsText.setColor('#ff6600');
    }

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

    this.bagVY += GAUNTLET_BEANBAG.gravity;

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

    // Check miss (off screen)
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

    // Check if directly in hole
    const distToHole = Phaser.Math.Distance.Between(this.bagX, this.bagY, this.holeX, this.holeY);

    if (distToHole < 42) {
      this.onHoleIn();
    } else {
      // Start sliding physics
      this.startSliding();
    }
  }

  private startSliding(): void {
    this.isSliding = true;

    // Initial slide velocity based on landing speed
    this.slideVX = this.bagVX * 0.3;
    this.slideVY = GAUNTLET_BEANBAG.boardAngleSlide * 10; // Slide down due to board angle

    AudioSystem.playBeep(0.6);

    this.events.on('update', this.updateSlidePhysics, this);
  }

  private updateSlidePhysics(): void {
    if (!this.isSliding) return;

    // Apply deceleration
    this.slideVX *= GAUNTLET_BEANBAG.slideDeceleration;
    this.slideVY *= GAUNTLET_BEANBAG.slideDeceleration;

    // Board angle pulls bag down
    this.slideVY += GAUNTLET_BEANBAG.boardAngleSlide;

    // Hole pull effect
    const distToHole = Phaser.Math.Distance.Between(this.bagX, this.bagY, this.holeX, this.holeY);
    if (distToHole < GAUNTLET_BEANBAG.holePullRadius) {
      const pullStrength = (1 - distToHole / GAUNTLET_BEANBAG.holePullRadius) * GAUNTLET_BEANBAG.holePullStrength;
      const angleToHole = Math.atan2(this.holeY - this.bagY, this.holeX - this.bagX);
      this.slideVX += Math.cos(angleToHole) * pullStrength * 10;
      this.slideVY += Math.sin(angleToHole) * pullStrength * 10;
    }

    this.bagX += this.slideVX;
    this.bagY += this.slideVY;
    this.bag.setPosition(this.bagX, this.bagY);
    this.bag.rotation += this.slideVX * 0.05;

    // Check if fell in hole while sliding
    if (distToHole < 30) {
      this.events.off('update', this.updateSlidePhysics);
      this.isSliding = false;
      this.onHoleIn();
      return;
    }

    // Check if slid off board
    const boardLeft = this.boardX - 85;
    const boardRight = this.boardX + 85;
    const boardBottom = this.boardY + 125;

    if (this.bagX < boardLeft || this.bagX > boardRight || this.bagY > boardBottom) {
      this.events.off('update', this.updateSlidePhysics);
      this.isSliding = false;
      this.onSlidOff();
      return;
    }

    // Check if stopped
    const speed = Math.sqrt(this.slideVX * this.slideVX + this.slideVY * this.slideVY);
    if (speed < 0.1) {
      this.events.off('update', this.updateSlidePhysics);
      this.isSliding = false;
      this.onStoppedOnBoard();
    }
  }

  private onHoleIn(): void {
    this.bagsInHole++;
    AudioSystem.playSuccess();
    this.cameras.main.flash(300, 255, 100, 100);

    // Animate bag falling into hole
    this.tweens.add({
      targets: this.bag,
      scale: 0.3,
      alpha: 0,
      duration: 300,
      ease: 'Power2',
    });

    if (this.bagsInHole >= this.requiredBagsInHole) {
      // Victory!
      this.handleVictory();
    } else {
      // Spawn next bag quickly
      this.time.delayedCall(this.throwCooldownMs, () => {
        this.spawnReadyBag();
      });
    }
  }

  private onSlidOff(): void {
    // Bag slid off board - animate falling
    this.tweens.add({
      targets: this.bag,
      y: GAME_HEIGHT + 100,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: () => {
        this.spawnReadyBag();
      },
    });
  }

  private onStoppedOnBoard(): void {
    // Bag stopped on board but not in hole - just spawn next
    this.tweens.add({
      targets: this.bag,
      alpha: 0.3,
      duration: 200,
      onComplete: () => {
        this.spawnReadyBag();
      },
    });
  }

  private onMiss(): void {
    this.events.off('update', this.updateBagPhysics);
    this.isFlying = false;

    AudioSystem.playBeep(0.4);

    // Spawn next bag quickly (no fail state in Gauntlet mode)
    this.time.delayedCall(this.throwCooldownMs, () => {
      this.spawnReadyBag();
    });
  }

  private spawnReadyBag(): void {
    if (this.bagQueue <= 0) {
      // Out of bags but didn't complete - give more bags
      this.bagQueue = 5;
      this.bagsText.setText(`BAGS: ${this.bagQueue}`);
      this.bagsText.setColor('#ff3333');
    }

    this.bagX = this.bagStartX;
    this.bagY = this.bagStartY;
    this.bag.setPosition(this.bagX, this.bagY);
    this.bag.setRotation(0);
    this.bag.setScale(1);
    this.bag.setAlpha(1);

    this.shadow.setPosition(this.bagX, this.bagY + 5);
    this.shadow.setScale(1);
    this.shadow.setAlpha(0.5);
  }

  private handleVictory(): void {
    // Stop timer
    const finalTime = this.elapsedMs;

    const text = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'CLEARED!', {
      fontSize: '72px',
      fontFamily: YAK_FONTS.title,
      color: '#00ff00',
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5).setDepth(500).setScale(0);

    this.tweens.add({
      targets: text,
      scale: 1.3,
      duration: 400,
      ease: 'Back.easeOut',
    });

    const timeText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, `TIME: ${(finalTime / 1000).toFixed(2)}s`, {
      fontSize: '36px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(500).setAlpha(0);

    this.tweens.add({
      targets: timeText,
      alpha: 1,
      delay: 300,
      duration: 300,
    });

    this.time.delayedCall(2000, () => {
      this.scene.start('GoalieScene');
    });
  }

  update(_time: number, delta: number): void {
    // Update timer (counts UP)
    if (this.timerStarted && this.bagsInHole < this.requiredBagsInHole) {
      this.elapsedMs += delta;
      const seconds = this.elapsedMs / 1000;
      this.timerText.setText(seconds.toFixed(2));

      // Color escalation based on time
      if (seconds > 30) {
        this.timerText.setColor('#ff3333'); // Red
      } else if (seconds > 20) {
        this.timerText.setColor('#ff6600'); // Orange
      } else if (seconds > 10) {
        this.timerText.setColor('#ffcc00'); // Yellow
      } else {
        this.timerText.setColor('#ffffff'); // White
      }
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
