import type { LeaderboardEntry } from '../types';

const LEADERBOARD_KEY = 'yak_gauntlet_leaderboard';
const MAX_ENTRIES = 10;

class LeaderboardServiceClass {
  private leaderboard: LeaderboardEntry[] = [];

  constructor() {
    this.loadLeaderboard();
  }

  private loadLeaderboard(): void {
    try {
      const stored = localStorage.getItem(LEADERBOARD_KEY);
      if (stored) {
        this.leaderboard = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      this.leaderboard = [];
    }
  }

  private saveLeaderboard(): void {
    try {
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(this.leaderboard));
    } catch (error) {
      console.error('Failed to save leaderboard:', error);
    }
  }

  addEntry(entry: LeaderboardEntry): number {
    this.leaderboard.push(entry);

    // Sort by time (ascending - faster is better)
    // Wet runs go to bottom
    this.leaderboard.sort((a, b) => {
      if (a.wet && !b.wet) return 1;
      if (!a.wet && b.wet) return -1;
      return a.time_ms - b.time_ms;
    });

    // Keep only top MAX_ENTRIES
    if (this.leaderboard.length > MAX_ENTRIES) {
      this.leaderboard = this.leaderboard.slice(0, MAX_ENTRIES);
    }

    this.saveLeaderboard();

    // Return rank (1-indexed)
    const rank = this.leaderboard.findIndex(e =>
      e.username === entry.username &&
      e.time_ms === entry.time_ms &&
      e.timestamp === entry.timestamp
    ) + 1;

    return rank;
  }

  getLeaderboard(): LeaderboardEntry[] {
    return [...this.leaderboard];
  }

  getTopEntries(count: number = 10): LeaderboardEntry[] {
    return this.leaderboard.slice(0, count);
  }

  isTopScore(timeMs: number, wet: boolean): boolean {
    if (this.leaderboard.length < MAX_ENTRIES) return true;

    // If wet, check against other wet times
    if (wet) {
      const wetTimes = this.leaderboard.filter(e => e.wet);
      if (wetTimes.length === 0) return true;
      return timeMs < wetTimes[wetTimes.length - 1].time_ms;
    }

    // If not wet, check against all dry times
    const dryTimes = this.leaderboard.filter(e => !e.wet);
    if (dryTimes.length < MAX_ENTRIES) return true;
    return timeMs < dryTimes[dryTimes.length - 1].time_ms;
  }

  getRank(timeMs: number, wet: boolean): number {
    let rank = 1;
    for (const entry of this.leaderboard) {
      if (wet && !entry.wet) continue;
      if (!wet && entry.wet) break;
      if (entry.time_ms < timeMs) rank++;
      else break;
    }
    return rank;
  }

  clearLeaderboard(): void {
    this.leaderboard = [];
    this.saveLeaderboard();
  }
}

export const LeaderboardService = new LeaderboardServiceClass();
