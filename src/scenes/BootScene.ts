import Phaser from 'phaser';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebaseConfig';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS } from '../config/theme';
import { AudioSystem } from '../utils/AudioSystem';
import { GameStateService } from '../services/GameStateService';
import { ErrorHandler } from '../utils/ErrorHandler';
import { announceToScreenReader } from '../utils/Accessibility';
import type { StationId } from '../types';

/**
 * THE YAK GAUNTLET - BOOT SCENE (STUDIO EDITION)
 * Results-safe / mobile-safe / not-overwhelming Yak-ified lobby.
 */
export class BootScene extends Phaser.Scene {
  // --- STATE ---
  private isTransitioning = false;
  private timeElapsed = 0;

  // --- VISUAL CONTAINERS ---
  private logoContainer!: Phaser.GameObjects.Container;
  private easyButton!: Phaser.GameObjects.Container;
  private tickerContainer!: Phaser.GameObjects.Container;

  // --- PHYSICS ---
  private balls: Phaser.Physics.Matter.Image[] = [];
  private heads: Phaser.Physics.Matter.Image[] = [];

  // --- LIGHTING (WebGL only) ---
  private lightsEnabled = false;
  private spotlight: Phaser.GameObjects.Light | null = null;
  private lightFollowSpeed = 0.12;

  // --- UI REGIONS ---
  private tickerY = GAME_HEIGHT - 25; // used for click filtering

  // --- KEYBOARD NAVIGATION ---
  private focusRing: Phaser.GameObjects.Graphics | null = null;
  private isFocused = false;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingUI();

    // Procedural textures (no external PNGs needed)
    this.generateYakTextures();
    this.generateGameTextures();
    this.generatePixelCrew();
  }

  create(): void {
    this.initFirebase();

    // Initialize audio system
    AudioSystem.init();

    // Lighting is WebGL-only; guard it so Canvas builds don't die
    this.lightsEnabled = (this.game.renderer.type === Phaser.WEBGL);
    if (this.lightsEnabled) {
      this.lights.enable().setAmbientColor(0x777777);
    }

    // Environment
    this.createStudioEnvironment();
    this.createWetWheelBackground();
    this.createScanlines();

    // Physics
    this.setupPhysics();

    // Chaos
    this.time.delayedCall(500, () => this.startBallPitRain());
    this.time.delayedCall(1100, () => this.spawnCrewHeads());

    // UI
    this.createDataDayTicker();
    this.createGlitchLogo();
    this.createEasyButton();
    this.createStationPreview();
    this.createQuickHowTo();

    // Interactions
    this.setupInteractions();
  }

  update(_time: number, delta: number): void {
    this.timeElapsed += delta;

    // Ticker scroll
    if (this.tickerContainer) {
      this.tickerContainer.x -= 2;
      if (this.tickerContainer.x < -this.tickerContainer.getBounds().width) {
        this.tickerContainer.x = GAME_WIDTH;
      }
    }

    // Spotlight follow (WebGL only)
    if (this.spotlight && this.lightsEnabled) {
      const pointer = this.input.activePointer;
      this.spotlight.x += (pointer.x - this.spotlight.x) * this.lightFollowSpeed;
      this.spotlight.y += (pointer.y - this.spotlight.y) * this.lightFollowSpeed;
    }

    // Logo glitch (rare)
    if (Math.random() > 0.985) {
      this.triggerLogoGlitch();
    }
  }

  // =================================================================
  //  ENVIRONMENT
  // =================================================================

  private createStudioEnvironment(): void {
    // Slight gradient wall (no Light2D pipeline on shapes)
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f0f12, 0x0f0f12, 0x1b1b22, 0x1b1b22, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    bg.setDepth(0);

    // Parquet-ish floor lines (actually stroked)
    const floor = this.add.graphics();
    floor.setDepth(1);

    floor.lineStyle(2, 0x000000, 0.18);

    const tileSize = 80;
    for (let x = 0; x < GAME_WIDTH + tileSize; x += tileSize) {
      for (let y = 0; y < GAME_HEIGHT + tileSize; y += tileSize) {
        const offset = (Math.floor(x / tileSize) % 2 === 0) ? 0 : tileSize / 2;
        floor.lineBetween(x, y + offset, x + tileSize, y + offset);
        floor.lineBetween(x, y + offset, x, y + tileSize + offset);
      }
    }

    // “Studio haze” vignette
    const vignette = this.add.graphics();
    vignette.fillStyle(0x000000, 0.25);
    vignette.fillRoundedRect(10, 10, GAME_WIDTH - 20, GAME_HEIGHT - 20, 24);
    vignette.setDepth(2);
    vignette.setBlendMode(Phaser.BlendModes.MULTIPLY);

    // Mouse spotlight (WebGL only)
    if (this.lightsEnabled) {
      this.spotlight = this.lights.addLight(GAME_WIDTH / 2, GAME_HEIGHT / 2, 420).setIntensity(2.0);
    }
  }

  private createWetWheelBackground(): void {
    const wheel = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.42, 'wet_wheel_hd');
    wheel.setScale(1.75);
    wheel.setAlpha(0.085);
    wheel.setDepth(3);

    // If lights enabled, let it react (texture-based GameObject is OK)
    if (this.lightsEnabled) wheel.setPipeline('Light2D');

    this.tweens.add({
      targets: wheel,
      angle: 360,
      duration: 60000,
      repeat: -1,
      ease: 'Linear',
    });

    this.tweens.add({
      targets: wheel,
      scale: 1.95,
      duration: 4200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private createScanlines(): void {
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.10);
    for (let i = 0; i < GAME_HEIGHT; i += 4) {
      overlay.fillRect(0, i, GAME_WIDTH, 1);
    }
    overlay.setDepth(999);
    overlay.setBlendMode(Phaser.BlendModes.OVERLAY);

    // Tiny “broadcast noise” flicker
    this.tweens.add({
      targets: overlay,
      alpha: { from: 0.08, to: 0.14 },
      duration: 220,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // =================================================================
  //  PHYSICS
  // =================================================================

  private setupPhysics(): void {
    // Create bounds with FLOOR at bottom to keep objects on screen
    // Parameters: x, y, width, height, thickness, left, right, top, bottom
    // We want left, right, and BOTTOM walls. NO top wall so balls can spawn from above.
    this.matter.world.setBounds(0, 0, GAME_WIDTH, GAME_HEIGHT, 64, true, true, false, true);

    // Drag / throw with pointer
    this.matter.add.mouseSpring({
      length: 1,
      stiffness: 0.55,
      damping: 0.7,
    });
  }

  private startBallPitRain(): void {
    // OPTIMIZED: Reduced ball counts for better performance (was 45 total, now 25)
    const ballTypes = [
      { key: 'basketball_hd', scale: 0.5, bounce: 0.9, mass: 5, count: 7 },
      { key: 'football_hd', scale: 0.6, bounce: 0.6, mass: 4, count: 5 },
      { key: 'soccer_hd', scale: 0.5, bounce: 0.8, mass: 4, count: 6 },
      { key: 'wiffle_hd', scale: 0.4, bounce: 0.4, mass: 0.5, count: 7 },
    ];

    let delay = 0;

    ballTypes.forEach(type => {
      for (let i = 0; i < type.count; i++) {
        this.time.delayedCall(delay, () => {
          const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
          const y = -80 - (Math.random() * 200); // Reduced spawn height so they stay visible

          const ball = this.matter.add.image(x, y, type.key);
          ball.setScale(type.scale);
          ball.setCircle(ball.displayWidth / 2);
          ball.setBounce(type.bounce);
          ball.setMass(type.mass);
          ball.setFriction(0.04);
          ball.setFriction(0.8, 0, 0); // Add more air resistance
          ball.setDepth(10);
          ball.setAngularVelocity(Phaser.Math.Between(-20, 20) / 100);

          if (this.lightsEnabled) ball.setPipeline('Light2D');

          this.balls.push(ball);
        });

        delay += 95;
      }
    });
  }

  private spawnCrewHeads(): void {
    // OPTIMIZED: Reduced to 5 heads instead of 7 for better performance
    // 7 procedural crew textures generated but only spawn 5
    for (let i = 0; i < 5; i++) {
      const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
      const y = -150 - (i * 120); // Reduced spawn height so they stay on screen

      const head = this.matter.add.image(x, y, `crew_head_${i}`);
      head.setDisplaySize(96, 96);
      head.setCircle(45);
      head.setBounce(0.45);
      head.setMass(10);
      head.setFriction(0.55);
      head.setFriction(0.8, 0, 0); // Add air resistance
      head.setDepth(15);

      if (this.lightsEnabled) head.setPipeline('Light2D');

      this.heads.push(head);
    }
  }

  // =================================================================
  //  UI
  // =================================================================

  private createGlitchLogo(): void {
    const y = GAME_HEIGHT * 0.22;

    this.logoContainer = this.add.container(GAME_WIDTH / 2, y);
    this.logoContainer.setDepth(200);

    const yak = this.add.text(0, 0, 'THE YAK', {
      fontFamily: YAK_FONTS.title,
      fontSize: '84px',
      color: Phaser.Display.Color.IntegerToColor(YAK_COLORS.primaryBright).rgba,
      stroke: '#000',
      strokeThickness: 12,
    }).setOrigin(0.5);

    const gauntlet = this.add.text(0, 70, 'GAUNTLET', {
      fontFamily: YAK_FONTS.title,
      fontSize: '42px',
      color: YAK_COLORS.textGold,
      stroke: '#000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    const taglinePool = [
      'CLICKY CLICKY. RUN IT.',
      'DATA SAYS: GO AGAIN.',
      'WET WHEEL IS WATCHING.',
      '10X EVERYTHING.',
      'NO FREE POINTS.',
    ];

    const tagline = this.add.text(0, 118, taglinePool[Phaser.Math.Between(0, taglinePool.length - 1)], {
      fontFamily: YAK_FONTS.mono,
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 12, y: 8 },
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.logoContainer.add([yak, gauntlet, tagline]);

    // Soft pulse (not overwhelming)
    this.tweens.add({
      targets: this.logoContainer,
      y: y - 8,
      duration: 2200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private triggerLogoGlitch(): void {
    if (!this.logoContainer) return;

    const offsetX = Phaser.Math.Between(-10, 10);
    const offsetY = Phaser.Math.Between(-6, 6);

    this.logoContainer.x = (GAME_WIDTH / 2) + offsetX;
    this.logoContainer.y = (GAME_HEIGHT * 0.22) + offsetY;

    this.time.delayedCall(60, () => {
      if (!this.logoContainer) return;
      this.logoContainer.x = GAME_WIDTH / 2;
      this.logoContainer.y = GAME_HEIGHT * 0.22;
    });
  }

  private createEasyButton(): void {
    const y = GAME_HEIGHT * 0.74;

    this.easyButton = this.add.container(GAME_WIDTH / 2, y);
    this.easyButton.setDepth(250);

    const btn = this.add.image(0, 0, 'easy_button_hd');

    if (this.lightsEnabled) btn.setPipeline('Light2D');

    const text = this.add.text(0, 6, 'easy', {
      fontFamily: YAK_FONTS.title,
      fontStyle: 'bold',
      fontSize: '34px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const subText = this.add.text(0, 88, 'PRESS TO START', {
      fontFamily: YAK_FONTS.mono,
      fontSize: '18px',
      color: YAK_COLORS.textGold,
      backgroundColor: '#000000',
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5);

    const hit = this.add.rectangle(0, 0, 170, 170, 0x000000, 0.01);
    hit.setInteractive({ useHandCursor: true });

    this.easyButton.add([btn, text, subText, hit]);
    this.easyButton.bringToTop(hit);

    // Float animation
    this.tweens.add({
      targets: this.easyButton,
      y: y - 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Click
    hit.on('pointerdown', () => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;

      // Play success sound sequence
      AudioSystem.playSuccess();
      this.time.delayedCall(100, () => AudioSystem.playWhoosh());

      this.tweens.add({
        targets: [btn, text],
        scaleY: 0.82,
        y: 14,
        duration: 60,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => this.startGame(),
      });
    });

    // Spacebar start (nice on desktop)
    this.input.keyboard?.on('keydown-SPACE', () => {
      if (this.isTransitioning) return;
      this.isTransitioning = true;
      AudioSystem.playSuccess();
      this.time.delayedCall(100, () => AudioSystem.playWhoosh());
      this.startGame();
    });

    // Tab key focuses the button
    this.input.keyboard?.on('keydown-TAB', (event: KeyboardEvent) => {
      event.preventDefault();
      this.focusEasyButton();
    });

    // Enter key activates focused button
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (!this.isFocused || this.isTransitioning) return;
      this.isTransitioning = true;
      AudioSystem.playSuccess();
      this.time.delayedCall(100, () => AudioSystem.playWhoosh());
      this.startGame();
    });
  }

  private focusEasyButton(): void {
    if (this.isFocused) return;
    this.isFocused = true;

    // Create focus ring around the easy button
    if (!this.focusRing) {
      this.focusRing = this.add.graphics();
      this.focusRing.setDepth(251);
    }

    // Draw animated focus ring
    this.focusRing.clear();
    this.focusRing.lineStyle(4, YAK_COLORS.secondary, 1);
    this.focusRing.strokeCircle(this.easyButton.x, this.easyButton.y, 95);

    // Pulse animation for visibility
    this.tweens.add({
      targets: this.focusRing,
      alpha: { from: 1, to: 0.5 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Announce for screen readers
    announceToScreenReader('Easy button focused. Press Enter or Space to start the game.');
  }

  private createQuickHowTo(): void {
    // Position BELOW the easy button so it doesn't cover the logo
    const yPos = GAME_HEIGHT * 0.88; // Put it near bottom, above ticker

    const box = this.add.graphics();
    box.fillStyle(0x000000, 0.65);
    box.fillRoundedRect(20, yPos - 35, GAME_WIDTH - 40, 70, 12);
    box.lineStyle(3, YAK_COLORS.secondary, 0.7);
    box.strokeRoundedRect(20, yPos - 35, GAME_WIDTH - 40, 70, 12);
    box.setDepth(280);

    const t1 = this.add.text(GAME_WIDTH / 2, yPos - 12, 'DRAG + FLING THE BALLS', {
      fontFamily: YAK_FONTS.title,
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5).setDepth(281);

    const t2 = this.add.text(GAME_WIDTH / 2, yPos + 12, 'Try not to get sent to the wet wheel.', {
      fontFamily: YAK_FONTS.body,
      fontSize: '14px',
      color: '#fbbf24',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(281);

    // Gentle fade so it doesn't clutter forever
    this.tweens.add({
      targets: [box, t1, t2],
      alpha: 0,
      delay: 6000,
      duration: 1000,
      ease: 'Sine.easeInOut',
    });
  }

  private createDataDayTicker(): void {
    const h = 50;
    const y = GAME_HEIGHT - h / 2;
    this.tickerY = y;

    this.add.rectangle(GAME_WIDTH / 2, y, GAME_WIDTH, h, 0x000000).setDepth(50);
    this.add.rectangle(GAME_WIDTH / 2, y - h / 2, GAME_WIDTH, 4, YAK_COLORS.primary).setDepth(51);

    const headlines = [
      'BREAKING: TJ HITS THE BUTTON',
      "BRANDON WALKER: 'I AM NOT A MORON'",
      'KB: GEOGRAPHY WIZARD OR ALIEN?',
      'CLICKY CLICKY CLICKY',
      'CASE RACE PROTOCOL: INITIATED',
      'TANK THURSDAY: BEWARE THE VINEGAR',
      'STEVEN CHEAH: 99.9% CHANCE OF DATA',
      'MINTZY: EYES CLOSED, HEARTS OPEN',
      'RONE: BATTLE RAP CHAMPION',
      'BIG CAT: COFFEE CONSUMPTION CRITICAL',
      'SAS: KING OF NEW YORK',
      '10X EVERYTHING',
      "DON'T SAY LIST: [REDACTED]",
      'WET WHEEL: SPINNING...',
    ];

    const text = headlines.join('   ///   ') + '   ///   ' + headlines.join('   ///   ');

    this.tickerContainer = this.add.container(GAME_WIDTH, y).setDepth(55);

    const t = this.add.text(0, 0, text, {
      fontFamily: YAK_FONTS.mono,
      fontSize: '22px',
      color: '#00ff55',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);

    this.tickerContainer.add(t);
  }

  private createStationPreview(): void {
    // Match your actual run stations (6)
    const stationOrder: StationId[] = [
      'cornhole',
      'goalie',
      'wiffle',
      'football',
      'corner3_right',
      'corner3_left',
    ];

    type StationDef = (typeof STATIONS)[number];

    const previewStations: StationDef[] = stationOrder
      .map((id) => STATIONS.find((s): s is StationDef => s.id === id))
      .filter((s): s is StationDef => Boolean(s));

    const startX = GAME_WIDTH / 2 - 150;
    const y = GAME_HEIGHT * 0.55;

    previewStations.forEach((s, i) => {
      const x = startX + (i * 60);
      this.add.circle(x, y, 9, s.color)
        .setStrokeStyle(2, 0x000000, 0.8)
        .setDepth(140);
    });

    this.add.text(GAME_WIDTH / 2, y + 22, '6 STATIONS. NO EXCUSES.', {
      fontFamily: YAK_FONTS.title,
      fontSize: '14px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(140);
  }

  // =================================================================
  //  INTERACTIONS
  // =================================================================

  private setupInteractions(): void {
    // Graffiti: only on “empty” space (not on logo/button/ticker)
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.isTransitioning) return;
      if (this.isPointerOnUi(pointer.x, pointer.y)) return;

      // keep it in the “studio zone”
      if (pointer.y > 110 && pointer.y < GAME_HEIGHT - 90) {
        this.spawnGraffiti(pointer.x, pointer.y);
      }
    });
  }

  private isPointerOnUi(x: number, y: number): boolean {
    // Ticker region
    if (y > GAME_HEIGHT - 60) return true;

    // Easy button bounds
    if (this.easyButton) {
      const b = this.easyButton.getBounds();
      if (b.contains(x, y)) return true;
    }

    // Logo bounds
    if (this.logoContainer) {
      const b = this.logoContainer.getBounds();
      if (b.contains(x, y)) return true;
    }

    return false;
  }

  private spawnGraffiti(x: number, y: number): void {
    const words = ['10X', 'WET', 'CHEAH', 'TANK', 'VIBES', 'SCOOF', 'DATA'];
    const word = words[Math.floor(Math.random() * words.length)];

    const color = Math.random() > 0.5 ? YAK_COLORS.primaryBright : 0xffffff;

    const text = this.add.text(x, y, word, {
      fontFamily: YAK_FONTS.title,
      fontSize: '46px',
      color: Phaser.Display.Color.IntegerToColor(color).rgba,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    text.setRotation((Math.random() - 0.5) * 0.5);
    text.setDepth(6);

    this.tweens.add({
      targets: text,
      scale: { from: 0, to: 1 },
      alpha: { from: 1, to: 0 },
      y: y - 50,
      duration: 1400,
      ease: 'Back.out',
      onComplete: () => text.destroy(),
    });
  }

  private startGame(): void {
    this.cameras.main.flash(600, 255, 255, 255);

    // Initialize fresh game state
    GameStateService.initNewRun();

    // Cleanup before transition
    this.cleanup();

    this.time.delayedCall(550, () => {
      this.scene.start('RunScene', { isRestart: true });
    });
  }

  private cleanup(): void {
    // Remove input listeners
    this.input.removeAllListeners('pointerdown');
    this.input.keyboard?.removeAllListeners('keydown-SPACE');
    this.input.keyboard?.removeAllListeners('keydown-TAB');
    this.input.keyboard?.removeAllListeners('keydown-ENTER');

    // Destroy focus ring
    if (this.focusRing) {
      this.focusRing.destroy();
      this.focusRing = null;
    }
    this.isFocused = false;

    // Destroy all physics bodies to prevent memory leaks
    this.balls.forEach(ball => {
      if (ball && ball.active) {
        ball.destroy();
      }
    });
    this.balls = [];

    this.heads.forEach(head => {
      if (head && head.active) {
        head.destroy();
      }
    });
    this.heads = [];

    // Remove all tweens
    this.tweens.killAll();

    // Remove all timers
    this.time.removeAllEvents();
  }

  shutdown(): void {
    this.cleanup();
    super.shutdown();
  }

  // =================================================================
  //  FIREBASE
  // =================================================================

  private initFirebase(): void {
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      this.registry.set('firebase', { app, db });
    } catch (e) {
      // Log error but allow game to continue in offline mode
      ErrorHandler.logError({
        component: 'BootScene',
        action: 'initFirebase',
        error: e instanceof Error ? e : new Error(String(e)),
        metadata: { offlineMode: true },
      });
      // Game continues without Firebase (offline mode)
    }
  }

  private createLoadingUI(): void {
    const bg = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 60, 260, 10, 0x000000, 0.5);
    const bar = this.add.rectangle(GAME_WIDTH / 2 - 130, GAME_HEIGHT / 2 + 60, 0, 6, YAK_COLORS.secondary);
    bar.setOrigin(0, 0.5);

    this.load.on('progress', (p: number) => {
      bar.width = 260 * p;
    });

    this.load.on('complete', () => {
      bg.destroy();
      bar.destroy();
    });
  }

  // =================================================================
  //  TEXTURE FACTORY
  // =================================================================

  private generateGameTextures(): void {
    this.generateBasketball();
    this.generateFootball();
    this.generateSoccerball();
    this.generateWiffleball();
  }

  private generateBasketball(): void {
    const size = 128;
    const g = this.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0xd35400);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.fillStyle(0xe67e22);
    g.fillCircle(size / 2, size / 2, size / 2 - 2);

    g.lineStyle(4, 0x1a1a1a);
    g.beginPath();
    g.moveTo(size / 2, 0); g.lineTo(size / 2, size);
    g.moveTo(0, size / 2); g.lineTo(size, size / 2);
    g.strokePath();

    g.beginPath();
    g.arc(size * 1.5, size / 2, size * 1.1, Phaser.Math.DegToRad(160), Phaser.Math.DegToRad(200), false);
    g.strokePath();

    g.beginPath();
    g.arc(-size * 0.5, size / 2, size * 1.1, Phaser.Math.DegToRad(-20), Phaser.Math.DegToRad(20), false);
    g.strokePath();

    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(size * 0.3, size * 0.3, 10);

    g.generateTexture('basketball_hd', size, size);
    g.destroy();
  }

  private generateFootball(): void {
    const w = 120, h = 80;
    const g = this.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0x5d4037);
    g.fillEllipse(w / 2, h / 2, w, h);

    g.lineStyle(3, 0xffffff);
    g.beginPath();
    g.arc(w * 0.25, h / 2, h * 0.4, -Math.PI / 3, Math.PI / 3);
    g.strokePath();
    g.beginPath();
    g.arc(w * 0.75, h / 2, h * 0.4, Math.PI * 0.66, Math.PI * 1.33);
    g.strokePath();

    g.fillStyle(0xffffff);
    const laceW = 40, laceH = 15;
    g.fillRect(w / 2 - laceW / 2, h / 2 - laceH / 2, laceW, laceH);

    g.lineStyle(2, 0xcccccc);
    for (let i = 0; i <= 5; i++) {
      const lx = (w / 2 - laceW / 2) + (i * (laceW / 5));
      g.lineBetween(lx, h / 2 - laceH / 2, lx, h / 2 + laceH / 2);
    }

    g.generateTexture('football_hd', w, h);
    g.destroy();
  }

  private generateSoccerball(): void {
    const size = 128;
    const g = this.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0xffffff);
    g.fillCircle(size / 2, size / 2, size / 2);
    g.lineStyle(2, 0xdddddd);
    g.strokeCircle(size / 2, size / 2, size / 2);

    g.fillStyle(0x2c3e50);
    const spots = [
      { x: 0.5, y: 0.5 }, { x: 0.2, y: 0.3 }, { x: 0.8, y: 0.3 },
      { x: 0.2, y: 0.7 }, { x: 0.8, y: 0.7 },
    ];

    spots.forEach(s => g.fillCircle(size * s.x, size * s.y, size * 0.12));

    g.generateTexture('soccer_hd', size, size);
    g.destroy();
  }

  private generateWiffleball(): void {
    const size = 96;
    const g = this.make.graphics({ x: 0, y: 0 });

    g.fillStyle(0xecf0f1);
    g.fillCircle(size / 2, size / 2, size / 2);

    g.fillStyle(0xbdc3c7);
    g.fillCircle(size / 2, size / 2, size / 2 - 4);

    g.fillStyle(0x95a5a6);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const hx = size / 2 + Math.cos(angle) * (size * 0.3);
      const hy = size / 2 + Math.sin(angle) * (size * 0.3);
      g.fillEllipse(hx, hy, 8, 14);
    }

    g.generateTexture('wiffle_hd', size, size);
    g.destroy();
  }

  private generateYakTextures(): void {
    // Wet Wheel HD
    const size = 512;
    const g = this.make.graphics({ x: 0, y: 0 });
    const colors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0xe67e22];

    for (let i = 0; i < 6; i++) {
      g.fillStyle(colors[i]);
      g.slice(size / 2, size / 2, size / 2, i * (Math.PI / 3), (i + 1) * (Math.PI / 3));
      g.fillPath();
    }

    g.lineStyle(10, 0xffffff);
    g.strokeCircle(size / 2, size / 2, size / 2 - 5);

    g.fillStyle(0x333333);
    g.fillCircle(size / 2, size / 2, 40);
    g.fillStyle(0xffffff);
    g.fillCircle(size / 2, size / 2, 10);

    g.generateTexture('wet_wheel_hd', size, size);
    g.destroy();

    // Easy Button HD
    const btnW = 160, btnH = 160;
    const b = this.make.graphics({ x: 0, y: 0 });

    b.fillStyle(0xbdc3c7);
    b.fillCircle(btnW / 2, btnH / 2, 75);
    b.lineStyle(4, 0x7f8c8d);
    b.strokeCircle(btnW / 2, btnH / 2, 75);

    b.fillStyle(0xe74c3c);
    b.fillCircle(btnW / 2, btnH / 2, 60);

    b.fillStyle(0xffffff, 0.4);
    b.fillEllipse(btnW / 2, btnH * 0.35, 40, 20);

    b.generateTexture('easy_button_hd', btnW, btnH);
    b.destroy();
  }

  private generatePixelCrew(): void {
    const crew = [
      { color: 0x3498db, name: 'BigCat', glasses: true, hair: 'brown' },
      { color: 0xc0392b, name: 'Brandon', glasses: false, hair: 'brown', bald: false },
      { color: 0x2ecc71, name: 'KB', glasses: false, hair: 'black', hat: true },
      { color: 0xf1c40f, name: 'Nick', glasses: false, hair: 'blonde' },
      { color: 0x9b59b6, name: 'Sas', glasses: false, hair: 'dark' },
      { color: 0x7f8c8d, name: 'Zah', glasses: false, hair: 'black', beard: true },
      { color: 0xe67e22, name: 'Titus', glasses: false, hair: 'brown' },
    ];

    const size = 64;

    crew.forEach((member, i) => {
      const g = this.make.graphics({ x: 0, y: 0 });

      g.fillStyle(0xffdbac);
      g.fillRect(8, 8, 48, 48);

      g.fillStyle(member.hair === 'blonde' ? 0xf1c40f : 0x3e2723);
      if (!('hat' in member) || !member.hat) {
        g.fillRect(8, 0, 48, 12);
        g.fillRect(4, 8, 8, 24);
        g.fillRect(52, 8, 8, 24);
      } else {
        g.fillStyle(0x27ae60);
        g.fillRect(6, 0, 52, 16);
      }

      g.fillStyle(0x000000);

      if ('glasses' in member && member.glasses) {
        g.fillRect(14, 20, 16, 10);
        g.fillRect(34, 20, 16, 10);
        g.fillRect(28, 24, 8, 4);
      } else {
        g.fillRect(18, 24, 6, 6);
        g.fillRect(40, 24, 6, 6);
      }

      if (('beard' in member && member.beard) || member.name === 'BigCat') {
        g.fillStyle(0x3e2723);
        g.fillRect(16, 40, 32, 8);
      } else {
        g.fillStyle(0x000000);
        g.fillRect(20, 42, 24, 4);
      }

      g.fillStyle(member.color);
      g.fillRect(12, 56, 40, 8);

      g.generateTexture(`crew_head_${i}`, size, size);
      g.destroy();
    });
  }
}
