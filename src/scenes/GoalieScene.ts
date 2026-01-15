import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, getRandomSuccess, getRandomFail, PHYSICS, createStoolIcon } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { createSceneUI, updateTimer, showSuccessEffect, showFailEffect, type SceneUI } from '../utils/UIHelper';
import { createConfetti, flashScreen, shakeCamera } from '../utils/VisualEffects';
import { createGoalieSprite } from '../utils/CharacterSprites';
import { getCharacterQuote, getCharacterName } from '../data/characterQuotes';
import { CHARACTER_MODIFIERS } from '../types';
import { AudioSystem } from '../utils/AudioSystem';

export class GoalieScene extends Phaser.Scene {
  // Ball
  private ballContainer!: Phaser.GameObjects.Container;
  private ballShadow!: Phaser.GameObjects.Ellipse;

  // Goalie
  private goalie!: Phaser.GameObjects.Container;
  private goalieDirection = 1;
  private goalieSpeed = 2.5;
  private goalieBobOffset = 0;
  private goalieCharacterId!: string;
  private goalieQuoteText!: Phaser.GameObjects.Text;

  // Goal dimensions
  private goalLeft = 70;
  private goalRight = GAME_WIDTH - 70;
  private goalTop = 220;
  private goalBottom = 400;
  private goalWidth = GAME_WIDTH - 140;
  private goalHeight = 180;

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

  // Corner targets
  private cornerTargets: Phaser.GameObjects.Arc[] = [];

  constructor() {
    super({ key: 'GoalieScene' });
  }

  create(): void {
    // Get goalie character from state
    const state = GameStateService.getState();
    this.goalieCharacterId = state?.goalieCharacterId || 'BIG_CAT';

    // Initialize audio
    AudioSystem.init();

    this.createBackground();
    this.createStadium();

    this.trail = this.add.graphics().setDepth(5);
    this.aimLine = this.add.graphics().setDepth(50);
    this.trajectoryDots = this.add.graphics().setDepth(51);

    this.createGoal();
    this.createGoalie();
    this.createBall();
    this.createGoalieNameplate();

    // Unified UI header (station 1 = goalie/penalty)
    this.ui = createSceneUI(this, 1, 'Saves');

    // Instruction text
    this.instructionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'AIM FOR THE CORNERS!', {
      fontSize: '22px',
      fontFamily: YAK_FONTS.title,
      color: YAK_COLORS.textGreen,
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

    // Entrance effects
    this.cameras.main.fadeIn(400, 0, 0, 0);
    AudioSystem.playBeep(1.3);
  }

  private createBackground(): void {
    // Evening sky gradient
    const sky = this.add.graphics();
    sky.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    sky.fillRect(0, 0, GAME_WIDTH, 280);

    // Stadium lights glow
    for (let i = 0; i < 4; i++) {
      const x = 80 + i * 130;
      this.add.circle(x, 30, 15, 0xfffacd, 0.8);

      const beam = this.add.graphics();
      beam.fillStyle(0xfffacd, 0.08);
      beam.fillTriangle(x, 40, x - 80, 420, x + 80, 420);
    }
  }

  private createStadium(): void {
    // Stadium stands
    this.add.rectangle(GAME_WIDTH / 2, 140, GAME_WIDTH + 40, 200, 0x2d3436);

    // Crowd simulation
    const crowd = this.add.graphics();
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 25; col++) {
        const x = 20 + col * 22 + (row % 2) * 11;
        const y = 60 + row * 28;
        const colors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0xffffff];
        const color = colors[Math.floor(Math.random() * colors.length)];
        crowd.fillStyle(color, 0.7);
        crowd.fillCircle(x, y, 6);
      }
    }

    // Field gradient
    const fieldGradient = this.add.graphics();
    fieldGradient.fillGradientStyle(0x1e8449, 0x1e8449, 0x196f3d, 0x196f3d, 1);
    fieldGradient.fillRect(0, 240, GAME_WIDTH, GAME_HEIGHT - 240);

    // Grass stripes
    for (let i = 0; i < 12; i++) {
      const y = 300 + i * 60;
      const color = i % 2 === 0 ? 0x229954 : 0x1e8449;
      this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, 60, color);
    }

    // Field markings
    const lines = this.add.graphics();
    lines.lineStyle(4, 0xffffff, 0.85);

    // Goal area box
    lines.strokeRect(80, 300, GAME_WIDTH - 160, 300);

    // 6-yard box
    lines.strokeRect(140, 300, GAME_WIDTH - 280, 120);

    // Penalty arc
    lines.beginPath();
    lines.arc(GAME_WIDTH / 2, 600, 80, Math.PI * 1.2, Math.PI * 1.8, false);
    lines.strokePath();

    // Penalty spot
    this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT - 200, 5, 0xffffff);

    // Spot glow
    const spotGlow = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT - 200, 20, 0xffffff, 0.1);
    this.tweens.add({
      targets: spotGlow,
      scale: 1.5,
      alpha: 0,
      duration: 1500,
      repeat: -1
    });
  }

  private createGoal(): void {
    const goalX = GAME_WIDTH / 2;
    const goalY = this.goalTop + this.goalHeight / 2;

    // Goal depth shadow
    this.add.rectangle(goalX, goalY + 5, this.goalWidth - 10, this.goalHeight - 10, 0x000000, 0.5).setDepth(0);

    // Net back panel
    const netBack = this.add.graphics().setDepth(1);
    netBack.fillStyle(0x1a1a1a, 0.6);
    netBack.fillRect(this.goalLeft + 5, this.goalTop + 5, this.goalWidth - 10, this.goalHeight - 10);

    // Net pattern
    const net = this.add.graphics().setDepth(2);
    net.lineStyle(1, 0xffffff, 0.5);
    for (let x = this.goalLeft + 15; x < this.goalRight - 10; x += 15) {
      net.beginPath();
      net.moveTo(x, this.goalTop + 5);
      net.lineTo(x, this.goalBottom - 5);
      net.strokePath();
    }
    for (let y = this.goalTop + 15; y < this.goalBottom; y += 15) {
      net.beginPath();
      net.moveTo(this.goalLeft + 5, y);
      net.lineTo(this.goalRight - 5, y);
      net.strokePath();
    }

    // Side netting (3D effect)
    const sideNet = this.add.graphics().setDepth(2);
    sideNet.lineStyle(1, 0xffffff, 0.3);
    for (let i = 0; i < 8; i++) {
      sideNet.beginPath();
      sideNet.moveTo(this.goalLeft, this.goalTop + i * 25);
      sideNet.lineTo(this.goalLeft - 25, this.goalTop + i * 25 + 30);
      sideNet.strokePath();
      sideNet.beginPath();
      sideNet.moveTo(this.goalRight, this.goalTop + i * 25);
      sideNet.lineTo(this.goalRight + 25, this.goalTop + i * 25 + 30);
      sideNet.strokePath();
    }

    // Goal frame
    const frameColor = 0xffffff;
    const frameWidth = 10;

    // Posts
    this.add.rectangle(this.goalLeft, goalY, frameWidth, this.goalHeight + 10, frameColor)
      .setStrokeStyle(2, 0xcccccc).setDepth(10);
    this.add.rectangle(this.goalRight, goalY, frameWidth, this.goalHeight + 10, frameColor)
      .setStrokeStyle(2, 0xcccccc).setDepth(10);

    // Crossbar
    this.add.rectangle(goalX, this.goalTop, this.goalWidth + frameWidth, frameWidth, frameColor)
      .setStrokeStyle(2, 0xcccccc).setDepth(10);

    // Post reflections
    const reflection = this.add.graphics().setDepth(11);
    reflection.fillStyle(0xffffff, 0.3);
    reflection.fillRect(this.goalLeft - 3, this.goalTop, 3, this.goalHeight);
    reflection.fillRect(this.goalRight - 3, this.goalTop, 3, this.goalHeight);

    // Corner target zones
    const cornerSize = 50;
    const corners = [
      { x: this.goalLeft + cornerSize/2 + 10, y: this.goalTop + cornerSize/2 + 10 },
      { x: this.goalRight - cornerSize/2 - 10, y: this.goalTop + cornerSize/2 + 10 },
      { x: this.goalLeft + cornerSize/2 + 10, y: this.goalBottom - cornerSize/2 - 10 },
      { x: this.goalRight - cornerSize/2 - 10, y: this.goalBottom - cornerSize/2 - 10 },
    ];

    corners.forEach(pos => {
      const target = this.add.circle(pos.x, pos.y, cornerSize/2, YAK_COLORS.successBright, 0.3).setDepth(3);
      this.cornerTargets.push(target);

      this.tweens.add({
        targets: target,
        scale: 1.3,
        alpha: 0.1,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });

    // Add Yak stool icons as sideline decoration
    const stool1 = createStoolIcon(this, 25, this.goalBottom + 60, 1.0);
    const stool2 = createStoolIcon(this, GAME_WIDTH - 25, this.goalBottom + 60, 1.0);
    stool1.setDepth(5).setAlpha(0.6);
    stool2.setDepth(5).setAlpha(0.6);

    // Subtle rotation for personality
    stool1.setAngle(-8);
    stool2.setAngle(8);
  }

  private createGoalie(): void {
    // Use character sprite system
    this.goalie = createGoalieSprite(
      this,
      this.goalieCharacterId as any,
      GAME_WIDTH / 2,
      370
    );

    // Apply character modifiers
    const modifiers = CHARACTER_MODIFIERS[this.goalieCharacterId as any];
    if (modifiers) {
      this.goalieSpeed = 2.5 * modifiers.goalieSpeedMultiplier;
      // Width multiplier applied in collision detection
    }
  }

  private createGoalieNameplate(): void {
    const nameplateY = 180;
    
    // Nameplate background
    const nameplate = this.add.graphics();
    nameplate.fillStyle(0x000000, 0.8);
    nameplate.fillRoundedRect(GAME_WIDTH / 2 - 80, nameplateY - 20, 160, 40, 8);
    nameplate.lineStyle(2, YAK_COLORS.secondary, 0.8);
    nameplate.strokeRoundedRect(GAME_WIDTH / 2 - 80, nameplateY - 20, 160, 40, 8);
    nameplate.setDepth(25);

    // Goalie name
    const goalieName = getCharacterName(this.goalieCharacterId as any);
    const nameText = this.add.text(GAME_WIDTH / 2, nameplateY, goalieName, {
      fontSize: '18px',
      fontFamily: YAK_FONTS.title,
      color: '#f1c40f',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(26);

    // "IN GOAL" label
    const label = this.add.text(GAME_WIDTH / 2, nameplateY + 18, 'IN GOAL', {
      fontSize: '12px',
      fontFamily: YAK_FONTS.body,
      color: '#9ca3af',
    }).setOrigin(0.5).setDepth(26);

    // Pulse animation
    this.tweens.add({
      targets: nameplate,
      alpha: 0.9,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createBall(): void {
    this.spawnX = GAME_WIDTH / 2;
    this.spawnY = GAME_HEIGHT - 180;

    // Shadow
    this.ballShadow = this.add.ellipse(this.spawnX, GAME_HEIGHT - 130, 50, 18, 0x000000, 0.4);
    this.ballShadow.setDepth(4);

    // Ball container
    this.ballContainer = this.add.container(this.spawnX, this.spawnY);
    this.ballContainer.setDepth(100);

    // Ball base
    const ball = this.add.circle(0, 0, 26, 0xffffff);
    ball.setStrokeStyle(2, 0x333333);

    // Pentagon pattern
    const pattern = this.add.graphics();
    pattern.fillStyle(0x1a1a1a, 1);
    this.drawPentagon(pattern, 0, 0, 10);

    const outerDist = 18;
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      const px = Math.cos(angle) * outerDist;
      const py = Math.sin(angle) * outerDist;
      this.drawPentagon(pattern, px, py, 7);
    }

    // Highlight
    const highlight = this.add.circle(-8, -8, 8, 0xffffff, 0.5);

    this.ballContainer.add([ball, pattern, highlight]);
  }

  private drawPentagon(graphics: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number): void {
    const points: number[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180;
      points.push(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    graphics.fillPoints(points, true);
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
      this.instructionText.setText('AIM FOR THE CORNERS!');
      return;
    }

    const power = Math.min(distance / 5, 45);
    const vx = (dx / distance) * power * 0.5;
    const vy = (dy / distance) * power;

    // Trajectory preview
    let px = this.ballContainer.x;
    let py = this.ballContainer.y;
    let pvx = vx;
    let pvy = vy;

    for (let i = 0; i < 35; i++) {
      px += pvx;
      pvy *= 0.97;
      py += pvy;

      if (py < 170 || py > GAME_HEIGHT) break;

      if (i % 2 === 0) {
        const alpha = 0.9 - (i / 40);
        const size = 8 - (i / 8);
        this.trajectoryDots.fillStyle(0xffffff, alpha);
        this.trajectoryDots.fillCircle(px, py, Math.max(size, 3));
      }
    }

    const powerPercent = Math.min((power / 45) * 100, 100);
    let color = YAK_COLORS.success;
    if (powerPercent > 50) color = YAK_COLORS.warning;
    if (powerPercent > 80) color = YAK_COLORS.danger;

    // Aim line
    this.aimLine.lineStyle(5, color, 0.9);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.ballContainer.x, this.ballContainer.y);
    const lineLen = Math.min(distance * 0.7, 100);
    const endX = this.ballContainer.x + (dx / distance) * lineLen;
    const endY = this.ballContainer.y + (dy / distance) * lineLen;
    this.aimLine.lineTo(endX, endY);
    this.aimLine.strokePath();

    const angle = Math.atan2(dy, dx);
    this.aimLine.fillStyle(color, 0.9);
    this.aimLine.fillTriangle(
      endX + Math.cos(angle) * 12,
      endY + Math.sin(angle) * 12,
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
      this.instructionText.setText('AIM FOR THE CORNERS!');
      return;
    }

    this.hasLaunched = true;
    this.instructionText.setVisible(false);
    GameStateService.startTimer();

    const power = Math.min(distance / 5, 45);
    const vx = (dx / distance) * power * 0.5;
    const vy = (dy / distance) * power;

    this.kickBall(vx, vy);
  }

  private kickBall(vx: number, vy: number): void {
    // Kick sound
    AudioSystem.playSwoosh();

    let velocityX = vx;
    let velocityY = vy;

    this.trailPoints = [];
    this.trail.clear();

    this.cornerTargets.forEach(t => t.setVisible(false));

    const updateHandler = () => {
      if (!this.hasLaunched) {
        this.events.off('update', updateHandler);
        return;
      }

      velocityY *= 0.97;
      velocityX *= 0.99;

      this.ballContainer.x += velocityX;
      this.ballContainer.y += velocityY;
      this.ballContainer.rotation += velocityX * 0.06;

      // Perspective scale
      const scale = Math.max(0.35, 1 - (this.spawnY - this.ballContainer.y) / 700);
      this.ballContainer.setScale(scale);

      // Shadow
      this.ballShadow.x = this.ballContainer.x;
      this.ballShadow.y = Math.min(GAME_HEIGHT - 130, this.goalBottom + 20);
      this.ballShadow.setScale(scale * 0.8, scale * 0.3);
      this.ballShadow.setAlpha(0.4 * scale);

      // Trail
      this.trailPoints.push({ x: this.ballContainer.x, y: this.ballContainer.y });
      if (this.trailPoints.length > 15) this.trailPoints.shift();

      this.trail.clear();
      for (let i = 1; i < this.trailPoints.length; i++) {
        const alpha = (i / this.trailPoints.length) * 0.5;
        const size = (i / this.trailPoints.length) * 12 * scale;
        this.trail.fillStyle(0xffffff, alpha);
        this.trail.fillCircle(this.trailPoints[i].x, this.trailPoints[i].y, size);
      }

      // Goal area check
      if (this.ballContainer.y < this.goalBottom && this.ballContainer.y > this.goalTop) {
        if (this.ballContainer.x > this.goalLeft + 10 && this.ballContainer.x < this.goalRight - 10) {
          // Check goalie
          const goalieWidth = 70;
          const goalieLeft = this.goalie.x - goalieWidth / 2;
          const goalieRight = this.goalie.x + goalieWidth / 2;

          if (this.ballContainer.x > goalieLeft && this.ballContainer.x < goalieRight &&
              this.ballContainer.y > 320) {
            this.events.off('update', updateHandler);
            this.handleBlocked();
            return;
          }

          // GOAL!
          if (this.ballContainer.y < this.goalTop + 50) {
            this.events.off('update', updateHandler);
            this.handleGoal();
            return;
          }
        }
      }

      // Post hit
      if (this.ballContainer.y < this.goalBottom + 20 && this.ballContainer.y > this.goalTop - 20) {
        if (Math.abs(this.ballContainer.x - this.goalLeft) < 15 ||
            Math.abs(this.ballContainer.x - this.goalRight) < 15) {
          this.events.off('update', updateHandler);
          this.handlePostHit();
          return;
        }
        // Crossbar
        if (this.ballContainer.y < this.goalTop + 10 &&
            this.ballContainer.x > this.goalLeft &&
            this.ballContainer.x < this.goalRight) {
          this.events.off('update', updateHandler);
          this.handlePostHit();
          return;
        }
      }

      // Miss
      if (this.ballContainer.y < this.goalTop - 80 ||
          this.ballContainer.x < 10 ||
          this.ballContainer.x > GAME_WIDTH - 10) {
        this.events.off('update', updateHandler);
        this.handleMiss('WIDE!');
        return;
      }

      // Stopped
      if (Math.abs(velocityY) < 0.5 && this.ballContainer.y < this.spawnY - 100) {
        this.events.off('update', updateHandler);
        this.handleMiss('SHORT!');
        return;
      }
    };

    this.events.on('update', updateHandler);
  }

  private handleGoal(): void {
    this.trail.clear();

    // Audio
    AudioSystem.playSuccess();
    this.time.delayedCall(100, () => AudioSystem.playCrowdCheer());

    // Visual effects
    flashScreen(this, 'green', 150);
    shakeCamera(this, 'light');
    createConfetti(this, this.ballContainer.x, this.ballContainer.y, {
      count: 30,
      spread: 150,
      height: 250,
    });

    // Goalie reaction (disappointed)
    this.tweens.add({
      targets: this.goalie,
      y: this.goalie.y + 5,
      rotation: 0.1,
      duration: 300,
      yoyo: true,
    });

    this.tweens.add({
      targets: this.ballContainer,
      y: this.ballContainer.y + 40,
      scale: 0.25,
      alpha: 0.6,
      duration: 300,
      ease: 'Power2'
    });

    this.tweens.add({
      targets: this.ballShadow,
      alpha: 0,
      duration: 200
    });

    // Net ripple
    for (let i = 0; i < 3; i++) {
      const ripple = this.add.circle(this.ballContainer.x, this.ballContainer.y, 20, 0xffffff, 0)
        .setStrokeStyle(3, 0xffffff, 0.6).setDepth(3);

      this.tweens.add({
        targets: ripple,
        scale: 3 + i,
        alpha: 0,
        duration: 500 + i * 150,
        delay: i * 100,
        onComplete: () => ripple.destroy()
      });
    }

    // Show character quote (taunt on goal scored)
    const quote = getCharacterQuote(this.goalieCharacterId as any, 'taunt');
    this.showGoalieQuote(quote, YAK_COLORS.danger);

    showSuccessEffect(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GOAL!', () => {
      AudioSystem.playWhoosh();
      this.scene.start('WiffleScene');
    });
  }

  private showGoalieQuote(text: string, color: number): void {
    // Remove previous quote if exists
    if (this.goalieQuoteText) {
      this.goalieQuoteText.destroy();
    }

    // Create quote bubble above goalie
    const quoteY = this.goalie.y - 80;
    const bubble = this.add.graphics();
    bubble.fillStyle(0x1a1a1a, 0.95);
    bubble.fillRoundedRect(GAME_WIDTH / 2 - 100, quoteY - 20, 200, 40, 12);
    bubble.lineStyle(3, color, 1);
    bubble.strokeRoundedRect(GAME_WIDTH / 2 - 100, quoteY - 20, 200, 40, 12);
    bubble.setDepth(200);

    // Quote text
    this.goalieQuoteText = this.add.text(GAME_WIDTH / 2, quoteY, text, {
      fontSize: '16px',
      fontFamily: YAK_FONTS.title,
      color: `#${color.toString(16).padStart(6, '0')}`,
      fontStyle: 'bold',
      align: 'center',
    }).setOrigin(0.5).setDepth(201);

    // Speech bubble tail
    const tail = this.add.graphics();
    tail.fillStyle(0x1a1a1a, 0.95);
    tail.fillTriangle(
      GAME_WIDTH / 2 - 15, quoteY + 20,
      GAME_WIDTH / 2 + 15, quoteY + 20,
      GAME_WIDTH / 2, quoteY + 35
    );
    tail.lineStyle(3, color, 1);
    tail.beginPath();
    tail.moveTo(GAME_WIDTH / 2 - 15, quoteY + 20);
    tail.lineTo(GAME_WIDTH / 2, quoteY + 35);
    tail.lineTo(GAME_WIDTH / 2 + 15, quoteY + 20);
    tail.closePath();
    tail.strokePath();
    tail.setDepth(200);

    // Animate in
    [bubble, this.goalieQuoteText, tail].forEach(obj => {
      obj.setScale(0);
      this.tweens.add({
        targets: obj,
        scale: 1,
        duration: 200,
        ease: 'Back.easeOut',
      });
    });

    // Auto-hide after delay
    this.time.delayedCall(2000, () => {
      this.tweens.add({
        targets: [bubble, this.goalieQuoteText, tail],
        alpha: 0,
        y: quoteY - 20,
        duration: 300,
        onComplete: () => {
          bubble.destroy();
          tail.destroy();
          if (this.goalieQuoteText) {
            this.goalieQuoteText.destroy();
            this.goalieQuoteText = undefined as any;
          }
        },
      });
    });
  }

  private handleBlocked(): void {
    this.missCount++;
    this.ui.missText.setText(`Saves: ${this.missCount}`);
    GameStateService.recordMiss('goalie');

    // Audio
    AudioSystem.playFail();

    // Goalie dive animation
    const diveDir = this.ballContainer.x < GAME_WIDTH / 2 ? -1 : 1;
    this.tweens.add({
      targets: this.goalie,
      x: this.goalie.x + diveDir * 30,
      rotation: diveDir * 0.3,
      duration: 200,
      yoyo: true
    });

    // Ball deflect
    this.tweens.add({
      targets: this.ballContainer,
      x: this.ballContainer.x + (Math.random() - 0.5) * 150,
      y: this.ballContainer.y + 150,
      rotation: this.ballContainer.rotation + Math.PI * 3,
      duration: 600,
      ease: 'Bounce.easeOut'
    });

    // Show character quote
    const quote = getCharacterQuote(this.goalieCharacterId as any, 'save');
    this.showGoalieQuote(quote, YAK_COLORS.secondary);

    showFailEffect(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'SAVED!');

    this.time.delayedCall(900, () => this.resetBall());
  }

  private handlePostHit(): void {
    this.missCount++;
    this.ui.missText.setText(`Saves: ${this.missCount}`);
    GameStateService.recordMiss('goalie');

    // Audio
    AudioSystem.playBounce(0.9);

    this.cameras.main.shake(250, 0.02);

    const flash = this.add.circle(this.ballContainer.x, this.ballContainer.y, 25, 0xffffff).setDepth(150);
    this.tweens.add({
      targets: flash,
      scale: 4,
      alpha: 0,
      duration: 400,
      onComplete: () => flash.destroy()
    });

    this.tweens.add({
      targets: this.ballContainer,
      x: GAME_WIDTH / 2 + (Math.random() - 0.5) * 100,
      y: this.ballContainer.y + 200,
      rotation: this.ballContainer.rotation - Math.PI * 2,
      duration: 500,
      ease: 'Bounce.easeOut'
    });

    showFailEffect(this, GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'POST!');

    this.time.delayedCall(900, () => this.resetBall());
  }

  private handleMiss(message: string): void {
    this.missCount++;
    this.ui.missText.setText(`Saves: ${this.missCount}`);
    GameStateService.recordMiss('goalie');

    // Audio
    AudioSystem.playFail();

    showFailEffect(this, this.ballContainer.x, Math.min(this.ballContainer.y, 250), message);

    this.time.delayedCall(700, () => this.resetBall());
  }

  private resetBall(): void {
    this.hasLaunched = false;
    this.trailPoints = [];
    this.trail.clear();

    this.ballContainer.setPosition(this.spawnX, this.spawnY);
    this.ballContainer.setRotation(0);
    this.ballContainer.setScale(1);
    this.ballContainer.setAlpha(1);

    this.ballShadow.setPosition(this.spawnX, GAME_HEIGHT - 130);
    this.ballShadow.setScale(1, 0.4);
    this.ballShadow.setAlpha(0.4);

    this.cornerTargets.forEach(t => t.setVisible(true));

    this.instructionText.setVisible(true);
    this.instructionText.setText('AIM FOR THE CORNERS!');
  }

  update(): void {
    // Goalie patrol
    if (!this.hasLaunched) {
      this.goalie.x += this.goalieSpeed * this.goalieDirection;

      const centerLeft = GAME_WIDTH / 2 - 80;
      const centerRight = GAME_WIDTH / 2 + 80;

      if (this.goalie.x > centerRight) {
        this.goalieDirection = -1;
      } else if (this.goalie.x < centerLeft) {
        this.goalieDirection = 1;
      }

      this.goalieBobOffset += 0.1;
      this.goalie.y = 370 + Math.sin(this.goalieBobOffset) * 3;
    }

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
