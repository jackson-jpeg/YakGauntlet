import Phaser from 'phaser';
import { YAK_COLORS, YAK_FONTS } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { getRandomQuestion, type QuizQuestion } from '../data/quizQuestions';

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
    // Get fresh question
    this.question = getRandomQuestion();
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
    
    // 3. Handle Resize Events
    this.scale.on('resize', this.handleResize, this);
  }

  // --- VISUALS & LAYOUT ---

  private createBackground(): void {
    // Dark "Think Tank" Studio Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x020617, 0x020617, 1);
    bg.fillRect(0, 0, this.width, this.height);

    // Subtle "Brainstorm" Particles
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;
      const p = this.add.circle(x, y, Math.random() * 3 + 1, 0x334155, 0.2);
      
      this.tweens.add({
        targets: p,
        y: y - 50,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        yoyo: true
      });
    }
  }

  private createHeader(): void {
    const headerY = this.height * 0.08;

    // "FINAL CHALLENGE" Title
    this.add.text(this.width / 2, headerY, 'THE SPORCLE BOARD', {
      fontFamily: YAK_FONTS.title,
      fontSize: Math.min(32, this.width * 0.08) + 'px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, fill: true }
    }).setOrigin(0.5);

    // Timer Container
    this.timerContainer = this.add.container(this.width / 2, headerY + 45);
    
    // Timer BG
    const tBg = this.add.graphics();
    tBg.fillStyle(0x000000, 0.6);
    tBg.fillRoundedRect(-60, -15, 120, 30, 15);
    this.timerContainer.add(tBg);

    // Timer Text
    this.timerText = this.add.text(0, 0, '00:00.00', {
      fontFamily: 'Courier New',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.timerContainer.add(this.timerText);
  }

  private createQuestionDisplay(): void {
    const yPos = this.height * 0.22;
    const boxWidth = Math.min(this.width * 0.9, 800);
    const boxHeight = Math.max(100, this.height * 0.12);

    // Container Graphics
    const graphics = this.add.graphics();
    graphics.fillStyle(0x1e293b, 0.95);
    graphics.lineStyle(2, YAK_COLORS.primary, 0.8);
    
    graphics.fillRoundedRect((this.width - boxWidth)/2, yPos - boxHeight/2, boxWidth, boxHeight, 16);
    graphics.strokeRoundedRect((this.width - boxWidth)/2, yPos - boxHeight/2, boxWidth, boxHeight, 16);

    // Question Text
    this.questionText = this.add.text(this.width / 2, yPos - 10, this.question.question, {
      fontFamily: YAK_FONTS.title,
      fontSize: Math.min(24, this.width * 0.05) + 'px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: boxWidth - 40 }
    }).setOrigin(0.5);

    // Instruction Text
    this.add.text(this.width / 2, yPos + 35, `FIND ${this.question.correct.length} CORRECT ANSWERS`, {
      fontFamily: YAK_FONTS.body,
      fontSize: '14px',
      color: YAK_COLORS.textGold,
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5);
  }

  private createAnswerGrid(): void {
    // Determine Grid Layout based on Screen Width
    const isDesktop = this.width > 768;
    const columns = isDesktop ? 4 : 2; 
    
    // Calculate Dimensions
    const gridY = this.height * 0.35;
    const padding = 15;
    const totalWidth = Math.min(this.width * 0.95, 1000);
    const btnWidth = (totalWidth - (padding * (columns - 1))) / columns;
    const btnHeight = isDesktop ? 80 : 65;
    
    const startX = (this.width - totalWidth) / 2;

    // Shuffle & Create
    const shuffledOptions = [...this.question.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach((option, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      
      const x = startX + col * (btnWidth + padding);
      const y = gridY + row * (btnHeight + padding);

      this.createButton(x, y, btnWidth, btnHeight, option);
    });
  }

  private createButton(x: number, y: number, w: number, h: number, option: string): void {
    const isCorrect = this.question.correct.includes(option);
    
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    
    // Draw initial state
    this.drawButtonShape(bg, w, h, 'default');

    // Text
    const text = this.add.text(w/2, h/2, option, {
      fontFamily: YAK_FONTS.body,
      fontSize: w > 150 ? '16px' : '13px',
      color: '#e2e8f0',
      align: 'center',
      wordWrap: { width: w - 10 }
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
    let fill = 0x334155;
    let stroke = 0x475569;
    
    if (state === 'hover') { fill = 0x475569; stroke = YAK_COLORS.primary; }
    if (state === 'correct') { fill = 0x065f46; stroke = 0x10b981; }
    if (state === 'incorrect') { fill = 0x7f1d1d; stroke = 0xef4444; }

    g.fillStyle(fill, 1);
    g.fillRoundedRect(0, 0, w, h, 8);
    g.lineStyle(2, stroke, 1);
    g.strokeRoundedRect(0, 0, w, h, 8);
  }

  // --- LOGIC ---

  private handleSelection(btn: AnswerButton, w: number, h: number): void {
    if (this.isInputLocked || btn.isSelected) return;

    btn.isSelected = true;

    if (btn.isCorrect) {
        // CORRECT
        this.drawButtonShape(btn.bg, w, h, 'correct');
        btn.text.setColor('#ffffff');
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
        this.drawButtonShape(btn.bg, w, h, 'incorrect');
        btn.text.setColor('#ffaaaa');
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
            btn.text.setColor('#e2e8f0');
            btn.isSelected = false;
        });
    }
  }

  private createProgressDisplay(): void {
    this.progressText = this.add.text(this.width / 2, this.height - 40, '', {
        fontFamily: YAK_FONTS.mono,
        fontSize: '18px',
        color: '#94a3b8'
    }).setOrigin(0.5);
    this.updateProgress();
  }

  private updateProgress(): void {
    const current = this.correctAnswersFound;
    const total = this.question.correct.length;
    this.progressText.setText(`FOUND: ${current} / ${total}`);
    
    if (current > 0) this.progressText.setColor('#ffffff');
  }

  private showPenaltyToast(): void {
    const toast = this.add.container(this.width/2, this.height - 100);
    const bg = this.add.rectangle(0, 0, 200, 40, 0xef4444).setOrigin(0.5);
    const txt = this.add.text(0, 0, "LOCKED (0.5s)", { fontSize: '18px', fontStyle: 'bold' }).setOrigin(0.5);
    
    toast.add([bg, txt]);
    toast.setAlpha(0);
    toast.y += 20;

    this.tweens.add({
        targets: toast,
        alpha: 1,
        y: this.height - 120,
        duration: 200,
        yoyo: true,
        hold: 300,
        onComplete: () => toast.destroy()
    });
  }

  private handleWin(): void {
    GameStateService.completeRun();
    
    // Big Success Text
    const winText = this.add.text(this.width/2, this.height/2, "RUN COMPLETE!", {
        fontFamily: YAK_FONTS.title,
        fontSize: '48px',
        color: '#10b981',
        stroke: '#000',
        strokeThickness: 8
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
        targets: winText,
        scale: 1,
        duration: 500,
        ease: 'Back.out'
    });

    this.time.delayedCall(1500, () => {
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
        this.timerText.setColor('#ef4444');
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