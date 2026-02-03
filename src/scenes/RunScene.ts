import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, getRandomSuccess, getRandomFail, createStoolIcon } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { createSceneUI, updateTimer, showSuccessEffect, showFailEffect, initTimerPressureVisuals, cleanupTimerPressureVisuals, type SceneUI } from '../utils/UIHelper';
import {
  createConfetti, createRipple, shakeCamera, flashScreen,
  createStarBurst, createFirework, createMegaConfetti, createDustPoof,
  createEnhancedTrail, createVictoryRays, createRingBurst, createImpactSparks,
  createSpeedLines, createFloatingText
} from '../utils/VisualEffects';
import {
  zoomPunch, colorFlash, slowMotion, freezeFrame, vignettePulse,
  chromaticAberration
} from '../utils/ScreenEffects';
import {
  windUp, impactJuice, popScale, wobble, breathe,
  rainbowShimmer, applyMotionJuice, popIn
} from '../utils/JuiceFactory';
import { getCharacterQuote } from '../data/characterQuotes';
import { AudioSystem } from '../utils/AudioSystem';
import type { CharacterId } from '../types';

/**
 * Represents a bag sitting on the board with perpetual sliding physics
 */
interface BoardBag {
  container: Phaser.GameObjects.Container;
  shadow: Phaser.GameObjects.Ellipse;
  velocityX: number;
  velocityY: number;
  rotation: number;
}

/**
 * HYBRID CORNHOLE - Authentic feel + Gauntlet timer
 *
 * MECHANICS:
 * - Slingshot drag-to-throw
 * - Multiple bags accumulate on board (up to 5 per cycle)
 * - Bags slide perpetually with very low friction
 * - After 5 misses, all bags clear and cycle resets
 * - Timer counts UP with color escalation
 */
export class RunScene extends Phaser.Scene {
  // Active beanbag (the one being thrown)
  private bagContainer!: Phaser.GameObjects.Container;
  private bagShadow!: Phaser.GameObjects.Ellipse;

  // Bags sitting on the board
  private boardBags: BoardBag[] = [];
  private bagsThisRound = 0;
  private readonly MAX_BAGS_PER_ROUND = 5;

  // Graphics
  private aimLine!: Phaser.GameObjects.Graphics;
  private trajectoryDots!: Phaser.GameObjects.Graphics;

  // Input state
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private hasLaunched = false;
  private timerStarted = false;
  private isTransitioning = false;

  // UI elements
  private ui!: SceneUI;
  private instructionText!: Phaser.GameObjects.Text;
  private bagCountText!: Phaser.GameObjects.Text;
  private missCount = 0;

  // Board/hole positions
  private holeX = 0;
  private holeY = 0;
  private holeRadius = 45;
  private spawnX = 0;
  private spawnY = 0;

  // Board bounds
  private boardTop = 0;
  private boardBottom = 0;
  private boardLeft = 0;
  private boardRight = 0;

  // Streak tracking
  private consecutiveHits = 0;
  private lastShotQuality: 'normal' | 'perfect' | 'legendary' = 'normal';

  // Enhanced effects
  private enhancedTrail: { update: () => void; destroy: () => void } | null = null;
  private ambientLights: Phaser.GameObjects.Graphics[] = [];
  private dustParticleTimer: Phaser.Time.TimerEvent | null = null;
  private holePulseGlow: Phaser.GameObjects.Graphics | null = null;

  // Breathing animation tween
  private breatheTween: Phaser.Tweens.Tween | null = null;

  // Board bag update handler
  private boardBagUpdateHandler: (() => void) | null = null;

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    // Reset state
    this.missCount = 0;
    this.hasLaunched = false;
    this.timerStarted = false;
    this.isDragging = false;
    this.isTransitioning = false;
    this.consecutiveHits = 0;
    this.lastShotQuality = 'normal';
    this.enhancedTrail = null;
    this.ambientLights = [];
    this.dustParticleTimer = null;
    this.holePulseGlow = null;
    this.breatheTween = null;
    this.boardBags = [];
    this.bagsThisRound = 0;

    // Initialize audio
    AudioSystem.init();

    this.createBackground();

    // Graphics layers
    this.aimLine = this.add.graphics().setDepth(50);
    this.trajectoryDots = this.add.graphics().setDepth(51);

    this.createBoard();
    this.createBeanbag();

    // Unified UI header (station 0 = cornhole)
    this.ui = createSceneUI(this, 0, 'Misses');
    initTimerPressureVisuals(this);

    // Bag count indicator
    this.bagCountText = this.add.text(GAME_WIDTH - 20, 100, '', {
      fontSize: '18px',
      fontFamily: YAK_FONTS.title,
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(1, 0).setDepth(100);
    this.updateBagCountDisplay();

    // Custom instruction text for this scene
    this.instructionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'DRAG TO AIM & THROW', {
      fontSize: '22px',
      fontFamily: YAK_FONTS.title,
      color: YAK_COLORS.textGold,
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

    // Start board bag physics update loop
    this.startBoardBagPhysics();

    // Entrance effects
    this.cameras.main.fadeIn(400, 0, 0, 0);
    AudioSystem.playBeep(1.2);
  }

  private updateBagCountDisplay(): void {
    const remaining = this.MAX_BAGS_PER_ROUND - this.bagsThisRound;
    if (this.bagsThisRound > 0) {
      this.bagCountText.setText(`Bags: ${remaining}/${this.MAX_BAGS_PER_ROUND}`);
      // Color based on remaining
      if (remaining <= 1) {
        this.bagCountText.setColor('#ef4444');
      } else if (remaining <= 2) {
        this.bagCountText.setColor('#fbbf24');
      } else {
        this.bagCountText.setColor(YAK_COLORS.textGold);
      }
    } else {
      this.bagCountText.setText('');
    }
  }

  private startBoardBagPhysics(): void {
    // Update all bags on the board with perpetual sliding
    this.boardBagUpdateHandler = () => {
      const boardSlope = 0.015; // Slight downward slope toward player
      const slideFriction = 0.995; // Very low friction - bags slide forever
      const minSlideSpeed = 0.05; // Minimum speed to keep sliding

      for (let i = this.boardBags.length - 1; i >= 0; i--) {
        const bag = this.boardBags[i];

        // Apply slope (bags naturally slide down toward bottom of board)
        bag.velocityY += boardSlope;

        // Apply friction
        bag.velocityX *= slideFriction;
        bag.velocityY *= slideFriction;

        // Ensure minimum movement for perpetual slide effect
        const speed = Math.sqrt(bag.velocityX * bag.velocityX + bag.velocityY * bag.velocityY);
        if (speed < minSlideSpeed && speed > 0) {
          // Add tiny random drift
          bag.velocityX += (Math.random() - 0.5) * 0.02;
          bag.velocityY += Math.random() * 0.03;
        }

        // Update position
        bag.container.x += bag.velocityX;
        bag.container.y += bag.velocityY;

        // Gentle rotation based on movement
        bag.rotation += bag.velocityX * 0.01;
        bag.container.rotation = bag.rotation;

        // Update shadow
        bag.shadow.x = bag.container.x;
        bag.shadow.y = bag.container.y + 5;

        // Board edge collision - bounce off edges
        if (bag.container.x < this.boardLeft + 24) {
          bag.container.x = this.boardLeft + 24;
          bag.velocityX = Math.abs(bag.velocityX) * 0.5;
        }
        if (bag.container.x > this.boardRight - 24) {
          bag.container.x = this.boardRight - 24;
          bag.velocityX = -Math.abs(bag.velocityX) * 0.5;
        }
        if (bag.container.y < this.boardTop + 24) {
          bag.container.y = this.boardTop + 24;
          bag.velocityY = Math.abs(bag.velocityY) * 0.5;
        }

        // Check if bag slides off the bottom of board
        if (bag.container.y > this.boardBottom - 20) {
          // Bag slides off - remove it
          this.removeBoardBag(i);
        }

        // Check if bag slides into hole!
        const distToHole = Phaser.Math.Distance.Between(
          bag.container.x, bag.container.y,
          this.holeX, this.holeY
        );
        if (distToHole < this.holeRadius - 10) {
          // Bag slid into hole! Success!
          this.removeBoardBag(i);
          if (!this.isTransitioning) {
            this.handleSuccess(distToHole, speed);
          }
        }
      }
    };

    this.events.on('update', this.boardBagUpdateHandler);
  }

  private removeBoardBag(index: number): void {
    const bag = this.boardBags[index];
    if (bag) {
      // Animate out
      this.tweens.add({
        targets: [bag.container, bag.shadow],
        alpha: 0,
        scale: 0.5,
        duration: 200,
        onComplete: () => {
          bag.container.destroy();
          bag.shadow.destroy();
        }
      });
      this.boardBags.splice(index, 1);
    }
  }

  private createBackground(): void {
    // 1. Hardwood Court Floor
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xd2a679, 0xd2a679, 0x8b5a2b, 0x8b5a2b, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Wood Planks Pattern
    const plankGraphics = this.add.graphics();
    plankGraphics.lineStyle(1, 0x8b5a2b, 0.3);
    const plankWidth = 40;

    for (let x = 0; x < GAME_WIDTH; x += plankWidth) {
      plankGraphics.moveTo(x, 0);
      plankGraphics.lineTo(x, GAME_HEIGHT);
    }
    for (let x = 0; x < GAME_WIDTH; x += plankWidth) {
      for (let y = 0; y < GAME_HEIGHT; y += 150) {
        if (Math.random() > 0.3) {
          const yOffset = y + (Math.random() * 100);
          plankGraphics.moveTo(x, yOffset);
          plankGraphics.lineTo(x + plankWidth, yOffset);
        }
      }
    }
    plankGraphics.strokePath();

    // 3. Floor reflections
    const floorReflection = this.add.graphics().setDepth(1);
    floorReflection.fillStyle(0xffffff, 0.03);
    floorReflection.fillRect(0, GAME_HEIGHT * 0.6, GAME_WIDTH, GAME_HEIGHT * 0.4);
    floorReflection.fillStyle(0xffffff, 0.02);
    floorReflection.fillRect(0, GAME_HEIGHT * 0.7, GAME_WIDTH, GAME_HEIGHT * 0.3);

    // 4. Court Lines
    const courtLines = this.add.graphics();
    courtLines.lineStyle(4, 0xffffff, 0.9);

    courtLines.beginPath();
    courtLines.moveTo(0, GAME_HEIGHT - 50);
    courtLines.lineTo(GAME_WIDTH, GAME_HEIGHT - 50);
    courtLines.strokePath();

    courtLines.beginPath();
    courtLines.arc(GAME_WIDTH / 2, 100, 250, 0, Math.PI, false);
    courtLines.strokePath();

    const paint = this.add.graphics();
    paint.fillStyle(YAK_COLORS.primary, 0.2);
    paint.fillRect(GAME_WIDTH / 2 - 80, 0, 160, 300);

    courtLines.strokeRect(GAME_WIDTH / 2 - 80, 0, 160, 300);

    courtLines.beginPath();
    courtLines.arc(GAME_WIDTH / 2, 300, 80, 0, Math.PI, false);
    courtLines.strokePath();

    // 5. Vignette
    const vignette = this.add.graphics();
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.6, 0.6);
    vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 6. Stadium lights
    this.createStadiumLights();

    // 7. Ambient dust
    this.createAmbientDust();
  }

  private createStadiumLights(): void {
    const lightPositions = [
      { x: GAME_WIDTH * 0.2, y: 0 },
      { x: GAME_WIDTH * 0.5, y: 0 },
      { x: GAME_WIDTH * 0.8, y: 0 },
    ];

    lightPositions.forEach((pos, index) => {
      const light = this.add.graphics().setDepth(2);
      this.ambientLights.push(light);

      const drawLightCone = (alpha: number) => {
        light.clear();
        light.fillStyle(0xffffee, alpha * 0.08);
        light.beginPath();
        light.moveTo(pos.x - 30, pos.y);
        light.lineTo(pos.x - 100, GAME_HEIGHT * 0.5);
        light.lineTo(pos.x + 100, GAME_HEIGHT * 0.5);
        light.lineTo(pos.x + 30, pos.y);
        light.closePath();
        light.fillPath();

        light.fillStyle(0xffffee, alpha * 0.04);
        light.beginPath();
        light.moveTo(pos.x - 15, pos.y);
        light.lineTo(pos.x - 50, GAME_HEIGHT * 0.4);
        light.lineTo(pos.x + 50, GAME_HEIGHT * 0.4);
        light.lineTo(pos.x + 15, pos.y);
        light.closePath();
        light.fillPath();
      };

      drawLightCone(1);

      const pulseObj = { value: 1 };
      this.tweens.add({
        targets: pulseObj,
        value: 0.7,
        duration: 2000 + index * 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        onUpdate: () => drawLightCone(pulseObj.value),
      });
    });
  }

  private createAmbientDust(): void {
    this.dustParticleTimer = this.time.addEvent({
      delay: 300,
      callback: () => {
        if (Math.random() > 0.6) return;

        const dust = this.add.circle(
          Math.random() * GAME_WIDTH,
          Math.random() * GAME_HEIGHT * 0.7,
          Math.random() * 2 + 1,
          0xffffff,
          Math.random() * 0.15 + 0.05
        ).setDepth(3);

        this.tweens.add({
          targets: dust,
          x: dust.x + (Math.random() - 0.5) * 100,
          y: dust.y + Math.random() * 50 - 25,
          alpha: 0,
          duration: 3000 + Math.random() * 2000,
          ease: 'Sine.easeInOut',
          onComplete: () => dust.destroy(),
        });
      },
      loop: true,
    });
  }

  private createBoard(): void {
    const boardX = GAME_WIDTH / 2;
    const boardY = 320;
    const boardWidth = 140;
    const boardHeight = 220;

    // Store board bounds
    this.boardTop = boardY - boardHeight / 2;
    this.boardBottom = boardY + boardHeight / 2;
    this.boardLeft = boardX - boardWidth / 2;
    this.boardRight = boardX + boardWidth / 2;

    // Board shadow
    this.add.rectangle(boardX + 8, boardY + 8, boardWidth, boardHeight, 0x000000, 0.3).setDepth(2);

    // Main board body
    const board = this.add.rectangle(boardX, boardY, boardWidth, boardHeight, 0xdeb887).setDepth(3);
    board.setStrokeStyle(3, 0x8b4513);

    // Wood grain
    const grain = this.add.graphics().setDepth(4);
    grain.lineStyle(1, 0xd2a679, 0.6);
    for (let i = -boardHeight / 2 + 20; i < boardHeight / 2; i += 15) {
      grain.beginPath();
      grain.moveTo(boardX - boardWidth / 2 + 5, boardY + i);
      grain.lineTo(boardX + boardWidth / 2 - 5, boardY + i + (Math.random() - 0.5) * 4);
      grain.strokePath();
    }

    // The hole
    this.holeX = boardX;
    this.holeY = boardY - 40;
    this.holeRadius = 38;

    // Hole depth layers
    this.add.circle(this.holeX + 2, this.holeY + 2, this.holeRadius, 0x000000, 0.5).setDepth(5);
    this.add.circle(this.holeX, this.holeY, this.holeRadius + 4, 0x8b4513).setDepth(6);
    this.add.circle(this.holeX, this.holeY, this.holeRadius, 0x1a1a1a).setDepth(7);
    this.add.circle(this.holeX, this.holeY, this.holeRadius - 6, 0x0a0a0a).setDepth(8);

    // Board legs
    this.add.rectangle(boardX - 40, boardY + 120, 10, 40, 0x5c4033).setDepth(1);
    this.add.rectangle(boardX + 40, boardY + 120, 10, 40, 0x5c4033).setDepth(1);

    // Stool icons
    const leftStool = createStoolIcon(this, boardX - 120, boardY + 80, 1.0);
    const rightStool = createStoolIcon(this, boardX + 120, boardY + 80, 1.0);
    leftStool.setDepth(2).setAlpha(0.6);
    rightStool.setDepth(2).setAlpha(0.6);

    this.createHolePulseEffect();
  }

  private createHolePulseEffect(): void {
    this.holePulseGlow = this.add.graphics().setDepth(6);

    const drawGlow = (scale: number, alpha: number) => {
      if (!this.holePulseGlow) return;
      this.holePulseGlow.clear();

      this.holePulseGlow.lineStyle(3 * scale, YAK_COLORS.success, alpha * 0.4);
      this.holePulseGlow.strokeCircle(this.holeX, this.holeY, this.holeRadius + 8 * scale);

      this.holePulseGlow.lineStyle(2 * scale, YAK_COLORS.successBright, alpha * 0.6);
      this.holePulseGlow.strokeCircle(this.holeX, this.holeY, this.holeRadius + 4 * scale);
    };

    const pulseObj = { scale: 1, alpha: 1 };
    this.tweens.add({
      targets: pulseObj,
      scale: 1.3,
      alpha: 0.3,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: () => drawGlow(pulseObj.scale, pulseObj.alpha),
    });

    drawGlow(1, 1);
  }

  private createBeanbag(): void {
    this.spawnX = GAME_WIDTH / 2;
    this.spawnY = GAME_HEIGHT - 120;

    // Shadow
    this.bagShadow = this.add.ellipse(this.spawnX, GAME_HEIGHT - 95, 45, 18, 0x000000, 0.35);
    this.bagShadow.setDepth(10);

    // Container
    this.bagContainer = this.add.container(this.spawnX, this.spawnY);
    this.bagContainer.setDepth(100);

    this.addBagGraphics(this.bagContainer);

    this.startBreathingAnimation();
  }

  private addBagGraphics(container: Phaser.GameObjects.Container): void {
    const bagBody = this.add.rectangle(0, 0, 48, 48, YAK_COLORS.primary);
    bagBody.setStrokeStyle(2, YAK_COLORS.primaryDark);

    const bagShading = this.add.graphics();
    bagShading.fillStyle(0xff6b6b, 0.2);
    bagShading.fillRect(-24, -24, 24, 48);

    const stitching = this.add.graphics();
    stitching.lineStyle(2, YAK_COLORS.secondary, 0.8);
    stitching.beginPath();
    stitching.moveTo(-18, 0); stitching.lineTo(18, 0);
    stitching.moveTo(0, -18); stitching.lineTo(0, 18);
    stitching.strokePath();

    container.add([bagShading, bagBody, stitching]);
  }

  private createBoardBag(x: number, y: number, vx: number, vy: number, rotation: number): BoardBag {
    const container = this.add.container(x, y).setDepth(95);
    this.addBagGraphics(container);
    container.rotation = rotation;

    const shadow = this.add.ellipse(x, y + 5, 40, 15, 0x000000, 0.3).setDepth(94);

    return {
      container,
      shadow,
      velocityX: vx * 0.3, // Inherit some velocity
      velocityY: vy * 0.3,
      rotation,
    };
  }

  private startBreathingAnimation(): void {
    if (this.breatheTween) {
      this.breatheTween.stop();
    }
    this.breatheTween = breathe(this, this.bagContainer, { duration: 2000, amplitude: 0.03 });
  }

  private stopBreathingAnimation(): void {
    if (this.breatheTween) {
      this.breatheTween.stop();
      this.breatheTween = null;
      this.bagContainer.setScale(1);
    }
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.hasLaunched || this.isTransitioning) return;
    this.isDragging = true;
    this.dragStartX = pointer.x;
    this.dragStartY = pointer.y;

    this.stopBreathingAnimation();
    popScale(this, this.bagContainer, 0.85, 80);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging || this.hasLaunched || this.isTransitioning) return;

    const dx = pointer.x - this.dragStartX;
    const dy = pointer.y - this.dragStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    this.aimLine.clear();
    this.trajectoryDots.clear();

    if (distance < 20) {
      this.instructionText.setText('DRAG TO AIM & THROW');
      this.bagContainer.setScale(1);
      return;
    }

    const power = Math.min(distance / 7, 45);
    const powerPercent = Math.min((power / 45) * 100, 100);
    const squashAmount = powerPercent / 100 * 0.2;
    this.bagContainer.setScale(1 - squashAmount * 0.5, 1 + squashAmount);

    const vx = (dx / distance) * power * 0.35;
    const vy = (dy / distance) * power * 1.1;

    // Trajectory preview
    const gravity = 0.5;
    let px = this.bagContainer.x;
    let py = this.bagContainer.y;
    let pvx = vx;
    let pvy = vy;

    for (let i = 0; i < 40; i++) {
      px += pvx;
      pvy += gravity;
      py += pvy;

      if (py > GAME_HEIGHT + 50) break;

      if (i % 3 === 0) {
        const alpha = 0.8 - (i / 50);
        const dotIndex = Math.floor(i / 3);
        const totalDots = 13;

        let dotColor = YAK_COLORS.success;
        if (dotIndex > totalDots * 0.6) dotColor = YAK_COLORS.warning;
        if (dotIndex > totalDots * 0.8) dotColor = YAK_COLORS.danger;

        this.trajectoryDots.fillStyle(dotColor, alpha * 0.3);
        this.trajectoryDots.fillCircle(px, py, 6);

        this.trajectoryDots.fillStyle(dotColor, alpha);
        this.trajectoryDots.fillCircle(px, py, 3);
      }
    }

    // Aim line
    let color = YAK_COLORS.success;
    if (powerPercent > 60) color = YAK_COLORS.warning;
    if (powerPercent > 90) color = YAK_COLORS.danger;

    const pulseAlpha = 0.4 + Math.sin(this.time.now * 0.01) * 0.2;

    this.aimLine.lineStyle(8, color, pulseAlpha * 0.3);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.bagContainer.x, this.bagContainer.y);
    const lineLen = Math.min(distance * 0.7, 100);
    const endX = this.bagContainer.x + (dx / distance) * lineLen;
    const endY = this.bagContainer.y - (dy / distance) * lineLen;
    this.aimLine.lineTo(endX, endY);
    this.aimLine.strokePath();

    this.aimLine.lineStyle(3, color, 0.8);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.bagContainer.x, this.bagContainer.y);
    this.aimLine.lineTo(endX, endY);
    this.aimLine.strokePath();

    // Arrow head
    const arrowSize = 10;
    const angle = Math.atan2(-dy, dx);
    this.aimLine.fillStyle(color, 0.8);
    this.aimLine.beginPath();
    this.aimLine.moveTo(endX, endY);
    this.aimLine.lineTo(endX - Math.cos(angle - 0.4) * arrowSize, endY + Math.sin(angle - 0.4) * arrowSize);
    this.aimLine.lineTo(endX - Math.cos(angle + 0.4) * arrowSize, endY + Math.sin(angle + 0.4) * arrowSize);
    this.aimLine.closePath();
    this.aimLine.fillPath();

    this.instructionText.setText(`POWER: ${Math.round(powerPercent)}%`);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isDragging || this.hasLaunched || this.isTransitioning) return;

    this.isDragging = false;
    this.aimLine.clear();
    this.trajectoryDots.clear();

    const dx = pointer.x - this.dragStartX;
    const dy = pointer.y - this.dragStartY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 20) {
      this.instructionText.setText('DRAG TO AIM & THROW');
      this.bagContainer.setScale(1);
      this.startBreathingAnimation();
      return;
    }

    this.hasLaunched = true;
    this.instructionText.setVisible(false);
    this.bagsThisRound++;
    this.updateBagCountDisplay();

    if (!this.timerStarted) {
      this.timerStarted = true;
      GameStateService.startTimer();
    }

    const power = Math.min(distance / 7, 45);
    const vx = (dx / distance) * power * 0.35;
    const vy = (dy / distance) * power * 1.1;

    const dirX = dx / distance;
    const dirY = dy / distance;

    windUp(this, this.bagContainer, dirX, -dirY, () => {
      if (power > 30) {
        zoomPunch(this, 1.03, 100);
      }
      this.launchBag(vx, vy, power);
    }, { intensity: Math.min(power / 30, 1), duration: 100 });
  }

  private launchBag(vx: number, vy: number, power: number): void {
    AudioSystem.playSwoosh();

    let velocityX = vx;
    let velocityY = vy;
    const gravity = 0.5;
    const airFriction = 0.98;

    this.enhancedTrail = createEnhancedTrail(this, this.bagContainer, {
      color: YAK_COLORS.primary,
      glow: true,
      sparkle: 0.2,
      gradient: true,
      maxLength: 20,
      depth: 99,
    });

    let landedOnBoard = false;
    let boardLandTime = 0;

    const updateHandler = () => {
      if (!this.hasLaunched) {
        this.events.off('update', updateHandler);
        this.enhancedTrail?.destroy();
        this.enhancedTrail = null;
        return;
      }

      if (!landedOnBoard) {
        velocityY += gravity;
        velocityX *= airFriction;
        velocityY *= airFriction;
      } else {
        // On board - much lower friction for perpetual slide
        velocityX *= 0.98;
        velocityY *= 0.98;
        // Slope effect
        velocityY += 0.02;
      }

      this.bagContainer.x += velocityX;
      this.bagContainer.y += velocityY;
      this.bagContainer.rotation += velocityX * 0.05;

      if (!landedOnBoard) {
        applyMotionJuice(this, this.bagContainer, velocityX, velocityY, 0.8);
      }

      // Shadow
      this.bagShadow.x = this.bagContainer.x;
      const depthScale = Math.max(0.2, (this.bagContainer.y - 200) / 600);
      this.bagShadow.setScale(depthScale * 1.2, depthScale * 0.5);
      this.bagShadow.setAlpha(0.3 * depthScale);

      this.enhancedTrail?.update();

      // Speed lines
      const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
      if (speed > 15 && Math.random() < 0.3 && !landedOnBoard) {
        createSpeedLines(this, this.bagContainer, velocityX, velocityY, {
          count: 5, length: 30, color: 0xffffff, alpha: 0.4, depth: 98,
        });
      }

      // Wall bounce
      if (this.bagContainer.x < 0 || this.bagContainer.x > GAME_WIDTH) {
        const hitX = this.bagContainer.x < 0 ? 0 : GAME_WIDTH;
        createImpactSparks(this, hitX, this.bagContainer.y, velocityX > 0 ? Math.PI : 0, {
          intensity: 0.5, color: 0xffaa00, count: 8,
        });
        shakeCamera(this, 'light');
        velocityX = -velocityX * 0.5;
        this.bagContainer.x = Math.max(0, Math.min(GAME_WIDTH, this.bagContainer.x));
      }

      // Hole detection
      const distToHole = Phaser.Math.Distance.Between(
        this.bagContainer.x, this.bagContainer.y, this.holeX, this.holeY
      );

      if (distToHole < this.holeRadius - 15) {
        this.events.off('update', updateHandler);
        this.enhancedTrail?.destroy();
        this.enhancedTrail = null;
        this.handleSuccess(distToHole, speed);
        return;
      }

      // Board collision
      const onBoard = this.bagContainer.x > this.boardLeft && this.bagContainer.x < this.boardRight &&
                      this.bagContainer.y > this.boardTop && this.bagContainer.y < this.boardBottom;

      if (onBoard && !landedOnBoard && velocityY > 0) {
        // First landing on board
        landedOnBoard = true;
        boardLandTime = this.time.now;

        impactJuice(this, this.bagContainer, 0.6);
        createDustPoof(this, this.bagContainer.x, this.bagContainer.y, {
          color: 0xccbbaa, count: 6, size: 40, duration: 300, depth: 50,
        });

        velocityY *= 0.1;
        velocityX *= 0.7;

        // Stop trail when landed
        this.enhancedTrail?.destroy();
        this.enhancedTrail = null;
      }

      // Board edge bounces when landed
      if (landedOnBoard) {
        if (this.bagContainer.x < this.boardLeft + 24) {
          this.bagContainer.x = this.boardLeft + 24;
          velocityX = Math.abs(velocityX) * 0.5;
        }
        if (this.bagContainer.x > this.boardRight - 24) {
          this.bagContainer.x = this.boardRight - 24;
          velocityX = -Math.abs(velocityX) * 0.5;
        }
        if (this.bagContainer.y < this.boardTop + 24) {
          this.bagContainer.y = this.boardTop + 24;
          velocityY = Math.abs(velocityY) * 0.5;
        }

        // Check if bag slides off bottom
        if (this.bagContainer.y > this.boardBottom - 20) {
          this.events.off('update', updateHandler);
          this.enhancedTrail?.destroy();
          this.enhancedTrail = null;
          this.handleBagSlidOff();
          return;
        }

        // After settling, convert to board bag and spawn new throwable
        const settleTime = 800;
        if (this.time.now - boardLandTime > settleTime && speed < 2) {
          this.events.off('update', updateHandler);
          this.enhancedTrail?.destroy();
          this.enhancedTrail = null;

          // Convert current bag to a board bag
          this.convertToBoardBag(velocityX, velocityY);
          return;
        }
      }

      // Fell off screen entirely
      if (this.bagContainer.y > GAME_HEIGHT + 50) {
        this.events.off('update', updateHandler);
        this.enhancedTrail?.destroy();
        this.enhancedTrail = null;
        this.handleMissedCompletely();
        return;
      }
    };

    this.events.on('update', updateHandler);
  }

  private convertToBoardBag(vx: number, vy: number): void {
    // Create a new board bag at current position
    const boardBag = this.createBoardBag(
      this.bagContainer.x,
      this.bagContainer.y,
      vx,
      vy,
      this.bagContainer.rotation
    );
    this.boardBags.push(boardBag);

    // Show "ON BOARD" feedback
    createFloatingText(this, this.bagContainer.x, this.bagContainer.y - 40, 'ON BOARD', {
      fontSize: '20px',
      color: '#fbbf24',
      duration: 800,
      distance: 30,
    });

    // Check if max bags reached
    if (this.bagsThisRound >= this.MAX_BAGS_PER_ROUND) {
      this.handleRoundReset();
    } else {
      // Spawn new bag to throw
      this.spawnNewBag();
    }
  }

  private handleBagSlidOff(): void {
    // Bag slid off the board - just gone
    this.bagContainer.setVisible(false);
    this.bagShadow.setVisible(false);

    createDustPoof(this, this.bagContainer.x, this.boardBottom, {
      color: 0xccbbaa, count: 8, size: 50,
    });

    if (this.bagsThisRound >= this.MAX_BAGS_PER_ROUND) {
      this.handleRoundReset();
    } else {
      this.spawnNewBag();
    }
  }

  private handleMissedCompletely(): void {
    // Bag missed the board entirely
    this.missCount++;
    this.consecutiveHits = 0;
    this.ui.missText.setText(`Misses: ${this.missCount}`);
    GameStateService.recordMiss('cornhole');

    AudioSystem.playFail();
    colorFlash(this, YAK_COLORS.danger, 'solid', { intensity: 0.5, duration: 200 });
    shakeCamera(this, 'medium');

    createDustPoof(this, this.bagContainer.x, Math.min(this.bagContainer.y, GAME_HEIGHT - 50), {
      color: 0xccbbaa, count: 12, size: 60,
    });

    const state = GameStateService.getState();
    const charId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(charId, 'miss');
    this.showCharacterQuote(quote, 0xef4444);

    showFailEffect(this, this.bagContainer.x, this.bagContainer.y, getRandomFail());

    // Miss escalation visuals
    if (this.missCount >= 5) {
      this.tweens.add({
        targets: this.ui.missText,
        x: this.ui.missText.x + 3,
        duration: 50,
        yoyo: true,
        repeat: 5,
      });
    }
    if (this.missCount >= 3) {
      vignettePulse(this, 0.3, 0xff0000, 300);
    }

    if (this.bagsThisRound >= this.MAX_BAGS_PER_ROUND) {
      this.time.delayedCall(400, () => this.handleRoundReset());
    } else {
      this.time.delayedCall(400, () => this.spawnNewBag());
    }
  }

  private handleRoundReset(): void {
    // Clear all bags on board with animation
    createFloatingText(this, GAME_WIDTH / 2, GAME_HEIGHT / 2, 'CLEARING BOARD...', {
      fontSize: '28px',
      color: '#ef4444',
      duration: 1200,
      distance: 50,
    });

    shakeCamera(this, 'medium');
    colorFlash(this, 0xff6b6b, 'edges', { intensity: 0.4, duration: 300 });

    // Animate all board bags falling off
    this.boardBags.forEach((bag, i) => {
      this.tweens.add({
        targets: bag.container,
        y: GAME_HEIGHT + 100,
        rotation: bag.rotation + Math.PI * 2,
        alpha: 0,
        duration: 600,
        delay: i * 100,
        ease: 'Back.easeIn',
        onComplete: () => {
          bag.container.destroy();
          bag.shadow.destroy();
        }
      });
      this.tweens.add({
        targets: bag.shadow,
        alpha: 0,
        duration: 400,
        delay: i * 100,
      });
    });

    this.boardBags = [];
    this.bagsThisRound = 0;
    this.updateBagCountDisplay();

    // Spawn new bag after clear animation
    this.time.delayedCall(800, () => this.spawnNewBag());
  }

  private spawnNewBag(): void {
    this.hasLaunched = false;

    // Position below screen
    this.bagContainer.setPosition(this.spawnX, GAME_HEIGHT + 60);
    this.bagContainer.setRotation(0);
    this.bagContainer.setScale(0);
    this.bagContainer.setAlpha(1);
    this.bagContainer.setVisible(true);

    // Pop in
    this.tweens.add({
      targets: this.bagContainer,
      y: this.spawnY,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.startBreathingAnimation();
      },
    });

    this.bagShadow.setPosition(this.spawnX, GAME_HEIGHT - 95);
    this.bagShadow.setScale(0, 0);
    this.bagShadow.setAlpha(0);
    this.bagShadow.setVisible(true);

    this.tweens.add({
      targets: this.bagShadow,
      scaleX: 1,
      scaleY: 0.35,
      alpha: 0.35,
      duration: 400,
      ease: 'Back.easeOut',
    });

    this.instructionText.setVisible(true);
    this.instructionText.setText('DRAG TO AIM & THROW');
    this.updateBagCountDisplay();
  }

  private determineShotQuality(distToHole: number, speed: number): 'normal' | 'perfect' | 'legendary' {
    const isPerfectCenter = distToHole < 10;
    const isCleanSpeed = speed > 3 && speed < 15;
    const isFirstTry = this.missCount === 0 && this.bagsThisRound === 1;

    if (isPerfectCenter && isFirstTry) {
      return 'legendary';
    } else if (isPerfectCenter && isCleanSpeed) {
      return 'perfect';
    }
    return 'normal';
  }

  private handleSuccess(distToHole: number, speed: number): void {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    this.consecutiveHits++;
    const quality = this.determineShotQuality(distToHole, speed);
    this.lastShotQuality = quality;

    AudioSystem.playSuccess();
    this.time.delayedCall(100, () => AudioSystem.playCrowdCheer());

    if (quality === 'legendary') {
      this.handleLegendarySuccess();
    } else if (quality === 'perfect') {
      this.handlePerfectSuccess();
    } else {
      this.handleNormalSuccess();
    }

    // Suck bag into hole
    this.tweens.add({
      targets: this.bagContainer,
      x: this.holeX,
      y: this.holeY,
      scale: 0.1,
      alpha: 0,
      duration: 300,
      ease: 'Back.in'
    });

    this.tweens.add({
      targets: this.bagShadow,
      alpha: 0,
      duration: 250
    });

    // Also clear any remaining board bags with celebration
    this.boardBags.forEach((bag, i) => {
      this.tweens.add({
        targets: bag.container,
        x: this.holeX,
        y: this.holeY,
        scale: 0,
        alpha: 0,
        duration: 400,
        delay: i * 50,
        ease: 'Back.easeIn',
        onComplete: () => {
          bag.container.destroy();
          bag.shadow.destroy();
        }
      });
    });
    this.boardBags = [];

    const state = GameStateService.getState();
    const charId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(charId, 'success');
    this.showCharacterQuote(quote, 0x4ade80);

    if (this.consecutiveHits >= 3) {
      this.showStreakBonus(this.consecutiveHits);
    }

    const transitionDelay = quality === 'legendary' ? 1500 : quality === 'perfect' ? 1000 : 700;

    this.time.delayedCall(transitionDelay, () => {
      showSuccessEffect(this, this.holeX, this.holeY, getRandomSuccess(), () => {
        AudioSystem.playWhoosh();
        this.scene.start('GoalieScene');
      }, quality);
    });
  }

  private handleNormalSuccess(): void {
    flashScreen(this, 'green', 150);
    shakeCamera(this, 'light');
    createConfetti(this, this.holeX, this.holeY, { count: 40 });

    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 100, () => {
        createRipple(this, this.holeX, this.holeY, {
          color: YAK_COLORS.successBright,
          endRadius: 80 + i * 20,
          duration: 400,
        });
      });
    }
  }

  private handlePerfectSuccess(): void {
    slowMotion(this, 0.4, 600);
    createStarBurst(this, this.holeX, this.holeY, {
      points: 12,
      colors: [YAK_COLORS.success, YAK_COLORS.secondary, 0xffffff],
      outerRadius: 150,
    });
    createMegaConfetti(this, this.holeX, this.holeY, {
      count: 60,
      includeStars: true,
      colors: [YAK_COLORS.success, YAK_COLORS.secondary, 0xffffff, 0x4ade80],
    });

    for (let i = 0; i < 4; i++) {
      this.time.delayedCall(i * 80, () => {
        createRipple(this, this.holeX, this.holeY, {
          color: YAK_COLORS.successBright,
          endRadius: 100 + i * 25,
          duration: 500,
        });
      });
    }

    colorFlash(this, YAK_COLORS.success, 'radial', { intensity: 0.5, duration: 300 });
  }

  private handleLegendarySuccess(): void {
    freezeFrame(this, 400, true);
    this.time.delayedCall(50, () => chromaticAberration(this, 8, 400));

    createVictoryRays(this, this.holeX, this.holeY, {
      count: 16,
      color: 0xffd700,
      length: 350,
      duration: 1500,
    });

    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 200, () => {
        const offsetX = (Math.random() - 0.5) * 150;
        const offsetY = (Math.random() - 0.5) * 100;
        createFirework(this, this.holeX + offsetX, this.holeY + offsetY, {
          layers: 3,
          colors: [0xffd700, 0xffaa00, 0xffffff, YAK_COLORS.primary],
          size: 120,
        });
      });
    }

    colorFlash(this, 0xffd700, 'radial', { intensity: 0.8, duration: 400 });

    createMegaConfetti(this, this.holeX, this.holeY, {
      count: 100,
      includeStars: true,
      includeRibbons: true,
      colors: [0xffd700, 0xffaa00, YAK_COLORS.success, YAK_COLORS.secondary, 0xffffff],
    });

    createRingBurst(this, this.holeX, this.holeY, {
      count: 6,
      colors: [0xffd700, YAK_COLORS.success, 0xffffff],
      maxRadius: 200,
    });

    const legendaryText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, 'LEGENDARY!', {
      fontSize: '48px',
      fontFamily: YAK_FONTS.title,
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setDepth(300).setAlpha(0).setScale(0);

    this.tweens.add({
      targets: legendaryText,
      scale: 1.2,
      alpha: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        rainbowShimmer(this, legendaryText, 1000);
        this.tweens.add({
          targets: legendaryText,
          y: legendaryText.y - 30,
          alpha: 0,
          delay: 1000,
          duration: 500,
          onComplete: () => legendaryText.destroy(),
        });
      },
    });
  }

  private showCharacterQuote(text: string, color: number): void {
    const quoteY = GAME_HEIGHT * 0.25;
    const bubble = this.add.graphics();
    bubble.fillStyle(0x1a1a1a, 0.9);
    bubble.fillRoundedRect(GAME_WIDTH / 2 - 120, quoteY - 25, 240, 50, 10);
    bubble.lineStyle(2, color, 1);
    bubble.strokeRoundedRect(GAME_WIDTH / 2 - 120, quoteY - 25, 240, 50, 10);
    bubble.setDepth(200);

    const quoteText = this.add.text(GAME_WIDTH / 2, quoteY, text, {
      fontSize: '20px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 220 }
    }).setOrigin(0.5).setDepth(201);

    [bubble, quoteText].forEach((o, i) => {
      o.setScale(0);
      o.setAlpha(0);
      popIn(this, o as any, { duration: 250, delay: i * 30 });
    });

    this.time.delayedCall(200, () => {
      wobble(this, quoteText as any, 0.5, 300);
    });

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: [bubble, quoteText],
        alpha: 0,
        y: quoteY - 30,
        duration: 300,
        onComplete: () => { bubble.destroy(); quoteText.destroy(); }
      });
    });
  }

  private showStreakBonus(streak: number): void {
    const streakText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, `${streak}x STREAK!`, {
      fontSize: '32px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(250).setAlpha(0).setScale(0);

    this.tweens.add({
      targets: streakText,
      scale: 1.1,
      alpha: 1,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        rainbowShimmer(this, streakText, 800);
        this.tweens.add({
          targets: streakText,
          y: streakText.y - 40,
          alpha: 0,
          delay: 800,
          duration: 400,
          onComplete: () => streakText.destroy(),
        });
      },
    });
  }

  update(): void {
    updateTimer(this.ui.timerText, this);
  }

  shutdown(): void {
    cleanupTimerPressureVisuals(this);

    if (this.boardBagUpdateHandler) {
      this.events.off('update', this.boardBagUpdateHandler);
      this.boardBagUpdateHandler = null;
    }

    this.events.removeAllListeners('update');
    this.input.removeAllListeners();
    this.tweens.killAll();
    this.time.removeAllEvents();

    this.enhancedTrail?.destroy();
    this.enhancedTrail = null;

    this.ambientLights.forEach(light => light.destroy());
    this.ambientLights = [];

    if (this.dustParticleTimer) {
      this.dustParticleTimer.remove();
      this.dustParticleTimer = null;
    }

    if (this.holePulseGlow) {
      this.holePulseGlow.destroy();
      this.holePulseGlow = null;
    }

    if (this.breatheTween) {
      this.breatheTween.stop();
      this.breatheTween = null;
    }

    // Clean up board bags
    this.boardBags.forEach(bag => {
      bag.container.destroy();
      bag.shadow.destroy();
    });
    this.boardBags = [];
  }
}
