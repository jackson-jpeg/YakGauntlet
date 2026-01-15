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

  constructor() {
    super({ key: 'RunScene' });
  }

  create(): void {
    GameStateService.initNewRun();

    // Initialize audio
    AudioSystem.init();

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
    // 1. Hardwood Court Floor
    const bg = this.add.graphics();
    bg.fillGradientStyle(0xd2a679, 0xd2a679, 0x8b5a2b, 0x8b5a2b, 1); // Wood gradient
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Wood Planks Pattern
    const plankGraphics = this.add.graphics();
    plankGraphics.lineStyle(1, 0x8b5a2b, 0.3);
    const plankWidth = 40;
    
    // Vertical planks
    for (let x = 0; x < GAME_WIDTH; x += plankWidth) {
      plankGraphics.moveTo(x, 0);
      plankGraphics.lineTo(x, GAME_HEIGHT);
    }
    // Random horizontal cuts for plank ends
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

    // 3. Court Lines (White)
    const courtLines = this.add.graphics();
    courtLines.lineStyle(4, 0xffffff, 0.9);

    // Center Court Line (at bottom)
    courtLines.beginPath();
    courtLines.moveTo(0, GAME_HEIGHT - 50);
    courtLines.lineTo(GAME_WIDTH, GAME_HEIGHT - 50);
    courtLines.strokePath();

    // Three Point Arc (Top)
    courtLines.beginPath();
    courtLines.arc(GAME_WIDTH / 2, 100, 250, 0, Math.PI, false); 
    courtLines.strokePath();

    // Key / Paint Area (Top Center)
    const paint = this.add.graphics();
    paint.fillStyle(YAK_COLORS.primary, 0.2); // Yak red paint
    paint.fillRect(GAME_WIDTH / 2 - 80, 0, 160, 300);
    
    courtLines.strokeRect(GAME_WIDTH / 2 - 80, 0, 160, 300);

    // Free Throw Circle (Top of Key)
    courtLines.beginPath();
    courtLines.arc(GAME_WIDTH / 2, 300, 80, 0, Math.PI, false);
    courtLines.strokePath();

    // 4. Studio Ambience (Vignette)
    const vignette = this.add.graphics();
    vignette.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, 0.6, 0.6);
    vignette.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  }

  private createBoard(): void {
    // Positioned further back on the court
    const boardX = GAME_WIDTH / 2;
    const boardY = 320; // Higher up (further away)
    const boardWidth = 140;
    const boardHeight = 220;

    // Board shadow
    this.add.rectangle(boardX + 8, boardY + 8, boardWidth, boardHeight, 0x000000, 0.3).setDepth(2);

    // Main board body
    const board = this.add.rectangle(boardX, boardY, boardWidth, boardHeight, 0xdeb887).setDepth(3);
    board.setStrokeStyle(3, 0x8b4513);

    // Wood grain for board
    const grain = this.add.graphics().setDepth(4);
    grain.lineStyle(1, 0xd2a679, 0.6);
    for (let i = -boardHeight/2 + 20; i < boardHeight/2; i += 15) {
      grain.beginPath();
      grain.moveTo(boardX - boardWidth/2 + 5, boardY + i);
      grain.lineTo(boardX + boardWidth/2 - 5, boardY + i + (Math.random() - 0.5) * 4);
      grain.strokePath();
    }

    // The hole (Cornhole target)
    this.holeX = boardX;
    this.holeY = boardY - 40;
    this.holeRadius = 38; // Slightly smaller for challenge

    // Hole depth layers
    this.add.circle(this.holeX + 2, this.holeY + 2, this.holeRadius, 0x000000, 0.5).setDepth(5);
    this.add.circle(this.holeX, this.holeY, this.holeRadius + 4, 0x8b4513).setDepth(6);
    this.add.circle(this.holeX, this.holeY, this.holeRadius, 0x1a1a1a).setDepth(7);
    this.add.circle(this.holeX, this.holeY, this.holeRadius - 6, 0x0a0a0a).setDepth(8);

    // Board legs (visual depth)
    this.add.rectangle(boardX - 40, boardY + 120, 10, 40, 0x5c4033).setDepth(1);
    this.add.rectangle(boardX + 40, boardY + 120, 10, 40, 0x5c4033).setDepth(1);

    // Yak Stool Icons on floor near board
    const leftStool = createStoolIcon(this, boardX - 120, boardY + 80, 1.0);
    const rightStool = createStoolIcon(this, boardX + 120, boardY + 80, 1.0);
    leftStool.setDepth(2).setAlpha(0.6);
    rightStool.setDepth(2).setAlpha(0.6);
  }

  private createBeanbag(): void {
    this.spawnX = GAME_WIDTH / 2;
    this.spawnY = GAME_HEIGHT - 120; // Lower on screen

    // Shadow
    this.bagShadow = this.add.ellipse(this.spawnX, GAME_HEIGHT - 95, 45, 18, 0x000000, 0.35);
    this.bagShadow.setDepth(10);

    // Container for bag
    this.bagContainer = this.add.container(this.spawnX, this.spawnY);
    this.bagContainer.setDepth(100);

    // Bag body - Yak Red
    const bagBody = this.add.rectangle(0, 0, 48, 48, YAK_COLORS.primary);
    bagBody.setStrokeStyle(2, YAK_COLORS.primaryDark);

    // Fabric shading
    const bagShading = this.add.graphics();
    bagShading.fillStyle(0xff6b6b, 0.2);
    bagShading.fillRect(-24, -24, 24, 48);

    // Stitching
    const stitching = this.add.graphics();
    stitching.lineStyle(2, YAK_COLORS.secondary, 0.8);
    stitching.beginPath();
    stitching.moveTo(-18, 0); stitching.lineTo(18, 0);
    stitching.moveTo(0, -18); stitching.lineTo(0, 18);
    stitching.strokePath();

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

    // Aim Line
    const powerPercent = Math.min((power / 45) * 100, 100);
    let color = YAK_COLORS.success;
    if (powerPercent > 60) color = YAK_COLORS.warning;
    if (powerPercent > 90) color = YAK_COLORS.danger;

    this.aimLine.lineStyle(3, color, 0.8);
    this.aimLine.beginPath();
    this.aimLine.moveTo(this.bagContainer.x, this.bagContainer.y);
    const lineLen = Math.min(distance * 0.7, 100);
    // Show inverted direction (aim line goes toward target)
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

    const power = Math.min(distance / 7, 45);
    const vx = (dx / distance) * power * 0.35;
    // INVERTED: Drag down (positive dy) = throw up (negative vy)
    const vy = -(dy / distance) * power * 1.1;

    this.launchBag(vx, vy);
  }

  private launchBag(vx: number, vy: number): void {
    // Launch audio
    AudioSystem.playSwoosh();

    let velocityX = vx;
    let velocityY = vy;
    const gravity = 0.5; // Heavier gravity for "beanbag" feel
    const friction = 0.98; // Air resistance
    const floorFriction = 0.8; // Sliding friction

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
      this.bagContainer.rotation += velocityX * 0.05; // Spin

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

      // Smaller hitbox for hole
      if (distToHole < this.holeRadius - 15) {
        this.events.off('update', updateHandler);
        this.handleSuccess();
        return;
      }

      // 2. Board Collision (Bounce/Slide)
      const boardTop = 320 - 110;
      const boardBottom = 320 + 110;
      const boardLeft = GAME_WIDTH/2 - 70;
      const boardRight = GAME_WIDTH/2 + 70;

      // If landing on board area
      if (this.bagContainer.x > boardLeft && this.bagContainer.x < boardRight &&
          this.bagContainer.y > boardTop && this.bagContainer.y < boardBottom) {
        
        // If falling down onto it
        if (velocityY > 0) {
           velocityY = -velocityY * 0.1; // Tiny bounce, mostly slide
           velocityX *= 0.7; // Friction
        }
      }

      // 3. Ground/Miss Detection
      // If it goes past the board or stops moving
      if (this.bagContainer.y > GAME_HEIGHT + 50) {
         this.events.off('update', updateHandler);
         this.handleMiss();
         return;
      }

      // Stop check
      const speed = Math.sqrt(velocityX*velocityX + velocityY*velocityY);
      if (speed < 0.1 && this.bagContainer.y > 200) {
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
  }
}