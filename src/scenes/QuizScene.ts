import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { getRandomQuestion, type QuizQuestion } from '../data/quizQuestions';

interface AnswerButton {
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
  private questionText!: Phaser.GameObjects.Text;
  private progressText!: Phaser.GameObjects.Text;
  private timerText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'QuizScene' });
  }

  create(): void {
    // Get random question
    this.question = getRandomQuestion();
    this.correctAnswersFound = 0;
    this.isInputLocked = false;

    this.createBackground();
    this.createHeader();
    this.createQuestionDisplay();
    this.createAnswerGrid();
    this.createProgressDisplay();

    // Start/resume timer
    GameStateService.startTimer();
  }

  private createBackground(): void {
    // Gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x1e293b, 0x1e293b, 0x0f172a, 0x0f172a, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Decorative elements
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      this.add.circle(x, y, Math.random() * 3 + 1, 0x334155, 0.3);
    }

    // Brain icon particles
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const radius = 180;
      const x = GAME_WIDTH / 2 + Math.cos(angle) * radius;
      const y = 200 + Math.sin(angle) * radius;
      this.add.circle(x, y, 4, YAK_COLORS.primary, 0.2);
    }
  }

  private createHeader(): void {
    // Title
    const title = this.add.text(GAME_WIDTH / 2, 60, 'FINAL CHALLENGE', {
      fontFamily: YAK_FONTS.title,
      fontSize: '32px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Timer
    this.timerText = this.add.text(GAME_WIDTH / 2, 110, '00:00.00', {
      fontFamily: YAK_FONTS.mono,
      fontSize: '20px',
      color: '#cbd5e1',
    }).setOrigin(0.5);
  }

  private createQuestionDisplay(): void {
    const questionY = 180;

    // Question container
    const questionBg = this.add.graphics();
    questionBg.fillStyle(0x1e293b, 0.9);
    questionBg.fillRoundedRect(30, questionY - 40, GAME_WIDTH - 60, 100, 12);
    questionBg.lineStyle(3, YAK_COLORS.primary, 0.8);
    questionBg.strokeRoundedRect(30, questionY - 40, GAME_WIDTH - 60, 100, 12);

    // Question text
    this.questionText = this.add.text(GAME_WIDTH / 2, questionY, this.question.question, {
      fontFamily: YAK_FONTS.title,
      fontSize: '20px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: GAME_WIDTH - 100 }
    }).setOrigin(0.5);

    // Instruction
    this.add.text(GAME_WIDTH / 2, questionY + 50, `Select ${this.question.correct.length} answers`, {
      fontFamily: YAK_FONTS.body,
      fontSize: '14px',
      color: '#94a3b8',
    }).setOrigin(0.5);
  }

  private createAnswerGrid(): void {
    const startY = 320;
    const buttonWidth = 240;
    const buttonHeight = 65;
    const spacing = 15;
    const columns = 2;

    // Shuffle options for variety
    const shuffledOptions = [...this.question.options].sort(() => Math.random() - 0.5);

    shuffledOptions.forEach((option, index) => {
      const col = index % columns;
      const row = Math.floor(index / columns);
      const x = 40 + col * (buttonWidth + spacing);
      const y = startY + row * (buttonHeight + spacing);

      const isCorrect = this.question.correct.includes(option);

      // Button background
      const bg = this.add.graphics();
      this.drawButton(bg, x, y, buttonWidth, buttonHeight, 'default');

      // Button text
      const text = this.add.text(x + buttonWidth / 2, y + buttonHeight / 2, option, {
        fontFamily: YAK_FONTS.title,
        fontSize: '16px',
        color: '#e2e8f0',
        align: 'center',
        wordWrap: { width: buttonWidth - 20 }
      }).setOrigin(0.5);

      // Interactive area
      const hitArea = this.add.rectangle(x + buttonWidth / 2, y + buttonHeight / 2, buttonWidth, buttonHeight, 0x000000, 0);
      hitArea.setInteractive({ useHandCursor: true });

      const button: AnswerButton = {
        bg,
        text,
        hitArea,
        option,
        isCorrect,
        isSelected: false,
      };

      // Hover effect
      hitArea.on('pointerover', () => {
        if (!button.isSelected && !this.isInputLocked) {
          this.drawButton(bg, x, y, buttonWidth, buttonHeight, 'hover');
        }
      });

      hitArea.on('pointerout', () => {
        if (!button.isSelected && !this.isInputLocked) {
          this.drawButton(bg, x, y, buttonWidth, buttonHeight, 'default');
        }
      });

      // Click handler
      hitArea.on('pointerdown', () => {
        this.handleButtonClick(button, x, y, buttonWidth, buttonHeight);
      });

      this.buttons.push(button);
    });
  }

  private drawButton(graphics: Phaser.GameObjects.Graphics, x: number, y: number, width: number, height: number, state: 'default' | 'hover' | 'correct' | 'incorrect'): void {
    graphics.clear();

    let fillColor = 0x334155;
    let strokeColor = 0x475569;
    let strokeWidth = 2;

    switch (state) {
      case 'hover':
        fillColor = 0x3b4a5e;
        strokeColor = YAK_COLORS.primary;
        strokeWidth = 3;
        break;
      case 'correct':
        fillColor = 0x065f46;
        strokeColor = 0x10b981;
        strokeWidth = 3;
        break;
      case 'incorrect':
        fillColor = 0x7f1d1d;
        strokeColor = 0xef4444;
        strokeWidth = 3;
        break;
    }

    graphics.fillStyle(fillColor, 1);
    graphics.fillRoundedRect(x, y, width, height, 10);
    graphics.lineStyle(strokeWidth, strokeColor, 1);
    graphics.strokeRoundedRect(x, y, width, height, 10);
  }

  private handleButtonClick(button: AnswerButton, x: number, y: number, width: number, height: number): void {
    if (this.isInputLocked || button.isSelected) return;

    button.isSelected = true;

    if (button.isCorrect) {
      // Correct answer!
      this.drawButton(button.bg, x, y, width, height, 'correct');
      button.text.setColor('#10b981');
      this.correctAnswersFound++;

      // Success sound effect (visual feedback)
      const checkmark = this.add.text(x + width / 2, y + height / 2, '✓', {
        fontSize: '32px',
        color: '#10b981',
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: checkmark,
        alpha: 1,
        scale: 1.5,
        duration: 200,
        yoyo: true,
        onComplete: () => checkmark.destroy()
      });

      this.cameras.main.flash(100, 16, 185, 129, false, undefined, 0.2);

      this.updateProgress();

      // Check if all correct answers found
      if (this.correctAnswersFound === this.question.correct.length) {
        this.time.delayedCall(800, () => this.handleQuizComplete());
      }
    } else {
      // Incorrect answer!
      this.drawButton(button.bg, x, y, width, height, 'incorrect');
      button.text.setColor('#ef4444');

      // Lock input temporarily
      this.isInputLocked = true;

      // X mark
      const xMark = this.add.text(x + width / 2, y + height / 2, '✗', {
        fontSize: '32px',
        color: '#ef4444',
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: xMark,
        alpha: 1,
        scale: 1.5,
        duration: 200,
        yoyo: true,
        onComplete: () => xMark.destroy()
      });

      this.cameras.main.shake(150, 0.008);

      // Show penalty message
      const penalty = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 100, 'WRONG! +0.5s DELAY', {
        fontFamily: YAK_FONTS.title,
        fontSize: '18px',
        color: '#ef4444',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5).setAlpha(0);

      this.tweens.add({
        targets: penalty,
        alpha: 1,
        y: penalty.y - 30,
        duration: 500,
        onComplete: () => {
          this.tweens.add({
            targets: penalty,
            alpha: 0,
            duration: 200,
            onComplete: () => penalty.destroy()
          });
        }
      });

      // Unlock after 500ms delay (this is the penalty)
      this.time.delayedCall(500, () => {
        this.isInputLocked = false;
        // Reset button to default state
        this.drawButton(button.bg, x, y, width, height, 'default');
        button.text.setColor('#e2e8f0');
        button.isSelected = false;
      });
    }
  }

  private createProgressDisplay(): void {
    this.progressText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 50, `Progress: 0 / ${this.question.correct.length}`, {
      fontFamily: YAK_FONTS.title,
      fontSize: '18px',
      color: '#cbd5e1',
    }).setOrigin(0.5);
  }

  private updateProgress(): void {
    this.progressText.setText(`Progress: ${this.correctAnswersFound} / ${this.question.correct.length}`);
    this.progressText.setColor(this.correctAnswersFound === this.question.correct.length ? '#10b981' : '#cbd5e1');
  }

  private handleQuizComplete(): void {
    // Flash success
    this.cameras.main.flash(300, 16, 185, 129);

    // Show completion message
    const complete = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'QUIZ COMPLETE!', {
      fontFamily: YAK_FONTS.title,
      fontSize: '36px',
      color: '#10b981',
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: complete,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          // Stop timer and go to result scene
          GameStateService.completeRun();
          this.scene.start('ResultScene');
        });
      }
    });

    // Celebration particles
    for (let i = 0; i < 40; i++) {
      const particle = this.add.circle(
        GAME_WIDTH / 2 + (Math.random() - 0.5) * 100,
        GAME_HEIGHT / 2,
        Math.random() * 5 + 2,
        [0x10b981, 0xfbbf24, 0x60a5fa, 0xe74c3c][Math.floor(Math.random() * 4)],
        0.9
      );

      this.tweens.add({
        targets: particle,
        y: particle.y + (Math.random() - 0.5) * 300,
        x: particle.x + (Math.random() - 0.5) * 200,
        alpha: 0,
        duration: 1000 + Math.random() * 500,
        onComplete: () => particle.destroy()
      });
    }
  }

  update(): void {
    // Update timer display
    const currentTimeMs = GameStateService.getCurrentTimeMs();
    const minutes = Math.floor(currentTimeMs / 60000);
    const seconds = Math.floor((currentTimeMs % 60000) / 1000);
    const centiseconds = Math.floor((currentTimeMs % 1000) / 10);

    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
    this.timerText.setText(timeString);

    // Color changes based on time
    if (currentTimeMs > 60000) {
      this.timerText.setColor('#ef4444');
    } else if (currentTimeMs > 45000) {
      this.timerText.setColor('#fbbf24');
    } else {
      this.timerText.setColor('#cbd5e1');
    }
  }
}
