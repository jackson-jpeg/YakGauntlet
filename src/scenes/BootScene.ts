import Phaser from 'phaser';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebaseConfig';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS } from '../config/theme';

/**
 * THE YAK GAUNTLET - BOOT SCENE (ULTIMATE STUDIO EDITION)
 * =================================================================
 * A fully interactive, physics-based "Lobby" representing the Yak Studio.
 */

export class BootScene extends Phaser.Scene {
  // --- STATE ---
  private isTransitioning = false;
  private timeElapsed = 0;
  
  // --- VISUAL CONTAINERS ---
  private logoContainer!: Phaser.GameObjects.Container;
  private easyButton!: Phaser.GameObjects.Container;
  private tickerContainer!: Phaser.GameObjects.Container;
  
  // --- PHYSICS GROUPS ---
  private balls: Phaser.Physics.Matter.Image[] = [];
  private heads: Phaser.Physics.Matter.Image[] = [];
  
  // --- LIGHTING ---
  private spotlight!: Phaser.GameObjects.Light;
  private lightFollowSpeed = 0.1;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingUI();
    // CALL THE TEXTURE GENERATORS
    this.generateYakTextures(); 
    this.generateGameTextures(); 
    this.generatePixelCrew(); 
  }

  create(): void {
    this.initFirebase();

    // 1. ENABLE LIGHTING SYSTEM
    this.lights.enable().setAmbientColor(0x888888);

    // 2. BUILD THE STUDIO (Backgrounds & Floor)
    this.createStudioEnvironment();
    this.createWetWheelBackground();

    // 3. INITIALIZE PHYSICS WORLD
    this.setupPhysics();

    // 4. SPAWN THE CHAOS (The Ball Pit & Crew)
    this.time.delayedCall(500, () => this.startBallPitRain());
    this.time.delayedCall(1500, () => this.spawnCrewHeads());

    // 5. BUILD UI (Floating above physics)
    this.createDataDayTicker(); // Floor Level
    this.createGlitchLogo();    // Top Level
    this.createEasyButton();    // Mid Level
    this.createStationPreview(); // Mid Level

    // 6. INPUTS & INTERACTIONS
    this.setupInteractions();
    
    // 7. BROADCAST OVERLAYS
    this.createScanlines();
  }

  update(time: number, delta: number): void {
    this.timeElapsed += delta;

    // 1. Ticker Scroll Logic
    if (this.tickerContainer) {
      this.tickerContainer.x -= 2; 
      // Reset loop
      if (this.tickerContainer.x < -this.tickerContainer.getBounds().width) {
        this.tickerContainer.x = GAME_WIDTH;
      }
    }

    // 2. Mouse Tracking Spotlight
    const pointer = this.input.activePointer;
    if (this.spotlight) {
        // Smooth lerp to mouse position
        this.spotlight.x += (pointer.x - this.spotlight.x) * this.lightFollowSpeed;
        this.spotlight.y += (pointer.y - this.spotlight.y) * this.lightFollowSpeed;
    }

    // 3. Logo Glitch Randomizer
    if (Math.random() > 0.98) {
        this.triggerLogoGlitch();
    }
  }

  // =================================================================
  //  ENVIRONMENT & LIGHTING
  // =================================================================

  private createStudioEnvironment(): void {
    // Deep Studio Grey Background
    const bg = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x1a1a1a);
    bg.setPipeline('Light2D'); // Reacts to light

    // Parquet Floor Pattern
    const floor = this.add.graphics();
    floor.lineStyle(2, 0x000000, 0.2);
    
    // Draw intricate parquet pattern
    const tileSize = 80;
    for (let x = 0; x < GAME_WIDTH + tileSize; x += tileSize) {
        for (let y = 0; y < GAME_HEIGHT + tileSize; y += tileSize) {
            // Zig-Zag offsets
            const offset = (Math.floor(x/tileSize) % 2 === 0) ? 0 : tileSize/2;
            // Draw planks
            floor.moveTo(x, y + offset);
            floor.lineTo(x + tileSize, y + offset);
            floor.moveTo(x, y + offset);
            floor.lineTo(x, y + tileSize + offset);
        }
    }
    floor.setDepth(0);

    // Create the Mouse Spotlight
    this.spotlight = this.lights.addLight(GAME_WIDTH/2, GAME_HEIGHT/2, 400).setIntensity(2);
  }

  private createWetWheelBackground(): void {
    // The ominous wheel spinning in the void
    const wheel = this.add.image(GAME_WIDTH/2, GAME_HEIGHT * 0.45, 'wet_wheel_hd');
    wheel.setScale(1.8);
    wheel.setAlpha(0.08); // Very subtle
    wheel.setDepth(1);
    
    // Infinite Rotation
    this.tweens.add({
        targets: wheel,
        angle: 360,
        duration: 60000, // 1 minute per rotation (slow & menacing)
        repeat: -1,
        ease: 'Linear'
    });

    // "Breathing" Scale Effect
    this.tweens.add({
        targets: wheel,
        scale: 2.0,
        duration: 4000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
  }

  private createScanlines(): void {
    // TV Broadcast effect overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.1);
    for(let i=0; i<GAME_HEIGHT; i+=4) {
        overlay.fillRect(0, i, GAME_WIDTH, 1);
    }
    overlay.setDepth(999); // Top of everything
    overlay.setBlendMode(Phaser.BlendModes.OVERLAY);
    
    // FIX: Removed overlay.setInteractive(false) which caused the crash
    // Graphics are non-interactive by default.
  }

  // =================================================================
  //  PHYSICS ENGINE SETUP
  // =================================================================

  private setupPhysics(): void {
    // Create walls that allow balls to stack at the bottom
    this.matter.world.setBounds(0, -4000, GAME_WIDTH, GAME_HEIGHT, 64, true, true, true, true);
    
    // Add Mouse Constraint (The ability to throw things)
    this.matter.add.mouseSpring({
        length: 1,
        stiffness: 0.5,
        damping: 0.7
    });
  }

  private startBallPitRain(): void {
    // Rain different balls with different physical properties
    const ballTypes = [
        { key: 'basketball_hd', scale: 0.5, bounce: 0.9, mass: 5, count: 12 },
        { key: 'football_hd',   scale: 0.6, bounce: 0.6, mass: 4, count: 8 },
        { key: 'soccer_hd',     scale: 0.5, bounce: 0.8, mass: 4, count: 10 },
        { key: 'wiffle_hd',     scale: 0.4, bounce: 0.4, mass: 0.5, count: 15 }
    ];

    let delay = 0;

    ballTypes.forEach(type => {
        for(let i=0; i<type.count; i++) {
            this.time.delayedCall(delay, () => {
                const x = Phaser.Math.Between(50, GAME_WIDTH - 50);
                const y = -100 - (Math.random() * 500); // Start off screen
                
                const ball = this.matter.add.image(x, y, type.key);
                ball.setScale(type.scale);
                ball.setCircle(ball.displayWidth / 2);
                ball.setBounce(type.bounce);
                ball.setMass(type.mass);
                ball.setFriction(0.05);
                ball.setDepth(10); // Above floor, below UI
                
                // Add erratic spin
                ball.setAngularVelocity(Phaser.Math.Between(-0.2, 0.2));
                
                this.balls.push(ball);
            });
            delay += 100; // Stagger spawn
        }
    });
  }

  private spawnCrewHeads(): void {
    // The Yak Crew - Heavier, bigger, distinct
    const crew = ['BIG CAT', 'BRANDON', 'KB', 'NICK', 'RONE', 'SAS', 'TITUS'];
    
    crew.forEach((member, i) => {
        const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
        const y = -1000 - (i * 200); // Fall from sky later
        
        const head = this.matter.add.image(x, y, `crew_head_${i}`);
        head.setDisplaySize(96, 96); // Large heads
        
        // Custom hitbox for head shape (Circle is fine for chaos)
        head.setCircle(45);
        head.setBounce(0.5); // Heads don't bounce like basketballs
        head.setMass(10); // Heavy
        head.setFriction(0.5);
        head.setDepth(15); // Above balls
        
        this.heads.push(head);
    });
  }

  // =================================================================
  //  UI & INTERACTION
  // =================================================================

  private createEasyButton(): void {
    const y = GAME_HEIGHT * 0.75;
    
    // Container
    this.easyButton = this.add.container(GAME_WIDTH/2, y);
    this.easyButton.setDepth(100);

    // 1. The Red Button (Generated Texture)
    const btn = this.add.image(0, 0, 'easy_button_hd');
    
    // 2. The Text
    const text = this.add.text(0, 5, 'easy', {
        fontFamily: 'Arial',
        fontStyle: 'bold',
        fontSize: '32px',
        color: '#ffffff'
    }).setOrigin(0.5);

    // 3. Instruction
    const subText = this.add.text(0, 80, 'PRESS TO START', {
        fontFamily: YAK_FONTS.mono,
        fontSize: '18px',
        color: YAK_COLORS.textGold,
        backgroundColor: '#000000',
        padding: { x: 8, y: 4 }
    }).setOrigin(0.5);

    // 4. Hit Area - transparent rectangle
    const hit = this.add.rectangle(0, 0, 150, 150, 0x000000, 0.01);
    hit.setInteractive({ useHandCursor: true });

    this.easyButton.add([btn, text, subText, hit]);

    // Make sure the hit area is on top
    this.easyButton.bringToTop(hit);

    // Animations
    this.tweens.add({
        targets: this.easyButton,
        y: y - 10,
        duration: 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Interaction
    hit.on('pointerdown', () => {
        if(this.isTransitioning) return;
        this.isTransitioning = true;

        // Button Squish
        this.tweens.add({
            targets: [btn, text],
            scaleY: 0.8,
            y: 15,
            duration: 50,
            yoyo: true,
            onComplete: () => this.startGame()
        });
    });
  }

  private createGlitchLogo(): void {
    const y = GAME_HEIGHT * 0.25;
    this.logoContainer = this.add.container(GAME_WIDTH/2, y);
    this.logoContainer.setDepth(100);

    const yak = this.add.text(0, 0, "THE YAK", {
        fontFamily: 'Arial Black', fontSize: '84px', color: '#e74c3c', 
        stroke: '#000', strokeThickness: 12
    }).setOrigin(0.5);

    const gauntlet = this.add.text(0, 70, "GAUNTLET", {
        fontFamily: 'Arial Black', fontSize: '42px', color: '#f1c40f',
        stroke: '#000', strokeThickness: 8
    }).setOrigin(0.5);

    this.logoContainer.add([yak, gauntlet]);
  }

  private triggerLogoGlitch(): void {
    // Random visual corruption
    const offsetX = Phaser.Math.Between(-10, 10);
    const offsetY = Phaser.Math.Between(-5, 5);
    
    this.logoContainer.x = (GAME_WIDTH/2) + offsetX;
    this.logoContainer.y = (GAME_HEIGHT * 0.25) + offsetY;

    this.time.delayedCall(50, () => {
        this.logoContainer.x = GAME_WIDTH/2;
        this.logoContainer.y = GAME_HEIGHT * 0.25;
    });
  }

  private createDataDayTicker(): void {
    // Bottom Ticker Bar
    const h = 50;
    const y = GAME_HEIGHT - h/2;
    
    // Background Strip (Black/Red)
    const bg = this.add.rectangle(GAME_WIDTH/2, y, GAME_WIDTH, h, 0x000000).setDepth(5);
    const border = this.add.rectangle(GAME_WIDTH/2, y - h/2, GAME_WIDTH, 4, 0xff0000).setDepth(6);

    // Deep Cut Lore Headlines
    const headlines = [
        "BREAKING: TJ HITS THE BUTTON",
        "BRANDON WALKER: 'I AM NOT A MORON'",
        "KB: GEOGRAPHY WIZARD OR ALIEN?",
        "CLICKY CLICKY CLICKY",
        "CASE RACE PROTOCOL: INITIATED",
        "TANK THURSDAY: BEWARE THE VINEGAR",
        "STEVEN CHEAH: 99.9% CHANCE OF DATA",
        "MINTZY: EYES CLOSED, HEARTS OPEN",
        "RONE: BATTLE RAP CHAMPION",
        "BIG CAT: COFFEE CONSUMPTION CRITICAL",
        "SAS: KING OF NEW YORK",
        "10X EVERYTHING",
        "DON'T SAY LIST: [REDACTED]",
        "WET WHEEL: SPINNING..."
    ];

    const text = headlines.join("   ///   ") + "   ///   " + headlines.join("   ///   ");
    
    this.tickerContainer = this.add.container(GAME_WIDTH, y);
    const t = this.add.text(0, 0, text, {
        fontFamily: 'Courier New', fontSize: '24px', color: '#00ff00', fontStyle: 'bold'
    }).setOrigin(0, 0.5);
    
    this.tickerContainer.add(t);
    this.tickerContainer.setDepth(7); // Just above floor, below balls
  }

  private createStationPreview(): void {
    // Minimalist dots to show the 6 stations
    const startX = GAME_WIDTH/2 - 150;
    const y = GAME_HEIGHT * 0.55;
    
    STATIONS.forEach((s, i) => {
        const x = startX + (i * 60);
        this.add.circle(x, y, 8, s.color).setStrokeStyle(2, 0x000000).setDepth(90);
    });
  }

  private setupInteractions(): void {
    // Graffiti System: Click empty space to stamp
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        // Only if not clicking a button
        if (pointer.y < GAME_HEIGHT - 100 && pointer.y > 100) {
            this.spawnGraffiti(pointer.x, pointer.y);
        }
    });
  }

  private spawnGraffiti(x: number, y: number): void {
    const words = ["10X", "WET", "CHEAH", "TANK", "VIBES", "SCOOF"];
    const word = words[Math.floor(Math.random() * words.length)];
    
    const text = this.add.text(x, y, word, {
        fontFamily: 'Arial Black',
        fontSize: '48px',
        color: Math.random() > 0.5 ? '#e74c3c' : '#ffffff',
        stroke: '#000000',
        strokeThickness: 6
    }).setOrigin(0.5);
    
    text.setRotation((Math.random() - 0.5) * 0.5);
    text.setDepth(2); // On the wall/floor

    // Pop and Fade
    this.tweens.add({
        targets: text,
        scale: { from: 0, to: 1 },
        alpha: { from: 1, to: 0 },
        y: y - 50,
        duration: 1500,
        ease: 'Back.out',
        onComplete: () => text.destroy()
    });
  }

  private startGame(): void {
    this.cameras.main.flash(1000, 255, 255, 255);
    this.time.delayedCall(800, () => {
        this.scene.start('RunScene', { isRestart: true });
    });
  }

  private initFirebase(): void {
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      this.registry.set('firebase', { app, db });
    } catch (e) {}
  }

  private createLoadingUI(): void { 
      // Minimal loader bar
      const bar = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, 0, 4, 0xffffff);
      this.load.on('progress', (p: number) => {
          bar.width = 200 * p;
      });
      this.load.on('complete', () => bar.destroy());
  }

  // =================================================================
  //  ASSET GENERATION FACTORY (THE BEEF)
  //  Procedurally generates high-res assets so no PNGs are needed.
  // =================================================================

  private generateGameTextures(): void {
    this.generateBasketball();
    this.generateFootball();
    this.generateSoccerball();
    this.generateWiffleball();
  }

  private generateBasketball(): void {
    const size = 128; // High res
    const g = this.make.graphics({x:0, y:0});
    
    // 1. Base Orange Texture (Stippled)
    g.fillStyle(0xd35400); // Darker orange base
    g.fillCircle(size/2, size/2, size/2);
    g.fillStyle(0xe67e22); // Main orange
    g.fillCircle(size/2, size/2, size/2 - 2);

    // 2. Black Seams (Using Arcs instead of Bezier)
    g.lineStyle(4, 0x1a1a1a);
    
    // Cross
    g.beginPath();
    g.moveTo(size/2, 0); g.lineTo(size/2, size); // Vertical
    g.moveTo(0, size/2); g.lineTo(size, size/2); // Horizontal
    g.strokePath();

    // Curves
    g.beginPath();
    // Left Curve: arc centered far to right
    g.arc(size * 1.5, size/2, size * 1.1, Phaser.Math.DegToRad(160), Phaser.Math.DegToRad(200), false);
    g.strokePath();

    g.beginPath();
    // Right Curve: arc centered far to left
    g.arc(-size * 0.5, size/2, size * 1.1, Phaser.Math.DegToRad(-20), Phaser.Math.DegToRad(20), false);
    g.strokePath();

    // 3. Highlight
    g.fillStyle(0xffffff, 0.2);
    g.fillCircle(size*0.3, size*0.3, 10);

    g.generateTexture('basketball_hd', size, size);
    g.destroy();
  }

  private generateFootball(): void {
    const w = 120, h = 80;
    const g = this.make.graphics({x:0, y:0});

    // 1. Base Brown Leather
    g.fillStyle(0x5d4037);
    g.fillEllipse(w/2, h/2, w, h);
    
    // 2. White Stripes (Ends)
    g.lineStyle(3, 0xffffff);
    g.beginPath();
    g.arc(w*0.25, h/2, h*0.4, -Math.PI/3, Math.PI/3);
    g.strokePath();
    g.beginPath();
    g.arc(w*0.75, h/2, h*0.4, Math.PI*0.66, Math.PI*1.33);
    g.strokePath();

    // 3. The Laces (Detailed)
    g.fillStyle(0xffffff);
    const laceW = 40, laceH = 15;
    g.fillRect(w/2 - laceW/2, h/2 - laceH/2, laceW, laceH); // Base white rect
    
    // Individual laces
    g.lineStyle(2, 0xcccccc);
    for(let i=0; i<=5; i++) {
        const lx = (w/2 - laceW/2) + (i * (laceW/5));
        g.lineBetween(lx, h/2 - laceH/2, lx, h/2 + laceH/2);
    }

    g.generateTexture('football_hd', w, h);
    g.destroy();
  }

  private generateSoccerball(): void {
    const size = 128;
    const g = this.make.graphics({x:0, y:0});

    g.fillStyle(0xffffff);
    g.fillCircle(size/2, size/2, size/2);
    g.lineStyle(2, 0xdddddd);
    g.strokeCircle(size/2, size/2, size/2);

    // Pentagons (Black spots)
    g.fillStyle(0x2c3e50);
    const spots = [
        {x: 0.5, y: 0.5}, {x: 0.2, y: 0.3}, {x: 0.8, y: 0.3},
        {x: 0.2, y: 0.7}, {x: 0.8, y: 0.7}
    ];

    spots.forEach(s => {
        g.fillCircle(size*s.x, size*s.y, size*0.12);
    });

    g.generateTexture('soccer_hd', size, size);
    g.destroy();
  }

  private generateWiffleball(): void {
    const size = 96;
    const g = this.make.graphics({x:0, y:0});

    // Base White Plastic
    g.fillStyle(0xecf0f1);
    g.fillCircle(size/2, size/2, size/2);
    
    // Shading
    g.fillStyle(0xbdc3c7);
    g.fillCircle(size/2, size/2, size/2 - 4); // Inner rim

    // Holes (The Wiffle Look)
    g.fillStyle(0x95a5a6); // Darker inside holes
    // Central band of holes
    for(let i=0; i<8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const hx = size/2 + Math.cos(angle) * (size*0.3);
        const hy = size/2 + Math.sin(angle) * (size*0.3);
        
        // Elongated holes
        g.fillEllipse(hx, hy, 8, 14);
    }

    g.generateTexture('wiffle_hd', size, size);
    g.destroy();
  }

  private generateYakTextures(): void {
    // 1. Wet Wheel HD
    const size = 512;
    const g = this.make.graphics({x:0, y:0});
    const colors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6, 0xe67e22];
    
    for(let i=0; i<6; i++) {
        g.fillStyle(colors[i]);
        g.slice(size/2, size/2, size/2, i*(Math.PI/3), (i+1)*(Math.PI/3));
        g.fillPath();
    }
    
    // Wheel Rim
    g.lineStyle(10, 0xffffff);
    g.strokeCircle(size/2, size/2, size/2 - 5);
    
    // Center Nub
    g.fillStyle(0x333333);
    g.fillCircle(size/2, size/2, 40);
    g.fillStyle(0xffffff);
    g.fillCircle(size/2, size/2, 10);

    g.generateTexture('wet_wheel_hd', size, size);
    g.destroy();

    // 2. Easy Button HD
    const btnW = 160, btnH = 160;
    const b = this.make.graphics({x:0, y:0});
    
    // Silver Base
    b.fillStyle(0xbdc3c7);
    b.fillCircle(btnW/2, btnH/2, 75);
    b.lineStyle(4, 0x7f8c8d);
    b.strokeCircle(btnW/2, btnH/2, 75);

    // Red Dome
    b.fillStyle(0xe74c3c); // Base Red
    b.fillCircle(btnW/2, btnH/2, 60);
    
    // Gloss/Shine (Top)
    b.fillStyle(0xffffff, 0.4);
    b.fillEllipse(btnW/2, btnH*0.35, 40, 20);

    b.generateTexture('easy_button_hd', btnW, btnH);
    b.destroy();
  }

  private generatePixelCrew(): void {
    // Generates 7 unique heads with specific features
    const crew = [
        { color: 0x3498db, name: 'BigCat', glasses: true, hair: 'brown' },
        { color: 0xc0392b, name: 'Brandon', glasses: false, hair: 'brown', bald: false },
        { color: 0x2ecc71, name: 'KB', glasses: false, hair: 'black', hat: true },
        { color: 0xf1c40f, name: 'Nick', glasses: false, hair: 'blonde' },
        { color: 0x9b59b6, name: 'Sas', glasses: false, hair: 'dark' },
        { color: 0x7f8c8d, name: 'Zah', glasses: false, hair: 'black', beard: true },
        { color: 0xe67e22, name: 'Titus', glasses: false, hair: 'brown' }
    ];

    const size = 64;
    
    crew.forEach((member, i) => {
        const g = this.make.graphics({x:0, y:0});
        
        // 1. Skin Base
        g.fillStyle(0xffdbac);
        g.fillRect(8, 8, 48, 48);

        // 2. Hair
        g.fillStyle(member.hair === 'blonde' ? 0xf1c40f : 0x3e2723);
        if(!member.hat) {
            g.fillRect(8, 0, 48, 12); // Top hair
            g.fillRect(4, 8, 8, 24);  // Sideburns
            g.fillRect(52, 8, 8, 24);
        } else {
            // KB's Hat (Beanie)
            g.fillStyle(0x27ae60);
            g.fillRect(6, 0, 52, 16);
        }

        // 3. Facial Features
        g.fillStyle(0x000000);
        
        if(member.glasses) {
            // Sunglasses (Big Cat)
            g.fillRect(14, 20, 16, 10);
            g.fillRect(34, 20, 16, 10);
            g.fillRect(28, 24, 8, 4); // Bridge
        } else {
            // Eyes
            g.fillRect(18, 24, 6, 6);
            g.fillRect(40, 24, 6, 6);
        }

        // Beard (Zah/Big Cat)
        if(member.beard || member.name === 'BigCat') {
            g.fillStyle(0x3e2723);
            g.fillRect(16, 40, 32, 8); // Goatee/Beard area
        } else {
            // Smile
            g.fillRect(20, 42, 24, 4);
        }

        // 4. Shirt Collar
        g.fillStyle(member.color);
        g.fillRect(12, 56, 40, 8);

        g.generateTexture(`crew_head_${i}`, size, size);
        g.destroy();
    });
  }
}