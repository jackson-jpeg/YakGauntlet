import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { LeaderboardService } from '../services/LeaderboardService';
import type { LeaderboardEntry } from '../types';

export class ResultScene extends Phaser.Scene {
  private initials: string[] = ['', '', ''];
  private currentInitialIndex = 0;
  private initialTexts: Phaser.GameObjects.Text[] = [];
  private leaderboardContainer!: Phaser.GameObjects.Container;
  private hasSubmitted = false;
  private playerRank = 0;

  constructor() {
    super({ key: 'ResultScene' });
  }

  create(): void {
    // Reset state
    this.initials = ['', '', ''];
    this.currentInitialIndex = 0;
    this.initialTexts = [];
    this.hasSubmitted = false;
    this.playerRank = 0;

    const state = GameStateService.getState();
    if (!state) {
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
    // "RUN COMPLETE" or "WET RUN" header
    const headerText = isWet ? 'WET RUN' : 'RUN COMPLETE!';
    const headerColor = isWet ? YAK_COLORS.textRed : YAK_COLORS.textGold;

    const header = this.add.text(GAME_WIDTH / 2, 60, headerText, {
      fontFamily: YAK_FONTS.title,
      fontSize: '38px',
      color: headerColor,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: header,
      scale: 1,
      duration: 500,
      ease: 'Back.easeOut',
    });

    // Decorative line
    const line = this.add.graphics();
    line.lineStyle(3, isWet ? YAK_COLORS.danger : YAK_COLORS.secondary, 0.8);
    line.moveTo(GAME_WIDTH / 2 - 150, 100);
    line.lineTo(GAME_WIDTH / 2 + 150, 100);
    line.strokePath();
  }

  private createTimeDisplay(finalTimeMs: number, isWet: boolean): void {
    const timeSeconds = (finalTimeMs / 1000).toFixed(2);

    // Time container
    const containerY = 180;

    // Background panel
    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.5);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 140, containerY - 60, 280, 120, 16);
    panel.lineStyle(3, isWet ? YAK_COLORS.danger : YAK_COLORS.secondary, 0.8);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 140, containerY - 60, 280, 120, 16);

    // Main time
    const timeText = this.add.text(GAME_WIDTH / 2, containerY - 5, timeSeconds, {
      fontFamily: YAK_FONTS.title,
      fontSize: '72px',
      color: isWet ? YAK_COLORS.textRed : YAK_COLORS.textGreen,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: timeText,
      scale: 1,
      duration: 600,
      delay: 300,
      ease: 'Back.easeOut',
    });

    // "seconds" label
    this.add.text(GAME_WIDTH / 2, containerY + 45, 'seconds', {
      fontFamily: YAK_FONTS.body,
      fontSize: '18px',
      color: '#9ca3af',
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

  private createStationBreakdown(state: any): void {
    const startY = 320;

    // Section title
    this.add.text(GAME_WIDTH / 2, startY, 'STATION BREAKDOWN', {
      fontFamily: YAK_FONTS.title,
      fontSize: '16px',
      color: '#9ca3af',
    }).setOrigin(0.5);

    // Station rows - all 6 stations now complete!
    const completedStations = ['cornhole', 'goalie', 'wiffle', 'football', 'corner3_right', 'corner3_left'];

    completedStations.forEach((stationId, index) => {
      const station = STATIONS.find(s => s.id === stationId);
      if (!station) return;

      const y = startY + 45 + index * 55;
      const misses = state.missCountByStation[stationId] || 0;

      // Row background
      const rowBg = this.add.graphics();
      rowBg.fillStyle(0x000000, 0.3);
      rowBg.fillRoundedRect(30, y - 20, GAME_WIDTH - 60, 45, 10);

      // Station color indicator
      this.add.circle(55, y, 12, station.color);

      // Station name
      this.add.text(80, y, station.name, {
        fontFamily: YAK_FONTS.title,
        fontSize: '16px',
        color: '#ffffff',
      }).setOrigin(0, 0.5);

      // Checkmark
      this.add.text(GAME_WIDTH - 130, y, '✓', {
        fontFamily: YAK_FONTS.body,
        fontSize: '22px',
        color: '#4ade80',
      }).setOrigin(0.5);

      // Miss count
      const missColor = misses === 0 ? '#4ade80' : misses <= 2 ? '#fbbf24' : '#ef4444';
      this.add.text(GAME_WIDTH - 60, y, `${misses} miss${misses !== 1 ? 'es' : ''}`, {
        fontFamily: YAK_FONTS.body,
        fontSize: '14px',
        color: missColor,
      }).setOrigin(0.5);
    });

    // Total misses
    const totalMisses = Object.values(state.missCountByStation).reduce((a: number, b: number) => a + b, 0);
    const totalY = startY + 45 + completedStations.length * 55 + 15;

    this.add.text(GAME_WIDTH / 2, totalY, `Total Misses: ${totalMisses}`, {
      fontFamily: YAK_FONTS.title,
      fontSize: '18px',
      color: totalMisses === 0 ? '#4ade80' : '#ffcdd2',
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
    const btnY = 565;

    // Button background
    const btnBg = this.add.graphics();
    btnBg.fillStyle(YAK_COLORS.primary, 1);
    btnBg.fillRoundedRect(GAME_WIDTH / 2 - 110, btnY - 25, 220, 50, 10);

    // Button border
    btnBg.lineStyle(3, YAK_COLORS.secondary, 0.8);
    btnBg.strokeRoundedRect(GAME_WIDTH / 2 - 110, btnY - 25, 220, 50, 10);

    // Button text
    const btnText = this.add.text(GAME_WIDTH / 2, btnY, 'PLAY AGAIN', {
      fontFamily: YAK_FONTS.title,
      fontSize: '24px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Interactive zone
    const hitArea = this.add.rectangle(GAME_WIDTH / 2, btnY, 220, 50, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: [btnBg, btnText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: [btnBg, btnText],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
    });

    hitArea.on('pointerdown', () => {
      this.cameras.main.flash(200, 255, 255, 255);
      this.time.delayedCall(150, () => {
        // Initialize a new run
        GameStateService.initNewRun();
        this.scene.start('RunScene');
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
    const sectionY = 635;

    // Section background
    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(0x1e293b, 0.9);
    sectionBg.fillRoundedRect(20, sectionY - 20, GAME_WIDTH - 40, 330, 12);
    sectionBg.lineStyle(2, YAK_COLORS.secondary, 0.6);
    sectionBg.strokeRoundedRect(20, sectionY - 20, GAME_WIDTH - 40, 330, 12);

    // Section title
    this.add.text(GAME_WIDTH / 2, sectionY, 'LEADERBOARD', {
      fontFamily: YAK_FONTS.title,
      fontSize: '18px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Input section
    const inputY = sectionY + 35;

    this.add.text(GAME_WIDTH / 2, inputY - 15, 'Enter your initials:', {
      fontFamily: YAK_FONTS.body,
      fontSize: '13px',
      color: '#cbd5e1',
    }).setOrigin(0.5);

    // Input boxes
    const boxSpacing = 45;
    const startX = GAME_WIDTH / 2 - boxSpacing;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * boxSpacing;

      // Box background
      const box = this.add.graphics();
      box.fillStyle(0x0f172a, 1);
      box.fillRoundedRect(x - 18, inputY - 5, 36, 45, 8);
      box.lineStyle(2, i === 0 ? YAK_COLORS.primary : 0x475569, i === 0 ? 1 : 0.5);
      box.strokeRoundedRect(x - 18, inputY - 5, 36, 45, 8);

      // Initial text
      const initialText = this.add.text(x, inputY + 17, '_', {
        fontFamily: YAK_FONTS.mono,
        fontSize: '28px',
        color: '#94a3b8',
      }).setOrigin(0.5);

      this.initialTexts.push(initialText);
    }

    // Instructions
    this.add.text(GAME_WIDTH / 2, inputY + 55, 'Type or tap keys below', {
      fontFamily: YAK_FONTS.body,
      fontSize: '11px',
      color: '#64748b',
    }).setOrigin(0.5);

    // Create on-screen keyboard
    this.createKeyboard(inputY + 80);

    // Create leaderboard display (hidden initially)
    this.leaderboardContainer = this.add.container(0, 0);
    this.leaderboardContainer.setVisible(false);

    // Setup keyboard input
    this.input.keyboard?.on('keydown', this.handleKeyPress, this);
  }

  private createKeyboard(startY: number): void {
    const rows = [
      ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
      ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '←']
    ];

    const keyWidth = 38;
    const keyHeight = 34;
    const keySpacing = 6;

    rows.forEach((row, rowIndex) => {
      const rowWidth = row.length * keyWidth + (row.length - 1) * keySpacing;
      const startX = (GAME_WIDTH - rowWidth) / 2;

      row.forEach((letter, colIndex) => {
        const x = startX + colIndex * (keyWidth + keySpacing);
        const y = startY + rowIndex * (keyHeight + keySpacing);

        // Key background
        const keyBg = this.add.graphics();
        keyBg.fillStyle(0x334155, 1);
        keyBg.fillRoundedRect(x, y, keyWidth, keyHeight, 6);
        keyBg.lineStyle(1, 0x475569, 0.8);
        keyBg.strokeRoundedRect(x, y, keyWidth, keyHeight, 6);

        // Key text
        const keyText = this.add.text(x + keyWidth / 2, y + keyHeight / 2, letter, {
          fontFamily: YAK_FONTS.title,
          fontSize: letter === '←' ? '20px' : '16px',
          color: '#e2e8f0',
        }).setOrigin(0.5);

        // Interactive area
        const hitArea = this.add.rectangle(x + keyWidth / 2, y + keyHeight / 2, keyWidth, keyHeight, 0x000000, 0);
        hitArea.setInteractive({ useHandCursor: true });

        hitArea.on('pointerover', () => {
          keyBg.clear();
          keyBg.fillStyle(0x475569, 1);
          keyBg.fillRoundedRect(x, y, keyWidth, keyHeight, 6);
          keyBg.lineStyle(2, YAK_COLORS.primary, 0.8);
          keyBg.strokeRoundedRect(x, y, keyWidth, keyHeight, 6);
        });

        hitArea.on('pointerout', () => {
          keyBg.clear();
          keyBg.fillStyle(0x334155, 1);
          keyBg.fillRoundedRect(x, y, keyWidth, keyHeight, 6);
          keyBg.lineStyle(1, 0x475569, 0.8);
          keyBg.strokeRoundedRect(x, y, keyWidth, keyHeight, 6);
        });

        hitArea.on('pointerdown', () => {
          if (letter === '←') {
            this.handleBackspace();
          } else {
            this.handleLetterInput(letter);
          }
        });
      });
    });
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

    // Update box highlights
    this.updateBoxHighlights();

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
      this.updateBoxHighlights();
    }
  }

  private updateBoxHighlights(): void {
    // This would require redrawing the boxes - simplified for now
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
    // Fade out input elements
    const inputElements = this.children.list.slice(0, -1); // All except leaderboard container
    inputElements.forEach(child => {
      if (child instanceof Phaser.GameObjects.Text ||
          child instanceof Phaser.GameObjects.Graphics ||
          child instanceof Phaser.GameObjects.Rectangle) {
        this.tweens.add({
          targets: child,
          alpha: 0,
          duration: 300,
        });
      }
    });

    // Create and show leaderboard after delay
    this.time.delayedCall(400, () => {
      // Now create the leaderboard with fresh data including the new entry
      this.createLeaderboardDisplay(705);

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
    const entries = LeaderboardService.getTopEntries(6);

    if (entries.length === 0) {
      const noScores = this.add.text(GAME_WIDTH / 2, startY + 30, 'No scores yet!\nBe the first on the board!', {
        fontFamily: YAK_FONTS.body,
        fontSize: '14px',
        color: '#94a3b8',
        align: 'center',
      }).setOrigin(0.5);
      this.leaderboardContainer.add(noScores);
      return;
    }

    // Header
    const header = this.add.graphics();
    header.fillStyle(0x1e293b, 0.8);
    header.fillRect(40, startY - 5, GAME_WIDTH - 80, 22);

    const headerText = [
      { text: 'RANK', x: 60 },
      { text: 'NAME', x: 140 },
      { text: 'TIME', x: 280 },
      { text: 'STATUS', x: 400 },
    ];

    headerText.forEach(({ text, x }) => {
      const label = this.add.text(x, startY + 3, text, {
        fontFamily: YAK_FONTS.title,
        fontSize: '11px',
        color: '#64748b',
      });
      this.leaderboardContainer.add(label);
    });

    this.leaderboardContainer.add(header);

    // Entries
    entries.forEach((entry, index) => {
      const y = startY + 30 + index * 28;
      const isPlayer = this.playerRank === index + 1;

      // Row background
      if (isPlayer) {
        const highlight = this.add.graphics();
        highlight.fillStyle(YAK_COLORS.primary, 0.2);
        highlight.fillRoundedRect(35, y - 10, GAME_WIDTH - 70, 26, 5);
        highlight.lineStyle(2, YAK_COLORS.primary, 0.6);
        highlight.strokeRoundedRect(35, y - 10, GAME_WIDTH - 70, 26, 5);
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

      const rank = this.add.text(60, y, rankText, {
        fontFamily: YAK_FONTS.title,
        fontSize: '14px',
        color: rankColor,
      });

      // Name
      const name = this.add.text(140, y, entry.username, {
        fontFamily: YAK_FONTS.mono,
        fontSize: '16px',
        color: isPlayer ? YAK_COLORS.textGold : '#e2e8f0',
        fontStyle: isPlayer ? 'bold' : 'normal',
      });

      // Time
      const timeSeconds = (entry.time_ms / 1000).toFixed(2);
      const time = this.add.text(280, y, `${timeSeconds}s`, {
        fontFamily: YAK_FONTS.mono,
        fontSize: '14px',
        color: entry.wet ? '#ef4444' : '#4ade80',
      });

      // Status
      const status = this.add.text(400, y, entry.wet ? 'WET' : 'DRY', {
        fontFamily: YAK_FONTS.title,
        fontSize: '12px',
        color: entry.wet ? '#ef4444' : '#4ade80',
      });

      this.leaderboardContainer.add([rank, name, time, status]);
    });

    // "You" indicator for player
    if (this.playerRank > 0 && this.playerRank <= 6) {
      const youLabel = this.add.text(GAME_WIDTH - 60, startY + 30 + (this.playerRank - 1) * 28, 'YOU', {
        fontFamily: YAK_FONTS.title,
        fontSize: '11px',
        color: YAK_COLORS.primary,
      });
      this.leaderboardContainer.add(youLabel);
    }
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  shutdown(): void {
    // Clean up keyboard listener
    this.input.keyboard?.off('keydown', this.handleKeyPress, this);
  }
}
