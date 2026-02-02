import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { YAK_COLORS, YAK_FONTS, STATIONS, createStoolIcon } from '../config/theme';
import { GameStateService } from '../services/GameStateService';
import { LeaderboardService } from '../services/LeaderboardService';
import { AudioSystem } from '../utils/AudioSystem';
import { EnhancedVisuals } from '../utils/EnhancedVisuals';
import type { LeaderboardEntry, RunState, StationId } from '../types';

type ResultFlowStep = 'RESULTS' | 'INITIALS' | 'LEADERBOARD';

/**
 * Station definition from STATIONS array
 */
interface StationDef {
  readonly id: string;
  readonly name: string;
  readonly color: number;
  readonly emoji: string;
}

export class ResultScene extends Phaser.Scene {
  private initials: string[] = ['', '', ''];
  private currentInitialIndex = 0;
  private initialTexts: Phaser.GameObjects.Text[] = [];
  private initialBoxes: Phaser.GameObjects.Graphics[] = [];

  private hasSubmitted = false;
  private playerRank = 0;

  // Mobile native keyboard support
  private hiddenInput: HTMLInputElement | null = null;

  private cursorBlink: Phaser.GameObjects.Text | null = null;
  private cursorBlinkTween: Phaser.Tweens.Tween | null = null;

  // 3-screen flow
  private flowStep: ResultFlowStep = 'RESULTS';
  private resultsContainer!: Phaser.GameObjects.Container;
  private initialsContainer!: Phaser.GameObjects.Container;
  private leaderboardStepContainer!: Phaser.GameObjects.Container;

  // Leaderboard display container (created/destroyed per show)
  private leaderboardContainer: Phaser.GameObjects.Container | null = null;

  // Track initials-screen UI elements for cleanup/fade
  private initialsUiElements: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super({ key: 'ResultScene' });
  }

  create(): void {
    this.resetLocalState();

    // Initialize audio system
    AudioSystem.init();

    const state = GameStateService.getState();
    if (!state) {
      console.warn('No game state available, returning to boot scene');
      this.scene.start('BootScene');
      return;
    }

    const finalTimeMs = GameStateService.getFinalTimeMs();
    const isWet = finalTimeMs > 75000;

    // Play entrance sound
    AudioSystem.playBeep(1.2);
    this.time.delayedCall(150, () => AudioSystem.playBeep(1.5));

    // Celebration if dry run
    if (!isWet) {
      this.time.delayedCall(300, () => {
        EnhancedVisuals.celebrateVictory(this);
        AudioSystem.playSuccess();
        AudioSystem.playCrowdCheer();
      });
    }

    this.createBackground();

    // Build step containers
    this.resultsContainer = this.add.container(0, 0);
    this.initialsContainer = this.add.container(0, 0).setVisible(false);
    this.leaderboardStepContainer = this.add.container(0, 0).setVisible(false);

    // STEP 1
    this.buildResultsStep(state, finalTimeMs, isWet);

    // STEP 2
    this.buildInitialsStep(finalTimeMs, isWet);

    // STEP 3
    this.buildLeaderboardStep();

    this.setFlowStep('RESULTS');
  }

  // ---------- FLOW CONTROL ----------

  private setFlowStep(step: ResultFlowStep): void {
    this.flowStep = step;

    this.resultsContainer.setVisible(step === 'RESULTS');
    this.initialsContainer.setVisible(step === 'INITIALS');
    this.leaderboardStepContainer.setVisible(step === 'LEADERBOARD');

    // Keyboard listener only while entering initials
    this.input.keyboard?.off('keydown', this.handleKeyPress, this);
    if (step === 'INITIALS' && !this.hasSubmitted) {
      this.input.keyboard?.on('keydown', this.handleKeyPress, this);
      this.focusHiddenInput();
    } else {
      // avoid leaving mobile keyboard up
      this.hiddenInput?.blur?.();
    }

    // Cursor visibility
    if (this.cursorBlink) {
      const showCursor = step === 'INITIALS' && this.currentInitialIndex < 3 && !this.hasSubmitted;
      this.cursorBlink.setVisible(showCursor);
    }
  }

  private transitionToInitials(): void {
    this.setFlowStep('INITIALS');
    // Ensure boxes/cursor in correct place immediately
    this.updateBoxHighlights();
    this.updateCursorPosition();
    this.focusHiddenInput();
  }

  private transitionToLeaderboard(): void {
    this.setFlowStep('LEADERBOARD');
    this.showLeaderboardOnly();
  }

  // ---------- STEP 1: RESULTS ----------

  private buildResultsStep(state: RunState, finalTimeMs: number, isWet: boolean): void {
    // Header + time, reusing your existing visuals (but scoped to the results screen)
    this.createHeaderInto(this.resultsContainer, isWet);
    this.createTimeDisplayInto(this.resultsContainer, finalTimeMs, isWet);
    this.createStationBreakdownInto(this.resultsContainer, state);
    this.createNextButtonInto(this.resultsContainer);
  }

  private createHeaderInto(container: Phaser.GameObjects.Container, isWet: boolean): void {
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
        fill: true,
      },
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: header,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: header,
          scale: 1.05,
          duration: 1000,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      },
    });

    const line = this.add.graphics();
    line.lineStyle(4, isWet ? YAK_COLORS.danger : YAK_COLORS.secondary, 1);
    line.moveTo(GAME_WIDTH / 2 - 180, 105);
    line.lineTo(GAME_WIDTH / 2 + 180, 105);
    line.strokePath();

    const leftStool = createStoolIcon(this, 40, 55, 1.3);
    const rightStool = createStoolIcon(this, GAME_WIDTH - 40, 55, 1.3);
    leftStool.setAngle(-10).setAlpha(0.7);
    rightStool.setAngle(10).setAlpha(0.7);

    container.add([header, line, leftStool, rightStool]);
  }

  private createTimeDisplayInto(container: Phaser.GameObjects.Container, finalTimeMs: number, isWet: boolean): void {
    const timeSeconds = (finalTimeMs / 1000).toFixed(2);
    // Use proportional positioning for responsive layout
    const containerY = GAME_HEIGHT * 0.23;

    const panel = this.add.graphics();
    panel.fillStyle(0x000000, 0.6);
    panel.fillRoundedRect(GAME_WIDTH / 2 - 150, containerY - 65, 300, 130, 18);
    panel.lineStyle(4, isWet ? YAK_COLORS.danger : YAK_COLORS.secondary, 1);
    panel.strokeRoundedRect(GAME_WIDTH / 2 - 150, containerY - 65, 300, 130, 18);

    const glow = this.add.graphics();
    glow.lineStyle(2, isWet ? YAK_COLORS.danger : YAK_COLORS.secondary, 0.3);
    glow.strokeRoundedRect(GAME_WIDTH / 2 - 158, containerY - 73, 316, 146, 22);

    this.tweens.add({
      targets: glow,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

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
        fill: true,
      },
    }).setOrigin(0.5).setScale(0);

    this.tweens.add({
      targets: timeText,
      scale: 1,
      duration: 700,
      delay: 400,
      ease: 'Elastic.easeOut',
    });

    const secondsLabel = this.add.text(GAME_WIDTH / 2, containerY + 50, 'seconds', {
      fontFamily: YAK_FONTS.body,
      fontSize: '20px',
      color: '#cbd5e1',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    container.add([panel, glow, timeText, secondsLabel]);

    if (isWet) {
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

      this.time.delayedCall(800, () => {
        this.cameras.main.shake(100, 0.008);
      });

      container.add(stamp);
    }
  }

  /**
   * Creates a single station row in the breakdown display
   */
  private createStationRow(
    container: Phaser.GameObjects.Container,
    station: StationDef,
    misses: number,
    y: number,
    index: number
  ): void {
    // Row background
    const rowBg = this.add.graphics();
    rowBg.fillStyle(0x000000, 0.4);
    rowBg.fillRoundedRect(25, y - 18, GAME_WIDTH - 50, 40, 8);
    rowBg.lineStyle(1, station.color, 0.3);
    rowBg.strokeRoundedRect(25, y - 18, GAME_WIDTH - 50, 40, 8);

    rowBg.setAlpha(0);
    this.tweens.add({
      targets: rowBg,
      alpha: 1,
      duration: 300,
      delay: 500 + index * 80,
      ease: 'Power2',
    });

    // Station color indicator
    const colorCircle = this.add.circle(48, y, 14, station.color, 0.9);
    colorCircle.setStrokeStyle(2, 0xffffff, 0.6);

    // Station emoji
    const emoji = this.add.text(48, y, station.emoji, { fontSize: '18px' }).setOrigin(0.5);

    // Station name
    const nameText = this.add.text(75, y, station.name, {
      fontFamily: YAK_FONTS.title,
      fontSize: '15px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0, 0.5);

    // Checkmark
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
      ease: 'Back.easeOut',
    });

    // Miss count
    const missColor = misses === 0 ? YAK_COLORS.textGreen : misses <= 2 ? YAK_COLORS.textGold : YAK_COLORS.textRed;
    const missText = this.add.text(GAME_WIDTH - 55, y, `${misses} miss${misses !== 1 ? 'es' : ''}`, {
      fontFamily: YAK_FONTS.body,
      fontSize: '13px',
      color: missColor,
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    container.add([rowBg, colorCircle, emoji, nameText, check, missText]);
  }

  private createStationBreakdownInto(container: Phaser.GameObjects.Container, state: RunState): void {
    // Use proportional positioning for responsive layout
    const startY = GAME_HEIGHT * 0.42;

    const titleText = this.add.text(GAME_WIDTH / 2, startY, 'STATION BREAKDOWN', {
      fontFamily: YAK_FONTS.title,
      fontSize: '20px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // IMPORTANT: match GameStateService station list (6 stations; no quiz)
    const completedStations: StationId[] = [
      'cornhole',
      'goalie',
      'wiffle',
      'football',
      'corner3_right',
      'corner3_left',
    ];

    container.add(titleText);

    completedStations.forEach((stationId, index) => {
      const station = STATIONS.find(s => s.id === stationId);
      if (!station) return;

      const y = startY + 40 + index * 48;
      const misses = state.missCountByStation[stationId] || 0;

      this.createStationRow(container, station, misses, y, index);
    });

    const totalMisses = (Object.values(state.missCountByStation) as number[]).reduce((a, b) => a + b, 0);
    const totalY = startY + 40 + completedStations.length * 48 + 10;

    const totalBg = this.add.graphics();
    totalBg.fillStyle(totalMisses === 0 ? YAK_COLORS.success : YAK_COLORS.bgDark, 0.6);
    totalBg.fillRoundedRect(GAME_WIDTH / 2 - 90, totalY - 15, 180, 30, 8);
    totalBg.lineStyle(2, totalMisses === 0 ? YAK_COLORS.successBright : YAK_COLORS.secondary, 0.8);
    totalBg.strokeRoundedRect(GAME_WIDTH / 2 - 90, totalY - 15, 180, 30, 8);

    const totalText = this.add.text(GAME_WIDTH / 2, totalY, `Total Misses: ${totalMisses}`, {
      fontFamily: YAK_FONTS.title,
      fontSize: '16px',
      color: totalMisses === 0 ? YAK_COLORS.textGreen : YAK_COLORS.textOrange,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const completeY = totalY + 40;
    const completeText = this.add.text(GAME_WIDTH / 2, completeY, 'FULL GAUNTLET COMPLETE!', {
      fontFamily: YAK_FONTS.title,
      fontSize: '16px',
      color: YAK_COLORS.textGold,
    }).setOrigin(0.5);

    container.add([totalBg, totalText, completeText]);
  }

  private createNextButtonInto(container: Phaser.GameObjects.Container): void {
    // Use proportional positioning for responsive layout
    const btnY = GAME_HEIGHT * 0.89;

    const outerGlow = this.add.graphics();
    outerGlow.fillStyle(YAK_COLORS.primary, 0.2);
    outerGlow.fillRoundedRect(GAME_WIDTH / 2 - 155, btnY - 32, 310, 64, 14);

    const btnBg = this.add.graphics();
    btnBg.fillStyle(YAK_COLORS.primary, 1);
    btnBg.fillRoundedRect(GAME_WIDTH / 2 - 145, btnY - 28, 290, 56, 12);
    btnBg.lineStyle(4, YAK_COLORS.secondary, 1);
    btnBg.strokeRoundedRect(GAME_WIDTH / 2 - 145, btnY - 28, 290, 56, 12);

    const highlight = this.add.graphics();
    highlight.fillStyle(0xffffff, 0.15);
    highlight.fillRoundedRect(GAME_WIDTH / 2 - 140, btnY - 23, 280, 6, 10);

    const btnText = this.add.text(GAME_WIDTH / 2, btnY, 'NEXT: ENTER INITIALS', {
      fontFamily: YAK_FONTS.title,
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const hitArea = this.add.rectangle(GAME_WIDTH / 2, btnY, 290, 56, 0x000000, 0);
    hitArea.setInteractive({ useHandCursor: true });

    hitArea.on('pointerover', () => {
      this.tweens.add({
        targets: [btnBg, btnText, highlight],
        scaleX: 1.06,
        scaleY: 1.06,
        duration: 150,
        ease: 'Back.easeOut',
      });
    });

    hitArea.on('pointerout', () => {
      this.tweens.add({
        targets: [btnBg, btnText, highlight],
        scaleX: 1,
        scaleY: 1,
        duration: 150,
      });
    });

    hitArea.on('pointerdown', () => {
      AudioSystem.playClick();
      this.cameras.main.flash(180, 255, 200, 80);
      EnhancedVisuals.screenShake(this, 0.01, 100);
      this.transitionToInitials();
    });

    container.add([outerGlow, btnBg, highlight, btnText, hitArea]);
  }

  // ---------- STEP 2: INITIALS ----------

  private buildInitialsStep(finalTimeMs: number, isWet: boolean): void {
    // Use proportional positioning for responsive layout
    const sectionY = GAME_HEIGHT * 0.21;

    const title = this.add.text(GAME_WIDTH / 2, 75, 'ENTER INITIALS', {
      fontFamily: YAK_FONTS.title,
      fontSize: '38px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const timeSeconds = (finalTimeMs / 1000).toFixed(2);
    const timeText = this.add.text(GAME_WIDTH / 2, 120, `${timeSeconds}s`, {
      fontFamily: YAK_FONTS.title,
      fontSize: '46px',
      color: isWet ? YAK_COLORS.textRed : YAK_COLORS.textGreen,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const sectionBg = this.add.graphics();
    sectionBg.fillStyle(YAK_COLORS.bgDark, 0.95);
    sectionBg.fillRoundedRect(20, sectionY, GAME_WIDTH - 40, 210, 14);
    sectionBg.lineStyle(3, YAK_COLORS.secondary, 0.9);
    sectionBg.strokeRoundedRect(20, sectionY, GAME_WIDTH - 40, 210, 14);

    const instructionsText = this.add.text(GAME_WIDTH / 2, sectionY + 30, 'Tap and type 3 letters', {
      fontFamily: YAK_FONTS.body,
      fontSize: '16px',
      color: '#e2e8f0',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    // Input boxes
    const inputY = sectionY + 100;
    const boxSpacing = 60;
    const startX = GAME_WIDTH / 2 - boxSpacing;

    // reset per-entry screen state
    this.initials = ['', '', ''];
    this.currentInitialIndex = 0;
    this.initialTexts = [];
    this.initialBoxes = [];
    this.initialsUiElements = [];
    this.hasSubmitted = false;
    this.playerRank = 0;

    for (let i = 0; i < 3; i++) {
      const x = startX + i * boxSpacing;

      const box = this.add.graphics();
      box.fillStyle(YAK_COLORS.bgMedium, 1);
      box.fillRoundedRect(x - 26, inputY - 28, 52, 64, 12);
      box.lineStyle(3, i === 0 ? YAK_COLORS.primary : YAK_COLORS.navy, i === 0 ? 1 : 0.5);
      box.strokeRoundedRect(x - 26, inputY - 28, 52, 64, 12);

      const initialText = this.add.text(x, inputY + 4, '_', {
        fontFamily: YAK_FONTS.mono,
        fontSize: '42px',
        color: '#94a3b8',
      }).setOrigin(0.5);

      const boxHitArea = this.add.rectangle(x, inputY + 4, 60, 72, 0x000000, 0);
      boxHitArea.setInteractive({ useHandCursor: true });
      boxHitArea.on('pointerdown', () => this.focusHiddenInput());

      this.initialBoxes.push(box);
      this.initialTexts.push(initialText);

      this.initialsUiElements.push(box, initialText, boxHitArea);
      this.initialsContainer.add([box, initialText, boxHitArea]);
    }

    // Cursor
    this.cursorBlink = this.add.text(startX, inputY + 4, '|', {
      fontFamily: YAK_FONTS.mono,
      fontSize: '44px',
      color: YAK_COLORS.textGold,
    }).setOrigin(0.5);

    this.cursorBlinkTween?.stop();
    this.cursorBlinkTween = this.tweens.add({
      targets: this.cursorBlink,
      alpha: 0,
      duration: 530,
      yoyo: true,
      repeat: -1,
    });

    const hintText = this.add.text(GAME_WIDTH / 2, sectionY + 165, 'Auto-submits after 3 letters', {
      fontFamily: YAK_FONTS.body,
      fontSize: '13px',
      color: '#94a3b8',
      stroke: '#000000',
      strokeThickness: 2,
    }).setOrigin(0.5);

    const submitBtn = this.createPrimaryButton(GAME_WIDTH / 2, GAME_HEIGHT - 130, 'SUBMIT', () => {
      if (this.currentInitialIndex === 3) this.submitScore();
    });

    const skipBtn = this.createSecondaryButton(GAME_WIDTH / 2, GAME_HEIGHT - 70, 'SKIP (NO SCORE)', () => {
      this.playerRank = 0;
      this.transitionToLeaderboard();
    });

    this.initialsUiElements.push(title, timeText, sectionBg, instructionsText, hintText, submitBtn, skipBtn, this.cursorBlink);

    this.initialsContainer.add([
      title,
      timeText,
      sectionBg,
      instructionsText,
      hintText,
      this.cursorBlink,
      submitBtn,
      skipBtn,
    ]);

    // Hidden input for mobile keyboard
    this.createHiddenInput();
    this.updateBoxHighlights();
    this.updateCursorPosition();
  }

  private createPrimaryButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(YAK_COLORS.primary, 1);
    bg.fillRoundedRect(-150, -28, 300, 56, 12);
    bg.lineStyle(4, YAK_COLORS.secondary, 1);
    bg.strokeRoundedRect(-150, -28, 300, 56, 12);

    const txt = this.add.text(0, 0, label, {
      fontFamily: YAK_FONTS.title,
      fontSize: '22px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const hit = this.add.rectangle(0, 0, 300, 56, 0x000000, 0);
    hit.setInteractive({ useHandCursor: true });

    hit.on('pointerdown', () => {
      AudioSystem.playClick();
      EnhancedVisuals.screenShake(this, 0.01, 100);
      this.cameras.main.flash(120, 255, 200, 80);
      onClick();
    });
    hit.on('pointerover', () => btn.setScale(1.04));
    hit.on('pointerout', () => btn.setScale(1));

    btn.add([bg, txt, hit]);
    return btn;
  }

  private createSecondaryButton(x: number, y: number, label: string, onClick: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.35);
    bg.fillRoundedRect(-150, -22, 300, 44, 10);
    bg.lineStyle(2, YAK_COLORS.secondary, 0.8);
    bg.strokeRoundedRect(-150, -22, 300, 44, 10);

    const txt = this.add.text(0, 0, label, {
      fontFamily: YAK_FONTS.title,
      fontSize: '16px',
      color: '#e2e8f0',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    const hit = this.add.rectangle(0, 0, 300, 44, 0x000000, 0);
    hit.setInteractive({ useHandCursor: true });

    hit.on('pointerdown', () => {
      AudioSystem.playClick();
      onClick();
    });
    hit.on('pointerover', () => btn.setScale(1.03));
    hit.on('pointerout', () => btn.setScale(1));

    btn.add([bg, txt, hit]);
    return btn;
  }

  // ---------- STEP 3: LEADERBOARD ----------

  private buildLeaderboardStep(): void {
    const title = this.add.text(GAME_WIDTH / 2, 75, 'LEADERBOARD', {
      fontFamily: YAK_FONTS.title,
      fontSize: '40px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 6,
    }).setOrigin(0.5);

    const backBtn = this.createPrimaryButton(GAME_WIDTH / 2, GAME_HEIGHT - 90, 'BACK TO STUDIO', () => {
      this.cleanupHiddenInput();
      this.reset();
      this.scene.start('BootScene');
    });

    this.leaderboardStepContainer.add([title, backBtn]);
  }

  private showLeaderboardOnly(): void {
    // destroy previous display
    if (this.leaderboardContainer) {
      this.leaderboardContainer.destroy(true);
      this.leaderboardContainer = null;
    }

    this.leaderboardContainer = this.add.container(0, 0);
    // safe vertical positioning for title + list + back button on 800-ish height
    this.createLeaderboardDisplayInto(this.leaderboardContainer, 130);
    this.leaderboardStepContainer.add(this.leaderboardContainer);
  }

  /**
   * Creates a single leaderboard entry row
   */
  private createLeaderboardEntry(
    container: Phaser.GameObjects.Container,
    entry: LeaderboardEntry,
    index: number,
    isPlayer: boolean,
    startY: number
  ): void {
    const y = startY + 40 + index * 34;

    // Alternating row background
    const rowBg = this.add.graphics();
    if (index % 2 === 0) {
      rowBg.fillStyle(0x000000, 0.15);
      rowBg.fillRoundedRect(30, y - 14, GAME_WIDTH - 60, 30, 5);
    }
    container.add(rowBg);

    // Player highlight
    if (isPlayer) {
      const highlight = this.add.graphics();
      highlight.fillStyle(YAK_COLORS.primary, 0.25);
      highlight.fillRoundedRect(30, y - 14, GAME_WIDTH - 60, 30, 5);
      highlight.lineStyle(2, YAK_COLORS.secondary, 0.9);
      highlight.strokeRoundedRect(30, y - 14, GAME_WIDTH - 60, 30, 5);
      container.add(highlight);
    }

    // Rank (with medal emoji for top 3)
    let rankText = `${index + 1}`;
    if (index === 0) rankText = '🥇';
    else if (index === 1) rankText = '🥈';
    else if (index === 2) rankText = '🥉';

    const rank = this.add.text(55, y, rankText, {
      fontFamily: YAK_FONTS.title,
      fontSize: '16px',
      color: '#cbd5e1',
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

    // Fade in animation
    const allElements = [rowBg, rank, name, time, status];
    allElements.forEach(el => {
      el.setAlpha(0);
      this.tweens.add({
        targets: el,
        alpha: 1,
        duration: 250,
        delay: 80 + index * 60,
        ease: 'Power2',
      });
    });

    container.add([rank, name, time, status]);

    // "YOU" label for player's entry
    if (isPlayer) {
      const youLabel = this.add.text(GAME_WIDTH - 80, y, '← YOU', {
        fontFamily: YAK_FONTS.title,
        fontSize: '12px',
        color: YAK_COLORS.textOrange,
        stroke: '#000000',
        strokeThickness: 2,
      }).setOrigin(0, 0.5).setAlpha(0);

      this.tweens.add({
        targets: youLabel,
        alpha: 1,
        scale: 1.1,
        duration: 350,
        delay: 120 + index * 60,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.tweens.add({
            targets: youLabel,
            scale: 1,
            duration: 300,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
          });
        },
      });

      container.add(youLabel);
    }
  }

  private createLeaderboardDisplayInto(container: Phaser.GameObjects.Container, startY: number): void {
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

      container.add(noScores);
      return;
    }

    const title = this.add.text(GAME_WIDTH / 2, startY - 15, 'TOP SCORES', {
      fontFamily: YAK_FONTS.title,
      fontSize: '18px',
      color: YAK_COLORS.textGold,
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5);

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

    container.add([title, header]);

    headerText.forEach(({ text, x }) => {
      const label = this.add.text(x, startY + 12, text, {
        fontFamily: YAK_FONTS.title,
        fontSize: '12px',
        color: YAK_COLORS.textGold,
        stroke: '#000000',
        strokeThickness: 2,
      });
      container.add(label);
    });

    entries.forEach((entry, index) => {
      const isPlayer = this.playerRank === index + 1 && this.playerRank > 0;
      this.createLeaderboardEntry(container, entry, index, isPlayer, startY);
    });
  }

  // ---------- INPUT HANDLING ----------

  private handleKeyPress(event: KeyboardEvent): void {
    if (this.hasSubmitted) return;
    if (this.flowStep !== 'INITIALS') return;

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

    // Play typing sound with pitch variation
    AudioSystem.playBeep(1 + this.currentInitialIndex * 0.2);

    this.initials[this.currentInitialIndex] = letter;
    this.initialTexts[this.currentInitialIndex].setText(letter);
    this.initialTexts[this.currentInitialIndex].setColor('#ffffff');

    // Visual feedback on letter entry
    this.tweens.add({
      targets: this.initialTexts[this.currentInitialIndex],
      scale: { from: 1.3, to: 1 },
      duration: 150,
      ease: 'Back.easeOut',
    });

    this.currentInitialIndex++;

    if (this.hiddenInput) this.hiddenInput.value = this.initials.join('');

    this.updateBoxHighlights();
    this.updateCursorPosition();

    if (this.currentInitialIndex === 3) {
      AudioSystem.playSuccess();
      this.time.delayedCall(250, () => this.submitScore());
    }
  }

  private handleBackspace(): void {
    if (this.currentInitialIndex <= 0) return;

    // Play backspace sound (lower pitch)
    AudioSystem.playBeep(0.7);

    this.currentInitialIndex--;
    this.initials[this.currentInitialIndex] = '';
    this.initialTexts[this.currentInitialIndex].setText('_');
    this.initialTexts[this.currentInitialIndex].setColor('#94a3b8');

    if (this.hiddenInput) this.hiddenInput.value = this.initials.join('');

    this.updateBoxHighlights();
    this.updateCursorPosition();
  }

  private updateBoxHighlights(): void {
    // uses the initials screen inputY (sectionY=170, inputY=270ish)
    const inputY = 170 + 100; // sectionY + 100
    const boxSpacing = 60;
    const startX = GAME_WIDTH / 2 - boxSpacing;

    this.initialBoxes.forEach((box, i) => {
      const x = startX + i * boxSpacing;

      box.clear();
      box.fillStyle(YAK_COLORS.bgMedium, 1);
      box.fillRoundedRect(x - 26, inputY - 28, 52, 64, 12);

      const isActive = i === this.currentInitialIndex;
      box.lineStyle(3, isActive ? YAK_COLORS.primary : YAK_COLORS.navy, isActive ? 1 : 0.5);
      box.strokeRoundedRect(x - 26, inputY - 28, 52, 64, 12);
    });
  }

  private updateCursorPosition(): void {
    if (!this.cursorBlink) return;

    if (this.currentInitialIndex >= 3 || this.hasSubmitted || this.flowStep !== 'INITIALS') {
      this.cursorBlink.setVisible(false);
      return;
    }

    const inputY = 170 + 100; // same as updateBoxHighlights
    const boxSpacing = 60;
    const startX = GAME_WIDTH / 2 - boxSpacing;

    this.cursorBlink.setPosition(startX + this.currentInitialIndex * boxSpacing, inputY + 4);
    this.cursorBlink.setVisible(true);
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

    const entry: LeaderboardEntry = {
      username,
      time_ms: finalTimeMs,
      wet: isWet,
      timestamp: Date.now(),
      device: this.isMobile() ? 'mobile' : 'desktop',
      goalie: state.goalieCharacterId,
      version: '1.0.0',
    };

    this.playerRank = LeaderboardService.addEntry(entry);

    // Cleanly switch screens (no hidden below-the-fold content)
    this.transitionToLeaderboard();

    this.cameras.main.flash(200, 34, 197, 94, false);
  }

  // ---------- HIDDEN INPUT ----------

  private createHiddenInput(): void {
    // ensure only one exists
    this.cleanupHiddenInput();

    this.hiddenInput = document.createElement('input');
    this.hiddenInput.type = 'text';
    this.hiddenInput.maxLength = 3;
    this.hiddenInput.style.position = 'absolute';
    this.hiddenInput.style.opacity = '0';
    this.hiddenInput.style.pointerEvents = 'none';
    this.hiddenInput.style.left = '-9999px';
    this.hiddenInput.autocomplete = 'off';
    this.hiddenInput.autocapitalize = 'characters';

    document.body.appendChild(this.hiddenInput);

    this.hiddenInput.addEventListener('input', (e) => {
      if (this.hasSubmitted) return;
      if (this.flowStep !== 'INITIALS') return;

      const target = e.target as HTMLInputElement;
      const value = target.value.toUpperCase();

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

      for (let i = this.currentInitialIndex; i < 3; i++) {
        this.initialTexts[i].setText('_');
        this.initialTexts[i].setColor('#94a3b8');
      }

      this.updateCursorPosition();
      this.updateBoxHighlights();

      if (this.currentInitialIndex === 3 && !this.hasSubmitted) {
        this.time.delayedCall(250, () => this.submitScore());
      }
    });

    if (this.isMobile()) {
      this.time.delayedCall(400, () => this.focusHiddenInput());
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

  // ---------- BACKGROUND ----------

  private createBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(YAK_COLORS.bgDark, YAK_COLORS.bgDark, YAK_COLORS.bgMedium, YAK_COLORS.bgMedium, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

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

  // ---------- LIFECYCLE / CLEANUP ----------

  private resetLocalState(): void {
    this.initials = ['', '', ''];
    this.currentInitialIndex = 0;
    this.initialTexts = [];
    this.initialBoxes = [];
    this.initialsUiElements = [];

    this.hasSubmitted = false;
    this.playerRank = 0;

    // don’t kill hidden input here; create() will recreate it on initials step
  }

  private reset(): void {
    this.resetLocalState();

    this.cleanupHiddenInput();

    if (this.cursorBlinkTween) {
      this.cursorBlinkTween.stop();
      this.cursorBlinkTween = null;
    }
    this.cursorBlink = null;

    this.input.keyboard?.off('keydown', this.handleKeyPress, this);

    this.tweens.killAll();
    this.time.removeAllEvents();

    if (this.leaderboardContainer) {
      this.leaderboardContainer.destroy(true);
      this.leaderboardContainer = null;
    }
  }

  shutdown(): void {
    this.cleanupHiddenInput();

    if (this.cursorBlinkTween) {
      this.cursorBlinkTween.stop();
      this.cursorBlinkTween = null;
    }
    this.cursorBlink = null;

    this.events.removeAllListeners('update');
    this.input.removeAllListeners();
    this.input.keyboard?.off('keydown', this.handleKeyPress, this);

    this.tweens.killAll();
    this.time.removeAllEvents();

    this.initialsUiElements = [];
    this.initialBoxes = [];

    if (this.leaderboardContainer) {
      this.leaderboardContainer.destroy(true);
      this.leaderboardContainer = null;
    }
  }

  private isMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
}
