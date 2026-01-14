import Phaser from 'phaser';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebaseConfig';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS, createStoolIcon } from '../config/theme';

/**
 * THE YAK GAUNTLET - BOOT SCENE (The Studio)
 * ------------------------------------------------------------------
 * Features:
 * 1. Tossable Crew Heads (Physics)
 * 2. "The Ball Pit" (Sports Balls instead of Trash)
 * 3. The "Easy Button" Start
 * 4. Breaking News Ticker
 * 5. Ominous Wet Wheel Background
 */

export class BootScene extends Phaser.Scene {
  // Container references
  private logoContainer!: Phaser.GameObjects.Container;
  private easyButton!: Phaser.GameObjects.Container;
  private tickerText!: Phaser.GameObjects.Text;

  // State
  private isTransitioning = false;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.createLoadingUI();
    
    // Generate Assets
    this.generateGameTextures(); // Balls (Basketball, Football, etc)
    this.generateYakTextures();  // Wheel, Button
    this.generatePixelCrew();    // The Crew Heads
  }

  create(): void {
    // 1. Initialize Backend
    this.initFirebase();

    // 2. The Studio Environment
    this.createStudioBackground();
    this.createWheelAura();

    // 3. Physics World Setup
    this.setupPhysicsWorld();
    this.spawnSportsChaos();  // NEW: Spawns balls instead of trash
    this.spawnCrewHeads();    // The tossable heads

    // 4. UI Layer
    this.createGlitchLogo();
    this.createStationPreview();
    this.createEasyButton();
    this.createDataDayTicker();

    // 5. Ambient Effects
    this.startGraffitiLoop();
  }

  update(): void {
    // Scroll the ticker
    if (this.tickerText) {
      this.tickerText.x -= 2.5;
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
      console.warn('Firebase skipped');
    }
  }

  private setupPhysicsWorld(): void {
    // Walls: Left, Right, Floor. Top is open.
    this.matter.world.setBounds(0, -2000, GAME_WIDTH, GAME_HEIGHT + 2000);
    
    // Enable Mouse Interaction
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
    const bg = this.add.graphics();
    bg.fillGradientStyle(YAK_COLORS.navyDark, YAK_COLORS.navyDark, YAK_COLORS.bgDark, YAK_COLORS.bgDark, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Subtle Grid
    const grid = this.add.graphics();
    grid.lineStyle(2, 0xffffff, 0.03);
    for(let i=0; i<GAME_WIDTH; i+=60) {
        grid.moveTo(i, 0); grid.lineTo(i, GAME_HEIGHT);
    }
    for(let i=0; i<GAME_HEIGHT; i+=60) {
        grid.moveTo(0, i); grid.lineTo(GAME_WIDTH, i);
    }
    grid.strokePath();
  }

  private createWheelAura(): void {
    const wheel = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT * 0.4, 'wet_wheel');
    const scale = Math.min(GAME_WIDTH, GAME_HEIGHT) / 400; 
    wheel.setScale(scale);
    wheel.setAlpha(0.08); 
    wheel.setTint(0x999999); 

    this.tweens.add({
        targets: wheel,
        angle: 360,
        duration: 40000,
        repeat: -1,
        ease: 'Linear'
    });

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
  //  PHYSICS OBJECTS
  // =================================================================================================

  private spawnCrewHeads(): void {
    const size = 64; 
    
    for(let i=0; i<6; i++) {
        const x = Phaser.Math.Between(100, GAME_WIDTH - 100);
        const y = Phaser.Math.Between(100, GAME_HEIGHT * 0.5);
        
        const head = this.matter.add.image(x, y, `crew_${i}`);
        head.setDisplaySize(size, size);
        head.setCircle(size / 2.2); 
        head.setBounce(0.85); 
        head.setFriction(0.1);
        head.setDensity(0.01); 
        head.setVelocity(Phaser.Math.Between(-5, 5), Phaser.Math.Between(-5, 5));
    }
  }

  private spawnSportsChaos(): void {
    // REPLACED "The Pile" with Sports Balls
    const groundY = GAME_HEIGHT - 100;
    const items = ['basketball', 'football', 'soccerball', 'wiffleball'];

    for(let i=0; i<12; i++) {
        const type = items[Math.floor(Math.random() * items.length)];
        const x = Phaser.Math.Between(50, GAME_WIDTH-50);
        const y = groundY - (Math.random() * 300);

        const ball = this.matter.add.image(x, y, type);
        
        // Physics tweaks based on ball type
        if (type === 'football') {
            ball.setDisplaySize(50, 30);
            // Approximate oval/chamfer hitbox
            ball.setBody({ type: 'rectangle', width: 45, height: 25 }, { chamfer: { radius: 10 } });
            ball.setBounce(0.6); // Fun erratic bounce
        } else {
            const size = type === 'basketball' ? 45 : type === 'soccerball' ? 40 : 25;
            ball.setDisplaySize(size, size);
            ball.setCircle(size/2);
            ball.setBounce(0.8);
        }
        
        ball.setFriction(0.05);
        ball.setAngle(Math.random() * 360);
    }
  }

  // =================================================================================================
  //  UI ELEMENTS
  // =================================================================================================

  private createGlitchLogo(): void {
    const y = GAME_HEIGHT * 0.25;
    this.logoContainer = this.add.container(GAME_WIDTH/2, y);

    const leftStool = createStoolIcon(this, -140, 0, 1.5).setAngle(-10);
    const rightStool = createStoolIcon(this, 140, 0, 1.5).setAngle(10);

    const yakText = this.add.text(0, 0, 'THE YAK', {
        fontFamily: 'Arial Black',
        fontSize: '72px',
        color: YAK_COLORS.textOrange,
        stroke: '#000000',
        strokeThickness: 10,
        shadow: { offsetX: 5, offsetY: 5, color: '#000', blur: 0, fill: true }
    }).setOrigin(0.5);

    const gauntletText = this.add.text(0, 60, 'GAUNTLET', {
        fontFamily: 'Arial Black',
        fontSize: '36px',
        color: YAK_COLORS.textGold,
        stroke: '#000000',
        strokeThickness: 7,
        shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 0, fill: true }
    }).setOrigin(0.5);

    this.logoContainer.add([leftStool, rightStool, yakText, gauntletText]);

    // Glitch Animation
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

    const base = this.add.circle(0, 10, 68, YAK_COLORS.stoolDark).setStrokeStyle(4, 0x000);
    const btn = this.add.circle(0, 0, 62, YAK_COLORS.primary).setStrokeStyle(4, YAK_COLORS.primaryDark);
    const glow = this.add.circle(0, 0, 72, YAK_COLORS.primaryBright, 0.3);

    const text = this.add.text(0, 0, 'easy', {
        fontFamily: 'Arial Black',
        fontSize: '40px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5).setPadding(0, 5, 0, 0);

    this.easyButton = this.add.container(GAME_WIDTH/2, y, [glow, base, btn, text]);
    const hitArea = this.add.circle(GAME_WIDTH/2, y, 75).setInteractive({ useHandCursor: true });

    this.tweens.add({
        targets: this.easyButton,
        y: y - 10,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    this.tweens.add({
        targets: glow,
        scale: 1.15,
        alpha: 0.1,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    const prompt = this.add.text(GAME_WIDTH/2, y + 95, 'PRESS TO START', {
        fontFamily: YAK_FONTS.title,
        fontSize: '22px',
        color: YAK_COLORS.textGold,
        stroke: '#000000',
        strokeThickness: 5
    }).setOrigin(0.5);

    this.tweens.add({
        targets: prompt,
        scale: 1.05,
        duration: 800,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
    });

    hitArea.on('pointerdown', () => {
        if (this.isTransitioning) return;
        this.isTransitioning = true;
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
    const y = GAME_HEIGHT * 0.55;
    const spacing = 75;
    const startX = GAME_WIDTH/2 - ((STATIONS.length-1) * spacing) / 2;

    const title = this.add.text(GAME_WIDTH/2, y - 50, '7 CHALLENGES', {
        fontFamily: YAK_FONTS.title,
        fontSize: '24px',
        color: YAK_COLORS.textGold,
        stroke: '#000000',
        strokeThickness: 4
    }).setOrigin(0.5);

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
        const glow = this.add.circle(x, y, 20, s.color, 0.3);
        const iconBg = this.add.circle(x, y, 16, s.color, 1).setStrokeStyle(3, 0xffffff, 0.9);
        const emoji = this.add.text(x, y, s.emoji, { fontSize: '22px' }).setOrigin(0.5);

        this.tweens.add({
            targets: [glow, iconBg, emoji],
            y: y - 5,
            duration: 800 + (i * 100),
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

    const bg = this.add.rectangle(GAME_WIDTH/2, y, GAME_WIDTH, barHeight, YAK_COLORS.bgDark).setDepth(90);
    const border = this.add.rectangle(GAME_WIDTH/2, y - barHeight/2, GAME_WIDTH, 3, YAK_COLORS.primary).setDepth(91);

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

    const textContent = headlines.join("   ///   ") + "   ///   ";

    this.tickerText = this.add.text(GAME_WIDTH, y, textContent, {
        fontFamily: YAK_FONTS.mono,
        fontSize: '20px',
        color: YAK_COLORS.textGold,
        fontStyle: 'bold',
        padding: { top: 12, bottom: 12 }
    }).setOrigin(0, 0.5).setDepth(92);
  }

  private startGraffitiLoop(): void {
    const words = ["10X", "WET", "TANK", "VIBES", "DRAIN", "CHEAH", "SCOOF", "PUKE"];
    const colors = [YAK_COLORS.textOrange, YAK_COLORS.textGold, YAK_COLORS.textGreen, YAK_COLORS.textRed, '#1e88e5', '#8e24aa'];

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
                alpha: 0.4,
                scale: 1.5,
                duration: 1000,
                yoyo: true,
                onComplete: () => g.destroy()
            });
        }
    });
  }

  private startGame(): void {
    this.cameras.main.flash(800, 255, 255, 255); 
    this.time.delayedCall(500, () => {
        this.scene.start('RunScene', { isRestart: true });
    });
  }

  // =================================================================================================
  //  ASSET GENERATION
  // =================================================================================================

  private createLoadingUI(): void {
    const bg = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, 200, 10, 0x333333);
    const bar = this.add.rectangle(GAME_WIDTH/2 - 100, GAME_HEIGHT/2, 0, 10, 0xe74c3c).setOrigin(0, 0.5);
    this.load.on('progress', (val: number) => { bar.width = 200 * val; });
    this.load.on('complete', () => { bg.destroy(); bar.destroy(); });
  }

  private generateGameTextures(): void {
    // Basketball
    const b = this.make.graphics({x:0,y:0}); b.fillStyle(0xe67e22); b.fillCircle(25,25,25); 
    b.lineStyle(2, 0x000000); b.strokeCircle(25,25,25);
    b.generateTexture('basketball',50,50); b.destroy();

    // Soccer
    const s = this.make.graphics({x:0,y:0}); s.fillStyle(0xffffff); s.fillCircle(22,22,22); 
    s.fillStyle(0x000000); s.fillCircle(22,22,8); 
    s.generateTexture('soccerball',44,44); s.destroy();

    // Wiffle
    const w = this.make.graphics({x:0,y:0}); w.fillStyle(0xffffff); w.fillCircle(18,18,18);
    w.fillStyle(0xdddddd); w.fillCircle(18,18,6);
    w.generateTexture('wiffleball',36,36); w.destroy();

    // Beanbag
    const bb = this.make.graphics({x:0,y:0}); bb.fillStyle(0xc0392b); bb.fillRoundedRect(0,0,32,32,8); 
    bb.generateTexture('beanbag',32,32); bb.destroy();

    // Football (NEW)
    const fb = this.make.graphics({x:0,y:0});
    fb.fillStyle(0x5d4037); // Brown leather
    fb.fillEllipse(30, 20, 60, 36);
    fb.lineStyle(2, 0xffffff);
    fb.lineBetween(10, 20, 50, 20); // Laces
    fb.lineBetween(15, 15, 15, 25);
    fb.lineBetween(25, 15, 25, 25);
    fb.lineBetween(35, 15, 35, 25);
    fb.lineBetween(45, 15, 45, 25);
    fb.generateTexture('football', 60, 40);
    fb.destroy();
  }

  private generateYakTextures(): void {
    // Wet Wheel
    const size = 256;
    const wheel = this.make.graphics({x:0,y:0});
    const colors = [
        YAK_COLORS.vibrantRed, YAK_COLORS.vibrantOrange, YAK_COLORS.vibrantYellow,
        YAK_COLORS.vibrantGreen, YAK_COLORS.vibrantBlue, YAK_COLORS.vibrantPurple
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
  }

  private generatePixelCrew(): void {
    const colors = [0x3498db, 0x8e44ad, 0xe67e22, 0x2ecc71, 0x7f8c8d, 0xc0392b];
    
    colors.forEach((color, i) => {
        const g = this.make.graphics({x:0,y:0});
        g.fillStyle(0xffdbac); g.fillRect(4,4,56,56);
        g.fillStyle(0x3e2723); g.fillRect(4,0,56,16);
        g.fillRect(0,4,8,24); g.fillRect(56,4,8,24); 
        g.fillStyle(color); g.fillRect(4,52,56,12);
        g.fillStyle(0x000000);
        if(i === 0) { 
            g.fillRect(12, 24, 16, 12); g.fillRect(36, 24, 16, 12); g.fillRect(28, 28, 8, 4); 
        } else { 
            g.fillRect(16, 28, 8, 8); g.fillRect(40, 28, 8, 8); 
        }
        g.generateTexture(`crew_${i}`, 64, 64);
        g.destroy();
    });
  }
}