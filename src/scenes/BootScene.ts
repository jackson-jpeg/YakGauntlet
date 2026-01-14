import Phaser from 'phaser';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebaseConfig';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS } from '../config/theme';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingUI();
    this.generateGameTextures();
    this.generatePixelCrew(); // NEW: Generates pixel heads
  }

  create(): void {
    // Initialize Firebase
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      this.registry.set('firebase', { app, db });
    } catch (error) {
      console.warn('Firebase init skipped (dev mode or config missing)');
    }

    // 1. The Environment
    this.createStudioBackground();
    this.createAttractMode(); // Falling items

    // 2. The UI Layers
    this.createLogo();
    this.createStationPreview(); // Now uses Heads, not dots
    this.createStartPrompt();
    this.createNewsTicker(); // The "Data Day" Ticker
  }

  // --- VISUAL SETUP ---

  private createStudioBackground(): void {
    // Dark Vignette Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x000000, 0x000000, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Parquet Floor Pattern (The "Studio" Look)
    const floorGraphics = this.add.graphics();
    floorGraphics.lineStyle(2, 0x333333, 0.3);
    
    const tileSize = 60;
    // Draw angled parquet lines
    for (let x = -GAME_WIDTH; x < GAME_WIDTH * 2; x += tileSize) {
      for (let y = -GAME_HEIGHT; y < GAME_HEIGHT * 2; y += tileSize) {
         // Zig zag pattern
         if ((Math.floor(x/tileSize) + Math.floor(y/tileSize)) % 2 === 0) {
             floorGraphics.lineBetween(x, y, x + tileSize, y + tileSize);
         } else {
             floorGraphics.lineBetween(x + tileSize, y, x, y + tileSize);
         }
      }
    }
    
    // Add a spotlight effect in the center
    const spotlight = this.add.circle(GAME_WIDTH/2, GAME_HEIGHT/2 - 100, 300, 0xffffff, 0.05);
    this.tweens.add({
      targets: spotlight,
      alpha: 0.08,
      scale: 1.1,
      duration: 3000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createAttractMode(): void {
    // Spawns random "flickable" objects falling in the background
    const particles = this.add.particles(0, 0, 'basketball', {
        x: { min: 0, max: GAME_WIDTH },
        y: -50,
        lifespan: 4000,
        speedY: { min: 200, max: 400 },
        speedX: { min: -50, max: 50 },
        scale: { min: 0.5, max: 0.8 },
        rotate: { min: -180, max: 180 },
        quantity: 1,
        frequency: 800, // Spawn every 800ms
        alpha: 0.3, // Subtle
        blendMode: 'ADD'
    });

    // We can also emit beanbags using a separate emitter or just mix textures if using a frame-based texture atlas
    // For now, basketballs raining down looks cool.
  }

  private createLogo(): void {
    const logoY = GAME_HEIGHT * 0.3;

    // "THE"
    this.add.text(GAME_WIDTH / 2, logoY - 90, 'THE', {
      fontFamily: YAK_FONTS.title,
      fontSize: '32px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // "YAK" (Big & Juicy)
    const yakText = this.add.text(GAME_WIDTH / 2, logoY, 'YAK', {
      fontFamily: YAK_FONTS.title,
      fontSize: '130px',
      color: '#e74c3c', // Red
      stroke: '#c0392b',
      strokeThickness: 12,
      shadow: { offsetX: 4, offsetY: 4, color: '#000', blur: 10, stroke: true, fill: true }
    }).setOrigin(0.5);

    // "GAUNTLET"
    this.add.text(GAME_WIDTH / 2, logoY + 90, 'GAUNTLET', {
      fontFamily: YAK_FONTS.title,
      fontSize: '52px',
      color: '#f1c40f', // Yellow
      stroke: '#000000',
      strokeThickness: 8,
    }).setOrigin(0.5);

    // Idle animation for the main logo
    this.tweens.add({
        targets: yakText,
        scale: 1.05,
        angle: 1,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
  }

  private createStationPreview(): void {
    const startY = GAME_HEIGHT * 0.55;
    const spacing = 70;
    const totalWidth = (STATIONS.length - 1) * spacing;
    const startX = (GAME_WIDTH / 2) - (totalWidth / 2);

    STATIONS.forEach((station, i) => {
      const x = startX + (i * spacing);
      
      // Container for the icon
      const container = this.add.container(x, startY + 50); // Start lower for pop-up anim
      container.setAlpha(0);

      // 1. Pixel Art Head (Generated in preload)
      // We map index to specific generated textures
      const textureKey = `crew_${i % 6}`; 
      const head = this.add.image(0, 0, textureKey).setScale(3); // Scale up the pixel art
      
      // 2. Border/Ring
      const ring = this.add.graphics();
      ring.lineStyle(3, station.color, 1);
      ring.strokeCircle(0, 0, 28);

      container.add([head, ring]);

      // Pop up animation
      this.tweens.add({
        targets: container,
        y: startY,
        alpha: 1,
        duration: 500,
        delay: 500 + (i * 100),
        ease: 'Back.easeOut'
      });
    });
  }

  private createStartPrompt(): void {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const text = isMobile ? 'TAP TO START' : 'CLICK TO START';
    
    const startBtn = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 180, text, {
        fontFamily: YAK_FONTS.title,
        fontSize: '36px',
        color: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
    })
    .setOrigin(0.5)
    .setInteractive({ useHandCursor: true });

    // Blink effect
    this.tweens.add({
        targets: startBtn,
        alpha: 0.5,
        duration: 800,
        yoyo: true,
        repeat: -1
    });

    startBtn.on('pointerdown', () => {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.time.delayedCall(300, () => {
            this.scene.start('RunScene');
        });
    });
  }

  private createNewsTicker(): void {
    // A black bar at the bottom
    const bar = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT - 25, GAME_WIDTH, 50, 0x000000, 0.9);
    
    // Fake stats
    const headlines = [
        "CURRENT KING: DAN - 45.2s",
        "WORST RUN: TANK - 120.0s (WET)",
        "TODAY'S GOALIE: BIG CAT",
        "DATA DAY PROJECTION: 98% CHANCE OF CHAOS",
        "DON'T SAY LIST: [REDACTED]",
        "10X TIME ALERT IN EFFECT"
    ];
    
    const fullText = headlines.join("   ///   ") + "   ///   ";
    
    const ticker = this.add.text(GAME_WIDTH, GAME_HEIGHT - 25, fullText, {
        fontFamily: 'Courier New', // Monospace for data vibe
        fontSize: '18px',
        color: '#00ff00' // Terminal green
    }).setOrigin(0, 0.5);

    // Scroll it
    const speed = 2; // px per frame
    this.events.on('update', () => {
        ticker.x -= speed;
        if (ticker.x < -ticker.width) {
            ticker.x = GAME_WIDTH;
        }
    });
  }

  // --- ASSET GENERATION ---

  private createLoadingUI(): void {
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(GAME_WIDTH / 2 - 160, GAME_HEIGHT / 2 - 25, 320, 50);
    
    this.load.on('progress', (value: number) => {
        progressBar.clear();
        progressBar.fillStyle(0xe74c3c, 1);
        progressBar.fillRect(GAME_WIDTH / 2 - 150, GAME_HEIGHT / 2 - 15, 300 * value, 30);
    });

    this.load.on('complete', () => {
        progressBar.destroy();
        progressBox.destroy();
    });
  }

  private generateGameTextures(): void {
    // Reuse your existing texture generation logic here
    // Beanbag
    const beanbag = this.make.graphics({x:0,y:0});
    beanbag.fillStyle(0xc0392b); beanbag.fillRoundedRect(0,0,40,40,8);
    beanbag.generateTexture('beanbag', 40, 40); beanbag.destroy();

    // Basketball
    const bball = this.make.graphics({x:0,y:0});
    bball.fillStyle(0xe67e22); bball.fillCircle(25,25,25);
    bball.lineStyle(2, 0x000000); bball.strokeCircle(25,25,25);
    bball.lineBetween(25,0,25,50); bball.lineBetween(0,25,50,25);
    bball.generateTexture('basketball', 50, 50); bball.destroy();

    // Soccer
    const soccer = this.make.graphics({x:0,y:0});
    soccer.fillStyle(0xffffff); soccer.fillCircle(22,22,22);
    soccer.fillStyle(0x000000); soccer.fillCircle(22,22,8); 
    soccer.fillCircle(10,10,5); soccer.fillCircle(34,34,5);
    soccer.generateTexture('soccerball', 44, 44); soccer.destroy();

    // Wiffle
    const wiffle = this.make.graphics({x:0,y:0});
    wiffle.fillStyle(0xffffff); wiffle.fillCircle(20,20,20);
    wiffle.fillStyle(0xdddddd); wiffle.fillCircle(10,20,4); wiffle.fillCircle(30,20,4); wiffle.fillCircle(20,10,4);
    wiffle.generateTexture('wiffleball', 40, 40); wiffle.destroy();
  }

  private generatePixelCrew(): void {
    // Generates 6 distinct "Heads" for the preview icons
    // Using a simple 8x8 pixel grid logic
    const colors = [
        0x3498db, // Blue (Big Cat)
        0x8e44ad, // Purple (Sas)
        0xe67e22, // Orange (Tommy)
        0x2ecc71, // Green (KB)
        0x7f8c8d, // Grey (Zah)
        0xc0392b  // Red (Rone/Brandon)
    ];

    colors.forEach((color, index) => {
        const g = this.make.graphics({x:0, y:0});
        
        // Face Base
        g.fillStyle(0xffccaa); // Skin
        g.fillRect(2, 2, 12, 12);
        
        // Hair
        g.fillStyle(0x5d4037); // Brown hair
        g.fillRect(2, 0, 12, 4);
        g.fillRect(1, 2, 2, 6); // Sideburns

        // Eyes / Sunglasses
        if (index === 0) { // Big Cat Sunglasses
             g.fillStyle(0x000000);
             g.fillRect(3, 5, 4, 3);
             g.fillRect(9, 5, 4, 3);
             g.fillRect(7, 6, 2, 1); // Bridge
        } else {
             g.fillStyle(0x000000);
             g.fillRect(4, 5, 2, 2);
             g.fillRect(10, 5, 2, 2);
        }

        // Shirt
        g.fillStyle(color);
        g.fillRect(0, 14, 16, 2);

        // Save
        g.generateTexture(`crew_${index}`, 16, 16);
        g.destroy();
    });
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