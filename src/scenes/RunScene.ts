import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, getRandomSuccess, getRandomFail, PHYSICS, createStoolIcon } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { createSceneUI, updateTimer, showSuccessEffect, showFailEffect, type SceneUI } from '../utils/UIHelper';
import { createConfetti, createRipple, shakeCamera, flashScreen } from '../utils/VisualEffects';
import { getCharacterQuote } from '../data/characterQuotes';
import { AudioSystem } from '../utils/AudioSystem';
import { SceneEnhancer } from '../utils/SceneEnhancer';
import { EnhancedVisuals } from '../utils/EnhancedVisuals';
import { ProceduralTextureFactory, DynamicLightingManager } from '../utils/ProceduralTextureFactory';
import type { CharacterId } from '../types';

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

  // High-fidelity graphics
  private textureFactory!: ProceduralTextureFactory;
  private lightingManager!: DynamicLightingManager;

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    // Initialize audio
    AudioSystem.init();

    // Initialize high-fidelity graphics systems
    this.textureFactory = new ProceduralTextureFactory(this);
    this.lightingManager = new DynamicLightingManager(this);

    this.createBackground();

    // Enable dynamic lighting after background is created
    this.lightingManager.enable();

    // Graphics layers
    this.trail = this.add.graphics().setDepth(5);
    this.aimLine = this.add.graphics().setDepth(50);
    this.trajectoryDots = this.add.graphics().setDepth(51);

    this.createBoard();
    this.createBeanbag();

    // Unified UI header (station 0 = cornhole)
    this.ui = createSceneUI(this, 0, 'Misses');

    // Custom instruction text for this scene
    this.instructionText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 80, 'PULL DOWN & RELEASE TO THROW', {
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

    // Entrance effects
    this.cameras.main.fadeIn(400, 0, 0, 0);
    AudioSystem.playBeep(1.2);
  }

  private createBackground(): void {
    // Create high-fidelity hardwood court with procedural textures
    const courtKey = this.textureFactory.createHardwoodCourt(GAME_WIDTH, GAME_HEIGHT);
    const court = this.add.image(0, 0, courtKey).setOrigin(0, 0).setDepth(0);

    // Apply dynamic lighting to court
    this.lightingManager.addToPipeline(court);
  }

  private createBoard(): void {
    // Positioned further back on the court
    const boardX = GAME_WIDTH / 2;
    const boardY = 320; // Higher up (further away)
    const boardWidth = 140;
    const boardHeight = 220;

    // Board shadow (soft, realistic)
    const shadow = this.add.ellipse(boardX + 8, boardY + 8, boardWidth, boardHeight, 0x000000, 0.4);
    shadow.setDepth(2);
    this.lightingManager.addToPipeline(shadow);

    // Create high-fidelity wooden cornhole board
    const boardKey = this.textureFactory.createCornholeBoard(boardWidth, boardHeight);
    const board = this.add.image(boardX, boardY, boardKey).setDepth(3);
    this.lightingManager.addToPipeline(board);

    // The hole coordinates (already integrated in board texture, but we need coords for physics)
    this.holeX = boardX;
    this.holeY = boardY - 40;
    this.holeRadius = 38;

    // Board legs (visual depth) - realistic wooden legs
    const legWidth = 12;
    const legHeight = 50;
    const legColor = 0x5c4033;

    const leftLeg = this.add.rectangle(boardX - 45, boardY + 120, legWidth, legHeight, legColor);
    leftLeg.setDepth(1);
    this.lightingManager.addToPipeline(leftLeg);

    const rightLeg = this.add.rectangle(boardX + 45, boardY + 120, legWidth, legHeight, legColor);
    rightLeg.setDepth(1);
    this.lightingManager.addToPipeline(rightLeg);

    // Leg shadows
    this.add.ellipse(boardX - 45, boardY + 145, legWidth + 4, 8, 0x000000, 0.3).setDepth(0);
    this.add.ellipse(boardX + 45, boardY + 145, legWidth + 4, 8, 0x000000, 0.3).setDepth(0);

    // Yak Stool Icons on floor near board
    const leftStool = createStoolIcon(this, boardX - 120, boardY + 80, 1.0);
    const rightStool = createStoolIcon(this, boardX + 120, boardY + 80, 1.0);
    leftStool.setDepth(2).setAlpha(0.6);
    rightStool.setDepth(2).setAlpha(0.6);
    this.lightingManager.addToPipeline(leftStool);
    this.lightingManager.addToPipeline(rightStool);
  }

  private createBeanbag(): void {
    this.spawnX = GAME_WIDTH / 2;
    this.spawnY = GAME_HEIGHT - 120; // Lower on screen

    // Realistic soft shadow for beanbag
    this.bagShadow = this.add.ellipse(this.spawnX, GAME_HEIGHT - 95, 50, 20, 0x000000, 0.4);
    this.bagShadow.setDepth(10);

    // Container for bag
    this.bagContainer = this.add.container(this.spawnX, this.spawnY);
    this.bagContainer.setDepth(100);

    // Create high-fidelity beanbag with fabric texture and stitching
    const bagRadius = 24;
    const bagKey = this.textureFactory.createBeanbag(bagRadius, YAK_COLORS.primary);
    const bagSprite = this.add.image(0, 0, bagKey);

    // Apply dynamic lighting to bag
    this.lightingManager.addToPipeline(bagSprite);

    this.bagContainer.add(bagSprite);
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

    // Increased challenge: Scaling power differently
    const power = Math.min(distance / 7, 45); 
    const vx = (dx / distance) * power * 0.35; // Slightly harder horizontal aim
    const vy = (dy / distance) * power * 1.1; // More vertical power needed for distance

    // Trajectory preview
    const gravity = 0.5; // Heavier feel
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
        const alpha = 0.7 - (i / 50);
        this.trajectoryDots.fillStyle(0xffffff, alpha);
        this.trajectoryDots.fillCircle(px, py, 3);
      }
    }

    // Aim Line - much more visible
    const powerPercent = Math.min((power / 60) * 100, 100);
    let color = YAK_COLORS.success;
    if (powerPercent > 60) color = YAK_COLORS.warning;
    if (powerPercent > 90) color = YAK_COLORS.danger;

    // Thicker, brighter aim line
    this.aimLine.lineStyle(6, color, 1);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.bagContainer.x, this.bagContainer.y);
    const lineLen = Math.min(distance * 1.2, 150);
    // Drag down = aim up (toward board)
    this.aimLine.lineTo(
      this.bagContainer.x + (dx / distance) * lineLen,
      this.bagContainer.y - (dy / distance) * lineLen
    );
    this.aimLine.strokePath();

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

    // Slingshot mechanics: Drag down (pull back) = throw up (toward board)
    // Increased power for better feel
    const power = Math.min(distance / 5, 60);
    const vx = (dx / distance) * power * 0.4;
    // Drag down (positive dy) = throw up (negative vy) - DOUBLED for better throw
    const vy = -(dy / distance) * power * 2.2;

    this.launchBag(vx, vy);
  }

  private launchBag(vx: number, vy: number): void {
    // Launch audio
    AudioSystem.playSwoosh();

    let velocityX = vx;
    let velocityY = vy;
    const gravity = 0.5; // Heavier gravity for "beanbag" feel
    const airFriction = 0.98; // Air resistance while flying

    // Board physics constants
    const boardFriction = 0.92; // Stronger friction when sliding on board
    const boardBounce = 0.15; // Very low bounce (beanbags don't bounce much)

    let onBoard = false;
    let stoppedOnBoard = false;

    this.trailPoints = [];
    this.trail.clear();

    const updateHandler = () => {
      if (!this.hasLaunched) {
        this.events.off('update', updateHandler);
        return;
      }

      // Apply gravity
      velocityY += gravity;

      // Board collision detection and sliding physics
      const boardTop = 320 - 110;
      const boardBottom = 320 + 110;
      const boardLeft = GAME_WIDTH/2 - 70;
      const boardRight = GAME_WIDTH/2 + 70;

      const isOverBoard = this.bagContainer.x > boardLeft &&
                          this.bagContainer.x < boardRight &&
                          this.bagContainer.y > boardTop &&
                          this.bagContainer.y < boardBottom;

      // Landing on board
      if (isOverBoard && velocityY > 0 && !onBoard) {
        // Initial impact - small bounce then start sliding
        velocityY = -velocityY * boardBounce;
        onBoard = true;
        AudioSystem.playBeep(0.8); // Thud sound
      }

      // While on board - apply board friction
      if (onBoard && isOverBoard) {
        // Strong friction slows the bag down
        velocityX *= boardFriction;
        velocityY *= boardFriction;

        // Clamp to board surface (prevent bouncing off)
        if (this.bagContainer.y < boardTop + 10) {
          this.bagContainer.y = boardTop + 10;
          velocityY = Math.max(0, velocityY);
        }
        if (this.bagContainer.y > boardBottom - 10) {
          this.bagContainer.y = boardBottom - 10;
          velocityY = Math.min(0, velocityY);
        }
      } else if (!isOverBoard && onBoard) {
        // Slid off the board
        onBoard = false;
      } else if (!onBoard) {
        // In air - use air friction
        velocityX *= airFriction;
        velocityY *= airFriction;
      }

      // Update position
      this.bagContainer.x += velocityX;
      this.bagContainer.y += velocityY;
      this.bagContainer.rotation += velocityX * 0.05; // Spin based on horizontal velocity

      // Shadow logic
      this.bagShadow.x = this.bagContainer.x;
      // Shadow gets smaller as bag goes "up/back" (y decreases)
      const depthScale = Math.max(0.2, (this.bagContainer.y - 200) / 600);
      this.bagShadow.setScale(depthScale * 1.2, depthScale * 0.5);
      this.bagShadow.setAlpha(0.3 * depthScale);

      // Trail
      this.trailPoints.push({ x: this.bagContainer.x, y: this.bagContainer.y });
      if (this.trailPoints.length > 25) this.trailPoints.shift();
      this.trail.clear();
      for (let i = 1; i < this.trailPoints.length; i++) {
        this.trail.fillStyle(YAK_COLORS.primary, (i/25)*0.4);
        this.trail.fillCircle(this.trailPoints[i].x, this.trailPoints[i].y, (i/25)*8);
      }

      // Bounds check (Walls)
      if (this.bagContainer.x < 0 || this.bagContainer.x > GAME_WIDTH) {
        velocityX = -velocityX * 0.5; // Bounce off walls
        this.bagContainer.x = Math.max(0, Math.min(GAME_WIDTH, this.bagContainer.x));
      }

      // 1. Hole Detection (Success)
      const distToHole = Phaser.Math.Distance.Between(
        this.bagContainer.x, this.bagContainer.y,
        this.holeX, this.holeY
      );

      // Can slide into hole from any direction
      if (distToHole < this.holeRadius - 12) {
        this.events.off('update', updateHandler);
        this.handleSuccess();
        return;
      }

      // 2. Check if bag has stopped moving
      const speed = Math.sqrt(velocityX*velocityX + velocityY*velocityY);

      // If on board and stopped moving
      if (onBoard && isOverBoard && speed < 0.15) {
        if (!stoppedOnBoard) {
          stoppedOnBoard = true;
          // Give it a moment to see if it's in the hole
          this.time.delayedCall(200, () => {
            // Check distance to hole one more time
            const finalDist = Phaser.Math.Distance.Between(
              this.bagContainer.x, this.bagContainer.y,
              this.holeX, this.holeY
            );
            if (finalDist < this.holeRadius - 12) {
              this.events.off('update', updateHandler);
              this.handleSuccess();
            } else {
              // Stopped on board but not in hole - it's a miss (but stayed on board)
              this.events.off('update', updateHandler);
              this.handleMiss();
            }
          });
        }
        return;
      }

      // 3. Bag went off screen
      if (this.bagContainer.y > GAME_HEIGHT + 50) {
         this.events.off('update', updateHandler);
         this.handleMiss();
         return;
      }

      // 4. Bag stopped moving but not on board
      if (!onBoard && speed < 0.1 && this.bagContainer.y > 200) {
         this.events.off('update', updateHandler);
         this.handleMiss();
         return;
      }
    };

    this.events.on('update', updateHandler);
  }

  private handleSuccess(): void {
    this.trail.clear();

    // Audio
    AudioSystem.playSuccess();
    this.time.delayedCall(100, () => AudioSystem.playCrowdCheer());

    // Visuals
    flashScreen(this, 'green', 150);
    shakeCamera(this, 'light');
    createRipple(this, this.holeX, this.holeY, { color: YAK_COLORS.successBright, endRadius: 80, duration: 400 });
    createConfetti(this, this.holeX, this.holeY, { count: 30 });

    // Suck into hole animation
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

    const state = GameStateService.getState();
    const charId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(charId, 'success');
    this.showCharacterQuote(quote, 0x4ade80); // Success Green

    showSuccessEffect(this, this.holeX, this.holeY, getRandomSuccess(), () => {
      AudioSystem.playWhoosh();
      this.scene.start('GoalieScene');
    });
  }

  private handleMiss(): void {
    this.missCount++;
    this.ui.missText.setText(`Misses: ${this.missCount}`);
    GameStateService.recordMiss('cornhole');

    // Audio
    AudioSystem.playFail();

    shakeCamera(this, 'light');

    const state = GameStateService.getState();
    const charId = (state?.goalieCharacterId || 'BIG_CAT') as CharacterId;
    const quote = getCharacterQuote(charId, 'miss');
    this.showCharacterQuote(quote, 0xef4444); // Failure Red

    showFailEffect(this, this.bagContainer.x, this.bagContainer.y, getRandomFail());

    this.time.delayedCall(600, () => this.resetBeanbag());
  }

  private resetBeanbag(): void {
    this.hasLaunched = false;
    this.trail.clear();
    this.bagContainer.setPosition(this.spawnX, this.spawnY);
    this.bagContainer.setRotation(0);
    this.bagContainer.setScale(1);
    this.bagContainer.setAlpha(1);
    this.bagShadow.setPosition(this.spawnX, GAME_HEIGHT - 95);
    this.bagShadow.setScale(1, 0.35);
    this.bagShadow.setAlpha(0.35);
    this.instructionText.setVisible(true);
    this.instructionText.setText('DRAG TO AIM & THROW');
  }

  private showCharacterQuote(text: string, color: number): void {
    const quoteY = GAME_HEIGHT * 0.25;
    const bubble = this.add.graphics();
    bubble.fillStyle(0x1a1a1a, 0.9);
    bubble.fillRoundedRect(GAME_WIDTH/2 - 120, quoteY - 25, 240, 50, 10);
    bubble.lineStyle(2, color, 1);
    bubble.strokeRoundedRect(GAME_WIDTH/2 - 120, quoteY - 25, 240, 50, 10);
    bubble.setDepth(200);

    const quoteText = this.add.text(GAME_WIDTH/2, quoteY, text, {
      fontSize: '20px',
      fontFamily: YAK_FONTS.title,
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 220 }
    }).setOrigin(0.5).setDepth(201);

    [bubble, quoteText].forEach(o => {
      o.setScale(0);
      this.tweens.add({ targets: o, scale: 1, duration: 200, ease: 'Back.out' });
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

  update(): void {
    updateTimer(this.ui.timerText);
  }

  shutdown(): void {
    this.events.removeAllListeners('update');
    this.input.removeAllListeners();
    this.tweens.killAll();
    this.time.removeAllEvents();

    // Cleanup procedural textures and lighting
    if (this.textureFactory) {
      this.textureFactory.destroy();
    }
    if (this.lightingManager) {
      this.lightingManager.destroy();
    }
  }
}