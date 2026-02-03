import Phaser from 'phaser';
import { GameStateService } from '../services/GameStateService';
import { getRandomQuestion, type QuizQuestion } from '../data/quizQuestions';
import { AudioSystem } from '../utils/AudioSystem';
import { buttonPress, popIn, objectShake, wobble } from '../utils/JuiceFactory';
import { colorFlash, zoomPunch } from '../utils/ScreenEffects';
import { createStarBurst, createMegaConfetti } from '../utils/VisualEffects';

// CLEAN DESIGN SYSTEM - High contrast, no visual noise
const QUIZ_THEME = {
  // Simple, high-contrast colors
  BG: 0x1a1a1a,              // Solid dark
  CARD_BG: 0x2a2a2a,         // Slightly lighter for buttons
  CARD_BORDER: 0x444444,     // Subtle border

  CORRECT: 0x22c55e,         // Clean green
  INCORRECT: 0xef4444,       // Clean red
  HIGHLIGHT: 0xffc107,       // Yak gold for emphasis

  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#aaaaaa',
  TEXT_MUTED: '#666666',

  // Typography
  FONT_QUESTION: 'bold 32px Arial, sans-serif',
  FONT_BUTTON: '600 18px Arial, sans-serif',
  FONT_TIMER: 'bold 28px "Courier New", monospace',
  FONT_PROGRESS: '16px "Courier New", monospace',
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

    // Ensure we have exactly 12 options
    const allOptions = [...this.question.options];
    // Shuffle and take first 12
    this.question.options = allOptions.sort(() => Math.random() - 0.5).slice(0, 12);

    this.correctAnswersFound = 0;
    this.isInputLocked = false;
    this.buttons = [];

    // Build clean UI
    this.createBackground();
    this.createTimer();
    this.createQuestionDisplay();
    this.createAnswerGrid();
    this.createProgressDisplay();

    // Resume Timer
    GameStateService.startTimer();

    // Entrance effects
    this.cameras.main.fadeIn(300, 0, 0, 0);
    AudioSystem.playBeep(1.4);

    // Handle Resize Events
    this.scale.on('resize', this.handleResize, this);
  }

  // --- CLEAN BACKGROUND ---
  private createBackground(): void {
    // Solid dark background - no noise, no grid, no vignette
    this.add.rectangle(this.width / 2, this.height / 2, this.width, this.height, QUIZ_THEME.BG).setDepth(0);
  }

  // --- TIMER (Top Right) ---
  private createTimer(): void {
    this.timerText = this.add.text(this.width - 24, 24, '00:00.00', {
      font: QUIZ_THEME.FONT_TIMER,
      color: QUIZ_THEME.TEXT_PRIMARY,
    }).setOrigin(1, 0).setDepth(100);
  }

  // --- QUESTION DISPLAY ---
  private createQuestionDisplay(): void {
    const xPos = 24;
    const yPos = 80;
    const maxWidth = this.width - 48;

    // Question text - clean, readable
    this.questionText = this.add.text(xPos, yPos, this.question.question, {
      font: QUIZ_THEME.FONT_QUESTION,
      color: QUIZ_THEME.TEXT_PRIMARY,
      align: 'left',
      wordWrap: { width: maxWidth }
    }).setOrigin(0, 0).setDepth(10);

    // Instruction text below question
    const instructionY = this.questionText.y + this.questionText.height + 16;
    this.add.text(xPos, instructionY, `Find ${this.question.correct.length} correct answers`, {
      font: QUIZ_THEME.FONT_PROGRESS,
      color: QUIZ_THEME.TEXT_SECONDARY,
    }).setOrigin(0, 0).setDepth(10);
  }

  // --- ANSWER GRID ---
  private createAnswerGrid(): void {
    // Grid: 4 columns × 3 rows (desktop), 3 × 4 (mobile)
    const isDesktop = this.width > 600;
    const columns = isDesktop ? 4 : 3;

    // Calculate dimensions
    const gridY = this.height * 0.38;
    const horizontalGap = 12;
    const verticalGap = 12;
    const totalWidth = Math.min(this.width - 48, 900);
    const btnWidth = (totalWidth - (horizontalGap * (columns - 1))) / columns;
    const btnHeight = Math.max(60, Math.min(80, this.height * 0.10));

    const startX = (this.width - totalWidth) / 2;

    // Shuffle options
    const shuffledOptions = [...this.question.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach((option, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);

      // NO random offset - clean alignment
      const x = startX + col * (btnWidth + horizontalGap);
      const y = gridY + row * (btnHeight + verticalGap);

      this.createButton(x, y, btnWidth, btnHeight, option, index);
    });
  }

  private createButton(x: number, y: number, w: number, h: number, option: string, index: number = 0): void {
    const isCorrect = this.question.correct.includes(option);

    const container = this.add.container(x, y).setDepth(20);
    const bg = this.add.graphics();

    // Pop-in animation with staggered delay
    container.setScale(0);
    container.setAlpha(0);
    popIn(this, container, { duration: 250, delay: index * 40 });

    // Draw initial state - clean flat button
    this.drawButton(bg, w, h, 'default');

    // Text - clean, centered
    const text = this.add.text(w/2, h/2, option, {
      font: QUIZ_THEME.FONT_BUTTON,
      color: QUIZ_THEME.TEXT_PRIMARY,
      align: 'center',
      wordWrap: { width: w - 16 }
    }).setOrigin(0.5);

    // Hit Area
    const hitArea = this.add.rectangle(w/2, h/2, w, h, 0x000000, 0)
        .setInteractive({ useHandCursor: true });

    container.add([bg, text, hitArea]);

    const button: AnswerButton = { container, bg, text, hitArea, option, isCorrect, isSelected: false };

    // --- INTERACTIONS ---
    hitArea.on('pointerover', () => {
      if (!button.isSelected && !this.isInputLocked) {
        this.drawButton(bg, w, h, 'hover');
      }
    });

    hitArea.on('pointerout', () => {
      if (!button.isSelected && !this.isInputLocked) {
        this.drawButton(bg, w, h, 'default');
      }
    });

    hitArea.on('pointerdown', () => {
      this.handleSelection(button, w, h);
    });

    this.buttons.push(button);
  }

  private drawButton(g: Phaser.GameObjects.Graphics, w: number, h: number, state: string): void {
    g.clear();

    let fillColor = QUIZ_THEME.CARD_BG;
    let strokeColor = QUIZ_THEME.CARD_BORDER;
    let strokeWidth = 2;

    if (state === 'hover') {
      fillColor = 0x3a3a3a;
      strokeColor = QUIZ_THEME.HIGHLIGHT;
    } else if (state === 'correct') {
      fillColor = 0x1a3d1a;
      strokeColor = QUIZ_THEME.CORRECT;
      strokeWidth = 3;
    } else if (state === 'incorrect') {
      fillColor = 0x3d1a1a;
      strokeColor = QUIZ_THEME.INCORRECT;
      strokeWidth = 3;
    }

    // Fill
    g.fillStyle(fillColor, 1);
    g.fillRoundedRect(0, 0, w, h, 8);

    // Stroke
    g.lineStyle(strokeWidth, strokeColor, 1);
    g.strokeRoundedRect(0, 0, w, h, 8);
  }

  // --- SELECTION LOGIC ---
  private handleSelection(btn: AnswerButton, w: number, h: number): void {
    if (this.isInputLocked || btn.isSelected) return;

    btn.isSelected = true;
    AudioSystem.playClick();

    if (btn.isCorrect) {
      // CORRECT - Use juicy button press
      buttonPress(this, btn.container, () => {
        AudioSystem.playBeep(1.2);
      }, { intensity: 0.8 });

      this.drawButton(btn.bg, w, h, 'correct');
      btn.text.setColor('#22c55e');
      this.correctAnswersFound++;

      // Enhanced green flash
      colorFlash(this, QUIZ_THEME.CORRECT, 'solid', { intensity: 0.3, duration: 150 });
      zoomPunch(this, 1.02, 100);

      // Star burst on correct answer
      createStarBurst(this, btn.container.x + w / 2, btn.container.y + h / 2, {
        points: 6,
        colors: [QUIZ_THEME.CORRECT, 0xffffff],
        outerRadius: 60,
        duration: 400
      });

      this.updateProgress();

      if (this.correctAnswersFound === this.question.correct.length) {
        this.handleWin();
      }
    } else {
      // INCORRECT - Use wobble and shake
      wobble(this, btn.container, 1.5, 200);
      objectShake(this, btn.container, 1.2, 250);

      AudioSystem.playFail();
      this.drawButton(btn.bg, w, h, 'incorrect');
      btn.text.setColor('#ef4444');
      this.isInputLocked = true;

      // Enhanced screen shake and red flash
      this.cameras.main.shake(150, 0.012);
      colorFlash(this, QUIZ_THEME.INCORRECT, 'edges', { intensity: 0.3, duration: 150 });

      // Show penalty toast
      this.showPenaltyToast();

      // Reset after delay
      this.time.delayedCall(500, () => {
        this.isInputLocked = false;
        this.drawButton(btn.bg, w, h, 'default');
        btn.text.setColor(QUIZ_THEME.TEXT_PRIMARY);
        btn.isSelected = false;
      });
    }
  }

  // --- PROGRESS DISPLAY ---
  private createProgressDisplay(): void {
    this.progressText = this.add.text(this.width / 2, this.height - 50, '', {
      font: QUIZ_THEME.FONT_PROGRESS,
      color: QUIZ_THEME.TEXT_MUTED
    }).setOrigin(0.5).setDepth(100);
    this.updateProgress();
  }

  private updateProgress(): void {
    const current = this.correctAnswersFound;
    const total = this.question.correct.length;
    this.progressText.setText(`Found: ${current} / ${total}`);

    if (current > 0) {
      this.progressText.setColor('#22c55e');
    }
  }

  // --- PENALTY TOAST ---
  private showPenaltyToast(): void {
    const toast = this.add.container(this.width/2, this.height - 110).setDepth(200);
    const bg = this.add.rectangle(0, 0, 160, 36, QUIZ_THEME.INCORRECT, 0.9).setOrigin(0.5);
    bg.setStrokeStyle(2, 0xffffff, 0.3);
    const txt = this.add.text(0, 0, "WRONG! (0.5s)", {
      font: '600 14px Arial, sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5);

    toast.add([bg, txt]);
    toast.setAlpha(0);
    toast.y += 20;

    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: this.height - 130,
      duration: 150,
      yoyo: true,
      hold: 300,
      onComplete: () => toast.destroy()
    });
  }

  // --- WIN HANDLER ---
  private handleWin(): void {
    GameStateService.completeRun();

    AudioSystem.playSuccess();
    this.time.delayedCall(100, () => AudioSystem.playCrowdCheer());

    // Enhanced screen effects
    colorFlash(this, QUIZ_THEME.CORRECT, 'radial', { intensity: 0.6, duration: 400 });
    zoomPunch(this, 1.06, 200);

    // Mega confetti celebration
    createMegaConfetti(this, this.width / 2, this.height / 2, {
      count: 80,
      includeStars: true,
      includeRibbons: true,
      gravity: true,
      spin: true,
      spread: 400
    });

    // Success text with pop-in
    const winText = this.add.text(this.width/2, this.height/2, "QUIZ COMPLETE!", {
      font: 'bold 56px Arial, sans-serif',
      color: '#22c55e',
      stroke: '#000',
      strokeThickness: 8
    }).setOrigin(0.5).setDepth(300).setAlpha(0);

    popIn(this, winText, { duration: 400, targetScale: 1 });

    // Rainbow shimmer on text
    const colors = ['#22c55e', '#fbbf24', '#60a5fa', '#f472b6', '#22c55e'];
    let colorIndex = 0;
    const shimmerTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        colorIndex = (colorIndex + 1) % colors.length;
        winText.setColor(colors[colorIndex]);
      },
      repeat: 15
    });

    this.time.delayedCall(1500, () => {
      shimmerTimer.remove();
      AudioSystem.playWhoosh();
      this.scene.start('ResultScene');
    });
  }

  // --- UPDATE LOOP ---
  update(): void {
    const timeMs = GameStateService.getCurrentTimeMs();
    const min = Math.floor(timeMs / 60000);
    const sec = Math.floor((timeMs % 60000) / 1000);
    const ms = Math.floor((timeMs % 1000) / 10);

    this.timerText.setText(`${min.toString().padStart(2,'0')}:${sec.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`);

    // Time warning colors (matching new thresholds)
    if (timeMs >= 73000) {
      this.timerText.setColor('#ff3333');
      // Aggressive pulse
      this.timerText.setScale(1 + Math.sin(this.time.now / 80) * 0.08);
    } else if (timeMs >= 70000) {
      this.timerText.setColor('#ff6600');
      // Subtle pulse
      this.timerText.setScale(1 + Math.sin(this.time.now / 150) * 0.04);
    } else if (timeMs >= 60000) {
      this.timerText.setColor('#ffcc00');
      this.timerText.setScale(1);
    } else {
      this.timerText.setColor('#ffffff');
      this.timerText.setScale(1);
    }
  }

  handleResize(_gameSize: Phaser.Structs.Size): void {
    // Simple reload to recalculate grid layout
    this.scene.restart();
  }

  shutdown(): void {
    this.events.removeAllListeners('update');
    this.input.removeAllListeners();
    this.scale.off('resize', this.handleResize, this);
    this.tweens.killAll();
    this.time.removeAllEvents();
  }
}
