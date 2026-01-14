import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, getRandomSuccess, getRandomFail, PHYSICS } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { createSceneUI, updateTimer, showSuccessEffect, showFailEffect, type SceneUI } from '../utils/UIHelper';
import { createConfetti, createRipple, shakeCamera, flashScreen } from '../utils/VisualEffects';

export class RunScene extends Phaser.Scene {
  // Beanbag container
  private bagContainer!: Phaser.GameObjects.Container;
  private bagShadow!: Phaser.GameObjects.Ellipse;

  // Graphics
  private aimLine!: Phaser.GameObjects.Graphics;
  private trajectoryDots!: Phaser.GameObjects.Graphics;
  private trail!: Phaser.GameObjects.Graphics;

  // Input state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private hasLaunched = false;

  // UI elements
  private ui!: SceneUI;
  private instructionText!: Phaser.GameObjects.Text;
  private missCount = 0;

  // Board/hole positions
  private holeX = 0;
  private holeY = 0;
  private holeRadius = 45;
  private spawnX = 0;
  private spawnY = 0;

  // Trail
  private trailPoints: { x: number; y: number }[] = [];

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    GameStateService.initNewRun();

    this.createBackground();

    // Graphics layers
    this.trail = this.add.graphics().setDepth(5);
    this.aimLine = this.add.graphics().setDepth(50);
    this.trajectoryDots = this.add.graphics().setDepth(51);

    this.createBoard();
    this.createBeanbag();

    // Unified UI header (station 0 = cornhole)
    this.ui = createSceneUI(this, 0, 'Misses');

    // Custom instruction text for this scene
    this.instructionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'DRAG TO AIM & THROW', {
      fontSize: '22px',
      fontFamily: YAK_FONTS.title,
      color: '#f1c40f',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: this.instructionText,
      scale: 1.05,
      duration: 500,
      yoyo: true,
      repeat: -1,
    });

    // Input handlers
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  private createBackground(): void {
    // Sky gradient
    const skyGradient = this.add.graphics();
    skyGradient.fillGradientStyle(0x87ceeb, 0x87ceeb, 0x4a90d9, 0x4a90d9, 1);
    skyGradient.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT - 100);

    // Clouds
    this.createCloud(80, 180);
    this.createCloud(400, 220);
    this.createCloud(280, 160);

    // Sun
    this.add.circle(450, 200, 40, 0xfff176, 0.9);
    this.add.circle(450, 200, 55, 0xfff176, 0.2);

    // Grass
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 50, GAME_WIDTH, 100, 0x228b22);

    // Grass texture lines
    const grassLines = this.add.graphics();
    grassLines.lineStyle(2, 0x1e7b1e, 0.3);
    for (let i = 0; i < GAME_WIDTH; i += 20) {
      grassLines.beginPath();
      grassLines.moveTo(i, GAME_HEIGHT - 100);
      grassLines.lineTo(i + 10, GAME_HEIGHT);
      grassLines.strokePath();
    }

    // Grass highlight
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT - 98, GAME_WIDTH, 4, 0x32cd32);
  }

  private createCloud(x: number, y: number): void {
    const cloud = this.add.container(x, y);
    [
      { dx: 0, dy: 0, r: 25 },
      { dx: -20, dy: 5, r: 18 },
      { dx: 20, dy: 5, r: 18 },
      { dx: -10, dy: -8, r: 16 },
      { dx: 10, dy: -8, r: 16 },
    ].forEach(c => {
      cloud.add(this.add.circle(c.dx, c.dy, c.r, 0xffffff, 0.9));
    });
  }

  private createBoard(): void {
    const boardX = GAME_WIDTH / 2;
    const boardY = 420;
    const boardWidth = 160;
    const boardHeight = 260;

    // Board legs
    this.add.rectangle(boardX - 50, boardY + 150, 15, 60, 0x654321).setDepth(1);
    this.add.rectangle(boardX + 50, boardY + 150, 15, 60, 0x654321).setDepth(1);

    // Ground shadow
    this.add.ellipse(boardX, GAME_HEIGHT - 85, 200, 35, 0x000000, 0.2).setDepth(1);

    // Board shadow
    this.add.rectangle(boardX + 8, boardY + 8, boardWidth, boardHeight, 0x000000, 0.3).setDepth(2);

    // Main board
    const board = this.add.rectangle(boardX, boardY, boardWidth, boardHeight, 0xdeb887).setDepth(3);
    board.setStrokeStyle(4, 0x8b4513);

    // Wood grain
    const grain = this.add.graphics().setDepth(4);
    grain.lineStyle(1, 0xd2a679, 0.5);
    for (let i = -boardHeight/2 + 20; i < boardHeight/2; i += 15) {
      grain.beginPath();
      grain.moveTo(boardX - boardWidth/2 + 8, boardY + i);
      grain.lineTo(boardX + boardWidth/2 - 8, boardY + i + (Math.random() - 0.5) * 4);
      grain.strokePath();
    }

    // The hole
    this.holeX = boardX;
    this.holeY = boardY - 50;
    this.holeRadius = 44;

    // Hole depth shadow
    this.add.circle(this.holeX + 3, this.holeY + 3, this.holeRadius, 0x000000, 0.5).setDepth(5);

    // Hole rim
    this.add.circle(this.holeX, this.holeY, this.holeRadius + 5, 0x8b4513).setDepth(6);

    // Hole dark
    this.add.circle(this.holeX, this.holeY, this.holeRadius, 0x1a1a1a).setDepth(7);
    this.add.circle(this.holeX, this.holeY, this.holeRadius - 8, 0x0a0a0a).setDepth(8);

    // Target glow animation
    const targetGlow = this.add.circle(this.holeX, this.holeY, this.holeRadius + 10, YAK_COLORS.success, 0);
    targetGlow.setStrokeStyle(4, YAK_COLORS.success, 0.4).setDepth(4);

    this.tweens.add({
      targets: targetGlow,
      scale: 1.3,
      alpha: 0,
      duration: 1200,
      repeat: -1,
    });
  }

  private createBeanbag(): void {
    this.spawnX = GAME_WIDTH / 2;
    this.spawnY = GAME_HEIGHT - 160;

    // Shadow
    this.bagShadow = this.add.ellipse(this.spawnX, GAME_HEIGHT - 95, 45, 18, 0x000000, 0.35);
    this.bagShadow.setDepth(10);

    // Container for bag
    this.bagContainer = this.add.container(this.spawnX, this.spawnY);
    this.bagContainer.setDepth(100);

    // Bag body - Yak Red
    const bagBody = this.add.rectangle(0, 0, 52, 52, YAK_COLORS.primary);
    bagBody.setStrokeStyle(3, YAK_COLORS.primaryDark);

    // Fabric shading
    const bagShading = this.add.graphics();
    bagShading.fillStyle(0xff6b6b, 0.3);
    bagShading.fillRect(-26, -26, 26, 52);

    // Cross stitching (gold - Yak branding)
    const stitching = this.add.graphics();
    stitching.lineStyle(2.5, YAK_COLORS.secondary, 0.9);
    stitching.beginPath();
    stitching.moveTo(-20, 0);
    stitching.lineTo(20, 0);
    stitching.moveTo(0, -20);
    stitching.lineTo(0, 20);
    stitching.strokePath();

    // Corner dots
    stitching.fillStyle(YAK_COLORS.secondary, 0.7);
    [[-18, -18], [18, -18], [-18, 18], [18, 18]].forEach(([x, y]) => {
      stitching.fillCircle(x, y, 3);
    });

    this.bagContainer.add([bagShading, bagBody, stitching]);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.hasLaunched) return;
    this.isDragging = true;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging || this.hasLaunched) return;

    const dx = pointer.x - this.dragStartX;
    const dy = pointer.y - this.dragStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.aimLine.clear();
    this.trajectoryDots.clear();

    if (distance < 20) {
      this.instructionText.setText('DRAG TO AIM & THROW');
      return;
    }

    const power = Math.min(distance / 8, 35);
    const vx = (dx / distance) * power * 0.4;
    const vy = (dy / distance) * power;

    // Trajectory preview
    const gravity = 0.4;
    let px = this.bagContainer.x;
    let py = this.bagContainer.y;
    let pvx = vx;
    let pvy = vy;

    for (let i = 0; i < 50; i++) {
      px += pvx;
      pvy += gravity;
      py += pvy;

      if (py > GAME_HEIGHT + 50 || py < -50) break;

      if (i % 3 === 0) {
        const alpha = 0.8 - (i / 60);
        const size = 6 - (i / 12);
        this.trajectoryDots.fillStyle(0xffffff, alpha);
        this.trajectoryDots.fillCircle(px, py, Math.max(size, 2));
      }
    }

    // Power indicator colors
    const powerPercent = Math.min((power / 35) * 100, 100);
    let color = YAK_COLORS.success;
    if (powerPercent > 50) color = YAK_COLORS.warning;
    if (powerPercent > 80) color = YAK_COLORS.danger;

    // Aim line
    this.aimLine.lineStyle(4, color, 0.9);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.bagContainer.x, this.bagContainer.y);
    const lineLen = Math.min(distance * 0.8, 120);
    const endX = this.bagContainer.x + (dx / distance) * lineLen;
    const endY = this.bagContainer.y + (dy / distance) * lineLen;
    this.aimLine.lineTo(endX, endY);
    this.aimLine.strokePath();

    // Arrow head
    const angle = Math.atan2(dy, dx);
    this.aimLine.fillStyle(color, 0.9);
    this.aimLine.fillTriangle(
      endX + Math.cos(angle) * 10,
      endY + Math.sin(angle) * 10,
      endX + Math.cos(angle + 2.5) * 10,
      endY + Math.sin(angle + 2.5) * 10,
      endX + Math.cos(angle - 2.5) * 10,
      endY + Math.sin(angle - 2.5) * 10
    );

    this.instructionText.setText(`POWER: ${Math.round(powerPercent)}%`);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging || this.hasLaunched) return;

    this.isDragging = false;
    this.aimLine.clear();
    this.trajectoryDots.clear();

    const dx = pointer.x - this.dragStartX;
    const dy = pointer.y - this.dragStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 20) {
      this.instructionText.setText('DRAG TO AIM & THROW');
      return;
    }

    this.hasLaunched = true;
    this.instructionText.setVisible(false);
    GameStateService.startTimer();

    const power = Math.min(distance / 8, 35);
    const vx = (dx / distance) * power * 0.4;
    const vy = (dy / distance) * power;

    this.launchBag(vx, vy);
  }

  private launchBag(vx: number, vy: number): void {
    let velocityX = vx;
    let velocityY = vy;
    const gravity = PHYSICS.GRAVITY_NORMAL;
    const friction = PHYSICS.FRICTION_MEDIUM;
    const bounce = PHYSICS.BOUNCE_LOW;

    this.trailPoints = [];
    this.trail.clear();

    const updateHandler = () => {
      if (!this.hasLaunched) {
        this.events.off('update', updateHandler);
        return;
      }

      velocityY += gravity;
      velocityX *= friction;
      velocityY *= friction;

      this.bagContainer.x += velocityX;
      this.bagContainer.y += velocityY;
      this.bagContainer.rotation += velocityX * 0.03;

      // Update shadow
      this.bagShadow.x = this.bagContainer.x;
      const shadowScale = Math.max(0.3, 1 - (GAME_HEIGHT - 95 - this.bagContainer.y) / 500);
      this.bagShadow.setScale(shadowScale, shadowScale * 0.4);
      this.bagShadow.setAlpha(0.35 * shadowScale);

      // Trail
      this.trailPoints.push({ x: this.bagContainer.x, y: this.bagContainer.y });
      if (this.trailPoints.length > 30) this.trailPoints.shift();

      this.trail.clear();
      for (let i = 1; i < this.trailPoints.length; i++) {
        const alpha = (i / this.trailPoints.length) * 0.5;
        const size = (i / this.trailPoints.length) * 10;
        this.trail.fillStyle(YAK_COLORS.primary, alpha);
        this.trail.fillCircle(this.trailPoints[i].x, this.trailPoints[i].y, size);
      }

      // Bounds
      if (this.bagContainer.x < 30) {
        this.bagContainer.x = 30;
        velocityX = -velocityX * bounce;
      }
      if (this.bagContainer.x > GAME_WIDTH - 30) {
        this.bagContainer.x = GAME_WIDTH - 30;
        velocityX = -velocityX * bounce;
      }

      // Hole check
      const distToHole = Phaser.Math.Distance.Between(
        this.bagContainer.x, this.bagContainer.y,
        this.holeX, this.holeY
      );

      if (distToHole < this.holeRadius - 10) {
        this.events.off('update', updateHandler);
        this.handleSuccess();
        return;
      }

      // Board collision
      const boardTop = 420 - 130;
      const boardBottom = 420 + 130;
      const boardLeft = GAME_WIDTH/2 - 80;
      const boardRight = GAME_WIDTH/2 + 80;

      if (this.bagContainer.x > boardLeft && this.bagContainer.x < boardRight &&
          this.bagContainer.y > boardTop && this.bagContainer.y < boardBottom) {
        if (distToHole > this.holeRadius + 15) {
          if (velocityY > 0) {
            velocityY = -velocityY * 0.15;
            velocityX *= 0.6;
          }
        }
      }

      // Ground
      if (this.bagContainer.y > GAME_HEIGHT - 100) {
        this.events.off('update', updateHandler);
        this.handleMiss();
        return;
      }

      // Stopped
      const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      if (speed < 0.5 && this.bagContainer.y > 250) {
        this.events.off('update', updateHandler);
        this.handleMiss();
        return;
      }
    };

    this.events.on('update', updateHandler);
  }

  private handleSuccess(): void {
    this.trail.clear();

    // Visual effects
    flashScreen(this, 'green', 150);
    shakeCamera(this, 'light');
    createRipple(this, this.holeX, this.holeY, {
      color: YAK_COLORS.successBright,
      endRadius: 100,
      duration: 500,
    });
    createConfetti(this, this.holeX, this.holeY, {
      count: 25,
      spread: 120,
      height: 200,
    });

    // Animate into hole
    this.tweens.add({
      targets: this.bagContainer,
      x: this.holeX,
      y: this.holeY,
      scale: 0.2,
      alpha: 0,
      duration: 250,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: this.bagShadow,
      alpha: 0,
      duration: 250
    });

    // Success effect
    showSuccessEffect(this, this.holeX, this.holeY, getRandomSuccess(), () => {
      this.scene.start('GoalieScene');
    });
  }

  private handleMiss(): void {
    this.missCount++;
    this.ui.missText.setText(`Misses: ${this.missCount}`);
    GameStateService.recordMiss('cornhole');

    // Visual feedback
    shakeCamera(this, 'light');
    createRipple(this, this.bagContainer.x, this.bagContainer.y, {
      color: YAK_COLORS.danger,
      endRadius: 60,
      duration: 400,
    });

    showFailEffect(this, this.bagContainer.x, this.bagContainer.y, getRandomFail());

    this.time.delayedCall(600, () => this.resetBeanbag());
  }

  private resetBeanbag(): void {
    this.hasLaunched = false;
    this.trailPoints = [];
    this.trail.clear();

    this.bagContainer.setPosition(this.spawnX, this.spawnY);
    this.bagContainer.setRotation(0);
    this.bagContainer.setScale(1);
    this.bagContainer.setAlpha(1);

    this.bagShadow.setPosition(this.spawnX, GAME_HEIGHT - 95);
    this.bagShadow.setScale(1, 0.4);
    this.bagShadow.setAlpha(0.35);

    this.instructionText.setVisible(true);
    this.instructionText.setText('DRAG TO AIM & THROW');
  }

  update(): void {
    updateTimer(this.ui.timerText);
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
