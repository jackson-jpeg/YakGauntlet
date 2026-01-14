import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, getRandomSuccess, getRandomFail, createStoolIcon } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { createSceneUI, updateTimer, showSuccessEffect, showFailEffect, type SceneUI } from '../utils/UIHelper';
import { getCharacterQuote } from '../data/characterQuotes';
import { createArenaAtmosphere } from '../utils/StudioAtmosphere';
import type { CharacterId } from '../types';

export class FootballScene extends Phaser.Scene {
  // Football
  private football!: Phaser.GameObjects.Container;
  private footballShadow!: Phaser.GameObjects.Ellipse;

  // Target (tire/hole)
  private targetX = 0;
  private targetY = 0;
  private targetRadius = 50;

  // Graphics
  private aimLine!: Phaser.GameObjects.Graphics;
  private trajectoryDots!: Phaser.GameObjects.Graphics;
  private trail!: Phaser.GameObjects.Graphics;

  // Input state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private hasLaunched = false;

  // UI
  private ui!: SceneUI;
  private instructionText!: Phaser.GameObjects.Text;
  private missCount = 0;

  // Spawn
  private spawnX = 0;
  private spawnY = 0;

  // Trail
  private trailPoints: { x: number; y: number }[] = [];

  // Receiver cutout
  private receiver!: Phaser.GameObjects.Container;
  private receiverBobOffset = 0;

  constructor() {
    super({ key: 'FootballScene' });
  }

  create(): void {
    this.createBackground();

    this.trail = this.add.graphics().setDepth(5);
    this.aimLine = this.add.graphics().setDepth(50);
    this.trajectoryDots = this.add.graphics().setDepth(51);

    this.createField();
    this.createTarget();
    this.createReceiver();
    this.createFootball();

    // Unified UI header (station 3 = football)
    this.ui = createSceneUI(this, 3, 'Misses');

    // Instruction text
    this.instructionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'DRAG TO THROW', {
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

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
  }

  private createBackground(): void {
    // Arena atmosphere
    createArenaAtmosphere(this);

    // Stadium night sky (over arena)
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e3a5f, 0x1e3a5f, 0.8);
    sky.fillRect(0, 0, GAME_WIDTH, 350);

    // Stadium lights
    for (let i = 0; i < 5; i++) {
      const x = 55 + i * 115;
      // Light pole
      this.add.rectangle(x, 80, 6, 120, 0x374151).setDepth(1);
      // Light fixture
      this.add.rectangle(x, 25, 30, 10, 0x4b5563).setDepth(1);
      // Light glow
      this.add.circle(x, 25, 12, 0xfef3c7, 0.9).setDepth(2);
      this.add.circle(x, 25, 25, 0xfef3c7, 0.3).setDepth(1);

      // Light beam
      const beam = this.add.graphics();
      beam.fillStyle(0xfef3c7, 0.06);
      beam.fillTriangle(x, 35, x - 100, 500, x + 100, 500);
    }

    // Stars
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * 200;
      const size = Math.random() * 2 + 1;
      const star = this.add.circle(x, y, size, 0xffffff, Math.random() * 0.5 + 0.3);

      this.tweens.add({
        targets: star,
        alpha: star.alpha * 0.3,
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private createField(): void {
    // Main field
    const field = this.add.graphics();
    field.fillGradientStyle(0x166534, 0x166534, 0x14532d, 0x14532d, 1);
    field.fillRect(0, 280, GAME_WIDTH, GAME_HEIGHT - 280);

    // Field stripes (yard lines effect)
    for (let i = 0; i < 14; i++) {
      const y = 320 + i * 50;
      const shade = i % 2 === 0 ? 0x15803d : 0x166534;
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 50, shade);
    }

    // Yard line markings
    const lines = this.add.graphics();
    lines.lineStyle(3, 0xffffff, 0.7);

    // Horizontal yard lines
    for (let i = 0; i < 8; i++) {
      const y = 350 + i * 80;
      lines.moveTo(40, y);
      lines.lineTo(GAME_WIDTH - 40, y);
    }
    lines.strokePath();

    // Hash marks
    const hashMarks = this.add.graphics();
    hashMarks.lineStyle(2, 0xffffff, 0.5);
    for (let i = 0; i < 8; i++) {
      const y = 350 + i * 80;
      // Left hash
      hashMarks.moveTo(GAME_WIDTH / 3, y - 8);
      hashMarks.lineTo(GAME_WIDTH / 3, y + 8);
      // Right hash
      hashMarks.moveTo(GAME_WIDTH * 2 / 3, y - 8);
      hashMarks.lineTo(GAME_WIDTH * 2 / 3, y + 8);
    }
    hashMarks.strokePath();

    // Sideline
    this.add.rectangle(20, GAME_HEIGHT / 2 + 100, 8, 500, 0xffffff, 0.8);
    this.add.rectangle(GAME_WIDTH - 20, GAME_HEIGHT / 2 + 100, 8, 500, 0xffffff, 0.8);
  }

  private createTarget(): void {
    this.targetX = GAME_WIDTH / 2;
    this.targetY = 380;
    this.targetRadius = 48;

    // Target stand/post
    this.add.rectangle(this.targetX, this.targetY + 80, 12, 100, 0x78350f).setDepth(8);
    this.add.rectangle(this.targetX, this.targetY + 130, 40, 12, 0x78350f).setDepth(8);

    // Tire shadow
    this.add.ellipse(this.targetX + 5, this.targetY + 5, this.targetRadius * 2 + 10, this.targetRadius * 2 + 10, 0x000000, 0.4).setDepth(9);

    // Tire outer
    const tireOuter = this.add.circle(this.targetX, this.targetY, this.targetRadius + 8, 0x1f2937);
    tireOuter.setStrokeStyle(4, 0x111827);
    tireOuter.setDepth(10);

    // Tire tread pattern
    const tread = this.add.graphics().setDepth(11);
    tread.lineStyle(3, 0x374151, 0.8);
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const innerR = this.targetRadius - 5;
      const outerR = this.targetRadius + 5;
      tread.moveTo(this.targetX + Math.cos(angle) * innerR, this.targetY + Math.sin(angle) * innerR);
      tread.lineTo(this.targetX + Math.cos(angle) * outerR, this.targetY + Math.sin(angle) * outerR);
    }
    tread.strokePath();

    // Tire hole (target zone)
    this.add.circle(this.targetX, this.targetY, this.targetRadius - 12, 0x0a0a0a).setDepth(12);
    this.add.circle(this.targetX, this.targetY, this.targetRadius - 18, 0x050505).setDepth(13);

    // Target glow animation
    const targetGlow = this.add.circle(this.targetX, this.targetY, this.targetRadius, YAK_COLORS.success, 0);
    targetGlow.setStrokeStyle(4, YAK_COLORS.success, 0.4).setDepth(9);

    this.tweens.add({
      targets: targetGlow,
      scale: 1.4,
      alpha: 0,
      duration: 1200,
      repeat: -1,
    });

    // "HIT THE TIRE" label
    this.add.text(this.targetX, this.targetY - 80, 'HIT THE TIRE', {
      fontSize: '16px',
      fontFamily: YAK_FONTS.title,
      color: '#4ade80',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(20);
  }

  private createReceiver(): void {
    // Receiver cutout (standing beside target)
    this.receiver = this.add.container(this.targetX + 100, this.targetY + 40);
    this.receiver.setDepth(15);
    this.receiver.setScale(0.7);

    // Shadow
    this.receiver.add(this.add.ellipse(0, 75, 50, 15, 0x000000, 0.3));

    // Legs
    this.receiver.add(this.add.rectangle(-10, 55, 16, 50, 0xeeeeee));
    this.receiver.add(this.add.rectangle(10, 55, 16, 50, 0xeeeeee));

    // Body - Yak red jersey
    const jersey = this.add.rectangle(0, 10, 50, 60, YAK_COLORS.primary);
    jersey.setStrokeStyle(2, YAK_COLORS.primaryDark);
    this.receiver.add(jersey);

    // Jersey number
    this.receiver.add(this.add.text(0, 10, '88', {
      fontSize: '24px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
    }).setOrigin(0.5));

    // Arms raised (catching position)
    const leftArm = this.add.rectangle(-32, -15, 18, 50, YAK_COLORS.primary);
    leftArm.setAngle(-30);
    this.receiver.add(leftArm);

    const rightArm = this.add.rectangle(32, -15, 18, 50, YAK_COLORS.primary);
    rightArm.setAngle(30);
    this.receiver.add(rightArm);

    // Hands
    this.receiver.add(this.add.circle(-45, -35, 10, 0xffdbac));
    this.receiver.add(this.add.circle(45, -35, 10, 0xffdbac));

    // Helmet
    const helmet = this.add.circle(0, -35, 20, YAK_COLORS.primary);
    helmet.setStrokeStyle(2, YAK_COLORS.primaryDark);
    this.receiver.add(helmet);

    // Face mask
    const faceMask = this.add.graphics();
    faceMask.lineStyle(3, 0x9ca3af, 1);
    faceMask.arc(0, -30, 14, 0.3, Math.PI - 0.3, false);
    faceMask.strokePath();
    faceMask.moveTo(-8, -25);
    faceMask.lineTo(-8, -35);
    faceMask.moveTo(8, -25);
    faceMask.lineTo(8, -35);
    faceMask.strokePath();
    this.receiver.add(faceMask);

    // Idle animation
    this.tweens.add({
      targets: this.receiver,
      y: this.receiver.y - 5,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createFootball(): void {
    this.spawnX = GAME_WIDTH / 2;
    this.spawnY = GAME_HEIGHT - 160;

    // Shadow
    this.footballShadow = this.add.ellipse(this.spawnX, GAME_HEIGHT - 95, 55, 20, 0x000000, 0.35);
    this.footballShadow.setDepth(10);

    // Football container
    this.football = this.add.container(this.spawnX, this.spawnY);
    this.football.setDepth(100);

    // Football body (brown ellipse)
    const ball = this.add.ellipse(0, 0, 55, 32, 0x92400e);
    ball.setStrokeStyle(2, 0x78350f);
    this.football.add(ball);

    // Football texture - pointed ends
    const points = this.add.graphics();
    points.fillStyle(0x78350f, 1);
    // Left point
    points.fillTriangle(-27, 0, -22, -8, -22, 8);
    // Right point
    points.fillTriangle(27, 0, 22, -8, 22, 8);
    this.football.add(points);

    // Laces
    const laces = this.add.graphics();
    laces.lineStyle(3, 0xffffff, 0.95);
    // Center lace line
    laces.moveTo(-15, 0);
    laces.lineTo(15, 0);
    // Cross laces
    for (let i = -2; i <= 2; i++) {
      const x = i * 6;
      laces.moveTo(x, -5);
      laces.lineTo(x, 5);
    }
    laces.strokePath();
    this.football.add(laces);

    // White stripes (near ends)
    const stripes = this.add.graphics();
    stripes.lineStyle(2, 0xffffff, 0.7);
    stripes.arc(-18, 0, 10, -0.8, 0.8, false);
    stripes.strokePath();
    stripes.beginPath();
    stripes.arc(18, 0, 10, Math.PI - 0.8, Math.PI + 0.8, false);
    stripes.strokePath();
    this.football.add(stripes);

    // Highlight
    const highlight = this.add.ellipse(-8, -6, 12, 6, 0xffffff, 0.25);
    this.football.add(highlight);
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
      this.instructionText.setText('DRAG TO THROW');
      return;
    }

    const power = Math.min(distance / 7, 40);
    const vx = (dx / distance) * power * 0.35;
    const vy = (dy / distance) * power;

    // Trajectory preview
    const gravity = 0.35;
    let px = this.football.x;
    let py = this.football.y;
    let pvx = vx;
    let pvy = vy;

    for (let i = 0; i < 55; i++) {
      px += pvx;
      pvy += gravity;
      py += pvy;

      if (py > GAME_HEIGHT + 50 || py < -50) break;

      if (i % 3 === 0) {
        const alpha = 0.8 - (i / 65);
        const size = 6 - (i / 12);
        this.trajectoryDots.fillStyle(0xffffff, alpha);
        this.trajectoryDots.fillCircle(px, py, Math.max(size, 2));
      }
    }

    const powerPercent = Math.min((power / 40) * 100, 100);
    let color = YAK_COLORS.success;
    if (powerPercent > 50) color = YAK_COLORS.warning;
    if (powerPercent > 80) color = YAK_COLORS.danger;

    // Aim line
    this.aimLine.lineStyle(4, color, 0.9);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.football.x, this.football.y);
    const lineLen = Math.min(distance * 0.8, 120);
    const endX = this.football.x + (dx / distance) * lineLen;
    const endY = this.football.y + (dy / distance) * lineLen;
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
      this.instructionText.setText('DRAG TO THROW');
      return;
    }

    this.hasLaunched = true;
    this.instructionText.setVisible(false);
    GameStateService.startTimer();

    const power = Math.min(distance / 7, 40);
    const vx = (dx / distance) * power * 0.35;
    const vy = (dy / distance) * power;

    this.throwFootball(vx, vy);
  }

  private throwFootball(vx: number, vy: number): void {
    let velocityX = vx;
    let velocityY = vy;
    const gravity = 0.35;
    const friction = 0.995;

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

      this.football.x += velocityX;
      this.football.y += velocityY;

      // Spiral rotation (football spins on its axis)
      this.football.rotation = Math.atan2(velocityY, velocityX) + Math.PI / 2;

      // Update shadow
      this.footballShadow.x = this.football.x;
      const shadowScale = Math.max(0.3, 1 - (GAME_HEIGHT - 95 - this.football.y) / 500);
      this.footballShadow.setScale(shadowScale * 1.2, shadowScale * 0.4);
      this.footballShadow.setAlpha(0.35 * shadowScale);

      // Trail
      this.trailPoints.push({ x: this.football.x, y: this.football.y });
      if (this.trailPoints.length > 25) this.trailPoints.shift();

      this.trail.clear();
      for (let i = 1; i < this.trailPoints.length; i++) {
        const alpha = (i / this.trailPoints.length) * 0.4;
        const size = (i / this.trailPoints.length) * 8;
        this.trail.fillStyle(0x92400e, alpha);
        this.trail.fillCircle(this.trailPoints[i].x, this.trailPoints[i].y, size);
      }

      // Bounds
      if (this.football.x < 30) {
        this.football.x = 30;
        velocityX = -velocityX * 0.3;
      }
      if (this.football.x > GAME_WIDTH - 30) {
        this.football.x = GAME_WIDTH - 30;
        velocityX = -velocityX * 0.3;
      }

      // Target check
      const distToTarget = Phaser.Math.Distance.Between(
        this.football.x, this.football.y,
        this.targetX, this.targetY
      );

      if (distToTarget < this.targetRadius - 15) {
        this.events.off('update', updateHandler);
        this.handleSuccess();
        return;
      }

      // Hit tire rim (close miss)
      if (distToTarget < this.targetRadius + 10 && distToTarget > this.targetRadius - 15) {
        if (this.football.y < this.targetY + 30 && this.football.y > this.targetY - 60) {
          this.events.off('update', updateHandler);
          this.handleRimHit();
          return;
        }
      }

      // Ground
      if (this.football.y > GAME_HEIGHT - 80) {
        this.events.off('update', updateHandler);
        this.handleMiss();
        return;
      }

      // Off screen top
      if (this.football.y < -50) {
        this.events.off('update', updateHandler);
        this.handleMiss();
        return;
      }

      // Stopped
      const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      if (speed < 0.5 && this.football.y > 300) {
        this.events.off('update', updateHandler);
        this.handleMiss();
        return;
      }
    };

    this.events.on('update', updateHandler);
  }

  private handleSuccess(): void {
    this.trail.clear();

    // Animate through tire
    this.tweens.add({
      targets: this.football,
      x: this.targetX,
      y: this.targetY + 50,
      scale: 0.3,
      alpha: 0,
      duration: 300,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: this.footballShadow,
      alpha: 0,
      duration: 200
    });

    // Receiver celebration
    this.tweens.add({
      targets: this.receiver,
      y: this.receiver.y - 30,
      duration: 200,
      yoyo: true,
      repeat: 2,
    });

    // Get character quote
    const state = GameStateService.getState();
    const characterId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(characterId, 'success');
    this.showCharacterQuote(quote, YAK_COLORS.success);

    showSuccessEffect(this, this.targetX, this.targetY, getRandomSuccess(), () => {
      this.scene.start('Corner3RightScene');
    });
  }

  private handleRimHit(): void {
    this.missCount++;
    this.ui.missText.setText(`Misses: ${this.missCount}`);
    GameStateService.recordMiss('football');

    this.cameras.main.shake(200, 0.015);

    // Ball bounces off
    this.tweens.add({
      targets: this.football,
      x: this.football.x + (Math.random() - 0.5) * 100,
      y: this.football.y + 150,
      rotation: this.football.rotation + Math.PI * 2,
      duration: 500,
      ease: 'Bounce.easeOut'
    });

    // Rim hit flash
    const flash = this.add.circle(this.targetX, this.targetY, this.targetRadius, 0xffffff, 0.5).setDepth(150);
    this.tweens.add({
      targets: flash,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });

    // Get character quote
    const state = GameStateService.getState();
    const characterId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(characterId, 'miss');
    this.showCharacterQuote(quote, YAK_COLORS.danger);

    showFailEffect(this, this.targetX, this.targetY - 60, 'OFF THE RIM!');

    this.time.delayedCall(800, () => this.resetFootball());
  }

  private handleMiss(): void {
    this.missCount++;
    this.ui.missText.setText(`Misses: ${this.missCount}`);
    GameStateService.recordMiss('football');

    // Get character quote
    const state = GameStateService.getState();
    const characterId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(characterId, 'miss');
    this.showCharacterQuote(quote, YAK_COLORS.danger);

    showFailEffect(this, this.football.x, Math.min(this.football.y, 400), getRandomFail());

    this.time.delayedCall(600, () => this.resetFootball());
  }

  private resetFootball(): void {
    this.hasLaunched = false;
    this.trailPoints = [];
    this.trail.clear();

    this.football.setPosition(this.spawnX, this.spawnY);
    this.football.setRotation(0);
    this.football.setScale(1);
    this.football.setAlpha(1);

    this.footballShadow.setPosition(this.spawnX, GAME_HEIGHT - 95);
    this.footballShadow.setScale(1.2, 0.4);
    this.footballShadow.setAlpha(0.35);

    this.instructionText.setVisible(true);
    this.instructionText.setText('DRAG TO THROW');
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
