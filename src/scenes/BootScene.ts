import Phaser from 'phaser';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebaseConfig';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS, createStoolIcon } from '../config/theme';

/**
 * THE YAK GAUNTLET - BOOT SCENE (The Studio)
 * ------------------------------------------------------------------
 * A chaotic, interactive physics playground representing the Yak Studio.
 * Features:
 * 1. Tossable Crew Heads (Physics)
 * 2. "The Pile" (Trash/Boxes)
 * 3. The "Easy Button" Start
 * 4. Breaking News Ticker (Lore)
 * 5. Ominous Wet Wheel Background
 */

export class BootScene extends Phaser.Scene {
  // Container references
  private logoContainer!: Phaser.GameObjects.Container;
  private easyButton!: Phaser.GameObjects.Container;
  private tickerContainer!: Phaser.GameObjects.Container;
  private tickerText!: Phaser.GameObjects.Text;

  // State
  private isTransitioning = false;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingUI();
    
    // We generate all assets programmatically to keep the file size low
    // and allow for infinite customization without Photoshop.
    this.generateGameTextures(); // Standard Balls
    this.generateYakTextures();  // Wheel, Box, Soda, Button
    this.generatePixelCrew();    // The Crew Heads
  }

  create(): void {
    // 1. Initialize Backend (Silent Fail)
    this.initFirebase();

    // 2. The Studio Environment
    this.createStudioBackground();
    this.createWheelAura();

    // 3. Physics World Setup
    this.setupPhysicsWorld();
    this.spawnThePile();      // Boxes, Scales, Sodas
    this.spawnCrewHeads();    // The tossable heads

    // 4. UI Layer (The Brand)
    this.createGlitchLogo();
    this.createStationPreview(); // The "Gauntlet" Map
    this.createEasyButton();     // The Start Mechanism
    this.createDataDayTicker();  // The Lore

    // 5. Ambient Effects
    this.startGraffitiLoop(); // Random text popups
  }

  update(): void {
    // Scroll the ticker
    if (this.tickerText) {
      this.tickerText.x -= 2.5; // Smooth scroll speed
      if (this.tickerText.x < -this.tickerText.width) {
        this.tickerText.x = GAME_WIDTH;
      }
    }
  }

  // =================================================================================================
  //  INIT & SETUP
  // =================================================================================================

  private initFirebase(): void {
    try {
      const app = initializeApp(firebaseConfig);
      const db = getFirestore(app);
      this.registry.set('firebase', { app, db });
    } catch (e) {
      console.warn('Firebase skipped (Config missing or Dev mode)');
    }
  }

  private setupPhysicsWorld(): void {
    // Set bounds so heads bounce off walls (Left, Right, Bottom, Top-Open)
    this.matter.world.setBounds(0, -1000, GAME_WIDTH, GAME_HEIGHT + 1000);
    
    // Enable Mouse/Touch Dragging
    this.matter.add.mouseSpring({
      stiffness: 0.2,
      damping: 0.8,
      length: 1
    });
  }

  // =================================================================================================
  //  VISUAL LAYERS
  // =================================================================================================

  private createStudioBackground(): void {
    // 1. Vibrant Yak gradient background (navy to dark)
    const bg = this.add.graphics();
    bg.fillGradientStyle(YAK_COLORS.navyDark, YAK_COLORS.navyDark, YAK_COLORS.bgDark, YAK_COLORS.bgDark, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // 2. Add energetic accent stripes (subtle)
    const stripeGraphics = this.add.graphics();
    const stripeColors = [YAK_COLORS.primary, YAK_COLORS.secondary, YAK_COLORS.vibrantGreen, YAK_COLORS.vibrantBlue];

    for (let i = 0; i < 8; i++) {
      const color = stripeColors[i % stripeColors.length];
      stripeGraphics.fillStyle(color, 0.03);
      stripeGraphics.fillRect(0, i * (GAME_HEIGHT / 8), GAME_WIDTH, GAME_HEIGHT / 8);
    }

    // 3. Add scattered stars/sparkles for energy
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const size = 2 + Math.random() * 4;

      const star = this.add.star(x, y, 4, size, size * 2, YAK_COLORS.secondary, 0.3);

      // Twinkle animation
      this.tweens.add({
        targets: star,
        alpha: 0.1,
        scale: 0.5,
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 2000
      });
    }
  }

  private createWheelAura(): void {
    // The "Wet Wheel" looms in the background
    const wheel = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 'wet_wheel');
    
    // Scale to fill a good chunk of screen
    const scale = Math.min(GAME_WIDTH, GAME_HEIGHT) / 400; 
    wheel.setScale(scale);
    wheel.setAlpha(0.08); // Very subtle
    wheel.setTint(0x999999); // De-saturated

    // Infinite slow spin
    this.tweens.add({
        targets: wheel,
        angle: 360,
        duration: 40000,
        repeat: -1,
        ease: 'Linear'
    });

    // "Breathing" Pulse (The threat of wetness)
    this.tweens.add({
        targets: wheel,
        scale: scale * 1.1,
        alpha: 0.12,
        duration: 5000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });
  }

  // =================================================================================================
  //  PHYSICS OBJECTS (The "Yak" Elements)
  // =================================================================================================

  private spawnCrewHeads(): void {
    // Spawn the cast as bouncy balls
    const size = 64; 
    
    for(let i=0; i<6; i++) {
        const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
        const y = Phaser.Math.Between(100, GAME_HEIGHT * 0.4);
        
        const head = this.matter.add.image(x, y, `crew_${i}`);
        head.setDisplaySize(size, size);
        head.setCircle(size / 2.2); // Hitbox slightly smaller than sprite
        head.setBounce(0.85); // High bounce
        head.setFriction(0.1);
        head.setDensity(0.01); // Light enough to throw
        
        // Initial random velocity
        head.setVelocity(
            Phaser.Math.Between(-5, 5), 
            Phaser.Math.Between(-5, 5)
        );
    }
  }

  private spawnThePile(): void {
    // Big Cat's Pile of Trash - Physics Objects
    const groundY = GAME_HEIGHT - 150;

    // 1. Cardboard Boxes
    for(let i=0; i<5; i++) {
        const box = this.matter.add.image(
            Phaser.Math.Between(50, GAME_WIDTH-50),
            groundY - (i * 50),
            'cardboard_box'
        );
        box.setDisplaySize(60 + Math.random()*20, 50 + Math.random()*10);
        box.setBounce(0.2); // Boxes don't bounce much
        box.setFriction(0.8);
        box.setAngle(Math.random() * 360);
    }

    // 2. Frank's Soda Cans
    for(let i=0; i<3; i++) {
        const soda = this.matter.add.image(
            Phaser.Math.Between(100, GAME_WIDTH-100),
            groundY - 200,
            'soda_can'
        );
        soda.setBounce(0.6);
        soda.setFriction(0.05); // Rolls easily
    }

    // 3. Cheah's Scale
    const scale = this.matter.add.image(GAME_WIDTH/2, groundY, 'cheah_scale');
    scale.setStatic(false);
    scale.setDensity(0.5); // Heavy
  }

  // =================================================================================================
  //  UI ELEMENTS
  // =================================================================================================

  private createGlitchLogo(): void {
    const y = GAME_HEIGHT * 0.25;
    this.logoContainer = this.add.container(GAME_WIDTH/2, y);

    // Add stool icons on both sides of the logo
    const leftStool = createStoolIcon(this, -140, 0, 1.5);
    const rightStool = createStoolIcon(this, 140, 0, 1.5);

    // Rotate stools slightly for personality
    leftStool.setAngle(-10);
    rightStool.setAngle(10);

    // Add small stars around the stools
    const leftStar1 = this.add.star(-160, -30, 5, 6, 12, YAK_COLORS.secondary, 1);
    const leftStar2 = this.add.star(-120, -35, 5, 4, 8, YAK_COLORS.secondary, 0.8);
    const rightStar1 = this.add.star(160, -30, 5, 6, 12, YAK_COLORS.secondary, 1);
    const rightStar2 = this.add.star(120, -35, 5, 4, 8, YAK_COLORS.secondary, 0.8);

    // Main "THE YAK" with vibrant Yak orange-red
    const yakText = this.add.text(0, 0, 'THE YAK', {
        fontFamily: 'Arial Black',
        fontSize: '72px',
        color: YAK_COLORS.textOrange,
        stroke: '#000000',
        strokeThickness: 10,
        shadow: { offsetX: 5, offsetY: 5, color: '#000', blur: 0, fill: true }
    }).setOrigin(0.5);

    // "GAUNTLET" with vibrant gold
    const gauntletText = this.add.text(0, 60, 'GAUNTLET', {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: YAK_COLORS.textGold,
        stroke: '#000000',
        strokeThickness: 7,
        shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true }
    }).setOrigin(0.5);

    this.logoContainer.add([leftStool, rightStool, leftStar1, leftStar2, rightStar1, rightStar2, yakText, gauntletText]);

    // Pulse animation for energy
    this.tweens.add({
        targets: [leftStar1, leftStar2, rightStar1, rightStar2],
        alpha: 0.3,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Glitch Animation (Randomly shakes the logo for personality)
    this.time.addEvent({
        delay: 2500,
        loop: true,
        callback: () => {
            if (Math.random() > 0.5) {
                this.tweens.add({
                    targets: this.logoContainer,
                    x: GAME_WIDTH/2 + Phaser.Math.Between(-5, 5),
                    y: y + Phaser.Math.Between(-5, 5),
                    angle: Phaser.Math.Between(-2, 2),
                    duration: 50,
                    yoyo: true,
                    repeat: 3
                });
            }
        }
    });
  }

  private createEasyButton(): void {
    const y = GAME_HEIGHT * 0.72;

    // Visuals - Vibrant Yak styling
    const base = this.add.circle(0, 10, 68, YAK_COLORS.stoolDark).setStrokeStyle(4, 0x000);
    const btn = this.add.circle(0, 0, 62, YAK_COLORS.primary).setStrokeStyle(4, YAK_COLORS.primaryDark);

    // Add glow effect
    const glow = this.add.circle(0, 0, 72, YAK_COLORS.primaryBright, 0.3);

    const text = this.add.text(0, 0, 'easy', {
        fontFamily: 'Arial Black',
        fontSize: '40px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5).setPadding(0, 5, 0, 0);

    // Interaction
    this.easyButton = this.add.container(GAME_WIDTH/2, y, [glow, base, btn, text]);

    // Invisible Hit Area
    const hitArea = this.add.circle(GAME_WIDTH/2, y, 75).setInteractive({ useHandCursor: true });

    // Floating animation
    this.tweens.add({
        targets: this.easyButton,
        y: y - 10,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Pulsing glow
    this.tweens.add({
        targets: glow,
        scale: 1.15,
        alpha: 0.1,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Instruction Text - More energetic
    const prompt = this.add.text(GAME_WIDTH/2, y + 95, 'PRESS TO START', {
        fontFamily: YAK_FONTS.title,
        fontSize: '22px',
        color: YAK_COLORS.textGold,
        stroke: '#000000',
        strokeThickness: 5
    }).setOrigin(0.5);

    // Subtle prompt pulse
    this.tweens.add({
        targets: prompt,
        scale: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    // Click Handler
    hitArea.on('pointerdown', () => {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        // "Squish" Effect with color change
        btn.setFillStyle(YAK_COLORS.primaryDark);
        this.tweens.add({
            targets: this.easyButton,
            scaleY: 0.8,
            y: y + 10,
            duration: 50,
            yoyo: true,
            onComplete: () => this.startGame()
        });
    });
  }

  private createStationPreview(): void {
    // Vibrant station icons with emojis
    const y = GAME_HEIGHT * 0.55;
    const spacing = 75;
    const startX = GAME_WIDTH/2 - ((STATIONS.length-1) * spacing) / 2;

    // Title above stations
    const title = this.add.text(GAME_WIDTH/2, y - 50, '7 CHALLENGES', {
        fontFamily: YAK_FONTS.title,
        fontSize: '24px',
        color: YAK_COLORS.textGold,
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5);

    // Pulse animation
    this.tweens.add({
        targets: title,
        scale: 1.05,
        duration: 1200,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    STATIONS.forEach((s, i) => {
        const x = startX + i * spacing;

        // Colorful background circle with glow
        const glow = this.add.circle(x, y, 20, s.color, 0.3);
        const iconBg = this.add.circle(x, y, 16, s.color, 1)
            .setStrokeStyle(3, 0xffffff, 0.9);

        // Emoji icon
        const emoji = this.add.text(x, y, s.emoji, {
            fontSize: '22px'
        }).setOrigin(0.5);

        // Stagger the bounce animations for energy
        this.tweens.add({
            targets: [glow, iconBg, emoji],
            y: y - 5,
            duration: 800 + (i * 100),
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: i * 150
        });

        // Glow pulse
        this.tweens.add({
            targets: glow,
            scale: 1.3,
            alpha: 0.1,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            delay: i * 150
        });
    });
  }

  private createDataDayTicker(): void {
    const barHeight = 45;
    const y = GAME_HEIGHT - barHeight/2;

    // 1. Background Bar with Yak colors
    const bg = this.add.rectangle(GAME_WIDTH/2, y, GAME_WIDTH, barHeight, YAK_COLORS.bgDark).setDepth(90);
    const border = this.add.rectangle(GAME_WIDTH/2, y - barHeight/2, GAME_WIDTH, 3, YAK_COLORS.primary).setDepth(91);

    // 2. The Text Content (Deep Cuts)
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

    // Create huge text string
    const textContent = headlines.join("   ///   ") + "   ///   ";

    // 3. The Text Object with Yak gold
    this.tickerText = this.add.text(GAME_WIDTH, y, textContent, {
        fontFamily: YAK_FONTS.mono,
        fontSize: '20px',
        color: YAK_COLORS.textGold,
        fontStyle: 'bold',
        padding: { top: 12, bottom: 12 }
    }).setOrigin(0, 0.5).setDepth(92);
  }

  private startGraffitiLoop(): void {
    // Random words popping up with vibrant Yak colors
    const words = ["10X", "WET", "TANK", "VIBES", "DRAIN", "CHEAH", "SCOOF", "PUKE"];
    const colors = [
        YAK_COLORS.textOrange,
        YAK_COLORS.textGold,
        YAK_COLORS.textGreen,
        YAK_COLORS.textRed,
        '#1e88e5', // Vibrant blue
        '#8e24aa'  // Vibrant purple
    ];

    this.time.addEvent({
        delay: 1500,
        loop: true,
        callback: () => {
            const text = words[Phaser.Math.Between(0, words.length-1)];
            const color = colors[Phaser.Math.Between(0, colors.length-1)];
            const x = Phaser.Math.Between(50, GAME_WIDTH-50);
            const y = Phaser.Math.Between(100, GAME_HEIGHT-150);

            const g = this.add.text(x, y, text, {
                fontFamily: 'Arial Black',
                fontSize: Math.random() > 0.8 ? '52px' : '28px',
                color: color,
                stroke: '#000000',
                strokeThickness: 5
            }).setOrigin(0.5).setRotation(Phaser.Math.Between(-0.5, 0.5)).setAlpha(0);

            this.tweens.add({
                targets: g,
                alpha: 0.4, // Slightly more visible
                scale: 1.5,
                duration: 1000,
                yoyo: true,
                onComplete: () => g.destroy()
            });
        }
    });
  }

  private startGame(): void {
    this.cameras.main.flash(800, 255, 255, 255); // Whiteout transition
    this.time.delayedCall(500, () => {
        this.scene.start('RunScene', { isRestart: true });
    });
  }

  // =================================================================================================
  //  ASSET GENERATION (The Factory)
  // =================================================================================================

  private createLoadingUI(): void {
    // Simple bar
    const bg = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, 200, 10, 0x333333);
    const bar = this.add.rectangle(GAME_WIDTH/2 - 100, GAME_HEIGHT/2, 0, 10, 0xe74c3c).setOrigin(0, 0.5);
    this.load.on('progress', (val: number) => {
        bar.width = 200 * val;
    });
    this.load.on('complete', () => { bg.destroy(); bar.destroy(); });
  }

  private generateGameTextures(): void {
    // Standard Balls (Simple circles)
    const b = this.make.graphics({x:0,y:0}); b.fillStyle(0xe67e22); b.fillCircle(20,20,20); b.generateTexture('basketball',40,40); b.destroy();
    const s = this.make.graphics({x:0,y:0}); s.fillStyle(0xffffff); s.fillCircle(18,18,18); s.lineStyle(2,0x000); s.strokeCircle(18,18,18); s.generateTexture('soccerball',36,36); s.destroy();
    const w = this.make.graphics({x:0,y:0}); w.fillStyle(0xdddddd); w.fillCircle(15,15,15); w.generateTexture('wiffleball',30,30); w.destroy();
    const bb = this.make.graphics({x:0,y:0}); bb.fillStyle(0xc0392b); bb.fillRoundedRect(0,0,32,32,8); bb.generateTexture('beanbag',32,32); bb.destroy();
  }

  private generateYakTextures(): void {
    // 1. Wet Wheel with vibrant Yak colors
    const size = 256;
    const wheel = this.make.graphics({x:0,y:0});
    const colors = [
        YAK_COLORS.vibrantRed,
        YAK_COLORS.vibrantOrange,
        YAK_COLORS.vibrantYellow,
        YAK_COLORS.vibrantGreen,
        YAK_COLORS.vibrantBlue,
        YAK_COLORS.vibrantPurple
    ];
    for(let i=0; i<6; i++) {
        wheel.fillStyle(colors[i]);
        wheel.slice(size/2, size/2, size/2, i*(Math.PI/3), (i+1)*(Math.PI/3));
        wheel.fillPath();
    }
    wheel.lineStyle(5, 0xffffff);
    wheel.strokeCircle(size/2, size/2, size/2);
    wheel.generateTexture('wet_wheel', size, size);
    wheel.destroy();

    // 2. Cardboard Box
    const box = this.make.graphics({x:0,y:0});
    box.fillStyle(0xcbaacb); // Box color
    box.fillRect(0,0,60,50);
    box.lineStyle(2, 0x8d6e63);
    box.strokeRect(0,0,60,50);
    box.beginPath(); box.moveTo(0,0); box.lineTo(60,50); box.strokePath(); // Tape
    box.generateTexture('cardboard_box', 60, 50);
    box.destroy();

    // 3. Cheah Scale (Grey Slab)
    const scale = this.make.graphics({x:0,y:0});
    scale.fillStyle(0x424242);
    scale.fillRoundedRect(0,0,80,20,4);
    scale.generateTexture('cheah_scale', 80, 20);
    scale.destroy();

    // 4. Frank's Soda (Blue Can)
    const can = this.make.graphics({x:0,y:0});
    can.fillStyle(0x1976d2);
    can.fillRect(0,0,20,35);
    can.fillStyle(0xdddddd);
    can.fillRect(0,0,20,4); // Top rim
    can.generateTexture('soda_can', 20, 35);
    can.destroy();
  }

  private generatePixelCrew(): void {
    // Generates the heads for the physics engine
    const colors = [0x3498db, 0x8e44ad, 0xe67e22, 0x2ecc71, 0x7f8c8d, 0xc0392b];
    
    colors.forEach((color, i) => {
        const g = this.make.graphics({x:0,y:0});
        // Skin
        g.fillStyle(0xffdbac); g.fillRect(4,4,56,56);
        // Hair
        g.fillStyle(0x3e2723); g.fillRect(4,0,56,16);
        g.fillRect(0,4,8,24); g.fillRect(56,4,8,24); // Sideburns
        
        // Shirt
        g.fillStyle(color); g.fillRect(4,52,56,12);

        // Face Details
        g.fillStyle(0x000000);
        if(i === 0) { // Big Cat Sunglasses
            g.fillRect(12, 24, 16, 12);
            g.fillRect(36, 24, 16, 12);
            g.fillRect(28, 28, 8, 4); // Bridge
        } else { // Eyes
            g.fillRect(16, 28, 8, 8);
            g.fillRect(40, 28, 8, 8);
        }
        
        g.generateTexture(`crew_${i}`, 64, 64);
        g.destroy();
    });
  }
}