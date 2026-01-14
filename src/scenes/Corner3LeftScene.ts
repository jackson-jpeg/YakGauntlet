import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, getRandomSuccess, getRandomFail } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { createSceneUI, updateTimer, showSuccessEffect, showFailEffect, type SceneUI } from '../utils/UIHelper';
import { getCharacterQuote } from '../data/characterQuotes';
import { createArenaAtmosphere } from '../utils/StudioAtmosphere';
import type { CharacterId } from '../types';

interface BallState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  spin: number;
}

export class Corner3LeftScene extends Phaser.Scene {
  // Basketball
  private ball!: Phaser.GameObjects.Container;
  private ballShadow!: Phaser.GameObjects.Ellipse;
  private ballState: BallState = { x: 0, y: 0, vx: 0, vy: 0, spin: 0 };
  private readonly BALL_RADIUS = 22;

  // Hoop geometry (mirrored - backboard on right side)
  private readonly BACKBOARD_X = GAME_WIDTH - 140;
  private readonly HOOP_Y = 380;
  private readonly RIM_RADIUS = 30;
  private readonly RIM_THICKNESS = 4;
  private rimCenterX = 0;
  private leftRimCenter = { x: 0, y: 0 };
  private rightRimCenter = { x: 0, y: 0 };

  // Net
  private netGraphics!: Phaser.GameObjects.Graphics;
  private netPoints: { x: number; y: number; vx: number; vy: number }[] = [];
  private readonly NET_SEGMENTS = 8;
  private readonly NET_LENGTH = 50;

  // Graphics
  private aimLine!: Phaser.GameObjects.Graphics;
  private trajectoryDots!: Phaser.GameObjects.Graphics;
  private trail!: Phaser.GameObjects.Graphics;
  private rimGraphics!: Phaser.GameObjects.Graphics;

  // Input state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private hasLaunched = false;

  // UI
  private ui!: SceneUI;
  private instructionText!: Phaser.GameObjects.Text;
  private missCount = 0;

  // Spawn position (left corner)
  private spawnX = 0;
  private spawnY = 0;

  // Trail
  private trailPoints: { x: number; y: number; alpha: number }[] = [];

  // Physics constants
  private readonly GRAVITY = 0.35;
  private readonly AIR_RESISTANCE = 0.995;
  private readonly BOUNCE_DAMPING = 0.7;
  private readonly SPIN_FACTOR = 0.15;

  // Shot tracking
  private hitBackboard = false;
  private rimBounces = 0;
  private passedThroughHoop = false;
  private ballBelowRim = false;

  constructor() {
    super({ key: 'Corner3LeftScene' });
  }

  create(): void {
    // Calculate rim geometry (mirrored - rim extends to left of backboard)
    this.rimCenterX = this.BACKBOARD_X - 35;
    this.leftRimCenter = { x: this.rimCenterX - this.RIM_RADIUS + this.RIM_THICKNESS, y: this.HOOP_Y };
    this.rightRimCenter = { x: this.rimCenterX + this.RIM_RADIUS - this.RIM_THICKNESS, y: this.HOOP_Y };

    this.createBackground();
    this.createCourt();

    this.trail = this.add.graphics().setDepth(5);
    this.aimLine = this.add.graphics().setDepth(50);
    this.trajectoryDots = this.add.graphics().setDepth(51);
    this.rimGraphics = this.add.graphics().setDepth(15);

    this.createHoop();
    this.createNet();
    this.createBasketball();

    // UI
    this.ui = createSceneUI(this, 5, 'Misses');

    this.instructionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'DRAG TO AIM & SHOOT!', {
      fontSize: '20px',
      fontFamily: YAK_FONTS.title,
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(100);

    this.tweens.add({
      targets: this.instructionText,
      scale: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Side indicator (left side)
    this.add.text(25, GAME_HEIGHT / 2, 'LEFT\nCORNER', {
      fontSize: '12px',
      fontFamily: YAK_FONTS.title,
      color: '#ff6b35',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setAngle(-90).setDepth(100);

    // "FINAL SHOT" indicator
    this.add.text(GAME_WIDTH / 2, 140, 'FINAL STATION!', {
      fontSize: '16px',
      fontFamily: YAK_FONTS.title,
      color: '#fbbf24',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(100).setAlpha(0.8);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  private createBackground(): void {
    // Gym walls
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a365d, 0x1a365d, 0x0f172a, 0x0f172a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, 350);

    // Arena lights with glow
    for (let i = 0; i < 5; i++) {
      const x = 60 + i * 110;
      this.add.circle(x, 35, 45, 0xfef3c7, 0.15);
      this.add.circle(x, 35, 30, 0xfef3c7, 0.3);
      this.add.circle(x, 35, 18, 0xfef3c7, 0.9);
      this.add.circle(x, 35, 12, 0xffffff, 0.6);
    }

    // Light beams
    const beams = this.add.graphics();
    beams.fillStyle(0xfef3c7, 0.03);
    for (let i = 0; i < 5; i++) {
      const x = 60 + i * 110;
      beams.fillTriangle(x - 60, 350, x + 60, 350, x, 50);
    }

    // Crowd
    const crowd = this.add.graphics();
    for (let row = 0; row < 3; row++) {
      const rowY = 100 + row * 25;
      for (let i = 0; i < 35; i++) {
        const x = i * 18 + (row % 2) * 9 - 20;
        const height = 20 + Math.random() * 15;
        const colors = [0x1f2937, 0x374151, 0x4b5563, 0x991b1b, 0x1e3a8a];
        crowd.fillStyle(colors[Math.floor(Math.random() * colors.length)], 0.9);
        crowd.fillEllipse(x, rowY, 14, height);
        crowd.fillStyle(0xd4a574, 0.8);
        crowd.fillCircle(x, rowY - height / 2 - 5, 6);
      }
    }
  }

  private createCourt(): void {
    // Court floor
    const court = this.add.graphics();
    court.fillGradientStyle(0xcd853f, 0xdaa520, 0xcd853f, 0xb8860b, 1);
    court.fillRect(0, 300, GAME_WIDTH, GAME_HEIGHT - 300);

    // Wood planks
    const planks = this.add.graphics();
    planks.lineStyle(1, 0x8b7355, 0.4);
    for (let x = 0; x < GAME_WIDTH; x += 35) {
      planks.moveTo(x, 300);
      planks.lineTo(x, GAME_HEIGHT);
    }
    planks.strokePath();

    // Wood grain
    const grain = this.add.graphics();
    grain.lineStyle(1, 0x6b4423, 0.15);
    for (let y = 310; y < GAME_HEIGHT; y += 8) {
      grain.moveTo(0, y + Math.sin(y * 0.1) * 2);
      for (let x = 0; x < GAME_WIDTH; x += 10) {
        grain.lineTo(x, y + Math.sin((y + x) * 0.05) * 3);
      }
    }
    grain.strokePath();

    // Court markings
    const lines = this.add.graphics();
    lines.lineStyle(3, 0xffffff, 0.95);

    // Baseline
    lines.moveTo(0, 355);
    lines.lineTo(GAME_WIDTH, 355);
    lines.strokePath();

    // 3-point arc (mirrored)
    lines.lineStyle(3, 0xffffff, 0.95);
    lines.beginPath();
    lines.arc(this.rimCenterX, 355, 220, Math.PI * 0.08, Math.PI * 0.92, false);
    lines.strokePath();

    // Corner 3-point lines
    lines.moveTo(GAME_WIDTH - 50, 355);
    lines.lineTo(GAME_WIDTH - 50, 580);
    lines.moveTo(50, 355);
    lines.lineTo(50, 580);
    lines.strokePath();

    // Free throw lane
    lines.lineStyle(3, 0xffffff, 0.9);
    lines.strokeRect(this.rimCenterX - 90, 355, 180, 190);

    // Free throw circle
    lines.beginPath();
    lines.arc(this.rimCenterX, 545, 65, 0, Math.PI * 2, false);
    lines.strokePath();

    // Paint area
    const paint = this.add.graphics();
    paint.fillStyle(YAK_COLORS.primary, 0.25);
    paint.fillRect(this.rimCenterX - 90, 355, 180, 190);

    // Restricted area
    lines.lineStyle(2, 0xffffff, 0.7);
    lines.beginPath();
    lines.arc(this.rimCenterX, 355, 45, 0, Math.PI, false);
    lines.strokePath();

    // Center court logo
    this.add.circle(GAME_WIDTH / 2, 720, 70, YAK_COLORS.primary, 0.12);
    this.add.circle(GAME_WIDTH / 2, 720, 50, YAK_COLORS.primary, 0.08);
    this.add.text(GAME_WIDTH / 2, 720, 'YAK', {
      fontSize: '28px',
      fontFamily: YAK_FONTS.title,
      color: '#e74c3c',
    }).setOrigin(0.5).setAlpha(0.25);
  }

  private createHoop(): void {
    // Pole (on right side)
    this.add.rectangle(this.BACKBOARD_X + 25, this.HOOP_Y + 200, 8, 400, 0x4a4a4a).setDepth(1);

    // Backboard shadow (mirrored)
    this.add.rectangle(this.BACKBOARD_X - 4, this.HOOP_Y - 30, 12, 100, 0x000000, 0.35).setDepth(8);

    // Backboard
    const backboard = this.add.rectangle(this.BACKBOARD_X, this.HOOP_Y - 30, 8, 95, 0xf5f5f5);
    backboard.setStrokeStyle(3, 0xcccccc);
    backboard.setDepth(10);

    // Backboard square target
    const square = this.add.graphics().setDepth(11);
    square.lineStyle(3, 0xff0000, 0.9);
    square.strokeRect(this.BACKBOARD_X - 3, this.HOOP_Y - 50, 6, 35);

    // Rim support (extends left from backboard)
    this.add.rectangle(this.BACKBOARD_X - 18, this.HOOP_Y, 30, 5, 0xff4500).setDepth(9);

    // Draw the rim
    this.drawRim();

    // Rim target glow
    const rimGlow = this.add.circle(this.rimCenterX, this.HOOP_Y, this.RIM_RADIUS + 10, YAK_COLORS.success, 0);
    rimGlow.setStrokeStyle(3, YAK_COLORS.success, 0.3).setDepth(6);
    this.tweens.add({
      targets: rimGlow,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0,
      duration: 1500,
      repeat: -1,
    });
  }

  private drawRim(): void {
    this.rimGraphics.clear();

    // Rim ellipse
    this.rimGraphics.lineStyle(this.RIM_THICKNESS * 2, 0xff4500, 1);
    this.rimGraphics.strokeEllipse(this.rimCenterX, this.HOOP_Y, this.RIM_RADIUS * 2, this.RIM_RADIUS * 0.5);

    // Inner rim (the hole)
    this.rimGraphics.fillStyle(0x000000, 0.6);
    this.rimGraphics.fillEllipse(this.rimCenterX, this.HOOP_Y, this.RIM_RADIUS * 2 - 8, this.RIM_RADIUS * 0.5 - 4);

    // Rim highlights
    this.rimGraphics.lineStyle(2, 0xff6a00, 0.8);
    this.rimGraphics.beginPath();
    this.rimGraphics.arc(this.rimCenterX, this.HOOP_Y - 2, this.RIM_RADIUS - 2, Math.PI * 1.1, Math.PI * 1.9, false);
    this.rimGraphics.strokePath();
  }

  private createNet(): void {
    this.netGraphics = this.add.graphics().setDepth(7);

    this.netPoints = [];
    for (let i = 0; i <= this.NET_SEGMENTS; i++) {
      const angle = (i / this.NET_SEGMENTS) * Math.PI;
      const x = this.rimCenterX + Math.cos(angle) * (this.RIM_RADIUS - 5);
      this.netPoints.push({ x, y: this.HOOP_Y + 5, vx: 0, vy: 0 });
    }

    this.drawNet(0);
  }

  private drawNet(sway: number): void {
    this.netGraphics.clear();
    this.netGraphics.lineStyle(2, 0xffffff, 0.85);

    const netBottom = this.HOOP_Y + this.NET_LENGTH;

    for (let i = 0; i <= this.NET_SEGMENTS; i++) {
      const topX = this.netPoints[i].x;
      const topY = this.netPoints[i].y;
      const bottomX = this.rimCenterX + (topX - this.rimCenterX) * 0.3 + Math.sin(i + sway) * 3;
      const bottomY = netBottom + Math.sin(i * 0.5 + sway) * 5;

      this.netGraphics.moveTo(topX, topY);
      const midX = (topX + bottomX) / 2 + Math.sin(sway + i) * 4;
      const midY = (topY + bottomY) / 2;
      this.netGraphics.lineTo(midX, midY);
      this.netGraphics.lineTo(bottomX, bottomY);
    }
    this.netGraphics.strokePath();

    this.netGraphics.lineStyle(1.5, 0xffffff, 0.7);
    for (let ring = 1; ring <= 4; ring++) {
      const t = ring / 5;
      const ringY = this.HOOP_Y + 5 + t * this.NET_LENGTH;
      const ringRadius = this.RIM_RADIUS * (1 - t * 0.7);
      const ringCenterX = this.rimCenterX + Math.sin(sway) * t * 3;

      // Draw horizontal ellipse as arc
      this.netGraphics.beginPath();
      for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
        const x = ringCenterX + Math.cos(angle) * ringRadius;
        const y = ringY + Math.sin(angle) * ringRadius * 0.3 + Math.sin(sway * 2) * 2;
        if (angle === 0) this.netGraphics.moveTo(x, y);
        else this.netGraphics.lineTo(x, y);
      }
      this.netGraphics.closePath();
      this.netGraphics.strokePath();
    }
  }

  private animateNet(intensity: number = 1): void {
    let frame = 0;
    const animate = () => {
      frame++;
      const sway = Math.sin(frame * 0.3) * intensity * Math.exp(-frame * 0.05);
      this.drawNet(sway);

      if (frame < 60) {
        this.time.delayedCall(16, animate);
      } else {
        this.drawNet(0);
      }
    };
    animate();
  }

  private createBasketball(): void {
    // Spawn from left corner
    this.spawnX = 90;
    this.spawnY = GAME_HEIGHT - 160;

    this.ballState = { x: this.spawnX, y: this.spawnY, vx: 0, vy: 0, spin: 0 };

    // Shadow
    this.ballShadow = this.add.ellipse(this.spawnX, GAME_HEIGHT - 90, 55, 20, 0x000000, 0.4);
    this.ballShadow.setDepth(4);

    // Ball container
    this.ball = this.add.container(this.spawnX, this.spawnY);
    this.ball.setDepth(100);

    // Ball body
    const ballBody = this.add.circle(0, 0, this.BALL_RADIUS, 0xff6b35);
    ballBody.setStrokeStyle(2, 0xcc5020);
    this.ball.add(ballBody);

    // Ball texture
    const ballTexture = this.add.graphics();
    ballTexture.lineStyle(2.5, 0x8b3000, 0.7);

    ballTexture.moveTo(0, -this.BALL_RADIUS);
    ballTexture.lineTo(0, this.BALL_RADIUS);

    ballTexture.moveTo(-this.BALL_RADIUS, 0);
    ballTexture.lineTo(this.BALL_RADIUS, 0);

    ballTexture.beginPath();
    ballTexture.arc(-6, 0, 16, -Math.PI * 0.45, Math.PI * 0.45, false);
    ballTexture.strokePath();
    ballTexture.beginPath();
    ballTexture.arc(6, 0, 16, Math.PI * 0.55, Math.PI * 1.45, false);
    ballTexture.strokePath();

    this.ball.add(ballTexture);

    // Highlights
    this.ball.add(this.add.circle(-7, -7, 7, 0xffffff, 0.35));
    this.ball.add(this.add.circle(-4, -12, 3, 0xffffff, 0.5));
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

    if (distance < 15) {
      this.instructionText.setText('DRAG TO AIM & SHOOT!');
      return;
    }

    const power = Math.min(distance / 5, 50);
    const vx = (dx / distance) * power * 0.55;
    const vy = (dy / distance) * power * 0.95;

    // Trajectory preview
    let px = this.ballState.x;
    let py = this.ballState.y;
    let pvx = vx;
    let pvy = vy;

    for (let i = 0; i < 70; i++) {
      pvx *= this.AIR_RESISTANCE;
      pvy += this.GRAVITY;
      pvy *= this.AIR_RESISTANCE;
      px += pvx;
      py += pvy;

      if (py > GAME_HEIGHT + 50 || py < -50 || px < -50 || px > GAME_WIDTH + 50) break;

      if (i % 4 === 0) {
        const alpha = 0.7 - (i / 80);
        const size = 7 - (i / 12);
        this.trajectoryDots.fillStyle(0xff6b35, Math.max(alpha, 0.1));
        this.trajectoryDots.fillCircle(px, py, Math.max(size, 2));
      }
    }

    const powerPercent = Math.min((power / 50) * 100, 100);
    let color = 0x22c55e;
    if (powerPercent > 60) color = 0xeab308;
    if (powerPercent > 85) color = 0xef4444;

    this.aimLine.lineStyle(5, color, 0.9);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.ball.x, this.ball.y);
    const lineLen = Math.min(distance * 0.6, 80);
    const endX = this.ball.x + (dx / distance) * lineLen;
    const endY = this.ball.y + (dy / distance) * lineLen;
    this.aimLine.lineTo(endX, endY);
    this.aimLine.strokePath();

    const angle = Math.atan2(dy, dx);
    this.aimLine.fillStyle(color, 0.9);
    this.aimLine.fillTriangle(
      endX + Math.cos(angle) * 12,
      endY + Math.sin(angle) * 12,
      endX + Math.cos(angle + 2.6) * 12,
      endY + Math.sin(angle + 2.6) * 12,
      endX + Math.cos(angle - 2.6) * 12,
      endY + Math.sin(angle - 2.6) * 12
    );

    this.instructionText.setText(`POWER: ${Math.round(powerPercent)}%`);
    this.instructionText.setColor(powerPercent > 85 ? '#ef4444' : powerPercent > 60 ? '#eab308' : '#22c55e');
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging || this.hasLaunched) return;

    this.isDragging = false;
    this.aimLine.clear();
    this.trajectoryDots.clear();

    const dx = pointer.x - this.dragStartX;
    const dy = pointer.y - this.dragStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 15) {
      this.instructionText.setText('DRAG TO AIM & SHOOT!');
      return;
    }

    this.hasLaunched = true;
    this.hitBackboard = false;
    this.rimBounces = 0;
    this.passedThroughHoop = false;
    this.ballBelowRim = false;
    this.instructionText.setVisible(false);
    GameStateService.startTimer();

    const power = Math.min(distance / 5, 50);
    this.ballState.vx = (dx / distance) * power * 0.55;
    this.ballState.vy = (dy / distance) * power * 0.95;
    this.ballState.spin = this.ballState.vx * 0.1;

    this.trailPoints = [];
  }

  update(): void {
    updateTimer(this.ui.timerText);

    if (!this.hasLaunched) return;

    // Physics
    this.ballState.vx *= this.AIR_RESISTANCE;
    this.ballState.vy += this.GRAVITY;
    this.ballState.vy *= this.AIR_RESISTANCE;
    this.ballState.vy += this.ballState.spin * this.SPIN_FACTOR * 0.1;

    this.ballState.x += this.ballState.vx;
    this.ballState.y += this.ballState.vy;
    this.ballState.spin *= 0.98;

    this.ball.setPosition(this.ballState.x, this.ballState.y);
    this.ball.rotation += this.ballState.vx * 0.04;

    this.updateShadow();
    this.updateTrail();
    this.checkBackboardCollision();
    this.checkRimCollision();
    this.checkHoopSuccess();
    this.checkBounds();
  }

  private updateShadow(): void {
    this.ballShadow.x = this.ballState.x;
    const groundY = GAME_HEIGHT - 90;
    const height = groundY - this.ballState.y;
    const scale = Math.max(0.25, 1 - height / 500);
    this.ballShadow.setScale(scale, scale * 0.35);
    this.ballShadow.setAlpha(0.4 * scale);
  }

  private updateTrail(): void {
    this.trailPoints.push({ x: this.ballState.x, y: this.ballState.y, alpha: 1 });
    if (this.trailPoints.length > 25) this.trailPoints.shift();

    this.trail.clear();
    for (let i = 0; i < this.trailPoints.length; i++) {
      const point = this.trailPoints[i];
      const progress = i / this.trailPoints.length;
      this.trail.fillStyle(0xff6b35, progress * 0.5);
      this.trail.fillCircle(point.x, point.y, progress * 12);
    }
  }

  private checkBackboardCollision(): void {
    // Backboard is on right side, ball approaches from left
    const backboardLeft = this.BACKBOARD_X - 6;
    const backboardRight = this.BACKBOARD_X + 6;
    const backboardTop = this.HOOP_Y - 80;
    const backboardBottom = this.HOOP_Y + 15;

    if (this.ballState.x + this.BALL_RADIUS > backboardLeft &&
        this.ballState.x - this.BALL_RADIUS < backboardRight &&
        this.ballState.y > backboardTop &&
        this.ballState.y < backboardBottom &&
        this.ballState.vx > 0) {

      this.ballState.x = backboardLeft - this.BALL_RADIUS;
      this.ballState.vx = -Math.abs(this.ballState.vx) * this.BOUNCE_DAMPING;
      this.ballState.vy *= 0.9;
      this.ballState.spin -= this.ballState.vy * 0.05;
      this.hitBackboard = true;

      this.cameras.main.shake(60, 0.007);
      this.showBackboardEffect();
    }
  }

  private showBackboardEffect(): void {
    const flash = this.add.rectangle(this.BACKBOARD_X, this.ballState.y, 15, 25, 0xffffff, 0.9).setDepth(150);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 1.5,
      duration: 150,
      onComplete: () => flash.destroy()
    });

    const bonk = this.add.text(this.BACKBOARD_X - 30, this.ballState.y - 20, 'BONK!', {
      fontSize: '16px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: bonk,
      y: bonk.y - 30,
      alpha: 0,
      duration: 400,
      onComplete: () => bonk.destroy()
    });
  }

  private checkRimCollision(): void {
    const leftDist = this.getDistance(this.ballState.x, this.ballState.y, this.leftRimCenter.x, this.leftRimCenter.y);
    const rightDist = this.getDistance(this.ballState.x, this.ballState.y, this.rightRimCenter.x, this.rightRimCenter.y);

    const collisionDist = this.BALL_RADIUS + this.RIM_THICKNESS;

    if (leftDist < collisionDist && this.ballState.y > this.HOOP_Y - 30) {
      this.handleRimBounce(this.leftRimCenter.x, this.leftRimCenter.y, leftDist);
    }

    if (rightDist < collisionDist && this.ballState.y > this.HOOP_Y - 30) {
      this.handleRimBounce(this.rightRimCenter.x, this.rightRimCenter.y, rightDist);
    }
  }

  private handleRimBounce(rimX: number, rimY: number, dist: number): void {
    const nx = (this.ballState.x - rimX) / dist;
    const ny = (this.ballState.y - rimY) / dist;

    const overlap = this.BALL_RADIUS + this.RIM_THICKNESS - dist;
    this.ballState.x += nx * overlap;
    this.ballState.y += ny * overlap;

    const dotProduct = this.ballState.vx * nx + this.ballState.vy * ny;
    this.ballState.vx -= 2 * dotProduct * nx * this.BOUNCE_DAMPING;
    this.ballState.vy -= 2 * dotProduct * ny * this.BOUNCE_DAMPING;

    this.ballState.spin += nx * 2;
    this.ballState.vx *= 0.85;
    this.ballState.vy *= 0.85;

    this.rimBounces++;
    this.cameras.main.shake(40, 0.005);
    this.showRimEffect(rimX, rimY);
    this.animateNet(0.5);

    if (this.rimBounces === 2) {
      this.showRattleText();
    }
  }

  private showRimEffect(x: number, y: number): void {
    const flash = this.add.circle(x, y, 12, 0xff4500, 0.8).setDepth(150);
    this.tweens.add({
      targets: flash,
      scale: 2.5,
      alpha: 0,
      duration: 250,
      onComplete: () => flash.destroy()
    });
  }

  private showRattleText(): void {
    const text = this.add.text(this.rimCenterX, this.HOOP_Y - 50, 'RATTLING...', {
      fontSize: '18px',
      fontFamily: YAK_FONTS.title,
      color: '#fbbf24',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: text,
      y: text.y - 25,
      alpha: 0,
      duration: 600,
      onComplete: () => text.destroy()
    });
  }

  private checkHoopSuccess(): void {
    const inHoopX = Math.abs(this.ballState.x - this.rimCenterX) < this.RIM_RADIUS - this.BALL_RADIUS * 0.5;
    const atHoopY = this.ballState.y > this.HOOP_Y && this.ballState.y < this.HOOP_Y + 40;
    const goingDown = this.ballState.vy > 0;

    if (inHoopX && atHoopY && goingDown && !this.passedThroughHoop) {
      this.passedThroughHoop = true;
      this.ballBelowRim = true;
    }

    if (this.passedThroughHoop && this.ballState.y > this.HOOP_Y + this.NET_LENGTH) {
      this.handleSuccess();
    }
  }

  private checkBounds(): void {
    if (this.ballState.y > GAME_HEIGHT + 50 ||
        this.ballState.x < -50 ||
        this.ballState.x > GAME_WIDTH + 50) {

      if (this.rimBounces > 0 && !this.passedThroughHoop) {
        this.handleRimOut();
      } else if (!this.passedThroughHoop) {
        this.handleMiss();
      }
    }

    if (this.rimBounces > 6 && !this.passedThroughHoop) {
      this.handleRimOut();
    }
  }

  private handleSuccess(): void {
    this.hasLaunched = false;
    this.trail.clear();

    let shotType = 'SWISH!';
    let shotColor = '#4ade80';

    if (this.rimBounces > 0 && this.hitBackboard) {
      shotType = 'BANK SHOT!';
      shotColor = '#60a5fa';
    } else if (this.rimBounces > 2) {
      shotType = 'RATTLE IN!';
      shotColor = '#fbbf24';
    } else if (this.rimBounces > 0) {
      shotType = 'BUCKET!';
      shotColor = '#4ade80';
    } else if (this.hitBackboard) {
      shotType = 'OFF GLASS!';
      shotColor = '#60a5fa';
    }

    this.tweens.add({
      targets: this.ball,
      y: this.HOOP_Y + 90,
      x: this.rimCenterX,
      scale: 0.6,
      duration: 300,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: this.ballShadow,
      alpha: 0,
      duration: 200
    });

    this.animateNet(3);

    const shotText = this.add.text(this.rimCenterX, this.HOOP_Y - 70, shotType, {
      fontSize: '32px',
      fontFamily: YAK_FONTS.title,
      color: shotColor,
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(200).setScale(0);

    this.tweens.add({
      targets: shotText,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: shotText,
          y: shotText.y - 50,
          alpha: 0,
          duration: 600,
          delay: 300,
          onComplete: () => shotText.destroy()
        });
      }
    });

    // Extra celebration for final station
    for (let i = 0; i < 30; i++) {
      const particle = this.add.circle(
        this.rimCenterX + (Math.random() - 0.5) * 80,
        this.HOOP_Y + 30,
        Math.random() * 6 + 2,
        [0x4ade80, 0xfbbf24, 0xff6b35, 0x60a5fa, 0xe74c3c][Math.floor(Math.random() * 5)],
        0.9
      ).setDepth(150);

      this.tweens.add({
        targets: particle,
        y: particle.y + 120 + Math.random() * 120,
        x: particle.x + (Math.random() - 0.5) * 150,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        onComplete: () => particle.destroy()
      });
    }

    // Final completion text
    const finalText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, 'GAUNTLET COMPLETE!', {
      fontSize: '28px',
      fontFamily: YAK_FONTS.title,
      color: '#fbbf24',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(250).setScale(0);

    this.tweens.add({
      targets: finalText,
      scale: 1,
      duration: 300,
      delay: 400,
      ease: 'Back.easeOut',
    });

    // Get character quote
    const state = GameStateService.getState();
    const characterId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(characterId, 'success');
    this.showCharacterQuote(quote, YAK_COLORS.success);

    showSuccessEffect(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, getRandomSuccess(), () => {
      this.scene.start('QuizScene');
    });
  }

  private handleRimOut(): void {
    this.hasLaunched = false;
    this.missCount++;
    this.ui.missText.setText(`Misses: ${this.missCount}`);
    GameStateService.recordMiss('corner3_left');

    this.cameras.main.shake(100, 0.01);

    const rimText = this.add.text(this.rimCenterX, this.HOOP_Y - 60, 'RIM OUT!', {
      fontSize: '26px',
      fontFamily: YAK_FONTS.title,
      color: '#ef4444',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: rimText,
      y: rimText.y - 40,
      alpha: 0,
      duration: 700,
      onComplete: () => rimText.destroy()
    });

    // Get character quote
    const state = GameStateService.getState();
    const characterId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(characterId, 'miss');
    this.showCharacterQuote(quote, YAK_COLORS.danger);

    showFailEffect(this, this.rimCenterX, this.HOOP_Y, getRandomFail());

    this.time.delayedCall(700, () => this.resetBall());
  }

  private handleMiss(): void {
    this.hasLaunched = false;
    this.missCount++;
    this.ui.missText.setText(`Misses: ${this.missCount}`);
    GameStateService.recordMiss('corner3_left');

    // Get character quote
    const state = GameStateService.getState();
    const characterId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(characterId, 'miss');
    this.showCharacterQuote(quote, YAK_COLORS.danger);

    showFailEffect(this, this.ballState.x, Math.min(this.ballState.y, 450), getRandomFail());

    this.time.delayedCall(500, () => this.resetBall());
  }

  private resetBall(): void {
    this.hasLaunched = false;
    this.hitBackboard = false;
    this.rimBounces = 0;
    this.passedThroughHoop = false;
    this.ballBelowRim = false;
    this.trailPoints = [];
    this.trail.clear();

    this.ballState = { x: this.spawnX, y: this.spawnY, vx: 0, vy: 0, spin: 0 };

    this.ball.setPosition(this.spawnX, this.spawnY);
    this.ball.setRotation(0);
    this.ball.setScale(1);
    this.ball.setAlpha(1);

    this.ballShadow.setPosition(this.spawnX, GAME_HEIGHT - 90);
    this.ballShadow.setScale(1, 0.35);
    this.ballShadow.setAlpha(0.4);

    this.instructionText.setVisible(true);
    this.instructionText.setText('DRAG TO AIM & SHOOT!');
    this.instructionText.setColor('#ff6b35');
  }

  private getDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
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
