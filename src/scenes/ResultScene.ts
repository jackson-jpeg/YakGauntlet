import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS, createStoolIcon } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { LeaderboardService } from '../services/LeaderboardService';
import type { LeaderboardEntry, RunState, StationId } from '../types';

export class ResultScene extends Phaser.Scene {
  private initials: string[] = ['', '', ''];
  private currentInitialIndex = 0;
  private initialTexts: Phaser.GameObjects.Text[] = [];
  private leaderboardContainer!: Phaser.GameObjects.Container;
  private hasSubmitted = false;
  private playerRank = 0;
  // Track input elements explicitly for safe cleanup
  private inputElements: Phaser.GameObjects.GameObject[] = [];
  // Native mobile keyboard support
  private hiddenInput: HTMLInputElement | null = null;
  private cursorBlink: Phaser.GameObjects.Text | null = null;
  private cursorBlinkTween: Phaser.Tweens.Tween | null = null;
  private initialBoxes: Phaser.GameObjects.Graphics[] = [];

  constructor() {
    super({ key: 'ResultScene' });
  }

  create(): void {
    // Reset state
    this.initials = ['', '', ''];
    this.currentInitialIndex = 0;
    this.initialTexts = [];
    this.inputElements = [];
    this.hasSubmitted = false;
    this.playerRank = 0;

    const state = GameStateService.getState();
    if (!state) {
      console.warn('No game state available, returning to boot scene');
      this.scene.start('BootScene');
      return;
    }

    const finalTimeMs = GameStateService.getFinalTimeMs();
    const isWet = finalTimeMs > 75000;

    this.createBackground();
    this.createHeader(isWet);
    this.createTimeDisplay(finalTimeMs, isWet);
    this.createStationBreakdown(state);
    this.createPlayAgain();
    this.createLeaderboardSection();
  }

  private createBackground(): void {
    // Gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(YAK_COLORS.bgDark, YAK_COLORS.bgDark, YAK_COLORS.bgMedium, YAK_COLORS.bgMedium, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Celebratory particles
    for (let i = 0; i < 40; i++) {
      const x = Math.random() * GAME_WIDTH;
      const y = Math.random() * GAME_HEIGHT;
      const colors = [YAK_COLORS.primary, YAK_COLORS.secondary, YAK_COLORS.success, 0x3b82f6, 0xa855f7];
      const particle = this.add.circle(x, y, Math.random() * 4 + 2, colors[Math.floor(Math.random() * colors.length)], 0.4);

      this.tweens.add({
        targets: particle,
        y: y - 100 - Math.random() * 150,
        alpha: 0,
        duration: 3000 + Math.random() * 2000,
        repeat: -1,
        delay: Math.random() * 2000,
      });
    }
  }

  private createHeader(isWet: boolean): void {
    // "RUN COMPLETE" or "WET RUN" header - BIGGER and more impactful
    const headerText = isWet ? 'WET RUN' : 'RUN COMPLETE!';
    const headerColor = isWet ? YAK_COLORS.textRed : YAK_COLORS.textGold;

    const header = this.add.text(GAME_WIDTH / 2, 55, headerText, {
      fontFamily: YAK_FONTS.title,
      fontSize: '48px',
      color: headerColor,
      stroke: '#000000',
      strokeThickness: 8,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: headerColor,
        blur: 20,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: header,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        // Subtle pulse for emphasis
        this.tweens.add({
          targets: header,
          scale: 1.05,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut'
        });
      }
    });

    // Decorative line with glow
    const line = this.add.graphics();
    line.lineStyle(4, isWet ? YAK_COLORS.danger : YAK_COLORS.secondary, 1);
    line.moveTo(GAME_WIDTH / 2 - 180, 105);
    line.lineTo(GAME_WIDTH / 2 + 180, 105);
    line.strokePath();

    // Add stool icons on either side of header for Yak branding
    const leftStool = createStoolIcon(this, 40, 55, 1.3);
    const rightStool = createStoolIcon(this, GAME_WIDTH - 40, 55, 1.3);
    leftStool.setAngle(-10).setAlpha(0.7);
    rightStool.setAngle(10).setAlpha(0.7);
  }

  private createTimeDisplay(finalTimeMs: number, isWet: boolean): void {
    const timeSeconds = (finalTimeMs / 1000).toFixed(2);

    // Time container - BIGGER and more prominent
    const containerY = 185;

    // Background panel with glow
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.6);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 150, containerY - 65, 300, 130, 18);
    panel.lineStyle(4, isWet ? YAK_COLORS.danger : YAK_COLORS.secondary, 1);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 150, containerY - 65, 300, 130, 18);

    // Outer glow
    const glow = this.add.graphics();
    glow.lineStyle(2, isWet ? YAK_COLORS.danger : YAK_COLORS.secondary, 0.3);
    glow.strokeRoundedRect(GAME_WIDTH / 2 - 158, containerY - 73, 316, 146, 22);

    // Pulsing glow animation
    this.tweens.add({
      targets: glow,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Main time - BIGGER
    const timeText = this.add.text(GAME_WIDTH / 2, containerY, timeSeconds, {
      fontFamily: YAK_FONTS.title,
      fontSize: '80px',
      color: isWet ? YAK_COLORS.textRed : YAK_COLORS.textGreen,
      stroke: '#000000',
      strokeThickness: 8,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: isWet ? YAK_COLORS.textRed : YAK_COLORS.textGreen,
        blur: 15,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: timeText,
      scale: 1,
      duration: 700,
      delay: 400,
      ease: 'Elastic.easeOut',
    });

    // "seconds" label - better styling
    this.add.text(GAME_WIDTH / 2, containerY + 50, 'seconds', {
      fontFamily: YAK_FONTS.body,
      fontSize: '20px',
      color: '#cbd5e1',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // WET stamp
    if (isWet) {
      this.showWetStamp(containerY);
    }
  }

  private showWetStamp(containerY: number): void {
    const stamp = this.add.text(GAME_WIDTH / 2 + 100, containerY - 20, 'WET', {
      fontFamily: YAK_FONTS.title,
      fontSize: '42px',
      color: '#ef4444',
      stroke: '#7f1d1d',
      strokeThickness: 4,
    }).setOrigin(0.5).setRotation(-0.25).setAlpha(0);

    this.tweens.add({
      targets: stamp,
      alpha: 0.95,
      scale: { from: 2.5, to: 1 },
      duration: 250,
      delay: 800,
      ease: 'Back.easeOut',
    });

    // Stamp impact flash
    this.time.delayedCall(800, () => {
      this.cameras.main.shake(100, 0.008);
    });
  }

  private createStationBreakdown(state: RunState): void {
    const startY = 335;

    // Section title - improved styling
    const titleText = this.add.text(GAME_WIDTH / 2, startY, 'STATION BREAKDOWN', {
      fontFamily: YAK_FONTS.title,
      fontSize: '20px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Station rows - all 7 stations!
    const completedStations = ['cornhole', 'goalie', 'wiffle', 'football', 'corner3_right', 'corner3_left', 'quiz'];

    completedStations.forEach((stationId, index) => {
      const station = STATIONS.find(s => s.id === stationId);
      if (!station) return;

      const y = startY + 40 + index * 48;
      const misses = state.missCountByStation[stationId as StationId] || 0;

      // Row background with subtle hover effect
      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x000000, 0.4);
      rowBg.fillRoundedRect(25, y - 18, GAME_WIDTH - 50, 40, 8);
      rowBg.lineStyle(1, station.color, 0.3);
      rowBg.strokeRoundedRect(25, y - 18, GAME_WIDTH - 50, 40, 8);

      // Animate in with stagger
      rowBg.setAlpha(0);
      this.tweens.add({
        targets: rowBg,
        alpha: 1,
        duration: 300,
        delay: 500 + index * 80,
        ease: 'Power2'
      });

      // Station color indicator - larger and with emoji
      const colorCircle = this.add.circle(48, y, 14, station.color, 0.9);
      colorCircle.setStrokeStyle(2, 0xffffff, 0.6);

      const emoji = this.add.text(48, y, station.emoji, {
        fontSize: '18px'
      }).setOrigin(0.5);

      // Station name - improved
      const nameText = this.add.text(75, y, station.name, {
        fontFamily: YAK_FONTS.title,
        fontSize: '15px',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0.5);

      // Checkmark - animated
      const check = this.add.text(GAME_WIDTH - 140, y, '✓', {
        fontFamily: YAK_FONTS.body,
        fontSize: '24px',
        color: YAK_COLORS.textGreen,
      }).setOrigin(0.5).setScale(0);

      this.tweens.add({
        targets: check,
        scale: 1,
        duration: 400,
        delay: 600 + index * 80,
        ease: 'Back.easeOut'
      });

      // Miss count - better colors
      const missColor = misses === 0 ? YAK_COLORS.textGreen : misses <= 2 ? YAK_COLORS.textGold : YAK_COLORS.textRed;
      this.add.text(GAME_WIDTH - 55, y, `${misses} miss${misses !== 1 ? 'es' : ''}`, {
        fontFamily: YAK_FONTS.body,
        fontSize: '13px',
        color: missColor,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0.5);
    });

    // Total misses - more prominent
    const totalMisses = (Object.values(state.missCountByStation) as number[]).reduce((a, b) => a + b, 0);
    const totalY = startY + 40 + completedStations.length * 48 + 10;

    const totalBg = this.add.graphics();
    totalBg.fillStyle(totalMisses === 0 ? YAK_COLORS.success : YAK_COLORS.bgDark, 0.6);
    totalBg.fillRoundedRect(GAME_WIDTH / 2 - 90, totalY - 15, 180, 30, 8);
    totalBg.lineStyle(2, totalMisses === 0 ? YAK_COLORS.successBright : YAK_COLORS.secondary, 0.8);
    totalBg.strokeRoundedRect(GAME_WIDTH / 2 - 90, totalY - 15, 180, 30, 8);

    this.add.text(GAME_WIDTH / 2, totalY, `Total Misses: ${totalMisses}`, {
      fontFamily: YAK_FONTS.title,
      fontSize: '16px',
      color: totalMisses === 0 ? YAK_COLORS.textGreen : YAK_COLORS.textOrange,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Full gauntlet completed text
    const completeY = totalY + 40;
    this.add.text(GAME_WIDTH / 2, completeY, 'FULL GAUNTLET COMPLETE!', {
      fontFamily: YAK_FONTS.title,
      fontSize: '16px',
      color: YAK_COLORS.textGold,
    }).setOrigin(0.5);
  }

  private createPlayAgain(): void {
    const btnY = 715;

    // Outer glow
    const outerGlow = this.add.graphics();
    outerGlow.fillStyle(YAK_COLORS.primary, 0.2);
    outerGlow.fillRoundedRect(GAME_WIDTH / 2 - 135, btnY - 32, 270, 64, 14);

    // Button background - Vibrant Yak orange-red
    const btnBg = this.add.graphics();
    btnBg.fillStyle(YAK_COLORS.primary, 1);
    btnBg.fillRoundedRect(GAME_WIDTH / 2 - 125, btnY - 28, 250, 56, 12);

    // Button border with gold accent
    btnBg.lineStyle(4, YAK_COLORS.secondary, 1);
    btnBg.strokeRoundedRect(GAME_WIDTH / 2 - 125, btnY - 28, 250, 56, 12);

    // Subtle inner highlight
    const highlight = this.add.graphics();
    highlight.fillStyle(0xffffff, 0.15);
    highlight.fillRoundedRect(GAME_WIDTH / 2 - 120, btnY - 23, 240, 6, 10);

    // Button text - bigger and bolder
    const btnText = this.add.text(GAME_WIDTH / 2, btnY, 'BACK TO STUDIO', {
      fontFamily: YAK_FONTS.title,
      fontSize: '24px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 0,
        fill: true
      }
    }).setOrigin(0.5);

    // Interactive zone
    const hitArea = this.add.rectangle(GAME_WIDTH / 2, btnY, 250, 56, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: [btnBg, btnText, highlight],
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 150,
        ease: 'Back.easeOut'
      });
      // Brighten on hover
      btnBg.clear();
      btnBg.fillStyle(YAK_COLORS.primaryBright, 1);
      btnBg.fillRoundedRect(GAME_WIDTH / 2 - 125, btnY - 28, 250, 56, 12);
      btnBg.lineStyle(4, YAK_COLORS.secondary, 1);
      btnBg.strokeRoundedRect(GAME_WIDTH / 2 - 125, btnY - 28, 250, 56, 12);
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: [btnBg, btnText, highlight],
        scaleX: 1,
        scaleY: 1,
        duration: 150,
      });
      // Reset to default color
      btnBg.clear();
      btnBg.fillStyle(YAK_COLORS.primary, 1);
      btnBg.fillRoundedRect(GAME_WIDTH / 2 - 125, btnY - 28, 250, 56, 12);
      btnBg.lineStyle(4, YAK_COLORS.secondary, 1);
      btnBg.strokeRoundedRect(GAME_WIDTH / 2 - 125, btnY - 28, 250, 56, 12);
    });

    hitArea.on('pointerdown', () => {
      // Brief squish effect
      this.tweens.add({
        targets: [btnBg, btnText, highlight],
        scaleY: 0.92,
        duration: 80,
        yoyo: true,
        ease: 'Power2'
      });

      this.cameras.main.flash(250, 255, 140, 50);
      this.time.delayedCall(180, () => {
        this.cleanupHiddenInput();
        this.reset();
        this.scene.start('BootScene');
      });
    });

    // Pulse animation
    this.tweens.add({
      targets: btnText,
      scale: 1.05,
      duration: 600,
      yoyo: true,
      repeat: -1,
      delay: 1000,
    });
  }

  private createLeaderboardSection(): void {
    const sectionY = 800;

    // Section background - more prominent
    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(YAK_COLORS.bgDark, 0.95);
    sectionBg.fillRoundedRect(20, sectionY - 25, GAME_WIDTH - 40, 155, 14);
    sectionBg.lineStyle(3, YAK_COLORS.secondary, 0.9);
    sectionBg.strokeRoundedRect(20, sectionY - 25, GAME_WIDTH - 40, 155, 14);
    this.inputElements.push(sectionBg);

    // Outer glow
    const glow = this.add.graphics();
    glow.lineStyle(2, YAK_COLORS.secondary, 0.3);
    glow.strokeRoundedRect(18, sectionY - 27, GAME_WIDTH - 36, 159, 16);
    this.inputElements.push(glow);

    // Section title - bigger and more vibrant
    const titleText = this.add.text(GAME_WIDTH / 2, sectionY - 5, 'LEADERBOARD', {
      fontFamily: YAK_FONTS.title,
      fontSize: '24px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: YAK_COLORS.textGold,
        blur: 10,
        stroke: true,
        fill: true
      }
    }).setOrigin(0.5);
    this.inputElements.push(titleText);

    // Subtle pulse
    this.tweens.add({
      targets: titleText,
      scale: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Input section
    const inputY = sectionY + 40;

    const instructionsText = this.add.text(GAME_WIDTH / 2, inputY - 18, 'Tap to enter your initials:', {
      fontFamily: YAK_FONTS.body,
      fontSize: '14px',
      color: '#e2e8f0',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.inputElements.push(instructionsText);

    // Input boxes with smart focus - bigger and more vibrant
    const boxSpacing = 52;
    const startX = GAME_WIDTH / 2 - boxSpacing;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * boxSpacing;

      // Box background
      const box = this.add.graphics();
      box.fillStyle(YAK_COLORS.bgMedium, 1);
      box.fillRoundedRect(x - 22, inputY - 8, 44, 54, 10);
      box.lineStyle(3, i === 0 ? YAK_COLORS.primary : YAK_COLORS.navy, i === 0 ? 1 : 0.5);
      box.strokeRoundedRect(x - 22, inputY - 8, 44, 54, 10);
      this.inputElements.push(box);
      this.initialBoxes.push(box);

      // Inner glow for active box
      if (i === 0) {
        const boxGlow = this.add.graphics();
        boxGlow.fillStyle(YAK_COLORS.primary, 0.2);
        boxGlow.fillRoundedRect(x - 24, inputY - 10, 48, 58, 12);
        this.inputElements.push(boxGlow);
      }

      // Initial text - larger
      const initialText = this.add.text(x, inputY + 19, '_', {
        fontFamily: YAK_FONTS.mono,
        fontSize: '32px',
        color: '#64748b',
      }).setOrigin(0.5);

      this.initialTexts.push(initialText);
      this.inputElements.push(initialText);

      // Interactive area for focusing
      const boxHitArea = this.add.rectangle(x, inputY + 19, 44, 54, 0x000000, 0);
      boxHitArea.setInteractive({ useHandCursor: true });
      this.inputElements.push(boxHitArea);

      boxHitArea.on('pointerdown', () => {
        // Focus the hidden input to bring up native keyboard
        this.focusHiddenInput();
      });
    }

    // Create blinking cursor for active slot - brighter
    this.cursorBlink = this.add.text(startX, inputY + 19, '|', {
      fontFamily: YAK_FONTS.mono,
      fontSize: '34px',
      color: YAK_COLORS.textGold,
    }).setOrigin(0.5);
    this.inputElements.push(this.cursorBlink);

    // Start cursor blink animation
    this.cursorBlinkTween = this.tweens.add({
      targets: this.cursorBlink,
      alpha: 0,
      duration: 530,
      yoyo: true,
      repeat: -1,
    });

    // Helpful hint below the input
    const hintText = this.add.text(GAME_WIDTH / 2, inputY + 65, 'Complete to see the leaderboard', {
      fontFamily: YAK_FONTS.body,
      fontSize: '12px',
      color: '#64748b',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);
    this.inputElements.push(hintText);

    // Subtle pulse on hint
    this.tweens.add({
      targets: hintText,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Create leaderboard display (hidden initially)
    this.leaderboardContainer = this.add.container(0, 0);
    this.leaderboardContainer.setVisible(false);

    // Setup keyboard input - both Phaser and native HTML
    this.input.keyboard?.on('keydown', this.handleKeyPress, this);

    // Create hidden HTML input for native mobile keyboard
    this.createHiddenInput();
  }


  private handleKeyPress(event: KeyboardEvent): void {
    if (this.hasSubmitted) return;

    const key = event.key.toUpperCase();

    if (key === 'BACKSPACE') {
      this.handleBackspace();
    } else if (key.length === 1 && key >= 'A' && key <= 'Z') {
      this.handleLetterInput(key);
    } else if (key === 'ENTER' && this.currentInitialIndex === 3) {
      this.submitScore();
    }
  }

  private handleLetterInput(letter: string): void {
    if (this.currentInitialIndex >= 3) return;

    this.initials[this.currentInitialIndex] = letter;
    this.initialTexts[this.currentInitialIndex].setText(letter);
    this.initialTexts[this.currentInitialIndex].setColor('#ffffff');

    // Move to next box
    this.currentInitialIndex++;

    // Update hidden input to match
    if (this.hiddenInput) {
      this.hiddenInput.value = this.initials.join('');
    }

    // Update box highlights and cursor
    this.updateBoxHighlights();
    this.updateCursorPosition();

    // Auto-submit when all 3 letters entered
    if (this.currentInitialIndex === 3) {
      this.time.delayedCall(300, () => this.submitScore());
    }
  }

  private handleBackspace(): void {
    if (this.currentInitialIndex > 0) {
      this.currentInitialIndex--;
      this.initials[this.currentInitialIndex] = '';
      this.initialTexts[this.currentInitialIndex].setText('_');
      this.initialTexts[this.currentInitialIndex].setColor('#94a3b8');

      // Update hidden input to match
      if (this.hiddenInput) {
        this.hiddenInput.value = this.initials.join('');
      }

      this.updateBoxHighlights();
      this.updateCursorPosition();
    }
  }

  private updateBoxHighlights(): void {
    // Redraw boxes with proper highlight for current index
    this.initialBoxes.forEach((box, i) => {
      const boxSpacing = 52;
      const startX = GAME_WIDTH / 2 - boxSpacing;
      const inputY = 840;
      const x = startX + i * boxSpacing;

      box.clear();
      box.fillStyle(YAK_COLORS.bgMedium, 1);
      box.fillRoundedRect(x - 22, inputY - 8, 44, 54, 10);

      // Highlight the current box with vibrant Yak primary color
      const isActive = i === this.currentInitialIndex;
      box.lineStyle(3, isActive ? YAK_COLORS.primary : YAK_COLORS.navy, isActive ? 1 : 0.5);
      box.strokeRoundedRect(x - 22, inputY - 8, 44, 54, 10);
    });
  }

  private submitScore(): void {
    if (this.hasSubmitted) return;

    const username = this.initials.join('');
    if (username.length !== 3) return;

    this.hasSubmitted = true;

    const state = GameStateService.getState();
    if (!state) return;

    const finalTimeMs = GameStateService.getFinalTimeMs();
    const isWet = finalTimeMs > 75000;

    // Create leaderboard entry
    const entry: LeaderboardEntry = {
      username,
      time_ms: finalTimeMs,
      wet: isWet,
      timestamp: Date.now(),
      device: this.isMobile() ? 'mobile' : 'desktop',
      goalie: state.goalieCharacterId,
      version: '1.0.0',
    };

    // Add to leaderboard
    this.playerRank = LeaderboardService.addEntry(entry);

    // Hide input, show leaderboard
    this.showLeaderboard();

    // Flash effect
    this.cameras.main.flash(200, 34, 197, 94, false);
  }

  private showLeaderboard(): void {
    // Fade out input elements using explicitly tracked elements
    this.inputElements.forEach(element => {
      this.tweens.add({
        targets: element,
        alpha: 0,
        duration: 300,
        onComplete: () => {
          // Destroy to free memory
          if (element && element.destroy) {
            element.destroy();
          }
        }
      });
    });

    // Create and show leaderboard after delay - positioned where input was
    this.time.delayedCall(400, () => {
      // Now create the leaderboard with fresh data including the new entry
      // Position to fit on screen nicely (775 title, 795 header, 805+ entries = ~955 max)
      this.createLeaderboardDisplay(770);

      this.leaderboardContainer.setVisible(true);
      this.leaderboardContainer.setAlpha(0);
      this.tweens.add({
        targets: this.leaderboardContainer,
        alpha: 1,
        duration: 400,
      });
    });
  }

  private createLeaderboardDisplay(startY: number): void {
    const entries = LeaderboardService.getTopEntries(5);

    if (entries.length === 0) {
      const noScores = this.add.text(GAME_WIDTH / 2, startY + 40, 'No scores yet!\nBe the first on the board!', {
        fontFamily: YAK_FONTS.title,
        fontSize: '16px',
        color: YAK_COLORS.textGold,
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3,
      }).setOrigin(0.5);
      this.leaderboardContainer.add(noScores);
      return;
    }

    // Title above the list
    const title = this.add.text(GAME_WIDTH / 2, startY - 15, 'TOP SCORES', {
      fontFamily: YAK_FONTS.title,
      fontSize: '18px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);
    this.leaderboardContainer.add(title);

    // Header background with Yak styling
    const header = this.add.graphics();
    header.fillStyle(YAK_COLORS.bgDark, 0.9);
    header.fillRoundedRect(30, startY + 5, GAME_WIDTH - 60, 24, 6);
    header.lineStyle(2, YAK_COLORS.secondary, 0.5);
    header.strokeRoundedRect(30, startY + 5, GAME_WIDTH - 60, 24, 6);

    const headerText = [
      { text: 'RANK', x: 55 },
      { text: 'NAME', x: 135 },
      { text: 'TIME', x: 270 },
      { text: 'STATUS', x: 390 },
    ];

    headerText.forEach(({ text, x }) => {
      const label = this.add.text(x, startY + 12, text, {
        fontFamily: YAK_FONTS.title,
        fontSize: '12px',
        color: YAK_COLORS.textGold,
        stroke: '#000000',
        strokeThickness: 2,
      });
      this.leaderboardContainer.add(label);
    });

    this.leaderboardContainer.add(header);

    // Entries - with animation
    entries.forEach((entry, index) => {
      const y = startY + 40 + index * 30;
      const isPlayer = this.playerRank === index + 1;

      // Row background with subtle stripe
      const rowBg = this.add.graphics();
      if (index % 2 === 0) {
        rowBg.fillStyle(0x000000, 0.15);
        rowBg.fillRoundedRect(30, y - 12, GAME_WIDTH - 60, 28, 5);
      }
      this.leaderboardContainer.add(rowBg);

      // Highlight for player's score
      if (isPlayer) {
        const highlight = this.add.graphics();
        highlight.fillStyle(YAK_COLORS.primary, 0.25);
        highlight.fillRoundedRect(30, y - 12, GAME_WIDTH - 60, 28, 5);
        highlight.lineStyle(2, YAK_COLORS.secondary, 0.9);
        highlight.strokeRoundedRect(30, y - 12, GAME_WIDTH - 60, 28, 5);
        this.leaderboardContainer.add(highlight);
      }

      // Rank with medal for top 3
      let rankText = `${index + 1}`;
      let rankColor = '#cbd5e1';
      if (index === 0) {
        rankText = '🥇';
      } else if (index === 1) {
        rankText = '🥈';
      } else if (index === 2) {
        rankText = '🥉';
      }

      const rank = this.add.text(55, y, rankText, {
        fontFamily: YAK_FONTS.title,
        fontSize: '16px',
        color: rankColor,
      }).setOrigin(0, 0.5);

      // Name
      const name = this.add.text(135, y, entry.username, {
        fontFamily: YAK_FONTS.mono,
        fontSize: '17px',
        color: isPlayer ? YAK_COLORS.textGold : '#ffffff',
        fontStyle: isPlayer ? 'bold' : 'normal',
        stroke: '#000000',
        strokeThickness: isPlayer ? 3 : 2,
      }).setOrigin(0, 0.5);

      // Time
      const timeSeconds = (entry.time_ms / 1000).toFixed(2);
      const time = this.add.text(270, y, `${timeSeconds}s`, {
        fontFamily: YAK_FONTS.mono,
        fontSize: '15px',
        color: entry.wet ? YAK_COLORS.textRed : YAK_COLORS.textGreen,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0.5);

      // Status
      const status = this.add.text(390, y, entry.wet ? 'WET' : 'DRY', {
        fontFamily: YAK_FONTS.title,
        fontSize: '13px',
        color: entry.wet ? YAK_COLORS.textRed : YAK_COLORS.textGreen,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0.5);

      // Animate entry in with stagger
      const allElements = [rowBg, rank, name, time, status];
      if (isPlayer) {
        // Highlight is already in container
      }

      allElements.forEach(el => {
        el.setAlpha(0);
        this.tweens.add({
          targets: el,
          alpha: 1,
          duration: 300,
          delay: 100 + index * 80,
          ease: 'Power2'
        });
      });

      this.leaderboardContainer.add([rank, name, time, status]);
    });

    // "You" indicator for player
    if (this.playerRank > 0 && this.playerRank <= 5) {
      const youY = startY + 40 + (this.playerRank - 1) * 30;
      const youLabel = this.add.text(GAME_WIDTH - 55, youY, '← YOU', {
        fontFamily: YAK_FONTS.title,
        fontSize: '12px',
        color: YAK_COLORS.textOrange,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0.5).setAlpha(0);

      // Pulse animation for you indicator
      this.tweens.add({
        targets: youLabel,
        alpha: 1,
        scale: 1.1,
        duration: 400,
        delay: 200 + (this.playerRank - 1) * 80,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: youLabel,
            scale: 1,
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
        }
      });

      this.leaderboardContainer.add(youLabel);
    }
  }

  private createHiddenInput(): void {
    // Create a hidden HTML input for native mobile keyboard
    this.hiddenInput = document.createElement('input');
    this.hiddenInput.type = 'text';
    this.hiddenInput.maxLength = 3;
    this.hiddenInput.style.position = 'absolute';
    this.hiddenInput.style.opacity = '0';
    this.hiddenInput.style.pointerEvents = 'none';
    this.hiddenInput.style.left = '-9999px';
    this.hiddenInput.autocomplete = 'off';
    this.hiddenInput.autocapitalize = 'characters';

    // Add to DOM
    document.body.appendChild(this.hiddenInput);

    // Handle input from native keyboard
    this.hiddenInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = target.value.toUpperCase();

      // Clear and rebuild from input value
      this.initials = ['', '', ''];
      this.currentInitialIndex = 0;

      for (let i = 0; i < Math.min(value.length, 3); i++) {
        const char = value[i];
        if (char >= 'A' && char <= 'Z') {
          this.initials[i] = char;
          this.initialTexts[i].setText(char);
          this.initialTexts[i].setColor('#ffffff');
          this.currentInitialIndex = i + 1;
        }
      }

      // Fill remaining with underscores
      for (let i = this.currentInitialIndex; i < 3; i++) {
        this.initialTexts[i].setText('_');
        this.initialTexts[i].setColor('#94a3b8');
      }

      // Update cursor position and box highlights
      this.updateCursorPosition();
      this.updateBoxHighlights();

      // Auto-submit when 3 letters entered
      if (this.currentInitialIndex === 3 && !this.hasSubmitted) {
        this.time.delayedCall(300, () => this.submitScore());
      }
    });

    // Auto-focus on mobile devices
    if (this.isMobile()) {
      this.time.delayedCall(500, () => {
        this.focusHiddenInput();
      });
    }
  }

  private focusHiddenInput(): void {
    if (this.hiddenInput && !this.hasSubmitted) {
      this.hiddenInput.focus();
    }
  }

  private cleanupHiddenInput(): void {
    if (this.hiddenInput) {
      this.hiddenInput.remove();
      this.hiddenInput = null;
    }
  }

  private updateCursorPosition(): void {
    if (this.cursorBlink && this.currentInitialIndex < 3) {
      const boxSpacing = 52;
      const startX = GAME_WIDTH / 2 - boxSpacing;
      const inputY = 859; // Match the input section Y
      this.cursorBlink.setPosition(startX + this.currentInitialIndex * boxSpacing, inputY);
      this.cursorBlink.setVisible(true);
    } else if (this.cursorBlink) {
      this.cursorBlink.setVisible(false);
    }
  }

  private reset(): void {
    // Reset all scene state
    this.initials = ['', '', ''];
    this.currentInitialIndex = 0;
    this.initialTexts = [];
    this.initialBoxes = [];
    this.inputElements = [];
    this.hasSubmitted = false;
    this.playerRank = 0;

    // Clean up HTML input
    this.cleanupHiddenInput();

    // Clean up cursor blink
    if (this.cursorBlinkTween) {
      this.cursorBlinkTween.stop();
      this.cursorBlinkTween = null;
    }
    this.cursorBlink = null;

    // Clean up keyboard listener
    this.input.keyboard?.off('keydown', this.handleKeyPress, this);

    // Stop all tweens
    this.tweens.killAll();

    // Clear all timers
    this.time.removeAllEvents();
  }

  shutdown(): void {
    // Clean up HTML input FIRST (critical for mobile)
    this.cleanupHiddenInput();

    // Clean up cursor blink
    if (this.cursorBlinkTween) {
      this.cursorBlinkTween.stop();
      this.cursorBlinkTween = null;
    }
    this.cursorBlink = null;

    // Clean up event handlers
    this.events.removeAllListeners('update');
    this.input.removeAllListeners();
    this.input.keyboard?.off('keydown', this.handleKeyPress, this);

    // Clean up tweens
    this.tweens.killAll();

    // Clean up timers
    this.time.removeAllEvents();

    // Clear tracked elements
    this.inputElements = [];
    this.initialBoxes = [];
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}
