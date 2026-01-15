import Phaser from 'phaser';
import { GameStateService } from '../services/GameStateService';
import { getRandomQuestion, type QuizQuestion } from '../data/quizQuestions';
import { AudioSystem } from '../utils/AudioSystem';

// DESIGN SYSTEM - Premium 2026 Indie SaaS Aesthetic
const DS = {
  // Typography
  FONT: {
    DISPLAY: 'bold 48px Arial, sans-serif',  // Syne replacement (needs web font loading)
    DATA: '18px "Courier New", monospace',   // Space Mono replacement
    BUTTON: '600 20px Arial, sans-serif',    // DM Sans replacement
    TIMER: 'bold 24px "Courier New", monospace',
  },

  // Colors - High contrast, moody palette
  COLOR: {
    BG_BASE: 0x0A0E14,
    BG_ELEVATED: 0x14181F,
    BG_PANEL: 0x1A1F2B,

    YAK_PRIMARY: 0xFF6B35,
    YAK_GOLD: 0xFFD700,

    CORRECT_NEON: 0x00FF9D,
    ERROR_NEON: 0xFF0066,
    INFO_CYAN: 0x00D9FF,

    NEUTRAL_900: 0x0F1419,
    NEUTRAL_800: 0x1C2128,
    NEUTRAL_700: 0x2D333B,
    NEUTRAL_600: 0x444C56,
    NEUTRAL_500: 0x636E7B,
    NEUTRAL_300: 0xB1BAC4,

    TEXT_PRIMARY: '#FFFFFF',
    TEXT_SECONDARY: '#B1BAC4',
    TEXT_MUTED: '#636E7B',
  },

  // Spacing
  SPACE: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
  },

  // Motion
  DURATION: {
    INSTANT: 100,
    FAST: 200,
    NORMAL: 300,
  },
};

interface AnswerButton {
  container: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.Graphics;
  text: Phaser.GameObjects.Text;
  hitArea: Phaser.GameObjects.Rectangle;
  option: string;
  isCorrect: boolean;
  isSelected: boolean;
}

export class QuizScene extends Phaser.Scene {
  private question!: QuizQuestion;
  private buttons: AnswerButton[] = [];
  private correctAnswersFound = 0;
  private isInputLocked = false;
  
  // UI Elements
  private questionText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;
  private timerContainer!: Phaser.GameObjects.Container;
  
  // Layout values
  private get width() { return this.scale.width; }
  private get height() { return this.scale.height; }

  constructor() {
    super({ key: 'QuizScene' });
  }

  create(): void {
    // Initialize audio
    AudioSystem.init();

    // Get fresh question
    this.question = getRandomQuestion();

    // Ensure we have exactly 12 options (Sporcle-style grid)
    const allOptions = [...this.question.options];
    while (allOptions.length < 12) {
      allOptions.push(`Option ${allOptions.length + 1}`);
    }
    // Shuffle and take first 12
    this.question.options = allOptions.sort(() => Math.random() - 0.5).slice(0, 12);

    this.correctAnswersFound = 0;
    this.isInputLocked = false;
    this.buttons = [];

    // 1. Build The Visual Layers
    this.createBackground();
    this.createHeader();
    this.createQuestionDisplay();
    this.createAnswerGrid(); // Now fully responsive
    this.createProgressDisplay();

    // 2. Resume Timer
    GameStateService.startTimer();

    // Entrance effects
    this.cameras.main.fadeIn(400, 0, 0, 0);
    AudioSystem.playBeep(1.4);

    // 3. Handle Resize Events
    this.scale.on('resize', this.handleResize, this);
  }

  // --- VISUALS & LAYOUT (Design System Implementation) ---

  private createBackground(): void {
    // Layer 1: Deep charcoal base
    this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, DS.COLOR.BG_BASE).setDepth(0);

    // Layer 2: Noise texture simulation (particles)
    const noise = this.add.graphics();
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const size = Math.random() * 1.5;
      noise.fillStyle(0xFFFFFF, 0.03);
      noise.fillCircle(x, y, size);
    }
    noise.setDepth(1);

    // Layer 3: YAK_PRIMARY glow (simulated with circles)
    const glow = this.add.graphics();
    const glowCenterX = this.width * 0.2;
    const glowCenterY = this.height * 0.2;
    const glowRadius = this.width * 0.5;

    // Create concentric circles with decreasing alpha for gradient effect
    for (let i = 0; i < 5; i++) {
      const radius = glowRadius * (1 - i * 0.2);
      const alpha = 0.02 * (1 - i * 0.2);
      glow.fillStyle(DS.COLOR.YAK_PRIMARY, alpha);
      glow.fillCircle(glowCenterX, glowCenterY, radius);
    }
    glow.setDepth(2);

    // Layer 4: Grid pattern (40px spacing)
    const grid = this.add.graphics();
    grid.lineStyle(1, DS.COLOR.NEUTRAL_900, 0.8);
    for (let x = 0; x < this.width; x += 40) {
      grid.moveTo(x, 0);
      grid.lineTo(x, this.height);
    }
    for (let y = 0; y < this.height; y += 40) {
      grid.moveTo(0, y);
      grid.lineTo(this.width, y);
    }
    grid.strokePath();
    grid.setDepth(3);

    // Layer 5: Vignette (dark edges using rectangles)
    const vignetteThickness = Math.min(this.width, this.height) * 0.15;
    const vignette = this.add.graphics();

    // Top edge
    vignette.fillStyle(0x000000, 0.5);
    vignette.fillRect(0, 0, this.width, vignetteThickness);

    // Bottom edge
    vignette.fillRect(0, this.height - vignetteThickness, this.width, vignetteThickness);

    // Left edge
    vignette.fillRect(0, 0, vignetteThickness, this.height);

    // Right edge
    vignette.fillRect(this.width - vignetteThickness, 0, vignetteThickness, this.height);

    vignette.setDepth(4);
  }

  private createHeader(): void {
    // Timer (Top-right, monospace, cyan)
    this.timerContainer = this.add.container(this.width - DS.SPACE.lg, DS.SPACE.lg);

    this.timerText = this.add.text(0, 0, '00:00.00', {
      font: DS.FONT.TIMER,
      color: '#00D9FF', // INFO_CYAN
    }).setOrigin(1, 0);

    this.timerContainer.add(this.timerText);
    this.timerContainer.setDepth(100);

    // Subtle pulse on timer
    this.tweens.add({
      targets: this.timerText,
      alpha: 0.7,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private createQuestionDisplay(): void {
    // Asymmetric left-aligned question (editorial style)
    const xPos = DS.SPACE['2xl'];
    const yPos = this.height * 0.18;
    const maxWidth = this.width - (DS.SPACE['2xl'] * 2);

    // Question text - bold, large, YAK_GOLD gradient overlay effect
    this.questionText = this.add.text(xPos, yPos, this.question.question, {
      font: DS.FONT.DISPLAY,
      color: DS.COLOR.TEXT_PRIMARY,
      align: 'left',
      wordWrap: { width: maxWidth }
    }).setOrigin(0, 0);

    // Add YAK_GOLD glow effect
    this.questionText.setShadow(0, 0, '#FFD700', 10, false, true);

    // Instruction - monospace, small, cyan
    const instructionY = this.questionText.y + this.questionText.height + DS.SPACE.lg;
    this.add.text(xPos, instructionY, `>> FIND ${this.question.correct.length} ANSWERS IN THE GRID`, {
      font: DS.FONT.DATA,
      color: '#00D9FF', // INFO_CYAN
    }).setOrigin(0, 0).setAlpha(0.8);
  }

  private createAnswerGrid(): void {
    // Grid: 4 columns × 3 rows (desktop), 3 × 4 (mobile)
    const isDesktop = this.width > 600;
    const columns = isDesktop ? 4 : 3;
    const rows = isDesktop ? 3 : 4;

    // Calculate dimensions with design system spacing
    const gridY = this.height * 0.42;
    const horizontalGap = 12;
    const verticalGap = DS.SPACE.md;
    const totalWidth = Math.min(this.width * 0.9, 900);
    const btnWidth = (totalWidth - (horizontalGap * (columns - 1))) / columns;
    const btnHeight = Math.max(70, Math.min(90, this.height * 0.12));

    const startX = (this.width - totalWidth) / 2;

    // Shuffle options (Sporcle style - find answers in random order)
    const shuffledOptions = [...this.question.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach((option, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);

      // Slight random offset for "controlled chaos" feel
      const randomOffset = {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4
      };

      const x = startX + col * (btnWidth + horizontalGap) + randomOffset.x;
      const y = gridY + row * (btnHeight + verticalGap) + randomOffset.y;

      this.createButton(x, y, btnWidth, btnHeight, option);
    });
  }

  private createButton(x: number, y: number, w: number, h: number, option: string): void {
    const isCorrect = this.question.correct.includes(option);
    
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    
    // Draw initial state
    this.drawButtonShape(bg, w, h, 'default');

    // Text (Design system typography)
    const text = this.add.text(w/2, h/2, option, {
      font: DS.FONT.BUTTON,
      color: DS.COLOR.TEXT_SECONDARY,
      align: 'center',
      wordWrap: { width: w - DS.SPACE.md }
    }).setOrigin(0.5);

    // Hit Area (Invisible interactive rect)
    const hitArea = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

    container.add([bg, text, hitArea]);

    const button: AnswerButton = { container, bg, text, hitArea, option, isCorrect, isSelected: false };
    
    // --- INTERACTIONS ---
    
    hitArea.on('pointerover', () => {
        if (!button.isSelected && !this.isInputLocked) {
            this.tweens.add({ targets: container, scale: 1.02, duration: 100 });
            this.drawButtonShape(bg, w, h, 'hover');
        }
    });

    hitArea.on('pointerout', () => {
        if (!button.isSelected && !this.isInputLocked) {
            this.tweens.add({ targets: container, scale: 1, duration: 100 });
            this.drawButtonShape(bg, w, h, 'default');
        }
    });

    hitArea.on('pointerdown', () => {
        this.handleSelection(button, w, h);
    });

    this.buttons.push(button);
  }

  private drawButtonShape(g: Phaser.GameObjects.Graphics, w: number, h: number, state: string) {
    g.clear();

    // Design system button states
    let fillColor = DS.COLOR.NEUTRAL_800;
    let strokeColor = DS.COLOR.NEUTRAL_600;
    let strokeWidth = 2;
    let glowColor = null;

    if (state === 'hover') {
      fillColor = DS.COLOR.NEUTRAL_700;
      strokeColor = DS.COLOR.YAK_PRIMARY;
      glowColor = { color: 0xFF6B35, alpha: 0.3, size: 20 };
    } else if (state === 'correct') {
      fillColor = 0x001A0D; // Dark green bg
      strokeColor = DS.COLOR.CORRECT_NEON;
      strokeWidth = 3;
      glowColor = { color: 0x00FF9D, alpha: 0.4, size: 30 };
    } else if (state === 'incorrect') {
      fillColor = 0x1A0008; // Dark red bg
      strokeColor = DS.COLOR.ERROR_NEON;
      strokeWidth = 3;
      glowColor = { color: 0xFF0066, alpha: 0.5, size: 25 };
    }

    // Fill
    g.fillStyle(fillColor, 1);
    g.fillRoundedRect(0, 0, w, h, 6); // Less rounded = more modern

    // Stroke
    g.lineStyle(strokeWidth, strokeColor, 1);
    g.strokeRoundedRect(0, 0, w, h, 6);

    // Glow effect (simulated with additional stroke)
    if (glowColor) {
      g.lineStyle(1, glowColor.color, glowColor.alpha);
      g.strokeRoundedRect(-2, -2, w + 4, h + 4, 8);
    }
  }

  // --- LOGIC ---

  private handleSelection(btn: AnswerButton, w: number, h: number): void {
    if (this.isInputLocked || btn.isSelected) return;

    btn.isSelected = true;

    // Audio - click sound
    AudioSystem.playClick();

    if (btn.isCorrect) {
        // CORRECT
        // Audio - correct beep
        this.time.delayedCall(50, () => AudioSystem.playBeep(1.2));
        this.drawButtonShape(btn.bg, w, h, 'correct');
        btn.text.setColor(DS.COLOR.TEXT_PRIMARY);
        this.correctAnswersFound++;

        // Pop effect
        this.tweens.add({
            targets: btn.container,
            scale: 1.1,
            yoyo: true,
            duration: 150
        });

        // Flash green
        this.cameras.main.flash(150, 0, 100, 0);

        this.updateProgress();

        if (this.correctAnswersFound === this.question.correct.length) {
            this.handleWin();
        }
    } else {
        // INCORRECT
        // Audio - fail sound
        AudioSystem.playFail();

        this.drawButtonShape(btn.bg, w, h, 'incorrect');
        btn.text.setColor(DS.COLOR.TEXT_PRIMARY);
        this.isInputLocked = true;

        // Shake effect
        this.cameras.main.shake(200, 0.01);

        // Show Penalty
        this.showPenaltyToast();

        // Unlock after delay
        this.time.delayedCall(500, () => {
            this.isInputLocked = false;
            // Reset button
            this.drawButtonShape(btn.bg, w, h, 'default');
            btn.text.setColor(DS.COLOR.TEXT_SECONDARY);
            btn.isSelected = false;
        });
    }
  }

  private createProgressDisplay(): void {
    this.progressText = this.add.text(this.width / 2, this.height - 40, '', {
        font: DS.FONT.DATA,
        color: DS.COLOR.TEXT_MUTED
    }).setOrigin(0.5);
    this.updateProgress();
  }

  private updateProgress(): void {
    const current = this.correctAnswersFound;
    const total = this.question.correct.length;
    this.progressText.setText(`FOUND: ${current} / ${total}`);

    if (current > 0) this.progressText.setColor('#00FF9D'); // CORRECT_NEON
  }

  private showPenaltyToast(): void {
    const toast = this.add.container(this.width/2, this.height - 100);
    const bg = this.add.rectangle(0, 0, 200, 40, DS.COLOR.ERROR_NEON).setOrigin(0.5);
    const txt = this.add.text(0, 0, "LOCKED (0.5s)", {
        font: DS.FONT.DATA,
        color: DS.COLOR.TEXT_PRIMARY
    }).setOrigin(0.5);

    toast.add([bg, txt]);
    toast.setAlpha(0);
    toast.y += 20;

    this.tweens.add({
        targets: toast,
        alpha: 1,
        y: this.height - 120,
        duration: DS.DURATION.FAST,
        yoyo: true,
        hold: 300,
        onComplete: () => toast.destroy()
    });
  }

  private handleWin(): void {
    GameStateService.completeRun();

    // Audio
    AudioSystem.playSuccess();
    this.time.delayedCall(100, () => AudioSystem.playCrowdCheer());

    // Big Success Text (Design system)
    const winText = this.add.text(this.width/2, this.height/2, "RUN COMPLETE!", {
        font: DS.FONT.DISPLAY,
        color: '#00FF9D', // CORRECT_NEON
        stroke: '#000',
        strokeThickness: 8
    }).setOrigin(0.5).setScale(0);

    // Add glow effect
    winText.setShadow(0, 0, '#00FF9D', 20, false, true);

    this.tweens.add({
        targets: winText,
        scale: 1,
        duration: 500,
        ease: 'Back.out'
    });

    this.time.delayedCall(1500, () => {
        AudioSystem.playWhoosh();
        this.scene.start('ResultScene');
    });
  }

  update(): void {
    const timeMs = GameStateService.getCurrentTimeMs();
    const min = Math.floor(timeMs / 60000);
    const sec = Math.floor((timeMs % 60000) / 1000);
    const ms = Math.floor((timeMs % 1000) / 10);
    
    this.timerText.setText(`${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`);

    // Red pulse if over 45s (approaching WET)
    if (timeMs > 45000) {
        this.timerText.setColor('#FF0066'); // ERROR_NEON
        this.timerContainer.scale = 1 + Math.sin(this.time.now / 100) * 0.05;
    }
  }

  handleResize(_gameSize: Phaser.Structs.Size): void {
     // Simple reload to recalculate grid layout
     // In a complex app we'd reposition everything, but for this quiz, a quick restart is seamless enough
     this.scene.restart();
  }

  shutdown(): void {
    // Clean up event handlers
    this.events.removeAllListeners('update');
    this.input.removeAllListeners();
    this.scale.off('resize', this.handleResize, this);
    // Clean up tweens
    this.tweens.killAll();
    // Clean up timers
    this.time.removeAllEvents();
  }
}