import { GameStateService } from '../services/GameStateService';
import type { StationId } from '../types';

/**
 * Performance Tracking System
 * Tracks and displays player performance metrics
 */

export interface PerformanceStats {
  totalMisses: number;
  missesByStation: Record<StationId, number>;
  averageTimePerStation: number;
  currentStreak: number;
  bestStreak: number;
  perfectStations: number;
  totalStations: number;
}

export class PerformanceTracker {
  private static instance: PerformanceTracker;
  private currentStreak = 0;
  private bestStreak = 0;
  private perfectStations = 0;
  private stationStartTimes: Map<StationId, number> = new Map();
  private stationTimes: Map<StationId, number> = new Map();

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  startStation(stationId: StationId): void {
    this.stationStartTimes.set(stationId, Date.now());
  }

  completeStation(stationId: StationId, misses: number): void {
    const startTime = this.stationStartTimes.get(stationId);
    if (startTime) {
      const stationTime = Date.now() - startTime;
      this.stationTimes.set(stationId, stationTime);
      this.stationStartTimes.delete(stationId);
    }

    if (misses === 0) {
      this.currentStreak++;
      this.perfectStations++;
      if (this.currentStreak > this.bestStreak) {
        this.bestStreak = this.currentStreak;
      }
    } else {
      this.currentStreak = 0;
    }
  }

  getStats(): PerformanceStats {
    const state = GameStateService.getState();
    if (!state) {
      return this.getEmptyStats();
    }

    const totalMisses = Object.values(state.missCountByStation).reduce((a, b) => a + b, 0);
    const completedStations = Object.keys(this.stationTimes).length;
    const totalTime = Array.from(this.stationTimes.values()).reduce((a, b) => a + b, 0);
    const averageTime = completedStations > 0 ? totalTime / completedStations : 0;

    return {
      totalMisses,
      missesByStation: { ...state.missCountByStation },
      averageTimePerStation: averageTime,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      perfectStations: this.perfectStations,
      totalStations: completedStations,
    };
  }

  reset(): void {
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.perfectStations = 0;
    this.stationStartTimes.clear();
    this.stationTimes.clear();
  }

  private getEmptyStats(): PerformanceStats {
    return {
      totalMisses: 0,
      missesByStation: {} as Record<StationId, number>,
      averageTimePerStation: 0,
      currentStreak: 0,
      bestStreak: 0,
      perfectStations: 0,
      totalStations: 0,
    };
  }
}

/**
 * Creates a performance indicator display
 */
export function createPerformanceIndicator(
  scene: Phaser.Scene,
  x: number,
  y: number
): {
  container: Phaser.GameObjects.Container;
  update: () => void;
  show: () => void;
  hide: () => void;
} {
  const container = scene.add.container(x, y);
  container.setDepth(200);
  container.setVisible(false);
  container.setAlpha(0);

  // Background
  const bg = scene.add.graphics();
  bg.fillStyle(0x1a1a1a, 0.9);
  bg.fillRoundedRect(-100, -60, 200, 120, 12);
  bg.lineStyle(2, 0x4ade80, 0.8);
  bg.strokeRoundedRect(-100, -60, 200, 120, 12);
  container.add(bg);

  // Title
  const title = scene.add.text(0, -45, 'PERFORMANCE', {
    fontSize: '14px',
    fontFamily: 'Arial Black',
    color: '#4ade80',
    fontStyle: 'bold',
  }).setOrigin(0.5);
  container.add(title);

  // Stats text
  const statsText = scene.add.text(0, 0, '', {
    fontSize: '12px',
    fontFamily: 'Courier New',
    color: '#ffffff',
    align: 'center',
    lineSpacing: 4,
  }).setOrigin(0.5);
  container.add(statsText);

  const update = () => {
    const tracker = PerformanceTracker.getInstance();
    const stats = tracker.getStats();
    
    const lines = [
      `Streak: ${stats.currentStreak}`,
      `Best: ${stats.bestStreak}`,
      `Perfect: ${stats.perfectStations}/${stats.totalStations}`,
      `Misses: ${stats.totalMisses}`,
    ];
    
    statsText.setText(lines.join('\n'));
  };

  const show = () => {
    update();
    container.setVisible(true);
    scene.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 300,
      ease: 'Power2',
    });
  };

  const hide = () => {
    scene.tweens.add({
      targets: container,
      alpha: 0,
      scale: 0.9,
      duration: 200,
      onComplete: () => {
        container.setVisible(false);
      },
    });
  };

  return { container, update, show, hide };
}
